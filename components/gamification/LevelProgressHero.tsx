import React from 'react';
import { UserProfile } from '../../types';
import { Award, ChevronRight, Sparkles } from 'lucide-react';
import { Progress } from '../ui/Progress';
import { Storage } from '../../lib/storage';

interface LevelProgressHeroProps {
  user: UserProfile;
  onOpenRankMatrix: () => void;
}

export function LevelProgressHero({ user, onOpenRankMatrix }: LevelProgressHeroProps) {
  const nextLevelXp = Math.max(1, user.nextLevelXp || 400);
  const currentXp = Math.max(0, user.currentXp || 0);
  const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
  const unlockedPerks = Storage.getSkillPerks().filter((perk) => perk.unlocked).length;

  const getTierInfo = (level: number) => {
    if (level < 5) return { name: 'Initiate Tier', color: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20' };
    if (level < 15) return { name: 'Practitioner Tier', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (level < 30) return { name: 'Specialist Architect Tier', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    if (level < 50) return { name: 'Master Synthesist Tier', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (level < 80) return { name: 'Grandmaster Sovereign', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    return { name: 'Ascendant Polymath', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
  };

  const tier = getTierInfo(user.level);
  const xpRemaining = Math.max(0, nextLevelXp - currentXp);

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white shadow-md relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${tier.color}`}>
              {tier.name}
            </span>
            <span className="text-neutral-500 text-xs">•</span>
            <span className="text-xs text-neutral-300 font-medium">Rank Stage {Math.floor((user.level - 1) / 5) + 1}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Level {user.level}
            </h1>
            <span className="text-sm font-semibold text-neutral-300">
              {user.title || 'Initiate Polymath'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">XP Progress</span>
              <span className="text-emerald-400 font-bold">
                {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP ({xpPercent}%)
              </span>
            </div>
            <Progress value={xpPercent} className="h-2.5 bg-neutral-800" />
            <p className="text-[11px] text-neutral-400">
              {xpRemaining.toLocaleString()} XP required to reach Level {Math.min(100, user.level + 1)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Unlocked Skill Perks</p>
              <p className="text-sm font-bold text-white">{unlockedPerks}</p>
            </div>
          </div>

          <button
            onClick={onOpenRankMatrix}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Rank Tier Roadmap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
