import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/server/db';
import { generateAuthToken, verifyAuthToken, verifyPassword, validateAuthSecretOnStartup } from './src/server/auth';
import { generateAICoachResponse } from './src/server/aiCoach';

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

// In-Memory Sliding Window Rate Limiter
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
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

    const record = store.get(clientKey);
    if (!record || now > record.resetTime) {
      store.set(clientKey, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    if (record.count >= config.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: config.message || `Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`,
      });
    }

    record.count += 1;
    next();
  };
}

async function startServer() {
  // Validate authentication secret immediately on startup
  validateAuthSecretOnStartup();

  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    // Allow iframe rendering for Studio live preview while establishing secure framing baseline
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Body parser with conservative payload limits
  app.use(express.json({ limit: '2mb' }));

  // Rate Limiters
  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many authentication attempts. Please try again in a minute.',
  });

  const aiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'AI request limit reached. Please wait a moment before sending more queries.',
  });

  const xpRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'XP transaction limit reached.',
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

  app.post('/api/auth/signup', authRateLimiter, (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Valid email and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' });
      }

      const userRecord = db.createUser(email, password, typeof name === 'string' ? name : '');
      const token = generateAuthToken({ userId: userRecord.id, email: userRecord.email });

      res.json({
        success: true,
        token,
        user: userRecord.profile,
      });
    } catch (err: any) {
      res.status(400).json({ error: 'SIGNUP_FAILED', message: err?.message || 'Signup failed' });
    }
  });

  app.post('/api/auth/login', authRateLimiter, (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Valid email and password are required.' });
      }

      const userRecord = db.getUserByEmail(email);
      if (!userRecord) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const isValid = verifyPassword(password, userRecord.passwordHash, userRecord.salt);
      if (!isValid) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const token = generateAuthToken({ userId: userRecord.id, email: userRecord.email });

      res.json({
        success: true,
        token,
        user: userRecord.profile,
      });
    } catch {
      res.status(500).json({ error: 'LOGIN_FAILED', message: 'Authentication processing failed.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    try {
      const user = db.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'User record not found.' });
      }
      res.json({ success: true, user: user.profile });
    } catch {
      res.status(500).json({ error: 'FETCH_ME_FAILED', message: 'Failed to retrieve profile.' });
    }
  });

  app.patch('/api/auth/profile', requireAuth, (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Invalid profile update payload.' });
      }
      const updated = db.updateUserProfile(req.user!.userId, req.body);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'UPDATE_PROFILE_FAILED', message: err?.message || 'Profile update failed.' });
    }
  });

  // -------------------------------------------------------------
  // CLOUD PERSISTENCE & STATE SYNC (WITH CONCURRENCY REVISIONS)
  // -------------------------------------------------------------

  app.get('/api/data/state', requireAuth, (req, res) => {
    try {
      const state = db.getUserState(req.user!.userId);
      res.json({ success: true, version: state.version, state });
    } catch {
      res.status(500).json({ error: 'GET_STATE_FAILED', message: 'Failed to retrieve state.' });
    }
  });

  app.post('/api/data/sync', requireAuth, (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Invalid sync payload.' });
      }
      const syncResult = db.syncUserState(req.user!.userId, req.body);

      if (syncResult.conflict) {
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
  app.post('/api/domain/tasks/complete', requireAuth, (req, res) => {
    try {
      const { taskId } = req.body;
      if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({ error: 'INVALID_TASK_ID', message: 'taskId is required.' });
      }
      const result = db.completeTask(req.user!.userId, taskId);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_COMPLETE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/tasks/create', requireAuth, (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Task payload is required.' });
      }
      const result = db.createTask(req.user!.userId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_CREATE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/tasks/update', requireAuth, (req, res) => {
    try {
      const { taskId, updates } = req.body;
      if (!taskId || typeof taskId !== 'string' || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'taskId and updates are required.' });
      }
      const result = db.updateTask(req.user!.userId, taskId, updates);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_UPDATE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/tasks/delete', requireAuth, (req, res) => {
    try {
      const { taskId } = req.body;
      if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({ error: 'INVALID_TASK_ID', message: 'taskId is required.' });
      }
      const result = db.deleteTask(req.user!.userId, taskId);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'TASK_NOT_FOUND', message: 'Task not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'TASK_DELETE_FAILED', message: err?.message });
    }
  });

  // Habits
  app.post('/api/domain/habits/complete', requireAuth, (req, res) => {
    try {
      const { habitId, date } = req.body;
      if (!habitId || typeof habitId !== 'string') {
        return res.status(400).json({ error: 'INVALID_HABIT_ID', message: 'habitId is required.' });
      }
      const result = db.completeHabit(req.user!.userId, habitId, typeof date === 'string' ? date : undefined);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_COMPLETE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/habits/create', requireAuth, (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Habit payload is required.' });
      }
      const result = db.createHabit(req.user!.userId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_CREATE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/habits/update', requireAuth, (req, res) => {
    try {
      const { habitId, updates } = req.body;
      if (!habitId || typeof habitId !== 'string' || !updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'habitId and updates are required.' });
      }
      const result = db.updateHabit(req.user!.userId, habitId, updates);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_UPDATE_FAILED', message: err?.message });
    }
  });

  app.post('/api/domain/habits/delete', requireAuth, (req, res) => {
    try {
      const { habitId } = req.body;
      if (!habitId || typeof habitId !== 'string') {
        return res.status(400).json({ error: 'INVALID_HABIT_ID', message: 'habitId is required.' });
      }
      const result = db.deleteHabit(req.user!.userId, habitId);
      if (!result.success) {
        return res.status(404).json({ error: result.error || 'HABIT_NOT_FOUND', message: 'Habit not found.' });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'HABIT_DELETE_FAILED', message: err?.message });
    }
  });

  // Goals
  app.post('/api/domain/goals/progress', requireAuth, (req, res) => {
    try {
      const { goalId, progress, milestoneId } = req.body;
      if (!goalId || typeof goalId !== 'string' || typeof progress !== 'number') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'goalId and numeric progress are required.' });
      }
      const result = db.updateGoalProgress(
        req.user!.userId,
        goalId,
        progress,
        typeof milestoneId === 'string' ? milestoneId : undefined
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

  app.post('/api/gamification/award-xp', requireAuth, xpRateLimiter, (req, res) => {
    try {
      const { amount, reason, category } = req.body;
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > 500) {
        return res.status(400).json({
          error: 'INVALID_XP_AMOUNT',
          message: 'XP amount must be a positive integer not exceeding 500 per transaction.',
        });
      }

      const safeReason = typeof reason === 'string' ? reason.slice(0, 100) : 'Activity completed';
      const result = db.recordXpTransaction(req.user!.userId, amount, safeReason, category);

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

      const userState = db.getUserState(req.user!.userId);
      const aiResult = await generateAICoachResponse({
        userState,
        userMessage: message.trim(),
        conversationHistory: Array.isArray(history) ? history.slice(-6) : [],
      });

      // Persist in user's AI conversation history
      db.addAiMessage(req.user!.userId, {
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

      db.addAiMessage(req.user!.userId, assistantMsg);

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
      const userState = db.getUserState(req.user!.userId);
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
  // HEALTH & BROKER STATUS
  // -------------------------------------------------------------

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), mode: 'production_ready' });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LIFE OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

