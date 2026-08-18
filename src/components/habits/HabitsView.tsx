import React, { useState, useEffect } from 'react';
import { HabitItem, StreakSystemData } from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react';

export function HabitsView() {
  const { addXp } = useAuth();
  const { showToast } = useNotifications();
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [streakData, setStreakData] = useState<StreakSystemData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New habit state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Skill' | 'Productivity' | 'Language' | 'Trading' | 'Health' | 'Mindfulness'>('Productivity');
  const [newTargetDays, setNewTargetDays] = useState(7);

  useEffect(() => {
    setHabits(Storage.getHabits());
    setStreakData(Storage.getStreakData());
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleHabit = (id: string) => {
    const res = Storage.toggleHabitDay(id, todayStr);
    if (res.habit) {
      setHabits(Storage.getHabits());
      setStreakData(Storage.getStreakData());
      if (res.xpAwarded > 0) {
        addXp(res.xpAwarded, `Completed habit: ${res.habit.name}`);
        showToast(`Habit logged! +${res.xpAwarded} XP (Streak: ${res.habit.currentStreak} days)`, 'success');
      }
    }
  };

  const handleToggleFreeze = () => {
    const success = Storage.toggleStreakFreeze();
    if (success) {
      setStreakData(Storage.getStreakData());
      showToast('Streak freeze shield toggled', 'info');
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHabit: HabitItem = {
      id: `hab-${Date.now()}`,
      name: newTitle.trim(),
      description: 'Daily consistency ritual',
      category: newCategory,
      frequency: 'daily',
      target: `${newTargetDays} days/week`,
      difficulty: 'medium',
      xp: 25,
      currentStreak: 0,
      bestStreak: 0,
      completedToday: false,
      history: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newHabit, ...habits];
    Storage.setHabits(updated);
    setHabits(updated);
    setShowAddModal(false);
    setNewTitle('');
    showToast('New habit ritual active', 'success');
  };

  // Generate last 7 days for the weekly mini-tracker
  const getLast7Days = () => {
    const days: { label: string; dateStr: string }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: weekdays[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const weekDays = getLast7Days();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-orange-500" />
            Atomic Habit Matrix
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Consistent neural compounding with streak freeze shield protection
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Initialize Habit
        </button>
      </div>

      {/* Streak Protection Banner */}
      {streakData && (
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold">{streakData.currentStreak} Day Global Streak</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {streakData.multiplier}x Multiplier
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Longest recorded streak: {streakData.bestStreak} days across all core disciplines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1.5 rounded-xl border border-neutral-700">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold">
                {streakData.streakShields} / {streakData.maxShields} Shields
              </span>
            </div>
            <button
              onClick={handleToggleFreeze}
              disabled={streakData.streakShields <= 0 && !streakData.freezeActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                streakData.freezeActive
                  ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              {streakData.freezeActive ? 'Shield Active' : 'Arm Freeze Shield'}
            </button>
          </div>
        </div>
      )}

      {/* Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => {
          const isDoneToday = habit.history.includes(todayStr);

          return (
            <div
              key={habit.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isDoneToday
                  ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] border-emerald-500/30'
                  : 'bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {habit.category}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {habit.target}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">{habit.name}</h3>
                  </div>

                  <div className="flex items-center gap-1 text-orange-500 font-black text-sm shrink-0">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    <span>{habit.currentStreak}d</span>
                  </div>
                </div>

                {/* 7-Day Consistency Grid */}
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-2">Past 7 Days</div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {weekDays.map((day) => {
                      const completed = habit.history.includes(day.dateStr);
                      const isToday = day.dateStr === todayStr;

                      return (
                        <div key={day.dateStr} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-neutral-400 font-medium">{day.label}</span>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              completed
                                ? 'bg-emerald-500 text-neutral-950 font-bold'
                                : isToday
                                ? 'border border-dashed border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800/40'
                                : 'bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400'
                            }`}
                          >
                            {completed && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Best: <strong className="text-neutral-700 dark:text-neutral-300">{habit.bestStreak} days</strong>
                </span>
                <button
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isDoneToday
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm'
                  }`}
                >
                  {isDoneToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Logged Today (+{habit.xp || 25} XP)
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Complete Today (+{habit.xp || 25} XP)
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Initialize Atomic Habit</h2>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Ritual Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 30 Minutes Deep Technical Reading"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                >
                  <option value="Productivity">Productivity</option>
                  <option value="Skill">Skill</option>
                  <option value="Health">Health</option>
                  <option value="Language">Language</option>
                  <option value="Trading">Trading</option>
                  <option value="Mindfulness">Mindfulness</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Activate Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
