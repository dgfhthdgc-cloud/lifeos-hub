import React from 'react';
import { GuildSyndicate } from '../../types';
import { Crown, Users, Award, Shield, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface GuildOverviewCardProps {
  guild: GuildSyndicate;
  allGuilds: GuildSyndicate[];
  onSwitchGuild: (guildId: string) => void;
}

export function GuildOverviewCard({
  guild,
  allGuilds,
  onSwitchGuild,
}: GuildOverviewCardProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-amber-500/10 via-neutral-900/5 to-purple-500/10 dark:from-amber-950/30 dark:via-neutral-900 dark:to-purple-950/30 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Crown className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                [{guild.tag}]
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {guild.name}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Rank #{guild.rank} Global
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 italic">
              "{guild.motto}"
            </p>
          </div>
        </div>

        {/* Guild Stats Trio */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[90px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Level</span>
            <div className="text-lg font-mono font-black text-amber-500">
              Lv. {guild.level}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[90px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Roster</span>
            <div className="text-lg font-mono font-black text-indigo-500">
              {guild.totalMembers} / {guild.maxMembers}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[110px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Weekly XP</span>
            <div className="text-lg font-mono font-black text-emerald-500">
              {guild.weeklyGuildXp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Active Guild Passive Perks */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Active Syndicate Synergy Perks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {guild.activePerks.map((perk, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guild Switcher / Selector */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 flex-wrap gap-2">
        <span className="text-xs text-neutral-400">
          Want to pledge allegiance to a different specialization syndicate?
        </span>
        <div className="flex items-center gap-2">
          {allGuilds.map((g) => (
            <Button
              key={g.id}
              variant={g.id === guild.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onSwitchGuild(g.id)}
              className="text-xs h-7.5 px-3"
            >
              {g.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
