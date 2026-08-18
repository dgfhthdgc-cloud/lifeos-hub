export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  createdAt: string;
  settings: {
    theme: ThemeMode;
    notificationsEnabled: boolean;
    aiInsightsEnabled: boolean;
    compactView: boolean;
  };
}

export type RoutePath =
  | '/'
  | '/dashboard'
  | '/planner'
  | '/goals'
  | '/habits'
  | '/learn'
  | '/languages'
  | '/trading'
  | '/trading/replay'
  | '/trading/journal'
  | '/ai'
  | '/progress'
  | '/analytics'
  | '/bosses'
  | '/perks'
  | '/automations'
  | '/syndicate'
  | '/integrations'
  | '/swarm'
  | '/simulator'
  | '/vault'
  | '/settings'
  | '/login'
  | '/signup'
  | '/forgot-password';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'quest' | 'streak' | 'lesson' | 'system' | 'trading';
  link?: RoutePath;
}

// -------------------------------------------------------------
// PHASE 2 DOMAIN MODELS: TASKS, PLANNER, GOALS, HABITS
// -------------------------------------------------------------

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory =
  | 'Engineering'
  | 'Learning'
  | 'Trading'
  | 'Language'
  | 'Health'
  | 'Productivity'
  | 'Personal'
  | 'Business';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  time?: string; // e.g. "09:00 AM"
  endTime?: string; // e.g. "10:30 AM"
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory | string;
  tags: string[];
  recurrence?: 'none' | 'daily' | 'weekdays' | 'weekly';
  goalId?: string;
  habitId?: string;
  xp: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  time?: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category: string;
  xp: number;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetDate?: string;
  completed: boolean;
  order: number;
  xpReward: number;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  category: 'Career & Skills' | 'Financial Mastery' | 'Language & Culture' | 'Health & Vitality' | 'Personal' | string;
  deadline?: string; // e.g. "Dec 2026"
  quarter?: string; // e.g. "Q3 2026"
  targetMetric?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'in_progress' | 'achieved' | 'on_hold';
  completed?: boolean;
  progress: number; // 0 to 100
  milestones: GoalMilestone[];
  relatedHabitIds?: string[];
  relatedCourseIds?: string[];
  xpReward: number;
  createdAt: string;
}

export interface GoalSummary {
  id: string;
  title: string;
  category: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  targetDate: string;
}

export interface HabitItem {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekdays' | '3x_week' | 'weekly';
  target: string; // e.g. "45 mins / day"
  category: 'Skill' | 'Productivity' | 'Language' | 'Trading' | 'Health' | 'Mindfulness';
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  currentStreak: number;
  bestStreak: number;
  history: string[]; // array of ISO dates (YYYY-MM-DD) when completed
  reminderTime?: string;
  completedToday: boolean;
  createdAt: string;
}

export interface HabitSummary {
  id: string;
  name: string;
  category: string;
  streak: number;
  completedToday: boolean;
  target: string;
  xp: number;
}

// -------------------------------------------------------------
// PLANNER HORIZONS & ROADMAPS
// -------------------------------------------------------------

export type PlannerViewMode = 'day' | 'week' | 'month' | 'year' | '5year';

export interface PlannerTimeBlock {
  hour: number; // 8 to 22
  displayTime: string;
  tasks: TaskItem[];
}

export interface QuarterPlan {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  focusTheme: string;
  objectives: string[];
  status: 'completed' | 'active' | 'upcoming';
}

export interface YearPlan {
  year: number;
  theme: string;
  highLevelVision: string;
  quarters: QuarterPlan[];
}

export interface FiveYearPillar {
  id: string;
  pillar: 'Career & Wealth' | 'Skills & Mastery' | 'Health & Performance' | 'Language & Exploration';
  icon: string;
  currentStatus: string;
  fiveYearNorthStar: string;
  milestones: { year: number; title: string; completed: boolean }[];
}

// -------------------------------------------------------------
// PHASE 3: GAMIFICATION, LEVELS, QUESTS, BADGES, AND XP LEDGER
// -------------------------------------------------------------

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'mythic';
export type BadgeCategory = 'mastery' | 'discipline' | 'consistency' | 'knowledge' | 'wealth' | 'focus' | 'special';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  secret?: boolean;
}

export type QuestCategory = 'daily' | 'weekly' | 'epic' | 'special';
export type QuestTargetType =
  | 'tasks_completed'
  | 'habits_checked'
  | 'learning_lessons'
  | 'trading_trades'
  | 'xp_earned'
  | 'streak_maintained'
  | 'goals_milestone';

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  targetType: QuestTargetType;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  claimed: boolean;
  expiresAt: string;
  iconName: string;
  badgeRewardId?: string;
}

export interface StreakMilestone {
  days: number;
  title: string;
  reached: boolean;
  xpReward: number;
  perkDescription: string;
}

export interface StreakSystemData {
  currentStreak: number;
  bestStreak: number;
  streakShields: number; // shields protecting missed days
  maxShields: number;
  multiplier: number; // e.g. 1.25x
  freezeActive: boolean;
  lastActiveDate: string;
  milestones: StreakMilestone[];
}

export type XpCategory =
  | 'general'
  | 'task'
  | 'habit'
  | 'quest'
  | 'milestone'
  | 'course'
  | 'language'
  | 'trading'
  | 'streak_bonus'
  | 'level_up'
  | 'badge';

export interface XpTransaction {
  id: string;
  amount: number;
  reason: string;
  category: XpCategory;
  timestamp: string;
  streakMultiplier?: number;
}

export interface LevelRankInfo {
  level: number;
  title: string;
  tierName: string;
  tierColor: string;
  minXp: number;
  maxXp: number;
  perks: string[];
}

// -------------------------------------------------------------
// PHASE 4: LEARNING PLATFORM, COURSES, CODE LABS & QUIZZES
// -------------------------------------------------------------

export type CourseDomain =
  | 'AI & Machine Learning'
  | 'Programming & CS'
  | 'Trading Education'
  | 'Mathematics & Systems';

export type LessonType = 'theory' | 'code_lab' | 'quiz' | 'project';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
  codeSnippet?: string;
}

export interface CodeTestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput?: string;
  testExpression: string; // evaluated in sandbox
}

export interface CodeLabChallenge {
  id: string;
  language: 'javascript' | 'typescript' | 'python';
  instructions: string;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  testCases: CodeTestCase[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  codeExample?: string;
  category?: string;
}

export interface LessonResource {
  title: string;
  url?: string;
  type: 'paper' | 'repo' | 'docs' | 'cheatsheet';
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  difficulty: CourseDifficulty;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  summary: string;
  contentMarkdown: string;
  keyConcepts: string[];
  codeLab?: CodeLabChallenge;
  quiz?: QuizQuestion[];
  flashcards?: FlashcardItem[];
  resources?: LessonResource[];
  quizBestScore?: number; // percentage (0 - 100)
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseCertificate {
  id: string;
  credentialId: string;
  courseId: string;
  courseTitle: string;
  recipientName: string;
  issueDate: string;
  verified: boolean;
  scorePercentage: number;
  skillsAcquired: string[];
}

export interface DetailedCourse {
  id: string;
  title: string;
  tagline: string;
  description: string;
  domain: CourseDomain;
  difficulty: CourseDifficulty;
  totalDurationHours: number;
  thumbnailIcon: string;
  color: string;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  modules: CourseModule[];
  enrolled: boolean;
  enrolledAt?: string;
  completedAt?: string;
  certificate?: CourseCertificate;
  userNotes?: Record<string, string>; // lessonId -> markdown
  bookmarkedLessons?: string[]; // lessonIds
}

// -------------------------------------------------------------
// PHASE 5: LANGUAGE LEARNING SYSTEM (SRS, DRILLS, CONVERSATIONS)
// -------------------------------------------------------------

export type TargetLanguage = 'spanish' | 'japanese' | 'german' | 'french' | 'mandarin' | 'italian';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface LanguageInfo {
  id: TargetLanguage;
  name: string;
  nativeName: string;
  flag: string;
  level: string;
  totalUnits: number;
}

export interface VocabItem {
  id: string;
  term: string;
  translation: string;
  phoneticIPA?: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';
  gender?: 'masculine' | 'feminine';
  exampleSource: string;
  exampleTarget: string;
  masteryLevel: number; // 1 to 5 (SRS stage)
  nextReviewDate?: string;
  language: TargetLanguage;
}

export type DrillType =
  | 'word_order'
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'listening'
  | 'conjugation';

export interface LanguageDrill {
  id: string;
  type: DrillType;
  prompt: string;
  sourcePhrase: string;
  targetPhrase: string;
  scrambledWords?: string[];
  options?: string[];
  correctOptionIndex?: number;
  blankText?: string;
  acceptedAnswers?: string[];
  audioText?: string;
  hint?: string;
  grammarExplanation?: string;
}

export interface DialogueTurn {
  id: string;
  speaker: 'partner' | 'user';
  text: string;
  translation: string;
  suggestedUserResponses?: { text: string; translation: string; hint?: string }[];
  feedbackNote?: string;
}

export interface DialogueScenario {
  id: string;
  title: string;
  setting: string;
  roleUser: string;
  rolePartner: string;
  initialMessage: string;
  turns: DialogueTurn[];
}

export interface LanguageLesson {
  id: string;
  unitId: string;
  lessonNumber: number;
  title: string;
  type: 'vocabulary' | 'sentence_builder' | 'grammar_drill' | 'listening' | 'dialogue';
  xpReward: number;
  completed: boolean;
  scorePercentage?: number;
  drills: LanguageDrill[];
  vocabItems: VocabItem[];
  grammarNotes?: string;
  dialogueScenario?: DialogueScenario;
}

export interface LanguageUnit {
  id: string;
  language: TargetLanguage;
  unitNumber: number;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  icon: string;
  color: string;
  lessons: LanguageLesson[];
}

export interface LanguageProfile {
  targetLanguage: TargetLanguage;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  lastActiveDate: string;
  dailyGoalLessons: number;
  dailyLessonsCompletedToday: number;
  customVocab: VocabItem[];
}

// -------------------------------------------------------------
// OTHER SUMMARY TYPES
// -------------------------------------------------------------

export interface CourseSummary {
  id: string;
  title: string;
  category: string;
  progress: number;
  currentModule: string;
  totalLessons: number;
  completedLessons: number;
}

export interface WatchlistSummaryItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  category: 'Crypto' | 'Indices' | 'Commodities' | 'Forex';
  isPositive: boolean;
}

export interface AIInsightSummary {
  id: string;
  title: string;
  message: string;
  type: 'opportunity' | 'warning' | 'celebration';
  actionLabel?: string;
  actionRoute?: RoutePath;
  generatedAt: string;
  isAiEnabled: boolean;
}

// -------------------------------------------------------------
// PHASE 6: TRADING TERMINAL & JOURNAL TYPES
// -------------------------------------------------------------

export type AssetCategory = 'Crypto' | 'Indices' | 'Commodities' | 'Forex';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W' | '1h' | '4h';

export type ChartType = 'candlestick' | 'heikin_ashi' | 'line';

export type DrawingToolType =
  | 'cursor'
  | 'trendline'
  | 'horizontal_line'
  | 'fibonacci'
  | 'rectangle'
  | 'long_position'
  | 'short_position';

export interface MarketSymbol {
  symbol: string;
  name: string;
  category: AssetCategory;
  currentPrice: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  decimals: number;
  pipSize: number;
  description: string;
}

export interface CandleStick {
  time: number; // timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDrawingPoint {
  time: number;
  price: number;
}

export interface ChartDrawing {
  id: string;
  type: DrawingToolType;
  points: ChartDrawingPoint[];
  color: string;
  label?: string;
  stopLoss?: number;
  takeProfit?: number;
  entry?: number;
  riskRewardRatio?: number;
}

export interface IndicatorConfig {
  ema9: boolean;
  ema21: boolean;
  ema50: boolean;
  ema200: boolean;
  bollingerBands: boolean;
  vwap: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
}

export interface ActiveOrder {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  size: number; // contracts or lots
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  status?: 'open' | 'closed' | 'pending';
  pnl: number;
  pnlPercent?: number;
  openedAt?: number;
  timestamp?: string;
  closedAt?: number;
  closePrice?: number;
  rMultiple?: number;
  notes?: string;
  strategy?: string;
}

export type TradingSession = 'Asia' | 'London' | 'New York AM' | 'New York PM';

export type TradingEmotion =
  | 'Disciplined'
  | 'Confident'
  | 'FOMO'
  | 'Revenge'
  | 'Hesitant'
  | 'Anxious';

export interface TradeJournalEntry {
  id: string;
  symbol: string;
  category: AssetCategory;
  direction: 'long' | 'short';
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit?: number;
  positionSize: number;
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  riskAmount: number;
  status: 'win' | 'loss' | 'breakeven';
  setupStrategy: string;
  session: TradingSession;
  emotion: TradingEmotion;
  mistakes?: string[];
  notes: string;
  rating: number; // 1-5 scale
}

export interface TradingAccount {
  balance: number;
  initialBalance: number;
  currency: string;
  riskPerTradePercent: number;
  openOrders: ActiveOrder[];
  closedOrders: ActiveOrder[];
  journal: TradeJournalEntry[];
}

// -------------------------------------------------------------
// AI COACH & OPERATING PARTNER (PHASE 7)
// -------------------------------------------------------------

export type AICoachPersona = 'mentor' | 'architect' | 'counselor' | 'socratic';

export interface AISuggestedAction {
  id: string;
  label: string;
  description?: string;
  actionType: 'create_task' | 'create_goal' | 'create_course' | 'adjust_schedule' | 'add_trade_rule' | 'navigate';
  payload: Record<string, any>;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  persona?: AICoachPersona;
  contextIncluded?: {
    tasks?: boolean;
    habits?: boolean;
    goals?: boolean;
    trading?: boolean;
    learning?: boolean;
  };
  suggestedActions?: AISuggestedAction[];
  modelUsed?: string;
}

export interface AIScheduleIssue {
  id: string;
  severity: 'low' | 'medium' | 'high';
  category: 'conflict' | 'overload' | 'energy_mismatch' | 'recovery' | 'fragmentation';
  title: string;
  description: string;
  recommendation: string;
  autoFixable?: boolean;
  targetTaskId?: string;
  suggestedSlot?: {
    dayOffset: number; // 0 for today, 1 for tomorrow
    startTime: string; // HH:mm
    endTime: string;
  };
}

export interface AIScheduleAuditResult {
  id: string;
  timestamp: string;
  overallScore: number; // 0-100
  cognitiveLoadScore: number; // 0-100
  energyAlignmentScore: number; // 0-100
  recoveryBufferScore: number; // 0-100
  priorityFocusScore: number; // 0-100
  summary: string;
  deepWorkHoursTotal: number;
  contextSwitchCount: number;
  detectedIssues: AIScheduleIssue[];
  optimizedSuggestions: Array<{
    title: string;
    originalTime?: string;
    suggestedTime: string;
    reason: string;
  }>;
}

export interface AIStudyPlanModule {
  day: number;
  title: string;
  estimatedMinutes: number;
  keyConcepts: string[];
  practicalExercise: string;
}

export interface AIStudyPlanWeek {
  weekNumber: number;
  theme: string;
  goals: string[];
  dailyModules: AIStudyPlanModule[];
}

export interface AIFlashcard {
  front: string;
  back: string;
  category: string;
}

export interface AIStudyPlanResult {
  id: string;
  createdAt: string;
  topic: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';
  targetDurationWeeks: number;
  dailyCommitmentMinutes: number;
  overview: string;
  learningOutcomes: string[];
  syllabus: AIStudyPlanWeek[];
  flashcards: AIFlashcard[];
  practicalProject: {
    title: string;
    description: string;
    deliverables: string[];
  };
}

export interface AITradingAnalysisResult {
  id: string;
  timestamp: string;
  totalTradesAnalyzed: number;
  disciplineScore: number; // 0-100
  winRate: number; // 0-100
  profitFactor: number;
  averageR: number;
  keyFindings: string[];
  psychologyAudit: {
    emotionBreakdown: Record<string, { count: number; winRate: number; avgR: number }>;
    topEmotionalLeak: string;
    leakDescription: string;
    recommendedCountermeasure: string;
  };
  sessionEdge: Array<{
    session: TradingSession;
    tradesCount: number;
    winRate: number;
    avgR: number;
    edgeRating: 'Strong Edge' | 'Neutral' | 'Negative Edge';
    recommendation: string;
  }>;
  actionableRules: Array<{
    id: string;
    rule: string;
    rationale: string;
    priority: 'Essential' | 'Recommended';
  }>;
}

export interface AIDailyBriefingResult {
  id: string;
  date: string;
  generatedAt: string;
  greeting: string;
  motivationalTheme: string;
  quote: {
    text: string;
    author: string;
  };
  topPriorities: Array<{
    id: string;
    title: string;
    category: string;
    timeSlot?: string;
    whyCrucial: string;
  }>;
  focusBlocksPlan: Array<{
    time: string;
    focus: string;
    state: 'Deep Work' | 'Light Work' | 'Recovery' | 'Learning' | 'Trading Review';
  }>;
  habitsToGuard: Array<{
    name: string;
    streak: number;
    targetTime: string;
    tip: string;
  }>;
  potentialPitfalls: string[];
  eveningReflectionPrompt: string;
}

export interface AICoachSettings {
  defaultPersona: AICoachPersona;
  autoContextInjection: boolean;
  voiceReadoutEnabled: boolean;
  proactiveMorningBriefing: boolean;
  tradingSafeguardConfirmed: boolean;
}

// -------------------------------------------------------------
// PHASE 8: ADVANCED LIFE ANALYTICS, BOSS RAIDS & SKILL PERK TREE
// -------------------------------------------------------------

export interface BossBattle {
  id: string;
  name: string;
  subtitle: string;
  lore: string;
  avatarIcon: string;
  themeColor: string;
  currentHp: number;
  maxHp: number;
  difficulty: 'Standard' | 'Heroic' | 'Mythic' | 'Ascendant';
  deadlineDays: number;
  startDate: string;
  endDate: string;
  defeated: boolean;
  defeatedAt?: string;
  rewards: {
    xp: number;
    badgeTitle: string;
    perkPoints: number;
    lootDescription: string;
  };
  activeModifiers: Array<{
    title: string;
    effect: string;
    damageMultiplier: number;
    category: 'task' | 'habit' | 'course' | 'language' | 'trading' | 'all';
  }>;
  damageLog: Array<{
    id: string;
    timestamp: string;
    damage: number;
    reason: string;
    category: string;
  }>;
}

export type SkillDomain = 'execution' | 'consistency' | 'knowledge' | 'strategy';

export interface SkillPerkNode {
  id: string;
  title: string;
  description: string;
  domain: SkillDomain;
  tier: 1 | 2 | 3 | 4;
  costPoints: number;
  unlocked: boolean;
  unlockedAt?: string;
  iconName: string;
  passiveEffect: string;
  bonusMultiplier?: number;
  dependencies: string[];
}

export interface DomainRadarMetric {
  pillar: string;
  domainKey: 'execution' | 'consistency' | 'strategy' | 'intellect' | 'linguistics' | 'trading';
  score: number; // 0 - 100
  benchmark: number; // 0 - 100 benchmark
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  submetrics: Array<{
    label: string;
    value: string;
    status: 'optimal' | 'good' | 'warning';
  }>;
}

export interface CrossDomainLifeRadarData {
  overallSynergyScore: number; // 0-100
  synergyTier: 'Transcendent' | 'Optimal' | 'Balanced' | 'Fragmented';
  metrics: DomainRadarMetric[];
  insights: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'positive' | 'warning' | 'neutral';
    actionableStep: string;
  }>;
}

export interface HistoricalXpTrendPoint {
  date: string;
  displayDate: string;
  xp: number;
  tasksCompleted: number;
  habitsChecked: number;
  studyMinutes: number;
  tradingTrades: number;
}

export interface DomainDistributionPoint {
  name: string;
  xp: number;
  percentage: number;
  color: string;
}

export interface FlowHourHeatmapPoint {
  hour: number;
  label: string;
  focusUnits: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'peak';
}

export interface SystemSnapshotMetadata {
  exportedAt: string;
  version: string;
  totalXp: number;
  level: number;
  tasksCount: number;
  habitsCount: number;
  goalsCount: number;
  coursesCount: number;
  tradesCount: number;
}

// -------------------------------------------------------------
// PHASE 9: AUTONOMOUS AUTOMATIONS, SYNDICATES & BIOMETRICS
// -------------------------------------------------------------

export type AutomationTriggerType =
  | 'task_completed'
  | 'habit_streak_reached'
  | 'boss_damaged'
  | 'trade_logged'
  | 'lesson_passed'
  | 'biometric_threshold'
  | 'scheduled_time';

export type AutomationActionType =
  | 'grant_xp'
  | 'deal_boss_damage'
  | 'replenish_streak_shield'
  | 'send_push_notification'
  | 'trigger_ai_safeguard'
  | 'create_calendar_event'
  | 'award_perk_points';

export interface LifeAutomationRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'execution' | 'discipline' | 'trading' | 'learning' | 'health';
  trigger: {
    type: AutomationTriggerType;
    label: string;
    params?: Record<string, any>;
  };
  condition?: {
    field: string;
    operator: 'equals' | 'gte' | 'lte' | 'contains';
    value: string | number;
    label: string;
  };
  action: {
    type: AutomationActionType;
    label: string;
    value: number | string;
    params?: Record<string, any>;
  };
  runCount: number;
  lastTriggeredAt?: string;
  iconName: string;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleTitle: string;
  timestamp: string;
  triggerEvent: string;
  actionTaken: string;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}

// Syndicate & Guilds
export interface GuildMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'Leader' | 'Officer' | 'Member';
  weeklyXp: number;
  bossDamageContribution: number;
  joinedAt: string;
  status: 'online' | 'focused' | 'idle';
}

export interface GuildWorldRaid {
  id: string;
  name: string;
  title: string;
  avatarIcon: string;
  maxHp: number;
  currentHp: number;
  communityDamageTotal: number;
  expiresInDays: number;
  rewards: {
    collectiveXpBonus: number;
    guildPerk: string;
    exclusiveBadge: string;
  };
}

export interface GuildSyndicate {
  id: string;
  name: string;
  tag: string;
  motto: string;
  iconName: string;
  themeColor: string;
  level: number;
  totalMembers: number;
  maxMembers: number;
  weeklyGuildXp: number;
  rank: number;
  activePerks: string[];
  activeWorldRaid: GuildWorldRaid;
  members: GuildMember[];
  isUserMember: boolean;
}

export interface SyndicateLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  guildTag?: string;
  level: number;
  weeklyXp: number;
  bossDamage: number;
  habitConsistencyRate: number;
  tradingSharpe?: number;
  trend: 'up' | 'down' | 'same';
}

// Biometric & Integrations
export interface BiometricReadinessMetric {
  sleepScore: number; // 0-100
  sleepDurationHours: number;
  hrvMilliseconds: number;
  restingHeartRateBpm: number;
  recoveryIndex: number; // 0-100
  cognitiveReadinessTier: 'Prime Peak' | 'Optimal Focus' | 'Moderate' | 'Depleted';
  focusXpMultiplier: number; // 1.0 - 2.0x
  bossCritMultiplier: number; // 1.0 - 3.0x
  lastSyncedAt: string;
  sourceDevice: string;
}

export interface WebhookIntegrationConfig {
  id: string;
  name: string;
  provider: 'apple_health' | 'oura' | 'whoop' | 'google_calendar' | 'custom_webhook';
  status: 'connected' | 'disconnected' | 'syncing';
  apiKeyOrToken?: string;
  webhookUrl?: string;
  lastEventReceivedAt?: string;
  eventsCount: number;
}

// -------------------------------------------------------------
// PHASE 10 DOMAIN MODELS: SOVEREIGN COMMAND, SWARM, SIMULATOR, VAULT
// -------------------------------------------------------------

export interface SwarmAgentInsight {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  domain: 'discipline' | 'trading' | 'learning' | 'health' | 'time';
  suggestedAction: string;
  actionPayload?: {
    type: 'reschedule_calendar' | 'lock_risk' | 'create_srs_deck' | 'replenish_shields' | 'boost_xp';
    value?: any;
  };
  status: 'pending' | 'applied' | 'dismissed';
  confidenceScore: number; // 0 - 100
  timestamp: string;
}

export interface SwarmAgent {
  id: string;
  name: string;
  role: 'Sentinel' | 'Oracle' | 'Archivist' | 'Tactician' | 'Strategist';
  specialization: string;
  status: 'active' | 'analyzing' | 'idle' | 'standby';
  autonomyLevel: 'advisory' | 'semi-autonomous' | 'autonomous';
  accuracyRate: number; // e.g. 98.4%
  actionsExecuted: number;
  currentObjective: string;
  avatarIcon: string;
  insights: SwarmAgentInsight[];
  lastPingAt: string;
}

export interface SimulationPoint {
  year: number;
  month: number;
  wealthScore: number;
  masteryScore: number;
  vitalityScore: number;
  compositeLifeScore: number;
}

export interface LifeSimulationModel {
  id: string;
  name: string;
  description: string;
  timeHorizonYears: number; // 1, 5, 10
  baseParameters: {
    habitConsistencyRate: number; // percentage (0-100)
    dailyDeepWorkHours: number;
    monthlySavingsRate: number; // in USD
    investmentAnnualReturn: number; // percentage (0-50)
    dailyLearningHours: number;
    exerciseDaysPerWeek: number;
  };
  trajectories: {
    p10: SimulationPoint[]; // conservative / degraded
    p50: SimulationPoint[]; // expected baseline
    p90: SimulationPoint[]; // peak alpha compound
  };
  projectedOutcomes: {
    netWorth: number;
    skillMasteryPoints: number;
    vitalityBiologicalAgeOffset: number; // e.g. -4.2 years younger
    lifeSynergyIndex: number; // 0 - 100
  };
  recommendations: string[];
}

export interface EpochMilestone {
  id: string;
  epochName: string;
  title: string;
  category: 'breakthrough' | 'mastery' | 'financial' | 'vitality';
  achievedAt: string;
  description: string;
  significanceRank: 'Tier S' | 'Tier A' | 'Tier B';
  proofArtifact: string;
  status: 'completed' | 'in_progress' | 'target';
}

export interface SovereignVaultArchive {
  id: string;
  backupVersion: string;
  createdAt: string;
  totalRecords: number;
  dataSizeKb: number;
  encryptionAlgorithm: string;
  checksum: string;
  offlineReady: boolean;
  exportFormat: 'json' | 'sqlite' | 'standalone_html';
}




