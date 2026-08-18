import { Pool, PoolConfig } from 'pg';
import {
  DatabaseAdapter,
  SyncResult,
  TaskCompletionResult,
  HabitCompletionResult,
  GoalProgressResult,
} from './DatabaseAdapter';
import { AuthUserRecord, UserDatabaseState } from '../types';
import {
  UserProfile,
  TaskItem,
  HabitItem,
  GoalItem,
  AIChatMessage,
  XpTransaction,
  XpCategory,
  TradeJournalEntry,
  LifeAutomationRule,
  AutomationExecutionLog,
  BossBattle,
  SkillPerkNode,
} from '../../types';
import {
  INITIAL_USER,
} from '../../lib/storage';
import {
  INITIAL_BOSS_BATTLES,
  INITIAL_SKILL_PERK_NODES,
} from '../../lib/phase8Data';
import {
  INITIAL_AUTOMATIONS,
} from '../../lib/phase9Data';
import {
  LEVEL_RANKS,
  getXpRequiredForLevel,
} from '../../lib/gamification';

export class PostgresDatabaseAdapter implements DatabaseAdapter {
  private pool: Pool;
  private isInitialized = false;

  constructor(connectionString?: string) {
    const config: PoolConfig = {
      connectionString: connectionString || process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_SIZE) || 10,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
    this.pool = new Pool(config);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          title VARCHAR(100) NOT NULL,
          level INTEGER NOT NULL DEFAULT 1,
          current_xp INTEGER NOT NULL DEFAULT 0,
          next_level_xp INTEGER NOT NULL DEFAULT 1000,
          avatar_url TEXT,
          streak_count INTEGER DEFAULT 0,
          focus_hours REAL DEFAULT 0,
          win_rate REAL DEFAULT 0,
          tasks_completed INTEGER DEFAULT 0,
          settings_json JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_state_metadata (
          user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          version INTEGER NOT NULL DEFAULT 1,
          last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          due_date VARCHAR(50),
          time VARCHAR(50),
          end_time VARCHAR(50),
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          status VARCHAR(30) NOT NULL DEFAULT 'todo',
          category VARCHAR(100) NOT NULL DEFAULT 'Engineering',
          tags_json JSONB NOT NULL DEFAULT '[]',
          xp INTEGER NOT NULL DEFAULT 50,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS habits (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          frequency VARCHAR(30) NOT NULL DEFAULT 'daily',
          target VARCHAR(100),
          category VARCHAR(50) NOT NULL DEFAULT 'Skill',
          difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
          xp INTEGER NOT NULL DEFAULT 35,
          current_streak INTEGER NOT NULL DEFAULT 0,
          best_streak INTEGER NOT NULL DEFAULT 0,
          history_json JSONB NOT NULL DEFAULT '[]',
          completed_today BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS goals (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL DEFAULT 'Career & Skills',
          progress INTEGER NOT NULL DEFAULT 0,
          xp_reward INTEGER NOT NULL DEFAULT 500,
          milestones_json JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS journal_entries (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          symbol VARCHAR(30) NOT NULL,
          direction VARCHAR(10) NOT NULL,
          entry_price REAL NOT NULL DEFAULT 0,
          exit_price REAL NOT NULL DEFAULT 0,
          size REAL NOT NULL DEFAULT 1,
          pnl REAL NOT NULL DEFAULT 0,
          pnl_percent REAL NOT NULL DEFAULT 0,
          r_multiple REAL NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'breakeven',
          notes TEXT,
          setup_strategy VARCHAR(100),
          session VARCHAR(50),
          emotion VARCHAR(50),
          mistakes_json JSONB NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS xp_ledger (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          reason VARCHAR(200) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS processed_events (
          client_event_id VARCHAR(150) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          result_json JSONB NOT NULL,
          processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (client_event_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS automations (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          trigger_type VARCHAR(50) NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          config_json JSONB NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS automation_logs (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          automation_id VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boss_raids (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          current_hp INTEGER NOT NULL,
          max_hp INTEGER NOT NULL,
          status VARCHAR(30) NOT NULL,
          xp_reward INTEGER NOT NULL,
          loot_json JSONB NOT NULL DEFAULT '[]',
          end_time VARCHAR(50)
        );

        CREATE TABLE IF NOT EXISTS perks (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          cost INTEGER NOT NULL,
          unlocked BOOLEAN NOT NULL DEFAULT FALSE,
          branch VARCHAR(50) NOT NULL,
          tier INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_history (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          timestamp VARCHAR(50) NOT NULL,
          model_used VARCHAR(50)
        );

        CREATE INDEX IF NOT EXISTS idx_pg_tasks_user ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_habits_user ON habits(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_goals_user ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_journal_user ON journal_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_xp_ledger_user ON xp_ledger(user_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_pg_processed_events ON processed_events(user_id, client_event_id);
        CREATE INDEX IF NOT EXISTS idx_pg_metadata_ver ON user_state_metadata(user_id, version);
      `);
      this.isInitialized = true;
    } finally {
      client.release();
    }
  }

  // Synchronous API compatibility helpers (queries use async pool execution)
  // For standard unified DatabaseAdapter interface in LifeOS routes
  private runSync<T>(promise: Promise<T>): T {
    // Note: Node express handles async handlers seamlessly, and synchronous wrappers
    // should execute query logic.
    throw new Error('Postgres queries should be called with async handlers.');
  }

  // Minimal stub implementation satisfying DatabaseAdapter if called
  public getUserById(id: string): AuthUserRecord | null { return null; }
  public getUserByEmail(email: string): AuthUserRecord | null { return null; }
  public createUser(email: string, passwordHash: string, salt: string, name: string): AuthUserRecord { throw new Error('Use active database instance.'); }
  public updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile { throw new Error('Use active database instance.'); }
  public getUserState(userId: string): UserDatabaseState { throw new Error('Use active database instance.'); }
  public syncUserState(userId: string, syncPayload: any): SyncResult { throw new Error('Use active database instance.'); }
  public completeTask(userId: string, taskId: string, clientEventId?: string, baseVersion?: number): TaskCompletionResult { throw new Error('Use active database instance.'); }
  public createTask(userId: string, task: any, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public updateTask(userId: string, taskId: string, updates: any, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public deleteTask(userId: string, taskId: string, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public completeHabit(userId: string, habitId: string, dateStr?: string, clientEventId?: string, baseVersion?: number): HabitCompletionResult { throw new Error('Use active database instance.'); }
  public createHabit(userId: string, habit: any, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public updateHabit(userId: string, habitId: string, updates: any, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public deleteHabit(userId: string, habitId: string, clientEventId?: string, baseVersion?: number): any { throw new Error('Use active database instance.'); }
  public updateGoalProgress(userId: string, goalId: string, progress: number, milestoneId?: string, clientEventId?: string, baseVersion?: number): GoalProgressResult { throw new Error('Use active database instance.'); }
  public recordXpTransaction(userId: string, amount: number, reason: string, category?: XpCategory, clientEventId?: string): any { throw new Error('Use active database instance.'); }
  public addAiMessage(userId: string, message: AIChatMessage): void {}
}
