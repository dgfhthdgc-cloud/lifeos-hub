import http from 'http';
import fs from 'fs';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { setActiveDatabase } from '../src/server/db';
import { generateAuthToken } from '../src/server/auth';

process.env.NODE_ENV = 'test';
process.env.LIFEOS_SKIP_AUTO_START = 'true';

async function makeRequest(
  serverUrl: string,
  method: string,
  path: string,
  options: { headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const postData = options.body !== undefined ? JSON.stringify(options.body) : null;
    const reqHeaders: Record<string, string> = {
      ...(postData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {}
        resolve({ status: res.statusCode || 500, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runFastSmoke() {
  const testDbDir = './.data_fast_smoke';
  if (fs.existsSync(testDbDir)) fs.rmSync(testDbDir, { recursive: true, force: true });

  const db = new SqlDatabaseAdapter(testDbDir);
  await db.initialize();
  setActiveDatabase(db);

  const { createApp } = await import('../server');
  const app = await createApp({ skipVite: true });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const results: Record<string, boolean> = {};

  try {
    // 3. Health
    const health = await makeRequest(baseUrl, 'GET', '/api/health');
    results.HEALTH = health.status === 200 && health.body.status === 'ok';

    // 4. Readiness
    const ready = await makeRequest(baseUrl, 'GET', '/api/ready');
    results.READINESS = ready.status === 200 && ready.body.database?.ready === true;

    // Users setup
    const userA = await db.createUser('smoke_a@test.com', 'h1', 's1', 'User A', 'user');
    const userB = await db.createUser('smoke_b@test.com', 'h2', 's2', 'User B', 'user');
    const tokenA = generateAuthToken({ userId: userA.id, email: userA.email, role: 'user', tokenVersion: 1 });
    const tokenB = generateAuthToken({ userId: userB.id, email: userB.email, role: 'user', tokenVersion: 1 });

    // 5. Auth smoke test
    const authState = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    results.AUTH = authState.status === 200 && authState.body.success === true && Boolean(authState.body.state?.profile);

    // 6. Mutation Authority & XP
    const createRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        task: { id: 'smoke_task_1', title: 'Smoke Task', xp: 50 },
        clientEventId: 'evt_smoke_1',
      },
    });

    const compRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { taskId: 'smoke_task_1', clientEventId: 'evt_smoke_2' },
    });

    const canonicalState = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const taskCompleted = canonicalState.body.state.tasks.some((t: any) => t.id === 'smoke_task_1' && t.completed === true);
    results.MUTATION = createRes.status === 200 && compRes.status === 200 && taskCompleted;

    const xpEntries = canonicalState.body.state.xpLedger;
    results.XP = xpEntries.length === 1 && xpEntries[0].amount === 50 && canonicalState.body.state.profile.currentXp === 50;

    // 7. Idempotency smoke test
    const replayRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { taskId: 'smoke_task_1', clientEventId: 'evt_smoke_2' },
    });

    const stateAfterReplay = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    results.IDEMPOTENCY =
      replayRes.status === 200 &&
      stateAfterReplay.body.state.xpLedger.length === 1 &&
      stateAfterReplay.body.state.profile.currentXp === 50;

    // 8. RBAC smoke test
    const rbacRes = await makeRequest(baseUrl, 'GET', '/api/admin/ready', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    results.RBAC = rbacRes.status === 403;

    // 9. Tenant isolation smoke test
    const tenantRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { taskId: 'smoke_task_1' },
    });

    const userAState = await db.getUserState(userA.id);
    results['TENANT ISOLATION'] =
      tenantRes.status === 404 &&
      tenantRes.body.error === 'TASK_NOT_FOUND' &&
      userAState.profile.currentXp === 50;

    console.log(JSON.stringify(results, null, 2));
  } finally {
    server.close();
    await db.close();
    if (fs.existsSync(testDbDir)) fs.rmSync(testDbDir, { recursive: true, force: true });
  }
}

runFastSmoke().catch((e) => {
  console.error(e);
  process.exit(1);
});
