import { UserProfile, TaskItem, HabitItem, GoalItem, TradeJournalEntry, AIChatMessage, XpTransaction, LifeAutomationRule, AutomationExecutionLog, BossBattle, SkillPerkNode } from '../types';

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  profile: UserProfile;
}

export interface UserDatabaseState {
  version: number;
  profile: UserProfile;
  tasks: TaskItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  journal: TradeJournalEntry[];
  aiHistory: AIChatMessage[];
  xpLedger: XpTransaction[];
  automations: LifeAutomationRule[];
  automationLogs: AutomationExecutionLog[];
  bossRaids: BossBattle[];
  perks: SkillPerkNode[];
  lastSyncedAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  exp: number;
}
