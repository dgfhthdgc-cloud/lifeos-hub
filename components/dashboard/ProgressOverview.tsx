import React from 'react';
import { TaskSummary, HabitSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Flame, Award, Zap } from 'lucide-react';
import { Progress } from '../ui/Progress';
import { calculateStreakMultiplier } from '../../lib/gamification';

interface ProgressOverviewProps {
  tasks: TaskSummary[];
  habits: HabitSummary[];
  streakDays: number;
  xpEarnedToday: number;
}

export function ProgressOverview({ tasks, habits, streakDays, xpEarnedToday }: ProgressOverviewProps) {
  const { user } = useAuth();

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const completedHabits = habits.filter((h) => h.completedToday).length;
  const habitProgress = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  const xpPercent = user
    ? Math.min(100, Math.max(0, Math.round((user.currentXp / Math.max(1, user.nextLevelXp)) * 100)))
    : 0;
  const streakMultiplier = calculateStreakMultiplier(streakDays);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-neutral-400">Level Progression</span>
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-900 dark:text-white">Level {user?.level || 1}</span>
          <span className="text-xs text-neutral-400 font-mono">
            {user?.currentXp || 0} / {user?.nextLevelXp || 400} XP
          </span>
        </div>
        <div className="space-y-1">
          <Progress value={xpPercent} />
          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>{user?.title || 'Initiate'}</span>
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">{xpPercent}% to next</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-neutral-400">Tactical Tasks</span>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-900 dark:text-white">
            {completedTasks} / {tasks.length}
          </span>
          <span className="text-xs text-emerald-500 font-semibold">{taskProgress}% done</span>
        </div>
        <div className="space-y-1">
          <Progress value={taskProgress} indicatorClassName="bg-emerald-500" />
          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>Daily queue</span>
            <span>{tasks.length - completedTasks} remaining</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-neutral-400">Atomic Habits</span>
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-900 dark:text-white">
            {completedHabits} / {habits.length}
          </span>
          <span className="text-xs text-orange-500 font-semibold">{habitProgress}%</span>
        </div>
        <div className="space-y-1">
          <Progress value={habitProgress} indicatorClassName="bg-orange-500" />
          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>Today's rituals</span>
            <span>{habits.length - completedHabits} pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-neutral-400">Global Streak</span>
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-900 dark:text-white">{streakDays} Days</span>
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            {streakDays > 0 ? 'Active' : 'Ready'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-cyan-500/20 w-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (streakDays / 30) * 100)}%` }} />
          </div>
          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>Streak Multiplier</span>
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">{streakMultiplier.toFixed(2)}x XP</span>
          </div>
        </div>
        <div className="text-[10px] text-neutral-500">+{xpEarnedToday.toLocaleString()} XP earned today</div>
      </div>
    </div>
  );
}
