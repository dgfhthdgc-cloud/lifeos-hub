import React from 'react';
import { StreakSystemData } from '../../types';
import { Storage } from '../../lib/storage';
import { Flame, Shield, Snowflake, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface StreakShieldManagerProps {
  streakData: StreakSystemData;
  onUpdate: (updated: StreakSystemData) => void;
}

export function StreakShieldManager({ streakData, onUpdate }: StreakShieldManagerProps) {
  const handleToggleFreeze = () => {
    Storage.toggleStreakFreeze();
    onUpdate(Storage.getStreakData());
  };

  const handleRefill = () => {
    const updated = Storage.refillStreakShields();
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Counter */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-orange-500/10 via-white dark:via-neutral-900 to-white dark:to-neutral-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-neutral-400">Current Velocity</span>
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-500">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-neutral-900 dark:text-white">
              {streakData.currentStreak}
            </span>
            <span className="text-sm font-bold text-orange-500">Days Active</span>
          </div>
          <p className="text-xs text-neutral-400">
            Personal Best: <strong className="text-neutral-700 dark:text-neutral-200">{streakData.bestStreak} Days</strong>
          </p>
        </div>

        {/* Multiplier */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-amber-500/10 via-white dark:via-neutral-900 to-white dark:to-neutral-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-neutral-400">XP Streak Multiplier</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-500">
              {streakData.multiplier}x
            </span>
            <span className="text-xs font-semibold text-neutral-400">Bonus Yield</span>
          </div>
          <p className="text-xs text-neutral-400">
            All tasks, habits, and lessons receive a +{Math.round((streakData.multiplier - 1) * 100)}% reward.
          </p>
        </div>

        {/* Shields Active */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-blue-500/10 via-white dark:via-neutral-900 to-white dark:to-neutral-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-neutral-400">Streak Shields</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-neutral-900 dark:text-white">
              {streakData.streakShields} / {streakData.maxShields}
            </span>
            <span className="text-xs font-semibold text-blue-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFreeze}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                streakData.freezeActive
                  ? 'bg-cyan-500 text-neutral-950'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{streakData.freezeActive ? 'Freeze Shield Active' : 'Engage 24h Freeze'}</span>
            </button>
            <button
              onClick={handleRefill}
              className="p-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              title="Refill Shields"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Streak Milestones Roadmap */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
          Consistency Milestone Roadmap
        </h3>
        <div className="space-y-3">
          {streakData.milestones.map((milestone) => (
            <div
              key={milestone.days}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                milestone.reached
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    milestone.reached
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {milestone.days}d
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {milestone.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400">{milestone.perkDescription}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-500">
                  +{milestone.xpReward} XP
                </span>
                {milestone.reached ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <span className="text-[11px] text-neutral-400 font-medium">Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
