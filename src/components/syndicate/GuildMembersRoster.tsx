import React from 'react';
import { GuildMember } from '../../types';
import { Shield, Swords, Zap, Crown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GuildMembersRosterProps {
  members: GuildMember[];
}

export function GuildMembersRoster({ members }: GuildMembersRosterProps) {
  if (!members || members.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <p className="text-xs text-neutral-500">No member records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
          Syndicate Squad Roster ({members.length})
        </h3>
        <span className="text-[11px] text-neutral-400">
          Ranked by Weekly Output Contribution
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((mem, idx) => (
          <div
            key={mem.id}
            className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={mem.avatarUrl}
                  alt={mem.name}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <span
                  className={cn(
                    'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900',
                    mem.status === 'online'
                      ? 'bg-emerald-500'
                      : mem.status === 'focused'
                      ? 'bg-amber-500'
                      : 'bg-neutral-400'
                  )}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {mem.name}
                  </span>
                  {mem.role === 'Leader' && (
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <span>{mem.role}</span>
                  <span>•</span>
                  <span className="capitalize text-amber-500 font-semibold">{mem.status}</span>
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{mem.weeklyXp.toLocaleString()} XP
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1 justify-end">
                <Swords className="w-3 h-3 text-red-500" />
                <span>{mem.bossDamageContribution} DMG</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
