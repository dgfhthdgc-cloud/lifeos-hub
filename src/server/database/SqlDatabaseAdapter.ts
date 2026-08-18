import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
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
  TradingSession,
  TradingEmotion,
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

export class SqlDatabaseAdapter implements DatabaseAdapter {
  private dbPath: string;
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;

  constructor(customPath?: string) {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = customPath || path.join(dataDir, 'lifeos.sqlite');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(fileBuffer);
      } catch {
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }

    this.createSchema();
    this.saveToDisk();
    this.isInitialized = true;
  }

  public ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('SqlDatabaseAdapter must be initialized before use. Call await adapter.initialize()');
    }
  }

  private createSchema(): void {
    if (!this.db) return;

    this.db.run(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        current_xp INTEGER NOT NULL DEFAULT 0,
        next_level_xp INTEGER NOT NULL DEFAULT 1000,
        avatar_url TEXT,
        streak_count INTEGER DEFAULT 0,
        focus_hours REAL DEFAULT 0,
        win_rate REAL DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        settings_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_state_metadata (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        last_synced_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        time TEXT,
        end_time TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'todo',
        category TEXT NOT NULL DEFAULT 'Engineering',
        tags_json TEXT NOT NULL DEFAULT '[]',
        xp INTEGER NOT NULL DEFAULT 50,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL DEFAULT 'daily',
        target TEXT,
        category TEXT NOT NULL DEFAULT 'Skill',
        difficulty TEXT NOT NULL DEFAULT 'medium',
        xp INTEGER NOT NULL DEFAULT 35,
        current_streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        history_json TEXT NOT NULL DEFAULT '[]',
        completed_today INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'Career & Skills',
        progress INTEGER NOT NULL DEFAULT 0,
        xp_reward INTEGER NOT NULL DEFAULT 500,
        milestones_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        timestamp TEXT NOT NULL,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_price REAL NOT NULL DEFAULT 0,
        exit_price REAL NOT NULL DEFAULT 0,
        size REAL NOT NULL DEFAULT 1,
        pnl REAL NOT NULL DEFAULT 0,
        pnl_percent REAL NOT NULL DEFAULT 0,
        r_multiple REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'breakeven',
        notes TEXT,
        setup_strategy TEXT,
        session TEXT,
        emotion TEXT,
        mistakes_json TEXT NOT NULL DEFAULT '[]',
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS xp_ledger (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        timestamp TEXT NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS processed_events (
        client_event_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        result_json TEXT NOT NULL,
        processed_at TEXT NOT NULL,
        PRIMARY KEY (client_event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS automations (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        action_type TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        config_json TEXT NOT NULL DEFAULT '{}',
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS automation_logs (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        automation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS boss_raids (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        current_hp INTEGER NOT NULL,
        max_hp INTEGER NOT NULL,
        status TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        loot_json TEXT NOT NULL DEFAULT '[]',
        end_time TEXT,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS perks (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        cost INTEGER NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        branch TEXT NOT NULL,
        tier INTEGER NOT NULL,
        PRIMARY KEY (id, user_id)
      );

      CREATE TABLE IF NOT EXISTS ai_history (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        model_used TEXT,
        PRIMARY KEY (id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_id ON xp_ledger(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_processed_events_lookup ON processed_events(user_id, client_event_id);
      CREATE INDEX IF NOT EXISTS idx_user_state_metadata_version ON user_state_metadata(user_id, version);
    `);
  }

  public saveToDisk(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    const tempPath = `${this.dbPath}.tmp`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, this.dbPath);
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

  private getCachedEvent(userId: string, clientEventId?: string): any | null {
    if (!clientEventId || !this.db) return null;
    const stmt = this.db.prepare(
      'SELECT result_json FROM processed_events WHERE user_id = :uid AND client_event_id = :ceid'
    );
    stmt.bind({ ':uid': userId, ':ceid': clientEventId });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      try {
        return JSON.parse(row.result_json as string);
      } catch {
        return null;
      }
    }
    stmt.free();
    return null;
  }

  private cacheEvent(userId: string, clientEventId: string, result: any): void {
    if (!this.db) return;
    this.db.run(
      `INSERT OR REPLACE INTO processed_events (client_event_id, user_id, result_json, processed_at)
       VALUES (?, ?, ?, ?)`,
      [clientEventId, userId, JSON.stringify(result), new Date().toISOString()]
    );
  }

  public getUserById(id: string): AuthUserRecord | null {
    this.ensureInitialized();
    const userStmt = this.db!.prepare('SELECT * FROM users WHERE id = :id');
    userStmt.bind({ ':id': id });
    if (!userStmt.step()) {
      userStmt.free();
      return null;
    }
    const userRow = userStmt.getAsObject();
    userStmt.free();

    const profile = this.getProfile(id);
    if (!profile) return null;

    return {
      id: userRow.id as string,
      email: userRow.email as string,
      passwordHash: userRow.password_hash as string,
      salt: userRow.salt as string,
      createdAt: userRow.created_at as string,
      profile,
    };
  }

  public getUserByEmail(email: string): AuthUserRecord | null {
    this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    const userStmt = this.db!.prepare('SELECT * FROM users WHERE email = :email');
    userStmt.bind({ ':email': normalized });
    if (!userStmt.step()) {
      userStmt.free();
      return null;
    }
    const userRow = userStmt.getAsObject();
    userStmt.free();

    const id = userRow.id as string;
    const profile = this.getProfile(id);
    if (!profile) return null;

    return {
      id,
      email: userRow.email as string,
      passwordHash: userRow.password_hash as string,
      salt: userRow.salt as string,
      createdAt: userRow.created_at as string,
      profile,
    };
  }

  public createUser(email: string, passwordHash: string, salt: string, name: string): AuthUserRecord {
    this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    const existing = this.getUserByEmail(normalized);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const profile: UserProfile = {
      ...INITIAL_USER,
      id,
      email: normalized,
      name: name || 'LifeOS Citizen',
      createdAt: now,
    };

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, normalized, passwordHash, salt, now]
      );

      this.db!.run(
        `INSERT INTO user_profiles (
          user_id, name, title, level, current_xp, next_level_xp, avatar_url,
          streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      this.db!.run(
        'INSERT INTO user_state_metadata (user_id, version, last_synced_at) VALUES (?, ?, ?)',
        [id, 1, now]
      );

      // Seed initial automations, boss battles, perks
      for (const auto of INITIAL_AUTOMATIONS) {
        this.db!.run(
          `INSERT INTO automations (id, user_id, name, trigger_type, action_type, enabled, config_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            auto.id,
            id,
            auto.title || 'Automation Rule',
            auto.trigger?.type || 'event',
            auto.action?.type || 'action',
            auto.enabled ? 1 : 0,
            JSON.stringify(auto.condition || {}),
          ]
        );
      }

      for (const boss of INITIAL_BOSS_BATTLES) {
        this.db!.run(
          `INSERT INTO boss_raids (id, user_id, name, description, current_hp, max_hp, status, xp_reward, loot_json, end_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        this.db!.run(
          `INSERT INTO perks (id, user_id, name, description, cost, unlocked, branch, tier)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            perk.id,
            id,
            perk.title || 'Skill Perk',
            perk.description || '',
            perk.costPoints ?? 1,
            perk.unlocked ? 1 : 0,
            perk.domain || 'general',
            perk.tier ?? 1,
          ]
        );
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }

    return {
      id,
      email: normalized,
      passwordHash,
      salt,
      createdAt: now,
      profile,
    };
  }

  private getProfile(userId: string): UserProfile | null {
    const stmt = this.db!.prepare('SELECT * FROM user_profiles WHERE user_id = :uid');
    stmt.bind({ ':uid': userId });
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    let settings = {};
    try {
      settings = JSON.parse(row.settings_json as string);
    } catch {
      settings = {};
    }

    return {
      id: userId,
      email: '',
      name: row.name as string,
      title: row.title as string,
      level: Number(row.level),
      currentXp: Number(row.current_xp),
      nextLevelXp: Number(row.next_level_xp),
      avatarUrl: (row.avatar_url as string) || undefined,
      streakDays: Number(row.streak_count),
      settings: settings as any,
      createdAt: row.created_at as string,
    };
  }

  public updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    this.ensureInitialized();
    const profile = this.getProfile(userId);
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

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        `UPDATE user_profiles
         SET name = ?, title = ?, avatar_url = ?, settings_json = ?
         WHERE user_id = ?`,
        [profile.name, profile.title, profile.avatarUrl || null, JSON.stringify(profile.settings), userId]
      );

      this.db!.run(
        `UPDATE user_state_metadata
         SET version = version + 1, last_synced_at = ?
         WHERE user_id = ?`,
        [new Date().toISOString(), userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }

    return profile;
  }

  public getUserState(userId: string): UserDatabaseState {
    this.ensureInitialized();
    let profile = this.getProfile(userId);

    // If metadata row doesn't exist, create it
    const metaStmt = this.db!.prepare('SELECT * FROM user_state_metadata WHERE user_id = :uid');
    metaStmt.bind({ ':uid': userId });
    let version = 1;
    let lastSyncedAt = new Date().toISOString();

    if (metaStmt.step()) {
      const row = metaStmt.getAsObject();
      version = Number(row.version);
      lastSyncedAt = row.last_synced_at as string;
      metaStmt.free();
    } else {
      metaStmt.free();
      if (!profile) {
        profile = { ...INITIAL_USER, id: userId, createdAt: lastSyncedAt };
        this.db!.run(
          `INSERT INTO user_profiles (
            user_id, name, title, level, current_xp, next_level_xp, avatar_url,
            streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      this.db!.run(
        'INSERT INTO user_state_metadata (user_id, version, last_synced_at) VALUES (?, ?, ?)',
        [userId, 1, lastSyncedAt]
      );
      this.saveToDisk();
    }

    if (!profile) {
      profile = { ...INITIAL_USER, id: userId, createdAt: lastSyncedAt };
    }

    // Load tasks
    const tasks: TaskItem[] = [];
    const taskStmt = this.db!.prepare('SELECT * FROM tasks WHERE user_id = :uid');
    taskStmt.bind({ ':uid': userId });
    while (taskStmt.step()) {
      const row = taskStmt.getAsObject();
      let tags: string[] = [];
      try {
        tags = JSON.parse(row.tags_json as string);
      } catch {}
      tasks.push({
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) || '',
        dueDate: (row.due_date as string) || '',
        time: (row.time as string) || '',
        endTime: (row.end_time as string) || undefined,
        priority: row.priority as 'low' | 'medium' | 'high',
        status: row.status as 'todo' | 'in_progress' | 'completed',
        category: row.category as string,
        tags,
        xp: Number(row.xp),
        completed: Boolean(row.completed),
        completedAt: (row.completed_at as string) || undefined,
        createdAt: row.created_at as string,
      });
    }
    taskStmt.free();

    // Load habits
    const habits: HabitItem[] = [];
    const habitStmt = this.db!.prepare('SELECT * FROM habits WHERE user_id = :uid');
    habitStmt.bind({ ':uid': userId });
    while (habitStmt.step()) {
      const row = habitStmt.getAsObject();
      let history: string[] = [];
      try {
        history = JSON.parse(row.history_json as string);
      } catch {}
      habits.push({
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) || '',
        frequency: row.frequency as 'daily' | 'weekly',
        target: (row.target as string) || '',
        category: row.category as any,
        difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
        xp: Number(row.xp),
        currentStreak: Number(row.current_streak),
        bestStreak: Number(row.best_streak),
        history,
        completedToday: Boolean(row.completed_today),
        createdAt: row.created_at as string,
      });
    }
    habitStmt.free();

    // Load goals
    const goals: GoalItem[] = [];
    const goalStmt = this.db!.prepare('SELECT * FROM goals WHERE user_id = :uid');
    goalStmt.bind({ ':uid': userId });
    while (goalStmt.step()) {
      const row = goalStmt.getAsObject();
      let milestones = [];
      try {
        milestones = JSON.parse(row.milestones_json as string);
      } catch {}
      goals.push({
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) || '',
        category: row.category as string,
        progress: Number(row.progress),
        xpReward: Number(row.xp_reward),
        milestones,
        createdAt: row.created_at as string,
      });
    }
    goalStmt.free();

    // Load journal
    const journal: TradeJournalEntry[] = [];
    const journalStmt = this.db!.prepare('SELECT * FROM journal_entries WHERE user_id = :uid ORDER BY timestamp DESC LIMIT 100');
    journalStmt.bind({ ':uid': userId });
    while (journalStmt.step()) {
      const row = journalStmt.getAsObject();
      let mistakes: string[] = [];
      try {
        mistakes = JSON.parse(row.mistakes_json as string);
      } catch {}
      const validSessions: TradingSession[] = ['Asia', 'London', 'New York AM', 'New York PM'];
      const session = validSessions.includes(row.session as any) ? (row.session as TradingSession) : 'New York AM';
      const validEmotions: TradingEmotion[] = ['Disciplined', 'Confident', 'FOMO', 'Revenge', 'Hesitant', 'Anxious'];
      const emotion = validEmotions.includes(row.emotion as any) ? (row.emotion as TradingEmotion) : 'Disciplined';

      journal.push({
        id: row.id as string,
        symbol: row.symbol as string,
        category: 'Forex',
        direction: row.direction as 'long' | 'short',
        entryDate: (row.timestamp as string) || new Date().toISOString(),
        exitDate: (row.timestamp as string) || new Date().toISOString(),
        entryPrice: Number(row.entry_price),
        exitPrice: Number(row.exit_price),
        stopLoss: 0,
        positionSize: Number(row.size),
        pnl: Number(row.pnl),
        pnlPercent: Number(row.pnl_percent),
        rMultiple: Number(row.r_multiple),
        riskAmount: 0,
        status: row.status as 'win' | 'loss' | 'breakeven',
        notes: (row.notes as string) || '',
        setupStrategy: (row.setup_strategy as string) || '',
        session,
        emotion,
        mistakes,
        rating: 5,
      });
    }
    journalStmt.free();

    // Load XP Ledger
    const xpLedger: XpTransaction[] = [];
    const xpStmt = this.db!.prepare('SELECT * FROM xp_ledger WHERE user_id = :uid ORDER BY timestamp DESC LIMIT 50');
    xpStmt.bind({ ':uid': userId });
    while (xpStmt.step()) {
      const row = xpStmt.getAsObject();
      xpLedger.push({
        id: row.id as string,
        amount: Number(row.amount),
        reason: row.reason as string,
        category: row.category as XpCategory,
        timestamp: row.timestamp as string,
      });
    }
    xpStmt.free();

    // Load automations
    const automations: LifeAutomationRule[] = [];
    const autoStmt = this.db!.prepare('SELECT * FROM automations WHERE user_id = :uid');
    autoStmt.bind({ ':uid': userId });
    while (autoStmt.step()) {
      const row = autoStmt.getAsObject();
      let condition = undefined;
      try {
        condition = JSON.parse(row.config_json as string);
      } catch {}
      automations.push({
        id: row.id as string,
        title: row.name as string,
        description: 'Automation rule',
        category: 'execution',
        enabled: Boolean(row.enabled),
        trigger: {
          type: (row.trigger_type as any) || 'task_completed',
          label: row.trigger_type as string,
        },
        action: {
          type: (row.action_type as any) || 'grant_xp',
          label: row.action_type as string,
          value: 0,
        },
        condition,
        runCount: 0,
        iconName: 'Zap',
      });
    }
    autoStmt.free();

    // Load automation logs
    const automationLogs: AutomationExecutionLog[] = [];
    const logStmt = this.db!.prepare('SELECT * FROM automation_logs WHERE user_id = :uid ORDER BY timestamp DESC LIMIT 50');
    logStmt.bind({ ':uid': userId });
    while (logStmt.step()) {
      const row = logStmt.getAsObject();
      automationLogs.push({
        id: row.id as string,
        ruleId: row.automation_id as string,
        ruleTitle: 'Automation Rule',
        triggerEvent: 'Event',
        actionTaken: 'Executed',
        status: (row.status as 'success' | 'failed' | 'skipped') || 'success',
        details: row.message as string,
        timestamp: row.timestamp as string,
      });
    }
    logStmt.free();

    // Load boss raids
    const bossRaids: BossBattle[] = [];
    const bossStmt = this.db!.prepare('SELECT * FROM boss_raids WHERE user_id = :uid');
    bossStmt.bind({ ':uid': userId });
    while (bossStmt.step()) {
      const row = bossStmt.getAsObject();
      let modifiers: any[] = [];
      try {
        modifiers = JSON.parse(row.loot_json as string);
      } catch {}
      bossRaids.push({
        id: row.id as string,
        name: row.name as string,
        subtitle: 'Epic Boss Raid',
        lore: (row.description as string) || '',
        avatarIcon: 'Skull',
        themeColor: 'amber',
        currentHp: Number(row.current_hp),
        maxHp: Number(row.max_hp),
        difficulty: 'Standard',
        deadlineDays: 7,
        startDate: new Date().toISOString(),
        endDate: (row.end_time as string) || new Date().toISOString(),
        defeated: row.status === 'defeated',
        rewards: {
          xp: Number(row.xp_reward),
          badgeTitle: 'Slayer',
          perkPoints: 1,
          lootDescription: 'Victory Trophy',
        },
        activeModifiers: modifiers,
        damageLog: [],
      });
    }
    bossStmt.free();

    // Load perks
    const perks: SkillPerkNode[] = [];
    const perkStmt = this.db!.prepare('SELECT * FROM perks WHERE user_id = :uid');
    perkStmt.bind({ ':uid': userId });
    while (perkStmt.step()) {
      const row = perkStmt.getAsObject();
      const rawTier = Number(row.tier);
      const tier: 1 | 2 | 3 | 4 = rawTier === 2 ? 2 : rawTier === 3 ? 3 : rawTier === 4 ? 4 : 1;
      perks.push({
        id: row.id as string,
        title: row.name as string,
        description: (row.description as string) || '',
        domain: (row.branch as any) || 'execution',
        tier,
        costPoints: Number(row.cost),
        unlocked: Boolean(row.unlocked),
        iconName: 'Award',
        passiveEffect: (row.description as string) || 'Passive boost',
        dependencies: [],
      });
    }
    perkStmt.free();

    // Load AI History
    const aiHistory: AIChatMessage[] = [];
    const aiStmt = this.db!.prepare('SELECT * FROM ai_history WHERE user_id = :uid ORDER BY timestamp ASC LIMIT 50');
    aiStmt.bind({ ':uid': userId });
    while (aiStmt.step()) {
      const row = aiStmt.getAsObject();
      aiHistory.push({
        id: row.id as string,
        role: row.role as 'user' | 'assistant' | 'system',
        content: row.content as string,
        timestamp: row.timestamp as string,
        modelUsed: (row.model_used as string) || undefined,
      });
    }
    aiStmt.free();

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

  public syncUserState(
    userId: string,
    syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState> }
  ): SyncResult {
    this.ensureInitialized();
    const currentState = this.getUserState(userId);
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

    this.db!.run('BEGIN TRANSACTION;');
    try {
      if (payload.profile && typeof payload.profile === 'object') {
        const p = payload.profile;
        const currentProfile = currentState.profile;
        const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 100) : currentProfile.name;
        const title = typeof p.title === 'string' && p.title.trim() ? p.title.trim().slice(0, 100) : currentProfile.title;
        const avatarUrl = typeof p.avatarUrl === 'string' ? p.avatarUrl : currentProfile.avatarUrl;
        const settings = p.settings && typeof p.settings === 'object' ? p.settings : currentProfile.settings;

        this.db!.run(
          `UPDATE user_profiles SET name = ?, title = ?, avatar_url = ?, settings_json = ? WHERE user_id = ?`,
          [name, title, avatarUrl || null, JSON.stringify(settings || {}), userId]
        );
      }

      if (Array.isArray(payload.tasks)) {
        this.db!.run('DELETE FROM tasks WHERE user_id = ?', [userId]);
        for (const t of payload.tasks) {
          this.db!.run(
            `INSERT INTO tasks (
              id, user_id, title, description, due_date, time, end_time,
              priority, status, category, tags_json, xp, completed, completed_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(t?.id || `task-${Date.now()}`),
              userId,
              String(t?.title || 'Untitled Task').slice(0, 150),
              String(t?.description || '').slice(0, 500),
              String(t?.dueDate || '').slice(0, 20),
              String(t?.time || '').slice(0, 20),
              String(t?.endTime || '').slice(0, 20),
              t?.priority === 'high' || t?.priority === 'low' ? t.priority : 'medium',
              t?.status === 'completed' ? 'completed' : t?.status === 'in_progress' ? 'in_progress' : 'todo',
              String(t?.category || 'Engineering').slice(0, 50),
              JSON.stringify(Array.isArray(t?.tags) ? t.tags.map((tg: any) => String(tg).slice(0, 30)) : []),
              typeof t?.xp === 'number' ? Math.max(10, Math.min(300, t.xp)) : 50,
              t?.completed ? 1 : 0,
              t?.completedAt ? String(t.completedAt).slice(0, 30) : null,
              String(t?.createdAt || new Date().toISOString()),
            ]
          );
        }
      }

      if (Array.isArray(payload.habits)) {
        this.db!.run('DELETE FROM habits WHERE user_id = ?', [userId]);
        for (const h of payload.habits) {
          this.db!.run(
            `INSERT INTO habits (
              id, user_id, name, description, frequency, target, category,
              difficulty, xp, current_streak, best_streak, history_json, completed_today, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(h?.id || `habit-${Date.now()}`),
              userId,
              String(h?.name || 'Untitled Habit').slice(0, 100),
              String(h?.description || '').slice(0, 300),
              h?.frequency || 'daily',
              String(h?.target || '').slice(0, 50),
              h?.category || 'Skill',
              h?.difficulty === 'hard' || h?.difficulty === 'easy' ? h.difficulty : 'medium',
              typeof h?.xp === 'number' ? Math.max(10, Math.min(200, h.xp)) : 30,
              typeof h?.currentStreak === 'number' ? Math.max(0, h.currentStreak) : 0,
              typeof h?.bestStreak === 'number' ? Math.max(0, h.bestStreak) : 0,
              JSON.stringify(Array.isArray(h?.history) ? h.history.map((d: any) => String(d).slice(0, 15)) : []),
              h?.completedToday ? 1 : 0,
              String(h?.createdAt || new Date().toISOString()),
            ]
          );
        }
      }

      if (Array.isArray(payload.goals)) {
        this.db!.run('DELETE FROM goals WHERE user_id = ?', [userId]);
        for (const g of payload.goals) {
          const milestones = Array.isArray(g?.milestones)
            ? g.milestones.map((m: any) => ({
                id: String(m?.id || `m-${Date.now()}`),
                goalId: String(g?.id || ''),
                title: String(m?.title || 'Milestone').slice(0, 150),
                completed: Boolean(m?.completed),
                order: typeof m?.order === 'number' ? m.order : 1,
                xpReward: typeof m?.xpReward === 'number' ? Math.max(10, Math.min(500, m.xpReward)) : 100,
              }))
            : [];

          this.db!.run(
            `INSERT INTO goals (
              id, user_id, title, description, category, progress, xp_reward, milestones_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(g?.id || `goal-${Date.now()}`),
              userId,
              String(g?.title || 'Untitled Goal').slice(0, 150),
              String(g?.description || '').slice(0, 500),
              String(g?.category || 'Career & Skills').slice(0, 50),
              typeof g?.progress === 'number' ? Math.max(0, Math.min(100, g.progress)) : 0,
              typeof g?.xpReward === 'number' ? Math.max(50, Math.min(2000, g.xpReward)) : 500,
              JSON.stringify(milestones),
              String(g?.createdAt || new Date().toISOString()),
            ]
          );
        }
      }

      if (Array.isArray(payload.journal)) {
        this.db!.run('DELETE FROM journal_entries WHERE user_id = ?', [userId]);
        for (const j of payload.journal.slice(0, 100)) {
          this.db!.run(
            `INSERT INTO journal_entries (
              id, user_id, timestamp, symbol, direction, entry_price, exit_price,
              size, pnl, pnl_percent, r_multiple, status, notes, setup_strategy, session, emotion, mistakes_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(j?.id || `tr-${Date.now()}`),
              userId,
              String(j?.timestamp || new Date().toISOString()),
              String(j?.symbol || 'N/A').slice(0, 15),
              j?.direction === 'short' ? 'short' : 'long',
              typeof j?.entryPrice === 'number' ? j.entryPrice : 0,
              typeof j?.exitPrice === 'number' ? j.exitPrice : 0,
              typeof j?.size === 'number' ? j.size : 1,
              typeof j?.pnl === 'number' ? j.pnl : 0,
              typeof j?.pnlPercent === 'number' ? j.pnlPercent : 0,
              typeof j?.rMultiple === 'number' ? j.rMultiple : 0,
              j?.status === 'win' ? 'win' : j?.status === 'loss' ? 'loss' : 'breakeven',
              String(j?.notes || '').slice(0, 500),
              String(j?.setupStrategy || '').slice(0, 50),
              String(j?.session || 'New York AM').slice(0, 30),
              String(j?.emotion || 'Disciplined').slice(0, 30),
              JSON.stringify(Array.isArray(j?.mistakes) ? j.mistakes.map((m: any) => String(m).slice(0, 50)) : []),
            ]
          );
        }
      }

      const newVersion = currentState.version + 1;
      const now = new Date().toISOString();

      this.db!.run(
        `UPDATE user_state_metadata SET version = ?, last_synced_at = ? WHERE user_id = ?`,
        [newVersion, now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();

      const updatedState = this.getUserState(userId);
      return {
        conflict: false,
        serverVersion: newVersion,
        state: updatedState,
      };
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public completeTask(
    userId: string,
    taskId: string,
    clientEventId?: string,
    baseVersion?: number
  ): TaskCompletionResult {
    this.ensureInitialized();

    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const taskStmt = this.db!.prepare('SELECT * FROM tasks WHERE id = :id AND user_id = :uid');
    taskStmt.bind({ ':id': taskId, ':uid': userId });
    if (!taskStmt.step()) {
      taskStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
    }
    const taskRow = taskStmt.getAsObject();
    taskStmt.free();

    if (taskRow.completed === 1) {
      const state = this.getUserState(userId);
      const task = state.tasks.find((t) => t.id === taskId);
      const alreadyCompletedRes: TaskCompletionResult = {
        success: true,
        task,
        profile: state.profile,
        version: state.version,
        alreadyCompleted: true,
      };
      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, alreadyCompletedRes);
        this.saveToDisk();
      }
      return alreadyCompletedRes;
    }

    let awardedXp = 50;
    if (taskRow.priority === 'high') awardedXp = 150;
    else if (taskRow.priority === 'medium') awardedXp = 100;
    if (typeof taskRow.xp === 'number' && taskRow.xp > 0 && taskRow.xp <= 300) {
      awardedXp = Math.floor(taskRow.xp as number);
    }

    this.db!.run('BEGIN TRANSACTION;');
    try {
      const completedAt = new Date().toISOString();
      this.db!.run(
        'UPDATE tasks SET completed = 1, status = "completed", completed_at = ? WHERE id = ? AND user_id = ?',
        [completedAt, taskId, userId]
      );

      const xpResult = this.internalRecordXp(
        userId,
        awardedXp,
        `Completed Task: ${taskRow.title}`,
        'task'
      );

      this.db!.run(
        'UPDATE user_profiles SET tasks_completed = tasks_completed + 1 WHERE user_id = ?',
        [userId]
      );

      const newVersion = xpResult.version;
      const updatedTask: TaskItem = {
        id: taskRow.id as string,
        title: taskRow.title as string,
        description: (taskRow.description as string) || '',
        dueDate: (taskRow.due_date as string) || '',
        time: (taskRow.time as string) || '',
        endTime: (taskRow.end_time as string) || undefined,
        priority: taskRow.priority as any,
        status: 'completed',
        category: taskRow.category as string,
        tags: [],
        xp: awardedXp,
        completed: true,
        completedAt,
        createdAt: taskRow.created_at as string,
      };

      const result: TaskCompletionResult = {
        success: true,
        task: updatedTask,
        profile: xpResult.profile,
        xpTransaction: xpResult.transaction,
        version: newVersion,
        alreadyCompleted: false,
      };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public createTask(
    userId: string,
    taskInput: Omit<TaskItem, 'id'>,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; task: TaskItem; version: number } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const clean = this.sanitizeKeys(taskInput);
    const taskId = clean.id && typeof clean.id === 'string' ? clean.id : `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

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
      xp: typeof clean.xp === 'number' ? Math.max(10, Math.min(300, clean.xp)) : 50,
      completed: false,
      createdAt: now,
    };

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        `INSERT INTO tasks (
          id, user_id, title, description, due_date, time, end_time,
          priority, status, category, tags_json, xp, completed, completed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          newTask.xp,
          0,
          null,
          newTask.createdAt,
        ]
      );

      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      const state = this.getUserState(userId);
      const result = { success: true, task: newTask, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public updateTask(
    userId: string,
    taskId: string,
    updates: Partial<TaskItem>,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; task?: TaskItem; version: number; error?: string } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const taskStmt = this.db!.prepare('SELECT * FROM tasks WHERE id = :id AND user_id = :uid');
    taskStmt.bind({ ':id': taskId, ':uid': userId });
    if (!taskStmt.step()) {
      taskStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
    }
    taskStmt.free();

    const clean = this.sanitizeKeys(updates);
    const now = new Date().toISOString();

    this.db!.run('BEGIN TRANSACTION;');
    try {
      if (typeof clean.title === 'string') {
        this.db!.run('UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?', [clean.title.slice(0, 150), taskId, userId]);
      }
      if (typeof clean.description === 'string') {
        this.db!.run('UPDATE tasks SET description = ? WHERE id = ? AND user_id = ?', [clean.description.slice(0, 500), taskId, userId]);
      }
      if (typeof clean.dueDate === 'string') {
        this.db!.run('UPDATE tasks SET due_date = ? WHERE id = ? AND user_id = ?', [clean.dueDate.slice(0, 20), taskId, userId]);
      }
      if (typeof clean.time === 'string') {
        this.db!.run('UPDATE tasks SET time = ? WHERE id = ? AND user_id = ?', [clean.time.slice(0, 20), taskId, userId]);
      }
      if (typeof clean.priority === 'string') {
        this.db!.run('UPDATE tasks SET priority = ? WHERE id = ? AND user_id = ?', [clean.priority, taskId, userId]);
      }
      if (typeof clean.category === 'string') {
        this.db!.run('UPDATE tasks SET category = ? WHERE id = ? AND user_id = ?', [clean.category, taskId, userId]);
      }

      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();

      const state = this.getUserState(userId);
      const updated = state.tasks.find((t) => t.id === taskId);
      const result = { success: true, task: updated, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
        this.saveToDisk();
      }

      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public deleteTask(
    userId: string,
    taskId: string,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; version: number; error?: string } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const taskStmt = this.db!.prepare('SELECT id FROM tasks WHERE id = :id AND user_id = :uid');
    taskStmt.bind({ ':id': taskId, ':uid': userId });
    if (!taskStmt.step()) {
      taskStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'TASK_NOT_FOUND' };
    }
    taskStmt.free();

    const now = new Date().toISOString();

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();

      const state = this.getUserState(userId);
      const result = { success: true, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
        this.saveToDisk();
      }

      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public completeHabit(
    userId: string,
    habitId: string,
    dateStr?: string,
    clientEventId?: string,
    baseVersion?: number
  ): HabitCompletionResult {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitStmt = this.db!.prepare('SELECT * FROM habits WHERE id = :id AND user_id = :uid');
    habitStmt.bind({ ':id': habitId, ':uid': userId });
    if (!habitStmt.step()) {
      habitStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }
    const habitRow = habitStmt.getAsObject();
    habitStmt.free();

    let history: string[] = [];
    try {
      history = JSON.parse(habitRow.history_json as string);
    } catch {}

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    if (history.includes(targetDate)) {
      const state = this.getUserState(userId);
      const habit = state.habits.find((h) => h.id === habitId);
      const alreadyRes: HabitCompletionResult = {
        success: true,
        habit,
        profile: state.profile,
        version: state.version,
        alreadyCompleted: true,
      };
      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, alreadyRes);
        this.saveToDisk();
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
      habitXp = Math.floor(habitRow.xp as number);
    }

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        `UPDATE habits
         SET history_json = ?, completed_today = 1, current_streak = ?, best_streak = ?
         WHERE id = ? AND user_id = ?`,
        [JSON.stringify(history), newStreak, bestStreak, habitId, userId]
      );

      const xpResult = this.internalRecordXp(
        userId,
        habitXp,
        `Completed Habit: ${habitRow.name}`,
        'habit'
      );

      const updatedHabit: HabitItem = {
        id: habitRow.id as string,
        name: habitRow.name as string,
        description: (habitRow.description as string) || '',
        frequency: habitRow.frequency as any,
        target: (habitRow.target as string) || '',
        category: habitRow.category as any,
        difficulty: habitRow.difficulty as any,
        xp: habitXp,
        currentStreak: newStreak,
        bestStreak,
        history,
        completedToday: true,
        createdAt: habitRow.created_at as string,
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
        this.cacheEvent(userId, clientEventId, result);
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public createHabit(
    userId: string,
    habitInput: Omit<HabitItem, 'id'>,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; habit: HabitItem; version: number } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
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

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        `INSERT INTO habits (
          id, user_id, name, description, frequency, target, category,
          difficulty, xp, current_streak, best_streak, history_json, completed_today, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          0,
          newHabit.createdAt,
        ]
      );

      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      const state = this.getUserState(userId);
      const result = { success: true, habit: newHabit, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<HabitItem>,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; habit?: HabitItem; version: number; error?: string } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitStmt = this.db!.prepare('SELECT id FROM habits WHERE id = :id AND user_id = :uid');
    habitStmt.bind({ ':id': habitId, ':uid': userId });
    if (!habitStmt.step()) {
      habitStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }
    habitStmt.free();

    const clean = this.sanitizeKeys(updates);
    const now = new Date().toISOString();

    this.db!.run('BEGIN TRANSACTION;');
    try {
      if (typeof clean.name === 'string') {
        this.db!.run('UPDATE habits SET name = ? WHERE id = ? AND user_id = ?', [clean.name.slice(0, 100), habitId, userId]);
      }
      if (typeof clean.description === 'string') {
        this.db!.run('UPDATE habits SET description = ? WHERE id = ? AND user_id = ?', [clean.description.slice(0, 300), habitId, userId]);
      }
      if (typeof clean.target === 'string') {
        this.db!.run('UPDATE habits SET target = ? WHERE id = ? AND user_id = ?', [clean.target.slice(0, 50), habitId, userId]);
      }
      if (typeof clean.category === 'string') {
        this.db!.run('UPDATE habits SET category = ? WHERE id = ? AND user_id = ?', [clean.category, habitId, userId]);
      }
      if (typeof clean.difficulty === 'string') {
        this.db!.run('UPDATE habits SET difficulty = ? WHERE id = ? AND user_id = ?', [clean.difficulty, habitId, userId]);
      }

      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();

      const state = this.getUserState(userId);
      const updated = state.habits.find((h) => h.id === habitId);
      const result = { success: true, habit: updated, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
        this.saveToDisk();
      }

      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public deleteHabit(
    userId: string,
    habitId: string,
    clientEventId?: string,
    baseVersion?: number
  ): { success: boolean; version: number; error?: string } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const habitStmt = this.db!.prepare('SELECT id FROM habits WHERE id = :id AND user_id = :uid');
    habitStmt.bind({ ':id': habitId, ':uid': userId });
    if (!habitStmt.step()) {
      habitStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'HABIT_NOT_FOUND' };
    }
    habitStmt.free();

    const now = new Date().toISOString();

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();

      const state = this.getUserState(userId);
      const result = { success: true, version: state.version };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
        this.saveToDisk();
      }

      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public updateGoalProgress(
    userId: string,
    goalId: string,
    progress: number,
    milestoneId?: string,
    clientEventId?: string,
    baseVersion?: number
  ): GoalProgressResult {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    const goalStmt = this.db!.prepare('SELECT * FROM goals WHERE id = :id AND user_id = :uid');
    goalStmt.bind({ ':id': goalId, ':uid': userId });
    if (!goalStmt.step()) {
      goalStmt.free();
      const meta = this.getUserState(userId);
      return { success: false, version: meta.version, error: 'GOAL_NOT_FOUND' };
    }
    const goalRow = goalStmt.getAsObject();
    goalStmt.free();

    let milestones: any[] = [];
    try {
      milestones = JSON.parse(goalRow.milestones_json as string);
    } catch {}

    const safeProgress = Math.max(0, Math.min(100, Math.floor(progress)));
    const wasCompletedBefore = Number(goalRow.progress) >= 100;

    let totalXpAwarded = 0;
    let rewardReason = '';

    if (milestoneId) {
      const milestone = milestones.find((m) => m.id === milestoneId);
      if (milestone && !milestone.completed) {
        milestone.completed = true;
        totalXpAwarded += milestone.xpReward || 150;
        rewardReason = `Completed Goal Milestone: ${milestone.title}`;
      }
    }

    if (safeProgress >= 100 && !wasCompletedBefore) {
      totalXpAwarded += Number(goalRow.xp_reward) || 500;
      rewardReason = rewardReason
        ? `${rewardReason} & Achieved Goal: ${goalRow.title}`
        : `Achieved Goal: ${goalRow.title}`;
    }

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        'UPDATE goals SET progress = ?, milestones_json = ? WHERE id = ? AND user_id = ?',
        [safeProgress, JSON.stringify(milestones), goalId, userId]
      );

      let profile = this.getProfile(userId)!;
      let transaction: XpTransaction | undefined;
      let currentVersion = 1;

      if (totalXpAwarded > 0) {
        const xpRes = this.internalRecordXp(userId, totalXpAwarded, rewardReason, 'milestone');
        profile = xpRes.profile;
        transaction = xpRes.transaction;
        currentVersion = xpRes.version;
      } else {
        const now = new Date().toISOString();
        this.db!.run(
          'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
          [now, userId]
        );
        const meta = this.getUserState(userId);
        currentVersion = meta.version;
      }

      const updatedGoal: GoalItem = {
        id: goalRow.id as string,
        title: goalRow.title as string,
        description: (goalRow.description as string) || '',
        category: goalRow.category as string,
        progress: safeProgress,
        xpReward: Number(goalRow.xp_reward),
        milestones,
        createdAt: goalRow.created_at as string,
      };

      const result: GoalProgressResult = {
        success: true,
        goal: updatedGoal,
        profile,
        xpTransaction: transaction,
        version: currentVersion,
      };

      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
      }

      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  private internalRecordXp(
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general'
  ): { profile: UserProfile; transaction: XpTransaction; version: number } {
    const profile = this.getProfile(userId);
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

    this.db!.run(
      `UPDATE user_profiles
       SET current_xp = ?, level = ?, next_level_xp = ?, title = ?
       WHERE user_id = ?`,
      [profile.currentXp, profile.level, profile.nextLevelXp, profile.title, userId]
    );

    this.db!.run(
      `INSERT INTO xp_ledger (id, user_id, amount, reason, category, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [txId, userId, safeAmount, safeReason, safeCategory, now]
    );

    this.db!.run(
      'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
      [now, userId]
    );

    const metaStmt = this.db!.prepare('SELECT version FROM user_state_metadata WHERE user_id = :uid');
    metaStmt.bind({ ':uid': userId });
    metaStmt.step();
    const vRow = metaStmt.getAsObject();
    metaStmt.free();
    const version = Number(vRow.version);

    const transaction: XpTransaction = {
      id: txId,
      amount: safeAmount,
      reason: safeReason,
      category: safeCategory,
      timestamp: now,
    };

    return { profile, transaction, version };
  }

  public recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general',
    clientEventId?: string
  ): { profile: UserProfile; transaction: XpTransaction; version: number } {
    this.ensureInitialized();
    const cached = this.getCachedEvent(userId, clientEventId);
    if (cached) return cached;

    this.db!.run('BEGIN TRANSACTION;');
    try {
      const result = this.internalRecordXp(userId, amount, reason, category);
      if (clientEventId) {
        this.cacheEvent(userId, clientEventId, result);
      }
      this.db!.run('COMMIT;');
      this.saveToDisk();
      return result;
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public addAiMessage(userId: string, message: AIChatMessage): void {
    this.ensureInitialized();
    const msgId = message.id || `msg-${Date.now()}`;
    const now = message.timestamp || new Date().toISOString();

    this.db!.run('BEGIN TRANSACTION;');
    try {
      this.db!.run(
        `INSERT INTO ai_history (id, user_id, role, content, timestamp, model_used)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [msgId, userId, message.role, message.content, now, message.modelUsed || null]
      );

      this.db!.run(
        'UPDATE user_state_metadata SET version = version + 1, last_synced_at = ? WHERE user_id = ?',
        [now, userId]
      );

      this.db!.run('COMMIT;');
      this.saveToDisk();
    } catch (err) {
      this.db!.run('ROLLBACK;');
      throw err;
    }
  }

  public updateUserPassword(userId: string, passwordHash: string, salt: string): boolean {
    this.ensureInitialized();
    try {
      this.db!.run('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?', [passwordHash, salt, userId]);
      this.saveToDisk();
      return true;
    } catch {
      return false;
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  public getStats(): { userCount: number; adapter: string; path?: string } {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT COUNT(*) as count FROM users');
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      return {
        userCount: Number(row.count) || 0,
        adapter: 'sqlite',
        path: this.dbPath,
      };
    } catch {
      return { userCount: 0, adapter: 'sqlite', path: this.dbPath };
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.saveToDisk();
        this.db.close();
      } catch (err) {
        console.warn('Error during SQLite database close:', err);
      } finally {
        this.db = null;
        this.isInitialized = false;
      }
    }
  }
}

