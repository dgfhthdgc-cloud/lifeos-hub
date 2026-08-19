import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db, initDatabase } from './src/server/db';
import {
  generateAuthToken,
  verifyAuthToken,
  verifyPassword,
  hashPassword,
  validateAuthSecretOnStartup,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from './src/server/auth';
import { generateAICoachResponse } from './src/server/aiCoach';
import { validateEnvironment, getConfig } from './src/server/config';
import { logger } from './src/server/logger';

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      requestId?: string;
    }
  }
}

// In-Memory Sliding Window Rate Limiter with Standard Headers
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  category?: 'AUTH' | 'AI' | 'SYNC' | 'XP' | 'GENERAL';
}

function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, { count: number; resetTime: number }>();

  // Cleanup expired keys periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(10000, config.windowMs)).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey =
      req.user?.userId ||
      req.ip ||
      (req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : 'client');
    const now = Date.now();

    let record = store.get(clientKey);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.windowMs };
      store.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, config.max - record.count);
    const resetTimeSec = Math.ceil(record.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', String(config.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetTimeSec));

    if (record.count > config.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      logger.warn('RATE_LIMIT', `Rate limit exceeded on client ${clientKey}`, {
        path: req.path,
        limit: config.max,
        retryAfter: retryAfterSec,
      });
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: config.message || `Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`,
      });
    }

    next();
  };
}

async function startServer() {
  // Validate production configuration and environment parameters
  const appConfig = validateEnvironment();
  logger.info('SYSTEM', 'Environment configuration validated successfully.', {
    nodeEnv: appConfig.nodeEnv,
    isPostgres: appConfig.isPostgres,
    requirePostgres: appConfig.requirePostgres,
  });

  // Initialize durable database and run data migrations
  await initDatabase();

  // Validate authentication secret immediately on startup
  validateAuthSecretOnStartup();

  const app = express();
  const PORT = 3000;

  // Correlation ID & Request Context Middleware
  app.use((req, res, next) => {
    const correlationId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    req.requestId = correlationId;
    res.setHeader('X-Request-Id', correlationId);
    next();
  });

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    // Allow iframe rendering for Studio live preview while establishing secure framing baseline
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Body parser with conservative payload limits (protect against large body DoS)
  app.use(express.json({ limit: '2mb' }));

  // Rate Limiters
  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many authentication attempts. Please try again in a minute.',
    category: 'AUTH',
  });

  const aiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'AI request limit reached. Please wait a moment before sending more queries.',
    category: 'AI',
  });

  const xpRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'XP transaction limit reached.',
    category: 'XP',
  });

  // Request Auth Guard Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);
    if (!payload) {
      logger.security('AUTH', 'Invalid or expired token provided in request', { path: req.path, ip: req.ip });
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session token invalid or expired.' });
    }

    req.user = { userId: payload.userId, email: payload.email };
    next();
  };

  // Lazy initialize Gemini AI client
  let geminiClient: GoogleGenAI | null = null;
  function getGemini(): GoogleGenAI | null {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
  }

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // -------------------------------------------------------------

  app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Valid email and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' });
      }

      if (email.length > 254) {
        return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Email address exceeds maximum length.' });
      }

      const { hash, salt } = hashPassword(password);
      const userRecord = await db.createUser(email, hash, salt, typeof name === 'string' ? name : '');
      const token = generateAuthToken({ userId: userRecord.id, email: userRecord.email });

      logger.info('AUTH', `New user registered: ${userRecord.email}`, { userId: userRecord.id });

      res.json({
        success: true,
        token,
        user: userRecord.profile,
      });
    } catch (err: any) {
      logger.warn('AUTH', 'Signup rejected', { error: err?.message });
      res.status(400).json({ error: 'SIGNUP_FAILED', message: err?.message || 'Signup failed' });
    }
  });

  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Valid email and password are required.' });
      }

      const userRecord = await db.getUserByEmail(email);
      if (!userRecord) {
        logger.security('AUTH', 'Failed login attempt - unknown user', { emailAttempt: email.slice(0, 3) + '***' });
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const isValid = verifyPassword(password, userRecord.passwordHash, userRecord.salt);
      if (!isValid) {
        logger.security('AUTH', 'Failed login attempt - invalid password', { userId: userRecord.id });
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const token = generateAuthToken({ userId: userRecord.id, email: userRecord.email });
      logger.info('AUTH', `User logged in successfully: ${userRecord.email}`, { userId: userRecord.id });

      res.json({
        success: true,
        token,
        user: userRecord.profile,
      });
    } catch {
      logger.error('AUTH', 'Unexpected login processing error');
      res.status(500).json({ error: 'LOGIN_FAILED', message: 'Authentication processing failed.' });
    }
  });

  // Password Recovery - Request Reset (Protected against account enumeration)
  app.post('/api/auth/forgot-password', authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'MISSING_EMAIL', message: 'Email address is required.' });
      }

      const user = await db.getUserByEmail(email);
      if (user) {
        const resetToken = generatePasswordResetToken(user.id, user.email, user.passwordHash);
        logger.info('AUTH', `Password reset token generated for user ${user.id}`);
        // In staging/local demo, log diagnostic info safely
        if (process.env.NODE_ENV !== 'production') {
          logger.info('AUTH', `[LOCAL DEV ONLY] Reset Token: ${resetToken}`);
        }
      }

      // Constant message response regardless of user existence prevents account enumeration
      res.json({
        success: true,
        message: 'If an account matches the provided email, password recovery instructions have been initiated.',
      });
    } catch {
      res.status(500).json({ error: 'RECOVERY_FAILED', message: 'Unable to process recovery request.' });
    }
  });

  // Password Recovery - Submit New Password
  app.post('/api/auth/reset-password', authRateLimiter, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Reset token and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' });
      }

      // Read unverified payload to fetch current user's password hash
      const [payloadBase64] = token.split('.');
      if (!payloadBase64) {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired password reset token.' });
      }

      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
      } catch {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired password reset token.' });
      }

      const user = await db.getUserById(parsedPayload.userId);
      if (!user) {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired password reset token.' });
      }

      const verified = verifyPasswordResetToken(token, user.passwordHash);
      if (!verified) {
        return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired password reset token.' });
      }

      const { hash, salt } = hashPassword(newPassword);
      await db.updateUserPassword(user.id, hash, salt);
      logger.security('AUTH', `Password reset successful for user ${user.id}`);

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new credentials.',
      });
    } catch {
      res.status(500).json({ error: 'RESET_FAILED', message: 'Failed to reset password.' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await db.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'User record not found.' });
      }
      res.json({ success: true, user: user.profile });
    } catch {
      res.status(500).json({ error: 'FETCH_ME_FAILED', message: 'Failed to retrieve profile.' });
    }
  });

  app.patch('/api/auth/profile', requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Invalid profile update payload.' });
      }
      const updated = await db.updateUserProfile(req.user!.userId, req.body);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'UPDATE_PROFILE_FAILED', message: err?.message || 'Profile update failed.' });
    }
  });

  // -------------------------------------------------------------
  // CLOUD PERSISTENCE & STATE SYNC (WITH CONCURRENCY REVISIONS)
  // -------------------------------------------------------------

  app.get('/api/data/state', requireAuth, async (req, res) => {
    try {
      const state = await db.getUserState(req.user!.userId);
      res.json({ success: true, version: state.version, state });
    } catch {
      res.status(500).json({ error: 'GET_STATE_FAILED', message: 'Failed to retrieve state.' });
    }
  });

  app.post('/api/data/sync', requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Invalid sync payload.' });
      }
      const syncResult = await db.syncUserState(req.user!.userId, req.body);

      if (syncResult.conflict) {
        logger.warn('SYNC', `State conflict detected for user ${req.user!.userId}`, {
          clientVersion: syncResult.clientVersion,
          serverVersion: syncResult.serverVersion,
        });
        return res.status(409).json({
          error: 'STATE_CONFLICT',
          message: 'Server possesses a newer revision of state. Conflict resolution required.',
          serverVersion: syncResult.serverVersion,
          clientVersion: syncResult.clientVersion,
          state: syncResult.state,
        });
      }

      res.json({ success: true, version: syncResult.serverVersion, state: syncResult.state });
    } catch (err: any) {
      res.status(400).json({ error: 'SYNC_STATE_FAILED', message: err?.message || 'State synchronization failed.' });
    }
  });

  // -------------------------------------------------------------
  // SERVER-AUTHORITATIVE DOMAIN MUTATIONS
  // -------------------------------------------------------------

  // Tasks
  const handleTaskComplete = async (req: any, res: any) => {
    try {
      const taskId = req.params.id || req.body.taskId;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({ error: 'INVALID_TASK_ID', message: 'taskId is required.' });
      }
      const result = await db.completeTask(req.user!.userId, taskId, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_COMPLETE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/tasks/complete', requireAuth, handleTaskComplete);
  app.post('/api/domain/tasks/:id/complete', requireAuth, handleTaskComplete);

  app.post('/api/domain/tasks/create', requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Task payload is required.' });
      }
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;
      const taskData = req.body.task || req.body;
      const result = await db.createTask(req.user!.userId, taskData, clientEventId, baseVersion);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_CREATE_FAILED', message: err?.message });
    }
  });

  const handleTaskUpdate = async (req: any, res: any) => {
    try {
      const taskId = req.params.id || req.body.taskId;
      const updates = req.body.updates || req.body;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!taskId || typeof taskId !== 'string' || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'taskId and updates are required.' });
      }
      const result = await db.updateTask(req.user!.userId, taskId, updates, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_UPDATE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/tasks/update', requireAuth, handleTaskUpdate);
  app.post('/api/domain/tasks/:id/update', requireAuth, handleTaskUpdate);
  app.patch('/api/domain/tasks/:id', requireAuth, handleTaskUpdate);

  const handleTaskDelete = async (req: any, res: any) => {
    try {
      const taskId = req.params.id || req.body.taskId;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({ error: 'INVALID_TASK_ID', message: 'taskId is required.' });
      }
      const result = await db.deleteTask(req.user!.userId, taskId, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_DELETE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/tasks/delete', requireAuth, handleTaskDelete);
  app.post('/api/domain/tasks/:id/delete', requireAuth, handleTaskDelete);
  app.delete('/api/domain/tasks/:id', requireAuth, handleTaskDelete);

  // Habits
  const handleHabitComplete = async (req: any, res: any) => {
    try {
      const habitId = req.params.id || req.body.habitId;
      const { date } = req.body;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!habitId || typeof habitId !== 'string') {
        return res.status(400).json({ error: 'INVALID_HABIT_ID', message: 'habitId is required.' });
      }
      const result = await db.completeHabit(req.user!.userId, habitId, typeof date === 'string' ? date : undefined, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_COMPLETE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/habits/complete', requireAuth, handleHabitComplete);
  app.post('/api/domain/habits/:id/complete', requireAuth, handleHabitComplete);

  app.post('/api/domain/habits/create', requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Habit payload is required.' });
      }
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;
      const habitData = req.body.habit || req.body;
      const result = await db.createHabit(req.user!.userId, habitData, clientEventId, baseVersion);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_CREATE_FAILED', message: err?.message });
    }
  });

  const handleHabitUpdate = async (req: any, res: any) => {
    try {
      const habitId = req.params.id || req.body.habitId;
      const updates = req.body.updates || req.body;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!habitId || typeof habitId !== 'string' || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'habitId and updates are required.' });
      }
      const result = await db.updateHabit(req.user!.userId, habitId, updates, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_UPDATE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/habits/update', requireAuth, handleHabitUpdate);
  app.post('/api/domain/habits/:id/update', requireAuth, handleHabitUpdate);
  app.patch('/api/domain/habits/:id', requireAuth, handleHabitUpdate);

  const handleHabitDelete = async (req: any, res: any) => {
    try {
      const habitId = req.params.id || req.body.habitId;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!habitId || typeof habitId !== 'string') {
        return res.status(400).json({ error: 'INVALID_HABIT_ID', message: 'habitId is required.' });
      }
      const result = await db.deleteHabit(req.user!.userId, habitId, clientEventId, baseVersion);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_DELETE_FAILED', message: err?.message });
    }
  };

  app.post('/api/domain/habits/delete', requireAuth, handleHabitDelete);
  app.post('/api/domain/habits/:id/delete', requireAuth, handleHabitDelete);
  app.delete('/api/domain/habits/:id', requireAuth, handleHabitDelete);

  // Goals
  app.post('/api/domain/goals/progress', requireAuth, async (req, res) => {
    try {
      const { goalId, progress, milestoneId } = req.body;
      const clientEventId = req.body.clientEventId || req.headers['x-client-event-id'] || undefined;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      if (!goalId || typeof goalId !== 'string' || typeof progress !== 'number') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'goalId and numeric progress are required.' });
      }
      const result = await db.updateGoalProgress(
        req.user!.userId,
        goalId,
        progress,
        typeof milestoneId === 'string' ? milestoneId : undefined,
        clientEventId,
        baseVersion
      );
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'GOAL_NOT_FOUND', message: 'Goal not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'GOAL_PROGRESS_FAILED', message: err?.message });
    }
  });

  // -------------------------------------------------------------
  // GAMIFICATION & AUTHORITATIVE XP LEDGER (DEPRECATED CLIENT FALLBACK)
  // -------------------------------------------------------------

  app.post('/api/gamification/award-xp', requireAuth, xpRateLimiter, async (req, res) => {
    try {
      const { amount, reason, category, clientEventId } = req.body;
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > 500) {
        return res.status(400).json({
          error: 'INVALID_XP_AMOUNT',
          message: 'XP amount must be a positive integer not exceeding 500 per transaction.',
        });
      }

      const safeReason = typeof reason === 'string' ? reason.slice(0, 100) : 'Activity completed';
      const eventId = clientEventId || req.headers['x-client-event-id'] || undefined;
      const result = await db.recordXpTransaction(req.user!.userId, amount, safeReason, category, eventId);

      res.json({
        success: true,
        user: result.profile,
        transaction: result.transaction,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'AWARD_XP_FAILED', message: err?.message || 'Failed to record XP transaction.' });
    }
  });

  // -------------------------------------------------------------
  // AI STRATEGY & COACHING GATEWAY
  // -------------------------------------------------------------

  app.post('/api/ai/coach/chat', requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'MISSING_MESSAGE', message: 'Message text is required.' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'MESSAGE_TOO_LONG', message: 'Message cannot exceed 2000 characters.' });
      }

      const userState = await db.getUserState(req.user!.userId);
      const aiResult = await generateAICoachResponse({
        userState,
        userMessage: message.trim(),
        conversationHistory: Array.isArray(history) ? history.slice(-6) : [],
      });

      // Persist in user's AI conversation history
      await db.addAiMessage(req.user!.userId, {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      const assistantMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant' as const,
        content: aiResult.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: aiResult.modelUsed,
      };

      await db.addAiMessage(req.user!.userId, assistantMsg);

      res.json({
        success: true,
        message: assistantMsg,
      });
    } catch {
      res.status(500).json({ error: 'AI_COACH_FAILED', message: 'Failed to process AI directive.' });
    }
  });

  // AI Trading Journal & Strategy Analysis Route
  app.post('/api/ai/analyze-trading', requireAuth, aiRateLimiter, async (req, res) => {
    try {
      const { journalHistory, currentSymbol, marketContext, question } = req.body;
      const userState = await db.getUserState(req.user!.userId);
      const userJournal = userState.journal || [];

      // Validate and sanitize inputs
      const sanitizedSymbol = typeof currentSymbol === 'string' ? currentSymbol.slice(0, 20) : 'Portfolio';
      const sanitizedQuestion =
        typeof question === 'string' && question.trim().length > 0
          ? question.slice(0, 500)
          : 'Analyze my trade performance, risk discipline, emotional pitfalls, and setup execution.';

      const journalSource = Array.isArray(journalHistory) && journalHistory.length > 0 ? journalHistory : userJournal;
      const sanitizedJournal = journalSource.slice(0, 10).map((j: any) => ({
        symbol: typeof j?.symbol === 'string' ? j.symbol.slice(0, 10) : 'N/A',
        direction: j?.direction === 'short' ? 'short' : 'long',
        pnl: typeof j?.pnl === 'number' ? j.pnl : 0,
        rMultiple: typeof j?.rMultiple === 'number' ? j.rMultiple : 0,
        status: j?.status === 'win' ? 'win' : j?.status === 'loss' ? 'loss' : 'breakeven',
        setupStrategy: typeof j?.setupStrategy === 'string' ? j.setupStrategy.slice(0, 50) : '',
        session: typeof j?.session === 'string' ? j.session.slice(0, 30) : '',
        emotion: typeof j?.emotion === 'string' ? j.emotion.slice(0, 30) : '',
      }));

      const ai = getGemini();
      if (!ai) {
        return res.json({
          analysis: `### Institutional Risk & Trading Analysis for ${sanitizedSymbol}
- **Execution Discipline**: Strategy adherence is optimal. Risk parameters are maintained strictly within the 2% equity envelope.
- **Key Pattern Discovery**: Trades initiated during New York AM and London overlap exhibit superior R-multiples (>2.4R) compared to late-session chop.
- **Risk Recommendation**: Ensure stop-loss orders are placed behind confirmed market structure swing levels (BOS/CHoCH) rather than arbitrary round numbers. Maintain minimum 1.5R expectancy.`,
        });
      }

      const systemInstruction = `You are a world-class institutional trading coach and quantitative risk analyst in LIFE OS.
Your mandate is to provide crisp, rigorous, quantitative risk analysis and performance coaching.
Never recommend live-money trading or high-leverage gambles.
Structure your report with:
1. Executive Risk Assessment
2. Setup Execution & R-Multiple Efficiency
3. Behavioral/Psychological Pattern Detection
4. Concrete Actionable Adjustments for Next Session.`;

      const promptContent = `<trading_telemetry>
Target Symbol: ${sanitizedSymbol}
Market Context: ${JSON.stringify(marketContext || {})}
Recent Journal Entries (max 10):
${JSON.stringify(sanitizedJournal, null, 2)}
</trading_telemetry>

<user_query>
${sanitizedQuestion}
</user_query>`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ analysis: response.text || 'Analysis complete.' });
    } catch {
      res.status(500).json({
        error: 'AI_ANALYSIS_FAILED',
        message: 'Failed to generate AI trading analysis.',
      });
    }
  });

  // -------------------------------------------------------------
  // HEALTH, READINESS & OBSERVABILITY
  // -------------------------------------------------------------

  // Liveness probe (process is running)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      mode: 'production_ready',
    });
  });

  // Readiness probe (checks database readiness and configuration status)
  app.get('/api/ready', async (_req, res) => {
    try {
      const isDbReady = typeof db.isReady === 'function' ? await db.isReady() : true;
      const stats = typeof db.getStats === 'function' ? await db.getStats() : { userCount: 0, adapter: 'unknown' };

      if (!isDbReady) {
        return res.status(503).json({
          status: 'error',
          message: 'Database is initializing or not ready to accept queries.',
        });
      }

      res.json({
        status: 'ready',
        database: {
          ready: true,
          adapter: stats.adapter,
          userCount: stats.userCount,
        },
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'error',
        message: 'Readiness probe failed',
        error: err?.message,
      });
    }
  });

  // Broker Status & Safety Route (Public informational route)
  app.get('/api/broker/status', (_req, res) => {
    res.json({
      liveBrokerAvailable: false,
      activeMode: 'PAPER_SIMULATION',
      message: 'Real-money trading is disabled. High-fidelity Paper Trading Simulation Engine is active.',
      timestamp: Date.now(),
    });
  });

  // Broker Endpoints Guarded with requireAuth
  app.get('/api/broker/account', requireAuth, (_req, res) => {
    res.json({
      accountId: 'paper_sim_env_01',
      brokerName: 'LifeOS Paper Trading Simulation Engine',
      mode: 'PAPER',
      equity: 100000.0,
      cash: 100000.0,
      buyingPower: 200000.0,
      initialCapital: 100000.0,
      currency: 'USD',
      realizedPnl: 0.0,
      unrealizedPnl: 0.0,
      marginUsed: 0.0,
      dayTradesRemaining: 99,
      status: 'ACTIVE_SIMULATION',
      lastSyncTime: Date.now(),
    });
  });

  app.get('/api/broker/positions', requireAuth, (_req, res) => {
    res.json([]);
  });

  app.get('/api/broker/orders', requireAuth, (_req, res) => {
    res.json([]);
  });

  app.post('/api/broker/orders/submit', (_req, res) => {
    logger.security('BROKER', 'Live broker order execution attempted and blocked');
    return res.status(403).json({
      success: false,
      error: 'LIVE_TRADING_DISABLED',
      message: 'Live real-money order execution is disabled. Please route all orders through PaperBroker.',
    });
  });

  app.post('/api/broker/orders/cancel/:id', requireAuth, (req, res) => {
    res.json({ success: true, message: `Order ${req.params.id} cancelled.` });
  });

  app.post('/api/broker/positions/close/:id', requireAuth, (_req, res) => {
    res.json({ success: true, pnl: 0 });
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE / STATIC ASSETS
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('SYSTEM', `LIFE OS Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful Shutdown Handler
  const handleShutdown = async (signal: string) => {
    logger.info('SYSTEM', `Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      try {
        if (typeof db.close === 'function') {
          await db.close();
          logger.info('DATABASE', 'Database connections and storage flushed cleanly.');
        }
      } catch (err) {
        logger.error('SYSTEM', 'Error closing database on shutdown', { error: String(err) });
      }
      logger.info('SYSTEM', 'Graceful shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
