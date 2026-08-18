import React from 'react';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Plus, Calendar, Compass } from 'lucide-react';

interface GreetingHeaderProps {
  onNavigate: (path: RoutePath) => void;
  onAddTaskClick: () => void;
}

export function GreetingHeader({ onNavigate, onAddTaskClick }: GreetingHeaderProps) {
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{currentDate}</span>
          <span>•</span>
          <span className="text-emerald-500 font-mono">System Online</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mt-1">
          {getGreeting()}, {user?.name || 'Operator'}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Life OS Intelligence Matrix is primed. Compounding execution routines are in sync.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => onNavigate('/simulator')}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-bold transition-all shadow-sm"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Simulator</span>
        </button>
        <button
          onClick={onAddTaskClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Task</span>
        </button>
      </div>
    </div>
  );
}
