import { Pool, PoolClient, PoolConfig } from 'pg';
import {
  DatabaseAdapter,
  SyncResult,
  SyncOperation,
  SyncOperationsResult,
  TaskCompletionResult,
  HabitCompletionResult,
  GoalProgressResult,
  PaperOrderRecord,
  PaperPositionRecord,
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
  TradingSession,
  TradingEmotion,
  LifeAutomationRule,
  AutomationExecutionLog,
  BossBattle,
  SkillPerkNode,
} from '../../types';
import { INITIAL_USER } from '../../lib/storage';
import { INITIAL_BOSS_BATTLES, INITIAL_SKILL_PERK_NODES } from '../../lib/phase8Data';
import { INITIAL_AUTOMATIONS } from '../../lib/phase9Data';
import { LEVEL_RANKS, getXpRequiredForLevel } from '../../lib/gamification';

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

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          token_version INTEGER NOT NULL DEFAULT 1,
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
          id VARCHAR(100) NOT NULL,
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
          goal_id VARCHAR(100),
          milestone_id VARCHAR(100),
          xp INTEGER NOT NULL DEFAULT 50,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS habits (
          id VARCHAR(100) NOT NULL,
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
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS goals (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL DEFAULT 'Career & Skills',
          progress INTEGER NOT NULL DEFAULT 0,
          xp_reward INTEGER NOT NULL DEFAULT 500,
          milestones_json JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS journal_entries (
          id VARCHAR(100) NOT NULL,
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
          mistakes_json JSONB NOT NULL DEFAULT '[]',
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS xp_ledger (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          reason VARCHAR(200) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS processed_events (
          client_event_id VARCHAR(150) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          result_json JSONB NOT NULL,
          processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (client_event_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS automations (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          trigger_type VARCHAR(50) NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          config_json JSONB NOT NULL DEFAULT '{}',
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS automation_logs (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          automation_id VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS boss_raids (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          current_hp INTEGER NOT NULL,
          max_hp INTEGER NOT NULL,
          status VARCHAR(30) NOT NULL,
          xp_reward INTEGER NOT NULL,
          loot_json JSONB NOT NULL DEFAULT '[]',
          end_time VARCHAR(50),
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS perks (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          cost INTEGER NOT NULL,
          unlocked BOOLEAN NOT NULL DEFAULT FALSE,
          branch VARCHAR(50) NOT NULL,
          tier INTEGER NOT NULL,
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS ai_history (
          id VARCHAR(100) NOT NULL,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          timestamp VARCHAR(50) NOT NULL,
          model_used VARCHAR(50),
          PRIMARY KEY (id, user_id)
        );

        CREATE TABLE IF NOT EXISTS telemetry_events (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
          event_type VARCHAR(100) NOT NULL,
          route VARCHAR(255),
          category VARCHAR(100),
          status VARCHAR(50),
          duration_ms REAL,
          metadata_json JSONB,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_feedback (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'General',
          comment TEXT,
          sentiment VARCHAR(50) NOT NULL DEFAULT 'neutral',
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS paper_orders (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          symbol VARCHAR(30) NOT NULL,
          side VARCHAR(10) NOT NULL,
          type VARCHAR(20) NOT NULL,
          quantity REAL NOT NULL,
          price REAL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS paper_positions (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          symbol VARCHAR(30) NOT NULL,
          side VARCHAR(10) NOT NULL,
          quantity REAL NOT NULL,
          entry_price REAL NOT NULL,
          current_price REAL NOT NULL,
          unrealized_pnl REAL NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          closed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_pg_tasks_user ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_habits_user ON habits(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_goals_user ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_journal_user ON journal_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_pg_xp_ledger_user ON xp_ledger(user_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_pg_processed_events ON processed_events(user_id, client_event_id);
        CREATE INDEX IF NOT EXISTS idx_pg_metadata_ver ON user_state_metadata(user_id, version);
        CREATE INDEX IF NOT EXISTS idx_pg_telemetry_user ON telemetry_events(user_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_pg_feedback_user ON user_feedback(user_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_pg_paper_orders_user ON paper_orders(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pg_paper_positions_user ON paper_positions(user_id, created_at DESC);

        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id VARCHAR(100);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS milestone_id VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;

        DO $$
        BEGIN
          -- Fix automations primary key if created with single-column id PK previously
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'automations' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'automations_pkey'
          ) THEN
            ALTER TABLE automations DROP CONSTRAINT automations_pkey;
            ALTER TABLE automations ADD CONSTRAINT automations_pkey PRIMARY KEY (id, user_id);
          END IF;

          -- Fix boss_raids primary key if created with single-column id PK previously
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'boss_raids' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'boss_raids_pkey'
          ) THEN
            ALTER TABLE boss_raids DROP CONSTRAINT boss_raids_pkey;
            ALTER TABLE boss_raids ADD CONSTRAINT boss_raids_pkey PRIMARY KEY (id, user_id);
          END IF;

          -- Fix perks primary key if created with single-column id PK previously
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'perks' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'perks_pkey'
          ) THEN
            ALTER TABLE perks DROP CONSTRAINT perks_pkey;
            ALTER TABLE perks ADD CONSTRAINT perks_pkey PRIMARY KEY (id, user_id);
          END IF;

          -- Fix automation_logs primary key if created with single-column id PK previously
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'automation_logs' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'automation_logs_pkey'
          ) THEN
            ALTER TABLE automation_logs DROP CONSTRAINT automation_logs_pkey;
            ALTER TABLE automation_logs ADD CONSTRAINT automation_logs_pkey PRIMARY KEY (id, user_id);
          END IF;
        END $$;
      `);
      this.isInitialized = true;
    } finally {
      client.release();
    }
  }

  public ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PostgresDatabaseAdapter must be initialized before use. Call await adapter.initialize()');
    }
  }

  private sanitizeKeys(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((i) => this.sanitizeKeys(i));
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      clean[key] = this.sanitizeKeys(obj[key]);
    }
    return clean;
  }

  private async getCachedEvent(userId: string, clientEventId?: string): Promise<any | null> {
    if (!clientEventId) return null;
    const res = await this.pool.query(
      'SELECT result_json FROM processed_events WHERE user_id = $1 AND client_event_id = $2',
      [userId, clientEventId]
    );
    if (res.rows.length === 0) return null;
    const raw = res.rows[0].result_json;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  private async cacheEvent(client: PoolClient | Pool, userId: string, clientEventId: string, result: any): Promise<void> {
    await client.query(
      `INSERT INTO processed_events (client_event_id, user_id, result_json, processed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_event_id, user_id)
       DO UPDATE SET result_json = EXCLUDED.result_json, processed_at = EXCLUDED.processed_at`,
      [clientEventId, userId, JSON.stringify(result), new Date().toISOString()]
    );
  }

  private async getProfile(userId: string, client?: PoolClient): Promise<UserProfile | null> {
    const q = client || this.pool;
    const res = await q.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const settings = typeof row.settings_json === 'string' ? JSON.parse(row.settings_json) : (row.settings_json || {});

    return {
      id: userId,
      email: '',
      name: row.name,
      title: row.title,
      level: Number(row.level),
      currentXp: Number(row.current_xp),
      nextLevelXp: Number(row.next_level_xp),
      avatarUrl: row.avatar_url || undefined,
      streakDays: Number(row.streak_count),
      settings: settings as any,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };
  }

  public async getUserById(id: string): Promise<AuthUserRecord | null> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const userRow = res.rows[0];

    const profile = await this.getProfile(id);
    if (!profile) return null;

    return {
      id: userRow.id,
      email: userRow.email,
      passwordHash: userRow.password_hash,
      salt: userRow.salt,
      role: (userRow.role as 'admin' | 'user') || 'user',
      tokenVersion: typeof userRow.token_version === 'number' ? userRow.token_version : 1,
      createdAt: userRow.created_at ? new Date(userRow.created_at).toISOString() : new Date().toISOString(),
      profile,
    };
  }

  public async getUserByEmail(email: string): Promise<AuthUserRecord | null> {
    this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalized]);
    if (res.rows.length === 0) return null;
    const userRow = res.rows[0];

    const profile = await this.getProfile(userRow.id);
    if (!profile) return null;

    return {
      id: userRow.id,
      email: userRow.email,
      passwordHash: userRow.password_hash,
      salt: userRow.salt,
      role: (userRow.role as 'admin' | 'user') || 'user',
      tokenVersion: typeof userRow.token_version === 'number' ? userRow.token_version : 1,
      createdAt: userRow.created_at ? new Date(userRow.created_at).toISOString() : new Date().toISOString(),
      profile,
    };
  }

  public async setUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    this.ensureInitialized();
    await this.pool.query('UPDATE users SET role = $1, token_version = token_version + 1 WHERE id = $2', [role, userId]);
  }

  public async invalidateUserSessions(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
  }

  public async getUserTokenVersion(userId: string): Promise<number> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT token_version FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) return 0;
    return Number(res.rows[0].token_version) || 1;
  }

  public async createUser(email: string, passwordHash: string, salt: string, name: string, role?: 'admin' | 'user'): Promise<AuthUserRecord> {
    this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    const existing = await this.getUserByEmail(normalized);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const userRole: 'admin' | 'user' = role || 'user';

    const profile: UserProfile = {
      ...INITIAL_USER,
      id,
      email: normalized,
      name: name || 'LifeOS Citizen',
      createdAt: now,
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO users (id, email, password_hash, salt, role, token_version, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, normalized, passwordHash, salt, userRole, 1, now]
      );

      await client.query(
        `INSERT INTO user_profiles (
          user_id, name, title, level, current_xp, next_level_xp, avatar_url,
          streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          profile.name || 'LifeOS Citizen',
          profile.title || 'Initiate Apprentice',
          profile.level || 1,
          profile.currentXp || 0,
          profile.nextLevelXp || 1000,
          profile.avatarUrl || null,
          profile.streakDays ?? 0,
          0,
          0,
          0,
          JSON.stringify(profile.settings || {}),
          now,
        ]
      );

      await client.query(
        'INSERT INTO user_state_metadata (user_id, version, last_synced_at) VALUES ($1, $2, $3)',
        [id, 1, now]
      );

      // Seed initial automations, boss battles, perks
      for (const auto of INITIAL_AUTOMATIONS) {
        await client.query(
          `INSERT INTO automations (id, user_id, name, trigger_type, action_type, enabled, config_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            auto.id,
            id,
            auto.title || 'Automation Rule',
            auto.trigger?.type || 'event',
            auto.action?.type || 'action',
            auto.enabled ? true : false,
            JSON.stringify(auto.condition || {}),
          ]
        );
      }

      for (const boss of INITIAL_BOSS_BATTLES) {
        await client.query(
          `INSERT INTO boss_raids (id, user_id, name, description, current_hp, max_hp, status, xp_reward, loot_json, end_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            boss.id,
            id,
            boss.name,
            boss.lore || boss.subtitle || '',
            boss.currentHp ?? 1000,
            boss.maxHp ?? 1000,
            boss.defeated ? 'defeated' : 'active',
            boss.rewards?.xp ?? 500,
            JSON.stringify(boss.activeModifiers || []),
            boss.endDate || null,
          ]
        );
      }

      for (const perk of INITIAL_SKILL_PERK_NODES) {
        await client.query(
          `INSERT INTO perks (id, user_id, name, description, cost, unlocked, branch, tier)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            perk.id,
            id,
            perk.title || 'Skill Perk',
            perk.description || '',
            perk.costPoints ?? 1,
            perk.unlocked ? true : false,
            perk.domain || 'general',
            perk.tier ?? 1,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return {
      id,
      email: normalized,
      passwordHash,
      salt,
      role: userRole,
      createdAt: now,
      profile,
    };
  }

  public async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    this.ensureInitialized();
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const clean = this.sanitizeKeys(updates);
    if (typeof clean.name === 'string' && clean.name.trim().length > 0) {
      profile.name = clean.name.trim().slice(0, 80);
    }
    if (typeof clean.title === 'string') {
      profile.title = clean.title.trim().slice(0, 80);
    }
    if (typeof clean.avatarUrl === 'string') {
      profile.avatarUrl = clean.avatarUrl.trim().slice(0, 300);
    }
    if (clean.settings && typeof clean.settings === 'object') {
      profile.settings = {
        ...profile.settings,
        theme: clean.settings.theme === 'light' ? 'light' : 'dark',
        notificationsEnabled: Boolean(clean.settings.notificationsEnabled),
        aiInsightsEnabled: Boolean(clean.settings.aiInsightsEnabled),
        compactView: Boolean(clean.settings.compactView),
      };
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE user_profiles
         SET name = $1, title = $2, avatar_url = $3, settings_json = $4
         WHERE user_id = $5`,
        [profile.name, profile.title, profile.avatarUrl || null, JSON.stringify(profile.settings), userId]
      );

      await client.query(
        `UPDATE user_state_metadata
         SET version = version + 1, last_synced_at = $1
         WHERE user_id = $2`,
        [new Date().toISOString(), userId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return profile;
  }

  public async getUserState(userId: string): Promise<UserDatabaseState> {
    this.ensureInitialized();
    let profile = await this.getProfile(userId);

    const metaRes = await this.pool.query('SELECT * FROM user_state_metadata WHERE user_id = $1', [userId]);
    let version = 1;
    let lastSyncedAt = new Date().toISOString();

    if (metaRes.rows.length > 0) {
      version = Number(metaRes.rows[0].version);
      lastSyncedAt = metaRes.rows[0].last_synced_at ? new Date(metaRes.rows[0].last_synced_at).toISOString() : lastSyncedAt;
    } else {
      if (!profile) {
        profile = { ...INITIAL_USER, id: userId, createdAt: lastSyncedAt };
        await this.pool.query(
          `INSERT INTO user_profiles (
            user_id, name, title, level, current_xp, next_level_xp, avatar_url,
            streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (user_id) DO NOTHING`,
          [
            userId,
            profile.name || 'LifeOS Citizen',
            profile.title || 'Initiate Apprentice',
            profile.level || 1,
            profile.currentXp || 0,
            profile.nextLevelXp || 1000,
            profile.avatarUrl || null,
            profile.streakDays ?? 0,
            0,
            0,
            0,
            JSON.stringify(profile.settings || {}),
            lastSyncedAt,
          ]
        );
      }
      await this.pool.query(
        'INSERT INTO user_state_metadata (user_id, version, last_synced_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
        [userId, 1, lastSyncedAt]
      );
    }

    if (!profile) {
      profile = { ...INITIAL_USER, id: userId, createdAt: lastSyncedAt };
    }

    // Load tasks
    const taskRes = await this.pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const tasks: TaskItem[] = taskRes.rows.map((row) => {
      let tags: string[] = [];
      try {
        tags = typeof row.tags_json === 'string' ? JSON.parse(row.tags_json) : (row.tags_json || []);
      } catch {}
      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        dueDate: row.due_date || '',
        time: row.time || '',
        endTime: row.end_time || undefined,
        priority: row.priority as 'low' | 'medium' | 'high',
        status: row.status as 'todo' | 'in_progress' | 'completed',
        category: row.category,
        tags,
        goalId: row.goal_id || undefined,
        milestoneId: row.milestone_id || undefined,
        xp: Number(row.xp),
        completed: Boolean(row.completed),
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    // Load habits
    const habitRes = await this.pool.query('SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const habits: HabitItem[] = habitRes.rows.map((row) => {
      let history: string[] = [];
      try {
        history = typeof row.history_json === 'string' ? JSON.parse(row.history_json) : (row.history_json || []);
      } catch {}
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        frequency: row.frequency as 'daily' | 'weekly',
        target: row.target || '',
        category: row.category as any,
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
        xp: Number(row.xp),
        currentStreak: Number(row.current_streak),
        bestStreak: Number(row.best_streak),
        history,
        completedToday: Boolean(row.completed_today),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    // Load goals
    const goalRes = await this.pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const goals: GoalItem[] = goalRes.rows.map((row) => {
      let milestones = [];
      try {
        milestones = typeof row.milestones_json === 'string' ? JSON.parse(row.milestones_json) : (row.milestones_json || []);
      } catch {}
      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category,
        progress: Number(row.progress),
        xpReward: Number(row.xp_reward),
        milestones,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      };
    });

    // Load journal entries
    const journalRes = await this.pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [userId]
    );
    const journal: TradeJournalEntry[] = journalRes.rows.map((row) => {
      let mistakes: string[] = [];
      try {
        mistakes = typeof row.mistakes_json === 'string' ? JSON.parse(row.mistakes_json) : (row.mistakes_json || []);
      } catch {}
      const validSessions: TradingSession[] = ['Asia', 'London', 'New York AM', 'New York PM'];
      const session = validSessions.includes(row.session as any) ? (row.session as TradingSession) : 'New York AM';
      const validEmotions: TradingEmotion[] = ['Disciplined', 'Confident', 'FOMO', 'Revenge', 'Hesitant', 'Anxious'];
      const emotion = validEmotions.includes(row.emotion as any) ? (row.emotion as TradingEmotion) : 'Disciplined';

      return {
        id: row.id,
        symbol: row.symbol,
        category: 'Forex',
        direction: row.direction as 'long' | 'short',
        entryDate: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        exitDate: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        entryPrice: Number(row.entry_price),
        exitPrice: Number(row.exit_price),
        stopLoss: 0,
        positionSize: Number(row.size),
        pnl: Number(row.pnl),
        pnlPercent: Number(row.pnl_percent),
        rMultiple: Number(row.r_multiple),
        riskAmount: 0,
        status: row.status as 'win' | 'loss' | 'breakeven',
        notes: row.notes || '',
        setupStrategy: row.setup_strategy || '',
        session,
        emotion,
        mistakes,
        rating: 5,
      };
    });

    // Load XP ledger
    const xpRes = await this.pool.query(
      'SELECT * FROM xp_ledger WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [userId]
    );
    const xpLedger: XpTransaction[] = xpRes.rows.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      reason: row.reason,
      category: row.category as XpCategory,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    }));

    // Load automations
    const autoRes = await this.pool.query('SELECT * FROM automations WHERE user_id = $1', [userId]);
    const automations: LifeAutomationRule[] = autoRes.rows.map((row) => {
      let condition = undefined;
      try {
        condition = typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json;
      } catch {}
      return {
        id: row.id,
        title: row.name,
        description: 'Automation rule',
        category: 'execution',
        enabled: Boolean(row.enabled),
        trigger: {
          type: (row.trigger_type as any) || 'task_completed',
          label: row.trigger_type,
        },
        action: {
          type: (row.action_type as any) || 'grant_xp',
          label: row.action_type,
          value: 0,
        },
        condition,
        runCount: 0,
        iconName: 'Zap',
      };
    });

    // Load automation logs
    const logRes = await this.pool.query(
      'SELECT * FROM automation_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [userId]
    );
    const automationLogs: AutomationExecutionLog[] = logRes.rows.map((row) => ({
      id: row.id,
      ruleId: row.automation_id,
      ruleTitle: 'Automation Rule',
      triggerEvent: 'Event',
      actionTaken: 'Executed',
      status: (row.status as 'success' | 'failed' | 'skipped') || 'success',
      details: row.message,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    }));

    // Load boss raids
    const bossRes = await this.pool.query('SELECT * FROM boss_raids WHERE user_id = $1', [userId]);
    const bossRaids: BossBattle[] = bossRes.rows.map((row) => {
      let modifiers: any[] = [];
      try {
        modifiers = typeof row.loot_json === 'string' ? JSON.parse(row.loot_json) : (row.loot_json || []);
      } catch {}
      return {
        id: row.id,
        name: row.name,
        subtitle: 'Epic Boss Raid',
        lore: row.description || '',
        avatarIcon: 'Skull',
        themeColor: 'amber',
        currentHp: Number(row.current_hp),
        maxHp: Number(row.max_hp),
        difficulty: 'Standard',
        deadlineDays: 7,
        startDate: new Date().toISOString(),
        endDate: row.end_time || new Date().toISOString(),
        defeated: row.status === 'defeated',
        rewards: {
          xp: Number(row.xp_reward),
          badgeTitle: 'Slayer',
          perkPoints: 1,
          lootDescription: 'Victory Trophy',
        },
        activeModifiers: modifiers,
        damageLog: [],
      };
    });

    // Load perks
    const perkRes = await this.pool.query('SELECT * FROM perks WHERE user_id = $1', [userId]);
    const perks: SkillPerkNode[] = perkRes.rows.map((row) => {
      const rawTier = Number(row.tier);
      const tier: 1 | 2 | 3 | 4 = rawTier === 2 ? 2 : rawTier === 3 ? 3 : rawTier === 4 ? 4 : 1;
      return {
        id: row.id,
        title: row.name,
        description: row.description || '',
        domain: (row.branch as any) || 'execution',
        tier,
        costPoints: Number(row.cost),
        unlocked: Boolean(row.unlocked),
        iconName: 'Award',
        passiveEffect: row.description || 'Passive boost',
        dependencies: [],
      };
    });

    // Load AI history
    const aiRes = await this.pool.query(
      'SELECT * FROM ai_history WHERE user_id = $1 ORDER BY timestamp ASC LIMIT 50',
      [userId]
    );
    const aiHistory: AIChatMessage[] = aiRes.rows.map((row) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      timestamp: row.timestamp,
      modelUsed: row.model_used || undefined,
    }));

    return {
      version,
      profile,
      tasks,
      habits,
      goals,
      journal,
      aiHistory,
      xpLedger,
      automations,
      automationLogs,
      bossRaids,
      perks,
      lastSyncedAt,
    };
  }

  public async applySyncOperations(
    userId: string,
    operations: SyncOperation[],
    baseVersion?: number
  ): Promise<SyncOperationsResult> {
    this.ensureInitialized();
    const currentState = await this.getUserState(userId);
    const clientBaseVersion = typeof baseVersion === 'number' ? baseVersion : undefined;

    if (clientBaseVersion !== undefined && clientBaseVersion < currentState.version && operations.length > 0) {
      // Check if all operations are already cached (idempotency check)
      let allCached = true;
      for (const op of operations) {
        const eventId = op.clientEventId || op.operationId;
        const cached = eventId ? await this.getCachedEvent(userId, eventId) : null;
        if (!cached) {
          allCached = false;
          break;
        }
      }

      if (!allCached) {
        return {
          success: false,
          conflict: true,
          serverVersion: currentState.version,
          clientVersion: clientBaseVersion,
          appliedCount: 0,
          rejectedCount: operations.length,
          operationResults: operations.map((op) => ({
            operationId: op.operationId,
            success: false,
            error: 'STALE_BASE_VERSION_CONFLICT',
          })),
          state: currentState,
        };
      }
    }

    const operationResults: Array<{
      operationId: string;
      success: boolean;
      error?: string;
      result?: any;
    }> = [];
    let appliedCount = 0;
    let rejectedCount = 0;

    for (const op of operations) {
      const eventId = op.clientEventId || op.operationId;
      const cached = eventId ? await this.getCachedEvent(userId, eventId) : null;
      if (cached) {
        operationResults.push({
          operationId: op.operationId,
          success: true,
          result: cached,
        });
        appliedCount++;
        continue;
      }

      try {
        let opResult: any = null;
        switch (op.type) {
          case 'CREATE_TASK': {
            const taskPayload = op.payload?.task || op.payload || {};
            opResult = await this.createTask(userId, taskPayload, op.clientEventId, op.baseVersion);
            break;
          }
          case 'UPDATE_TASK': {
            const taskId = op.entityId || op.payload?.taskId || op.payload?.id;
            const updates = op.payload?.updates || op.payload || {};
            opResult = await this.updateTask(userId, taskId, updates, op.clientEventId, op.baseVersion);
            break;
          }
          case 'DELETE_TASK': {
            const taskId = op.entityId || op.payload?.taskId || op.payload?.id;
            opResult = await this.deleteTask(userId, taskId, op.clientEventId, op.baseVersion);
            break;
          }
          case 'COMPLETE_TASK': {
            const taskId = op.entityId || op.payload?.taskId || op.payload?.id;
            opResult = await this.completeTask(userId, taskId, op.clientEventId, op.baseVersion);
            break;
          }
          case 'CREATE_HABIT': {
            const habitPayload = op.payload?.habit || op.payload || {};
            opResult = await this.createHabit(userId, habitPayload, op.clientEventId, op.baseVersion);
            break;
          }
          case 'UPDATE_HABIT': {
            const habitId = op.entityId || op.payload?.habitId || op.payload?.id;
            const updates = op.payload?.updates || op.payload || {};
            opResult = await this.updateHabit(userId, habitId, updates, op.clientEventId, op.baseVersion);
            break;
          }
          case 'DELETE_HABIT': {
            const habitId = op.entityId || op.payload?.habitId || op.payload?.id;
            opResult = await this.deleteHabit(userId, habitId, op.clientEventId, op.baseVersion);
            break;
          }
          case 'COMPLETE_HABIT': {
            const habitId = op.entityId || op.payload?.habitId || op.payload?.id;
            const dateStr = op.payload?.date || op.payload?.dateStr;
            opResult = await this.completeHabit(userId, habitId, dateStr, op.clientEventId, op.baseVersion);
            break;
          }
          case 'UPDATE_GOAL_PROGRESS': {
            const goalId = op.entityId || op.payload?.goalId || op.payload?.id;
            const progress = typeof op.payload?.progress === 'number' ? op.payload.progress : 0;
            const milestoneId = op.payload?.milestoneId;
            opResult = await this.updateGoalProgress(userId, goalId, progress, milestoneId, op.clientEventId, op.baseVersion);
            break;
          }
          case 'UPDATE_PROFILE_SETTINGS': {
            const updates = op.payload || {};
            opResult = await this.updateUserProfile(userId, updates);
            break;
          }
          default:
            throw new Error(`UNSUPPORTED_OPERATION_TYPE: ${op.type}`);
        }

        if (opResult && typeof opResult === 'object' && opResult.success === false) {
          operationResults.push({
            operationId: op.operationId,
            success: false,
            error: opResult.error || 'Operation rejected',
          });
          rejectedCount++;
        } else {
          if (eventId) {
            const client = await this.pool.connect();
            try {
              await this.cacheEvent(client, userId, eventId, opResult);
            } finally {
              client.release();
            }
          }
          operationResults.push({
            operationId: op.operationId,
            success: true,
            result: opResult,
          });
          appliedCount++;
        }
      } catch (opErr: any) {
        operationResults.push({
          operationId: op.operationId,
          success: false,
          error: opErr?.message || 'Operation failed',
        });
        rejectedCount++;
      }
    }

    const finalState = await this.getUserState(userId);
    return {
      success: rejectedCount === 0,
      conflict: false,
      serverVersion: finalState.version,
      clientVersion: baseVersion,
      appliedCount,
      rejectedCount,
      operationResults,
      state: finalState,
    };
  }

  public async syncUserState(
    userId: string,
    syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState>; operations?: SyncOperation[] }
  ): Promise<SyncResult> {
    this.ensureInitialized();
    if (syncPayload?.operations && Array.isArray(syncPayload.operations)) {
      const opResult = await this.applySyncOperations(userId, syncPayload.operations, syncPayload.baseVersion);
      return {
        conflict: opResult.conflict,
        serverVersion: opResult.serverVersion,
        clientVersion: opResult.clientVersion,
        state: opResult.state,
      };
    }

    const currentState = await this.getUserState(userId);
    const clientBaseVersion = typeof syncPayload?.baseVersion === 'number' ? syncPayload.baseVersion : undefined;

    if (clientBaseVersion !== undefined && clientBaseVersion < currentState.version) {
      return {
        conflict: true,
        serverVersion: currentState.version,
        clientVersion: clientBaseVersion,
        state: currentState,
      };
    }

    const payload = this.sanitizeKeys(syncPayload?.changes || syncPayload || {});
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (payload.profile && typeof payload.profile === 'object') {
        const p = payload.profile;
        const currentProfile = currentState.profile;
        const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 100) : currentProfile.name;
        const title = typeof p.title === 'string' && p.title.trim() ? p.title.trim().slice(0, 100) : currentProfile.title;
        const avatarUrl = typeof p.avatarUrl === 'string' ? p.avatarUrl : currentProfile.avatarUrl;
        const settings = p.settings && typeof p.settings === 'object' ? p.settings : currentProfile.settings;

        await client.query(
          `UPDATE user_profiles SET name = $1, title = $2, avatar_url = $3, settings_json = $4 WHERE user_id = $5`,
          [name, title, avatarUrl || null, JSON.stringify(settings || {}), userId]
        );
      }

      const newVersion = currentState.version + 1;
      const now = new Date().toISOString();

      await client.query(
        `UPDATE user_state_metadata SET version = $1, last_synced_at = $2 WHERE user_id = $3`,
        [newVersion, now, userId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const updatedState = await this.getUserState(userId);
    return {
      conflict: false,
      serverVersion: updatedState.version,
      state: updatedState,
    };
  }

  private async internalRecordXp(
    client: PoolClient,
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general'
  ): Promise<{ profile: UserProfile; transaction: XpTransaction; version: number }> {
    const profile = await this.getProfile(userId, client);
    if (!profile) throw new Error('User profile not found');

    const safeAmount = Math.max(1, Math.min(2500, Math.floor(amount)));
    const safeReason = (reason || 'Activity completed').slice(0, 100);
    const validCategories: XpCategory[] = [
      'general', 'task', 'habit', 'quest', 'milestone',
      'course', 'language', 'trading', 'streak_bonus', 'level_up', 'badge',
    ];
    const safeCategory = validCategories.includes(category) ? category : 'general';

    let newCurrentXp = profile.currentXp + safeAmount;
    let currentLevel = profile.level;
    let nextLevelXp = getXpRequiredForLevel(currentLevel);

    while (newCurrentXp >= nextLevelXp && currentLevel < 100) {
      newCurrentXp -= nextLevelXp;
      currentLevel += 1;
      nextLevelXp = getXpRequiredForLevel(currentLevel);
    }

    const rankInfo = LEVEL_RANKS.slice().reverse().find((r) => currentLevel >= r.level) || LEVEL_RANKS[0];

    profile.currentXp = newCurrentXp;
    profile.level = currentLevel;
    profile.nextLevelXp = nextLevelXp;
    profile.title = rankInfo.title;

    const txId = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    await client.query(
      `UPDATE user_profiles
       SET current_xp = $1, level = $2, next_level_xp = $3, title = $4
       WHERE user_id = $5`,
      [profile.currentXp, profile.level, profile.nextLevelXp, profile.title, userId]
    );

    await client.query(
      `INSERT INTO xp_ledger (id, user_id, amount, reason, category, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [txId, userId, safeAmount, safeReason, safeCategory, now]
    );

    const metaRes = await client.query(
      'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
      [now, userId]
    );

    const version = Number(metaRes.rows[0].version);

    const transaction: XpTransaction = {
      id: txId,
      amount: safeAmount,
      reason: safeReason,
      category: safeCategory,
      timestamp: now,
    };

    return { profile, transaction, version };
  }

  public async completeTask(
    userId: string,
    taskId: string,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<TaskCompletionResult> {
    this.ensureInitialized();

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const cached = await this.getCachedEvent(userId, clientEventId);
      if (cached) {
        await client.query('ROLLBACK');
        return cached;
      }

      const taskRes = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [taskId, userId]
      );
      if (taskRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const meta = await this.getUserState(userId);
        return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
      }
      const taskRow = taskRes.rows[0];

      if (taskRow.completed) {
        const state = await this.getUserState(userId);
        const task = state.tasks.find((t) => t.id === taskId);
        const alreadyCompletedRes: TaskCompletionResult = {
          success: true,
          task,
          profile: state.profile,
          version: state.version,
          alreadyCompleted: true,
        };
        if (clientEventId) {
          await this.cacheEvent(client, userId, clientEventId, alreadyCompletedRes);
        }
        await client.query('COMMIT');
        return alreadyCompletedRes;
      }

      let awardedXp = 50;
      if (taskRow.priority === 'high') awardedXp = 150;
      else if (taskRow.priority === 'medium') awardedXp = 100;
      if (typeof taskRow.xp === 'number' && taskRow.xp > 0 && taskRow.xp <= 300) {
        awardedXp = Math.floor(taskRow.xp);
      }

      const completedAt = new Date().toISOString();
      await client.query(
        'UPDATE tasks SET completed = TRUE, status = $1, completed_at = $2 WHERE id = $3 AND user_id = $4',
        ['completed', completedAt, taskId, userId]
      );

      const xpResult = await this.internalRecordXp(
        client,
        userId,
        awardedXp,
        `Completed Task: ${taskRow.title}`,
        'task'
      );

      await client.query(
        'UPDATE user_profiles SET tasks_completed = tasks_completed + 1 WHERE user_id = $1',
        [userId]
      );

      const updatedTask: TaskItem = {
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description || '',
        dueDate: taskRow.due_date || '',
        time: taskRow.time || '',
        endTime: taskRow.end_time || undefined,
        priority: taskRow.priority as any,
        status: 'completed',
        category: taskRow.category,
        tags: typeof taskRow.tags_json === 'string' ? JSON.parse(taskRow.tags_json) : (taskRow.tags_json || []),
        xp: awardedXp,
        completed: true,
        completedAt,
        createdAt: taskRow.created_at ? new Date(taskRow.created_at).toISOString() : new Date().toISOString(),
      };

      const result: TaskCompletionResult = {
        success: true,
        task: updatedTask,
        profile: xpResult.profile,
        xpTransaction: xpResult.transaction,
        version: xpResult.version,
        alreadyCompleted: false,
      };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async createTask(
    userId: string,
    taskInput: Omit<TaskItem, 'id'>,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; task: TaskItem; version: number }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const clean = this.sanitizeKeys(taskInput);
    const taskId = clean.id && typeof clean.id === 'string' ? clean.id : `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const client = await this.pool.connect();
    try {
      // Validate goal ownership if goalId is provided
      let validatedGoalId: string | null = null;
      let validatedMilestoneId: string | null = null;
      if (clean.goalId && typeof clean.goalId === 'string') {
        const gRes = await client.query('SELECT id, milestones_json FROM goals WHERE id = $1 AND user_id = $2', [clean.goalId, userId]);
        if (gRes.rows.length > 0) {
          validatedGoalId = gRes.rows[0].id;
          if (clean.milestoneId && typeof clean.milestoneId === 'string') {
            try {
              const milestones = typeof gRes.rows[0].milestones_json === 'string' ? JSON.parse(gRes.rows[0].milestones_json) : (gRes.rows[0].milestones_json || []);
              if (Array.isArray(milestones) && milestones.some((m: any) => m.id === clean.milestoneId)) {
                validatedMilestoneId = clean.milestoneId;
              }
            } catch {}
          }
        }
      }

      const newTask: TaskItem = {
        id: taskId,
        title: String(clean.title || 'New Task').slice(0, 150),
        description: String(clean.description || '').slice(0, 500),
        dueDate: String(clean.dueDate || now.split('T')[0]).slice(0, 20),
        time: String(clean.time || '09:00 AM').slice(0, 20),
        endTime: String(clean.endTime || '').slice(0, 20),
        priority: clean.priority === 'high' || clean.priority === 'low' ? clean.priority : 'medium',
        status: 'todo',
        category: String(clean.category || 'Engineering').slice(0, 50),
        tags: Array.isArray(clean.tags) ? clean.tags.map((t: any) => String(t).slice(0, 30)) : [],
        goalId: validatedGoalId || undefined,
        milestoneId: validatedMilestoneId || undefined,
        xp: typeof clean.xp === 'number' ? Math.max(10, Math.min(300, clean.xp)) : 50,
        completed: false,
        createdAt: now,
      };

      await client.query('BEGIN');
      await client.query(
        `INSERT INTO tasks (
          id, user_id, title, description, due_date, time, end_time,
          priority, status, category, tags_json, goal_id, milestone_id, xp, completed, completed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          newTask.id,
          userId,
          newTask.title,
          newTask.description,
          newTask.dueDate,
          newTask.time,
          newTask.endTime || null,
          newTask.priority,
          newTask.status,
          newTask.category,
          JSON.stringify(newTask.tags),
          newTask.goalId || null,
          newTask.milestoneId || null,
          newTask.xp,
          false,
          null,
          newTask.createdAt,
        ]
      );

      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const newVersion = Number(metaRes.rows[0].version);
      const result = { success: true, task: newTask, version: newVersion };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<TaskItem>,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; task?: TaskItem; version: number; error?: string }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const taskRes = await this.pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    if (taskRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
    }

    const clean = this.sanitizeKeys(updates);
    const now = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (typeof clean.title === 'string') {
        await client.query('UPDATE tasks SET title = $1 WHERE id = $2 AND user_id = $3', [clean.title.slice(0, 150), taskId, userId]);
      }
      if (typeof clean.description === 'string') {
        await client.query('UPDATE tasks SET description = $1 WHERE id = $2 AND user_id = $3', [clean.description.slice(0, 500), taskId, userId]);
      }
      if (typeof clean.dueDate === 'string') {
        await client.query('UPDATE tasks SET due_date = $1 WHERE id = $2 AND user_id = $3', [clean.dueDate.slice(0, 20), taskId, userId]);
      }
      if (typeof clean.time === 'string') {
        await client.query('UPDATE tasks SET time = $1 WHERE id = $2 AND user_id = $3', [clean.time.slice(0, 20), taskId, userId]);
      }
      if (typeof clean.priority === 'string') {
        await client.query('UPDATE tasks SET priority = $1 WHERE id = $2 AND user_id = $3', [clean.priority, taskId, userId]);
      }
      if (typeof clean.category === 'string') {
        await client.query('UPDATE tasks SET category = $1 WHERE id = $2 AND user_id = $3', [clean.category, taskId, userId]);
      }
      if (clean.goalId !== undefined) {
        let validGId: string | null = null;
        let validMId: string | null = null;
        if (clean.goalId && typeof clean.goalId === 'string') {
          const gRes = await client.query('SELECT id, milestones_json FROM goals WHERE id = $1 AND user_id = $2', [clean.goalId, userId]);
          if (gRes.rows.length > 0) {
            validGId = gRes.rows[0].id;
            if (clean.milestoneId && typeof clean.milestoneId === 'string') {
              try {
                const milestones = typeof gRes.rows[0].milestones_json === 'string' ? JSON.parse(gRes.rows[0].milestones_json) : (gRes.rows[0].milestones_json || []);
                if (Array.isArray(milestones) && milestones.some((m: any) => m.id === clean.milestoneId)) {
                  validMId = clean.milestoneId;
                }
              } catch {}
            }
          }
        }
        await client.query('UPDATE tasks SET goal_id = $1, milestone_id = $2 WHERE id = $3 AND user_id = $4', [validGId, validMId, taskId, userId]);
      }

      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const updatedTaskRes = await client.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
      const updatedRow = updatedTaskRes.rows[0];
      const updatedTask: TaskItem = {
        id: updatedRow.id,
        title: updatedRow.title,
        description: updatedRow.description || '',
        dueDate: updatedRow.due_date || '',
        time: updatedRow.time || '',
        endTime: updatedRow.end_time || undefined,
        priority: updatedRow.priority as any,
        status: updatedRow.status as any,
        category: updatedRow.category,
        tags: typeof updatedRow.tags_json === 'string' ? JSON.parse(updatedRow.tags_json) : (updatedRow.tags_json || []),
        xp: Number(updatedRow.xp),
        completed: Boolean(updatedRow.completed),
        completedAt: updatedRow.completed_at ? new Date(updatedRow.completed_at).toISOString() : undefined,
        createdAt: updatedRow.created_at ? new Date(updatedRow.created_at).toISOString() : new Date().toISOString(),
      };

      const result = { success: true, task: updatedTask, version: Number(metaRes.rows[0].version) };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async deleteTask(
    userId: string,
    taskId: string,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; version: number; error?: string }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const taskRes = await this.pool.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    if (taskRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
    }

    const now = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const result = { success: true, version: Number(metaRes.rows[0].version) };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async completeHabit(
    userId: string,
    habitId: string,
    dateStr?: string,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<HabitCompletionResult> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitRes = await this.pool.query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (habitRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }
    const habitRow = habitRes.rows[0];

    let history: string[] = [];
    try {
      history = typeof habitRow.history_json === 'string' ? JSON.parse(habitRow.history_json) : (habitRow.history_json || []);
    } catch {}

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    if (history.includes(targetDate)) {
      const state = await this.getUserState(userId);
      const habit = state.habits.find((h) => h.id === habitId);
      const alreadyRes: HabitCompletionResult = {
        success: true,
        habit,
        profile: state.profile,
        version: state.version,
        alreadyCompleted: true,
      };
      if (clientEventId) {
        await this.cacheEvent(this.pool, userId, clientEventId, alreadyRes);
      }
      return alreadyRes;
    }

    history.push(targetDate);
    const newStreak = Number(habitRow.current_streak) + 1;
    const bestStreak = Math.max(Number(habitRow.best_streak), newStreak);

    let habitXp = 35;
    if (habitRow.difficulty === 'hard') habitXp = 60;
    else if (habitRow.difficulty === 'easy') habitXp = 25;
    if (typeof habitRow.xp === 'number' && habitRow.xp > 0 && habitRow.xp <= 200) {
      habitXp = Math.floor(habitRow.xp);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE habits
         SET history_json = $1, completed_today = TRUE, current_streak = $2, best_streak = $3
         WHERE id = $4 AND user_id = $5`,
        [JSON.stringify(history), newStreak, bestStreak, habitId, userId]
      );

      const xpResult = await this.internalRecordXp(
        client,
        userId,
        habitXp,
        `Completed Habit: ${habitRow.name}`,
        'habit'
      );

      const updatedHabit: HabitItem = {
        id: habitRow.id,
        name: habitRow.name,
        description: habitRow.description || '',
        frequency: habitRow.frequency as any,
        target: habitRow.target || '',
        category: habitRow.category as any,
        difficulty: habitRow.difficulty as any,
        xp: habitXp,
        currentStreak: newStreak,
        bestStreak,
        history,
        completedToday: true,
        createdAt: habitRow.created_at ? new Date(habitRow.created_at).toISOString() : new Date().toISOString(),
      };

      const result: HabitCompletionResult = {
        success: true,
        habit: updatedHabit,
        profile: xpResult.profile,
        xpTransaction: xpResult.transaction,
        version: xpResult.version,
        alreadyCompleted: false,
      };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async createHabit(
    userId: string,
    habitInput: Omit<HabitItem, 'id'>,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; habit: HabitItem; version: number }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const clean = this.sanitizeKeys(habitInput);
    const habitId = clean.id && typeof clean.id === 'string' ? clean.id : `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const newHabit: HabitItem = {
      id: habitId,
      name: String(clean.name || 'New Habit').slice(0, 100),
      description: String(clean.description || '').slice(0, 300),
      frequency: clean.frequency || 'daily',
      target: String(clean.target || '').slice(0, 50),
      category: clean.category || 'Skill',
      difficulty: clean.difficulty || 'medium',
      xp: typeof clean.xp === 'number' ? Math.max(10, Math.min(200, clean.xp)) : 30,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      completedToday: false,
      createdAt: now,
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO habits (
          id, user_id, name, description, frequency, target, category,
          difficulty, xp, current_streak, best_streak, history_json, completed_today, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newHabit.id,
          userId,
          newHabit.name,
          newHabit.description,
          newHabit.frequency,
          newHabit.target,
          newHabit.category,
          newHabit.difficulty,
          newHabit.xp,
          0,
          0,
          '[]',
          false,
          newHabit.createdAt,
        ]
      );

      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const result = { success: true, habit: newHabit, version: Number(metaRes.rows[0].version) };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<HabitItem>,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; habit?: HabitItem; version: number; error?: string }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitRes = await this.pool.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (habitRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }

    const clean = this.sanitizeKeys(updates);
    const now = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (typeof clean.name === 'string') {
        await client.query('UPDATE habits SET name = $1 WHERE id = $2 AND user_id = $3', [clean.name.slice(0, 100), habitId, userId]);
      }
      if (typeof clean.description === 'string') {
        await client.query('UPDATE habits SET description = $1 WHERE id = $2 AND user_id = $3', [clean.description.slice(0, 300), habitId, userId]);
      }
      if (typeof clean.target === 'string') {
        await client.query('UPDATE habits SET target = $1 WHERE id = $2 AND user_id = $3', [clean.target.slice(0, 50), habitId, userId]);
      }
      if (typeof clean.category === 'string') {
        await client.query('UPDATE habits SET category = $1 WHERE id = $2 AND user_id = $3', [clean.category, habitId, userId]);
      }
      if (typeof clean.difficulty === 'string') {
        await client.query('UPDATE habits SET difficulty = $1 WHERE id = $2 AND user_id = $3', [clean.difficulty, habitId, userId]);
      }

      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const updatedHabitRes = await client.query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
      const updatedRow = updatedHabitRes.rows[0];
      const updatedHabit: HabitItem = {
        id: updatedRow.id,
        name: updatedRow.name,
        description: updatedRow.description || '',
        frequency: updatedRow.frequency as any,
        target: updatedRow.target || '',
        category: updatedRow.category as any,
        difficulty: updatedRow.difficulty as any,
        xp: Number(updatedRow.xp),
        currentStreak: Number(updatedRow.current_streak),
        bestStreak: Number(updatedRow.best_streak),
        history: typeof updatedRow.history_json === 'string' ? JSON.parse(updatedRow.history_json) : (updatedRow.history_json || []),
        completedToday: Boolean(updatedRow.completed_today),
        createdAt: updatedRow.created_at ? new Date(updatedRow.created_at).toISOString() : new Date().toISOString(),
      };

      const result = { success: true, habit: updatedHabit, version: Number(metaRes.rows[0].version) };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async deleteHabit(
    userId: string,
    habitId: string,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<{ success: boolean; version: number; error?: string }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitRes = await this.pool.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
    if (habitRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }

    const now = new Date().toISOString();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
      const metaRes = await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
        [now, userId]
      );

      const result = { success: true, version: Number(metaRes.rows[0].version) };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateGoalProgress(
    userId: string,
    goalId: string,
    progress: number,
    milestoneId?: string,
    clientEventId?: string,
    baseVersion?: number
  ): Promise<GoalProgressResult> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const goalRes = await this.pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (goalRes.rows.length === 0) {
      const meta = await this.getUserState(userId);
      return { success: false, version: meta.version, error: 'GOAL_NOT_FOUND' };
    }
    const goalRow = goalRes.rows[0];

    let milestones: any[] = [];
    try {
      milestones = typeof goalRow.milestones_json === 'string' ? JSON.parse(goalRow.milestones_json) : (goalRow.milestones_json || []);
    } catch {}

    const safeProgress = Math.max(0, Math.min(100, Math.floor(progress)));
    const wasCompletedBefore = Number(goalRow.progress) >= 100;

    let totalXpAwarded = 0;
    let rewardReason = '';

    if (milestoneId) {
      const milestone = milestones.find((m) => m.id === milestoneId);
      if (milestone && !milestone.completed) {
        milestone.completed = true;
        totalXpAwarded += milestone.xpReward ?? milestone.xp ?? 150;
        rewardReason = `Completed Goal Milestone: ${milestone.title}`;
      }
    }

    if (safeProgress >= 100 && !wasCompletedBefore) {
      totalXpAwarded += Number(goalRow.xp_reward) || 500;
      rewardReason = rewardReason
        ? `${rewardReason} & Achieved Goal: ${goalRow.title}`
        : `Achieved Goal: ${goalRow.title}`;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE goals SET progress = $1, milestones_json = $2 WHERE id = $3 AND user_id = $4',
        [safeProgress, JSON.stringify(milestones), goalId, userId]
      );

      let profile = (await this.getProfile(userId, client))!;
      let transaction: XpTransaction | undefined;
      let currentVersion = 1;

      if (totalXpAwarded > 0) {
        const xpRes = await this.internalRecordXp(client, userId, totalXpAwarded, rewardReason, 'milestone');
        profile = xpRes.profile;
        transaction = xpRes.transaction;
        currentVersion = xpRes.version;
      } else {
        const now = new Date().toISOString();
        const metaRes = await client.query(
          'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2 RETURNING version',
          [now, userId]
        );
        currentVersion = Number(metaRes.rows[0].version);
      }

      const updatedGoal: GoalItem = {
        id: goalRow.id,
        title: goalRow.title,
        description: goalRow.description || '',
        category: goalRow.category,
        progress: safeProgress,
        xpReward: Number(goalRow.xp_reward),
        milestones,
        createdAt: goalRow.created_at ? new Date(goalRow.created_at).toISOString() : new Date().toISOString(),
      };

      const result: GoalProgressResult = {
        success: true,
        goal: updatedGoal,
        profile,
        xpTransaction: transaction,
        version: currentVersion,
      };

      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general',
    clientEventId?: string
  ): Promise<{ profile: UserProfile; transaction: XpTransaction; version: number }> {
    this.ensureInitialized();
    const cached = await this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await this.internalRecordXp(client, userId, amount, reason, category);
      if (clientEventId) {
        await this.cacheEvent(client, userId, clientEventId, result);
      }
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async addAiMessage(userId: string, message: AIChatMessage): Promise<void> {
    this.ensureInitialized();
    const msgId = message.id || `msg-${Date.now()}`;
    const now = message.timestamp || new Date().toISOString();

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO ai_history (id, user_id, role, content, timestamp, model_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [msgId, userId, message.role, message.content, now, message.modelUsed || null]
      );

      await client.query(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = $1 WHERE user_id = $2',
        [new Date().toISOString(), userId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async updateUserPassword(userId: string, passwordHash: string, salt: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      await this.pool.query('UPDATE users SET password_hash = $1, salt = $2, token_version = token_version + 1 WHERE id = $3', [passwordHash, salt, userId]);
      return true;
    } catch {
      return false;
    }
  }

  // Durable Telemetry & Feedback
  public async recordTelemetryEvent(event: {
    id: string;
    userId?: string;
    type: string;
    route?: string;
    category?: string;
    status?: string;
    statusCode?: number;
    durationMs?: number;
    metadata?: any;
    timestamp: string;
  }): Promise<void> {
    this.ensureInitialized();
    try {
      await this.pool.query(
        `INSERT INTO telemetry_events (id, user_id, event_type, route, category, status, duration_ms, metadata_json, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           event_type = EXCLUDED.event_type,
           status = EXCLUDED.status,
           duration_ms = EXCLUDED.duration_ms,
           metadata_json = EXCLUDED.metadata_json`,
        [
          event.id,
          event.userId || null,
          event.type,
          event.route || null,
          event.category || null,
          event.status || null,
          typeof event.durationMs === 'number' ? event.durationMs : null,
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.timestamp,
        ]
      );
    } catch (err) {
      console.warn('Failed to record durable telemetry event (Postgres):', err);
    }
  }

  public async recordUserFeedback(feedback: {
    id: string;
    userId: string;
    rating: number;
    type: string;
    category?: string;
    comment?: string;
    sentiment?: string;
    timestamp: string;
  }): Promise<void> {
    this.ensureInitialized();
    try {
      await this.pool.query(
        `INSERT INTO user_feedback (id, user_id, rating, type, category, comment, sentiment, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          feedback.id,
          feedback.userId,
          feedback.rating,
          feedback.type,
          feedback.category || 'General',
          feedback.comment || '',
          feedback.sentiment || 'neutral',
          feedback.timestamp,
        ]
      );
    } catch (err) {
      console.warn('Failed to record user feedback (Postgres):', err);
    }
  }

  public async getDurableFeedback(limit = 100): Promise<any[]> {
    this.ensureInitialized();
    try {
      const res = await this.pool.query(
        'SELECT * FROM user_feedback ORDER BY timestamp DESC LIMIT $1',
        [Math.min(500, Math.max(1, limit))]
      );
      return res.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        rating: Number(row.rating),
        type: row.type,
        category: row.category,
        comment: row.comment,
        sentiment: row.sentiment,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  // Paper Trading State
  public async createPaperOrder(
    userId: string,
    order: Omit<PaperOrderRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<PaperOrderRecord> {
    this.ensureInitialized();
    const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const record: PaperOrderRecord = {
      id,
      userId,
      symbol: order.symbol.toUpperCase(),
      side: order.side,
      type: order.type,
      quantity: Math.max(0.0001, Number(order.quantity)),
      price: order.price ? Number(order.price) : undefined,
      status: order.status || 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO paper_orders (id, user_id, symbol, side, type, quantity, price, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          record.id,
          record.userId,
          record.symbol,
          record.side,
          record.type,
          record.quantity,
          record.price ?? null,
          record.status,
          record.createdAt,
          record.updatedAt,
        ]
      );

      if (order.type === 'MARKET' || order.status === 'FILLED') {
        const posId = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const entryPrice = record.price || 100;
        await client.query(
          `INSERT INTO paper_positions (id, user_id, symbol, side, quantity, entry_price, current_price, unrealized_pnl, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            posId,
            userId,
            record.symbol,
            record.side === 'BUY' ? 'LONG' : 'SHORT',
            record.quantity,
            entryPrice,
            entryPrice,
            0,
            'OPEN',
            now,
          ]
        );
      }
      await client.query('COMMIT');
      return record;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async cancelPaperOrder(userId: string, orderId: string): Promise<{ success: boolean; error?: string; order?: PaperOrderRecord }> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT * FROM paper_orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    if (res.rows.length === 0) {
      return { success: false, error: 'ORDER_NOT_FOUND' };
    }
    const row = res.rows[0];

    if (row.status !== 'PENDING') {
      return { success: false, error: 'ORDER_NOT_CANCELLABLE' };
    }

    const now = new Date().toISOString();
    await this.pool.query('UPDATE paper_orders SET status = $1, updated_at = $2 WHERE id = $3 AND user_id = $4', [
      'CANCELLED',
      now,
      orderId,
      userId,
    ]);

    return {
      success: true,
      order: {
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        side: row.side,
        type: row.type,
        quantity: Number(row.quantity),
        price: row.price ? Number(row.price) : undefined,
        status: 'CANCELLED',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : now,
        updatedAt: now,
      },
    };
  }

  public async closePaperPosition(
    userId: string,
    positionId: string,
    exitPrice?: number
  ): Promise<{ success: boolean; pnl?: number; error?: string; position?: PaperPositionRecord }> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT * FROM paper_positions WHERE id = $1 AND user_id = $2', [positionId, userId]);
    if (res.rows.length === 0) {
      return { success: false, error: 'POSITION_NOT_FOUND' };
    }
    const row = res.rows[0];

    if (row.status === 'CLOSED') {
      return { success: false, error: 'POSITION_ALREADY_CLOSED' };
    }

    const entryPrice = Number(row.entry_price);
    const quantity = Number(row.quantity);
    const actualExitPrice = exitPrice ? Number(exitPrice) : entryPrice;
    const isLong = row.side === 'LONG';
    const pnl = isLong ? (actualExitPrice - entryPrice) * quantity : (entryPrice - actualExitPrice) * quantity;
    const now = new Date().toISOString();

    await this.pool.query(
      'UPDATE paper_positions SET status = $1, current_price = $2, unrealized_pnl = $3, closed_at = $4 WHERE id = $5 AND user_id = $6',
      ['CLOSED', actualExitPrice, pnl, now, positionId, userId]
    );

    return {
      success: true,
      pnl,
      position: {
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        side: row.side,
        quantity,
        entryPrice,
        currentPrice: actualExitPrice,
        unrealizedPnl: pnl,
        status: 'CLOSED',
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : now,
        closedAt: now,
      },
    };
  }

  public async getPaperOrders(userId: string): Promise<PaperOrderRecord[]> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT * FROM paper_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
    return res.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      quantity: Number(row.quantity),
      price: row.price ? Number(row.price) : undefined,
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
  }

  public async getPaperPositions(userId: string): Promise<PaperPositionRecord[]> {
    this.ensureInitialized();
    const res = await this.pool.query('SELECT * FROM paper_positions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
    return res.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      quantity: Number(row.quantity),
      entryPrice: Number(row.entry_price),
      currentPrice: Number(row.current_price),
      unrealizedPnl: Number(row.unrealized_pnl),
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : undefined,
    }));
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public async getStats(): Promise<{ userCount: number; adapter: string }> {
    this.ensureInitialized();
    try {
      const res = await this.pool.query('SELECT COUNT(*) as count FROM users');
      return {
        userCount: Number(res.rows[0].count) || 0,
        adapter: 'postgres',
      };
    } catch {
      return { userCount: 0, adapter: 'postgres' };
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch (err) {
        console.warn('Error during PostgreSQL connection pool close:', err);
      } finally {
        this.isInitialized = false;
      }
    }
  }
}
