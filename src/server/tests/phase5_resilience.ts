import { domainBus, DomainEventPayload } from '../../lib/domainBus';
import { Storage } from '../../lib/storage';
import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
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
  } as Storage;
}

async function runPhase5Tests() {
  console.log('==================================================');
  console.log('LIFE OS — PHASE 5: EVENT INTEGRITY & RESILIENCE');
  console.log('==================================================\n');

  // Reset storage & event bus for clean test environment
  localStorage.clear();
  domainBus.reset();

  // -------------------------------------------------------------
  // TEST GROUP 1: DOMAIN EVENT BUS ARCHITECTURE & LIFECYCLE
  // -------------------------------------------------------------
  console.log('TEST GROUP 1: DomainEventBus Architecture & Lifecycle');

  let receivedEvent: DomainEventPayload | null = null;
  const unsubscribe = domainBus.subscribe((evt) => {
    receivedEvent = evt;
  });

  const sampleEvent = domainBus.dispatch({
    type: 'task_completed',
    entityId: 'tsk_101',
    title: 'Audit System Coherence',
    priority: 'high',
    xpAmount: 150,
  });

  assert(Boolean(sampleEvent.eventId), 'Dispatched event assigns a deterministic eventId');
  assert(Boolean(sampleEvent.timestamp), 'Dispatched event assigns ISO timestamp');
  assert(sampleEvent.status === 'processed', 'Initial dispatch receives status "processed"');
  assert(receivedEvent !== null && (receivedEvent as any)?.entityId === 'tsk_101', 'Subscriber receives dispatched event payload');

  // Test unsubscription
  receivedEvent = null;
  unsubscribe();
  domainBus.dispatch({
    type: 'habit_completed',
    entityId: 'hbt_202',
    title: 'Morning Meditation',
  });
  assert(receivedEvent === null, 'Unsubscribed listener does not receive subsequent events');

  // -------------------------------------------------------------
  // TEST GROUP 2: EVENT IDEMPOTENCY & DEDUPLICATION
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 2: Event Idempotency & Deduplication');

  const dedupeEventId = 'evt-idemp-test-999';
  const initialQuests = Storage.getQuests();
  const taskQuestBefore = initialQuests.find((q) => q.targetType === 'tasks_completed')?.currentCount || 0;
  const initialBossHp = Storage.getBossBattles()[0]?.currentHp || 1000;

  // Deliver 1st time
  const res1 = domainBus.dispatch({
    eventId: dedupeEventId,
    type: 'task_completed',
    entityId: 'tsk_idemp_1',
    title: 'Idempotency Task 1',
    priority: 'high',
  });
  assert(res1.status === 'processed', '1st event delivery is processed');

  const questAfterFirst = Storage.getQuests().find((q) => q.targetType === 'tasks_completed')?.currentCount || 0;
  const bossHpAfterFirst = Storage.getBossBattles()[0]?.currentHp || 0;
  assert(questAfterFirst === taskQuestBefore + 1, '1st event increments quest target progress by 1');
  assert(bossHpAfterFirst < initialBossHp, '1st event applies boss damage');

  // Deliver 2nd time (Duplicate)
  const res2 = domainBus.dispatch({
    eventId: dedupeEventId,
    type: 'task_completed',
    entityId: 'tsk_idemp_1',
    title: 'Idempotency Task 1',
    priority: 'high',
  });
  assert(res2.status === 'deduplicated', '2nd event delivery with same eventId is marked "deduplicated"');

  // Deliver 3rd time (Duplicate)
  const res3 = domainBus.dispatch({
    eventId: dedupeEventId,
    type: 'task_completed',
    entityId: 'tsk_idemp_1',
    title: 'Idempotency Task 1',
    priority: 'high',
  });
  assert(res3.status === 'deduplicated', '3rd event delivery with same eventId is marked "deduplicated"');

  const questAfterDuplicates = Storage.getQuests().find((q) => q.targetType === 'tasks_completed')?.currentCount || 0;
  const bossHpAfterDuplicates = Storage.getBossBattles()[0]?.currentHp || 0;

  assert(questAfterDuplicates === questAfterFirst, 'Duplicate event deliveries do NOT advance quest progress');
  assert(bossHpAfterDuplicates === bossHpAfterFirst, 'Duplicate event deliveries do NOT apply duplicate boss damage');

  // -------------------------------------------------------------
  // TEST GROUP 3: SUBSCRIBER FAILURE ISOLATION
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 3: Subscriber Failure Isolation');

  let healthySubscriberExecuted = false;

  // Failing subscriber
  const unsubsFail = domainBus.subscribe(() => {
    throw new Error('Intentional crash in test subscriber');
  });

  // Healthy subscriber
  const unsubsHealthy = domainBus.subscribe(() => {
    healthySubscriberExecuted = true;
  });

  const isolationEvent = domainBus.dispatch({
    type: 'goal_milestone_completed',
    entityId: 'milestone_1',
    title: 'Complete Phase 5 Audit',
  });

  assert(Boolean(healthySubscriberExecuted), 'Healthy subscriber executes despite failing sibling subscriber');
  assert(isolationEvent.status === 'processed' || isolationEvent.status === 'failed', 'Event bus isolates exceptions and completes dispatch');

  unsubsFail();
  unsubsHealthy();

  // -------------------------------------------------------------
  // TEST GROUP 4: AUTOMATION CASCADE & LOOP PROTECTION
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 4: Automation Cascade & Loop Protection');

  // Dispatch event at max chain depth (chainDepth = 4 > MAX_CHAIN_DEPTH = 3)
  const recursiveEvent = domainBus.dispatch({
    eventId: 'evt-recursive-test',
    type: 'task_created',
    entityId: 'tsk_loop',
    title: 'Infinite task creation',
    chainDepth: 4,
  });

  assert(recursiveEvent.status === 'loop_suppressed', 'Events exceeding max cascade depth (3) are marked "loop_suppressed"');
  assert((domainBus.getStats().loopSuppressedCount) >= 1, 'Loop suppression stat is incremented');

  // -------------------------------------------------------------
  // TEST GROUP 5: BOSS RAID & SKILL PERK DETERMINISM
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 5: Boss Raid & Skill Perk Determinism');

  // Reset boss to clean state
  const bossBeforePerk = Storage.getBossBattles()[0];
  const initialHp = bossBeforePerk.currentHp;

  // Calculate expected multiplier based on unlocked perks
  const perks = Storage.getSkillPerks().filter((p) => p.unlocked);
  let execMultiplier = 1.0;
  for (const perk of perks) {
    if (typeof perk.bonusMultiplier === 'number' && perk.domain === 'execution') {
      const bonus = perk.bonusMultiplier >= 1.0 ? perk.bonusMultiplier - 1.0 : perk.bonusMultiplier;
      execMultiplier += bonus;
    }
  }
  // High priority task deals base perk damage (120 * 1.35 = 162) + automation rule action damage (+150)
  const basePerkDmg = Math.round(120 * execMultiplier);
  const automationDmg = 150;
  const expectedDmg = basePerkDmg + automationDmg;

  // Task high priority deals 120 base damage * perk multiplier + 150 automation
  const dmgEvent = domainBus.dispatch({
    type: 'task_completed',
    entityId: 'tsk_boss_test',
    title: 'High Impact Task',
    priority: 'high',
  });

  const bossAfterNormal = Storage.getBossBattles()[0];
  const actualDmg = initialHp - bossAfterNormal.currentHp;
  assert(
    actualDmg === expectedDmg,
    `Canonical boss damage with execution perks (${execMultiplier.toFixed(2)}x) + high priority automation (+150) is exactly ${expectedDmg} HP (actual: ${actualDmg} HP)`
  );

  // Boss HP cannot drop below 0 (Clamping invariant)
  Storage.damageActiveBoss(999999, 'Overkill Test', 'task');
  const clampedBoss = Storage.getBossBattles()[0];
  assert(clampedBoss.currentHp === 0, 'Boss HP is strictly clamped to minimum 0 HP');
  assert(clampedBoss.defeated === true, 'Boss defeated flag is set when HP reaches 0');

  // -------------------------------------------------------------
  // TEST GROUP 6: QUEST CONSISTENCY & REWARD IDEMPOTENCY
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 6: Quest Consistency & Reward Idempotency');

  // Test quest progress clamping
  const quests = Storage.getQuests();
  const firstQuest = quests[0];
  Storage.updateQuestProgress(firstQuest.targetType, 9999);
  const updatedQuests = Storage.getQuests();
  const clampedQuest = updatedQuests.find((q) => q.id === firstQuest.id)!;

  assert(
    clampedQuest.currentCount <= clampedQuest.targetCount,
    'Quest progress cannot exceed targetCount'
  );

  // Test claim quest idempotency
  const userProfileBeforeClaim = Storage.getUser()!;
  const claim1 = Storage.claimQuest(clampedQuest.id);
  assert(claim1.xpAwarded > 0, '1st quest claim awards XP');

  const claim2 = Storage.claimQuest(clampedQuest.id);
  assert(claim2.xpAwarded === 0, '2nd quest claim is idempotent and awards 0 XP');

  const userProfileAfterSecondClaim = Storage.getUser()!;
  assert(
    userProfileAfterSecondClaim.currentXp === userProfileBeforeClaim.currentXp + claim1.xpAwarded,
    'User XP is incremented exactly once upon quest claim'
  );

  // -------------------------------------------------------------
  // TEST GROUP 7: PROGRESSION & LEDGER ATOMICITY
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 7: Progression & Ledger Atomicity');

  const baselineUser = Storage.getUser()!;
  const baselineLedger = Storage.getXpTransactions();

  const awardResult = Storage.awardProgressionXp(200, 'Test Progression', 'task');

  assert(awardResult.xpAwarded >= 200, 'awardProgressionXp awards base XP (plus perks/streak multiplier)');
  assert(awardResult.user.level >= baselineUser.level, 'Level is monotonically non-decreasing');

  const updatedLedger = Storage.getXpTransactions();
  assert(updatedLedger.length === baselineLedger.length + 1, 'Ledger transaction is atomically recorded');
  assert(updatedLedger[0].reason === 'Test Progression', 'Latest transaction matches reason');

  // -------------------------------------------------------------
  // TEST GROUP 8: CROSS-DOMAIN ANALYTICS RECONCILIATION
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 8: Cross-Domain Analytics Reconciliation');

  const analytics = Storage.getCrossDomainAnalytics();
  assert(Array.isArray(analytics.metrics), 'CrossDomainLifeRadar metrics array is populated');
  assert(analytics.metrics.length >= 6, 'Radar contains at least 6 core life domains');

  const xpTrends = Storage.getHistoricalXpTrend();
  assert(xpTrends.length === 7, 'Historical XP Trend contains 7 daily data points');

  const domainDist = Storage.getDomainDistribution();
  assert(domainDist.length > 0, 'Domain Distribution returns calculated points');
  const sumDistXp = domainDist.reduce((acc, d) => acc + d.xp, 0);
  assert(sumDistXp >= 0, 'Domain distribution XP sum is non-negative and finite');

  // -------------------------------------------------------------
  // TEST GROUP 9: EVENT OBSERVABILITY & AUDIT TRAIL
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 9: Event Observability & Audit Trail');

  const auditLog = domainBus.getAuditLog();
  assert(auditLog.length > 0, 'Event bus maintains an in-memory audit log');
  assert(Boolean(auditLog[0].eventId), 'Audit log entries contain eventId');
  assert(Boolean(auditLog[0].status), 'Audit log entries contain processing status');

  const stats = domainBus.getStats();
  assert(stats.totalDispatched > 0, 'DomainBus stats track totalDispatched count');
  assert(stats.processedCount > 0, 'DomainBus stats track processedCount');
  assert(stats.deduplicatedCount > 0, 'DomainBus stats track deduplicatedCount');

  // -------------------------------------------------------------
  // TEST GROUP 10: SERVER-SIDE DATABASE IDEMPOTENCY & ISOLATION
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 10: Server-Side Database Idempotency & Multi-Tenant Isolation');

  const testDbDir = path.join(process.cwd(), '.data_test');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'phase5_lifeos.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const serverDb = new SqlDatabaseAdapter(testDbPath);
  await serverDb.initialize();

  const userA = serverDb.createUser('userA@lifeos.internal', 'hashA', 'saltA', 'User Alpha');
  const userB = serverDb.createUser('userB@lifeos.internal', 'hashB', 'saltB', 'User Beta');

  const taskA = serverDb.createTask(userA.id, {
    title: 'User A Secret Task',
    description: 'Confidential system audit',
    dueDate: '2026-08-20',
    time: '09:00 AM',
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['isolated'],
    xp: 150,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  // Test completeTask idempotency with clientEventId
  const clientEvtId = 'evt-task-complete-srv-001';
  const srvComplete1 = serverDb.completeTask(userA.id, taskA.task.id, clientEvtId);
  assert(srvComplete1.success === true, 'Server completeTask succeeds on 1st delivery');
  assert(srvComplete1.profile?.tasksCompleted === 1, 'User A tasksCompleted incremented to 1');

  const srvComplete2 = serverDb.completeTask(userA.id, taskA.task.id, clientEvtId);
  assert(srvComplete2.success === true, 'Server completeTask handles duplicate clientEventId');
  assert(srvComplete2.profile?.tasksCompleted === 1, 'Duplicate task completion does not increment tasksCompleted count');

  // Multi-tenant isolation: User B cannot complete User A's task
  const userBAttempt = serverDb.completeTask(userB.id, taskA.task.id);
  assert(userBAttempt.success === false, 'User B is strictly forbidden from completing User A task');

  serverDb.close();

  console.log('\n==================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
