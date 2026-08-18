import fs from 'fs';
import path from 'path';
import { AuthUserRecord, UserDatabaseState } from '../types';
import { hashPassword } from '../auth';
import { INITIAL_USER } from '../../lib/storage';
import { INITIAL_BOSS_BATTLES, INITIAL_SKILL_PERK_NODES } from '../../lib/phase8Data';
import { INITIAL_AUTOMATIONS } from '../../lib/phase9Data';
import { getXpRequiredForLevel, LEVEL_RANKS } from '../../lib/gamification';
import {
  UserProfile,
  TaskItem,
  HabitItem,
  GoalItem,
  AIChatMessage,
  XpTransaction,
  XpCategory,
} from '../../types';
import {
  DatabaseAdapter,
  SyncResult,
  TaskCompletionResult,
  HabitCompletionResult,
  GoalProgressResult,
} from './DatabaseAdapter';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USERS_TMP_FILE = path.join(DATA_DIR, 'users.json.tmp');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserStoreMap {
  [userId: string]: AuthUserRecord;
}

interface StateStoreMap {
  [userId: string]: UserDatabaseState;
}

export class JsonDatabaseAdapter implements DatabaseAdapter {
  private users: UserStoreMap = {};
  private states: StateStoreMap = {};
  private writeMutex: Promise<void> = Promise.resolve();

  constructor() {
    this.loadFromDisk();
    this.seedDefaultUserIfNeeded();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || {};
        this.states = parsed.states || {};

        // Migrate any states missing version
        for (const userId of Object.keys(this.states)) {
          if (typeof this.states[userId].version !== 'number') {
            this.states[userId].version = 1;
          }
        }
      }
    } catch (err) {
      console.warn('Could not load database file, starting clean in-memory', err);
    }
  }

  private saveToDisk() {
    try {
      const payload = JSON.stringify({ users: this.users, states: this.states }, null, 2);
      fs.writeFileSync(USERS_TMP_FILE, payload, 'utf-8');
      fs.renameSync(USERS_TMP_FILE, USERS_FILE);
    } catch (err) {
      console.error('Failed to atomically persist database to disk', err);
    }
  }

  private sanitizeKeys(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitizeKeys(item));

    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = this.sanitizeKeys(obj[key]);
    }
    return clean;
  }

  private seedDefaultUserIfNeeded() {
    const defaultEmail = 'alex@lifeos.internal';
    const existing = Object.values(this.users).find((u) => u.email === defaultEmail);
    if (!existing) {
      const defaultId = 'usr_alex_default';
      const { hash, salt } = hashPassword('LifeOS2026!');
      this.users[defaultId] = {
        id: defaultId,
        email: defaultEmail,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
        profile: INITIAL_USER,
      };

      this.states[defaultId] = {
        version: 1,
        profile: INITIAL_USER,
        tasks: [
          {
            id: 'task-1',
            title: 'Audit System Architecture & Security Protocols',
            description: 'Review backend auth, API gateways, and trading simulation guardrails.',
            dueDate: new Date().toISOString().split('T')[0],
            time: '09:00 AM',
            endTime: '11:00 AM',
            priority: 'high',
            status: 'in_progress',
            category: 'Engineering',
            tags: ['Architecture', 'Security', 'Backend'],
            xp: 150,
            completed: false,
          },
          {
            id: 'task-2',
            title: 'Refactor Paper Trading Risk Envelope',
            description: 'Ensure stop loss and 2% equity envelope are hardcoded in simulation engine.',
            dueDate: new Date().toISOString().split('T')[0],
            time: '02:00 PM',
            endTime: '03:30 PM',
            priority: 'medium',
            status: 'todo',
            category: 'Trading',
            tags: ['Risk', 'Simulation'],
            xp: 100,
            completed: false,
          },
        ],
        habits: [
          {
            id: 'habit-1',
            name: 'Morning Deep Work Architecture Sprint',
            description: '90 minutes unbroken focus on core system modules.',
            frequency: 'daily',
            target: '90 mins / day',
            category: 'Skill',
            difficulty: 'hard',
            xp: 50,
            currentStreak: 12,
            bestStreak: 24,
            history: [new Date().toISOString().split('T')[0]],
            completedToday: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'habit-2',
            name: 'Quantitative Risk & Journal Review',
            description: 'Audit R-multiples and psychological biases before session close.',
            frequency: 'daily',
            target: '30 mins / day',
            category: 'Trading',
            difficulty: 'medium',
            xp: 35,
            currentStreak: 8,
            bestStreak: 15,
            history: [],
            completedToday: false,
            createdAt: new Date().toISOString(),
          },
        ],
        goals: [
          {
            id: 'goal-1',
            title: 'Master Institutional Systems Architecture',
            description: 'Build enterprise-grade resilient systems with high-reliability guarantees.',
            category: 'Career & Skills',
            progress: 75,
            xpReward: 1000,
            createdAt: new Date().toISOString(),
            milestones: [
              {
                id: 'm-1',
                goalId: 'goal-1',
                title: 'Complete Full Security & Concurrency Audit',
                completed: true,
                order: 1,
                xpReward: 250,
              },
              {
                id: 'm-2',
                goalId: 'goal-1',
                title: 'Implement Multi-Tab State Reconciler & Conflict Engine',
                completed: false,
                order: 2,
                xpReward: 250,
              },
            ],
          },
        ],
        journal: [],
        aiHistory: [
          {
            id: 'msg-init',
            role: 'assistant',
            content: 'LIFE OS Core Architecture online. All security parameters validated and operational.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'LIFE-OS-Strategic-Core',
          },
        ],
        xpLedger: [
          {
            id: 'xp-init',
            amount: 250,
            reason: 'System initialization and security baseline completed',
            category: 'general',
            timestamp: new Date().toISOString(),
          },
        ],
        automations: INITIAL_AUTOMATIONS,
        automationLogs: [],
        bossRaids: INITIAL_BOSS_BATTLES,
        perks: INITIAL_SKILL_PERK_NODES,
        lastSyncedAt: new Date().toISOString(),
      };

      this.saveToDisk();
    }
  }

  public getUserById(id: string): AuthUserRecord | null {
    return this.users[id] || null;
  }

  public getUserByEmail(email: string): AuthUserRecord | null {
    const normalized = email.toLowerCase().trim();
    return Object.values(this.users).find((u) => u.email.toLowerCase() === normalized) || null;
  }

  public createUser(email: string, passwordHash: string, salt: string, name: string): AuthUserRecord {
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const normalized = email.toLowerCase().trim();

    const profile: UserProfile = {
      ...INITIAL_USER,
      id,
      email: normalized,
      name: name || 'LifeOS Citizen',
      createdAt: new Date().toISOString(),
    };

    const record: AuthUserRecord = {
      id,
      email: normalized,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      profile,
    };

    this.users[id] = record;
    this.states[id] = {
      version: 1,
      profile,
      tasks: [],
      habits: [],
      goals: [],
      journal: [],
      aiHistory: [],
      xpLedger: [],
      automations: INITIAL_AUTOMATIONS,
      automationLogs: [],
      bossRaids: INITIAL_BOSS_BATTLES,
      perks: INITIAL_SKILL_PERK_NODES,
      lastSyncedAt: new Date().toISOString(),
    };

    this.saveToDisk();
    return record;
  }

  public updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.users[userId];
    if (!user) throw new Error('User not found');

    const cleanUpdates = this.sanitizeKeys(updates);

    // Whitelist only safe, mutable profile fields
    if (typeof cleanUpdates.name === 'string' && cleanUpdates.name.trim().length > 0) {
      user.profile.name = cleanUpdates.name.trim().slice(0, 80);
    }
    if (typeof cleanUpdates.title === 'string') {
      user.profile.title = cleanUpdates.title.trim().slice(0, 80);
    }
    if (typeof cleanUpdates.avatarUrl === 'string') {
      user.profile.avatarUrl = cleanUpdates.avatarUrl.trim().slice(0, 300);
    }
    if (cleanUpdates.settings && typeof cleanUpdates.settings === 'object') {
      user.profile.settings = {
        ...user.profile.settings,
        theme: cleanUpdates.settings.theme === 'light' ? 'light' : 'dark',
        notificationsEnabled: Boolean(cleanUpdates.settings.notificationsEnabled),
        aiInsightsEnabled: Boolean(cleanUpdates.settings.aiInsightsEnabled),
        compactView: Boolean(cleanUpdates.settings.compactView),
      };
    }

    if (this.states[userId]) {
      this.states[userId].profile = { ...user.profile };
      this.states[userId].version = (this.states[userId].version || 1) + 1;
      this.states[userId].lastSyncedAt = new Date().toISOString();
    }

    this.saveToDisk();
    return user.profile;
  }

  public getUserState(userId: string): UserDatabaseState {
    let state = this.states[userId];
    if (!state) {
      const user = this.users[userId];
      const profile = user ? user.profile : INITIAL_USER;
      state = {
        version: 1,
        profile,
        tasks: [],
        habits: [],
        goals: [],
        journal: [],
        aiHistory: [],
        xpLedger: [],
        automations: INITIAL_AUTOMATIONS,
        automationLogs: [],
        bossRaids: INITIAL_BOSS_BATTLES,
        perks: INITIAL_SKILL_PERK_NODES,
        lastSyncedAt: new Date().toISOString(),
      };
      this.states[userId] = state;
      this.saveToDisk();
    }
    return state;
  }

  public syncUserState(
    userId: string,
    syncPayload: { baseVersion?: number; changes?: Partial<UserDatabaseState> }
  ): SyncResult {
    const currentState = this.getUserState(userId);
    const clientBaseVersion = typeof syncPayload?.baseVersion === 'number' ? syncPayload.baseVersion : undefined;

    // Detect Concurrency / Stale Update Conflict
    if (clientBaseVersion !== undefined && clientBaseVersion < currentState.version) {
      return {
        conflict: true,
        serverVersion: currentState.version,
        clientVersion: clientBaseVersion,
        state: currentState,
      };
    }

    const payload = this.sanitizeKeys(syncPayload?.changes || syncPayload || {});

    if (Array.isArray(payload.tasks)) {
      currentState.tasks = payload.tasks.map((t: any) => ({
        id: String(t?.id || `task-${Date.now()}`),
        title: String(t?.title || 'Untitled Task').slice(0, 150),
        description: String(t?.description || '').slice(0, 500),
        dueDate: String(t?.dueDate || '').slice(0, 20),
        time: String(t?.time || '').slice(0, 20),
        endTime: String(t?.endTime || '').slice(0, 20),
        priority: t?.priority === 'high' || t?.priority === 'low' ? t.priority : 'medium',
        status: t?.status === 'completed' ? 'completed' : t?.status === 'in_progress' ? 'in_progress' : 'todo',
        category: String(t?.category || 'Engineering').slice(0, 50),
        tags: Array.isArray(t?.tags) ? t.tags.map((tg: any) => String(tg).slice(0, 30)) : [],
        xp: typeof t?.xp === 'number' ? Math.max(10, Math.min(300, t.xp)) : 50,
        completed: Boolean(t?.completed),
        completedAt: t?.completedAt ? String(t.completedAt).slice(0, 30) : undefined,
      }));
    }

    if (Array.isArray(payload.habits)) {
      currentState.habits = payload.habits.map((h: any) => ({
        id: String(h?.id || `habit-${Date.now()}`),
        name: String(h?.name || 'Untitled Habit').slice(0, 100),
        description: String(h?.description || '').slice(0, 300),
        frequency: h?.frequency || 'daily',
        target: String(h?.target || '').slice(0, 50),
        category: h?.category || 'Skill',
        difficulty: h?.difficulty === 'hard' || h?.difficulty === 'easy' ? h.difficulty : 'medium',
        xp: typeof h?.xp === 'number' ? Math.max(10, Math.min(200, h.xp)) : 30,
        currentStreak: typeof h?.currentStreak === 'number' ? Math.max(0, h.currentStreak) : 0,
        bestStreak: typeof h?.bestStreak === 'number' ? Math.max(0, h.bestStreak) : 0,
        history: Array.isArray(h?.history) ? h.history.map((d: any) => String(d).slice(0, 15)) : [],
        completedToday: Boolean(h?.completedToday),
        createdAt: String(h?.createdAt || new Date().toISOString()),
      }));
    }

    if (Array.isArray(payload.goals)) {
      currentState.goals = payload.goals.map((g: any) => ({
        id: String(g?.id || `goal-${Date.now()}`),
        title: String(g?.title || 'Untitled Goal').slice(0, 150),
        description: String(g?.description || '').slice(0, 500),
        category: String(g?.category || 'Career & Skills').slice(0, 50),
        progress: typeof g?.progress === 'number' ? Math.max(0, Math.min(100, g.progress)) : 0,
        xpReward: typeof g?.xpReward === 'number' ? Math.max(50, Math.min(2000, g.xpReward)) : 500,
        createdAt: String(g?.createdAt || new Date().toISOString()),
        milestones: Array.isArray(g?.milestones)
          ? g.milestones.map((m: any) => ({
              id: String(m?.id || `m-${Date.now()}`),
              goalId: String(g?.id || ''),
              title: String(m?.title || 'Milestone').slice(0, 150),
              completed: Boolean(m?.completed),
              order: typeof m?.order === 'number' ? m.order : 1,
              xpReward: typeof m?.xpReward === 'number' ? Math.max(10, Math.min(500, m.xpReward)) : 100,
            }))
          : [],
      }));
    }

    if (Array.isArray(payload.journal)) {
      currentState.journal = payload.journal.slice(0, 100).map((j: any) => ({
        id: String(j?.id || `tr-${Date.now()}`),
        timestamp: String(j?.timestamp || new Date().toISOString()),
        symbol: String(j?.symbol || 'N/A').slice(0, 15),
        direction: j?.direction === 'short' ? 'short' : 'long',
        entryPrice: typeof j?.entryPrice === 'number' ? j.entryPrice : 0,
        exitPrice: typeof j?.exitPrice === 'number' ? j.exitPrice : 0,
        size: typeof j?.size === 'number' ? j.size : 1,
        pnl: typeof j?.pnl === 'number' ? j.pnl : 0,
        pnlPercent: typeof j?.pnlPercent === 'number' ? j.pnlPercent : 0,
        rMultiple: typeof j?.rMultiple === 'number' ? j.rMultiple : 0,
        status: j?.status === 'win' ? 'win' : j?.status === 'loss' ? 'loss' : 'breakeven',
        notes: String(j?.notes || '').slice(0, 500),
        setupStrategy: String(j?.setupStrategy || '').slice(0, 50),
        session: String(j?.session || 'New York AM').slice(0, 30),
        emotion: String(j?.emotion || 'Disciplined').slice(0, 30),
        mistakes: Array.isArray(j?.mistakes) ? j.mistakes.map((m: any) => String(m).slice(0, 50)) : [],
      }));
    }

    currentState.version = (currentState.version || 1) + 1;
    currentState.lastSyncedAt = new Date().toISOString();

    this.saveToDisk();

    return {
      conflict: false,
      serverVersion: currentState.version,
      state: currentState,
    };
  }

  // Authoritative Domain Action: Complete Task
  public completeTask(userId: string, taskId: string): TaskCompletionResult {
    const state = this.getUserState(userId);
    const task = state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, version: state.version, error: 'TASK_NOT_FOUND' };
    }

    if (task.completed) {
      return {
        success: true,
        task,
        profile: state.profile,
        version: state.version,
        alreadyCompleted: true,
      };
    }

    // Authoritatively mark completed
    task.completed = true;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    // Server-calculated XP award based on task complexity
    let awardedXp = 50;
    if (task.priority === 'high') awardedXp = 150;
    else if (task.priority === 'medium') awardedXp = 100;
    if (typeof task.xp === 'number' && task.xp > 0 && task.xp <= 300) {
      awardedXp = task.xp;
    }

    const { profile, transaction } = this.recordXpTransaction(
      userId,
      awardedXp,
      `Completed Task: ${task.title}`,
      'task'
    );

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return {
      success: true,
      task,
      profile,
      xpTransaction: transaction,
      version: state.version,
      alreadyCompleted: false,
    };
  }

  public createTask(userId: string, taskInput: Omit<TaskItem, 'id'>): { success: boolean; task: TaskItem; version: number } {
    const state = this.getUserState(userId);
    const clean = this.sanitizeKeys(taskInput);

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: String(clean.title || 'New Task').slice(0, 150),
      description: String(clean.description || '').slice(0, 500),
      dueDate: String(clean.dueDate || new Date().toISOString().split('T')[0]).slice(0, 20),
      time: String(clean.time || '09:00 AM').slice(0, 20),
      endTime: String(clean.endTime || '').slice(0, 20),
      priority: clean.priority === 'high' || clean.priority === 'low' ? clean.priority : 'medium',
      status: 'todo',
      category: String(clean.category || 'Engineering').slice(0, 50),
      tags: Array.isArray(clean.tags) ? clean.tags.map((t: any) => String(t).slice(0, 30)) : [],
      xp: typeof clean.xp === 'number' ? Math.max(10, Math.min(300, clean.xp)) : 50,
      completed: false,
    };

    state.tasks.push(newTask);
    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, task: newTask, version: state.version };
  }

  public updateTask(
    userId: string,
    taskId: string,
    updates: Partial<TaskItem>
  ): { success: boolean; task?: TaskItem; version: number; error?: string } {
    const state = this.getUserState(userId);
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, version: state.version, error: 'TASK_NOT_FOUND' };

    const clean = this.sanitizeKeys(updates);
    if (typeof clean.title === 'string') task.title = clean.title.slice(0, 150);
    if (typeof clean.description === 'string') task.description = clean.description.slice(0, 500);
    if (typeof clean.priority === 'string') task.priority = clean.priority;
    if (typeof clean.category === 'string') task.category = clean.category.slice(0, 50);
    if (Array.isArray(clean.tags)) task.tags = clean.tags.map((t: any) => String(t).slice(0, 30));

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, task, version: state.version };
  }

  public deleteTask(userId: string, taskId: string): { success: boolean; version: number; error?: string } {
    const state = this.getUserState(userId);
    const initialLen = state.tasks.length;
    state.tasks = state.tasks.filter((t) => t.id !== taskId);

    if (state.tasks.length === initialLen) {
      return { success: false, version: state.version, error: 'TASK_NOT_FOUND' };
    }

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, version: state.version };
  }

  // Authoritative Domain Action: Complete Habit
  public completeHabit(userId: string, habitId: string, dateStr?: string): HabitCompletionResult {
    const state = this.getUserState(userId);
    const habit = state.habits.find((h) => h.id === habitId);

    if (!habit) {
      return { success: false, version: state.version, error: 'HABIT_NOT_FOUND' };
    }

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    if (habit.history.includes(targetDate)) {
      return {
        success: true,
        habit,
        profile: state.profile,
        version: state.version,
        alreadyCompleted: true,
      };
    }

    habit.history.push(targetDate);
    habit.completedToday = true;
    habit.currentStreak += 1;
    if (habit.currentStreak > habit.bestStreak) {
      habit.bestStreak = habit.currentStreak;
    }

    let habitXp = 35;
    if (habit.difficulty === 'hard') habitXp = 60;
    else if (habit.difficulty === 'easy') habitXp = 25;
    if (typeof habit.xp === 'number' && habit.xp > 0 && habit.xp <= 200) {
      habitXp = habit.xp;
    }

    const { profile, transaction } = this.recordXpTransaction(
      userId,
      habitXp,
      `Completed Habit: ${habit.name}`,
      'habit'
    );

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return {
      success: true,
      habit,
      profile,
      xpTransaction: transaction,
      version: state.version,
      alreadyCompleted: false,
    };
  }

  public createHabit(userId: string, habitInput: Omit<HabitItem, 'id'>): { success: boolean; habit: HabitItem; version: number } {
    const state = this.getUserState(userId);
    const clean = this.sanitizeKeys(habitInput);

    const newHabit: HabitItem = {
      id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      createdAt: new Date().toISOString(),
    };

    state.habits.push(newHabit);
    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, habit: newHabit, version: state.version };
  }

  public updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<HabitItem>
  ): { success: boolean; habit?: HabitItem; version: number; error?: string } {
    const state = this.getUserState(userId);
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return { success: false, version: state.version, error: 'HABIT_NOT_FOUND' };

    const clean = this.sanitizeKeys(updates);
    if (typeof clean.name === 'string') habit.name = clean.name.slice(0, 100);
    if (typeof clean.description === 'string') habit.description = clean.description.slice(0, 300);
    if (typeof clean.target === 'string') habit.target = clean.target.slice(0, 50);

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, habit, version: state.version };
  }

  public deleteHabit(userId: string, habitId: string): { success: boolean; version: number; error?: string } {
    const state = this.getUserState(userId);
    const initialLen = state.habits.length;
    state.habits = state.habits.filter((h) => h.id !== habitId);

    if (state.habits.length === initialLen) {
      return { success: false, version: state.version, error: 'HABIT_NOT_FOUND' };
    }

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return { success: true, version: state.version };
  }

  // Authoritative Domain Action: Goal Progress
  public updateGoalProgress(
    userId: string,
    goalId: string,
    progress: number,
    milestoneId?: string
  ): GoalProgressResult {
    const state = this.getUserState(userId);
    const goal = state.goals.find((g) => g.id === goalId);

    if (!goal) {
      return { success: false, version: state.version, error: 'GOAL_NOT_FOUND' };
    }

    const safeProgress = Math.max(0, Math.min(100, Math.floor(progress)));
    const wasCompletedBefore = goal.progress >= 100;
    goal.progress = safeProgress;

    let totalXpAwarded = 0;
    let rewardReason = '';

    if (milestoneId) {
      const milestone = goal.milestones.find((m) => m.id === milestoneId);
      if (milestone && !milestone.completed) {
        milestone.completed = true;
        totalXpAwarded += milestone.xpReward || 150;
        rewardReason = `Completed Goal Milestone: ${milestone.title}`;
      }
    }

    if (safeProgress >= 100 && !wasCompletedBefore) {
      totalXpAwarded += goal.xpReward || 500;
      rewardReason = rewardReason
        ? `${rewardReason} & Achieved Goal: ${goal.title}`
        : `Achieved Goal: ${goal.title}`;
    }

    let profile = state.profile;
    let transaction: XpTransaction | undefined;

    if (totalXpAwarded > 0) {
      const result = this.recordXpTransaction(
        userId,
        totalXpAwarded,
        rewardReason,
        'milestone'
      );
      profile = result.profile;
      transaction = result.transaction;
    }

    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();
    this.saveToDisk();

    return {
      success: true,
      goal,
      profile,
      xpTransaction: transaction,
      version: state.version,
    };
  }

  public recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general'
  ): { profile: UserProfile; transaction: XpTransaction; version: number } {
    const user = this.users[userId];
    if (!user) throw new Error('User not found');

    const state = this.getUserState(userId);
    const profile = user.profile;

    const safeAmount = Math.max(1, Math.min(500, Math.floor(amount)));
    const safeReason = (reason || 'Activity completed').slice(0, 100);
    const validCategories: XpCategory[] = [
      'general',
      'task',
      'habit',
      'quest',
      'milestone',
      'course',
      'language',
      'trading',
      'streak_bonus',
      'level_up',
      'badge',
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

    const transaction: XpTransaction = {
      id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: safeAmount,
      reason: safeReason,
      category: safeCategory,
      timestamp: new Date().toISOString(),
    };

    state.xpLedger.unshift(transaction);
    if (state.xpLedger.length > 50) {
      state.xpLedger = state.xpLedger.slice(0, 50);
    }

    state.profile = { ...profile };
    state.version = (state.version || 1) + 1;
    state.lastSyncedAt = new Date().toISOString();

    this.saveToDisk();

    return { profile, transaction, version: state.version };
  }

  public addAiMessage(userId: string, message: AIChatMessage) {
    const state = this.getUserState(userId);
    state.aiHistory.push(message);
    if (state.aiHistory.length > 50) {
      state.aiHistory = state.aiHistory.slice(-50);
    }
    state.version = (state.version || 1) + 1;
    this.saveToDisk();
  }
}
