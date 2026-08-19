import { AuthUserRecord, UserDatabaseState } from '../types';
import {
  UserProfile,
  TaskItem,
  HabitItem,
  GoalItem,
  AIChatMessage,
  XpTransaction,
  XpCategory,
} from '../../types';

export interface SyncResult {
  conflict?: boolean;
  serverVersion: number;
  clientVersion?: number;
  state: UserDatabaseState;
}

export interface SyncOperation {
  operationId: string;
  clientEventId?: string;
  type:
    | 'CREATE_TASK'
    | 'UPDATE_TASK'
    | 'DELETE_TASK'
    | 'COMPLETE_TASK'
    | 'CREATE_HABIT'
    | 'UPDATE_HABIT'
    | 'DELETE_HABIT'
    | 'COMPLETE_HABIT'
    | 'UPDATE_GOAL_PROGRESS'
    | 'CREATE_GOAL'
    | 'UPDATE_GOAL'
    | 'DELETE_GOAL'
    | 'UPDATE_PROFILE_SETTINGS';
  entityId?: string;
  payload?: any;
  baseVersion?: number;
  clientTimestamp?: string;
}

export interface SyncOperationsResult {
  success: boolean;
  conflict?: boolean;
  serverVersion: number;
  clientVersion?: number;
  appliedCount: number;
  rejectedCount: number;
  operationResults: Array<{
    operationId: string;
    success: boolean;
    error?: string;
    result?: any;
  }>;
  state: UserDatabaseState;
}

export interface PaperOrderRecord {
  id: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface PaperPositionRecord {
  id: string;
  userId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
}

export interface TaskCompletionResult {
  success: boolean;
  task?: TaskItem;
  profile?: UserProfile;
  xpTransaction?: XpTransaction;
  version: number;
  alreadyCompleted?: boolean;
  error?: string;
}

export interface HabitCompletionResult {
  success: boolean;
  habit?: HabitItem;
  profile?: UserProfile;
  xpTransaction?: XpTransaction;
  version: number;
  alreadyCompleted?: boolean;
  error?: string;
}

export interface GoalProgressResult {
  success: boolean;
  goal?: GoalItem;
  profile?: UserProfile;
  xpTransaction?: XpTransaction;
  version: number;
  error?: string;
}

export interface DatabaseAdapter {
  getUserById(id: string): (AuthUserRecord | null) | Promise<AuthUserRecord | null>;
  getUserByEmail(email: string): (AuthUserRecord | null) | Promise<AuthUserRecord | null>;
  createUser(email: string, passwordHash: string, salt: string, name: string, role?: 'admin' | 'user'): AuthUserRecord | Promise<AuthUserRecord>;
  setUserRole(userId: string, role: 'admin' | 'user'): void | Promise<void>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | Promise<UserProfile>;
  getUserState(userId: string): UserDatabaseState | Promise<UserDatabaseState>;
  syncUserState(userId: string, syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState>; operations?: SyncOperation[] }): SyncResult | Promise<SyncResult>;
  applySyncOperations(userId: string, operations: SyncOperation[], baseVersion?: number): SyncOperationsResult | Promise<SyncOperationsResult>;
  
  // Authoritative Domain Actions
  completeTask(userId: string, taskId: string, clientEventId?: string, baseVersion?: number): TaskCompletionResult | Promise<TaskCompletionResult>;
  createTask(userId: string, task: Omit<TaskItem, 'id'>, clientEventId?: string, baseVersion?: number): { success: boolean; task: TaskItem; version: number } | Promise<{ success: boolean; task: TaskItem; version: number }>;
  updateTask(userId: string, taskId: string, updates: Partial<TaskItem>, clientEventId?: string, baseVersion?: number): { success: boolean; task?: TaskItem; version: number; error?: string } | Promise<{ success: boolean; task?: TaskItem; version: number; error?: string }>;
  deleteTask(userId: string, taskId: string, clientEventId?: string, baseVersion?: number): { success: boolean; version: number; error?: string } | Promise<{ success: boolean; version: number; error?: string }>;

  completeHabit(userId: string, habitId: string, dateStr?: string, clientEventId?: string, baseVersion?: number): HabitCompletionResult | Promise<HabitCompletionResult>;
  createHabit(userId: string, habit: Omit<HabitItem, 'id'>, clientEventId?: string, baseVersion?: number): { success: boolean; habit: HabitItem; version: number } | Promise<{ success: boolean; habit: HabitItem; version: number }>;
  updateHabit(userId: string, habitId: string, updates: Partial<HabitItem>, clientEventId?: string, baseVersion?: number): { success: boolean; habit?: HabitItem; version: number; error?: string } | Promise<{ success: boolean; habit?: HabitItem; version: number; error?: string }>;
  deleteHabit(userId: string, habitId: string, clientEventId?: string, baseVersion?: number): { success: boolean; version: number; error?: string } | Promise<{ success: boolean; version: number; error?: string }>;

  updateGoalProgress(userId: string, goalId: string, progress: number, milestoneId?: string, clientEventId?: string, baseVersion?: number): GoalProgressResult | Promise<GoalProgressResult>;

  recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category?: XpCategory,
    clientEventId?: string
  ): { profile: UserProfile; transaction: XpTransaction; version: number } | Promise<{ profile: UserProfile; transaction: XpTransaction; version: number }>;

  addAiMessage(userId: string, message: AIChatMessage): void | Promise<void>;

  updateUserPassword(userId: string, passwordHash: string, salt: string): boolean | Promise<boolean>;
  invalidateUserSessions(userId: string): void | Promise<void>;
  getUserTokenVersion(userId: string): number | Promise<number>;

  // Durable Telemetry & Feedback
  recordTelemetryEvent(event: { id: string; userId?: string; type: string; route?: string; category?: string; status?: string; statusCode?: number; durationMs?: number; metadata?: any; timestamp: string }): void | Promise<void>;
  recordUserFeedback(feedback: { id: string; userId: string; rating: number; type: string; category?: string; comment?: string; sentiment?: string; timestamp: string }): void | Promise<void>;
  getDurableFeedback(limit?: number): any[] | Promise<any[]>;

  // Paper Trading State
  createPaperOrder(userId: string, order: Omit<PaperOrderRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): PaperOrderRecord | Promise<PaperOrderRecord>;
  cancelPaperOrder(userId: string, orderId: string): { success: boolean; error?: string; order?: PaperOrderRecord } | Promise<{ success: boolean; error?: string; order?: PaperOrderRecord }>;
  closePaperPosition(userId: string, positionId: string, exitPrice?: number): { success: boolean; pnl?: number; error?: string; position?: PaperPositionRecord } | Promise<{ success: boolean; pnl?: number; error?: string; position?: PaperPositionRecord }>;
  getPaperOrders(userId: string): PaperOrderRecord[] | Promise<PaperOrderRecord[]>;
  getPaperPositions(userId: string): PaperPositionRecord[] | Promise<PaperPositionRecord[]>;

  isReady(): boolean | Promise<boolean>;
  getStats(): { userCount: number; adapter: string; path?: string } | Promise<{ userCount: number; adapter: string; path?: string }>;
  reopen?(): Promise<void>;
  close(): Promise<void>;
}
