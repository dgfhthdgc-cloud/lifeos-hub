import { NextBestActionEngine } from '../../lib/nextBestAction';
import { UnifiedActivityTimelineEngine } from '../../lib/activityTimeline';
import { domainBus } from '../../lib/domainBus';
import { Storage } from '../../lib/storage';
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

export async function runPhase6Tests() {
  console.log('==================================================');
  console.log('LIFE OS — PHASE 6: UNIFIED COMMAND CENTER & HUMAN EXPERIENCE');
  console.log('==================================================\n');

  // Reset storage & event bus for clean test environment
  localStorage.clear();
  domainBus.reset();

  // -------------------------------------------------------------
  // TEST GROUP 1: DETERMINISTIC NEXT BEST ACTION ENGINE
  // -------------------------------------------------------------
  console.log('TEST GROUP 1: NextBestActionEngine Deterministic Scoring');

  // Helper for generating consecutive past dates for realistic streak testing
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const habitHistory12Days = Array.from({ length: 12 }, (_, i) => getPastDate(i + 1));

  // Setup sample test state
  const testHabits: HabitItem[] = [
    {
      id: 'hab_deep_work',
      name: 'Deep Work Block',
      description: 'Focus blocks',
      frequency: 'daily',
      target: '90m/day',
      category: 'Productivity',
      difficulty: 'hard',
      xp: 40,
      currentStreak: 12,
      bestStreak: 20,
      history: habitHistory12Days,
      completedToday: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hab_exercise',
      name: 'Zone 2 Cardio',
      description: 'Aerobic fitness',
      frequency: 'daily',
      target: '45m/day',
      category: 'Health',
      difficulty: 'medium',
      xp: 30,
      currentStreak: 5,
      bestStreak: 10,
      history: [new Date().toISOString().split('T')[0]],
      completedToday: true, // already completed
      createdAt: new Date().toISOString(),
    },
  ];

  const testTasks: TaskItem[] = [
    {
      id: 'tsk_arch_doc',
      title: 'Finalize Distributed Systems Architecture Doc',
      dueDate: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      priority: 'high',
      status: 'todo',
      category: 'Engineering',
      tags: ['#arch', '#work'],
      goalId: 'goal_eng_lead',
      xp: 60,
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tsk_low_pri',
      title: 'Tidy up inbox',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'low',
      status: 'todo',
      category: 'Personal',
      tags: ['#admin'],
      xp: 15,
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const testGoals: GoalItem[] = [
    {
      id: 'goal_eng_lead',
      title: 'Achieve Staff Engineer & System Architect Level',
      description: 'Master core infrastructure & distribute consensus',
      category: 'Career & Skills',
      deadline: 'Dec 2026',
      quarter: 'Q3 2026',
      progress: 35,
      xpReward: 500,
      createdAt: new Date().toISOString(),
      milestones: [
        {
          id: 'ms_1',
          goalId: 'goal_eng_lead',
          title: 'Publish Distributed Consensus Whitepaper',
          completed: false,
          order: 1,
          xpReward: 100,
        },
      ],
    },
  ];

  // Save to Storage
  Storage.setHabits(testHabits);
  Storage.setTasks(testTasks);
  Storage.setGoals(testGoals);

  const actions = NextBestActionEngine.computeNextBestActions(5);
  assert(actions.length > 0, 'NextBestActionEngine returns actionable candidates');

  // Verify that an uncompleted high-streak habit receives top urgency priority
  const topAction = actions[0];
  assert(
    topAction.type === 'habit' && topAction.entityId === 'hab_deep_work',
    'Streak-risk habit correctly ranked #1 due to 12-day streak preservation priority'
  );
  assert(topAction.urgency === 'critical', '12-day streak habit marked with critical urgency');
  assert(topAction.streakRisk !== undefined, 'Streak risk metadata populated with hours remaining');
  assert(topAction.why.includes('12-day streak'), 'Action explanation explicitly details streak risk');
  assert(topAction.aiRationale.length > 0, 'AI rationale generated with cognitive justification');

  // Verify task priority and goal linkage
  const taskAction = actions.find((a) => a.entityId === 'tsk_arch_doc');
  assert(taskAction !== undefined, 'High priority task included in recommendations');
  assert(taskAction?.goalId === 'goal_eng_lead', 'Task action retains strategic goal linkage');
  assert(taskAction?.why.includes('Achieve Staff Engineer'), 'Task explanation reflects strategic goal impact');
  assert((taskAction?.bossDamage || 0) > 100, 'High priority task awards amplified Boss Raid damage');

  // -------------------------------------------------------------
  // TEST GROUP 2: UNIFIED ACTIVITY TIMELINE ENGINE
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 2: UnifiedActivityTimelineEngine Cross-Domain Aggregation');

  // Add sample ledger transactions
  Storage.addXpTransaction({ amount: 50, reason: 'Completed distributed consensus review', category: 'task' });
  Storage.addXpTransaction({ amount: 40, reason: 'Daily Deep Work habit checked', category: 'habit' });
  Storage.addXpTransaction({ amount: 100, reason: 'Milestone unlocked: System Whitepaper', category: 'milestone' });
  Storage.addXpTransaction({ amount: 60, reason: 'Completed Transformer Architecture Lesson', category: 'course' });
  Storage.addXpTransaction({ amount: 35, reason: 'Journaled EUR/USD breakout trade', category: 'trading' });

  const timelineEvents = UnifiedActivityTimelineEngine.getTimelineEvents(10);
  assert(timelineEvents.length >= 5, 'Activity timeline aggregated all recent transactions');

  const domains = timelineEvents.map((e) => e.domain);
  assert(domains.includes('execution'), 'Timeline properly classifies execution domain');
  assert(domains.includes('habits'), 'Timeline properly classifies habits domain');
  assert(domains.includes('goals'), 'Timeline properly classifies goals domain');
  assert(domains.includes('learning'), 'Timeline properly classifies learning domain');
  assert(domains.includes('trading'), 'Timeline properly classifies trading domain');

  // Verify chronological ordering
  let isSorted = true;
  for (let i = 0; i < timelineEvents.length - 1; i++) {
    const tA = new Date(timelineEvents[i].timestamp).getTime();
    const tB = new Date(timelineEvents[i + 1].timestamp).getTime();
    if (tA < tB) isSorted = false;
  }
  assert(isSorted, 'Activity events are strictly sorted descending by timestamp');

  // -------------------------------------------------------------
  // TEST GROUP 3: INTENTION -> PLAN -> ACTION -> PROGRESS LOOP
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 3: Complete Human Experience Loop');

  // Step 1: User toggles habit -> Streak increments, XP awarded, Event dispatched
  const habitToggleRes = Storage.toggleHabitDay('hab_deep_work');
  assert(habitToggleRes.habit?.completedToday === true, 'Habit marked completed for today');
  assert(habitToggleRes.habit?.currentStreak === 13, 'Streak safely incremented from 12 to 13');
  assert(habitToggleRes.xpAwarded > 0, 'Authoritative XP awarded for habit completion');

  // Step 2: NextBestActionEngine immediately updates recommendations
  const refreshedActions = NextBestActionEngine.computeNextBestActions(5);
  const refreshedTopAction = refreshedActions[0];
  assert(
    refreshedTopAction.entityId !== 'hab_deep_work',
    'Completed habit is immediately removed from streak risk queue'
  );
  assert(
    refreshedTopAction.entityId === 'tsk_arch_doc',
    'Task with strategic goal dependency promoted to #1 Next Best Action'
  );

  // Step 3: User completes linked task -> Goal unblocked, Boss damaged
  const taskToggleRes = Storage.toggleTask('tsk_arch_doc');
  assert(taskToggleRes.task?.completed === true, 'Task marked completed');
  assert(taskToggleRes.xpAwarded === 60, 'Full task XP recorded into authoritative ledger');

  // Step 4: Verify audit log and activity feed reflection
  const updatedTimeline = UnifiedActivityTimelineEngine.getTimelineEvents(10);
  assert(
    updatedTimeline.some((e) => (e.title || '').includes('Architecture Doc')),
    'Completed task instantly surfaces in Unified Activity Timeline'
  );

  // -------------------------------------------------------------
  // TEST GROUP 4: SYSTEM INTEGRITY & COHERENCE
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 4: System Navigation & Storage Coherence');

  const tasksAfter = Storage.getTasks();
  const habitsAfter = Storage.getHabits();
  const goalsAfter = Storage.getGoals();

  assert(tasksAfter.length === 2, 'Task collection persistence validated');
  assert(habitsAfter.length === 2, 'Habit collection persistence validated');
  assert(goalsAfter.length === 1, 'Goal collection persistence validated');

  console.log('\n==================================================');
  console.log(`PHASE 6 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run if called directly
runPhase6Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
