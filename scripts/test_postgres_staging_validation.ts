import http from 'http';
import { PostgresDatabaseAdapter } from '../src/server/database/PostgresDatabaseAdapter';
import { setActiveDatabase } from '../src/server/db';
import { generateAuthToken } from '../src/server/auth';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required for staging validation.');
  process.exit(1);
}

process.env.NODE_ENV = 'test';
process.env.STORAGE_MODE = 'multi-instance';
process.env.REQUIRE_POSTGRES = 'true';
process.env.LIFEOS_SKIP_AUTO_START = 'true';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'a-super-secret-auth-key-for-testing-16';

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

async function runStagingValidation() {
  console.log('======================================================================');
  console.log('LIFE OS — REAL POSTGRESQL STAGING VALIDATION');
  console.log('======================================================================');

  const results: Record<string, boolean> = {};

  // 1. Connect Postgres adapter
  let db: PostgresDatabaseAdapter;
  try {
    db = new PostgresDatabaseAdapter(databaseUrl!);
    await db.initialize();
    setActiveDatabase(db);
    results['REAL POSTGRES CONNECTION'] = true;
  } catch (err) {
    console.error('Failed to connect to PostgreSQL staging:', err);
    results['REAL POSTGRES CONNECTION'] = false;
    throw err;
  }

  // 2. Start HTTP server
  const { createApp } = await import('../server');
  const app = await createApp({ skipVite: true });
  let server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  let port = (server.address() as any).port;
  let baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Health & Readiness
    const health = await makeRequest(baseUrl, 'GET', '/api/health');
    results.HEALTH = health.status === 200 && health.body.status === 'ok';

    const ready = await makeRequest(baseUrl, 'GET', '/api/ready');
    results.READINESS = ready.status === 200 && ready.body.database?.ready === true && ready.body.database?.type === 'postgres';

    // 3. Auth & Small Real HTTP Flow
    const testEmail = `staging_user_${Date.now()}@test.com`;
    const signupRes = await makeRequest(baseUrl, 'POST', '/api/auth/signup', {
      body: { email: testEmail, password: 'SecurePassword123!', name: 'Staging User' },
    });

    const loginRes = await makeRequest(baseUrl, 'POST', '/api/auth/login', {
      body: { email: testEmail, password: 'SecurePassword123!' },
    });

    const token = loginRes.body.token;
    const userId = loginRes.body.user.id;

    const authState = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    results.AUTH = signupRes.status === 200 && loginRes.status === 200 && authState.status === 200 && authState.body.success === true;

    // Create Task
    const taskId = `task_pg_${Date.now()}`;
    const createTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        task: { id: taskId, title: 'Postgres Task', xp: 75 },
        clientEventId: `evt_create_${taskId}`,
      },
    });

    // Complete Task
    const compEventId = `evt_comp_${taskId}`;
    const compTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${token}` },
      body: { taskId, clientEventId: compEventId },
    });

    // Verify task status & XP
    const stateAfterTask = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const taskObj = stateAfterTask.body.state.tasks.find((t: any) => t.id === taskId);
    results.TASK = createTaskRes.status === 200 && compTaskRes.status === 200 && taskObj && taskObj.completed === true;

    // Idempotency: Replay same clientEventId
    const replayRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${token}` },
      body: { taskId, clientEventId: compEventId },
    });

    const stateAfterReplay = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    results.IDEMPOTENCY =
      replayRes.status === 200 &&
      stateAfterReplay.body.state.xpLedger.length === 1 &&
      stateAfterReplay.body.state.profile.currentXp === 75;

    // Create & Complete Habit
    const habitId = `habit_pg_${Date.now()}`;
    const habitEventId = `evt_habit_${habitId}`;
    const createHabitRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        baseVersion: stateAfterReplay.body.state.version,
        mutations: [
          {
            type: 'CREATE_HABIT',
            payload: { habit: { id: habitId, title: 'Morning Exercise', streak: 0, completedToday: false, xpReward: 50 } },
          },
        ],
      },
    });

    const compHabitRes = await makeRequest(baseUrl, 'POST', '/api/domain/habits/complete', {
      headers: { Authorization: `Bearer ${token}` },
      body: { habitId, clientEventId: habitEventId },
    });

    const stateAfterHabit = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const habitObj = stateAfterHabit.body.state.habits.find((h: any) => h.id === habitId);
    results.HABIT = createHabitRes.status === 200 && compHabitRes.status === 200 && habitObj && habitObj.streak >= 1;

    // Create & Progress Goal
    const goalId = `goal_pg_${Date.now()}`;
    const goalEventId = `evt_goal_${goalId}`;
    const createGoalRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        baseVersion: stateAfterHabit.body.state.version,
        mutations: [
          {
            type: 'CREATE_GOAL',
            payload: {
              goal: {
                id: goalId,
                title: 'Master PostgreSQL',
                progress: 0,
                milestones: [{ id: 'm1', title: 'Connect Driver', completed: false, xpReward: 100 }],
              },
            },
          },
        ],
      },
    });

    const progGoalRes = await makeRequest(baseUrl, 'POST', '/api/domain/goals/progress', {
      headers: { Authorization: `Bearer ${token}` },
      body: { goalId, progress: 100, milestoneId: 'm1', clientEventId: goalEventId },
    });

    const stateAfterGoal = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const goalObj = stateAfterGoal.body.state.goals.find((g: any) => g.id === goalId);
    results.GOAL = createGoalRes.status === 200 && progGoalRes.status === 200 && goalObj && goalObj.progress === 100;

    // XP Ledger Invariants direct check
    const ledgerSum = stateAfterGoal.body.state.xpLedger.reduce((acc: number, entry: any) => acc + entry.amount, 0);
    const profileXp = stateAfterGoal.body.state.profile.currentXp;
    results['XP LEDGER'] = ledgerSum === profileXp && profileXp > 0;

    // Tenant Isolation test
    const tenantBEmail = `tenant_b_${Date.now()}@test.com`;
    const tenantBLogin = await makeRequest(baseUrl, 'POST', '/api/auth/signup', {
      body: { email: tenantBEmail, password: 'SecurePassword123!', name: 'Tenant B' },
    });
    const tokenB = tenantBLogin.body.token;

    const tenantBMutateRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { taskId },
    });

    const tenantAStateCheck = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    results['TENANT ISOLATION'] = tenantBMutateRes.status === 404 && tenantAStateCheck.body.state.profile.currentXp === profileXp;

    // 5. Concurrency Test: simultaneous completion of another task
    const taskConcId = `task_conc_${Date.now()}`;
    await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${token}` },
      body: { task: { id: taskConcId, title: 'Concurrency Task', xp: 60 } },
    });

    const xpBeforeConc = (await makeRequest(baseUrl, 'GET', '/api/data/state', { headers: { Authorization: `Bearer ${token}` } })).body.state.profile.currentXp;

    // Fire 2 concurrent requests
    const [c1, c2] = await Promise.all([
      makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
        headers: { Authorization: `Bearer ${token}` },
        body: { taskId: taskConcId },
      }),
      makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
        headers: { Authorization: `Bearer ${token}` },
        body: { taskId: taskConcId },
      }),
    ]);

    const stateAfterConc = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const xpGained = stateAfterConc.body.state.profile.currentXp - xpBeforeConc;
    results.CONCURRENCY =
      ((c1.body.alreadyCompleted && !c2.body.alreadyCompleted) || (!c1.body.alreadyCompleted && c2.body.alreadyCompleted)) &&
      xpGained === 60;

    // 6. Rollback Test: Forced invalid mutation in domain sync
    const versionBeforeRollback = stateAfterConc.body.state.version;
    const rollbackRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${token}` },
      body: { taskId: 'non_existent_task_xyz_999' },
    });

    const stateAfterRollback = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    results.ROLLBACK =
      rollbackRes.status === 404 &&
      stateAfterRollback.body.state.profile.currentXp === stateAfterConc.body.state.profile.currentXp;

    // 7. Restart Persistence Test: Close server & adapter, re-open with fresh adapter instance
    server.close();
    await db.close();

    const dbFresh = new PostgresDatabaseAdapter(databaseUrl!);
    await dbFresh.initialize();
    setActiveDatabase(dbFresh);

    const appFresh = await createApp({ skipVite: true });
    server = http.createServer(appFresh);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const stateAfterRestart = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const persistedUserTask = stateAfterRestart.body.state?.tasks?.find((t: any) => t.id === taskId);
    results['RESTART PERSISTENCE'] =
      stateAfterRestart.status === 200 &&
      stateAfterRestart.body.success === true &&
      persistedUserTask &&
      persistedUserTask.completed === true &&
      stateAfterRestart.body.state.profile.currentXp === stateAfterConc.body.state.profile.currentXp;

    await dbFresh.close();
    server.close();
  } catch (e) {
    console.error('Validation test error:', e);
    throw e;
  }

  console.log('RESULTS:');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(Boolean);
  if (!allPassed) {
    process.exit(1);
  }
}

runStagingValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
