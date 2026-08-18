import React from 'react';
import { BiometricReadinessMetric } from '../../types';
import { Moon, Heart, Zap, Activity, Flame, Shield, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BiometricReadinessGaugesProps {
  metrics: BiometricReadinessMetric;
}

export function BiometricReadinessGauges({ metrics }: BiometricReadinessGaugesProps) {
  return (
    <div className="space-y-4">
      {/* Prime Peak Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-r from-sky-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-sky-950/30 dark:via-emerald-950/30 dark:to-indigo-950/30 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>Biometric Readiness Engine</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {metrics.cognitiveReadinessTier}
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {metrics.recoveryIndex}% Recovery Index
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
            Your physiological markers indicate peak neural recovery. High synaptic capacity for deep programming, mathematical reasoning, and tactical discipline.
          </p>
        </div>

        {/* Buff Multipliers */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[120px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Focus XP Multiplier</span>
            <div className="text-xl font-mono font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{metrics.focusXpMultiplier}x</span>
            </div>
            <span className="text-[10px] text-neutral-400">+50% All Tasks</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[120px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Boss Crit DMG</span>
            <div className="text-xl font-mono font-black text-red-500 mt-1 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-red-500" />
              <span>{metrics.bossCritMultiplier}x</span>
            </div>
            <span className="text-[10px] text-neutral-400">Critical Strikes</span>
          </div>
        </div>
      </div>

      {/* Metric Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">Sleep Quality</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
            {metrics.sleepScore}%
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {metrics.sleepDurationHours} hrs uninterrupted
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">Heart Rate Variability</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
            {metrics.hrvMilliseconds} ms
          </div>
          <span className="text-[11px] text-emerald-500 font-mono font-medium">
            +14% above baseline
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">Resting HR</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
            {metrics.restingHeartRateBpm} BPM
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            Optimal resting state
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">Recovery Index</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
            {metrics.recoveryIndex} / 100
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            Low autonomic strain
          </span>
        </div>
      </div>
    </div>
  );
}
