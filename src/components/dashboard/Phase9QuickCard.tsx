import React, { useState, useEffect } from 'react';
import { RoutePath, GuildSyndicate, BiometricReadinessMetric, LifeAutomationRule } from '../../types';
import { Storage } from '../../lib/storage';
import { Zap, Sliders, Crown, Activity, ArrowRight, Swords, Radio } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface Phase9QuickCardProps {
  onNavigate: (path: RoutePath) => void;
}

export function Phase9QuickCard({ onNavigate }: Phase9QuickCardProps) {
  const [guild, setGuild] = useState<GuildSyndicate | null>(null);
  const [biometrics, setBiometrics] = useState<BiometricReadinessMetric | null>(null);
  const [automations, setAutomations] = useState<LifeAutomationRule[]>([]);

  useEffect(() => {
    const guilds = Storage.getGuilds();
    setGuild(guilds.find((g) => g.isUserMember) || guilds[0] || null);
    setBiometrics(Storage.getBiometrics());
    setAutomations(Storage.getAutomations());
  }, []);

  const activeAutomationsCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Automations Widget */}
      <div
        onClick={() => onNavigate('/automations')}
        className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {activeAutomationsCount} ACTIVE
            </span>
          </div>

          <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
            Autonomous Pipelines
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-world task & habit events automatically trigger boss strikes and shield buffs.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          <span>Manage Recipes</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-amber-500" />
        </div>
      </div>

      {/* 2. Syndicate Guild Widget */}
      <div
        onClick={() => onNavigate('/syndicate')}
        className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Crown className="w-4 h-4" />
            </div>
            {guild && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Rank #{guild.rank}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-purple-500 transition-colors">
            {guild ? guild.name : 'Syndicate Guilds'}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {guild ? `World Raid: ${guild.activeWorldRaid.name} (${Math.round((guild.activeWorldRaid.currentHp / guild.activeWorldRaid.maxHp) * 100)}% HP)` : 'Join a syndicate and raid global bosses.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          <span>Guild Headquarters</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-purple-500" />
        </div>
      </div>

      {/* 3. Biometrics & Readiness Widget */}
      <div
        onClick={() => onNavigate('/integrations')}
        className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs hover:border-sky-500/40 transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Activity className="w-4 h-4" />
            </div>
            {biometrics && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {biometrics.focusXpMultiplier}x XP BUFF
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-sky-500 transition-colors">
            {biometrics ? biometrics.cognitiveReadinessTier : 'Biometric Readiness'}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {biometrics ? `${biometrics.sleepScore}% Sleep Score • ${biometrics.recoveryIndex}% Recovery Index` : 'Connect wearable telemetry.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          <span>Biometric & Webhook Hub</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-sky-500" />
        </div>
      </div>
    </div>
  );
}
