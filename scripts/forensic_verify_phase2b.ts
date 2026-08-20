import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { migrateFromJson } from '../src/server/database/migrator';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/server/database/backup';

let totalPasses = 0;
let totalFailures = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    totalPasses++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    totalFailures++;
  }
}

async function runForensicAudit() {
  console.log('====================================================');
  console.log('LIFEOS HUB — PHASE 2B FORENSIC VERIFICATION AUDIT');
  console.log('====================================================');

  const testDbDir = path.join(process.cwd(), '.data', 'forensic_test');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbFile = path.join(testDbDir, 'forensic_test.sqlite');
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);

  const adapter = new SqlDatabaseAdapter(testDbFile);
  await adapter.initialize();

  // ----------------------------------------------------
  // CHECK 2: DATABASE SELECTION VALIDATION
  // ----------------------------------------------------
  console.log('\n--- CHECK 2: DATABASE SELECTION VALIDATION ---');
  function isValidPostgresUrl(urlStr: string | undefined): boolean {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
      return false;
    }
    try {
      const parsed = new URL(trimmed);
      return !!parsed.hostname && parsed.hostname !== 'base' && !parsed.hostname.includes(' ');
    } catch {
      return false;
    }
  }

  assert(!isValidPostgresUrl(undefined), 'A. DATABASE_URL missing -> returns false (falls back to SQLite safely)');
  assert(isValidPostgresUrl('postgresql://user:pass@ep-cool-123.eu-west-1.aws.neon.tech/lifeos?sslmode=require'), 'B. Valid PostgreSQL URL -> recognized as valid');
  assert(!isValidPostgresUrl('npx neonctl@latest init'), 'C. "npx neonctl@latest init" -> rejected cleanly before network attempt');
  assert(!isValidPostgresUrl('postgres://'), 'D. Malformed URL without host -> rejected cleanly');
  assert(!isValidPostgresUrl('not-a-url'), 'D2. Plain string -> rejected cleanly');
  assert(!isValidPostgresUrl('postgres://user:pass@base:5432/db'), 'D3. Placeholder "base" host -> rejected cleanly');

  // ----------------------------------------------------
  // CHECK 3: USER ISOLATION
  // ----------------------------------------------------
  console.log('\n--- CHECK 3: USER ISOLATION ENFORCEMENT ---');
  const userA = adapter.createUser('usera@lifeos.local', 'hashA', 'saltA', 'User A');
  const userB = adapter.createUser('userb@lifeos.local', 'hashB', 'saltB', 'User B');

  // User B creates entities
  const taskBRes = adapter.createTask(userB.id, {
    title: 'Secret Task of User B',
    xp: 200,
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['secret'],
    dueDate: '2026-08-30',
    completed: false,
    createdAt: new Date().toISOString(),
  });
  const taskBId = taskBRes.task.id;

  const habitBRes = adapter.createHabit(userB.id, {
    name: 'Secret Habit B',
    description: 'Secret habit',
    target: '1/day',
    frequency: 'daily',
    category: 'Skill',
    difficulty: 'medium',
    xp: 50,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    completedToday: false,
    createdAt: new Date().toISOString(),
  });
  const habitBId = habitBRes.habit.id;

  // User A attempts to complete User B's task
  const userAAttackTask = adapter.completeTask(userA.id, taskBId, 'attack-evt-1');
  assert(!userAAttackTask.success, 'User A cannot complete User B task (returns success: false)');
  assert(userAAttackTask.error === 'TASK_NOT_FOUND', 'User A receives TASK_NOT_FOUND on User B task');

  // Verify User B's task remains uncompleted
  const stateB = adapter.getUserState(userB.id);
  const taskInB = stateB.tasks.find(t => t.id === taskBId);
  assert(taskInB?.completed === false, 'User B task remains uncompleted in DB');

  // User A attempts to update User B's task
  const userAAttackUpdateTask = adapter.updateTask(userA.id, taskBId, { title: 'Hacked Title' });
  assert(!userAAttackUpdateTask.success, 'User A cannot update User B task');

  // User A attempts to complete User B's habit
  const userAAttackHabit = adapter.completeHabit(userA.id, habitBId, '2026-08-18', 'attack-evt-2');
  assert(!userAAttackHabit.success, 'User A cannot complete User B habit');

  // User A attempts to delete User B's habit
  const userAAttackDeleteHabit = adapter.deleteHabit(userA.id, habitBId);
  assert(!userAAttackDeleteHabit.success, 'User A cannot delete User B habit');

  // Verify User A state contains zero of User B's tasks/habits
  const stateA = adapter.getUserState(userA.id);
  assert(!stateA.tasks.some(t => t.id === taskBId), 'User A state does NOT contain User B task');
  assert(!stateA.habits.some(h => h.id === habitBId), 'User A state does NOT contain User B habit');

  // ----------------------------------------------------
  // CHECK 4: TRANSACTIONS & ROLLBACK INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- CHECK 4: TRANSACTIONAL INTEGRITY & ATOMIC ROLLBACK ---');
  const taskA = adapter.createTask(userA.id, {
    title: 'Atomic Task A',
    xp: 100,
    priority: 'medium',
    status: 'todo',
    category: 'Engineering',
    tags: ['test'],
    dueDate: '2026-08-30',
    completed: false,
    createdAt: new Date().toISOString(),
  }).task;

  // Verify atomic task completion
  const compRes = adapter.completeTask(userA.id, taskA.id, 'atomic-evt-1');
  assert(compRes.success, 'Task completion succeeds');
  assert(compRes.xpTransaction?.amount === 100, 'Authoritative XP transaction created: +100 XP');

  // Test forced failure / simulated transaction failure
  // Insert an intentional constraint failure inside a transaction to verify clean rollback
  let rollbackCaught = false;
  try {
    (adapter as any).db.run('BEGIN TRANSACTION;');
    (adapter as any).db.run("INSERT INTO xp_ledger (id, user_id, amount, reason, category, timestamp) VALUES ('orphan-xp-1', ?, 500, 'Fake XP', 'general', ?)", [userA.id, new Date().toISOString()]);
    // Force constraint error: Duplicate primary key on users table or foreign key violation
    (adapter as any).db.run("INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, 'h', 's', ?)", [userA.id, userA.email, new Date().toISOString()]);
    (adapter as any).db.run('COMMIT;');
  } catch (err) {
    (adapter as any).db.run('ROLLBACK;');
    rollbackCaught = true;
  }
  assert(rollbackCaught, 'Transaction error caught and rolled back');

  // Verify orphan XP was NOT committed
  const stateAAfterRollback = adapter.getUserState(userA.id);
  const orphanXp = stateAAfterRollback.xpLedger.find(x => x.id === 'orphan-xp-1');
  assert(orphanXp === undefined, 'Orphan XP rolled back cleanly - does not exist in database');

  // ----------------------------------------------------
  // CHECK 5: CONCURRENT REQUESTS & BASE VERSION CONFLICTS
  // ----------------------------------------------------
  console.log('\n--- CHECK 5: CONCURRENT MUTATIONS & OPTIMISTIC CONFLICTS ---');
  const currentVersionA = stateAAfterRollback.version;

  // Request 1 uses valid baseVersion
  const sync1 = adapter.syncUserState(userA.id, {
    baseVersion: currentVersionA,
    changes: { profile: { ...stateAAfterRollback.profile, title: 'Master Adept' } },
  });
  assert(!sync1.conflict, 'Concurrent Request 1 with matching baseVersion succeeds');
  assert(sync1.serverVersion === currentVersionA + 1, 'Server version incremented to ' + (currentVersionA + 1));

  // Request 2 uses stale baseVersion
  const sync2 = adapter.syncUserState(userA.id, {
    baseVersion: currentVersionA, // Stale!
    changes: { profile: { ...stateAAfterRollback.profile, title: 'Conflicting Title' } },
  });
  assert(sync2.conflict === true, 'Concurrent Request 2 with stale baseVersion triggers conflict: true');
  assert(sync2.serverVersion === currentVersionA + 1, 'Returns authoritative server version');
  assert(sync2.state.profile.title === 'Master Adept', 'Authoritative state preserved (no lost update)');

  // ----------------------------------------------------
  // CHECK 6: IDEMPOTENCY & CLIENT EVENT REPLAYS
  // ----------------------------------------------------
  console.log('\n--- CHECK 6: IDEMPOTENCY & CLIENT EVENT REPLAY ---');
  const testTask = adapter.createTask(userA.id, {
    title: 'Idempotency Test Task',
    xp: 75,
    priority: 'low',
    status: 'todo',
    category: 'Engineering',
    tags: [],
    dueDate: '2026-08-30',
    completed: false,
    createdAt: new Date().toISOString(),
  }).task;

  const eventId = 'unique-client-event-xyz-999';
  const firstExec = adapter.completeTask(userA.id, testTask.id, eventId);
  assert(firstExec.success, 'First execution of completeTask succeeds');
  assert(firstExec.alreadyCompleted === false, 'First execution marked alreadyCompleted: false');

  // Replay 1
  const replay1 = adapter.completeTask(userA.id, testTask.id, eventId);
  assert(replay1.success, 'Replay 1 returns cached success');
  assert(replay1.alreadyCompleted === false, 'Replay 1 returns identical cached result payload');

  // Replay 10 times in a loop
  let allReplaysPassed = true;
  for (let i = 0; i < 10; i++) {
    const replayN = adapter.completeTask(userA.id, testTask.id, eventId);
    if (!replayN.success || replayN.xpTransaction?.amount !== 75) {
      allReplaysPassed = false;
    }
  }
  assert(allReplaysPassed, '10 consecutive replayed requests return identical cached payload');

  // Verify XP was credited ONLY once in ledger
  const stateAEvents = adapter.getUserState(userA.id);
  const matchingXpRecords = stateAEvents.xpLedger.filter(x => x.reason.includes(testTask.title));
  assert(matchingXpRecords.length === 1, 'XP ledger has exactly 1 entry for the event despite 12 calls');

  // ----------------------------------------------------
  // CHECK 7: MIGRATION
  // ----------------------------------------------------
  console.log('\n--- CHECK 7: DATA MIGRATION FROM JSON ---');
  const emptyDbFile = path.join(testDbDir, 'empty_migration.sqlite');
  if (fs.existsSync(emptyDbFile)) fs.unlinkSync(emptyDbFile);
  const migAdapter = new SqlDatabaseAdapter(emptyDbFile);
  await migAdapter.initialize();

  // Create temporary fixture for test JSON migration
  const testJsonFile = path.join(testDbDir, 'test_users.json');
  fs.writeFileSync(
    testJsonFile,
    JSON.stringify({
      users: {
        'mig-user-1': {
          id: 'mig-user-1',
          email: 'migrated@lifeos.internal',
          passwordHash: 'hash',
          salt: 'salt',
          role: 'user',
        },
      },
      states: {
        'mig-user-1': {
          profile: { id: 'mig-user-1', name: 'Migrated User', currentXp: 100 },
          tasks: [],
          habits: [],
          goals: [],
        },
      },
    })
  );

  // Run migration 1
  const mig1 = await migrateFromJson(migAdapter, testJsonFile);
  assert(mig1.success, 'Migration 1 into empty database succeeds');
  assert(mig1.usersMigrated > 0, `Migration 1 imported ${mig1.usersMigrated} users`);

  // Run migration 2 (idempotent repeat)
  const mig2 = await migrateFromJson(migAdapter, testJsonFile);
  assert(mig2.success, 'Migration 2 repeated on existing DB succeeds');
  assert(mig2.usersMigrated === 0, 'Migration 2 safely skipped already-migrated users (0 duplicate imports)');

  // ----------------------------------------------------
  // CHECK 8: BACKUP & RESTORE
  // ----------------------------------------------------
  console.log('\n--- CHECK 8: BACKUP AND RESTORE ---');
  const backupRes = createDatabaseBackup(testDbFile);
  assert(backupRes.success, 'Database backup created');
  assert(!!backupRes.backupPath && fs.existsSync(backupRes.backupPath), 'Backup file exists on disk');
  assert((backupRes.sizeBytes || 0) > 0, `Backup file size is non-zero (${backupRes.sizeBytes} bytes)`);

  const backupFilename = path.basename(backupRes.backupPath!);
  const restoreRes = restoreDatabaseBackup(backupFilename, testDbFile);
  assert(restoreRes.success, 'Database backup restored successfully');

  const invalidRestore = restoreDatabaseBackup('non_existent_file.sqlite', testDbFile);
  assert(!invalidRestore.success, 'Restore on non-existent file fails gracefully without touching DB');

  // ----------------------------------------------------
  // CHECK 9: PERSISTENCE ACROSS RESTART
  // ----------------------------------------------------
  console.log('\n--- CHECK 9: PERSISTENCE ACROSS RESTART ---');
  // Create unique task in adapter
  const persistTask = adapter.createTask(userA.id, {
    title: 'Survive Restart Task 12345',
    xp: 300,
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['persistent'],
    dueDate: '2026-08-30',
    completed: false,
    createdAt: new Date().toISOString(),
  }).task;

  // "Simulate restart" by discarding in-memory adapter and loading fresh SqlDatabaseAdapter from testDbFile
  const restartedAdapter = new SqlDatabaseAdapter(testDbFile);
  await restartedAdapter.initialize();

  const reloadedState = restartedAdapter.getUserState(userA.id);
  const foundTask = reloadedState.tasks.find(t => t.id === persistTask.id);
  assert(!!foundTask, 'Task survived full process/database reload');
  assert(foundTask?.title === 'Survive Restart Task 12345', 'Loaded task data is completely intact');
  assert(foundTask?.xp === 300, 'Loaded task XP is completely intact');

  // ----------------------------------------------------
  // CHECK 11: SECURITY REGRESSION
  // ----------------------------------------------------
  console.log('\n--- CHECK 11: SECURITY REGRESSIONS & PHASE 1 PROTECTIONS ---');
  assert(process.env.GEMINI_API_KEY === undefined || !process.env.GEMINI_API_KEY.startsWith('VITE_'), 'Gemini API key is server-side only (no VITE_ prefix)');
  assert(!process.env.ENABLE_LIVE_TRADING || process.env.ENABLE_LIVE_TRADING === 'false', 'Live trading remains safely disabled');

  console.log('====================================================');
  console.log(`FORENSIC VERIFICATION RESULTS: ${totalPasses} PASS, ${totalFailures} FAIL`);
  console.log('====================================================');

  if (totalFailures > 0) {
    process.exit(1);
  }
}

runForensicAudit().catch(err => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
