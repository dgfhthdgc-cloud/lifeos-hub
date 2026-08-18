import fs from 'fs';
import path from 'path';
import { AuthUserRecord, UserDatabaseState } from './types';
import { hashPassword } from './auth';
import { INITIAL_USER } from '../lib/storage';
import { INITIAL_BOSS_BATTLES, INITIAL_SKILL_PERK_NODES } from '../lib/phase8Data';
import { INITIAL_AUTOMATIONS } from '../lib/phase9Data';
import {
  UserProfile,
  TaskItem,
  HabitItem,
  GoalItem,
  TradeJournalEntry,
  AIChatMessage,
  XpTransaction,
  XpCategory,
  AutomationExecutionLog,
} from '../types';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

class BackendDatabase {
  private users: UserStoreMap = {};
  private states: StateStoreMap = {};

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
      }
    } catch (err) {
      console.warn('Could not load database file, starting clean in-memory', err);
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(
        USERS_FILE,
        JSON.stringify({ users: this.users, states: this.states }, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to persist database to disk', err);
    }
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
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-2',
            title: 'Calibrate Paper Trading Risk Parameters',
            description: 'Verify 2% max portfolio risk limit and stop-loss execution formulas.',
            dueDate: new Date().toISOString().split('T')[0],
            time: '14:00 PM',
            priority: 'medium',
            status: 'todo',
            category: 'Trading',
            tags: ['Quant', 'Risk'],
            xp: 90,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ],
        habits: [
          {
            id: 'habit-1',
            name: 'Deep Work Focus Block',
            description: '90 minutes uninterrupted cognitive problem solving.',
            frequency: 'daily',
            target: '90 mins / day',
            category: 'Productivity',
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
            name: 'Quantitative Journal Review',
            description: 'Log and analyze paper trade setups and R-multiple expectancy.',
            frequency: 'daily',
            target: '15 mins / day',
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
            title: 'Master Full-Stack Autonomous AI Architecture',
            description: 'Build enterprise-grade scalable operating system with real-time AI telemetry.',
            category: 'Career & Skills',
            deadline: 'Dec 2026',
            quarter: 'Q3 2026',
            progress: 75,
            priority: 'high',
            status: 'in_progress',
            xpReward: 2500,
            createdAt: new Date().toISOString(),
            milestones: [
              {
                id: 'm-1',
                goalId: 'goal-1',
                title: 'Deploy User Authentication & Auth Token Sessions',
                completed: true,
                order: 1,
                xpReward: 500,
              },
              {
                id: 'm-2',
                goalId: 'goal-1',
                title: 'Integrate Server-Side Gemini AI Context Gateway',
                completed: false,
                order: 2,
                xpReward: 800,
              },
            ],
          },
        ],
        journal: [],
        aiHistory: [
          {
            id: 'msg-seed-1',
            role: 'assistant',
            content: 'Life OS AI Strategy Gateway initialized. I am monitoring your productivity telemetry, habit streaks, and risk management parameters. How can I optimize your trajectory today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'gemini-2.5-flash',
          },
        ],
        xpLedger: [
          {
            id: 'tx_seed_1',
            amount: 500,
            reason: 'System Bootstrap & Initial Profile Calibration',
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

  // User Management
  public getUserByEmail(email: string): AuthUserRecord | null {
    const normalized = email.toLowerCase().trim();
    return Object.values(this.users).find((u) => u.email.toLowerCase() === normalized) || null;
  }

  public getUserById(id: string): AuthUserRecord | null {
    return this.users[id] || null;
  }

  public createUser(email: string, password: string, name: string): AuthUserRecord {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { hash, salt } = hashPassword(password);

    const profile: UserProfile = {
      id: userId,
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split('@')[0],
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

    const userRecord: AuthUserRecord = {
      id: userId,
      email: normalizedEmail,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      profile,
    };

    this.users[userId] = userRecord;

    this.states[userId] = {
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
    return userRecord;
  }

  public updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.users[userId];
    if (!user) throw new Error('User not found');

    const updatedProfile = { ...user.profile, ...updates };
    user.profile = updatedProfile;
    if (this.states[userId]) {
      this.states[userId].profile = updatedProfile;
    }
    this.saveToDisk();
    return updatedProfile;
  }

  // State Management
  public getUserState(userId: string): UserDatabaseState {
    if (!this.states[userId]) {
      const user = this.users[userId];
      if (!user) throw new Error('User not found');
      this.states[userId] = {
        profile: user.profile,
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
    }
    return this.states[userId];
  }

  public syncUserState(userId: string, partialState: Partial<UserDatabaseState>): UserDatabaseState {
    const current = this.getUserState(userId);
    const updated: UserDatabaseState = {
      ...current,
      ...partialState,
      profile: partialState.profile ? { ...current.profile, ...partialState.profile } : current.profile,
      lastSyncedAt: new Date().toISOString(),
    };
    this.states[userId] = updated;
    if (partialState.profile) {
      this.users[userId].profile = updated.profile;
    }
    this.saveToDisk();
    return updated;
  }

  public recordXpTransaction(
    userId: string,
    amount: number,
    reason: string,
    category: XpCategory = 'general'
  ): { profile: UserProfile; transaction: XpTransaction } {
    const state = this.getUserState(userId);
    const profile = state.profile;

    let newCurrentXp = profile.currentXp + amount;
    let newLevel = profile.level;
    let nextXp = profile.nextLevelXp;

    while (newCurrentXp >= nextXp) {
      newCurrentXp -= nextXp;
      newLevel += 1;
      nextXp = Math.floor(400 * Math.pow(1.25, newLevel - 1));
    }

    const updatedProfile: UserProfile = {
      ...profile,
      currentXp: newCurrentXp,
      level: newLevel,
      nextLevelXp: nextXp,
    };

    const transaction: XpTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount,
      reason,
      category,
      timestamp: new Date().toISOString(),
    };

    state.profile = updatedProfile;
    state.xpLedger = [transaction, ...(state.xpLedger || [])].slice(0, 100);
    this.users[userId].profile = updatedProfile;

    this.saveToDisk();
    return { profile: updatedProfile, transaction };
  }

  public addAiMessage(userId: string, message: AIChatMessage) {
    const state = this.getUserState(userId);
    state.aiHistory = [...(state.aiHistory || []), message].slice(-50);
    this.saveToDisk();
  }
}

export const db = new BackendDatabase();
