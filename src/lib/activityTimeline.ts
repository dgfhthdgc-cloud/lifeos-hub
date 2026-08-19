import { UnifiedActivityEvent, RoutePath } from '../types';
import { Storage } from './storage';
import { domainBus } from './domainBus';

export class UnifiedActivityTimelineEngine {
  /**
   * Generates a clean chronological feed of meaningful human actions across all life domains.
   */
  public static getTimelineEvents(limit: number = 20): UnifiedActivityEvent[] {
    const events: UnifiedActivityEvent[] = [];
    const now = Date.now();

    // Helper for human relative time
    const formatRelative = (isoString: string): string => {
      try {
        const timeMs = new Date(isoString).getTime();
        const diffSec = Math.floor((now - timeMs) / 1000);
        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
      } catch {
        return 'Recently';
      }
    };

    // 1. From XP Ledger (Immutable source of truth for achievements & actions)
    const xpTransactions = Storage.getXpTransactions();
    for (const tx of xpTransactions.slice(0, 30)) {
      let domain: UnifiedActivityEvent['domain'] = 'execution';
      let type: UnifiedActivityEvent['type'] = 'task_completed';
      let targetPath: RoutePath = '/planner';

      if (tx.category === 'habit') {
        domain = 'habits';
        type = 'habit_completed';
        targetPath = '/habits';
      } else if (tx.category === 'milestone') {
        domain = 'goals';
        type = 'milestone_completed';
        targetPath = '/goals';
      } else if (tx.category === 'course') {
        domain = 'learning';
        type = 'lesson_completed';
        targetPath = '/learn';
      } else if (tx.category === 'language') {
        domain = 'languages';
        type = 'language_mastered';
        targetPath = '/languages';
      } else if (tx.category === 'trading') {
        domain = 'trading';
        type = 'trade_logged';
        targetPath = '/trading';
      } else if (tx.category === 'quest') {
        domain = 'rpg';
        type = 'quest_claimed';
        targetPath = '/progress';
      } else if (tx.category === 'badge') {
        domain = 'rpg';
        type = 'perk_unlocked';
        targetPath = '/progress';
      } else if (tx.category === 'level_up') {
        domain = 'rpg';
        type = 'level_up';
        targetPath = '/progress';
      }

      events.push({
        id: `act-xp-${tx.id}`,
        type,
        title: tx.reason,
        domain,
        xpAwarded: tx.amount,
        timestamp: tx.timestamp,
        relativeTime: formatRelative(tx.timestamp),
        targetPath,
      });
    }

    // 2. From Domain Event Bus (Live session events)
    const busLogs = domainBus.getAuditLog();
    for (const busEvt of busLogs.slice(0, 20)) {
      // Avoid duplicate display if already captured by XP ledger
      const existing = events.find((e) => e.title.includes(busEvt.title));
      if (!existing && busEvt.status === 'processed') {
        let domain: UnifiedActivityEvent['domain'] = 'execution';
        let type: UnifiedActivityEvent['type'] = 'task_completed';
        let targetPath: RoutePath = '/planner';

        if (busEvt.type === 'habit_completed') {
          domain = 'habits';
          type = 'habit_completed';
          targetPath = '/habits';
        } else if (busEvt.type === 'goal_milestone_completed' || busEvt.type === 'goal_completed') {
          domain = 'goals';
          type = 'milestone_completed';
          targetPath = '/goals';
        } else if (busEvt.type === 'course_lesson_completed' || busEvt.type === 'course_completed') {
          domain = 'learning';
          type = 'lesson_completed';
          targetPath = '/learn';
        } else if (busEvt.type === 'language_lesson_completed') {
          domain = 'languages';
          type = 'language_mastered';
          targetPath = '/languages';
        } else if (busEvt.type === 'trade_journaled') {
          domain = 'trading';
          type = 'trade_logged';
          targetPath = '/trading';
        } else if (busEvt.type === 'boss_damaged' || busEvt.type === 'boss_defeated') {
          domain = 'rpg';
          type = 'boss_damaged';
          targetPath = '/bosses';
        } else if (busEvt.type === 'perk_unlocked') {
          domain = 'rpg';
          type = 'perk_unlocked';
          targetPath = '/perks';
        }

        events.push({
          id: `act-bus-${busEvt.eventId}`,
          type,
          title: busEvt.title,
          description: busEvt.category ? `Category: ${busEvt.category}` : undefined,
          domain,
          xpAwarded: busEvt.xpAmount || 0,
          timestamp: busEvt.timestamp,
          relativeTime: formatRelative(busEvt.timestamp),
          targetPath,
          metadata: busEvt.metadata,
        });
      }
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, limit);
  }
}
