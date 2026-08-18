import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { migrateFromJson } from '../src/server/database/migrator';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/server/database/backup';

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, description: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runPhase2bAudit() {
  console.log('====================================================');
  console.log('LIFEOS HUB — PHASE 2B DATABASE & INTEGRITY AUDIT');
  console.log('====================================================\n');

  const testDbPath = path.join(process.cwd(), '.data', 'lifeos_audit_test.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const adapter = new SqlDatabaseAdapter(testDbPath);
  await adapter.initialize();

  console.log('--- TEST 1: Relational Schema & User Isolation ---');
  const user1 = adapter.createUser('hero@lifeos.internal', 'hash1', 'salt1', 'Commander Alex');
  const user2 = adapter.createUser('shadow@lifeos.internal', 'hash2', 'salt2', 'Shadow Ninja');

  assert(user1.id !== user2.id, 'Distinct user IDs generated');
  assert(user1.profile.name === 'Commander Alex', 'User 1 name set properly');
  assert(user2.profile.name === 'Shadow Ninja', 'User 2 name set properly');

  const u1Found = adapter.getUserByEmail('hero@lifeos.internal');
  assert(u1Found?.id === user1.id, 'User lookup by email returns correct user');

  const state1 = adapter.getUserState(user1.id);
  const state2 = adapter.getUserState(user2.id);
  assert(state1.profile.name === 'Commander Alex', 'User 1 state isolated from User 2');
  assert(state2.profile.name === 'Shadow Ninja', 'User 2 state isolated from User 1');

  console.log('\n--- TEST 2: Task Creation & Transactional Completion ---');
  const taskRes = adapter.createTask(user1.id, {
    title: 'Deploy Production Database',
    description: 'Implement SQL relational database with ACID transactions',
    dueDate: '2026-08-19',
    time: '10:00 AM',
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['database', 'security'],
    xp: 150,
    completed: false,
    createdAt: new Date().toISOString(),
  }, 'client-evt-task-create-1');

  assert(taskRes.success === true, 'Task created successfully');
  assert(taskRes.task.priority === 'high', 'Task priority set correctly');
  assert(taskRes.task.xp === 150, 'Task XP set to 150');

  const initialXp = state1.profile.currentXp;
  const compRes = adapter.completeTask(user1.id, taskRes.task.id, 'client-evt-task-comp-1');

  assert(compRes.success === true, 'Task completed successfully');
  assert(compRes.alreadyCompleted === false, 'First completion is not duplicate');
  assert(compRes.task?.completed === true, 'Task status updated to completed');
  assert(compRes.profile.currentXp === initialXp + 150, 'Authoritative XP awarded: exactly +150');
  assert(compRes.xpTransaction?.amount === 150, 'XP transaction record created with 150 XP');

  console.log('\n--- TEST 3: Idempotency & Replay Protection ---');
  const replayRes = adapter.completeTask(user1.id, taskRes.task.id, 'client-evt-task-comp-1');
  assert(replayRes.success === true, 'Replay with same clientEventId returns cached success');
  assert(replayRes.alreadyCompleted === false, 'Replay returns identical cached result payload');
  const stateAfterReplay = adapter.getUserState(user1.id);
  assert(stateAfterReplay.profile.currentXp === initialXp + 150, 'No extra XP awarded on replayed clientEventId');
  assert(stateAfterReplay.xpLedger.length === 1, 'XP ledger has exactly 1 entry for this event');

  console.log('\n--- TEST 4: Second Completion (Different clientEventId) ---');
  const secondCompRes = adapter.completeTask(user1.id, taskRes.task.id, 'client-evt-task-comp-2');
  assert(secondCompRes.success === true, 'Subsequent completion request acknowledged');
  assert(secondCompRes.alreadyCompleted === true, 'Flagged as alreadyCompleted = true');
  const stateAfterSecond = adapter.getUserState(user1.id);
  assert(stateAfterSecond.profile.currentXp === initialXp + 150, 'Zero additional XP awarded on second attempt');
  assert(stateAfterSecond.xpLedger.length === 1, 'XP ledger unchanged (still 1 entry)');

  console.log('\n--- TEST 5: Habit Completion & Streak Tracking ---');
  const habitRes = adapter.createHabit(user1.id, {
    name: 'Morning Deep Work',
    description: '2 hours uninterrupted coding',
    frequency: 'daily',
    target: '2h',
    category: 'Skill',
    difficulty: 'medium',
    xp: 50,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    completedToday: false,
    createdAt: new Date().toISOString(),
  }, 'client-evt-habit-create-1');

  assert(habitRes.success === true, 'Habit created successfully');
  const habitCompRes = adapter.completeHabit(user1.id, habitRes.habit.id, '2026-08-18', 'client-evt-habit-comp-1');
  assert(habitCompRes.success === true, 'Habit completed');
  assert(habitCompRes.habit?.currentStreak === 1, 'Habit streak increased to 1');
  assert(habitCompRes.habit?.bestStreak === 1, 'Best streak updated to 1');
  assert(habitCompRes.profile.currentXp === initialXp + 150 + 50, 'XP correctly incremented by habit reward');

  console.log('\n--- TEST 6: Habit Duplicate Completion On Same Date ---');
  const habitDupRes = adapter.completeHabit(user1.id, habitRes.habit.id, '2026-08-18', 'client-evt-habit-comp-2');
  assert(habitDupRes.alreadyCompleted === true, 'Habit on same day flagged as already completed');
  const stateAfterHabitDup = adapter.getUserState(user1.id);
  assert(stateAfterHabitDup.profile.currentXp === initialXp + 150 + 50, 'No extra XP awarded for same day habit');

  console.log('\n--- TEST 7: Goal Milestones & Goal Completion XP ---');
  const goalRes = adapter.syncUserState(user1.id, {
    baseVersion: stateAfterHabitDup.version,
    changes: {
      goals: [
        {
          id: 'goal-relational-db',
          title: 'Master Relational Architecture',
          description: 'Ship ACID compliant DB',
          category: 'Career & Skills',
          progress: 50,
          xpReward: 500,
          milestones: [
            { id: 'm1', goalId: 'goal-relational-db', title: 'Design Schema', completed: false, order: 1, xpReward: 100 },
            { id: 'm2', goalId: 'goal-relational-db', title: 'Implement Transactions', completed: false, order: 2, xpReward: 150 },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
  assert(goalRes.conflict === false, 'Goal synced without conflict');

  const m1Res = adapter.updateGoalProgress(user1.id, 'goal-relational-db', 75, 'm1', 'client-evt-goal-m1');
  assert(m1Res.success === true, 'Milestone m1 completed');
  assert(m1Res.profile.currentXp === initialXp + 150 + 50 + 100, 'Milestone XP awarded (+100)');

  const finalGoalRes = adapter.updateGoalProgress(user1.id, 'goal-relational-db', 100, 'm2', 'client-evt-goal-m2');
  assert(finalGoalRes.success === true, 'Goal achieved 100% with milestone m2');
  assert(finalGoalRes.xpTransaction?.amount === 650, 'Goal completion awarded: milestone (+150) + goal reward (+500) = 650 XP');
  const user1FinalState = adapter.getUserState(user1.id);
  const totalXpInLedger = user1FinalState.xpLedger.reduce((sum, tx) => sum + tx.amount, 0);
  assert(totalXpInLedger === 150 + 50 + 100 + 650, 'Total ledger XP strictly matches all server-awarded transactions: 950 XP');

  console.log('\n--- TEST 8: Optimistic Concurrency Conflict Detection ---');
  const staleSyncRes = adapter.syncUserState(user1.id, {
    baseVersion: 1, // Stale version
    changes: { tasks: [] },
  });
  assert(staleSyncRes.conflict === true, 'Stale baseVersion triggers conflict: true');
  assert(staleSyncRes.serverVersion > 1, 'Returns current serverVersion');

  console.log('\n--- TEST 9: Data Migration From JSON ---');
  const migrationSummary = await migrateFromJson(adapter);
  assert(migrationSummary.success === true, 'Migration from users.json executed successfully');
  console.log(`  Migration stats: ${migrationSummary.usersMigrated} users imported.`);

  console.log('\n--- TEST 10: Backup and Recovery ---');
  const backupRes = createDatabaseBackup(testDbPath);
  assert(backupRes.success === true, 'Database backup created successfully');
  assert(typeof backupRes.backupPath === 'string', 'Backup file path returned');
  assert((backupRes.sizeBytes || 0) > 0, 'Backup file has non-zero size');

  const backupFilename = path.basename(backupRes.backupPath!);
  const restoreRes = restoreDatabaseBackup(backupFilename, testDbPath);
  assert(restoreRes.success === true, 'Database backup restored successfully');

  console.log('\n====================================================');
  console.log(`PHASE 2B AUDIT COMPLETE: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED!`);
  console.log('====================================================');

  // Clean up test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

runPhase2bAudit().catch((err) => {
  console.error('Phase 2B Audit Failed:', err);
  process.exit(1);
});
