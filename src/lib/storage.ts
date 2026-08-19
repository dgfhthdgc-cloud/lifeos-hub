import {
  UserProfile,
  NotificationItem,
  TaskItem,
  TaskSummary,
  GoalItem,
  GoalSummary,
  HabitItem,
  HabitSummary,
  CourseSummary,
  DetailedCourse,
  CourseLesson,
  CourseModule,
  CourseCertificate,
  WatchlistSummaryItem,
  AIInsightSummary,
  YearPlan,
  FiveYearPillar,
  QuestItem,
  AchievementBadge,
  StreakSystemData,
  XpTransaction,
  LanguageUnit,
  LanguageLesson,
  LanguageProfile,
  VocabItem,
  TargetLanguage,
  MarketSymbol,
  TradeJournalEntry,
  ActiveOrder,
  TradingAccount,
  ChartDrawing,
  AIChatMessage,
  AICoachSettings,
  AIScheduleAuditResult,
  AIStudyPlanResult,
  AITradingAnalysisResult,
  AIDailyBriefingResult,
  BossBattle,
  SkillPerkNode,
  DomainRadarMetric,
  CrossDomainLifeRadarData,
  HistoricalXpTrendPoint,
  DomainDistributionPoint,
  FlowHourHeatmapPoint,
  SystemSnapshotMetadata,
  LifeAutomationRule,
  AutomationExecutionLog,
  GuildSyndicate,
  GuildWorldRaid,
  SyndicateLeaderboardEntry,
  BiometricReadinessMetric,
  WebhookIntegrationConfig,
  SwarmAgent,
  SwarmAgentInsight,
  LifeSimulationModel,
  SimulationPoint,
  EpochMilestone,
  SovereignVaultArchive,
} from '../types';
import {
  INITIAL_QUESTS,
  INITIAL_BADGES,
  INITIAL_STREAK_DATA,
  INITIAL_XP_TRANSACTIONS,
  calculateStreakFromDates,
  calculateProgression,
  getTotalXpForLevel,
} from './gamification';
import { INITIAL_DETAILED_COURSES } from './initialCoursesData';
import {
  INITIAL_LANGUAGE_PROFILE,
  getUnitsForLanguage,
} from './initialLanguagesData';
import {
  INITIAL_MARKET_SYMBOLS,
  INITIAL_TRADING_ACCOUNT,
  INITIAL_TRADE_JOURNAL,
} from './tradingData';
import {
  INITIAL_AI_CHAT_HISTORY,
  INITIAL_AI_SETTINGS,
} from './aiCoachData';
import {
  INITIAL_BOSS_BATTLES,
  INITIAL_SKILL_PERK_NODES,
  INITIAL_CROSS_DOMAIN_RADAR,
  INITIAL_HISTORICAL_XP_TREND,
  INITIAL_DOMAIN_DISTRIBUTION,
  INITIAL_FLOW_HEATMAP,
  INITIAL_SYSTEM_SNAPSHOT,
} from './phase8Data';
import {
  INITIAL_AUTOMATIONS,
  INITIAL_AUTOMATION_LOGS,
  INITIAL_GUILDS,
  INITIAL_SYNDICATE_LEADERBOARD,
  INITIAL_BIOMETRICS,
  INITIAL_INTEGRATIONS,
} from './phase9Data';
import {
  INITIAL_SWARM_AGENTS,
  INITIAL_SIMULATION_MODELS,
  INITIAL_EPOCH_MILESTONES,
  INITIAL_VAULT_ARCHIVES,
} from './phase10Data';

const STORAGE_KEYS = {
  USER: 'life_os_user_v1',
  AUTH_TOKEN: 'life_os_auth_token_v1',
  THEME: 'life_os_theme_v1',
  NOTIFICATIONS: 'life_os_notifications_v1',
  TASKS: 'life_os_detailed_tasks_v2',
  HABITS: 'life_os_detailed_habits_v2',
  GOALS: 'life_os_detailed_goals_v2',
  YEAR_PLAN: 'life_os_year_plan_v2',
  FIVE_YEAR_PLAN: 'life_os_5year_plan_v2',
  COURSES: 'life_os_courses_v1',
  DETAILED_COURSES: 'life_os_detailed_courses_v4',
  WATCHLIST: 'life_os_watchlist_v1',
  AI_INSIGHTS: 'life_os_ai_insights_v1',
  QUESTS: 'life_os_quests_v3',
  BADGES: 'life_os_badges_v3',
  STREAK: 'life_os_streak_v3',
  XP_TRANSACTIONS: 'life_os_xp_transactions_v3',
  LANGUAGE_PROFILE: 'life_os_language_profile_v5',
  LANGUAGE_UNITS: 'life_os_language_units_v5',
  LANGUAGE_CUSTOM_VOCAB: 'life_os_language_custom_vocab_v5',
  TRADING_SYMBOLS: 'life_os_trading_symbols_v6',
  TRADING_ACCOUNT: 'life_os_trading_account_v6',
  TRADING_JOURNAL: 'life_os_trading_journal_v6',
  TRADING_DRAWINGS: 'life_os_trading_drawings_v6',
  AI_CHAT_HISTORY: 'life_os_ai_chat_history_v7',
  AI_SETTINGS: 'life_os_ai_settings_v7',
  AI_SCHEDULE_AUDITS: 'life_os_ai_schedule_audits_v7',
  AI_STUDY_PLANS: 'life_os_ai_study_plans_v7',
  AI_DAILY_BRIEFINGS: 'life_os_ai_daily_briefings_v7',
  AI_TRADING_ANALYSES: 'life_os_ai_trading_analyses_v7',
  BOSS_BATTLES: 'life_os_boss_battles_v8',
  SKILL_PERKS: 'life_os_skill_perks_v8',
  PERK_POINTS: 'life_os_perk_points_v8',
  CROSS_DOMAIN_ANALYTICS: 'life_os_cross_domain_analytics_v8',
  HISTORICAL_XP_TREND: 'life_os_historical_xp_trend_v8',
  LIFE_AUTOMATIONS: 'life_os_automations_v9',
  AUTOMATION_LOGS: 'life_os_automation_logs_v9',
  GUILD_SYNDICATES: 'life_os_guilds_v9',
  BIOMETRIC_DATA: 'life_os_biometrics_v9',
  WEBHOOK_INTEGRATIONS: 'life_os_integrations_v9',
  SWARM_AGENTS: 'life_os_swarm_agents_v10',
  SIMULATION_MODELS: 'life_os_simulations_v10',
  EPOCH_MILESTONES: 'life_os_epoch_milestones_v10',
  VAULT_ARCHIVES: 'life_os_vault_archives_v10',
};

export const INITIAL_USER: UserProfile = {
  id: 'usr_init_1',
  email: 'user@lifeos.internal',
  name: 'New User',
  title: 'Initiate Apprentice',
  level: 1,
  currentXp: 0,
  nextLevelXp: 400,
  streakDays: 0,
  createdAt: new Date().toISOString(),
  settings: {
    theme: 'dark',
    notificationsEnabled: true,
    aiInsightsEnabled: true,
    compactView: false,
  },
};

export const DEMO_USER: UserProfile = {
  id: 'usr_demo_7701',
  email: 'alex.vance@lifeos.internal',
  name: 'Alex Vance',
  title: 'Full-Stack & Systems Architect',
  level: 17,
  currentXp: 7420,
  nextLevelXp: 10000,
  streakDays: 24,
  createdAt: '2026-01-01T00:00:00Z',
  settings: {
    theme: 'dark',
    notificationsEnabled: true,
    aiInsightsEnabled: true,
    compactView: false,
  },
};

const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Generate realistic 60-day completion dates for habits
const generateHabitHistory = (rate: number): string[] => {
  const history: string[] = [];
  for (let i = 1; i <= 60; i++) {
    if (Math.random() < rate) {
      history.push(getPastDateStr(i));
    }
  }
  return history;
};

export const INITIAL_DETAILED_TASKS: TaskItem[] = [
  {
    id: 'tsk-101',
    title: 'Review System Architecture PR for Life OS Core',
    description: 'Audit TypeScript module boundaries, storage adapters, and test suite execution.',
    dueDate: getTodayDateStr(),
    time: '09:00 AM',
    endTime: '10:30 AM',
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['#core', '#architecture', '#code-review'],
    recurrence: 'none',
    goalId: 'goal-1',
    xp: 35,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-102',
    title: 'Complete Deep Learning PyTorch Backpropagation Module',
    description: 'Implement autograd tape, computational graphs, and loss function gradients.',
    dueDate: getTodayDateStr(),
    time: '11:00 AM',
    endTime: '12:30 PM',
    priority: 'high',
    status: 'todo',
    category: 'Learning',
    tags: ['#ml', '#pytorch', '#deep-learning'],
    recurrence: 'none',
    goalId: 'goal-1',
    xp: 50,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-103',
    title: 'Spanish Vocabulary Drill: Medical & Daily Terms (Unit 3)',
    description: 'Practice 40 flashcard spaced-repetition drills on conversational medical vocabulary.',
    dueDate: getTodayDateStr(),
    time: '02:00 PM',
    endTime: '02:30 PM',
    priority: 'medium',
    status: 'todo',
    category: 'Language',
    tags: ['#spanish', '#srs', '#fluency'],
    recurrence: 'daily',
    goalId: 'goal-3',
    xp: 25,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-104',
    title: 'Review BTCUSD Liquidity Sweeps on 4H Replay Terminal',
    description: 'Analyze session highs/lows and market structure shifts across Asian & London opens.',
    dueDate: getTodayDateStr(),
    time: '04:30 PM',
    endTime: '05:30 PM',
    priority: 'medium',
    status: 'todo',
    category: 'Trading',
    tags: ['#trading', '#market-structure', '#replay'],
    recurrence: 'none',
    goalId: 'goal-2',
    xp: 30,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-105',
    title: 'Evening Zone 2 Aerobic Run & Mobility Workout',
    description: '45-minute sustained heart rate zone 2 conditioning followed by dynamic hip openers.',
    dueDate: getTodayDateStr(),
    time: '06:30 PM',
    endTime: '07:30 PM',
    priority: 'low',
    status: 'todo',
    category: 'Health',
    tags: ['#fitness', '#cardio', '#recovery'],
    recurrence: 'daily',
    xp: 20,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-106',
    title: 'Write Weekly Engineering Architecture Retrospective',
    description: 'Document key trade-offs in distributed event bus design and message ordering.',
    dueDate: getPastDateStr(-1), // Tomorrow
    time: '10:00 AM',
    endTime: '11:00 AM',
    priority: 'medium',
    status: 'todo',
    category: 'Engineering',
    tags: ['#reflection', '#systems'],
    recurrence: 'weekly',
    goalId: 'goal-1',
    xp: 30,
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DETAILED_HABITS: HabitItem[] = [
  {
    id: 'hab-1',
    name: 'Python / ML Coding',
    description: 'Daily dedicated hands-on programming on algorithms, neural networks, or systems.',
    frequency: 'daily',
    target: '45 mins/day',
    category: 'Skill',
    difficulty: 'hard',
    xp: 30,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '10:30 AM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hab-2',
    name: 'Deep Focus Morning Block',
    description: '90 minutes of zero-distraction deep work before checking messaging or notifications.',
    frequency: 'weekdays',
    target: '90 mins',
    category: 'Productivity',
    difficulty: 'hard',
    xp: 25,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '08:45 AM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hab-3',
    name: 'Spanish Practice',
    description: 'Duolingo / SRS vocabulary drills and listening comprehension practice.',
    frequency: 'daily',
    target: '15 mins/day',
    category: 'Language',
    difficulty: 'medium',
    xp: 15,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '02:00 PM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hab-4',
    name: 'Trading Journal & Review',
    description: 'Log trade executions, R-multiple metrics, emotional triggers, and trade setups.',
    frequency: 'weekdays',
    target: 'Daily market close log',
    category: 'Trading',
    difficulty: 'medium',
    xp: 20,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '05:00 PM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hab-5',
    name: 'Physical Workout & Conditioning',
    description: 'Strength training, zone 2 aerobic cardio, or athletic mobility session.',
    frequency: 'daily',
    target: '45 mins',
    category: 'Health',
    difficulty: 'medium',
    xp: 25,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '06:00 PM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hab-6',
    name: 'Evening Reading & Reflection',
    description: 'Read 20+ pages from foundational technical or philosophical literature.',
    frequency: 'daily',
    target: '20 pages',
    category: 'Mindfulness',
    difficulty: 'easy',
    xp: 10,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    reminderTime: '09:30 PM',
    completedToday: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DETAILED_GOALS: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'Become a Machine Learning Systems Engineer',
    description: 'Master deep learning mathematics, PyTorch distributed training, LLM inference engines, and production MLOps architecture.',
    category: 'Career & Skills',
    deadline: 'Dec 2026',
    priority: 'high',
    status: 'in_progress',
    progress: 0,
    milestones: [
      { id: 'm-101', goalId: 'goal-1', title: 'Master Python & Linear Algebra / Vector Calculus', completed: false, order: 1, xpReward: 100, targetDate: 'Mar 2026' },
      { id: 'm-102', goalId: 'goal-1', title: 'Implement Backpropagation & Multi-Layer Perceptrons from Scratch', completed: false, order: 2, xpReward: 150, targetDate: 'May 2026' },
      { id: 'm-103', goalId: 'goal-1', title: 'Build Convolutional & Recurrent Architectures in PyTorch', completed: false, order: 3, xpReward: 150, targetDate: 'Jul 2026' },
      { id: 'm-104', goalId: 'goal-1', title: 'Implement Transformer Multi-Head Self-Attention from Scratch', completed: false, order: 4, xpReward: 200, targetDate: 'Aug 2026' },
      { id: 'm-105', goalId: 'goal-1', title: 'Fine-tune Open Weights LLMs with LoRA / QLoRA & DPO', completed: false, order: 5, xpReward: 250, targetDate: 'Oct 2026' },
      { id: 'm-106', goalId: 'goal-1', title: 'Deploy Distributed Low-Latency Inference Pipeline with vLLM', completed: false, order: 6, xpReward: 300, targetDate: 'Nov 2026' },
      { id: 'm-107', goalId: 'goal-1', title: 'Publish Comprehensive Open Source ML Portfolio Project', completed: false, order: 7, xpReward: 400, targetDate: 'Dec 2026' },
    ],
    relatedHabitIds: ['hab-1', 'hab-2'],
    relatedCourseIds: ['crs-1'],
    xpReward: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    title: 'Build a Consistent +2.5R Trading Strategy with Risk Controls',
    description: 'Execute quantitative backtesting, market auction theory, and disciplined trade journaling across high liquidity instruments.',
    category: 'Financial Mastery',
    deadline: 'Nov 2026',
    priority: 'high',
    status: 'in_progress',
    progress: 0,
    milestones: [
      { id: 'm-201', goalId: 'goal-2', title: 'Complete Auction Market Theory & Volume Profile Course', completed: false, order: 1, xpReward: 100, targetDate: 'Apr 2026' },
      { id: 'm-202', goalId: 'goal-2', title: 'Define Strict 1% Max Risk Rule and Position Sizing Matrix', completed: false, order: 2, xpReward: 120, targetDate: 'Jun 2026' },
      { id: 'm-203', goalId: 'goal-2', title: 'Log 50 Continuous Trades in Journal with Strict Execution', completed: false, order: 3, xpReward: 200, targetDate: 'Aug 2026' },
      { id: 'm-204', goalId: 'goal-2', title: 'Attain +2.0 Profit Factor across 100 Historical Replay Scenarios', completed: false, order: 4, xpReward: 250, targetDate: 'Sep 2026' },
      { id: 'm-205', goalId: 'goal-2', title: 'Pass Funded Account Challenge without Breaching Drawdown Limits', completed: false, order: 5, xpReward: 350, targetDate: 'Oct 2026' },
      { id: 'm-206', goalId: 'goal-2', title: 'Maintain 3 Consecutive Months of Positive EV Performance', completed: false, order: 6, xpReward: 500, targetDate: 'Nov 2026' },
    ],
    relatedHabitIds: ['hab-4'],
    relatedCourseIds: ['crs-3'],
    xpReward: 800,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-3',
    title: 'Achieve B2 Conversational Fluency in Spanish',
    description: 'Develop fluent spoken, written, and auditory proficiency for business and international travel.',
    category: 'Language & Culture',
    deadline: 'Oct 2026',
    priority: 'medium',
    status: 'in_progress',
    progress: 0,
    milestones: [
      { id: 'm-301', goalId: 'goal-3', title: 'Complete Core Grammar & Verb Conjugation Fundamentals (A1/A2)', completed: false, order: 1, xpReward: 100, targetDate: 'May 2026' },
      { id: 'm-302', goalId: 'goal-3', title: 'Master 1,500 Most Common Words in Spaced Repetition SRS', completed: false, order: 2, xpReward: 150, targetDate: 'Jul 2026' },
      { id: 'm-303', goalId: 'goal-3', title: 'Complete 25 Hours of Native Speaker Conversation Sessions', completed: false, order: 3, xpReward: 200, targetDate: 'Aug 2026' },
      { id: 'm-304', goalId: 'goal-3', title: 'Read a Complete Spanish Novel without English Translation Assistance', completed: false, order: 4, xpReward: 250, targetDate: 'Sep 2026' },
      { id: 'm-305', goalId: 'goal-3', title: 'Pass DELE B2 Official Level Practice Examination', completed: false, order: 5, xpReward: 350, targetDate: 'Oct 2026' },
    ],
    relatedHabitIds: ['hab-3'],
    xpReward: 600,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_YEAR_PLAN: YearPlan = {
  year: 2026,
  theme: 'The Year of Systems Mastery & Polymathic Execution',
  highLevelVision:
    'Achieve complete autonomy over engineering career trajectory, achieve disciplined trading profitability, and build unbreakable physical and mental conditioning.',
  quarters: [
    {
      quarter: 'Q1',
      title: 'Foundations & Architecture Core',
      focusTheme: 'Establishing core habits, mathematical rigor, and initial ML coursework.',
      objectives: [
        'Establish unbroken 30-day morning focus routine',
        'Complete Linear Algebra and PyTorch basics',
        'Finalize Life OS architecture blueprint',
      ],
      status: 'active',
    },
    {
      quarter: 'Q2',
      title: 'Deep Learning & Trading Consistency',
      focusTheme: 'Deep neural networks implementation and risk-controlled market replay.',
      objectives: [
        'Complete backprop and transformer attention modules',
        'Backtest 50 trades in replay terminal',
        'Reach 1,500 vocabulary words in Spanish SRS',
      ],
      status: 'upcoming',
    },
    {
      quarter: 'Q3',
      title: 'Systems Scaling & Portfolio Launch',
      focusTheme: 'Deploying LLM fine-tuning pipelines and funded trader evaluation.',
      objectives: [
        'Fine-tune custom Llama/Mistral models with LoRA',
        'Maintain +2.5R average winning trades with strict 1% risk',
        'Complete 25 hours of conversational Spanish',
      ],
      status: 'upcoming',
    },
    {
      quarter: 'Q4',
      title: 'Mastery Synthesis & Autonomous Swarms',
      focusTheme: 'Consolidating polymathic systems, automated routines, and global roadmap review.',
      objectives: [
        'Deploy production multi-agent orchestration service',
        'Achieve lifetime +2.0 Profit Factor across trading models',
        'Pass DELE B2 Spanish Examination',
      ],
      status: 'upcoming',
    },
  ],
};

export const INITIAL_FIVE_YEAR_PLAN: FiveYearPillar[] = [
  {
    id: 'p-1',
    pillar: 'Career & Wealth',
    icon: 'Briefcase',
    currentStatus: 'Senior Systems Engineer ($160k/yr)',
    fiveYearNorthStar: 'Principal ML Systems Architect & Independent Quant Fund Owner ($500k+/yr)',
    milestones: [
      { year: 2026, title: 'Master LLM Distributed Systems & Land Principal ML Role', completed: false },
      { year: 2027, title: 'Launch Autonomous Algorithmic Execution Strategy with $100k Capital', completed: false },
      { year: 2028, title: 'Scale Algorithmic Strategy to $500k AUM with Automated Risk', completed: false },
      { year: 2029, title: 'Found Specialized AI Systems Advisory / Boutique Quantitative Firm', completed: false },
      { year: 2030, title: 'Achieve Complete Financial Sovereignty & Multi-Stream Cashflows', completed: false },
    ],
  },
  {
    id: 'p-2',
    pillar: 'Skills & Mastery',
    icon: 'GraduationCap',
    currentStatus: 'Proficient in Web & Cloud Systems; Intermediate ML',
    fiveYearNorthStar: 'World-Class Polymath in Distributed Compute, AI Research, and Financial Engineering',
    milestones: [
      { year: 2026, title: 'Author 3 High-Impact Open Source AI Engineering Frameworks', completed: false },
      { year: 2027, title: 'Master C++ CUDA High Performance GPU Compute Kernels', completed: false },
      { year: 2028, title: 'Publish Machine Learning Systems Technical Book / Course', completed: false },
      { year: 2029, title: 'Contribute to Cutting-Edge Foundation Model Architectures', completed: false },
      { year: 2030, title: 'Teach and Mentor 1,000+ Aspiring Systems Engineers', completed: false },
    ],
  },
  {
    id: 'p-3',
    pillar: 'Health & Performance',
    icon: 'Heart',
    currentStatus: 'Consistent runner; 14% body fat',
    fiveYearNorthStar: 'Elite Functional Athleticism, Sub-3:30 Marathon, Optimal Biomarkers & Longevity',
    milestones: [
      { year: 2026, title: 'Run First Official Half-Marathon under 1h 40m', completed: false },
      { year: 2027, title: 'Complete Full Marathon & Bench 1.25x / Squat 1.75x Bodyweight', completed: false },
      { year: 2028, title: 'Complete 70.3 Half-Ironman Triathlon', completed: false },
      { year: 2029, title: 'Maintain Biological Age Biomarkers 8+ Years Below Chronological Age', completed: false },
      { year: 2030, title: 'Peak Functional Longevity & Uncompromised Physical Mobility', completed: false },
    ],
  },
  {
    id: 'p-4',
    pillar: 'Language & Exploration',
    icon: 'Globe',
    currentStatus: 'English Native; A2/B1 Spanish',
    fiveYearNorthStar: 'Trilingual Fluency (English, Spanish, Mandarin/Japanese) & Global Residency',
    milestones: [
      { year: 2026, title: 'Achieve Certified B2 Spanish Conversational Fluency', completed: false },
      { year: 2027, title: 'Spend 3 Months Immersed in Madrid / Buenos Aires Coding & Speaking Spanish', completed: false },
      { year: 2028, title: 'Achieve C1 Spanish & Begin Japanese / Mandarin Fundamentals (HSK2)', completed: false },
      { year: 2029, title: 'Travel & Work Across 12 International Tech Hubs', completed: false },
      { year: 2030, title: 'Effortless Multilingual Polyglot Living Across Multiple Continents', completed: false },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Welcome to LIFE OS',
    message: 'Your personal operating system is ready. Set up your goals and start building consistency.',
    timestamp: 'Just now',
    read: false,
    type: 'system',
    link: '/dashboard',
  },
  {
    id: 'notif-2',
    title: 'Daily Quests Available',
    message: 'Complete tasks and habits to earn XP and begin your level progression.',
    timestamp: 'Just now',
    read: false,
    type: 'quest',
    link: '/dashboard',
  },
];

export const INITIAL_COURSES: CourseSummary[] = [
  {
    id: 'crs-1',
    title: 'Neural Networks & Deep Learning with PyTorch',
    category: 'AI & Machine Learning',
    progress: 0,
    currentModule: 'Module 1: Tensors, Compute Graphs & Automatic Differentiation',
    totalLessons: 24,
    completedLessons: 0,
  },
  {
    id: 'crs-2',
    title: 'System Design & Distributed Microservices',
    category: 'Programming & CS',
    progress: 0,
    currentModule: 'Module 1: Distributed Foundations & Consensus Mechanics',
    totalLessons: 18,
    completedLessons: 0,
  },
  {
    id: 'crs-3',
    title: 'Orderflow, Liquidity & Auction Market Theory',
    category: 'Trading Education',
    progress: 0,
    currentModule: 'Module 1: Market Microstructure & Order Book Dynamics',
    totalLessons: 15,
    completedLessons: 0,
  },
];

export const INITIAL_WATCHLIST: WatchlistSummaryItem[] = [
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    price: 94250.0,
    changePercent: +3.42,
    category: 'Crypto',
    isPositive: true,
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    price: 3620.5,
    changePercent: +2.18,
    category: 'Crypto',
    isPositive: true,
  },
  {
    symbol: 'NQ',
    name: 'E-mini Nasdaq 100 Futures',
    price: 21480.25,
    changePercent: +0.85,
    category: 'Indices',
    isPositive: true,
  },
  {
    symbol: 'ES',
    name: 'E-mini S&P 500 Futures',
    price: 6024.75,
    changePercent: -0.15,
    category: 'Indices',
    isPositive: false,
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    price: 2748.9,
    changePercent: +0.64,
    category: 'Commodities',
    isPositive: true,
  },
];

export const INITIAL_AI_INSIGHT: AIInsightSummary = {
  id: 'insight-1',
  title: 'Optimal Focus Window Detected',
  message:
    'You have an open productivity block. Completing your high-impact daily tasks will start compounding your consistency streak.',
  type: 'opportunity',
  actionLabel: 'View Daily Tasks',
  actionRoute: '/planner',
  generatedAt: 'Just now',
  isAiEnabled: true,
};

export const Storage = {
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) return JSON.parse(data);
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  },

  setUser(user: UserProfile | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('Storage failed to write user', e);
    }
  },

  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  setNotifications(items: NotificationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(items));
    } catch (e) {
      console.warn('Storage failed to write notifications', e);
    }
  },

  // -------------------------------------------------------------------
  // DETAILED TASKS
  // -------------------------------------------------------------------
  getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (data) return JSON.parse(data);
      return INITIAL_DETAILED_TASKS;
    } catch {
      return INITIAL_DETAILED_TASKS;
    }
  },

  setTasks(tasks: TaskItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Storage failed to write tasks', e);
    }
  },

  createTask(newTask: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const tasks = this.getTasks();
    const task: TaskItem = {
      ...newTask,
      id: `tsk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [task, ...tasks];
    this.setTasks(updated);
    return task;
  },

  updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const tasks = this.getTasks();
    let updatedItem: TaskItem | null = null;
    const updated = tasks.map((t) => {
      if (t.id === id) {
        updatedItem = { ...t, ...updates };
        return updatedItem;
      }
      return t;
    });
    this.setTasks(updated);
    return updatedItem;
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks();
    const updated = tasks.filter((t) => t.id !== id);
    this.setTasks(updated);
  },

  toggleTask(id: string): { task: TaskItem | null; xpAwarded: number } {
    const tasks = this.getTasks();
    let awarded = 0;
    let targetTask: TaskItem | null = null;

    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          awarded = t.xp || 20;
          this.addXpTransaction({
            amount: awarded,
            reason: `Completed Task: "${t.title}"`,
            category: 'task',
          });
          const dmg = t.priority === 'high' ? 100 : t.priority === 'medium' ? 50 : 25;
          this.damageActiveBoss(dmg, `Completed Task: "${t.title}"`, 'task');
          this.triggerAutomations('task_completed', { priority: t.priority, category: t.category, title: t.title, xp: t.xp });
        }
        targetTask = {
          ...t,
          completed: nextCompleted,
          status: nextCompleted ? 'completed' : 'todo',
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
        return targetTask;
      }
      return t;
    });

    this.setTasks(updated);

    // Synchronize linked Goal Milestone if goalId and milestoneId exist
    if (targetTask && (targetTask as TaskItem).goalId && (targetTask as TaskItem).milestoneId) {
      const gId = (targetTask as TaskItem).goalId!;
      const mId = (targetTask as TaskItem).milestoneId!;
      const isDone = (targetTask as TaskItem).completed;
      const goals = this.getGoals();
      const nextGoals = goals.map((g) => {
        if (g.id === gId) {
          const nextMilestones = g.milestones.map((m) => {
            if (m.id === mId) {
              return { ...m, completed: isDone };
            }
            return m;
          });
          const compCount = nextMilestones.filter((m) => m.completed).length;
          const prog = nextMilestones.length > 0 ? Math.round((compCount / nextMilestones.length) * 100) : 0;
          return {
            ...g,
            milestones: nextMilestones,
            progress: prog,
            completed: prog === 100,
            status: prog === 100 ? 'achieved' : g.status,
          };
        }
        return g;
      });
      this.setGoals(nextGoals);
    }

    return { task: targetTask, xpAwarded: awarded };
  },

  // -------------------------------------------------------------------
  // DETAILED HABITS
  // -------------------------------------------------------------------
  getHabits(): HabitItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (data) return JSON.parse(data);
      return INITIAL_DETAILED_HABITS;
    } catch {
      return INITIAL_DETAILED_HABITS;
    }
  },

  setHabits(habits: HabitItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.warn('Storage failed to write habits', e);
    }
  },

  createHabit(newHabit: Omit<HabitItem, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'history' | 'completedToday'>): HabitItem {
    const habits = this.getHabits();
    const habit: HabitItem = {
      ...newHabit,
      id: `hab-${Date.now()}`,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      completedToday: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [habit, ...habits];
    this.setHabits(updated);
    return habit;
  },

  updateHabit(id: string, updates: Partial<HabitItem>): HabitItem | null {
    const habits = this.getHabits();
    let updatedItem: HabitItem | null = null;
    const updated = habits.map((h) => {
      if (h.id === id) {
        updatedItem = { ...h, ...updates };
        return updatedItem;
      }
      return h;
    });
    this.setHabits(updated);
    return updatedItem;
  },

  deleteHabit(id: string): void {
    const habits = this.getHabits();
    const updated = habits.filter((h) => h.id !== id);
    this.setHabits(updated);
  },

  toggleHabitDay(id: string, dateStr: string = getTodayDateStr()): { habit: HabitItem | null; xpAwarded: number } {
    const habits = this.getHabits();
    let awarded = 0;
    let targetHabit: HabitItem | null = null;

    const updated = habits.map((h) => {
      if (h.id === id) {
        const isCurrentlyCompleted = h.history.includes(dateStr);
        let newHistory: string[];

        if (isCurrentlyCompleted) {
          newHistory = h.history.filter((d) => d !== dateStr);
        } else {
          newHistory = [dateStr, ...h.history];
          awarded = h.xp || 15;
          this.addXpTransaction({
            amount: awarded,
            reason: `Checked Habit: "${h.title || h.name}"`,
            category: 'habit',
          });
          this.damageActiveBoss(40, `Checked Habit: "${h.title || h.name}"`, 'habit');
        }

        const streakResult = calculateStreakFromDates(newHistory);
        const newStreak = streakResult.currentStreak;
        const bestStreak = streakResult.bestStreak;

        if (!isCurrentlyCompleted && newStreak > 0 && newStreak % 7 === 0) {
          this.triggerAutomations('habit_streak_reached', { streak: newStreak, name: h.title || h.name });
        }

        const isToday = dateStr === getTodayDateStr();

        targetHabit = {
          ...h,
          history: newHistory,
          currentStreak: newStreak,
          bestStreak,
          completedToday: isToday ? !isCurrentlyCompleted : h.completedToday,
        };
        return targetHabit;
      }
      return h;
    });

    this.setHabits(updated);
    return { habit: targetHabit, xpAwarded: awarded };
  },

  // -------------------------------------------------------------------
  // DETAILED GOALS & MILESTONES
  // -------------------------------------------------------------------
  getGoals(): GoalItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (data) return JSON.parse(data);
      return INITIAL_DETAILED_GOALS;
    } catch {
      return INITIAL_DETAILED_GOALS;
    }
  },

  setGoals(goals: GoalItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Storage failed to write goals', e);
    }
  },

  createGoal(newGoal: Omit<GoalItem, 'id' | 'createdAt' | 'progress'>): GoalItem {
    const goals = this.getGoals();
    const completedCount = newGoal.milestones.filter((m) => m.completed).length;
    const progress = newGoal.milestones.length > 0 ? Math.round((completedCount / newGoal.milestones.length) * 100) : 0;

    const goal: GoalItem = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      progress,
      createdAt: new Date().toISOString(),
    };
    const updated = [goal, ...goals];
    this.setGoals(updated);
    return goal;
  },

  updateGoal(id: string, updates: Partial<GoalItem>): GoalItem | null {
    const goals = this.getGoals();
    let updatedItem: GoalItem | null = null;
    const updated = goals.map((g) => {
      if (g.id === id) {
        const milestones = updates.milestones || g.milestones;
        const completedCount = milestones.filter((m) => m.completed).length;
        const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
        updatedItem = { ...g, ...updates, milestones, progress };
        return updatedItem;
      }
      return g;
    });
    this.setGoals(updated);
    return updatedItem;
  },

  deleteGoal(id: string): void {
    const goals = this.getGoals();
    const updated = goals.filter((g) => g.id !== id);
    this.setGoals(updated);
  },

  toggleGoalMilestone(goalId: string, milestoneId: string): { goal: GoalItem | null; xpAwarded: number } {
    const goals = this.getGoals();
    let awarded = 0;
    let targetGoal: GoalItem | null = null;

    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const updatedMilestones = g.milestones.map((m) => {
          if (m.id === milestoneId) {
            const nextCompleted = !m.completed;
            if (nextCompleted) {
              awarded = m.xpReward || 100;
            }
            return { ...m, completed: nextCompleted };
          }
          return m;
        });

        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;
        const status = progress === 100 ? 'achieved' : g.status;

        targetGoal = {
          ...g,
          milestones: updatedMilestones,
          progress,
          status,
        };
        return targetGoal;
      }
      return g;
    });

    this.setGoals(updated);

    // Synchronize linked Tasks if any exist for this goal & milestone
    if (targetGoal) {
      const milestone = targetGoal.milestones.find((m) => m.id === milestoneId);
      if (milestone) {
        const isDone = milestone.completed;
        const currentTasks = this.getTasks();
        let taskModified = false;
        const nextTasks = currentTasks.map((t) => {
          if (t.goalId === goalId && t.milestoneId === milestoneId) {
            taskModified = true;
            return {
              ...t,
              completed: isDone,
              status: isDone ? 'completed' : 'todo',
              completedAt: isDone ? new Date().toISOString() : undefined,
            } as TaskItem;
          }
          return t;
        });
        if (taskModified) {
          this.setTasks(nextTasks);
        }
      }
    }

    return { goal: targetGoal, xpAwarded: awarded };
  },

  // -------------------------------------------------------------------
  // YEAR PLAN & 5-YEAR VISION
  // -------------------------------------------------------------------
  getYearPlan(): YearPlan {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.YEAR_PLAN);
      if (data) return JSON.parse(data);
      return INITIAL_YEAR_PLAN;
    } catch {
      return INITIAL_YEAR_PLAN;
    }
  },

  setYearPlan(plan: YearPlan): void {
    try {
      localStorage.setItem(STORAGE_KEYS.YEAR_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.warn('Storage failed to write year plan', e);
    }
  },

  getFiveYearPlan(): FiveYearPillar[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIVE_YEAR_PLAN);
      if (data) return JSON.parse(data);
      return INITIAL_FIVE_YEAR_PLAN;
    } catch {
      return INITIAL_FIVE_YEAR_PLAN;
    }
  },

  setFiveYearPlan(plan: FiveYearPillar[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FIVE_YEAR_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.warn('Storage failed to write 5-year plan', e);
    }
  },

  // -------------------------------------------------------------------
  // PHASE 4: DETAILED COURSES & LESSON WORKSPACE
  // -------------------------------------------------------------------
  getDetailedCourses(): DetailedCourse[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DETAILED_COURSES);
      if (data) {
        return JSON.parse(data);
      }
      return INITIAL_DETAILED_COURSES;
    } catch {
      return INITIAL_DETAILED_COURSES;
    }
  },

  setDetailedCourses(courses: DetailedCourse[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DETAILED_COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Storage failed to write detailed courses', e);
    }
  },

  getCourseById(id: string): DetailedCourse | undefined {
    const courses = this.getDetailedCourses();
    return courses.find((c) => c.id === id);
  },

  enrollCourse(courseId: string): DetailedCourse | null {
    const courses = this.getDetailedCourses();
    let updatedCourse: DetailedCourse | null = null;
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        updatedCourse = {
          ...c,
          enrolled: true,
          enrolledAt: c.enrolledAt || new Date().toISOString(),
        };
        return updatedCourse;
      }
      return c;
    });
    this.setDetailedCourses(updated);
    return updatedCourse;
  },

  toggleLessonCompletion(courseId: string, lessonId: string): {
    course: DetailedCourse | null;
    lesson: CourseLesson | null;
    xpAwarded: number;
    isCompleted: boolean;
    newCertificate?: CourseCertificate | null;
  } {
    const courses = this.getDetailedCourses();
    let updatedCourse: DetailedCourse | null = null;
    let targetLesson: CourseLesson | null = null;
    let xpAwarded = 0;
    let isCompleted = false;
    let newCertificate: CourseCertificate | null = null;

    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const updatedModules = c.modules.map((m) => {
          const updatedLessons = m.lessons.map((les) => {
            if (les.id === lessonId) {
              const nextState = !les.completed;
              isCompleted = nextState;
              if (nextState) {
                xpAwarded = les.xpReward || 50;
              }
              targetLesson = {
                ...les,
                completed: nextState,
                completedAt: nextState ? new Date().toISOString() : undefined,
              };
              return targetLesson;
            }
            return les;
          });
          return { ...m, lessons: updatedLessons };
        });

        // Check if all lessons across all modules are completed
        const allLessons = updatedModules.flatMap((m) => m.lessons);
        const allCompleted = allLessons.length > 0 && allLessons.every((l) => l.completed);

        let cert = c.certificate;
        if (allCompleted && !cert) {
          cert = {
            id: `cert-${c.id}-${Date.now()}`,
            credentialId: `CERT-LIFEOS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            courseId: c.id,
            courseTitle: c.title,
            recipientName: this.getUser().name || 'Mastery Student',
            issueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            verified: true,
            scorePercentage: 100,
            skillsAcquired: c.learningOutcomes.slice(0, 4),
          };
          newCertificate = cert;
        }

        updatedCourse = {
          ...c,
          modules: updatedModules,
          certificate: cert,
          completedAt: allCompleted ? (c.completedAt || new Date().toISOString()) : undefined,
        };
        return updatedCourse;
      }
      return c;
    });

    this.setDetailedCourses(updated);
    return { course: updatedCourse, lesson: targetLesson, xpAwarded, isCompleted, newCertificate };
  },

  saveLessonNote(courseId: string, lessonId: string, noteContent: string): void {
    const courses = this.getDetailedCourses();
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const userNotes = { ...(c.userNotes || {}), [lessonId]: noteContent };
        return { ...c, userNotes };
      }
      return c;
    });
    this.setDetailedCourses(updated);
  },

  toggleLessonBookmark(courseId: string, lessonId: string): boolean {
    const courses = this.getDetailedCourses();
    let isBookmarked = false;
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const existing = c.bookmarkedLessons || [];
        if (existing.includes(lessonId)) {
          isBookmarked = false;
          return { ...c, bookmarkedLessons: existing.filter((id) => id !== lessonId) };
        } else {
          isBookmarked = true;
          return { ...c, bookmarkedLessons: [...existing, lessonId] };
        }
      }
      return c;
    });
    this.setDetailedCourses(updated);
    return isBookmarked;
  },

  updateQuizScore(
    courseId: string,
    lessonId: string,
    scorePercent: number,
    xpReward: number
  ): { passed: boolean; xpAwarded: number } {
    const courses = this.getDetailedCourses();
    let passed = scorePercent >= 70;
    let xpAwarded = 0;

    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const updatedModules = c.modules.map((m) => {
          const updatedLessons = m.lessons.map((les) => {
            if (les.id === lessonId) {
              const prevScore = les.quizBestScore || 0;
              const isFirstPass = !les.completed && passed;
              if (isFirstPass) {
                xpAwarded = xpReward || 100;
              }
              return {
                ...les,
                quizBestScore: Math.max(prevScore, scorePercent),
                completed: les.completed || passed,
                completedAt: (les.completed || passed) ? (les.completedAt || new Date().toISOString()) : undefined,
              };
            }
            return les;
          });
          return { ...m, lessons: updatedLessons };
        });
        return { ...c, modules: updatedModules };
      }
      return c;
    });

    this.setDetailedCourses(updated);
    return { passed, xpAwarded };
  },

  issueCourseCertificate(courseId: string, recipientName: string): CourseCertificate | null {
    const courses = this.getDetailedCourses();
    let cert: CourseCertificate | null = null;

    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const allLessons = c.modules.flatMap((m) => m.lessons);
        const completedCount = allLessons.filter((l) => l.completed).length;
        const score = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 100;

        cert = {
          id: `cert-${courseId}-${Date.now()}`,
          credentialId: `CERT-LIFEOS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          courseId: c.id,
          courseTitle: c.title,
          recipientName: recipientName || this.getUser().name || 'Student',
          issueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          verified: true,
          scorePercentage: Math.max(score, 85),
          skillsAcquired: c.learningOutcomes.slice(0, 4),
        };

        return { ...c, certificate: cert, completedAt: c.completedAt || new Date().toISOString() };
      }
      return c;
    });

    this.setDetailedCourses(updated);
    return cert;
  },

  createCustomCourse(courseData: Partial<DetailedCourse>): DetailedCourse {
    const courses = this.getDetailedCourses();
    const newCourse: DetailedCourse = {
      id: `crs-${Date.now()}`,
      title: courseData.title || 'Untitled Custom Track',
      tagline: courseData.tagline || 'Custom self-directed curriculum track',
      description: courseData.description || 'Personal syllabus and study modules created in Life OS.',
      domain: courseData.domain || 'Programming & CS',
      difficulty: courseData.difficulty || 'intermediate',
      totalDurationHours: courseData.totalDurationHours || 10,
      thumbnailIcon: courseData.thumbnailIcon || 'BookOpen',
      color: courseData.color || 'blue',
      tags: courseData.tags || ['Custom', 'Self-Taught'],
      prerequisites: courseData.prerequisites || ['None'],
      learningOutcomes: courseData.learningOutcomes || ['Master custom domain fundamentals'],
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      modules: courseData.modules || [
        {
          id: `mod-${Date.now()}-1`,
          courseId: `crs-${Date.now()}`,
          title: 'Module 1: Foundations & Core Notes',
          description: 'Initial syllabus topic and learning overview.',
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              moduleId: `mod-${Date.now()}-1`,
              courseId: `crs-${Date.now()}`,
              title: 'Introduction & Curriculum Setup',
              durationMinutes: 30,
              type: 'theory',
              difficulty: 'intermediate',
              xpReward: 40,
              completed: false,
              summary: 'Initial orientation and study goals overview.',
              keyConcepts: ['Overview', 'Objectives'],
              contentMarkdown: '# Curriculum Overview\n\nOutline your learning objectives and core references here.',
            },
          ],
        },
      ],
    };

    const updated = [newCourse, ...courses];
    this.setDetailedCourses(updated);
    return newCourse;
  },

  addCustomLesson(
    courseId: string,
    moduleId: string,
    lessonData: Partial<CourseLesson>
  ): CourseLesson | null {
    const courses = this.getDetailedCourses();
    let createdLesson: CourseLesson | null = null;

    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const updatedModules = c.modules.map((m) => {
          if (m.id === moduleId) {
            createdLesson = {
              id: `les-${Date.now()}`,
              moduleId: m.id,
              courseId: c.id,
              title: lessonData.title || 'Untitled Lesson',
              durationMinutes: lessonData.durationMinutes || 30,
              type: lessonData.type || 'theory',
              difficulty: lessonData.difficulty || 'intermediate',
              xpReward: lessonData.xpReward || 50,
              completed: false,
              summary: lessonData.summary || 'Custom study lesson',
              keyConcepts: lessonData.keyConcepts || ['Concepts'],
              contentMarkdown: lessonData.contentMarkdown || '# New Lesson Notes\n\nAdd content here.',
            };
            return { ...m, lessons: [...m.lessons, createdLesson] };
          }
          return m;
        });
        return { ...c, modules: updatedModules };
      }
      return c;
    });

    this.setDetailedCourses(updated);
    return createdLesson;
  },

  // Dynamic Summaries computed from Detailed Courses for Dashboard
  getCourses(): CourseSummary[] {
    try {
      const detailed = this.getDetailedCourses();
      if (detailed && detailed.length > 0) {
        return detailed.map((c) => {
          const allLessons = c.modules.flatMap((m) => m.lessons);
          const totalLessons = allLessons.length;
          const completedLessons = allLessons.filter((l) => l.completed).length;
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          // Find first uncompleted module or last module
          const activeModule = c.modules.find((m) => m.lessons.some((l) => !l.completed)) || c.modules[0];

          return {
            id: c.id,
            title: c.title,
            category: c.domain,
            progress,
            currentModule: activeModule ? activeModule.title : 'All Modules Completed',
            totalLessons,
            completedLessons,
          };
        });
      }
      return INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  },

  getWatchlist(): WatchlistSummaryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      if (data) return JSON.parse(data);
      return INITIAL_WATCHLIST;
    } catch {
      return INITIAL_WATCHLIST;
    }
  },

  getAIInsight(): AIInsightSummary {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_INSIGHTS);
      if (data) return JSON.parse(data);
      return INITIAL_AI_INSIGHT;
    } catch {
      return INITIAL_AI_INSIGHT;
    }
  },

  // -------------------------------------------------------------
  // PHASE 3: GAMIFICATION, QUESTS, BADGES, STREAKS, AND XP LEDGER
  // -------------------------------------------------------------

  getQuests(): QuestItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTS);
      if (data) return JSON.parse(data);
      return INITIAL_QUESTS;
    } catch {
      return INITIAL_QUESTS;
    }
  },

  setQuests(quests: QuestItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
    } catch (e) {
      console.warn('Storage failed to write quests', e);
    }
  },

  claimQuest(questId: string): { quest?: QuestItem; xpAwarded: number } {
    const quests = this.getQuests();
    const idx = quests.findIndex((q) => q.id === questId);
    if (idx === -1) return { xpAwarded: 0 };

    const quest = quests[idx];
    if (quest.claimed || quest.currentCount < quest.targetCount) {
      return { quest, xpAwarded: 0 };
    }

    quest.claimed = true;
    quests[idx] = quest;
    this.setQuests(quests);

    // Atomically calculate level progression and log ledger transaction
    const { xpAwarded } = this.awardProgressionXp(
      quest.xpReward,
      `Claimed Quest: ${quest.title}`,
      'quest'
    );

    return { quest, xpAwarded };
  },

  updateQuestProgress(targetType: QuestItem['targetType'], incrementBy = 1): QuestItem[] {
    const quests = this.getQuests();
    let changed = false;

    const updated = quests.map((q) => {
      if (q.targetType === targetType && !q.claimed) {
        const newCount = Math.min(q.targetCount, q.currentCount + incrementBy);
        if (newCount !== q.currentCount) {
          changed = true;
          return { ...q, currentCount: newCount };
        }
      }
      return q;
    });

    if (changed) {
      this.setQuests(updated);
    }
    return updated;
  },

  getBadges(): AchievementBadge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BADGES);
      if (data) return JSON.parse(data);
      return INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  },

  setBadges(badges: AchievementBadge[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    } catch (e) {
      console.warn('Storage failed to write badges', e);
    }
  },

  unlockBadge(badgeId: string): { badge?: AchievementBadge; xpAwarded: number } {
    const badges = this.getBadges();
    const idx = badges.findIndex((b) => b.id === badgeId);
    if (idx === -1) return { xpAwarded: 0 };

    const badge = badges[idx];
    if (badge.unlocked) return { badge, xpAwarded: 0 };

    badge.unlocked = true;
    badge.unlockedAt = new Date().toISOString().split('T')[0];
    badge.progress = badge.maxProgress;
    badges[idx] = badge;
    this.setBadges(badges);

    const { xpAwarded } = this.awardProgressionXp(
      badge.xpReward,
      `Unlocked Badge: ${badge.title}`,
      'badge'
    );

    return { badge, xpAwarded };
  },

  getStreakData(): StreakSystemData {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (data) return JSON.parse(data);
      return INITIAL_STREAK_DATA;
    } catch {
      return INITIAL_STREAK_DATA;
    }
  },

  setStreakData(streakData: StreakSystemData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakData));
    } catch (e) {
      console.warn('Storage failed to write streak data', e);
    }
  },

  toggleStreakFreeze(): boolean {
    const data = this.getStreakData();
    if (data.streakShields <= 0 && !data.freezeActive) return false;

    if (!data.freezeActive) {
      data.streakShields -= 1;
      data.freezeActive = true;
    } else {
      data.freezeActive = false;
    }
    this.setStreakData(data);
    return true;
  },

  refillStreakShields(): StreakSystemData {
    const data = this.getStreakData();
    data.streakShields = data.maxShields;
    this.setStreakData(data);
    return data;
  },

  getXpTransactions(): XpTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
      if (data) return JSON.parse(data);
      return INITIAL_XP_TRANSACTIONS;
    } catch {
      return INITIAL_XP_TRANSACTIONS;
    }
  },

  addXpTransaction(txData: Omit<XpTransaction, 'id' | 'timestamp'>): XpTransaction {
    const transactions = this.getXpTransactions();
    const streak = this.getStreakData();

    const newTx: XpTransaction = {
      id: `xpt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      amount: txData.amount,
      reason: txData.reason,
      category: txData.category,
      streakMultiplier: txData.streakMultiplier || streak.multiplier,
    };

    const updated = [newTx, ...transactions.slice(0, 99)]; // Keep latest 100
    try {
      localStorage.setItem(STORAGE_KEYS.XP_TRANSACTIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage failed to write XP transaction', e);
    }

    return newTx;
  },

  /**
   * Centralized XP Progression Awarder.
   * Atomically computes non-linear level curve, updates UserProfile, records ledger transaction,
   * updates daily quest XP counters, and returns the unified state.
   */
  awardProgressionXp(
    rawAmount: number,
    reason: string,
    category: 'task' | 'habit' | 'goal' | 'learning' | 'trading' | 'quest' | 'badge' | 'boss'
  ): { user: UserProfile; xpAwarded: number; leveledUp: boolean } {
    const user = this.getUser() || INITIAL_USER;
    const streak = this.getStreakData();
    let multiplier = streak.multiplier || 1.0;

    // Apply active passive bonuses from unlocked skill perk nodes
    try {
      const unlockedPerks = this.getSkillPerks().filter((p) => p.unlocked);
      for (const perk of unlockedPerks) {
        if (typeof perk.bonusMultiplier === 'number') {
          const bonus = perk.bonusMultiplier >= 1.0 ? perk.bonusMultiplier - 1.0 : perk.bonusMultiplier;
          if (perk.domain === 'execution' && (category === 'task' || category === 'goal')) {
            multiplier += bonus;
          } else if (perk.domain === 'consistency' && category === 'habit') {
            multiplier += bonus;
          } else if (perk.domain === 'knowledge' && category === 'learning') {
            multiplier += bonus;
          } else if (perk.domain === 'strategy' && (category === 'trading' || category === 'boss')) {
            multiplier += bonus;
          }
        }
      }
    } catch {
      // Fallback to streak multiplier only
    }

    const finalAmount = Math.round(rawAmount * multiplier);

    // Calculate current lifetime total XP from existing user level + current level XP
    const currentBaseTotal = getTotalXpForLevel(user.level) + user.currentXp;
    const newTotalXp = currentBaseTotal + finalAmount;

    // Calculate new progression
    const prog = calculateProgression(newTotalXp);
    const leveledUp = prog.level > user.level;

    const updatedUser: UserProfile = {
      ...user,
      level: prog.level,
      currentXp: prog.currentLevelXp,
      nextLevelXp: prog.nextLevelXp,
      title: prog.rankInfo.title,
    };

    this.setUser(updatedUser);

    // Record ledger transaction
    this.addXpTransaction({
      amount: finalAmount,
      reason,
      category,
      streakMultiplier: multiplier,
    });

    // Update quests tracking xp_earned
    this.updateQuestProgress('xp_earned', finalAmount);

    return {
      user: updatedUser,
      xpAwarded: finalAmount,
      leveledUp,
    };
  },

  recordXpTransaction(txData: Omit<XpTransaction, 'id'> & { timestamp?: string }): XpTransaction {
    return this.addXpTransaction(txData);
  },

  // -------------------------------------------------------------
  // PHASE 5: LANGUAGE LEARNING SYSTEM (SRS, LESSONS, CONVERSATIONS)
  // -------------------------------------------------------------
  getLanguageProfile(): LanguageProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PROFILE);
      if (data) return JSON.parse(data);
      return INITIAL_LANGUAGE_PROFILE;
    } catch {
      return INITIAL_LANGUAGE_PROFILE;
    }
  },

  setLanguageProfile(profile: LanguageProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage failed to write language profile', e);
    }
  },

  setTargetLanguage(lang: TargetLanguage): void {
    const profile = this.getLanguageProfile();
    const updated = { ...profile, targetLanguage: lang };
    this.setLanguageProfile(updated);
  },

  updateLanguageHearts(delta: number): number {
    const profile = this.getLanguageProfile();
    const newHearts = Math.max(0, Math.min(profile.maxHearts, profile.hearts + delta));
    const updated = { ...profile, hearts: newHearts };
    this.setLanguageProfile(updated);
    return newHearts;
  },

  refillHearts(): void {
    const profile = this.getLanguageProfile();
    const updated = { ...profile, hearts: profile.maxHearts };
    this.setLanguageProfile(updated);
  },

  getLanguageUnits(language?: TargetLanguage): LanguageUnit[] {
    const currentLang = language || this.getLanguageProfile().targetLanguage;
    try {
      const allUnitsKey = `${STORAGE_KEYS.LANGUAGE_UNITS}_${currentLang}`;
      const data = localStorage.getItem(allUnitsKey);
      if (data) return JSON.parse(data);
      return getUnitsForLanguage(currentLang);
    } catch {
      return getUnitsForLanguage(currentLang);
    }
  },

  setLanguageUnits(units: LanguageUnit[], language?: TargetLanguage): void {
    const currentLang = language || this.getLanguageProfile().targetLanguage;
    try {
      const allUnitsKey = `${STORAGE_KEYS.LANGUAGE_UNITS}_${currentLang}`;
      localStorage.setItem(allUnitsKey, JSON.stringify(units));
    } catch (e) {
      console.warn('Storage failed to write language units', e);
    }
  },

  completeLanguageLesson(
    unitId: string,
    lessonId: string,
    scorePercentage: number
  ): { unit: LanguageUnit | null; lesson: LanguageLesson | null; xpAwarded: number } {
    const profile = this.getLanguageProfile();
    const units = this.getLanguageUnits(profile.targetLanguage);
    let targetUnit: LanguageUnit | null = null;
    let targetLesson: LanguageLesson | null = null;
    let xpAwarded = 0;

    const updatedUnits = units.map((u) => {
      if (u.id === unitId) {
        const updatedLessons = u.lessons.map((les) => {
          if (les.id === lessonId) {
            const wasCompleted = les.completed;
            if (!wasCompleted) {
              xpAwarded = les.xpReward || 40;
            }
            targetLesson = {
              ...les,
              completed: true,
              scorePercentage: Math.max(les.scorePercentage || 0, scorePercentage),
            };
            return targetLesson;
          }
          return les;
        });
        targetUnit = { ...u, lessons: updatedLessons };
        return targetUnit;
      }
      return u;
    });

    this.setLanguageUnits(updatedUnits, profile.targetLanguage);

    // Update profile daily count
    const updatedProfile: LanguageProfile = {
      ...profile,
      dailyLessonsCompletedToday: profile.dailyLessonsCompletedToday + 1,
    };
    this.setLanguageProfile(updatedProfile);

    return { unit: targetUnit, lesson: targetLesson, xpAwarded };
  },

  getVocabVault(language?: TargetLanguage): VocabItem[] {
    const units = this.getLanguageUnits(language);
    const lessonVocab = units.flatMap((u) => u.lessons.flatMap((l) => l.vocabItems));
    const profile = this.getLanguageProfile();
    const custom = (profile.customVocab || []).filter((v) => !language || v.language === language);
    return [...lessonVocab, ...custom];
  },

  updateVocabMastery(vocabId: string, newLevel: number): void {
    const profile = this.getLanguageProfile();
    const units = this.getLanguageUnits(profile.targetLanguage);
    let foundInLessons = false;

    const updatedUnits = units.map((u) => {
      const updatedLessons = u.lessons.map((l) => {
        const updatedVocab = l.vocabItems.map((v) => {
          if (v.id === vocabId) {
            foundInLessons = true;
            return {
              ...v,
              masteryLevel: Math.max(1, Math.min(5, newLevel)),
              nextReviewDate: new Date(Date.now() + newLevel * 24 * 60 * 60 * 1000).toISOString(),
            };
          }
          return v;
        });
        return { ...l, vocabItems: updatedVocab };
      });
      return { ...u, lessons: updatedLessons };
    });

    if (foundInLessons) {
      this.setLanguageUnits(updatedUnits, profile.targetLanguage);
    } else {
      // Check custom vocab
      const updatedCustom = (profile.customVocab || []).map((v) => {
        if (v.id === vocabId) {
          return {
            ...v,
            masteryLevel: Math.max(1, Math.min(5, newLevel)),
            nextReviewDate: new Date(Date.now() + newLevel * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
        return v;
      });
      this.setLanguageProfile({ ...profile, customVocab: updatedCustom });
    }
  },

  addCustomVocab(vocabData: Omit<VocabItem, 'id'>): VocabItem {
    const profile = this.getLanguageProfile();
    const newVocab: VocabItem = {
      ...vocabData,
      id: `voc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      masteryLevel: 1,
      nextReviewDate: new Date().toISOString(),
    };
    const updated = {
      ...profile,
      customVocab: [newVocab, ...(profile.customVocab || [])],
    };
    this.setLanguageProfile(updated);
    return newVocab;
  },

  // -------------------------------------------------------------
  // PHASE 6: TRADING TERMINAL & JOURNAL METHODS
  // -------------------------------------------------------------

  getMarketSymbols(): MarketSymbol[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADING_SYMBOLS);
      if (data) return JSON.parse(data);
      return INITIAL_MARKET_SYMBOLS;
    } catch {
      return INITIAL_MARKET_SYMBOLS;
    }
  },

  getTradingSymbols(): MarketSymbol[] {
    return this.getMarketSymbols();
  },

  setMarketSymbols(symbols: MarketSymbol[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADING_SYMBOLS, JSON.stringify(symbols));
    } catch (err) {
      console.error('Failed to save trading symbols', err);
    }
  },

  getTradingAccount(): TradingAccount {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADING_ACCOUNT);
      if (data) return JSON.parse(data);
      return INITIAL_TRADING_ACCOUNT;
    } catch {
      return INITIAL_TRADING_ACCOUNT;
    }
  },

  setTradingAccount(account: TradingAccount): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADING_ACCOUNT, JSON.stringify(account));
    } catch (err) {
      console.error('Failed to save trading account', err);
    }
  },

  saveTradingAccount(account: TradingAccount): void {
    this.setTradingAccount(account);
  },

  getTradeJournal(): TradeJournalEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADING_JOURNAL);
      if (data) return JSON.parse(data);
      return INITIAL_TRADE_JOURNAL;
    } catch {
      return INITIAL_TRADE_JOURNAL;
    }
  },

  setTradeJournal(journal: TradeJournalEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADING_JOURNAL, JSON.stringify(journal));
    } catch (err) {
      console.error('Failed to save trade journal', err);
    }
  },

  saveTradeJournal(journal: TradeJournalEntry[]): void {
    this.setTradeJournal(journal);
  },

  addTradeJournalEntry(entry: Omit<TradeJournalEntry, 'id'>): TradeJournalEntry {
    const journal = this.getTradeJournal();
    const newEntry: TradeJournalEntry = {
      ...entry,
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    const updated = [newEntry, ...journal];
    this.setTradeJournal(updated);
    return newEntry;
  },

  updateTradeJournalEntry(id: string, updates: Partial<TradeJournalEntry>): TradeJournalEntry | null {
    const journal = this.getTradeJournal();
    let updatedEntry: TradeJournalEntry | null = null;
    const updated = journal.map((item) => {
      if (item.id === id) {
        updatedEntry = { ...item, ...updates };
        return updatedEntry;
      }
      return item;
    });
    this.setTradeJournal(updated);
    return updatedEntry;
  },

  deleteTradeJournalEntry(id: string): void {
    const journal = this.getTradeJournal();
    this.setTradeJournal(journal.filter((j) => j.id !== id));
  },

  createOrder(order: Omit<ActiveOrder, 'id' | 'openedAt' | 'pnl' | 'pnlPercent' | 'status'>): ActiveOrder {
    const account = this.getTradingAccount();
    const newOrder: ActiveOrder = {
      ...order,
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      openedAt: Date.now(),
      status: 'open',
      pnl: 0,
      pnlPercent: 0,
    };
    const updated: TradingAccount = {
      ...account,
      openOrders: [newOrder, ...account.openOrders],
    };
    this.setTradingAccount(updated);
    return newOrder;
  },

  closeOrder(orderId: string, exitPrice: number): { closedOrder: ActiveOrder; journalEntry: TradeJournalEntry } | null {
    const account = this.getTradingAccount();
    const orderIndex = account.openOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return null;

    const order = account.openOrders[orderIndex];
    const isLong = order.direction === 'long';
    const priceDiff = isLong ? exitPrice - order.entryPrice : order.entryPrice - exitPrice;
    
    // Calculate PnL based on size
    const pnl = priceDiff * order.size;
    const pnlPercent = (priceDiff / order.entryPrice) * 100;
    
    // Calculate R-multiple if stop loss was defined
    let rMultiple = 0;
    let riskAmount = Math.abs(order.entryPrice * order.size * (account.riskPerTradePercent / 100));
    if (order.stopLoss) {
      const riskDistance = Math.abs(order.entryPrice - order.stopLoss);
      riskAmount = riskDistance * order.size;
      rMultiple = riskDistance > 0 ? Number((priceDiff / riskDistance).toFixed(2)) : 0;
    }

    const closedOrder: ActiveOrder = {
      ...order,
      status: 'closed',
      closedAt: Date.now(),
      closePrice: exitPrice,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      rMultiple,
    };

    // Auto-create journal entry
    const symbols = this.getMarketSymbols();
    const symObj = symbols.find((s) => s.symbol === order.symbol);
    const category = symObj?.category || 'Crypto';

    const journalEntry: TradeJournalEntry = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      symbol: order.symbol,
      category,
      direction: order.direction,
      entryDate: order.timestamp || new Date(order.openedAt || Date.now()).toISOString(),
      exitDate: new Date().toISOString(),
      entryPrice: order.entryPrice,
      exitPrice,
      stopLoss: order.stopLoss || order.entryPrice * (isLong ? 0.98 : 1.02),
      takeProfit: order.takeProfit,
      positionSize: order.size,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      rMultiple,
      riskAmount: Number(riskAmount.toFixed(2)),
      status: pnl > 0.01 ? 'win' : pnl < -0.01 ? 'loss' : 'breakeven',
      setupStrategy: order.strategy || 'Replay Market Execution',
      session: 'New York AM',
      emotion: 'Disciplined',
      mistakes: ['None'],
      notes: order.notes || `Executed via Replay Terminal at ${order.entryPrice} and closed at ${exitPrice}.`,
      rating: pnl > 0 ? 5 : 4,
    };

    const newBalance = Number((account.balance + pnl).toFixed(2));
    const newOpenOrders = account.openOrders.filter((o) => o.id !== orderId);
    const newClosedOrders = [closedOrder, ...account.closedOrders];
    const newJournal = [journalEntry, ...this.getTradeJournal()];

    this.setTradingAccount({
      ...account,
      balance: newBalance,
      openOrders: newOpenOrders,
      closedOrders: newClosedOrders,
      journal: newJournal,
    });
    this.setTradeJournal(newJournal);

    return { closedOrder, journalEntry };
  },

  getChartDrawings(symbol: string): ChartDrawing[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADING_DRAWINGS);
      const allDrawings: Record<string, ChartDrawing[]> = data ? JSON.parse(data) : {};
      return allDrawings[symbol] || [];
    } catch {
      return [];
    }
  },

  saveChartDrawings(symbol: string, drawings: ChartDrawing[]): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADING_DRAWINGS);
      const allDrawings: Record<string, ChartDrawing[]> = data ? JSON.parse(data) : {};
      allDrawings[symbol] = drawings;
      localStorage.setItem(STORAGE_KEYS.TRADING_DRAWINGS, JSON.stringify(allDrawings));
    } catch (err) {
      console.error('Failed to save chart drawings', err);
    }
  },

  // -------------------------------------------------------------
  // AI COACH & OPERATING PARTNER (PHASE 7)
  // -------------------------------------------------------------

  getAIChatHistory(): AIChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_CHAT_HISTORY);
      if (data) return JSON.parse(data);
      return INITIAL_AI_CHAT_HISTORY;
    } catch {
      return INITIAL_AI_CHAT_HISTORY;
    }
  },

  setAIChatHistory(history: AIChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_CHAT_HISTORY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save AI chat history', err);
    }
  },

  addAIChatMessage(message: AIChatMessage): AIChatMessage[] {
    const history = this.getAIChatHistory();
    const updated = [...history, message];
    this.setAIChatHistory(updated);
    return updated;
  },

  clearAIChatHistory(): void {
    this.setAIChatHistory(INITIAL_AI_CHAT_HISTORY);
  },

  getAISettings(): AICoachSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
      if (data) return JSON.parse(data);
      return INITIAL_AI_SETTINGS;
    } catch {
      return INITIAL_AI_SETTINGS;
    }
  },

  setAISettings(settings: AICoachSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save AI settings', err);
    }
  },

  getAIScheduleAudits(): AIScheduleAuditResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE_AUDITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAIScheduleAudit(audit: AIScheduleAuditResult): void {
    try {
      const audits = this.getAIScheduleAudits();
      const updated = [audit, ...audits.slice(0, 9)];
      localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE_AUDITS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save schedule audit', err);
    }
  },

  getAIStudyPlans(): AIStudyPlanResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_STUDY_PLANS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAIStudyPlan(plan: AIStudyPlanResult): void {
    try {
      const plans = this.getAIStudyPlans();
      const filtered = plans.filter((p) => p.id !== plan.id);
      const updated = [plan, ...filtered];
      localStorage.setItem(STORAGE_KEYS.AI_STUDY_PLANS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save AI study plan', err);
    }
  },

  deleteAIStudyPlan(id: string): void {
    try {
      const plans = this.getAIStudyPlans();
      const updated = plans.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.AI_STUDY_PLANS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete AI study plan', err);
    }
  },

  getAIDailyBriefings(): AIDailyBriefingResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_DAILY_BRIEFINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAIDailyBriefing(briefing: AIDailyBriefingResult): void {
    try {
      const briefings = this.getAIDailyBriefings();
      const filtered = briefings.filter((b) => b.id !== briefing.id && b.date !== briefing.date);
      const updated = [briefing, ...filtered.slice(0, 14)];
      localStorage.setItem(STORAGE_KEYS.AI_DAILY_BRIEFINGS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save AI daily briefing', err);
    }
  },

  getAITradingAnalyses(): AITradingAnalysisResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_TRADING_ANALYSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAITradingAnalysis(analysis: AITradingAnalysisResult): void {
    try {
      const analyses = this.getAITradingAnalyses();
      const updated = [analysis, ...analyses.slice(0, 9)];
      localStorage.setItem(STORAGE_KEYS.AI_TRADING_ANALYSES, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save trading analysis', err);
    }
  },

  // -------------------------------------------------------------------
  // PHASE 8: BOSS BATTLES & RAIDS
  // -------------------------------------------------------------------
  getBossBattles(): BossBattle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOSS_BATTLES);
      if (data) return JSON.parse(data);
      return INITIAL_BOSS_BATTLES;
    } catch {
      return INITIAL_BOSS_BATTLES;
    }
  },

  setBossBattles(bosses: BossBattle[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BOSS_BATTLES, JSON.stringify(bosses));
    } catch (err) {
      console.error('Failed to save boss battles', err);
    }
  },

  getBossBattle(id: string): BossBattle | undefined {
    const bosses = this.getBossBattles();
    return bosses.find((b) => b.id === id);
  },

  damageActiveBoss(
    damageAmount: number,
    reason: string,
    category: string = 'task'
  ): { boss: BossBattle | null; isDefeated: boolean; newHp: number } {
    const bosses = this.getBossBattles();
    const activeBoss = bosses.find((b) => !b.defeated);
    if (!activeBoss) {
      return { boss: null, isDefeated: false, newHp: 0 };
    }

    const calculatedHp = Math.max(0, activeBoss.currentHp - damageAmount);
    const defeated = calculatedHp === 0;

    const damageEntry = {
      id: `dmg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      damage: damageAmount,
      reason,
      category,
    };

    const updatedBoss: BossBattle = {
      ...activeBoss,
      currentHp: calculatedHp,
      defeated,
      defeatedAt: defeated ? new Date().toISOString() : undefined,
      damageLog: [damageEntry, ...activeBoss.damageLog.slice(0, 19)],
    };

    const updatedBosses = bosses.map((b) => (b.id === activeBoss.id ? updatedBoss : b));
    this.setBossBattles(updatedBosses);

    // If defeated, award perk points automatically
    if (defeated && !activeBoss.defeated) {
      this.addPerkPoints(activeBoss.rewards.perkPoints || 3);
    }

    return {
      boss: updatedBoss,
      isDefeated: defeated,
      newHp: calculatedHp,
    };
  },

  resetBoss(id: string): BossBattle | null {
    const bosses = this.getBossBattles();
    let target: BossBattle | null = null;
    const updated = bosses.map((b) => {
      if (b.id === id) {
        target = {
          ...b,
          currentHp: b.maxHp,
          defeated: false,
          defeatedAt: undefined,
          damageLog: [],
        };
        return target;
      }
      return b;
    });
    this.setBossBattles(updated);
    return target;
  },

  // -------------------------------------------------------------------
  // PHASE 8: SKILL PERK TREE
  // -------------------------------------------------------------------
  getSkillPerks(): SkillPerkNode[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SKILL_PERKS);
      if (data) return JSON.parse(data);
      return INITIAL_SKILL_PERK_NODES;
    } catch {
      return INITIAL_SKILL_PERK_NODES;
    }
  },

  setSkillPerks(perks: SkillPerkNode[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SKILL_PERKS, JSON.stringify(perks));
    } catch (err) {
      console.error('Failed to save skill perks', err);
    }
  },

  getPerkPoints(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERK_POINTS);
      if (data !== null) return parseInt(data, 10);
      return 0; // Initial perk points balance for new user
    } catch {
      return 0;
    }
  },

  setPerkPoints(points: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PERK_POINTS, points.toString());
    } catch (err) {
      console.error('Failed to save perk points', err);
    }
  },

  addPerkPoints(amount: number): number {
    const current = this.getPerkPoints();
    const updated = Math.max(0, current + amount);
    this.setPerkPoints(updated);
    return updated;
  },

  unlockSkillPerk(nodeId: string): { success: boolean; message: string; perk?: SkillPerkNode } {
    const perks = this.getSkillPerks();
    const points = this.getPerkPoints();
    const targetNode = perks.find((p) => p.id === nodeId);

    if (!targetNode) {
      return { success: false, message: 'Skill perk node not found' };
    }

    if (targetNode.unlocked) {
      return { success: false, message: 'Perk is already unlocked' };
    }

    if (points < targetNode.costPoints) {
      return {
        success: false,
        message: `Insufficient Perk Points. Requires ${targetNode.costPoints} SP (You have ${points} SP). Defeat Boss Raids or level up to earn more.`,
      };
    }

    // Check dependencies
    const missingDeps = targetNode.dependencies.filter((depId) => {
      const depNode = perks.find((p) => p.id === depId);
      return !depNode || !depNode.unlocked;
    });

    if (missingDeps.length > 0) {
      return {
        success: false,
        message: 'Prerequisite skill perk in this branch must be unlocked first.',
      };
    }

    const updatedNode: SkillPerkNode = {
      ...targetNode,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    };

    const updatedPerks = perks.map((p) => (p.id === nodeId ? updatedNode : p));
    this.setSkillPerks(updatedPerks);
    this.setPerkPoints(points - targetNode.costPoints);

    return {
      success: true,
      message: `Successfully unlocked "${targetNode.title}"! Passive effect active.`,
      perk: updatedNode,
    };
  },

  resetSkillPerks(): void {
    const perks = this.getSkillPerks();
    let totalRefund = 0;
    const resetPerks = perks.map((p) => {
      if (p.unlocked) {
        totalRefund += p.costPoints;
      }
      return {
        ...p,
        unlocked: false,
        unlockedAt: undefined,
      };
    });
    this.setSkillPerks(resetPerks);
    this.setPerkPoints(this.getPerkPoints() + totalRefund);
  },

  // -------------------------------------------------------------------
  // PHASE 8: CROSS-DOMAIN LIFE ANALYTICS & RADAR (DYNAMICALLY COMPUTED)
  // -------------------------------------------------------------------
  getCrossDomainAnalytics(): CrossDomainLifeRadarData {
    try {
      const user = this.getUser();
      const tasks = this.getTasks();
      const habits = this.getHabits();
      const goals = this.getGoals();
      const courses = this.getDetailedCourses();
      const langProfile = this.getLanguageProfile();
      const trades = this.getTradeJournal();

      // 1. Task Execution & High-Priority Throughput (0-100)
      const completedTasks = tasks.filter((t) => t.completed);
      const taskScore = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 75;

      // 2. Habit Consistency & Daily Discipline (0-100)
      const activeHabits = habits.length > 0 ? habits : [];
      const totalStreakDays = activeHabits.reduce((acc, h) => acc + (h.currentStreak || 0), 0);
      const avgStreak = activeHabits.length > 0 ? totalStreakDays / activeHabits.length : 0;
      const habitScore = Math.min(100, Math.round(avgStreak * 4 + (activeHabits.filter((h) => h.completedToday).length / (activeHabits.length || 1)) * 40));

      // 3. Technical Mastery & Course Progress (0-100)
      const allLessons = courses.flatMap((c) => c.modules.flatMap((m) => m.lessons));
      const completedLessons = allLessons.filter((l) => l.completed).length;
      const learningScore = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 50;

      // 4. Multilingual Acquisition & SRS Vocabulary (0-100)
      const vocabItems = this.getVocabVault();
      const masteredVocab = vocabItems.filter((v) => (v.masteryLevel || 0) >= 3).length;
      const languageScore = Math.min(100, Math.round((masteredVocab / Math.max(vocabItems.length, 20)) * 70 + (langProfile.dailyLessonsCompletedToday > 0 ? 30 : 10)));

      // 5. Market Execution Edge & Risk Discipline (0-100)
      const closedTrades = trades.filter((t) => t.status === 'win' || t.status === 'loss');
      const winTrades = closedTrades.filter((t) => t.status === 'win');
      const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 65;
      const tradingScore = Math.min(100, Math.max(20, Math.round(winRate * 0.7 + (closedTrades.length >= 5 ? 30 : 15))));

      // 6. Strategic Goals & Multi-Year Milestone Execution (0-100)
      const allMilestones = goals.flatMap((g) => g.milestones);
      const completedMilestones = allMilestones.filter((m) => m.completed).length;
      const goalScore = allMilestones.length > 0 ? Math.round((completedMilestones / allMilestones.length) * 100) : 60;

      const metrics: DomainRadarMetric[] = [
        {
          pillar: 'Execution & Velocity',
          domainKey: 'execution',
          score: Math.max(15, taskScore),
          benchmark: 80,
          grade: taskScore >= 90 ? 'S' : taskScore >= 80 ? 'A' : taskScore >= 65 ? 'B' : taskScore >= 50 ? 'C' : 'D',
          summary: `${completedTasks.length} of ${tasks.length} tasks resolved`,
          primaryMetricLabel: 'Task Resolution Rate',
          primaryMetricValue: `${taskScore}%`,
          submetrics: [
            { label: 'High-Priority Completed', value: `${completedTasks.filter((t) => t.priority === 'high').length}`, status: taskScore >= 75 ? 'optimal' : 'good' },
            { label: 'Active Queue Size', value: `${tasks.filter((t) => !t.completed).length}`, status: 'optimal' },
          ],
        },
        {
          pillar: 'Habit Consistency & Discipline',
          domainKey: 'consistency',
          score: Math.max(15, habitScore),
          benchmark: 85,
          grade: habitScore >= 90 ? 'S' : habitScore >= 80 ? 'A' : habitScore >= 65 ? 'B' : habitScore >= 50 ? 'C' : 'D',
          summary: `Daily streak average at ${Math.round(avgStreak)} days`,
          primaryMetricLabel: 'Habit Completion Ratio',
          primaryMetricValue: `${habitScore}%`,
          submetrics: [
            { label: 'Completed Today', value: `${habits.filter((h) => h.completedToday).length}/${habits.length}`, status: habitScore >= 70 ? 'optimal' : 'good' },
            { label: 'Discipline Multiplier', value: `${this.getStreakData().multiplier || 1.0}x`, status: 'optimal' },
          ],
        },
        {
          pillar: 'Technical Mastery & CS',
          domainKey: 'intellect',
          score: Math.max(15, learningScore),
          benchmark: 75,
          grade: learningScore >= 90 ? 'S' : learningScore >= 80 ? 'A' : learningScore >= 65 ? 'B' : learningScore >= 50 ? 'C' : 'D',
          summary: `${completedLessons} course lessons mastered`,
          primaryMetricLabel: 'Course Progression',
          primaryMetricValue: `${learningScore}%`,
          submetrics: [
            { label: 'Enrolled Courses', value: `${courses.filter((c) => c.enrolled).length}`, status: 'optimal' },
            { label: 'Certificates Earned', value: `${courses.filter((c) => c.certificate).length}`, status: 'good' },
          ],
        },
        {
          pillar: 'Language Acquisition & SRS',
          domainKey: 'linguistics',
          score: Math.max(15, languageScore),
          benchmark: 70,
          grade: languageScore >= 90 ? 'S' : languageScore >= 80 ? 'A' : languageScore >= 65 ? 'B' : languageScore >= 50 ? 'C' : 'D',
          summary: `${masteredVocab} vocabulary items in long-term memory`,
          primaryMetricLabel: 'SRS Retention Index',
          primaryMetricValue: `${languageScore}%`,
          submetrics: [
            { label: 'Target Language', value: langProfile.targetLanguage.toUpperCase(), status: 'optimal' },
            { label: 'Hearts Guarded', value: `${langProfile.hearts}/${langProfile.maxHearts}`, status: 'optimal' },
          ],
        },
        {
          pillar: 'Market Execution & Risk Edge',
          domainKey: 'trading',
          score: Math.max(15, tradingScore),
          benchmark: 70,
          grade: tradingScore >= 90 ? 'S' : tradingScore >= 80 ? 'A' : tradingScore >= 65 ? 'B' : tradingScore >= 50 ? 'C' : 'D',
          summary: `Win rate: ${Math.round(winRate)}% across ${closedTrades.length} paper trades`,
          primaryMetricLabel: 'Risk Disciplined Edge',
          primaryMetricValue: `${tradingScore}%`,
          submetrics: [
            { label: 'Total Journaled', value: `${trades.length}`, status: 'optimal' },
            { label: 'Average R-Multiple', value: `${trades.length > 0 ? (trades.reduce((a, t) => a + (t.rMultiple || 0), 0) / trades.length).toFixed(1) : 1.8}R`, status: 'optimal' },
          ],
        },
        {
          pillar: 'Strategic Goals & Vision',
          domainKey: 'strategy',
          score: Math.max(15, goalScore),
          benchmark: 75,
          grade: goalScore >= 90 ? 'S' : goalScore >= 80 ? 'A' : goalScore >= 65 ? 'B' : goalScore >= 50 ? 'C' : 'D',
          summary: `${completedMilestones} quarterly milestones achieved`,
          primaryMetricLabel: 'Milestone Execution',
          primaryMetricValue: `${goalScore}%`,
          submetrics: [
            { label: 'Active Objectives', value: `${goals.length}`, status: 'optimal' },
            { label: 'Milestone Throughput', value: `${completedMilestones}/${allMilestones.length}`, status: 'optimal' },
          ],
        },
      ];

      const overallSynergyScore = Math.round(
        metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length
      );

      const synergyTier: 'Transcendent' | 'Optimal' | 'Balanced' | 'Fragmented' =
        overallSynergyScore >= 90
          ? 'Transcendent'
          : overallSynergyScore >= 75
          ? 'Optimal'
          : overallSynergyScore >= 60
          ? 'Balanced'
          : 'Fragmented';

      return {
        metrics,
        overallSynergyScore,
        synergyTier,
        insights: [
          {
            id: 'syn-1',
            title: 'Cognitive Domain Alignment',
            description: `Your cross-domain balance is currently rated ${synergyTier} (${overallSynergyScore}/100). Technical execution and daily discipline form your strongest foundational pillar.`,
            impact: 'positive',
            actionableStep: 'Continue current daily habit rhythm and prioritize highest-yield quarterly goal milestones.',
          },
          {
            id: 'syn-2',
            title: 'Learning & Execution Synergy',
            description: 'Coupling spaced retrieval with hands-on coding tasks produces superior long-term retention and rapid XP progression.',
            impact: 'neutral',
            actionableStep: 'Schedule a 45-minute focused study block followed by practice implementation.',
          },
        ],
      };
    } catch {
      return INITIAL_CROSS_DOMAIN_RADAR;
    }
  },

  saveCrossDomainAnalytics(radar: CrossDomainLifeRadarData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CROSS_DOMAIN_ANALYTICS, JSON.stringify(radar));
    } catch (err) {
      console.error('Failed to save cross-domain analytics', err);
    }
  },

  getHistoricalXpTrend(): HistoricalXpTrendPoint[] {
    try {
      const txs = this.getXpTransactions();
      const points: HistoricalXpTrendPoint[] = [];

      // Generate points for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

        const dayTxs = txs.filter((t) => t.timestamp && t.timestamp.startsWith(dateKey));
        const dayTotal = dayTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

        points.push({
          date: dateKey,
          displayDate: dayLabel,
          xp: dayTotal > 0 ? dayTotal : (i === 0 ? 120 : Math.max(50, 180 - i * 15)),
          tasksCompleted: dayTxs.filter((t) => t.category === 'task').length || (i === 0 ? 3 : 2),
          habitsChecked: dayTxs.filter((t) => t.category === 'habit').length || (i === 0 ? 4 : 3),
          studyMinutes: dayTxs.filter((t) => t.category === 'learning').length * 25 || 45,
          tradingTrades: dayTxs.filter((t) => t.category === 'trading').length || 1,
        });
      }

      return points;
    } catch {
      return INITIAL_HISTORICAL_XP_TREND;
    }
  },

  getDomainDistribution(): DomainDistributionPoint[] {
    try {
      const txs = this.getXpTransactions();
      const catCounts: Record<string, number> = {
        'Tasks & Work': 0,
        'Habits': 0,
        'Learning': 0,
        'Languages': 0,
        'Trading': 0,
        'Goals': 0,
      };

      txs.forEach((t) => {
        if (t.category === 'task') catCounts['Tasks & Work'] += t.amount;
        else if (t.category === 'habit') catCounts['Habits'] += t.amount;
        else if (t.category === 'learning') catCounts['Learning'] += t.amount;
        else if (t.category === 'trading') catCounts['Trading'] += t.amount;
        else if (t.category === 'goal') catCounts['Goals'] += t.amount;
        else catCounts['Tasks & Work'] += t.amount;
      });

      const total = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1000;
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

      return Object.entries(catCounts).map(([name, xp], idx) => ({
        name,
        xp: xp || 150,
        percentage: Math.max(5, Math.round(((xp || 150) / total) * 100)),
        color: colors[idx % colors.length],
      }));
    } catch {
      return INITIAL_DOMAIN_DISTRIBUTION;
    }
  },

  getFlowHourHeatmap(): FlowHourHeatmapPoint[] {
    try {
      const tasks = this.getTasks().filter((t) => t.completed && t.completedAt);
      const hourCounts: Record<number, number> = {};

      for (let h = 6; h <= 22; h++) {
        hourCounts[h] = 0;
      }

      tasks.forEach((t) => {
        if (t.completedAt) {
          const hour = new Date(t.completedAt).getHours();
          if (hourCounts[hour] !== undefined) {
            hourCounts[hour] += 1;
          }
        }
      });

      const heatmap: FlowHourHeatmapPoint[] = [];

      for (let hour = 6; hour <= 22; hour++) {
        const count = hourCounts[hour] || 0;
        const intensity: 'none' | 'low' | 'medium' | 'high' | 'peak' =
          count >= 4 ? 'peak' : count >= 2 ? 'high' : count >= 1 ? 'medium' : hour >= 9 && hour <= 17 ? 'low' : 'none';

        heatmap.push({
          hour,
          label: `${hour.toString().padStart(2, '0')}:00`,
          focusUnits: Math.max(count, intensity === 'peak' ? 4 : intensity === 'high' ? 2 : 1),
          intensity,
        });
      }

      return heatmap;
    } catch {
      return INITIAL_FLOW_HEATMAP;
    }
  },

  /**
   * Unified Cross-Domain Life Context for AI Coach, Daily Briefings, Simulator, and Diagnostics
   */
  getLifeContext(): Record<string, any> {
    const user = this.getUser();
    const tasks = this.getTasks();
    const habits = this.getHabits();
    const goals = this.getGoals();
    const courses = this.getDetailedCourses();
    const langProfile = this.getLanguageProfile();
    const trades = this.getTradeJournal();
    const activeBoss = this.getBossBattles().find((b) => !b.defeated);
    const perkPoints = this.getPerkPoints();
    const biometrics = this.getBiometrics();

    const pendingHighPriorityTasks = tasks.filter((t) => !t.completed && t.priority === 'high');
    const habitsCompletedToday = habits.filter((h) => h.completedToday).length;

    return {
      user: {
        name: user?.name || 'User',
        level: user?.level || 1,
        title: user?.title || 'Initiate',
        currentXp: user?.currentXp || 0,
        nextLevelXp: user?.nextLevelXp || 400,
        streakDays: user?.streakDays || 0,
        perkPoints,
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
        pendingHighPriority: pendingHighPriorityTasks.map((t) => ({ title: t.title, time: t.time, category: t.category })),
      },
      habits: {
        total: habits.length,
        completedToday: habitsCompletedToday,
        activeStreaks: habits.map((h) => ({ name: h.title || h.name, streak: h.currentStreak, completedToday: h.completedToday })),
      },
      goals: goals.map((g) => ({
        title: g.title,
        quarter: g.quarter,
        progress: g.progress,
        completedMilestones: g.milestones.filter((m) => m.completed).length,
        totalMilestones: g.milestones.length,
      })),
      courses: courses.map((c) => ({
        title: c.title,
        domain: c.domain,
        progress: c.modules.flatMap((m) => m.lessons).filter((l) => l.completed).length,
      })),
      language: {
        targetLanguage: langProfile.targetLanguage,
        hearts: langProfile.hearts,
        lessonsCompletedToday: langProfile.dailyLessonsCompletedToday,
        vocabMasteredCount: this.getVocabVault().filter((v) => (v.masteryLevel || 0) >= 3).length,
      },
      trading: {
        totalTrades: trades.length,
        winCount: trades.filter((t) => t.status === 'win').length,
        lossCount: trades.filter((t) => t.status === 'loss').length,
        recentTrades: trades.slice(0, 5).map((t) => ({ symbol: t.symbol, direction: t.direction, rMultiple: t.rMultiple, status: t.status })),
      },
      bossRaid: activeBoss
        ? { name: activeBoss.name, currentHp: activeBoss.currentHp, maxHp: activeBoss.maxHp, defeated: activeBoss.defeated }
        : null,
      biometrics: biometrics ? { readinessScore: biometrics.readinessScore, sleepHours: biometrics.sleepHours } : null,
    };
  },

  getSystemSnapshot(): SystemSnapshotMetadata {
    const user = this.getUser();
    const tasks = this.getTasks();
    const habits = this.getHabits();
    const goals = this.getGoals();
    const courses = this.getDetailedCourses();
    const trades = this.getTradeJournal();

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0-phase9',
      totalXp: user ? user.currentXp : 7420,
      level: user ? user.level : 17,
      tasksCount: tasks.length,
      habitsCount: habits.length,
      goalsCount: goals.length,
      coursesCount: courses.length,
      tradesCount: trades.length,
    };
  },

  // -------------------------------------------------------------------
  // PHASE 9: LIFE AUTOMATIONS & RECIPES ENGINE
  // -------------------------------------------------------------------
  getAutomations(): LifeAutomationRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIFE_AUTOMATIONS);
      if (data) return JSON.parse(data);
      return INITIAL_AUTOMATIONS;
    } catch {
      return INITIAL_AUTOMATIONS;
    }
  },

  setAutomations(rules: LifeAutomationRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIFE_AUTOMATIONS, JSON.stringify(rules));
    } catch (err) {
      console.error('Failed to save automations', err);
    }
  },

  toggleAutomation(id: string): LifeAutomationRule | null {
    const list = this.getAutomations();
    let updatedItem: LifeAutomationRule | null = null;
    const updated = list.map((r) => {
      if (r.id === id) {
        updatedItem = { ...r, enabled: !r.enabled };
        return updatedItem;
      }
      return r;
    });
    this.setAutomations(updated);
    return updatedItem;
  },

  createAutomation(rule: Omit<LifeAutomationRule, 'id' | 'runCount' | 'lastTriggeredAt'>): LifeAutomationRule {
    const list = this.getAutomations();
    const newRule: LifeAutomationRule = {
      ...rule,
      id: `auto-${Date.now()}`,
      runCount: 0,
    };
    this.setAutomations([newRule, ...list]);
    return newRule;
  },

  deleteAutomation(id: string): void {
    const list = this.getAutomations();
    this.setAutomations(list.filter((r) => r.id !== id));
  },

  getAutomationLogs(): AutomationExecutionLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTOMATION_LOGS);
      if (data) return JSON.parse(data);
      return INITIAL_AUTOMATION_LOGS;
    } catch {
      return INITIAL_AUTOMATION_LOGS;
    }
  },

  logAutomationExecution(log: Omit<AutomationExecutionLog, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getAutomationLogs();
      const newEntry: AutomationExecutionLog = {
        ...log,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      const updated = [newEntry, ...logs.slice(0, 30)];
      localStorage.setItem(STORAGE_KEYS.AUTOMATION_LOGS, JSON.stringify(updated));

      // Increment run count
      const automations = this.getAutomations();
      const updatedRules = automations.map((r) => {
        if (r.id === log.ruleId) {
          return {
            ...r,
            runCount: r.runCount + 1,
            lastTriggeredAt: new Date().toISOString(),
          };
        }
        return r;
      });
      this.setAutomations(updatedRules);
    } catch (err) {
      console.error('Failed to log automation execution', err);
    }
  },

  triggerAutomations(triggerType: string, context: Record<string, any> = {}): void {
    const automations = this.getAutomations().filter((a) => a.enabled && a.trigger.type === triggerType);

    for (const auto of automations) {
      // Evaluate condition if present
      if (auto.condition) {
        const actualVal = context[auto.condition.field];
        if (auto.condition.operator === 'equals' && actualVal !== auto.condition.value) continue;
        if (auto.condition.operator === 'gte' && (actualVal === undefined || actualVal < auto.condition.value)) continue;
        if (auto.condition.operator === 'lte' && (actualVal === undefined || actualVal > auto.condition.value)) continue;
      }

      // Execute action
      if (auto.action.type === 'deal_boss_damage') {
        const dmg = typeof auto.action.value === 'number' ? auto.action.value : 100;
        this.damageActiveBoss(dmg, `Automation: "${auto.title}"`, 'automation');
        this.logAutomationExecution({
          ruleId: auto.id,
          ruleTitle: auto.title,
          triggerEvent: `Triggered: ${triggerType}`,
          actionTaken: `Dealt ${dmg} DMG to Boss Raid`,
          status: 'success',
          details: `Autonomous trigger dispatched seamlessly.`,
        });
      } else if (auto.action.type === 'replenish_streak_shield') {
        const streakData = this.getStreakData();
        const updated = {
          ...streakData,
          streakShields: Math.min(streakData.maxShields, streakData.streakShields + (typeof auto.action.value === 'number' ? auto.action.value : 1)),
        };
        this.saveStreakData(updated);
        this.logAutomationExecution({
          ruleId: auto.id,
          ruleTitle: auto.title,
          triggerEvent: `Triggered: ${triggerType}`,
          actionTaken: `Replenished 1 Streak Shield`,
          status: 'success',
          details: `Shield inventory increased.`,
        });
      } else if (auto.action.type === 'award_perk_points') {
        const pts = typeof auto.action.value === 'number' ? auto.action.value : 1;
        this.addPerkPoints(pts);
        this.logAutomationExecution({
          ruleId: auto.id,
          ruleTitle: auto.title,
          triggerEvent: `Triggered: ${triggerType}`,
          actionTaken: `Awarded +${pts} Skill Perk Points`,
          status: 'success',
          details: `Added to perk wallet.`,
        });
      }
    }
  },

  // -------------------------------------------------------------------
  // PHASE 9: GUILD SYNDICATES & COOPERATIVE WORLD RAIDS
  // -------------------------------------------------------------------
  getGuilds(): GuildSyndicate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GUILD_SYNDICATES);
      if (data) return JSON.parse(data);
      return INITIAL_GUILDS;
    } catch {
      return INITIAL_GUILDS;
    }
  },

  setGuilds(guilds: GuildSyndicate[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GUILD_SYNDICATES, JSON.stringify(guilds));
    } catch (err) {
      console.error('Failed to save guilds', err);
    }
  },

  getUserGuild(): GuildSyndicate | undefined {
    const guilds = this.getGuilds();
    return guilds.find((g) => g.isUserMember) || guilds[0];
  },

  joinGuild(guildId: string): GuildSyndicate | null {
    const guilds = this.getGuilds();
    let joined: GuildSyndicate | null = null;
    const updated = guilds.map((g) => {
      if (g.id === guildId) {
        joined = { ...g, isUserMember: true };
        return joined;
      }
      return { ...g, isUserMember: false };
    });
    this.setGuilds(updated);
    return joined;
  },

  contributeWorldRaidDamage(amount: number): { guild: GuildSyndicate | null; newWorldHp: number } {
    const guilds = this.getGuilds();
    const userGuild = guilds.find((g) => g.isUserMember) || guilds[0];
    if (!userGuild) return { guild: null, newWorldHp: 0 };

    const raid = userGuild.activeWorldRaid;
    const newHp = Math.max(0, raid.currentHp - amount);
    const newTotal = raid.communityDamageTotal + amount;

    const updatedRaid: GuildWorldRaid = {
      ...raid,
      currentHp: newHp,
      communityDamageTotal: newTotal,
    };

    const updatedGuild: GuildSyndicate = {
      ...userGuild,
      activeWorldRaid: updatedRaid,
      weeklyGuildXp: userGuild.weeklyGuildXp + amount,
    };

    const updatedGuilds = guilds.map((g) => (g.id === userGuild.id ? updatedGuild : g));
    this.setGuilds(updatedGuilds);

    return {
      guild: updatedGuild,
      newWorldHp: newHp,
    };
  },

  getSyndicateLeaderboard(): SyndicateLeaderboardEntry[] {
    return INITIAL_SYNDICATE_LEADERBOARD;
  },

  // -------------------------------------------------------------------
  // PHASE 9: BIOMETRIC READINESS & INTEGRATIONS
  // -------------------------------------------------------------------
  getBiometrics(): BiometricReadinessMetric {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_DATA);
      if (data) return JSON.parse(data);
      return INITIAL_BIOMETRICS;
    } catch {
      return INITIAL_BIOMETRICS;
    }
  },

  saveBiometrics(data: BiometricReadinessMetric): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BIOMETRIC_DATA, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save biometrics', err);
    }
  },

  simulateBiometricSync(): BiometricReadinessMetric {
    const current = this.getBiometrics();
    // Simulate minor live variations
    const sleep = Math.floor(Math.random() * 15) + 82; // 82 - 97
    const hrv = Math.floor(Math.random() * 20) + 60; // 60 - 80
    const recovery = Math.floor(Math.random() * 12) + 86; // 86 - 98

    const updated: BiometricReadinessMetric = {
      ...current,
      sleepScore: sleep,
      hrvMilliseconds: hrv,
      recoveryIndex: recovery,
      cognitiveReadinessTier: sleep >= 85 ? 'Prime Peak' : 'Optimal Focus',
      focusXpMultiplier: sleep >= 85 ? 1.5 : 1.25,
      bossCritMultiplier: sleep >= 85 ? 2.0 : 1.5,
      lastSyncedAt: new Date().toISOString(),
    };

    this.saveBiometrics(updated);
    return updated;
  },

  getIntegrations(): WebhookIntegrationConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEBHOOK_INTEGRATIONS);
      if (data) return JSON.parse(data);
      return INITIAL_INTEGRATIONS;
    } catch {
      return INITIAL_INTEGRATIONS;
    }
  },

  saveIntegrations(integrations: WebhookIntegrationConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WEBHOOK_INTEGRATIONS, JSON.stringify(integrations));
    } catch (err) {
      console.error('Failed to save integrations', err);
    }
  },

  updateIntegration(id: string, updates: Partial<WebhookIntegrationConfig>): WebhookIntegrationConfig | null {
    const list = this.getIntegrations();
    let updatedItem: WebhookIntegrationConfig | null = null;
    const updated = list.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });
    this.saveIntegrations(updated);
    return updatedItem;
  },

  // -------------------------------------------------------------
  // PHASE 10: SOVEREIGN SWARM, SIMULATION, EPOCH MILESTONES & VAULT
  // -------------------------------------------------------------

  getSwarmAgents(): SwarmAgent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SWARM_AGENTS);
      if (data) return JSON.parse(data);
      return INITIAL_SWARM_AGENTS;
    } catch {
      return INITIAL_SWARM_AGENTS;
    }
  },

  saveSwarmAgents(agents: SwarmAgent[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SWARM_AGENTS, JSON.stringify(agents));
    } catch (err) {
      console.error('Failed to save swarm agents', err);
    }
  },

  toggleAgentAutonomy(agentId: string): SwarmAgent | null {
    const agents = this.getSwarmAgents();
    let updatedAgent: SwarmAgent | null = null;
    const updated = agents.map((agent) => {
      if (agent.id === agentId) {
        const nextLevel: SwarmAgent['autonomyLevel'] =
          agent.autonomyLevel === 'autonomous'
            ? 'semi-autonomous'
            : agent.autonomyLevel === 'semi-autonomous'
            ? 'advisory'
            : 'autonomous';
        updatedAgent = {
          ...agent,
          autonomyLevel: nextLevel,
          lastPingAt: new Date().toISOString(),
        };
        return updatedAgent;
      }
      return agent;
    });
    this.saveSwarmAgents(updated);
    return updatedAgent;
  },

  applyAgentInsight(insightId: string): SwarmAgentInsight | null {
    const agents = this.getSwarmAgents();
    let appliedInsight: SwarmAgentInsight | null = null;

    const updated = agents.map((agent) => {
      const insightIndex = agent.insights.findIndex((i) => i.id === insightId);
      if (insightIndex >= 0) {
        const target = agent.insights[insightIndex];
        appliedInsight = { ...target, status: 'applied' as const };
        const updatedInsights = [...agent.insights];
        updatedInsights[insightIndex] = appliedInsight;

        // Apply dynamic effect if payload exists
        if (target.actionPayload) {
          if (target.actionPayload.type === 'replenish_shields') {
            const streak = this.getStreakData();
            this.setStreakData({
              ...streak,
              streakShields: Math.min(streak.maxShields, streak.streakShields + (target.actionPayload.value || 1)),
            });
          } else if (target.actionPayload.type === 'boost_xp') {
            this.awardXp(100, `Swarm Optimization: ${target.title}`);
          }
        }

        return {
          ...agent,
          actionsExecuted: agent.actionsExecuted + 1,
          insights: updatedInsights,
          lastPingAt: new Date().toISOString(),
        };
      }
      return agent;
    });

    this.saveSwarmAgents(updated);
    return appliedInsight;
  },

  dismissAgentInsight(insightId: string): SwarmAgentInsight | null {
    const agents = this.getSwarmAgents();
    let dismissed: SwarmAgentInsight | null = null;

    const updated = agents.map((agent) => {
      const insightIndex = agent.insights.findIndex((i) => i.id === insightId);
      if (insightIndex >= 0) {
        dismissed = { ...agent.insights[insightIndex], status: 'dismissed' as const };
        const updatedInsights = [...agent.insights];
        updatedInsights[insightIndex] = dismissed;
        return {
          ...agent,
          insights: updatedInsights,
        };
      }
      return agent;
    });

    this.saveSwarmAgents(updated);
    return dismissed;
  },

  dispatchSwarmPrompt(prompt: string): SwarmAgentInsight[] {
    const agents = this.getSwarmAgents();
    const newInsights: SwarmAgentInsight[] = [
      {
        id: `ins_swarm_${Date.now()}_1`,
        agentId: agents[0]?.id || 'agent_sentinel_01',
        agentName: agents[0]?.name || 'Sentinel-9',
        title: `Swarm Command Dispatched: "${prompt.slice(0, 32)}..."`,
        description: `Autonomous Swarm synthesized cross-domain directive. Calibration score: 98.4% alignment across habits, calendar, and trading risk.`,
        impact: 'high',
        domain: 'discipline',
        suggestedAction: 'Execute tactical alignment and lock focused state block',
        confidenceScore: 98,
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
    ];

    if (agents.length > 0) {
      agents[0].insights.unshift(newInsights[0]);
      agents[0].actionsExecuted += 1;
      this.saveSwarmAgents(agents);
    }

    return newInsights;
  },

  getSimulationModels(): LifeSimulationModel[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SIMULATION_MODELS);
      if (data) return JSON.parse(data);
      return INITIAL_SIMULATION_MODELS;
    } catch {
      return INITIAL_SIMULATION_MODELS;
    }
  },

  getSimulationModel(): LifeSimulationModel {
    const models = this.getSimulationModels();
    return models[0] || INITIAL_SIMULATION_MODELS[0];
  },

  saveSimulationModel(model: LifeSimulationModel): void {
    try {
      const models = this.getSimulationModels();
      const updated = models.map((m) => (m.id === model.id ? model : m));
      if (!updated.some((m) => m.id === model.id)) {
        updated.push(model);
      }
      localStorage.setItem(STORAGE_KEYS.SIMULATION_MODELS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save simulation model', err);
    }
  },

  recalculateSimulation(
    params: Partial<LifeSimulationModel['baseParameters']>,
    horizonYears: number = 5
  ): LifeSimulationModel {
    const current = this.getSimulationModel();
    const updatedParams = { ...current.baseParameters, ...params };

    const startYear = 2026;
    const baseWealth = 120000;
    const baseMastery = 2400;

    const habitFactor = updatedParams.habitConsistencyRate / 100;
    const deepWorkFactor = updatedParams.dailyDeepWorkHours / 4.0;
    const learningFactor = updatedParams.dailyLearningHours / 1.5;
    const savingsAnnual = updatedParams.monthlySavingsRate * 12;
    const returnRate = updatedParams.investmentAnnualReturn / 100;

    const p10: SimulationPoint[] = [];
    const p50: SimulationPoint[] = [];
    const p90: SimulationPoint[] = [];

    let p10Wealth = baseWealth;
    let p50Wealth = baseWealth;
    let p90Wealth = baseWealth;

    let p10Mastery = baseMastery;
    let p50Mastery = baseMastery;
    let p90Mastery = baseMastery;

    for (let yr = 0; yr <= horizonYears; yr++) {
      const yearNum = startYear + yr;
      if (yr > 0) {
        // Compound calculations
        p50Wealth = Math.round((p50Wealth + savingsAnnual) * (1 + returnRate));
        p10Wealth = Math.round((p10Wealth + savingsAnnual * 0.7) * (1 + returnRate * 0.5));
        p90Wealth = Math.round((p90Wealth + savingsAnnual * 1.35) * (1 + returnRate * 1.4));

        p50Mastery = Math.round(p50Mastery + 1200 * deepWorkFactor * habitFactor * learningFactor);
        p10Mastery = Math.round(p10Mastery + 700 * deepWorkFactor * 0.8 * learningFactor);
        p90Mastery = Math.round(p90Mastery + 2200 * deepWorkFactor * 1.2 * learningFactor);
      }

      p10.push({
        year: yearNum,
        month: 1,
        wealthScore: p10Wealth,
        masteryScore: p10Mastery,
        vitalityScore: Math.max(65, Math.round(82 - yr * 2 + updatedParams.exerciseDaysPerWeek * 1.5)),
        compositeLifeScore: Math.min(100, Math.round(75 + yr * 2)),
      });

      p50.push({
        year: yearNum,
        month: 1,
        wealthScore: p50Wealth,
        masteryScore: p50Mastery,
        vitalityScore: Math.min(100, Math.round(85 + updatedParams.exerciseDaysPerWeek * 2)),
        compositeLifeScore: Math.min(100, Math.round(85 + yr * 2.4)),
      });

      p90.push({
        year: yearNum,
        month: 1,
        wealthScore: p90Wealth,
        masteryScore: p90Mastery,
        vitalityScore: Math.min(100, Math.round(90 + updatedParams.exerciseDaysPerWeek * 2)),
        compositeLifeScore: Math.min(100, Math.round(89 + yr * 2.2)),
      });
    }

    const bioAgeOffset = Number((-1.2 - updatedParams.exerciseDaysPerWeek * 0.6).toFixed(1));
    const synergyIndex = Math.min(99, Math.round(habitFactor * 40 + deepWorkFactor * 30 + (updatedParams.exerciseDaysPerWeek / 7) * 29));

    const updatedModel: LifeSimulationModel = {
      ...current,
      timeHorizonYears: horizonYears,
      baseParameters: updatedParams,
      trajectories: { p10, p50, p90 },
      projectedOutcomes: {
        netWorth: p50Wealth,
        skillMasteryPoints: p50Mastery,
        vitalityBiologicalAgeOffset: bioAgeOffset,
        lifeSynergyIndex: synergyIndex,
      },
    };

    this.saveSimulationModel(updatedModel);
    return updatedModel;
  },

  getEpochMilestones(): EpochMilestone[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EPOCH_MILESTONES);
      if (data) return JSON.parse(data);
      return INITIAL_EPOCH_MILESTONES;
    } catch {
      return INITIAL_EPOCH_MILESTONES;
    }
  },

  saveEpochMilestones(milestones: EpochMilestone[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EPOCH_MILESTONES, JSON.stringify(milestones));
    } catch (err) {
      console.error('Failed to save epoch milestones', err);
    }
  },

  createEpochMilestone(milestone: Omit<EpochMilestone, 'id'>): EpochMilestone {
    const list = this.getEpochMilestones();
    const created: EpochMilestone = {
      ...milestone,
      id: `epoch_ms_${Date.now()}`,
    };
    const updated = [created, ...list];
    this.saveEpochMilestones(updated);
    return created;
  },

  toggleMilestoneStatus(id: string): EpochMilestone | null {
    const list = this.getEpochMilestones();
    let updatedItem: EpochMilestone | null = null;
    const updated = list.map((m) => {
      if (m.id === id) {
        const nextStatus: EpochMilestone['status'] =
          m.status === 'completed'
            ? 'in_progress'
            : m.status === 'in_progress'
            ? 'target'
            : 'completed';
        updatedItem = { ...m, status: nextStatus };
        return updatedItem;
      }
      return m;
    });
    this.saveEpochMilestones(updated);
    return updatedItem;
  },

  deleteEpochMilestone(id: string): void {
    const list = this.getEpochMilestones();
    const updated = list.filter((m) => m.id !== id);
    this.saveEpochMilestones(updated);
  },

  getVaultArchives(): SovereignVaultArchive[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VAULT_ARCHIVES);
      if (data) return JSON.parse(data);
      return INITIAL_VAULT_ARCHIVES;
    } catch {
      return INITIAL_VAULT_ARCHIVES;
    }
  },

  saveVaultArchives(archives: SovereignVaultArchive[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT_ARCHIVES, JSON.stringify(archives));
    } catch (err) {
      console.error('Failed to save vault archives', err);
    }
  },

  createVaultBackup(format: 'json' | 'sqlite' | 'standalone_html'): SovereignVaultArchive {
    const list = this.getVaultArchives();
    const newArchive: SovereignVaultArchive = {
      id: `vault_arch_${Date.now()}`,
      backupVersion: `v10.0-SOVEREIGN-AUTO-${new Date().toISOString().split('T')[0]}`,
      createdAt: new Date().toISOString(),
      totalRecords: 1560 + Math.floor(Math.random() * 40),
      dataSizeKb: 380 + Math.floor(Math.random() * 30),
      encryptionAlgorithm: 'AES-256-GCM Zero-Knowledge Client Cipher',
      checksum: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      offlineReady: true,
      exportFormat: format,
    };
    const updated = [newArchive, ...list];
    this.saveVaultArchives(updated);
    return newArchive;
  },

  exportSovereignJSON(): string {
    const fullBackup = {
      version: '10.0.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      tasks: this.getDetailedTasks(),
      habits: this.getDetailedHabits(),
      goals: this.getDetailedGoals(),
      quests: this.getQuests(),
      streak: this.getStreakData(),
      xpTransactions: this.getXpTransactions(),
      courses: this.getDetailedCourses(),
      languages: this.getLanguageProfile(),
      tradingAccount: this.getTradingAccount(),
      tradingJournal: this.getTradingJournal(),
      bosses: this.getBossBattles(),
      perks: this.getSkillPerks(),
      automations: this.getAutomations(),
      guilds: this.getGuilds(),
      biometrics: this.getBiometrics(),
      swarmAgents: this.getSwarmAgents(),
      simulations: this.getSimulationModels(),
      epochMilestones: this.getEpochMilestones(),
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importSovereignJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.tasks) this.saveDetailedTasks(data.tasks);
      if (data.habits) this.saveDetailedHabits(data.habits);
      if (data.goals) this.saveDetailedGoals(data.goals);
      if (data.user) this.setUser(data.user);
      return true;
    } catch {
      return false;
    }
  },

  clearAllUserData(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem('lifeos_auth_token');
      localStorage.removeItem('lifeos_demo_mode');
      localStorage.removeItem('lifeos_offline_queue');
      localStorage.removeItem('lifeos_sync_version');
    } catch (err) {
      console.error('Error clearing local user data', err);
    }
  },
};

export const storage = Storage;

