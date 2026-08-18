import React from 'react';
import { CrossDomainLifeRadarData } from '../../types';
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SynergyInsightsDeckProps {
  insights: CrossDomainLifeRadarData['insights'];
}

export function SynergyInsightsDeck({ insights }: SynergyInsightsDeckProps) {
  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              AI Cross-Domain Synergy Insights
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Causal correlations discovered between habits, cognitive velocity, study blocks, and trading discipline.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1',
                    insight.impact === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  )}
                >
                  {insight.impact === 'positive' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>{insight.impact === 'positive' ? 'Synergy Multiplier' : 'Friction Point'}</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-snug">
                {insight.title}
              </h4>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {insight.description}
              </p>
            </div>

            {/* Actionable Step Pill */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                <Lightbulb className="w-3 h-3" />
                <span>Actionable Step</span>
              </div>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                {insight.actionableStep}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
