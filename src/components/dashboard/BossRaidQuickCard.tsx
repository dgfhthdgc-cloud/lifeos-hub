import React from 'react';
import { RoutePath, BossBattle } from '../../types';
import { Storage } from '../../lib/storage';
import { Swords, Zap, ArrowRight, Skull, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface BossRaidQuickCardProps {
  onNavigate: (path: RoutePath) => void;
}

export function BossRaidQuickCard({ onNavigate }: BossRaidQuickCardProps) {
  const bosses = Storage.getBossBattles();
  const activeBoss = bosses.find((b) => !b.defeated) || bosses[0];
  const perkPoints = Storage.getPerkPoints();

  if (!activeBoss) return null;

  const hpPercent = Math.round((activeBoss.currentHp / activeBoss.maxHp) * 100);

  return (
    <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Active Boss Raid
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeBoss.difficulty}
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
              {activeBoss.name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-neutral-400">Skill Wallet</span>
          <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{perkPoints} SP</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono text-neutral-500">
          <span>Boss Vitality</span>
          <span className="font-bold text-neutral-900 dark:text-white">
            {activeBoss.currentHp.toLocaleString()} / {activeBoss.maxHp.toLocaleString()} HP ({hpPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              hpPercent < 25 ? 'bg-red-500' : hpPercent < 60 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-400">
          Every task completed deals real combat damage.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/bosses')}
          className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 p-0 h-auto"
        >
          Enter Raid Arena <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
