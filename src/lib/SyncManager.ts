import { TaskItem, HabitItem, GoalItem, UserProfile, XpTransaction } from '../types';
import { UserDatabaseState } from '../server/types';

export interface SyncOperation {
  operationId: string;
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
    | 'UPDATE_PROFILE_SETTINGS';
  entityId?: string;
  payload: any;
  clientEventId?: string;
  baseVersion?: number;
}

export interface QueuedMutation {
  id: string;
  clientEventId: string;
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

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  public enqueueMutation(type: QueuedMutation['type'], payload: any, clientEventId?: string): string {
    const eventId = clientEventId || this.generateEventId();
    const queue = this.getOfflineQueue();

    // Deduplicate identical pending task/habit completions
    if (type === 'COMPLETE_TASK') {
      const exists = queue.some((m) => m.type === 'COMPLETE_TASK' && m.payload?.taskId === payload?.taskId);
      if (exists) return eventId;
    }
    if (type === 'COMPLETE_HABIT') {
      const exists = queue.some(
        (m) =>
          m.type === 'COMPLETE_HABIT' &&
          m.payload?.habitId === payload?.habitId &&
          m.payload?.date === payload?.date
      );
      if (exists) return eventId;
    }

    queue.push({
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      clientEventId: eventId,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });

    this.saveOfflineQueue(queue);

    if (navigator.onLine) {
      this.triggerDebouncedFlush();
    }

    return eventId;
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
    alreadyCompleted?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('COMPLETE_TASK', { taskId }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          taskId,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('COMPLETE_TASK', { taskId }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'TASK_COMPLETE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('COMPLETE_TASK', { taskId }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async createTask(task: Omit<TaskItem, 'id'> | TaskItem): Promise<{
    success: boolean;
    task?: TaskItem;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('CREATE_TASK', { task }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          task,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('CREATE_TASK', { task }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'TASK_CREATE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('CREATE_TASK', { task }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async updateTask(
    taskId: string,
    updates: Partial<TaskItem>
  ): Promise<{
    success: boolean;
    task?: TaskItem;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('UPDATE_TASK', { taskId, updates }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/tasks/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          taskId,
          updates,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('UPDATE_TASK', { taskId, updates }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'TASK_UPDATE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('UPDATE_TASK', { taskId, updates }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async deleteTask(taskId: string): Promise<{
    success: boolean;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('DELETE_TASK', { taskId }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/tasks/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          taskId,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('DELETE_TASK', { taskId }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'TASK_DELETE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('DELETE_TASK', { taskId }, clientEventId);
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
    alreadyCompleted?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('COMPLETE_HABIT', { habitId, date }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/habits/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          habitId,
          date,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('COMPLETE_HABIT', { habitId, date }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'HABIT_COMPLETE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('COMPLETE_HABIT', { habitId, date }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async createHabit(habit: Omit<HabitItem, 'id'> | HabitItem): Promise<{
    success: boolean;
    habit?: HabitItem;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('CREATE_HABIT', { habit }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/habits/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          habit,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('CREATE_HABIT', { habit }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'HABIT_CREATE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('CREATE_HABIT', { habit }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async updateHabit(
    habitId: string,
    updates: Partial<HabitItem>
  ): Promise<{
    success: boolean;
    habit?: HabitItem;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('UPDATE_HABIT', { habitId, updates }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/habits/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          habitId,
          updates,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('UPDATE_HABIT', { habitId, updates }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'HABIT_UPDATE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('UPDATE_HABIT', { habitId, updates }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async deleteHabit(habitId: string): Promise<{
    success: boolean;
    version?: number;
    offline?: boolean;
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('DELETE_HABIT', { habitId }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/habits/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          habitId,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('DELETE_HABIT', { habitId }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'HABIT_DELETE_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('DELETE_HABIT', { habitId }, clientEventId);
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
    error?: string;
  }> {
    const clientEventId = this.generateEventId();
    const token = this.getAuthToken();
    if (!token || !navigator.onLine) {
      this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId }, clientEventId);
      return { success: true, offline: true };
    }

    try {
      const res = await fetch('/api/domain/goals/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-client-event-id': clientEventId,
        },
        body: JSON.stringify({
          goalId,
          progress,
          milestoneId,
          clientEventId,
          baseVersion: this.getLocalVersion(),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId }, clientEventId);
          return { success: true, offline: true };
        }
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'GOAL_PROGRESS_FAILED' };
      }

      const data = await res.json();
      if (data.version) this.setLocalVersion(data.version);
      return data;
    } catch {
      this.enqueueMutation('UPDATE_GOAL_PROGRESS', { goalId, progress, milestoneId }, clientEventId);
      return { success: true, offline: true };
    }
  }

  public async syncOperations(operations: SyncOperation[]): Promise<{
    success: boolean;
    conflict?: boolean;
    serverVersion?: number;
    state?: UserDatabaseState;
    appliedCount?: number;
    rejectedCount?: number;
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
          operations,
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
      return {
        success: true,
        state: data.state,
        serverVersion: data.version,
        appliedCount: data.appliedCount,
        rejectedCount: data.rejectedCount,
      };
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
        let body: any = { ...mutation.payload, clientEventId: mutation.clientEventId };

        switch (mutation.type) {
          case 'COMPLETE_TASK':
            endpoint = '/api/domain/tasks/complete';
            break;
          case 'CREATE_TASK':
            endpoint = '/api/domain/tasks/create';
            break;
          case 'UPDATE_TASK':
            endpoint = '/api/domain/tasks/update';
            break;
          case 'DELETE_TASK':
            endpoint = '/api/domain/tasks/delete';
            break;
          case 'COMPLETE_HABIT':
            endpoint = '/api/domain/habits/complete';
            break;
          case 'CREATE_HABIT':
            endpoint = '/api/domain/habits/create';
            break;
          case 'UPDATE_HABIT':
            endpoint = '/api/domain/habits/update';
            break;
          case 'DELETE_HABIT':
            endpoint = '/api/domain/habits/delete';
            break;
          case 'UPDATE_GOAL_PROGRESS':
            endpoint = '/api/domain/goals/progress';
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
              'x-client-event-id': mutation.clientEventId,
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
