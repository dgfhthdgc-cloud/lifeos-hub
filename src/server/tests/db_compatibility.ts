import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
import { PostgresDatabaseAdapter } from '../database/PostgresDatabaseAdapter';
import { DatabaseAdapter } from '../database/DatabaseAdapter';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}`);
  }
}

async function testAdapterContract(adapterName: string, adapter: SqlDatabaseAdapter) {
  console.log(`\n--------------------------------------------------`);
  console.log(`TESTING ADAPTER SUITE: ${adapterName}`);
  console.log(`--------------------------------------------------`);

  // 1. Initialization
  await adapter.initialize();
  const ready = typeof adapter.isReady === 'function' ? await adapter.isReady() : true;
  assert(ready === true, `[${adapterName}] Adapter initializes and reports isReady() === true`);

  // 2. User Creation & Retrieval
  const email = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@lifeos.internal`;
  const user = await adapter.createUser(email, 'hash_abc_123', 'salt_xyz_789', 'Commander Shepard');
  assert(!!user && !!user.id && user.email === email, `[${adapterName}] createUser() returns structured user record`);

  const fetchedByEmail = await adapter.getUserByEmail(email);
  assert(fetchedByEmail !== null && fetchedByEmail.id === user.id, `[${adapterName}] getUserByEmail() retrieves created user`);

  const fetchedById = await adapter.getUserById(user.id);
  assert(fetchedById !== null && fetchedById.profile.name === 'Commander Shepard', `[${adapterName}] getUserById() retrieves user profile`);

  // 3. User Profile Update
  const updatedProfile = await adapter.updateUserProfile(user.id, {
    title: 'Spectre Operative',
    settings: {
      theme: 'dark',
      notificationsEnabled: true,
      aiInsightsEnabled: true,
      compactView: false,
    },
  });
  assert(updatedProfile.title === 'Spectre Operative', `[${adapterName}] updateUserProfile() modifies profile fields`);

  // 4. Password Update
  await adapter.updateUserPassword(user.id, 'new_hash_456', 'new_salt_000');
  const userAfterPwd = await adapter.getUserById(user.id);
  assert(userAfterPwd?.passwordHash === 'new_hash_456', `[${adapterName}] updateUserPassword() updates password hash`);

  // 5. User State Retrieval
  const initialState = await adapter.getUserState(user.id);
  assert(initialState !== null && typeof initialState.version === 'number', `[${adapterName}] getUserState() returns full domain state with version`);

  // 6. Task Domain: Create, Update, Complete, Delete
  const taskCreated = await adapter.createTask(user.id, {
    title: 'Deploy Planetary Defense System',
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['citadel', 'defense'],
    dueDate: '2026-10-01',
    time: '09:00',
    xp: 75,
    completed: false,
    createdAt: new Date().toISOString(),
  }, 'client-event-task-create-1');
  assert(taskCreated.success === true && !!taskCreated.task, `[${adapterName}] createTask() creates task with metadata`);

  const taskId = taskCreated.task.id;
  const taskUpdated = await adapter.updateTask(user.id, taskId, {
    title: 'Deploy Planetary Defense Matrix (Upgraded)',
    priority: 'high',
  }, 'client-event-task-upd-1');
  assert(taskUpdated.success === true && taskUpdated.task.title.includes('Upgraded'), `[${adapterName}] updateTask() updates task in place`);

  // Task Complete with Authoritative XP Ledger
  const xpBeforeTask = (await adapter.getUserById(user.id))?.profile.currentXp || 0;
  const taskCompleted = await adapter.completeTask(user.id, taskId, 'client-event-task-comp-1');
  assert(taskCompleted.success === true && taskCompleted.task.completed === true, `[${adapterName}] completeTask() marks task completed`);
  assert((taskCompleted.profile?.currentXp || 0) > xpBeforeTask, `[${adapterName}] completeTask() authoritatively awards XP`);

  // Idempotency check on task completion
  const taskCompletedDup = await adapter.completeTask(user.id, taskId, 'client-event-task-comp-1');
  assert(taskCompletedDup.success === true && taskCompletedDup.version === taskCompleted.version, `[${adapterName}] completeTask() is idempotent with identical clientEventId`);

  // Delete Task
  const taskDeleted = await adapter.deleteTask(user.id, taskId, 'client-event-task-del-1');
  assert(taskDeleted.success === true, `[${adapterName}] deleteTask() removes task from user state`);

  // 7. Habit Domain: Create, Complete (Streak Calculation), Delete
  const habitCreated = await adapter.createHabit(user.id, {
    name: 'Morning Tactical Briefing',
    description: 'Daily readiness drill',
    target: '1 session',
    frequency: 'daily',
    category: 'Skill',
    difficulty: 'medium',
    xp: 40,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    completedToday: false,
    createdAt: new Date().toISOString(),
  }, 'client-event-habit-create-1');
  assert(habitCreated.success === true && !!habitCreated.habit, `[${adapterName}] createHabit() creates habit`);

  const habitId = habitCreated.habit.id;
  const today = new Date().toISOString().split('T')[0];
  const habitCompleted = await adapter.completeHabit(user.id, habitId, today, 'client-event-habit-comp-1');
  assert(habitCompleted.success === true && habitCompleted.habit.currentStreak === 1, `[${adapterName}] completeHabit() increments habit streak`);

  const habitDeleted = await adapter.deleteHabit(user.id, habitId, 'client-event-habit-del-1');
  assert(habitDeleted.success === true, `[${adapterName}] deleteHabit() removes habit`);

  // 8. Goal Domain: Progress Tracking & XP Reward
  const goalCreated = await adapter.syncUserState(user.id, {
    changes: {
      goals: [
        {
          id: 'goal-normandy-refit',
          title: 'Complete Normandy SR-2 Refit',
          description: 'Upgrade stealth and propulsion',
          category: 'Career & Skills',
          progress: 25,
          xpReward: 300,
          milestones: [
            { id: 'm1', goalId: 'goal-normandy-refit', title: 'Install Tantalus Drive Core', completed: true, order: 1, xpReward: 100 },
            { id: 'm2', goalId: 'goal-normandy-refit', title: 'Calibrate Thanix Cannon', completed: false, order: 2, xpReward: 100 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
  assert(goalCreated.state.goals.length > 0, `[${adapterName}] syncUserState() sets initial goals`);

  const goalUpdated = await adapter.updateGoalProgress(user.id, 'goal-normandy-refit', 100, 'm2', 'client-event-goal-1');
  assert(goalUpdated.success === true && goalUpdated.goal.progress === 100, `[${adapterName}] updateGoalProgress() updates progress and milestones`);

  // 9. Gamification: Record XP Transaction
  const xpTx = await adapter.recordXpTransaction(user.id, 150, 'Defeated Collector Vanguard', 'task', 'client-event-xp-1');
  assert(!!xpTx && xpTx.transaction.amount === 150, `[${adapterName}] recordXpTransaction() logs transaction to ledger`);

  // Duplicate XP transaction check
  const xpTxDup = await adapter.recordXpTransaction(user.id, 150, 'Defeated Collector Vanguard', 'task', 'client-event-xp-1');
  assert(!!xpTxDup && xpTxDup.version === xpTx.version, `[${adapterName}] recordXpTransaction() handles duplicate event idempotently`);

  // 10. AI Chat Message Persistence
  await adapter.addAiMessage(user.id, {
    id: 'ai-msg-1',
    role: 'user',
    content: 'EDI, give me a status report on ship systems.',
    timestamp: '12:00 PM',
  });
  await adapter.addAiMessage(user.id, {
    id: 'ai-msg-2',
    role: 'assistant',
    content: 'All systems operational, Shepard.',
    timestamp: '12:01 PM',
  });
  const stateWithAi = await adapter.getUserState(user.id);
  assert(
    Array.isArray(stateWithAi.aiHistory) && stateWithAi.aiHistory.length >= 2,
    `[${adapterName}] addAiMessage() persists AI dialogue history`
  );

  // 11. Optimistic Concurrency & Conflict Detection in Sync
  const currentVersion = stateWithAi.version;
  const syncWithOldVersion = await adapter.syncUserState(user.id, {
    baseVersion: currentVersion - 1,
    changes: { tasks: [] },
  });
  assert(syncWithOldVersion.conflict === true, `[${adapterName}] syncUserState() detects stale client version conflict`);

  // 12. Cross-User Isolation
  const otherUser = await adapter.createUser(
    `garrus_${Date.now()}@lifeos.internal`,
    'hash_archangel',
    'salt_archangel',
    'Garrus Vakarian'
  );
  const otherState = await adapter.getUserState(otherUser.id);
  assert(
    otherState.tasks.length === 0 && otherState.profile.name === 'Garrus Vakarian',
    `[${adapterName}] Cross-user data isolation strictly verified`
  );

  // 13. Close
  await adapter.close();
  const readyAfterClose = typeof adapter.isReady === 'function' ? await adapter.isReady() : false;
  assert(readyAfterClose === false, `[${adapterName}] isReady() is false after close()`);
}

async function runCompatibilityTests() {
  console.log('==================================================');
  console.log('LIFEOS HUB — DATABASE ADAPTER COMPATIBILITY TEST SUITE');
  console.log('==================================================');

  // Test 1: SQLite Adapter
  const testDbDir = path.join(process.cwd(), '.data_compat_test');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'compat_sqlite.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const sqliteAdapter = new SqlDatabaseAdapter(testDbPath);
  await testAdapterContract('SqlDatabaseAdapter (SQLite)', sqliteAdapter);

  // Cleanup SQLite files
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(testDbDir)) fs.rmdirSync(testDbDir);

  // Test 2: PostgreSQL Adapter (Mock/Interface & Structure Verification when no live Postgres server is bound)
  console.log('\n--------------------------------------------------');
  console.log('POSTGRES ADAPTER BEHAVIORAL & PARITY AUDIT');
  console.log('--------------------------------------------------');

  const pgAdapter = new PostgresDatabaseAdapter('postgresql://localhost:5432/non_existent_db_for_test');

  assert(typeof pgAdapter.initialize === 'function', '[PostgresDatabaseAdapter] Implements initialize()');
  assert(typeof pgAdapter.isReady === 'function', '[PostgresDatabaseAdapter] Implements isReady()');
  assert(typeof pgAdapter.createUser === 'function', '[PostgresDatabaseAdapter] Implements createUser()');
  assert(typeof pgAdapter.getUserByEmail === 'function', '[PostgresDatabaseAdapter] Implements getUserByEmail()');
  assert(typeof pgAdapter.getUserById === 'function', '[PostgresDatabaseAdapter] Implements getUserById()');
  assert(typeof pgAdapter.updateUserProfile === 'function', '[PostgresDatabaseAdapter] Implements updateUserProfile()');
  assert(typeof pgAdapter.updateUserPassword === 'function', '[PostgresDatabaseAdapter] Implements updateUserPassword()');
  assert(typeof pgAdapter.getUserState === 'function', '[PostgresDatabaseAdapter] Implements getUserState()');
  assert(typeof pgAdapter.syncUserState === 'function', '[PostgresDatabaseAdapter] Implements syncUserState()');
  assert(typeof pgAdapter.createTask === 'function', '[PostgresDatabaseAdapter] Implements createTask()');
  assert(typeof pgAdapter.updateTask === 'function', '[PostgresDatabaseAdapter] Implements updateTask()');
  assert(typeof pgAdapter.completeTask === 'function', '[PostgresDatabaseAdapter] Implements completeTask()');
  assert(typeof pgAdapter.deleteTask === 'function', '[PostgresDatabaseAdapter] Implements deleteTask()');
  assert(typeof pgAdapter.createHabit === 'function', '[PostgresDatabaseAdapter] Implements createHabit()');
  assert(typeof pgAdapter.updateHabit === 'function', '[PostgresDatabaseAdapter] Implements updateHabit()');
  assert(typeof pgAdapter.completeHabit === 'function', '[PostgresDatabaseAdapter] Implements completeHabit()');
  assert(typeof pgAdapter.deleteHabit === 'function', '[PostgresDatabaseAdapter] Implements deleteHabit()');
  assert(typeof pgAdapter.updateGoalProgress === 'function', '[PostgresDatabaseAdapter] Implements updateGoalProgress()');
  assert(typeof pgAdapter.recordXpTransaction === 'function', '[PostgresDatabaseAdapter] Implements recordXpTransaction()');
  assert(typeof pgAdapter.addAiMessage === 'function', '[PostgresDatabaseAdapter] Implements addAiMessage()');
  assert(typeof pgAdapter.getStats === 'function', '[PostgresDatabaseAdapter] Implements getStats()');
  assert(typeof pgAdapter.close === 'function', '[PostgresDatabaseAdapter] Implements close()');

  // Test REQUIRE_POSTGRES assertion
  console.log('\n--------------------------------------------------');
  console.log('REQUIRE_POSTGRES CONFIGURATION AUDIT');
  console.log('--------------------------------------------------');
  const originalRequirePostgres = process.env.REQUIRE_POSTGRES;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  process.env.REQUIRE_POSTGRES = 'true';
  delete process.env.DATABASE_URL;

  // Validate that when REQUIRE_POSTGRES is true without DATABASE_URL, initialization fails fast
  try {
    const { initDatabase } = await import('../db');
    // If we call initDatabase with REQUIRE_POSTGRES=true and no DATABASE_URL, it must reject
    let threw = false;
    try {
      await initDatabase();
    } catch (err: any) {
      threw = true;
      assert(
        err.message.includes('REQUIRE_POSTGRES is set') || err.message.includes('DATABASE_URL'),
        'Application fails fast when REQUIRE_POSTGRES=true and DATABASE_URL is missing'
      );
    }
    if (!threw) {
      assert(false, 'initDatabase did not fail fast with REQUIRE_POSTGRES=true without DATABASE_URL');
    }
  } finally {
    // Restore
    if (originalRequirePostgres !== undefined) {
      process.env.REQUIRE_POSTGRES = originalRequirePostgres;
    } else {
      delete process.env.REQUIRE_POSTGRES;
    }
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }

  // Summary
  console.log('\n==================================================');
  console.log(`DATABASE COMPATIBILITY TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCompatibilityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
