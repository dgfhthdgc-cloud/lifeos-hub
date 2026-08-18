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
  getUserById(id: string): AuthUserRecord | null;
  getUserByEmail(email: string): AuthUserRecord | null;
  createUser(email: string, passwordHash: string, salt: string, name: string): AuthUserRecord;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile;
  getUserState(userId: string): UserDatabaseState;
  syncUserState(userId: string, syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState> }): SyncResult;
  
  // Authoritative Domain Actions
  completeTask(userId: string, taskId: string): TaskCompletionResult;
  createTask(userId: string, task: Omit<TaskItem, 'id'>): { success: boolean; task: TaskItem; version: number };
  updateTask(userId: string, taskId: string, updates: Partial<TaskItem>): { success: boolean; task?: TaskItem; version: number; error?: string };
  deleteTask(userId: string, taskId: string): { success: boolean; version: number; error?: string };

  completeHabit(userId: string, habitId: string, dateStr?: string): HabitCompletionResult;
  createHabit(userId: string, habit: Omit<HabitItem, 'id'>): { success: boolean; habit: HabitItem; version: number };
  updateHabit(userId: string, habitId: string, updates: Partial<HabitItem>): { success: boolean; habit?: HabitItem; version: number; error?: string };
  deleteHabit(userId: string, habitId: string): { success: boolean; version: number; error?: string };

  updateGoalProgress(userId: string, goalId: string, progress: number, milestoneId?: string): GoalProgressResult;

  recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category?: XpCategory
  ): { profile: UserProfile; transaction: XpTransaction; version: number };

  addAiMessage(userId: string, message: AIChatMessage): void;
}
