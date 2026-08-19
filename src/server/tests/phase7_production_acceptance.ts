import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
import { domainBus } from '../../lib/domainBus';
import { Storage } from '../../lib/storage';
import { NextBestActionEngine } from '../../lib/nextBestAction';
import { UnifiedActivityTimelineEngine } from '../../lib/activityTimeline';
import { hashPassword, verifyPassword, generateAuthToken, verifyAuthToken, generatePasswordResetToken, verifyPasswordResetToken } from '../auth';
import { calculateStreakFromDates, getTotalXpForLevel } from '../../lib/gamification';
import { TaskItem, HabitItem, GoalItem } from '../../types';

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

// Mock localStorage in Node.js test environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: 0,
  } as any;
}

export async function runPhase7ProductionAcceptance() {
  console.log('======================================================================');
  console.log('LIFE OS — PHASE 7: PRODUCTION ACCEPTANCE & REAL-WORLD VALIDATION');
  console.log('======================================================================\n');

  const testDbDir = path.join(process.cwd(), '.data_acceptance');
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }
  const testDbPath = path.join(testDbDir, `acceptance_${Date.now()}.sqlite`);
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new SqlDatabaseAdapter(testDbPath);
  await db.initialize();

  // Reset in-memory storage & event bus
  localStorage.clear();
  domainBus.reset();

  try {
    // -------------------------------------------------------------------
    // 1. FULL SYSTEM ACCEPTANCE TEST: BRAND-NEW USER LIFECYCLE
    // -------------------------------------------------------------------
    console.log('1. FULL SYSTEM ACCEPTANCE TEST (Brand-New User Lifecycle)');

    // Step 1: Sign up brand new user
    const newUserEmail = `prod.user.${Date.now()}@lifeos.internal`;
    const { hash, salt } = hashPassword('SecurePass123!');
    const userA = db.createUser(newUserEmail, hash, salt, 'Alex Vance');
    assert(!!userA.id, 'User account provisioned in production database');

    const stateA = db.getUserState(userA.id);
    assert(stateA !== null, 'Initial user database state created on signup');
    assert(stateA.profile.level === 1, 'Initial user level defaults strictly to Level 1');
    assert(stateA.profile.currentXp === 0, 'Initial user starts with 0 XP');
    assert((stateA.profile.streakDays || 0) === 0, 'Initial user starts with 0 streak');
    assert((stateA.profile.tasksCompleted || 0) === 0, 'Initial user starts with 0 completed tasks');

    // Step 2: Create Goal in user state
    const goalItem: GoalItem = {
      id: 'g-prod-1',
      title: 'Master Distributed Systems & AI Infrastructure',
      description: 'Production systems engineering',
      category: 'Career & Skills',
      quarter: 'Q3 2026',
      deadline: '2026-09-30',
      progress: 0,
      xpReward: 500,
      createdAt: new Date().toISOString(),
      milestones: [
        { id: 'ms-prod-1', goalId: 'g-prod-1', title: 'Complete Consensus Engine Module', completed: false, order: 1, xpReward: 150 },
        { id: 'ms-prod-2', goalId: 'g-prod-1', title: 'Deploy Cluster Benchmark', completed: false, order: 2, xpReward: 200 },
      ],
    };
    db.syncUserState(userA.id, { changes: { goals: [goalItem] } });
    const postGoalSync = db.getUserState(userA.id);
    assert(postGoalSync.goals.length === 1, 'Strategic goal synchronized to database');
    assert(postGoalSync.goals[0].progress === 0, 'Goal begins at 0% progress');

    // Step 3: Create Task linked to goal milestone
    const taskCreateRes = db.createTask(userA.id, {
      title: 'Implement Raft Heartbeat Mechanism',
      dueDate: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      priority: 'high',
      status: 'todo',
      category: 'Engineering',
      tags: ['#systems', '#raft'],
      goalId: 'g-prod-1',
      milestoneId: 'ms-prod-1',
      xp: 50,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    assert(taskCreateRes.success && !!taskCreateRes.task.id, 'Prioritized task created with goal milestone linkage');

    // Step 4: Create Habit
    const habitCreateRes = db.createHabit(userA.id, {
      name: 'System Architecture Study',
      description: 'Daily architecture review',
      frequency: 'daily',
      target: '60m/day',
      category: 'Skill',
      difficulty: 'hard',
      xp: 40,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      completedToday: false,
      createdAt: new Date().toISOString(),
    });
    assert(habitCreateRes.success && !!habitCreateRes.habit.id, 'Daily habit created in database');
    assert(habitCreateRes.habit.currentStreak === 0, 'Habit streak begins at 0');

    // Step 5: Complete Task with authoritative progression
    const taskEventId = `evt-task-${Date.now()}`;
    const taskResult = db.completeTask(userA.id, taskCreateRes.task.id, taskEventId);
    assert(taskResult.success && taskResult.task?.completed === true, 'Task transitioned to completed');
    assert((taskResult.profile?.currentXp || 0) === 50, 'Authoritative 50 XP awarded for task completion');

    // Step 6: Complete Habit
    const habitEventId = `evt-habit-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const habitResult = db.completeHabit(userA.id, habitCreateRes.habit.id, todayStr, habitEventId);
    assert(habitResult.success && habitResult.habit?.completedToday === true, 'Habit marked completed for today');
    assert((habitResult.habit?.currentStreak || 0) >= 1, 'Habit streak incremented to 1');
    assert((habitResult.profile?.currentXp || 0) === 90, 'Cumulative XP updated to 90 XP in profile');

    // Step 7: Progress Goal Milestone (automatically awards 150 milestone XP)
    const milestoneRes = db.updateGoalProgress(userA.id, 'g-prod-1', 50, 'ms-prod-1', `evt-ms-${Date.now()}`);
    assert(milestoneRes.success && milestoneRes.goal?.progress === 50, 'Goal progress accurately recalculated to 50%');

    const stateAAfter = db.getUserState(userA.id);
    assert(stateAAfter.profile.currentXp === 240, 'Total user XP equals exactly 50 (task) + 40 (habit) + 150 (milestone) = 240 XP');
    assert(stateAAfter.xpLedger.length === 3, 'Ledger contains exactly 3 authoritative transaction records');

    // -------------------------------------------------------------------
    // 2. FIRST-RUN EXPERIENCE & ZERO-DATA LEAKAGE
    // -------------------------------------------------------------------
    console.log('\n2. FIRST-RUN EXPERIENCE & ZERO-DATA LEAKAGE AUDIT');

    const freshUserEmail = `zero.leakage.${Date.now()}@lifeos.internal`;
    const userFresh = db.createUser(freshUserEmail, hash, salt, 'New Explorer');
    const freshState = db.getUserState(userFresh.id);

    assert(freshState.tasks.length === 0, 'Zero tasks for brand new user');
    assert(freshState.habits.length === 0, 'Zero habits for brand new user');
    assert(freshState.goals.length === 0, 'Zero goals for brand new user');
    assert(freshState.xpLedger.length === 0, 'Zero XP transactions for brand new user');
    assert(freshState.aiHistory.length === 0, 'Zero AI chat messages for brand new user');
    assert(freshState.profile.currentXp === 0, 'Zero XP on fresh profile');
    assert((freshState.profile.streakDays || 0) === 0, 'Zero streak count on fresh profile');

    // -------------------------------------------------------------------
    // 3. 7-DAY REALISTIC USAGE SIMULATION
    // -------------------------------------------------------------------
    console.log('\n3. 7-DAY REALISTIC USAGE SIMULATION');

    const simUserEmail = `sim7day.${Date.now()}@lifeos.internal`;
    const userSim = db.createUser(simUserEmail, hash, salt, 'Simulator');

    const simHabitRes = db.createHabit(userSim.id, {
      name: 'Daily Deep Work',
      description: 'Focus blocks',
      frequency: 'daily',
      target: '90m',
      category: 'Productivity',
      difficulty: 'hard',
      xp: 40,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      completedToday: false,
      createdAt: new Date().toISOString(),
    });

    // Helper for date calculation
    const getDateOffset = (offsetDays: number) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 - offsetDays));
      return d.toISOString().split('T')[0];
    };

    // Day 1: Planning + execution (Task + Habit)
    const d1Task = db.createTask(userSim.id, {
      title: 'D1 Task',
      dueDate: getDateOffset(1),
      category: 'Engineering',
      tags: ['#d1'],
      priority: 'high',
      xp: 50,
      status: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
    });
    db.completeTask(userSim.id, d1Task.task.id, 'evt-d1-task');
    db.completeHabit(userSim.id, simHabitRes.habit.id, getDateOffset(1), 'evt-d1-habit');

    // Day 2: Partial completion (Habit only)
    db.completeHabit(userSim.id, simHabitRes.habit.id, getDateOffset(2), 'evt-d2-habit');

    // Day 3: Missed habit (No habit, Task only)
    const d3Task = db.createTask(userSim.id, {
      title: 'D3 Task',
      dueDate: getDateOffset(3),
      category: 'Engineering',
      tags: ['#d3'],
      priority: 'medium',
      xp: 30,
      status: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
    });
    db.completeTask(userSim.id, d3Task.task.id, 'evt-d3-task');

    // Day 4: Goal Milestone Unlocked
    db.recordXpTransaction(userSim.id, 100, 'Day 4 Milestone', 'milestone', 'evt-d4-milestone');

    // Day 5: Learning activity (Course lesson completed)
    db.recordXpTransaction(userSim.id, 60, 'Day 5 PyTorch Neural Networks Lesson', 'course', 'evt-d5-course');

    // Day 6: Trading / Paper execution journaled
    db.recordXpTransaction(userSim.id, 35, 'Day 6 Paper Trade Journaled', 'trading', 'evt-d6-trade');

    // Day 7: Weekly review + AI Coach message
    db.addAiMessage(userSim.id, {
      id: 'msg-1',
      role: 'user',
      content: 'Analyze my past 7 days of performance',
      timestamp: new Date().toISOString(),
    });
    db.addAiMessage(userSim.id, {
      id: 'msg-2',
      role: 'assistant',
      content: 'Your execution velocity has been strong with 355 XP earned.',
      timestamp: new Date().toISOString(),
    });
    db.recordXpTransaction(userSim.id, 50, 'Day 7 Weekly Review Completed', 'task', 'evt-d7-review');

    const simState = db.getUserState(userSim.id);
    const expectedSimXp = 50 + 40 + 40 + 30 + 100 + 60 + 35 + 50; // = 405 XP
    const ledgerTotalXp = simState.xpLedger.reduce((sum, tx) => sum + tx.amount, 0);
    assert(
      ledgerTotalXp === expectedSimXp,
      `7-Day total XP matches mathematical ledger expectation (${expectedSimXp} XP)`
    );
    assert(simState.profile.level === 2, 'User leveled up to Level 2 based on progression formula');
    assert(simState.aiHistory.length === 2, 'AI conversation history accurately retained 2 messages');
    assert(simState.xpLedger.length === 8, 'Ledger contains all 8 individual daily transactions');

    // -------------------------------------------------------------------
    // 4. TIME / DATE BOUNDARIES & CALCULATION PRECISION
    // -------------------------------------------------------------------
    console.log('\n4. TIME / DATE BOUNDARIES & STREAK DETERMINISM');

    // Test streak calculation across consecutive and broken dates
    const consecutiveDates = ['2026-08-19', '2026-08-18', '2026-08-17', '2026-08-16', '2026-08-15'];
    const streakResult5 = calculateStreakFromDates(consecutiveDates);
    assert(streakResult5.currentStreak === 5, 'Consecutive 5-day history yields 5-day streak');

    const brokenDates = ['2026-08-19', '2026-08-17', '2026-08-16'];
    const streakResultBroken = calculateStreakFromDates(brokenDates);
    assert(streakResultBroken.currentStreak === 1, 'Broken date sequence correctly resets current streak to 1');

    // Progression curve monotonicity
    let previousReqXp = 0;
    let monotonic = true;
    for (let lvl = 1; lvl <= 50; lvl++) {
      const reqXp = getTotalXpForLevel(lvl);
      if (reqXp < previousReqXp) monotonic = false;
      previousReqXp = reqXp;
    }
    assert(monotonic, 'Level XP curve is strictly monotonically increasing across levels 1 to 50');

    // -------------------------------------------------------------------
    // 5. MULTI-DEVICE SIMULATION & CONCURRENT EVENT HANDLING
    // -------------------------------------------------------------------
    console.log('\n5. MULTI-DEVICE SIMULATION & CONCURRENT REPLAY');

    // Simulate Device A and Device B completing different tasks concurrently
    const devTaskA = db.createTask(userA.id, {
      title: 'Device A Action',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Engineering',
      tags: ['#devA'],
      priority: 'medium',
      xp: 25,
      status: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
    });
    const devTaskB = db.createTask(userA.id, {
      title: 'Device B Action',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Engineering',
      tags: ['#devB'],
      priority: 'medium',
      xp: 25,
      status: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
    });

    const resA = db.completeTask(userA.id, devTaskA.task.id, 'evt-device-a-sync-1');
    const resB = db.completeTask(userA.id, devTaskB.task.id, 'evt-device-b-sync-1');

    assert(resA.success && resB.success, 'Concurrent multi-device tasks both completed successfully');

    // Replay Device A event again (simulating duplicate sync packet upon reconnect)
    const replayResA = db.completeTask(userA.id, devTaskA.task.id, 'evt-device-a-sync-1');
    assert(replayResA.alreadyCompleted === true || replayResA.success === true, 'Duplicate sync from Device A is handled idempotently');
    assert(replayResA.version === resA.version, 'Duplicate event returns cached state version without incrementing');

    // -------------------------------------------------------------------
    // 6. MULTI-USER ATTACK & ISOLATION TEST
    // -------------------------------------------------------------------
    console.log('\n6. MULTI-USER ISOLATION & ATTACK SIMULATION');

    const userBEmail = `attacker.user.${Date.now()}@lifeos.internal`;
    const userB = db.createUser(userBEmail, hash, salt, 'Attacker B');

    // Attempt 1: User B tries to complete User A's task
    const userBCompleteTaskRes = db.completeTask(userB.id, taskCreateRes.task.id, 'evt-malicious-task');
    assert(
      !userBCompleteTaskRes.success || userBCompleteTaskRes.error !== undefined,
      'User B completing User A task is strictly rejected'
    );

    // Attempt 2: User B queries state - must NOT see User A's tasks or goals
    const userBState = db.getUserState(userB.id);
    const hasUserATask = userBState.tasks.some((t) => t.id === taskCreateRes.task.id);
    assert(!hasUserATask, 'User A task is completely invisible to User B');

    // -------------------------------------------------------------------
    // 7. OFFLINE QUEUE RECOVERY & CRASH RESTART TEST
    // -------------------------------------------------------------------
    console.log('\n7. OFFLINE QUEUE & CRASH RESTART PERSISTENCE');

    const preCloseState = db.getUserState(userA.id);
    await db.close();

    // Reopen database adapter from persisted file
    const restartedDb = new SqlDatabaseAdapter(testDbPath);
    await restartedDb.initialize();

    const postRestartState = restartedDb.getUserState(userA.id);
    assert(
      postRestartState.profile.currentXp === preCloseState.profile.currentXp,
      'XP state persisted accurately across database crash/restart'
    );
    assert(postRestartState.tasks.length === preCloseState.tasks.length, 'Task collection persisted accurately across restart');
    assert(postRestartState.goals.length === preCloseState.goals.length, 'Goal collection persisted accurately across restart');

    // -------------------------------------------------------------------
    // 8. DATABASE & SYSTEM FAULT TOLERANCE
    // -------------------------------------------------------------------
    console.log('\n8. SYSTEM FAULT TOLERANCE');

    await restartedDb.close();
    let closedDbCaught = false;
    try {
      restartedDb.getUserState(userA.id);
    } catch {
      closedDbCaught = true;
    }
    assert(closedDbCaught, 'Database operations safely fail fast when database is closed');

    // -------------------------------------------------------------------
    // 9. AI FAILURE GRACEFUL DEGRADATION
    // -------------------------------------------------------------------
    console.log('\n9. AI FAILURE GRACEFUL DEGRADATION');

    // Verify NextBestActionEngine computes completely offline without AI connectivity
    const offlineHabits: HabitItem[] = [
      {
        id: 'hab_offline',
        name: 'Daily Hydration & Movement',
        description: 'Hydration habits',
        frequency: 'daily',
        target: '2L',
        category: 'Health',
        difficulty: 'easy',
        xp: 20,
        currentStreak: 10,
        bestStreak: 15,
        history: [],
        completedToday: false,
        createdAt: new Date().toISOString(),
      },
    ];
    Storage.setHabits(offlineHabits);
    Storage.setTasks([]);
    Storage.setGoals([]);

    const computedActionsOffline = NextBestActionEngine.computeNextBestActions(3);
    assert(computedActionsOffline.length > 0, 'NextBestActionEngine functions deterministically without external AI APIs');
    assert(computedActionsOffline[0].entityId === 'hab_offline', 'Streak risk computed correctly in offline mode');

    // -------------------------------------------------------------------
    // 10. EVENT BUS SUBSCRIBER FAILURE ISOLATION
    // -------------------------------------------------------------------
    console.log('\n10. EVENT BUS SUBSCRIBER FAILURE ISOLATION');

    let siblingSubscriberExecuted = false;
    const unsubFailing = domainBus.subscribe(() => {
      throw new Error('Crashing subscriber simulation');
    });
    const unsubSibling = domainBus.subscribe(() => {
      siblingSubscriberExecuted = true;
    });

    const dispatchResult = domainBus.dispatch({
      type: 'task_completed',
      title: 'Test Completed Task',
      entityId: 'tsk_isolation_test',
      userId: userA.id,
      timestamp: new Date().toISOString(),
      xpAmount: 25,
    });

    assert(dispatchResult.errors && dispatchResult.errors.length > 0, 'Subscriber failure is logged without unhandled crash');
    assert(siblingSubscriberExecuted, 'Sibling subscribers continue execution unaffected by rogue subscriber failure');

    // Unsubscribe test listeners to keep clean state
    unsubFailing();
    unsubSibling();

    // -------------------------------------------------------------------
    // 11. AUTOMATION CASCADE & PATHOLOGICAL LOOP PREVENTION
    // -------------------------------------------------------------------
    console.log('\n11. AUTOMATION RECURSION SAFETY');

    const loopEvent = domainBus.dispatch({
      type: 'task_created',
      title: 'Recursive Task Test',
      entityId: 'tsk_recursive',
      userId: userA.id,
      chainDepth: 4, // Exceeds MAX_CHAIN_DEPTH (3)
      timestamp: new Date().toISOString(),
    });

    assert(loopEvent.status === 'loop_suppressed', 'Pathological cascade recursion safely suppressed at depth limit (3)');

    // -------------------------------------------------------------------
    // 12. DATA RECONCILIATION AUDIT
    // -------------------------------------------------------------------
    console.log('\n12. CANONICAL DATA RECONCILIATION');

    // Reopen DB for reconciliation audit
    const auditDb = new SqlDatabaseAdapter(testDbPath);
    await auditDb.initialize();

    const finalState = auditDb.getUserState(userA.id);
    const ledgerSum = finalState.xpLedger.reduce((acc, tx) => acc + tx.amount, 0);
    const profileXp = finalState.profile.currentXp;

    assert(ledgerSum === profileXp, `XP Ledger Sum (${ledgerSum} XP) matches UserProfile XP (${profileXp} XP) with 0 drift`);

    await auditDb.close();

    // -------------------------------------------------------------------
    // 13. SECURITY RELEASE AUDIT
    // -------------------------------------------------------------------
    console.log('\n13. SECURITY RELEASE AUDIT');

    // Verify scrypt key derivation security
    const passCheckGood = verifyPassword('SecurePass123!', hash, salt);
    const passCheckBad = verifyPassword('WrongPassword', hash, salt);
    assert(passCheckGood, 'Password verification accepts correct credentials');
    assert(!passCheckBad, 'Password verification strictly rejects incorrect credentials');

    // Verify JWT/AuthToken signing & tampering rejection
    const validToken = generateAuthToken({ userId: userA.id, email: userA.email });
    const verifiedPayload = verifyAuthToken(validToken);
    assert(verifiedPayload?.userId === userA.id, 'Auth token signature verified successfully');

    const tamperedToken = validToken.substring(0, validToken.length - 5) + 'XXXXX';
    const tamperedPayload = verifyAuthToken(tamperedToken);
    assert(tamperedPayload === null, 'Tampered token is strictly rejected');

    // Password reset token test
    const resetToken = generatePasswordResetToken(userA.id, userA.email, hash);
    const verifiedReset = verifyPasswordResetToken(resetToken, hash);
    assert(verifiedReset !== null && verifiedReset.userId === userA.id, 'Password reset token verified with valid hash');

    // -------------------------------------------------------------------
    // 14. HIGH-VOLUME PERFORMANCE ACCEPTANCE
    // -------------------------------------------------------------------
    console.log('\n14. HIGH-VOLUME PERFORMANCE ACCEPTANCE');

    const perfStart = Date.now();

    // Simulate 500 tasks, 200 habits, 100 goals in memory
    const highVolTasks: TaskItem[] = Array.from({ length: 500 }, (_, i) => ({
      id: `perf-tsk-${i}`,
      title: `Performance Benchmark Task ${i}`,
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Engineering',
      tags: ['#perf'],
      priority: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      status: (i % 2 === 0 ? 'completed' : 'todo') as 'completed' | 'todo',
      xp: 25,
      completed: i % 2 === 0,
      createdAt: new Date().toISOString(),
    }));

    const highVolHabits: HabitItem[] = Array.from({ length: 200 }, (_, i) => ({
      id: `perf-hab-${i}`,
      name: `Performance Habit ${i}`,
      description: `Description ${i}`,
      frequency: 'daily',
      target: '30m',
      category: 'Skill',
      difficulty: 'medium',
      xp: 30,
      currentStreak: i % 20,
      bestStreak: 25,
      history: [],
      completedToday: i % 2 === 0,
      createdAt: new Date().toISOString(),
    }));

    const highVolGoals: GoalItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: `perf-goal-${i}`,
      title: `Strategic Goal ${i}`,
      description: `Strategic Goal Description ${i}`,
      category: 'Performance',
      quarter: 'Q3',
      progress: (i * 7) % 100,
      xpReward: 500,
      createdAt: new Date().toISOString(),
      milestones: [],
    }));

    Storage.setTasks(highVolTasks);
    Storage.setHabits(highVolHabits);
    Storage.setGoals(highVolGoals);

    // Benchmark NextBestAction computation under high volume
    const nbaStart = Date.now();
    const highVolActions = NextBestActionEngine.computeNextBestActions(5);
    const nbaDuration = Date.now() - nbaStart;

    // Benchmark Timeline generation under high volume
    const timelineStart = Date.now();
    const highVolTimeline = UnifiedActivityTimelineEngine.getTimelineEvents(20);
    const timelineDuration = Date.now() - timelineStart;

    const totalPerfTime = Date.now() - perfStart;

    assert(highVolActions.length === 5, 'NextBestActionEngine computes top 5 actions under 800+ entities');
    assert(nbaDuration < 50, `NextBestAction computed in ${nbaDuration}ms (< 50ms target)`);
    assert(timelineDuration < 50, `Timeline generation computed in ${timelineDuration}ms (< 50ms target)`);
    assert(totalPerfTime < 200, `High-volume scenario executed in ${totalPerfTime}ms (< 200ms target)`);

    // Clean up test DB artifacts
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      if (fs.existsSync(testDbDir)) {
        fs.rmSync(testDbDir, { recursive: true, force: true });
      }
    } catch {
      // Cleanup non-blocking
    }

    console.log('\n======================================================================');
    console.log(`PHASE 7 PRODUCTION ACCEPTANCE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 7 Test execution encountered an unhandled error:', err);
    process.exit(1);
  }
}

// Run if called directly
runPhase7ProductionAcceptance().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
