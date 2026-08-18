import { Storage } from './storage';
import { getXpRequiredForLevel, LEVEL_RANKS } from './gamification';

let installed = false;

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
};

const calculateStreaks = (history: string[]) => {
  const uniqueDates = [...new Set(history)].sort();
  if (uniqueDates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i += 1) {
    if (uniqueDates[i] === shiftDate(uniqueDates[i - 1], 1)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const dateSet = new Set(uniqueDates);
  let current = 0;
  let cursor = uniqueDates[uniqueDates.length - 1];
  const today = getLocalDateString();
  const yesterday = shiftDate(today, -1);

  // A streak can legitimately be shown today even when the user has not
  // checked in yet, provided yesterday was the most recent completion.
  if (cursor !== today && cursor !== yesterday) {
    return { current: 0, best };
  }
  if (cursor === today) current = 1;
  cursor = cursor === today ? shiftDate(cursor, -1) : cursor;

  while (dateSet.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }

  return { current, best };
};

/**
 * Runtime compatibility layer for legacy storage methods that are still
 * referenced by Phase 9/10 features. This keeps older local data usable while
 * the monolithic storage module is migrated incrementally.
 */
export function installStorageCompatibility() {
  if (installed) return;
  installed = true;

  const store = Storage as any;

  store.saveStreakData = store.setStreakData.bind(store);

  store.getDetailedTasks = store.getTasks.bind(store);
  store.getDetailedHabits = store.getHabits.bind(store);
  store.getDetailedGoals = store.getGoals.bind(store);
  store.getTradingJournal = store.getTradeJournal.bind(store);
  store.saveDetailedTasks = store.setTasks.bind(store);
  store.saveDetailedHabits = store.setHabits.bind(store);
  store.saveDetailedGoals = store.setGoals.bind(store);

  // Replace the legacy +1/-1 streak implementation with a date-derived streak
  // so editing a historical check-in cannot corrupt the current streak.
  store.toggleHabitDay = (id: string, dateStr = getLocalDateString()) => {
    const habits = store.getHabits();
    let awarded = 0;
    let targetHabit: any = null;

    const updated = habits.map((habit: any) => {
      if (habit.id !== id) return habit;

      const wasCompleted = habit.history.includes(dateStr);
      const nextHistory = wasCompleted
        ? habit.history.filter((d: string) => d !== dateStr)
        : [dateStr, ...habit.history];

      const { current, best } = calculateStreaks(nextHistory);
      if (!wasCompleted) {
        awarded = habit.xp || 15;
        store.damageActiveBoss(
          40,
          `Checked Habit: "${habit.title || habit.name}"`,
          'habit'
        );
        if (current > 0 && current % 7 === 0) {
          store.triggerAutomations('habit_streak_reached', {
            streak: current,
            name: habit.title || habit.name,
          });
        }
      }

      targetHabit = {
        ...habit,
        history: nextHistory,
        currentStreak: current,
        bestStreak: Math.max(habit.bestStreak || 0, best),
        completedToday: dateStr === getLocalDateString() ? !wasCompleted : habit.completedToday,
      };
      return targetHabit;
    });

    store.setHabits(updated);
    return { habit: targetHabit, xpAwarded: awarded };
  };

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
