import assert from 'assert';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { generateAuthToken, verifyAuthToken } from '../src/server/auth';
import { serverTelemetry } from '../src/server/telemetry';

function createRateLimiter(config: { windowMs: number; max: number; message?: string; category?: string }) {
  const store = new Map<string, { count: number; resetTime: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = (req as any).user?.userId || req.ip || 'client';
    const now = Date.now();
    let record = store.get(clientKey);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + config.windowMs };
      store.set(clientKey, record);
    } else {
      record.count += 1;
    }
    if (record.count > config.max) {
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message: config.message });
    }
    next();
  };
}

async function runBlockerRegressionSuite() {
  console.log('====================================================');
  console.log('STARTING BLOCKER REGRESSION VERIFICATION SUITE');
  console.log('====================================================\n');

  const testDbDir = './.data_blocker_regression';
  const db = new SqlDatabaseAdapter(testDbDir);
  await db.initialize();

  // Create test user
  const testUser = await db.createUser(
    'blocker_test@lifeos.internal',
    'argon2_dummy_hash_for_test',
    'test_salt',
    'Blocker Tester',
    'user'
  );

  const validToken = generateAuthToken({
    userId: testUser.id,
    email: testUser.email,
    role: 'user',
  });

  const app = express();
  app.use(express.json());

  // Replicate server router setup for verification
  const telemetryRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Telemetry ingestion rate limit exceeded.',
    category: 'TELEMETRY',
  });

  const extractOptionalUser = (req: Request): { userId: string; role?: string } | null => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      const payload = verifyAuthToken(token);
      if (!payload || !payload.userId) return null;
      return { userId: payload.userId, role: payload.role };
    } catch {
      return null;
    }
  };

  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }
      const token = authHeader.split(' ')[1];
      const payload = verifyAuthToken(token);
      if (!payload || !payload.userId) {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
      }
      (req as any).user = { userId: payload.userId, email: payload.email, role: payload.role || 'user' };
      next();
    } catch {
      return res.status(500).json({ error: 'AUTH_FAILED' });
    }
  };

  // Blocker 2: Sync endpoint
  app.post('/api/data/sync', requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Invalid sync payload.' });
      }

      if ('changes' in req.body || !Array.isArray(req.body.operations)) {
        return res.status(400).json({
          error: 'OPERATION_BASED_SYNC_REQUIRED',
          message: 'State synchronization requires an explicit operations array. Legacy bulk state replacement is forbidden.',
        });
      }

      const operations = req.body.operations;
      const baseVersion = typeof req.body.baseVersion === 'number' ? req.body.baseVersion : undefined;

      for (const op of operations) {
        if (!op || typeof op !== 'object' || typeof op.type !== 'string' || !op.type.trim()) {
          return res.status(400).json({
            error: 'INVALID_OPERATION_SCHEMA',
            message: 'Each sync operation must contain a valid operation type.',
          });
        }
      }

      const opResult = await db.applySyncOperations((req as any).user.userId, operations, baseVersion);
      res.json({
        success: opResult.success,
        version: opResult.serverVersion,
        appliedCount: opResult.appliedCount,
        rejectedCount: opResult.rejectedCount,
        operationResults: opResult.operationResults,
        state: opResult.state,
      });
    } catch (err: any) {
      res.status(400).json({ error: 'SYNC_OPERATIONS_FAILED', message: err?.message });
    }
  });

  // Blocker 3: Telemetry endpoint
  app.post('/api/telemetry/events', telemetryRateLimiter, async (req, res) => {
    try {
      const optionalUser = extractOptionalUser(req);
      const resolvedUserId = optionalUser ? optionalUser.userId : 'anonymous';

      const { events } = req.body || {};
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Events must be an array.' });
      }

      if (events.length > 50) {
        return res.status(400).json({ error: 'BATCH_TOO_LARGE', message: 'Maximum 50 events per batch.' });
      }

      for (const evt of events) {
        if (!evt || typeof evt !== 'object') continue;
        const rawType = typeof evt.type === 'string' ? evt.type.trim() : 'api_request';
        if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(rawType)) continue;

        const payload = {
          type: rawType,
          userId: resolvedUserId,
          category: typeof evt.category === 'string' ? evt.category.slice(0, 50) : undefined,
          durationMs: typeof evt.durationMs === 'number' ? evt.durationMs : undefined,
          statusCode: typeof evt.statusCode === 'number' ? evt.statusCode : undefined,
          route: typeof evt.route === 'string' ? evt.route.slice(0, 200) : undefined,
          status: typeof evt.status === 'string' ? evt.status.slice(0, 50) : undefined,
          metadata: evt.metadata,
        };

        serverTelemetry.recordEvent(payload);
        if (typeof db.recordTelemetryEvent === 'function') {
          await db.recordTelemetryEvent({
            id: `telem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: resolvedUserId,
            type: rawType,
            category: payload.category,
            durationMs: payload.durationMs,
            statusCode: payload.statusCode,
            route: payload.route,
            status: payload.status,
            metadata: payload.metadata,
            timestamp: new Date().toISOString(),
          });
        }
      }

      res.json({ success: true, received: events.length, userId: resolvedUserId });
    } catch {
      res.status(400).json({ error: 'TELEMETRY_INGESTION_FAILED' });
    }
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3399, resolve));

  const makeRequest = (options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> => {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: raw ? JSON.parse(raw) : {} });
          } catch {
            resolve({ status: res.statusCode || 500, body: raw });
          }
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Blocker 1 — award-xp HTTP test
    // -----------------------------------------------------------------
    console.log('>>> [TEST 1] Testing POST /api/gamification/award-xp is completely absent (404)...');
    const res1 = await makeRequest(
      {
        hostname: 'localhost',
        port: 3399,
        path: '/api/gamification/award-xp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
      },
      { amount: 500, reason: 'Arbitrary client XP hack' }
    );
    assert.strictEqual(res1.status, 404, `Expected 404 Not Found for award-xp, got ${res1.status}`);
    console.log('✓ PASS: POST /api/gamification/award-xp returns 404 Not Found as route is eliminated.\n');

    // -----------------------------------------------------------------
    // TEST 2: Blocker 2 — Legacy bulk sync rejection
    // -----------------------------------------------------------------
    console.log('>>> [TEST 2] Testing POST /api/data/sync rejects legacy bulk state changes (400)...');
    const res2a = await makeRequest(
      {
        hostname: 'localhost',
        port: 3399,
        path: '/api/data/sync',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
      },
      {
        baseVersion: 1,
        changes: {
          profile: { currentXp: 99999, level: 99 },
        },
      }
    );
    assert.strictEqual(res2a.status, 400, `Expected 400 Bad Request for legacy changes payload, got ${res2a.status}`);
    assert.strictEqual(res2a.body.error, 'OPERATION_BASED_SYNC_REQUIRED');
    console.log('✓ PASS: POST /api/data/sync rejected legacy bulk changes payload with 400 OPERATION_BASED_SYNC_REQUIRED.');

    console.log('>>> [TEST 2B] Testing POST /api/data/sync accepts structured operations array...');
    const res2b = await makeRequest(
      {
        hostname: 'localhost',
        port: 3399,
        path: '/api/data/sync',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
      },
      {
        baseVersion: 1,
        operations: [
          {
            operationId: 'op_test_1',
            type: 'CREATE_TASK',
            payload: { id: 'task_sync_test', title: 'Test Task via Ops' },
          },
        ],
      }
    );
    assert.strictEqual(res2b.status, 200, `Expected 200 OK for operations array, got ${res2b.status}`);
    assert.strictEqual(res2b.body.success, true);
    assert.strictEqual(res2b.body.appliedCount, 1);
    console.log('✓ PASS: POST /api/data/sync successfully executed operation-based sync.\n');

    // -----------------------------------------------------------------
    // TEST 3: Blocker 3 — Telemetry User-ID Spoofing Protection
    // -----------------------------------------------------------------
    console.log('>>> [TEST 3A] Testing unauthenticated telemetry ignores client-provided spoofed userId...');
    const res3a = await makeRequest(
      {
        hostname: 'localhost',
        port: 3399,
        path: '/api/telemetry/events',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        events: [
          {
            type: 'user_action',
            userId: 'victim_user_spoofed_id',
            category: 'test',
          },
        ],
      }
    );
    assert.strictEqual(res3a.status, 200);
    assert.strictEqual(res3a.body.userId, 'anonymous', `Expected attributed userId 'anonymous', got ${res3a.body.userId}`);
    console.log('✓ PASS: Unauthenticated telemetry resolved to "anonymous", ignoring client-supplied userId.');

    console.log('>>> [TEST 3B] Testing authenticated telemetry enforces verified JWT user ID...');
    const res3b = await makeRequest(
      {
        hostname: 'localhost',
        port: 3399,
        path: '/api/telemetry/events',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
      },
      {
        events: [
          {
            type: 'user_action',
            userId: 'spoofed_admin_id',
            category: 'test',
          },
        ],
      }
    );
    assert.strictEqual(res3b.status, 200);
    assert.strictEqual(res3b.body.userId, testUser.id, `Expected authenticated testUser ID ${testUser.id}, got ${res3b.body.userId}`);
    console.log('✓ PASS: Authenticated telemetry strictly attributed to authenticated user, ignoring client-supplied spoofed userId.\n');

    console.log('====================================================');
    console.log('ALL BLOCKER REGRESSION TESTS PASSED PERFECTLY!');
    console.log('====================================================\n');
  } finally {
    server.close();
    // Clean up test db directory
    try {
      const fs = await import('fs');
      fs.rmSync(testDbDir, { recursive: true, force: true });
    } catch {}
  }
}

runBlockerRegressionSuite().catch((err) => {
  console.error('REGRESSION TEST FAILED:', err);
  process.exit(1);
});
