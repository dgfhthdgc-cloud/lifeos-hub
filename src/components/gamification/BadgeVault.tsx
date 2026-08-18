import React, { useState } from 'react';
import { AchievementBadge, BadgeCategory, BadgeTier } from '../../types';
import { Award, Lock, Sparkles, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Progress } from '../ui/Progress';

interface BadgeVaultProps {
  badges: AchievementBadge[];
}

export function BadgeVault({ badges }: BadgeVaultProps) {
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | 'all'>('all');

  const filteredBadges = filterCategory === 'all'
    ? badges
    : badges.filter((b) => b.category === filterCategory);

  const getTierColor = (tier: BadgeTier) => {
    switch (tier) {
      case 'mythic':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'diamond':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'gold':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'silver':
        return 'text-neutral-300 bg-neutral-400/10 border-neutral-400/30';
      case 'bronze':
      default:
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
            Achievement Trophy Vault ({unlockedCount}/{badges.length} Unlocked)
          </h2>
          <p className="text-xs text-neutral-400">Milestones of mastery, discipline, focus, and polymathic craft</p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'mastery', 'discipline', 'consistency', 'knowledge', 'wealth', 'focus', 'special'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const progressPercent = Math.min(100, Math.round((badge.progress / (badge.maxProgress || 1)) * 100));

          return (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                badge.unlocked
                  ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 shadow-sm'
                  : 'bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                      badge.unlocked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : 'bg-neutral-200/50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {badge.unlocked ? (
                      <Award className="w-6 h-6" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${getTierColor(badge.tier)}`}>
                    {badge.tier}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {badge.unlocked ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked {badge.unlockedAt ? `(${badge.unlockedAt})` : ''}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-500">+{badge.xpReward} XP</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Progress</span>
                      <span>{badge.progress}/{badge.maxProgress}</span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
