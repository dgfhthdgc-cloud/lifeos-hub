import React from 'react';
import { HabitSummary, RoutePath } from '../../types';
import { Flame, CheckCircle2, Circle, ArrowRight, Zap, Repeat } from 'lucide-react';

interface HabitsWidgetProps {
  habits: HabitSummary[];
  onToggleHabit: (habitId: string) => void;
  onNavigate: (path: RoutePath) => void;
}

export function HabitsWidget({ habits, onToggleHabit, onNavigate }: HabitsWidgetProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Daily Habit Protocols</h2>
              <p className="text-[11px] text-neutral-400">Micro-consistency & streaks</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/habits')}
            className="text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors"
          >
            <span>All Habits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {habits.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No active habits defined. Configure your daily system!
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => onToggleHabit(habit.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  habit.completedToday
                    ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30'
                    : 'bg-neutral-50/80 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:border-orange-500/40 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="text-neutral-400 group-hover:text-orange-500 transition-colors shrink-0"
                  >
                    {habit.completedToday ? (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold tracking-tight truncate ${
                        habit.completedToday
                          ? 'text-neutral-900 dark:text-white font-bold'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                      <span>{habit.target}</span>
                      <span>•</span>
                      <span>{habit.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    <span>{habit.streak}d</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />
                    +{habit.xp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
