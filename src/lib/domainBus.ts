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

export interface DomainEventPayload {
  type: DomainEventType;
  entityId: string;
  title: string;
  category?: string;
  priority?: string;
  xpAmount?: number;
  rMultiple?: number;
  scorePercentage?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type DomainEventListener = (event: DomainEventPayload) => void;

class DomainEventBus {
  private listeners: Set<DomainEventListener> = new Set();

  /**
   * Subscribe to all Life OS domain events
   */
  public subscribe(listener: DomainEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch a unified domain event across all Life OS subsystems
   */
  public dispatch(event: Omit<DomainEventPayload, 'timestamp'>): DomainEventPayload {
    const fullEvent: DomainEventPayload = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // 1. Process Gamification & Boss Damage side-effects
    this.processSideEffects(fullEvent);

    // 2. Trigger active automations
    try {
      Storage.triggerAutomations(fullEvent.type, {
        id: fullEvent.entityId,
        title: fullEvent.title,
        category: fullEvent.category,
        priority: fullEvent.priority,
        xp: fullEvent.xpAmount,
        rMultiple: fullEvent.rMultiple,
        scorePercentage: fullEvent.scorePercentage,
        ...fullEvent.metadata,
      });
    } catch (err) {
      console.warn('Automation trigger failure:', err);
    }

    // 3. Notify all runtime listeners
    this.listeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error('Error in domain event listener:', err);
      }
    });

    return fullEvent;
  }

  /**
   * Automatic cross-system side effects (Boss damage, Quests, Streaks, Perks)
   */
  private processSideEffects(event: DomainEventPayload): void {
    // Determine Boss Raid Damage based on the domain activity
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
      const perks = Storage.getSkillPerks().filter((p) => p.unlocked);
      let multiplier = 1.0;

      for (const perk of perks) {
        if (perk.bonusMultiplier && perk.domain === 'execution') {
          multiplier += perk.bonusMultiplier;
        }
      }

      const totalDamage = Math.round(bossDamage * multiplier);
      Storage.damageActiveBoss(totalDamage, `${event.title} (${event.type})`, bossCategory);
    }
  }
}

export const domainBus = new DomainEventBus();
