import React from 'react';
import { RoutePath, HabitItem, GoalItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Plus, Calendar, Flame, AlertTriangle, Target, CheckCircle2 } from 'lucide-react';

interface GreetingHeaderProps {
  onNavigate: (path: RoutePath) => void;
  onAddTaskClick: () => void;
  habits?: HabitItem[];
  goals?: GoalItem[];
}

export function GreetingHeader({ onNavigate, onAddTaskClick, habits = [], goals = [] }: GreetingHeaderProps) {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const pendingStreaksAtRisk = habits.filter((h) => !h.completedToday && (h.currentStreak || 0) >= 3);
  const activeGoalsCount = goals.filter((g) => !g.completed).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 lg:p-6 shadow-xs">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentDate}</span>
          </div>
          <span>•</span>
          <span className="text-emerald-500 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Command Center Active
          </span>
          {pendingStreaksAtRisk.length > 0 && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-mono text-[11px] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                <Flame className="w-3 h-3 fill-current" />
                {pendingStreaksAtRisk.length} Streak{pendingStreaksAtRisk.length > 1 ? 's' : ''} at risk
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
          {getGreeting()}, {user?.name || 'Operator'}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
          Operating at <strong className="text-neutral-800 dark:text-neutral-200">Level {user?.level || 1} ({user?.title || 'Initiate'})</strong> with {activeGoalsCount} active strategic horizons. Execute high-gravity deliverables to sustain momentum.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => onNavigate('/ai')}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Ask AI Coach</span>
        </button>

        <button
          onClick={() => onNavigate('/goals')}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-bold transition-all"
        >
          <Target className="w-4 h-4 text-indigo-500" />
          <span>Strategic Goals</span>
        </button>

        <button
          onClick={onAddTaskClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Task</span>
        </button>
      </div>
    </div>
  );
}
