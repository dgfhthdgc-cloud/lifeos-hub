import {
  AchievementBadge,
  QuestItem,
  StreakSystemData,
  XpTransaction,
  LevelRankInfo,
} from '../types';

// -------------------------------------------------------------
// 1. NON-LINEAR LEVEL & XP SCALING (LEVELS 1 TO 100)
// -------------------------------------------------------------

export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 400;
  // Non-linear progression curve
  return Math.round(350 * Math.pow(level, 1.28) + 50 * level);
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getXpRequiredForLevel(l);
  }
  return total;
}

export const LEVEL_RANKS: LevelRankInfo[] = [
  {
    level: 1,
    title: 'Initiate Apprentice',
    tierName: 'Bronze Tier',
    tierColor: 'from-amber-700 to-amber-900',
    minXp: 0,
    maxXp: 400,
    perks: ['Basic Task & Habit tracking', 'Daily Quest access'],
  },
  {
    level: 5,
    title: 'Disciplined Operator',
    tierName: 'Bronze Elite',
    tierColor: 'from-amber-600 to-amber-800',
    minXp: 2100,
    maxXp: 3200,
    perks: ['+5% Streak XP Multiplier', 'Unlock Streak Freeze Shield slot 1'],
  },
  {
    level: 10,
    title: 'Tactical Specialist',
    tierName: 'Silver Tier',
    tierColor: 'from-slate-400 to-slate-600',
    minXp: 7200,
    maxXp: 9000,
    perks: ['Weekly Operations Quest Matrix', '+10% Habit Compounding XP'],
  },
  {
    level: 15,
    title: 'Systems Architect',
    tierName: 'Silver Vanguard',
    tierColor: 'from-slate-300 to-slate-500',
    minXp: 14500,
    maxXp: 17500,
    perks: ['Advanced Replay Analysis', '+15% Quest XP Multiplier'],
  },
  {
    level: 20,
    title: 'Strategic Polymath',
    tierName: 'Gold Tier',
    tierColor: 'from-yellow-400 to-amber-600',
    minXp: 24000,
    maxXp: 28000,
    perks: ['Unlock Streak Freeze Shield slot 2', 'Priority AI Coach Strategy blocks'],
  },
  {
    level: 30,
    title: 'Discipline Master',
    tierName: 'Gold Paragon',
    tierColor: 'from-amber-400 to-yellow-600',
    minXp: 48000,
    maxXp: 54000,
    perks: ['+25% All XP Multiplier', 'Custom Habit Category Mastery Badges'],
  },
  {
    level: 40,
    title: 'Cognitive Sovereign',
    tierName: 'Platinum Tier',
    tierColor: 'from-cyan-400 to-blue-600',
    minXp: 82000,
    maxXp: 90000,
    perks: ['Autonomous Schedule Optimizer', 'Epic Multi-Year Roadmap Insights'],
  },
  {
    level: 50,
    title: 'Grandmaster of Execution',
    tierName: 'Diamond Tier',
    tierColor: 'from-blue-400 to-indigo-600',
    minXp: 128000,
    maxXp: 140000,
    perks: ['Unlock Max Shield Slot 3', 'Lifetime Hall of Fame Emblem'],
  },
  {
    level: 75,
    title: 'Elite Luminary',
    tierName: 'Diamond Master',
    tierColor: 'from-indigo-400 to-purple-600',
    minXp: 280000,
    maxXp: 300000,
    perks: ['+50% Global XP Multiplier', 'Mythic Quest Access'],
  },
  {
    level: 100,
    title: 'Transcendent Paragon',
    tierName: 'Mythic Sovereign',
    tierColor: 'from-fuchsia-500 via-rose-500 to-amber-400',
    minXp: 500000,
    maxXp: 600000,
    perks: ['Ultimate Polymath Ascendancy', 'Unrestricted Golden Avatar Frame'],
  },
];

export function getRankInfo(level: number): LevelRankInfo {
  for (let i = LEVEL_RANKS.length - 1; i >= 0; i--) {
    if (level >= LEVEL_RANKS[i].level) {
      return LEVEL_RANKS[i];
    }
  }
  return LEVEL_RANKS[0];
}

export function calculateProgression(totalLifetimeXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  rankInfo: LevelRankInfo;
  totalLifetimeXp: number;
} {
  let level = 1;
  let remainingXp = totalLifetimeXp;
  let xpForNext = getXpRequiredForLevel(level);

  while (remainingXp >= xpForNext && level < 100) {
    remainingXp -= xpForNext;
    level += 1;
    xpForNext = getXpRequiredForLevel(level);
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((remainingXp / xpForNext) * 100)));
  const rankInfo = getRankInfo(level);

  return {
    level,
    currentLevelXp: remainingXp,
    nextLevelXp: xpForNext,
    progressPercent,
    rankInfo,
    totalLifetimeXp,
  };
}

// -------------------------------------------------------------
// 2. STREAK MULTIPLIER & SHIELD SYSTEM
// -------------------------------------------------------------

export function calculateStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return 2.0;
  if (streakDays >= 60) return 1.5;
  if (streakDays >= 30) return 1.35;
  if (streakDays >= 14) return 1.2;
  if (streakDays >= 7) return 1.1;
  return 1.0;
}

/**
 * Calculates accurate calendar day streaks from an array of completion dates (ISO or YYYY-MM-DD).
 * Handles timezone shifts, duplicate same-day completions, missed days, and active status.
 */
export function calculateStreakFromDates(historyDates: string[]): { currentStreak: number; bestStreak: number } {
  if (!historyDates || historyDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(
    new Set(
      historyDates
        .map((d) => (d ? d.split('T')[0] : ''))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    )
  ).sort().reverse();

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yDay = new Date(now);
  yDay.setDate(yDay.getDate() - 1);
  const yesterdayStr = `${yDay.getFullYear()}-${String(yDay.getMonth() + 1).padStart(2, '0')}-${String(yDay.getDate()).padStart(2, '0')}`;

  const dateSet = new Set(uniqueDates);

  let currentStreak = 0;
  let checkDate = new Date(now);

  if (!dateSet.has(todayStr)) {
    if (dateSet.has(yesterdayStr)) {
      checkDate = new Date(yDay);
    } else {
      checkDate = null as unknown as Date;
    }
  }

  if (checkDate) {
    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const s = `${y}-${m}-${d}`;
      if (dateSet.has(s)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best all-time continuous consecutive run
  let bestStreak = 0;
  const ascending = [...uniqueDates].sort();
  let currentRun = 0;
  let prevUtcTime: number | null = null;

  for (const dateString of ascending) {
    const [year, month, day] = dateString.split('-').map(Number);
    const currUtcTime = Date.UTC(year, month - 1, day);

    if (prevUtcTime === null) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((currUtcTime - prevUtcTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    prevUtcTime = currUtcTime;
    if (currentRun > bestStreak) {
      bestStreak = currentRun;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}

export const INITIAL_STREAK_DATA: StreakSystemData = {
  currentStreak: 0,
  bestStreak: 0,
  streakShields: 0,
  maxShields: 3,
  multiplier: 1.0,
  freezeActive: false,
  lastActiveDate: new Date().toISOString().split('T')[0],
  milestones: [
    {
      days: 7,
      title: '7-Day Ignition',
      reached: false,
      xpReward: 150,
      perkDescription: '+10% XP Multiplier Unlocked',
    },
    {
      days: 14,
      title: 'Fortnight Fortitude',
      reached: false,
      xpReward: 300,
      perkDescription: '+20% XP Multiplier + 1 Shield Refill',
    },
    {
      days: 30,
      title: 'Monthly Mastery',
      reached: false,
      xpReward: 750,
      perkDescription: '+35% XP Multiplier + Silver Badge',
    },
    {
      days: 60,
      title: 'Habit Automatization',
      reached: false,
      xpReward: 1500,
      perkDescription: '+50% XP Multiplier + Gold Badge',
    },
    {
      days: 100,
      title: 'Centurion of Consistency',
      reached: false,
      xpReward: 3000,
      perkDescription: '2.0x Double XP Active + Diamond Crest',
    },
    {
      days: 365,
      title: 'Solar Orbit Sovereign',
      reached: false,
      xpReward: 10000,
      perkDescription: 'Mythic Ascendancy Badge + Permanent Shield',
    },
  ],
};

// -------------------------------------------------------------
// 3. INITIAL QUESTS MATRIX (DAILY, WEEKLY, EPIC)
// -------------------------------------------------------------

export const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'qst-daily-1',
    title: 'High-Impact Execution',
    description: 'Complete at least 3 tasks from your daily planner schedule.',
    category: 'daily',
    targetType: 'tasks_completed',
    targetCount: 3,
    currentCount: 0,
    xpReward: 80,
    claimed: false,
    expiresAt: 'Tonight, 11:59 PM',
    iconName: 'CheckSquare',
  },
  {
    id: 'qst-daily-2',
    title: 'Routine Mastery',
    description: 'Check in on 3 daily habits to compound your consistency.',
    category: 'daily',
    targetType: 'habits_checked',
    targetCount: 3,
    currentCount: 0,
    xpReward: 60,
    claimed: false,
    expiresAt: 'Tonight, 11:59 PM',
    iconName: 'Flame',
  },
  {
    id: 'qst-daily-3',
    title: 'Deep Learning Intake',
    description: 'Complete 1 interactive lesson or practice flashcard drill.',
    category: 'daily',
    targetType: 'learning_lessons',
    targetCount: 1,
    currentCount: 0,
    xpReward: 75,
    claimed: false,
    expiresAt: 'Tonight, 11:59 PM',
    iconName: 'BookOpen',
  },
  {
    id: 'qst-daily-4',
    title: 'XP Surge Target',
    description: 'Accumulate 150+ XP across all activities today.',
    category: 'daily',
    targetType: 'xp_earned',
    targetCount: 150,
    currentCount: 0,
    xpReward: 100,
    claimed: false,
    expiresAt: 'Tonight, 11:59 PM',
    iconName: 'Zap',
  },
  // Weekly Quests
  {
    id: 'qst-weekly-1',
    title: 'Weekly Power Sprint',
    description: 'Conquer 15 scheduled tasks throughout the current week.',
    category: 'weekly',
    targetType: 'tasks_completed',
    targetCount: 15,
    currentCount: 0,
    xpReward: 350,
    claimed: false,
    expiresAt: 'Sunday, 11:59 PM',
    iconName: 'Target',
  },
  {
    id: 'qst-weekly-2',
    title: 'Unbroken Discipline',
    description: 'Maintain your active daily streak for all 7 days of the week.',
    category: 'weekly',
    targetType: 'streak_maintained',
    targetCount: 7,
    currentCount: 0,
    xpReward: 400,
    claimed: false,
    expiresAt: 'Sunday, 11:59 PM',
    iconName: 'ShieldCheck',
  },
  {
    id: 'qst-weekly-3',
    title: 'Strategic Milestone Advance',
    description: 'Complete at least 1 milestone on any long-term goal.',
    category: 'weekly',
    targetType: 'goals_milestone',
    targetCount: 1,
    currentCount: 0,
    xpReward: 300,
    claimed: false,
    expiresAt: 'Sunday, 11:59 PM',
    iconName: 'Award',
  },
  // Epic Quests
  {
    id: 'qst-epic-1',
    title: 'Century of Output',
    description: 'Successfully complete 100 lifetime tasks in LIFE OS.',
    category: 'epic',
    targetType: 'tasks_completed',
    targetCount: 100,
    currentCount: 0,
    xpReward: 1500,
    claimed: false,
    expiresAt: 'Permanent',
    iconName: 'Crown',
    badgeRewardId: 'bdg-centurion',
  },
  {
    id: 'qst-epic-2',
    title: 'Habitual Compounder',
    description: 'Log 250 habit completions across all routine categories.',
    category: 'epic',
    targetType: 'habits_checked',
    targetCount: 250,
    currentCount: 0,
    xpReward: 2000,
    claimed: false,
    expiresAt: 'Permanent',
    iconName: 'Sparkles',
    badgeRewardId: 'bdg-compounder',
  },
];

// -------------------------------------------------------------
// 4. ACHIEVEMENT BADGES VAULT (TIERED: BRONZE TO MYTHIC)
// -------------------------------------------------------------

export const INITIAL_BADGES: AchievementBadge[] = [
  {
    id: 'bdg-genesis',
    title: 'Genesis Blueprint',
    description: 'Established your first 5-year North Star architecture and strategic goals.',
    category: 'mastery',
    tier: 'bronze',
    iconName: 'Compass',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    xpReward: 100,
    rarity: 'Common',
  },
  {
    id: 'bdg-deepwork',
    title: 'Deep Work Architect',
    description: 'Complete 25 high-priority engineering or system architecture tasks.',
    category: 'focus',
    tier: 'silver',
    iconName: 'Cpu',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    xpReward: 350,
    rarity: 'Rare',
  },
  {
    id: 'bdg-fire-30',
    title: 'Ignition of Iron',
    description: 'Sustain an unbroken 30-day consistency streak across all disciplines.',
    category: 'consistency',
    tier: 'gold',
    iconName: 'Flame',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    xpReward: 750,
    rarity: 'Epic',
  },
  {
    id: 'bdg-polyglot',
    title: 'Polyglot Envoy',
    description: 'Complete 30 language lessons and retain a 90%+ vocabulary accuracy.',
    category: 'knowledge',
    tier: 'silver',
    iconName: 'Languages',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    xpReward: 400,
    rarity: 'Rare',
  },
  {
    id: 'bdg-alpha-trader',
    title: 'Systematic Edge',
    description: 'Log 20 verified historical replay trades with strict R-multiple adherence.',
    category: 'wealth',
    tier: 'gold',
    iconName: 'TrendingUp',
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    xpReward: 600,
    rarity: 'Epic',
  },
  {
    id: 'bdg-centurion',
    title: 'Task Centurion',
    description: 'Execute 100 tasks with zero procrastination deferrals.',
    category: 'discipline',
    tier: 'diamond',
    iconName: 'Target',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    xpReward: 1500,
    rarity: 'Legendary',
  },
  {
    id: 'bdg-compounder',
    title: 'Infinite Compounding',
    description: 'Log 250 total daily habit completions.',
    category: 'discipline',
    tier: 'diamond',
    iconName: 'Zap',
    unlocked: false,
    progress: 0,
    maxProgress: 250,
    xpReward: 2000,
    rarity: 'Legendary',
  },
  {
    id: 'bdg-sovereign',
    title: 'Cognitive Sovereign',
    description: 'Attain Level 50 in LIFE OS through multidimensional excellence.',
    category: 'mastery',
    tier: 'mythic',
    iconName: 'Crown',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    xpReward: 5000,
    rarity: 'Mythic',
  },
  {
    id: 'bdg-secret-flow',
    title: 'Flow State Transcendent',
    description: 'Achieve 5 hours of continuous deep work within a single calendar day.',
    category: 'special',
    tier: 'mythic',
    iconName: 'Sparkles',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    xpReward: 2500,
    rarity: 'Mythic',
    secret: true,
  },
];

// -------------------------------------------------------------
// 5. XP TRANSACTION AUDIT STREAM
// -------------------------------------------------------------

export const INITIAL_XP_TRANSACTIONS: XpTransaction[] = [];
