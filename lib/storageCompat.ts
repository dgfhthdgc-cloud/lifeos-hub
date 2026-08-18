import { Storage } from './storage';
import { getXpRequiredForLevel, LEVEL_RANKS } from './gamification';

let installed = false;

/**
 * Runtime compatibility layer for legacy storage methods that are still
 * referenced by Phase 9/10 features. This keeps older local data usable while
 * the monolithic storage module is migrated incrementally.
 */
export function installStorageCompatibility() {
  if (installed) return;
  installed = true;

  const store = Storage as any;

  // Legacy alias used by the automation engine.
  store.saveStreakData = store.setStreakData.bind(store);

  // Legacy aliases used by the sovereign backup importer/exporter.
  store.getDetailedTasks = store.getTasks.bind(store);
  store.getDetailedHabits = store.getHabits.bind(store);
  store.getDetailedGoals = store.getGoals.bind(store);
  store.getTradingJournal = store.getTradeJournal.bind(store);
  store.saveDetailedTasks = store.setTasks.bind(store);
  store.saveDetailedHabits = store.setHabits.bind(store);
  store.saveDetailedGoals = store.setGoals.bind(store);

  // Legacy XP bridge used by swarm insights.
  store.awardXp = (amount: number, reason = 'Activity completed') => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    const currentUser = store.getUser();
    if (!currentUser) return;

    let currentXp = Math.max(0, currentUser.currentXp || 0) + amount;
    let level = Math.max(1, currentUser.level || 1);
    let nextLevelXp = currentUser.nextLevelXp || getXpRequiredForLevel(level);

    while (currentXp >= nextLevelXp && level < 100) {
      currentXp -= nextLevelXp;
      level += 1;
      nextLevelXp = getXpRequiredForLevel(level);
    }

    const rank = [...LEVEL_RANKS].reverse().find((item) => level >= item.level);
    const updatedUser = {
      ...currentUser,
      level,
      currentXp,
      nextLevelXp,
      title: rank?.title || currentUser.title,
    };

    store.setUser(updatedUser);
    store.addXpTransaction({
      amount,
      reason,
      category: 'general',
    });
  };
}
