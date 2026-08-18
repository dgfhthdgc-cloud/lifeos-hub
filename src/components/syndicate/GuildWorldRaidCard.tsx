import React, { useState } from 'react';
import { GuildWorldRaid } from '../../types';
import { Skull, Swords, Zap, Gift, Clock, ShieldAlert, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface GuildWorldRaidCardProps {
  raid: GuildWorldRaid;
  onAttack: (dmg: number) => void;
}

export function GuildWorldRaidCard({ raid, onAttack }: GuildWorldRaidCardProps) {
  const [isAttacking, setIsAttacking] = useState(false);
  const hpPercent = Math.max(0, Math.round((raid.currentHp / raid.maxHp) * 100));

  const handleStrike = () => {
    setIsAttacking(true);
    const damage = Math.floor(Math.random() * 250) + 350; // 350 - 600 damage
    setTimeout(() => {
      onAttack(damage);
      setIsAttacking(false);
    }, 400);
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 animate-pulse-subtle">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 uppercase">
                Global World Raid
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Expires in {raid.expiresInDays} days
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {raid.name}
            </h3>
            <p className="text-xs text-neutral-500">{raid.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleStrike}
            disabled={isAttacking || raid.currentHp <= 0}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            <Swords className={cn('w-4 h-4 mr-1.5', isAttacking && 'animate-spin')} />
            {isAttacking ? 'Executing Strike...' : 'Syndicate Focus Strike'}
          </Button>
        </div>
      </div>

      {/* World Boss HP Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Community Raid Vitality
          </span>
          <span className="font-bold text-neutral-900 dark:text-white">
            {raid.currentHp.toLocaleString()} / {raid.maxHp.toLocaleString()} HP ({hpPercent}%)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              hpPercent < 25 ? 'bg-red-600' : hpPercent < 60 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Community Contribution & Rewards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Community Damage Dealt</span>
            <div className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
              {raid.communityDamageTotal.toLocaleString()} DMG Logged
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Cooperative Bounty</span>
            <div className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
              +{raid.rewards.collectiveXpBonus} Guild XP • {raid.rewards.exclusiveBadge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
