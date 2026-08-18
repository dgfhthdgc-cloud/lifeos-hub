import React, { useState } from 'react';
import { SyndicateLeaderboardEntry } from '../../types';
import { Trophy, TrendingUp, TrendingDown, Minus, Flame, Swords, Zap, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SyndicateLeaderboardProps {
  entries: SyndicateLeaderboardEntry[];
}

export function SyndicateLeaderboard({ entries }: SyndicateLeaderboardProps) {
  const [filter, setFilter] = useState<'xp' | 'boss' | 'habits' | 'trading'>('xp');

  const sortedEntries = [...entries].sort((a, b) => {
    if (filter === 'boss') return b.bossDamage - a.bossDamage;
    if (filter === 'habits') return b.habitConsistencyRate - a.habitConsistencyRate;
    if (filter === 'trading') return (b.tradingSharpe || 0) - (a.tradingSharpe || 0);
    return b.weeklyXp - a.weeklyXp;
  });

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Global Syndicate Leaderboard
            </h3>
            <p className="text-xs text-neutral-500">Live operational ranking across all global operatives</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setFilter('xp')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              filter === 'xp'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            )}
          >
            Weekly XP
          </button>
          <button
            onClick={() => setFilter('boss')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              filter === 'boss'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            )}
          >
            Boss Slayer
          </button>
          <button
            onClick={() => setFilter('habits')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              filter === 'habits'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            )}
          >
            Habit %
          </button>
          <button
            onClick={() => setFilter('trading')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              filter === 'trading'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            )}
          >
            Sharpe Ratio
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-2">
        {sortedEntries.map((entry, idx) => (
          <div
            key={entry.id}
            className={cn(
              'p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs',
              idx === 0
                ? 'bg-amber-500/5 border-amber-500/30'
                : idx === 1
                ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
                : 'bg-white dark:bg-neutral-900/60 border-neutral-200/70 dark:border-neutral-800'
            )}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-7 text-center font-mono font-black text-sm">
                {idx === 0 ? (
                  <span className="text-amber-500 text-base">🥇</span>
                ) : idx === 1 ? (
                  <span className="text-neutral-400 text-base">🥈</span>
                ) : idx === 2 ? (
                  <span className="text-amber-700 text-base">🥉</span>
                ) : (
                  <span className="text-neutral-400">#{idx + 1}</span>
                )}
              </div>

              <img
                src={entry.avatarUrl}
                alt={entry.name}
                className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              />

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {entry.name}
                  </span>
                  {entry.guildTag && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      [{entry.guildTag}]
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Level {entry.level} Operative
                </div>
              </div>
            </div>

            {/* Metrics column */}
            <div className="text-right font-mono flex items-center gap-4">
              <div>
                <div className="font-bold text-neutral-900 dark:text-white">
                  {filter === 'boss'
                    ? `${entry.bossDamage.toLocaleString()} DMG`
                    : filter === 'habits'
                    ? `${entry.habitConsistencyRate}% Streak`
                    : filter === 'trading'
                    ? `${entry.tradingSharpe || 0} SR`
                    : `+${entry.weeklyXp.toLocaleString()} XP`}
                </div>
                <span className="text-[10px] text-neutral-400 capitalize">
                  {filter === 'boss' ? 'Damage Output' : filter === 'habits' ? 'Consistency' : filter === 'trading' ? 'Trading Alpha' : 'Weekly Velocity'}
                </span>
              </div>

              {entry.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : entry.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
