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
  syncUserState(userId: string, syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState> }): SyncResult | Promise<SyncResult>;
  
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
  isReady(): boolean | Promise<boolean>;
  getStats(): { userCount: number; adapter: string; path?: string } | Promise<{ userCount: number; adapter: string; path?: string }>;
  close(): Promise<void>;
}
