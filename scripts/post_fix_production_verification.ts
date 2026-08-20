import assert from 'assert';
import http from 'http';
import fs from 'fs';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { setActiveDatabase } from '../src/server/db';
import { generateAuthToken } from '../src/server/auth';
import { Storage } from '../src/lib/storage';

// Prevent server.ts from auto-listening during import
process.env.NODE_ENV = 'test';
process.env.LIFEOS_SKIP_AUTO_START = 'true';

// Provide in-memory localStorage for Node environment to test Guest/Demo storage
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

async function makeRequest(
  serverUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const postData = options.body !== undefined ? JSON.stringify(options.body) : null;
    const reqHeaders: Record<string, string> = {
      ...(postData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed: any = rawData;
          try {
            parsed = JSON.parse(rawData);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const testResults: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, details?: string) {
  testResults.push({ suite, name, passed, details });
  const statusSymbol = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${statusSymbol}: [${suite}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function runPostFixProductionVerification() {
  console.log('======================================================================');
  console.log('LIFE OS — POST-FIX PRODUCTION AUTHORITY & SECURITY VERIFICATION');
  console.log('======================================================================\n');

  const testDbDir = './.data_post_fix_test';
  if (fs.existsSync(testDbDir)) {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  }

  const db = new SqlDatabaseAdapter(testDbDir);
  await db.initialize();
  setActiveDatabase(db);

  // Dynamic import of real production Express app
  const { createApp } = await import('../server');
  const app = await createApp({ skipVite: true });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`[TEST RUNNER] Production Express App mounted on ${baseUrl}\n`);

  try {
    // SETUP USERS
    const userA = await db.createUser('user_a@lifeos.prod', 'hash_a', 'salt_a', 'Alice Production', 'user');
    const userB = await db.createUser('user_b@lifeos.prod', 'hash_b', 'salt_b', 'Bob Production', 'user');

    const tokenA = generateAuthToken({ userId: userA.id, email: userA.email, role: 'user', tokenVersion: 1 });
    const tokenB = generateAuthToken({ userId: userB.id, email: userB.email, role: 'user', tokenVersion: 1 });

    // -------------------------------------------------------------------------
    // 2. VERIFY REAL HTTP AUTHORITY BOUNDARY
    // -------------------------------------------------------------------------
    console.log('--- 2. REAL HTTP AUTHORITY BOUNDARY (MUTATIONS & CANONICAL STATE) ---');

    // 2.1 Task Creation
    const createTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        task: {
          id: 'task_auth_boundary_1',
          title: 'Deploy Production Hardening',
          dueDate: '2026-08-20',
          priority: 'high',
          category: 'Operations',
          tags: ['#release'],
          xp: 60,
        },
        clientEventId: 'evt_create_task_auth_1',
      },
    });
    const taskCreateOk =
      createTaskRes.status === 200 &&
      createTaskRes.body.success === true &&
      createTaskRes.body.task?.id === 'task_auth_boundary_1';
    recordTest('Authority Boundary', 'Task Creation via HTTP', taskCreateOk, `Status ${createTaskRes.status}`);

    // Verify canonical state after task create
    const stateAfterTaskCreate = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const taskInServerState = stateAfterTaskCreate.body.state.tasks.some(
      (t: any) => t.id === 'task_auth_boundary_1' && t.title === 'Deploy Production Hardening'
    );
    recordTest('Authority Boundary', 'Task Saved to Canonical Server State', taskInServerState);

    // 2.2 Task Complete
    const completeTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        taskId: 'task_auth_boundary_1',
        clientEventId: 'evt_complete_task_auth_1',
      },
    });
    const taskCompleteOk =
      completeTaskRes.status === 200 &&
      completeTaskRes.body.success === true &&
      completeTaskRes.body.task?.completed === true &&
      completeTaskRes.body.profile?.currentXp === 60;
    recordTest('Authority Boundary', 'Task Completion via HTTP', taskCompleteOk, `XP: ${completeTaskRes.body.profile?.currentXp}`);

    // Verify task completion canonical state
    const stateAfterTaskComp = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const taskCompletedInServer = stateAfterTaskComp.body.state.tasks.find((t: any) => t.id === 'task_auth_boundary_1');
    recordTest(
      'Authority Boundary',
      'Task Marked Completed in Canonical State',
      taskCompletedInServer?.completed === true
    );

    // 2.3 Task Creation for Deletion Test
    const taskToDeleteRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        task: {
          id: 'task_to_delete_1',
          title: 'Temporary Scratch Task',
          priority: 'low',
          xp: 10,
        },
      },
    });
    assert.strictEqual(taskToDeleteRes.status, 200);

    // Task Deletion
    const deleteTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/delete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        taskId: 'task_to_delete_1',
        clientEventId: 'evt_delete_task_1',
      },
    });
    const taskDeleteOk = deleteTaskRes.status === 200 && deleteTaskRes.body.success === true;
    recordTest('Authority Boundary', 'Task Deletion via HTTP', taskDeleteOk);

    // Verify deletion in canonical state
    const stateAfterDelete = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const taskGoneFromServer = !stateAfterDelete.body.state.tasks.some((t: any) => t.id === 'task_to_delete_1');
    recordTest('Authority Boundary', 'Deleted Task Removed from Canonical State', taskGoneFromServer);

    // 2.4 Habit Creation & Completion
    const createHabitRes = await makeRequest(baseUrl, 'POST', '/api/domain/habits/create', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        habit: {
          id: 'habit_auth_boundary_1',
          name: 'Morning Deep Focus',
          category: 'Productivity',
          frequency: 'daily',
          xp: 40,
        },
      },
    });
    assert.strictEqual(createHabitRes.status, 200);

    const todayStr = new Date().toISOString().split('T')[0];
    const completeHabitRes = await makeRequest(baseUrl, 'POST', '/api/domain/habits/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        habitId: 'habit_auth_boundary_1',
        date: todayStr,
        clientEventId: 'evt_habit_comp_auth_1',
      },
    });
    const habitCompOk =
      completeHabitRes.status === 200 &&
      completeHabitRes.body.success === true &&
      completeHabitRes.body.habit?.currentStreak === 1 &&
      completeHabitRes.body.profile?.currentXp === 100; // 60 (task) + 40 (habit)
    recordTest('Authority Boundary', 'Habit Completion via HTTP', habitCompOk, `XP: ${completeHabitRes.body.profile?.currentXp}`);

    // Verify habit in canonical server state
    const stateAfterHabit = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const habitInState = stateAfterHabit.body.state.habits.find((h: any) => h.id === 'habit_auth_boundary_1');
    recordTest(
      'Authority Boundary',
      'Habit Streak & History Preserved in Canonical State',
      habitInState?.currentStreak === 1 && habitInState?.history?.includes(todayStr)
    );

    // 2.5 Goal Progress Update
    // Seed initial goal for user A
    await db.syncUserState(userA.id, {
      changes: {
        goals: [
          {
            id: 'goal_auth_boundary_1',
            title: 'Master Systems Architecture',
            description: 'Core systems hardening',
            category: 'Skill',
            progress: 0,
            xpReward: 500,
            milestones: [
              { id: 'ms_auth_1', goalId: 'goal_auth_boundary_1', title: 'Complete Verification Matrix', completed: false, xpReward: 80, order: 1 },
              { id: 'ms_auth_2', goalId: 'goal_auth_boundary_1', title: 'Achieve Production Certification', completed: false, xpReward: 120, order: 2 },
            ],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    const goalProgressRes = await makeRequest(baseUrl, 'POST', '/api/domain/goals/progress', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        goalId: 'goal_auth_boundary_1',
        progress: 50,
        milestoneId: 'ms_auth_1',
        clientEventId: 'evt_goal_prog_auth_1',
      },
    });
    const goalProgOk =
      goalProgressRes.status === 200 &&
      goalProgressRes.body.success === true &&
      goalProgressRes.body.goal?.progress === 50 &&
      goalProgressRes.body.goal?.milestones?.find((m: any) => m.id === 'ms_auth_1')?.completed === true &&
      goalProgressRes.body.profile?.currentXp === 180; // 100 + 80
    recordTest('Authority Boundary', 'Goal Progress & Milestone via HTTP', goalProgOk, `XP: ${goalProgressRes.body.profile?.currentXp}`);

    // Verify goal in canonical state
    const stateAfterGoal = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const goalInState = stateAfterGoal.body.state.goals.find((g: any) => g.id === 'goal_auth_boundary_1');
    recordTest(
      'Authority Boundary',
      'Goal Progress & Milestone Canonical State Verification',
      goalInState?.progress === 50 && goalInState?.milestones[0].completed === true
    );

    // -------------------------------------------------------------------------
    // 3. VERIFY REJECTION + ROLLBACK
    // -------------------------------------------------------------------------
    console.log('\n--- 3. REJECTION + ROLLBACK ---');

    // 3.1 Attempt invalid task complete (non-existent task)
    const invalidTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { taskId: 'task_non_existent_9999' },
    });
    recordTest('Rejection & Rollback', 'Server Rejects Non-Existent Task (HTTP 404)', invalidTaskRes.status === 404);

    // 3.2 Verify server state and XP ledger were unchanged by rejection
    const stateAfterInvalid = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'Rejection & Rollback',
      'Canonical XP and State Intact after Rejection',
      stateAfterInvalid.body.state.profile.currentXp === 180 &&
        stateAfterInvalid.body.state.xpLedger.length === 3 // task (60), habit (40), milestone (80)
    );

    // -------------------------------------------------------------------------
    // 4. VERIFY IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log('\n--- 4. IDEMPOTENCY (CLIENT EVENT ID REPLAY PROTECTION) ---');

    // Repeat goal progress with exact same clientEventId
    const replayGoalRes = await makeRequest(baseUrl, 'POST', '/api/domain/goals/progress', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        goalId: 'goal_auth_boundary_1',
        progress: 50,
        milestoneId: 'ms_auth_1',
        clientEventId: 'evt_goal_prog_auth_1',
      },
    });
    const replayGoalOk =
      replayGoalRes.status === 200 &&
      replayGoalRes.body.success === true &&
      replayGoalRes.body.profile?.currentXp === 180; // No duplicate XP inflation
    recordTest('Idempotency', 'Replay with Same clientEventId Returns Idempotent Success', replayGoalOk);

    // Verify DB xp_ledger has exactly 3 entries and no duplicate entries created
    const stateAfterReplay = await makeRequest(baseUrl, 'GET', '/api/data/state', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'Idempotency',
      'No Duplicate XP Ledger Records Created on Idempotent Replay',
      stateAfterReplay.body.state.xpLedger.length === 3 && stateAfterReplay.body.state.profile.currentXp === 180
    );

    // -------------------------------------------------------------------------
    // 5. VERIFY TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. MULTI-TENANT ISOLATION ---');

    // User B attempts to complete User A's task
    const crossTenantTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { taskId: 'task_auth_boundary_1' },
    });
    recordTest(
      'Tenant Isolation',
      "User B Rejection on User A's Task (HTTP 404)",
      crossTenantTaskRes.status === 404 && crossTenantTaskRes.body.error === 'TASK_NOT_FOUND'
    );

    // User B attempts to complete User A's habit
    const crossTenantHabitRes = await makeRequest(baseUrl, 'POST', '/api/domain/habits/complete', {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { habitId: 'habit_auth_boundary_1' },
    });
    recordTest(
      'Tenant Isolation',
      "User B Rejection on User A's Habit (HTTP 404)",
      crossTenantHabitRes.status === 404 && crossTenantHabitRes.body.error === 'HABIT_NOT_FOUND'
    );

    // User B attempts to update User A's goal
    const crossTenantGoalRes = await makeRequest(baseUrl, 'POST', '/api/domain/goals/progress', {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { goalId: 'goal_auth_boundary_1', progress: 100 },
    });
    recordTest(
      'Tenant Isolation',
      "User B Rejection on User A's Goal (HTTP 404)",
      crossTenantGoalRes.status === 404 && crossTenantGoalRes.body.error === 'GOAL_NOT_FOUND'
    );

    // Verify User A state was completely untouched by User B's unauthorized requests
    const userAStateCheck = await db.getUserState(userA.id);
    recordTest(
      'Tenant Isolation',
      "User A State Untouched by User B Attempts",
      userAStateCheck.profile.currentXp === 180 && userAStateCheck.xpLedger.length === 3
    );

    // Verify User B state has 0 XP and no leaked entities
    const userBStateCheck = await db.getUserState(userB.id);
    recordTest(
      'Tenant Isolation',
      'User B State Isolated with Zero Leaked Data / XP',
      userBStateCheck.profile.currentXp === 0 &&
        userBStateCheck.tasks.length === 0 &&
        userBStateCheck.habits.length === 0 &&
        userBStateCheck.goals.length === 0
    );

    // -------------------------------------------------------------------------
    // 6. VERIFY XP AUTHORITY & MATHEMATICAL LEDGER PROOF
    // -------------------------------------------------------------------------
    console.log('\n--- 6. XP AUTHORITY & LEDGER AUDIT ---');

    // Create a new task with explicit XP
    const newXpTaskRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/create', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        task: {
          id: 'task_xp_audit_1',
          title: 'XP Audit Task',
          xp: 75,
        },
      },
    });
    assert.strictEqual(newXpTaskRes.status, 200);

    const xpBefore = userAStateCheck.profile.currentXp; // 180

    // Complete the task
    const xpCompRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        taskId: 'task_xp_audit_1',
        clientEventId: 'evt_xp_audit_comp_1',
      },
    });
    const xpAfter = xpCompRes.body.profile.currentXp; // 255
    const xpDiff = xpAfter - xpBefore;

    recordTest(
      'XP Authority',
      'Authoritative XP Awarded Exactly Once (+75 XP)',
      xpDiff === 75 && xpAfter === 255
    );

    // Repeat completion with new eventId on already completed task
    const duplicateCompRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        taskId: 'task_xp_audit_1',
        clientEventId: 'evt_xp_audit_comp_2',
      },
    });
    recordTest(
      'XP Authority',
      'Completed Task Subsequent Calls Return alreadyCompleted (0 XP Gain)',
      duplicateCompRes.body.alreadyCompleted === true && duplicateCompRes.body.profile.currentXp === 255
    );

    // Audit full XP ledger mathematical sum against profile currentXp
    const finalState = await db.getUserState(userA.id);
    const sumOfLedger = finalState.xpLedger.reduce((sum, tx) => sum + tx.amount, 0);
    recordTest(
      'XP Authority',
      'XP Ledger Mathematical Sum Perfectly Matches Profile XP (255 == 255)',
      sumOfLedger === finalState.profile.currentXp && sumOfLedger === 255
    );

    // -------------------------------------------------------------------------
    // 7. VERIFY GUEST / DEMO MODE
    // -------------------------------------------------------------------------
    console.log('\n--- 7. GUEST / DEMO MODE CLIENT VERIFICATION ---');

    // Storage module works in local/guest mode
    const guestTasks = Storage.getTasks();
    const guestHabits = Storage.getHabits();
    const guestGoals = Storage.getGoals();
    const guestStateOk = Array.isArray(guestTasks) && Array.isArray(guestHabits) && Array.isArray(guestGoals);
    recordTest('Guest/Demo Mode', 'Local Storage Data Layer Read/Write Functional for Demo', guestStateOk);

    // Demo Task Toggle returns optimistic XP calculation locally
    const demoTask = Storage.createTask({
      title: 'Demo Local Task',
      dueDate: '2026-08-20',
      time: '10:00 AM',
      priority: 'medium',
      status: 'todo',
      category: 'Demo',
      tags: ['#demo'],
      xp: 30,
      completed: false,
    });
    const demoToggle = Storage.toggleTask(demoTask.id);
    const demoToggleOk = demoToggle.task.completed === true && demoToggle.xpAwarded === 30;
    recordTest('Guest/Demo Mode', 'Demo Task Toggle & Local Progression Preserved', demoToggleOk);

    console.log('\n======================================================================');
    const allPassed = testResults.every((t) => t.passed);
    console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${testResults.filter((t) => t.passed).length} | FAILED: ${testResults.filter((t) => !t.passed).length}`);
    console.log(`FINAL VERDICT: ${allPassed ? 'ALL TESTS PASSED (GO)' : 'TESTS FAILED (BLOCKED)'}`);
    console.log('======================================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    server.close();
    await db.close();
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  }
}

runPostFixProductionVerification().catch((err) => {
  console.error('VERIFICATION SCRIPT ERROR:', err);
  process.exit(1);
});
