import { TaskItem, HabitItem, GoalItem, UserProfile, XpTransaction } from '../types';
import { UserDatabaseState } from '../server/types';

export interface QueuedMutation {
  id: string;
  type:
    | 'COMPLETE_TASK'
    | 'CREATE_TASK'
    | 'UPDATE_TASK'
    | 'DELETE_TASK'
    | 'COMPLETE_HABIT'
    | 'CREATE_HABIT'
    | 'UPDATE_HABIT'
    | 'DELETE_HABIT'
    | 'UPDATE_GOAL_PROGRESS'
    | 'SYNC_STATE';
  payload: any;
  timestamp: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'lifeos_offline_queue';
const VERSION_STORAGE_KEY = 'lifeos_sync_version';
const TOKEN_KEY = 'lifeos_auth_token';

class SyncManagerEngine {
  private isSyncing = false;
  private syncDebounceTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushQueue();
      });
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  public getLocalVersion(): number {
    if (typeof window === 'undefined') return 1;
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    return raw ? parseInt(raw, 10) || 1 : 1;
  }

  public setLocalVersion(version: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VERSION_STORAGE_KEY, String(version));
  }

  public getOfflineQueue(): QueuedMutation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineQueue(queue: QueuedMutation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save offline mutation queue', err);
    }
  }

  public enqueueMutation(type: QueuedMutation['type'], payload: any): void {
    const queue = this.getOfflineQueue();
    // Deduplicate identical pending task/habit completions
    if (type === 'COMPLETE_TASK') {
      const exists = queue.some((m) => m.type === 'COMPLETE_TASK' && m.payload?.taskId === payload?.taskId);
      if (exists) return;
    }
    if (type === 'COMPLETE_HABIT') {
      const exists = queue.some(
        (m) =>
          m.type === 'COMPLETE_HABIT' &&
          m.payload?.habitId === payload?.habitId &&
          m.payload?.date === payload?.date
      );
      if (exists) return;
    }

    queue.push({
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });

    this.saveOfflineQueue(queue);

    if (navigator.onLine) {
      this.triggerDebouncedFlush();
    }
  }

  public triggerDebouncedFlush(): void {
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    this.syncDebounceTimer = setTimeout(() => {
      this.flushQueue();
    }, 1500);
  }

  public async fetchAuthoritativeState(): Promise<UserDatabaseState | null> {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/data/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.version) {
        this.setLocalVersion(data.version);
      }
      return data.state;
    } catch (err) {
      console.warn('Could not fetch authoritative server state', err);
      return null;
    }
  }

  public async completeTask(taskId: string): Promise<{
    success: boolean;
    task?: TaskItem;
    profile?: UserProfile;
    xpTransaction?: XpTransaction;
    version?: number;
    offline?: boolean;
  }> {
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('COMPLETE_TASK', { taskId });
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false };
      }

      if (!res.ok) {
        this.enqueueMutation('COMPLETE_TASK', { taskId });
        return { success: true, offline: true };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('COMPLETE_TASK', { taskId });
      return { success: true, offline: true };
    }
  }

  public async completeHabit(
    habitId: string,
    date?: string
  ): Promise<{
    success: boolean;
    habit?: HabitItem;
    profile?: UserProfile;
    xpTransaction?: XpTransaction;
    version?: number;
    offline?: boolean;
  }> {
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('COMPLETE_HABIT', { habitId, date });
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/habits/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ habitId, date }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false };
      }

      if (!res.ok) {
        this.enqueueMutation('COMPLETE_HABIT', { habitId, date });
        return { success: true, offline: true };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('COMPLETE_HABIT', { habitId, date });
      return { success: true, offline: true };
    }
  }

  public async updateGoalProgress(
    goalId: string,
    progress: number,
    milestoneId?: string
  ): Promise<{
    success: boolean;
    goal?: GoalItem;
    profile?: UserProfile;
    xpTransaction?: XpTransaction;
    version?: number;
    offline?: boolean;
  }> {
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId });
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/goals/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalId, progress, milestoneId }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false };
      }

      if (!res.ok) {
        this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId });
        return { success: true, offline: true };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId });
      return { success: true, offline: true };
    }
  }

  public async syncWithServer(changes: Partial<UserDatabaseState>): Promise<{
    success: boolean;
    conflict?: boolean;
    serverVersion?: number;
    state?: UserDatabaseState;
  }> {
    const token = this.getAuthToken();
    if (!token) return { success: false };

    const baseVersion = this.getLocalVersion();

    try {
      const res = await fetch('/api/data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseVersion,
          changes,
        }),
      });

      if (res.status === 409) {
        const conflictData = await res.json();
        if (conflictData.serverVersion) {
          this.setLocalVersion(conflictData.serverVersion);
        }
        return {
          success: false,
          conflict: true,
          serverVersion: conflictData.serverVersion,
          state: conflictData.state,
        };
      }

      if (!res.ok) return { success: false };

      const data = await res.json();
      if (data.version) {
        this.setLocalVersion(data.version);
      }
      return { success: true, state: data.state, serverVersion: data.version };
    } catch (err) {
      console.warn('Sync failed due to network error', err);
      return { success: false };
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    const token = this.getAuthToken();
    if (!token) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    const remainingQueue: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        let endpoint = '';
        let body: any = {};

        switch (mutation.type) {
          case 'COMPLETE_TASK':
            endpoint = '/api/domain/tasks/complete';
            body = { taskId: mutation.payload.taskId };
            break;
          case 'COMPLETE_HABIT':
            endpoint = '/api/domain/habits/complete';
            body = { habitId: mutation.payload.habitId, date: mutation.payload.date };
            break;
          case 'UPDATE_GOAL_PROGRESS':
            endpoint = '/api/domain/goals/progress';
            body = mutation.payload;
            break;
          case 'CREATE_TASK':
            endpoint = '/api/domain/tasks/create';
            body = mutation.payload;
            break;
          case 'UPDATE_TASK':
            endpoint = '/api/domain/tasks/update';
            body = mutation.payload;
            break;
          case 'DELETE_TASK':
            endpoint = '/api/domain/tasks/delete';
            body = mutation.payload;
            break;
          default:
            break;
        }

        if (endpoint) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });

          if (!res.ok && res.status !== 404 && res.status !== 401 && res.status !== 403) {
            mutation.retryCount += 1;
            if (mutation.retryCount < 5) {
              remainingQueue.push(mutation);
            }
          } else if (res.ok) {
            const data = await res.json();
            if (data.version) this.setLocalVersion(data.version);
          }
        }
      } catch {
        mutation.retryCount += 1;
        if (mutation.retryCount < 5) {
          remainingQueue.push(mutation);
        }
      }
    }

    this.saveOfflineQueue(remainingQueue);
    this.isSyncing = false;
  }
}

export const syncManager = new SyncManagerEngine();
