import { Storage } from './storage';
import {
  UserProfile,
  TaskItem,
  HabitItem,
  GoalItem,
  DetailedCourse,
  LanguageLesson,
  LanguageUnit,
  TradeJournalEntry,
  BossBattle,
  SkillPerkNode,
  QuestItem,
  CrossDomainLifeRadarData,
  HistoricalXpTrendPoint,
  DomainDistributionPoint,
  FlowHourHeatmapPoint,
} from '../types';

export type DomainEventType =
  | 'task_completed'
  | 'task_created'
  | 'habit_completed'
  | 'goal_milestone_completed'
  | 'goal_completed'
  | 'course_lesson_completed'
  | 'course_completed'
  | 'language_lesson_completed'
  | 'trade_journaled'
  | 'boss_damaged'
  | 'boss_defeated'
  | 'perk_unlocked'
  | 'biometric_synced';

export type EventProcessingStatus =
  | 'processed'
  | 'deduplicated'
  | 'loop_suppressed'
  | 'failed';

export interface DomainEventPayload {
  eventId: string;
  type: DomainEventType;
  entityId: string;
  title: string;
  userId?: string;
  source?: string;
  parentEventId?: string;
  correlationId?: string;
  chainDepth?: number;
  category?: string;
  priority?: string;
  xpAmount?: number;
  rMultiple?: number;
  scorePercentage?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  status?: EventProcessingStatus;
  errors?: string[];
}

export type DomainEventListener = (event: DomainEventPayload) => void;

export interface EventDispatchResult {
  event: DomainEventPayload;
  status: EventProcessingStatus;
  sideEffectsApplied: boolean;
  listenersNotified: number;
  errors: string[];
}

export interface DomainBusStats {
  totalDispatched: number;
  processedCount: number;
  deduplicatedCount: number;
  loopSuppressedCount: number;
  failedCount: number;
  activeListenersCount: number;
}

const MAX_CHAIN_DEPTH = 3;
const MAX_DEDUP_CACHE_SIZE = 1000;
const MAX_AUDIT_LOG_SIZE = 200;

class DomainEventBus {
  private listeners: Set<{ listener: DomainEventListener; filterType?: DomainEventType }> = new Set();
  private processedEventIds: Set<string> = new Set();
  private auditLog: DomainEventPayload[] = [];
  private stats: DomainBusStats = {
    totalDispatched: 0,
    processedCount: 0,
    deduplicatedCount: 0,
    loopSuppressedCount: 0,
    failedCount: 0,
    activeListenersCount: 0,
  };

  /**
   * Subscribe to all or specific Life OS domain events.
   * Returns an unsubscription cleanup function.
   */
  public subscribe(listener: DomainEventListener, filterType?: DomainEventType): () => void {
    const entry = { listener, filterType };
    this.listeners.add(entry);
    this.stats.activeListenersCount = this.listeners.size;
    return () => {
      this.listeners.delete(entry);
      this.stats.activeListenersCount = this.listeners.size;
    };
  }

  /**
   * Dispatch a unified domain event across all Life OS subsystems with deterministic
   * idempotency, cycle protection, isolated execution, and audit logging.
   */
  public dispatch(
    rawEvent: Omit<DomainEventPayload, 'timestamp' | 'eventId'> & { eventId?: string; timestamp?: string }
  ): DomainEventPayload {
    this.stats.totalDispatched++;

    const eventId = rawEvent.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = rawEvent.timestamp || new Date().toISOString();
    const chainDepth = rawEvent.chainDepth ?? 0;
    const correlationId = rawEvent.correlationId || rawEvent.parentEventId || eventId;

    const fullEvent: DomainEventPayload = {
      ...rawEvent,
      eventId,
      timestamp,
      chainDepth,
      correlationId,
      status: 'processed',
      errors: [],
    };

    // 1. Idempotency & Deduplication check
    if (this.processedEventIds.has(eventId)) {
      fullEvent.status = 'deduplicated';
      this.stats.deduplicatedCount++;
      this.recordAudit(fullEvent);
      return fullEvent;
    }

    // 2. Cascade loop & recursion suppression
    if (chainDepth > MAX_CHAIN_DEPTH) {
      fullEvent.status = 'loop_suppressed';
      this.stats.loopSuppressedCount++;
      const warnMsg = `[LOOP_PREVENTED] Cascade depth limit (${MAX_CHAIN_DEPTH}) exceeded for event '${fullEvent.type}' (${eventId})`;
      console.warn(warnMsg);
      fullEvent.errors?.push(warnMsg);
      this.recordAudit(fullEvent);
      return fullEvent;
    }

    // Mark as processed in dedup registry
    this.registerProcessedId(eventId);

    const errors: string[] = [];

    // 3. Process Gamification & Boss Damage side-effects
    try {
      this.processSideEffects(fullEvent);
    } catch (err: any) {
      const errMsg = `SideEffect error for ${fullEvent.type}: ${err?.message || err}`;
      console.error(errMsg);
      errors.push(errMsg);
    }

    // 4. Trigger active automations (with incremented chainDepth)
    try {
      Storage.triggerAutomations(fullEvent.type, {
        id: fullEvent.entityId,
        title: fullEvent.title,
        category: fullEvent.category,
        priority: fullEvent.priority,
        xp: fullEvent.xpAmount,
        rMultiple: fullEvent.rMultiple,
        scorePercentage: fullEvent.scorePercentage,
        parentEventId: eventId,
        correlationId,
        chainDepth: chainDepth + 1,
        ...fullEvent.metadata,
      });
    } catch (err: any) {
      const errMsg = `Automation trigger error: ${err?.message || err}`;
      console.warn(errMsg);
      errors.push(errMsg);
    }

    // 5. Notify runtime listeners with strict error isolation
    this.listeners.forEach(({ listener, filterType }) => {
      if (!filterType || filterType === fullEvent.type) {
        try {
          listener(fullEvent);
        } catch (err: any) {
          const errMsg = `Listener failure on ${fullEvent.type}: ${err?.message || err}`;
          console.error(errMsg);
          errors.push(errMsg);
        }
      }
    });

    if (errors.length > 0) {
      fullEvent.errors = errors;
      fullEvent.status = 'failed';
      this.stats.failedCount++;
    } else {
      this.stats.processedCount++;
    }

    this.recordAudit(fullEvent);
    return fullEvent;
  }

  /**
   * Automatic cross-system side effects (Boss damage, Quests, Streaks, Perks)
   */
  private processSideEffects(event: DomainEventPayload): void {
    let bossDamage = 0;
    let bossCategory = 'task';

    switch (event.type) {
      case 'task_completed':
        bossDamage = event.priority === 'high' ? 120 : event.priority === 'medium' ? 60 : 30;
        bossCategory = 'task';
        Storage.updateQuestProgress('tasks_completed', 1);
        break;

      case 'habit_completed':
        bossDamage = 75;
        bossCategory = 'habit';
        Storage.updateQuestProgress('habits_checked', 1);
        break;

      case 'goal_milestone_completed':
        bossDamage = 250;
        bossCategory = 'goal';
        Storage.updateQuestProgress('goals_milestone', 1);
        break;

      case 'goal_completed':
        bossDamage = 600;
        bossCategory = 'goal';
        Storage.updateQuestProgress('goals_milestone', 3);
        break;

      case 'course_lesson_completed':
        bossDamage = 100;
        bossCategory = 'learning';
        Storage.updateQuestProgress('learning_lessons', 1);
        break;

      case 'course_completed':
        bossDamage = 500;
        bossCategory = 'learning';
        Storage.updateQuestProgress('learning_lessons', 5);
        break;

      case 'language_lesson_completed':
        bossDamage = 80;
        bossCategory = 'language';
        Storage.updateQuestProgress('learning_lessons', 1);
        break;

      case 'trade_journaled':
        const r = event.rMultiple || 0;
        bossDamage = r > 0 ? Math.round(50 + r * 40) : 30;
        bossCategory = 'trading';
        Storage.updateQuestProgress('trading_trades', 1);
        break;

      default:
        break;
    }

    // Apply Active Skill Perk multipliers for Boss Damage
    if (bossDamage > 0) {
      try {
        const perks = Storage.getSkillPerks().filter((p) => p.unlocked);
        let multiplier = 1.0;

        for (const perk of perks) {
          if (typeof perk.bonusMultiplier === 'number' && perk.domain === 'execution') {
            const bonus = perk.bonusMultiplier >= 1.0 ? perk.bonusMultiplier - 1.0 : perk.bonusMultiplier;
            multiplier += bonus;
          }
        }

        const totalDamage = Math.round(bossDamage * multiplier);
        Storage.damageActiveBoss(totalDamage, `${event.title} (${event.type})`, bossCategory);
      } catch (err) {
        console.warn('Failed to calculate boss damage perk modifier:', err);
        Storage.damageActiveBoss(bossDamage, `${event.title} (${event.type})`, bossCategory);
      }
    }
  }

  private registerProcessedId(eventId: string): void {
    if (this.processedEventIds.size >= MAX_DEDUP_CACHE_SIZE) {
      // Evict oldest entries by converting to array and dropping first 200
      const arr = Array.from(this.processedEventIds);
      this.processedEventIds = new Set(arr.slice(200));
    }
    this.processedEventIds.add(eventId);
  }

  private recordAudit(event: DomainEventPayload): void {
    this.auditLog.unshift(event);
    if (this.auditLog.length > MAX_AUDIT_LOG_SIZE) {
      this.auditLog.length = MAX_AUDIT_LOG_SIZE;
    }
  }

  /**
   * Observability: Retrieve the event audit log for inspection and diagnostics.
   */
  public getAuditLog(): DomainEventPayload[] {
    return [...this.auditLog];
  }

  /**
   * Observability: Retrieve current lifecycle statistics of the event bus.
   */
  public getStats(): DomainBusStats {
    return { ...this.stats };
  }

  /**
   * Check if a specific event ID has already been processed by the bus.
   */
  public isEventProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  /**
   * Clear the audit log and dedup cache (used in testing and debugging).
   */
  public clearAuditLog(): void {
    this.auditLog = [];
    this.processedEventIds.clear();
    this.stats = {
      totalDispatched: 0,
      processedCount: 0,
      deduplicatedCount: 0,
      loopSuppressedCount: 0,
      failedCount: 0,
      activeListenersCount: this.listeners.size,
    };
  }

  /**
   * Reset the bus completely (listeners, deduplication, logs, stats).
   */
  public reset(): void {
    this.listeners.clear();
    this.clearAuditLog();
  }
}

export const domainBus = new DomainEventBus();

