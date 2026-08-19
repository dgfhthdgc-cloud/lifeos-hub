import React, { useState } from 'react';
import { NextBestAction, RoutePath } from '../../types';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Flame,
  Target,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface NextBestActionWidgetProps {
  actions: NextBestAction[];
  onNavigate: (path: RoutePath) => void;
  onExecutePrimary?: (action: NextBestAction) => void;
}

export function NextBestActionWidget({
  actions,
  onNavigate,
  onExecutePrimary,
}: NextBestActionWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!actions || actions.length === 0) return null;

  const currentAction = actions[selectedIndex] || actions[0];

  const getUrgencyBadge = (urgency: NextBestAction['urgency']) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Critical Action
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Zap className="w-3 h-3" /> High Impact
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Target className="w-3 h-3" /> Strategic
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Recommended
          </span>
        );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-linear-to-br from-white via-emerald-50/20 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 p-5 md:p-6 shadow-sm">
      {/* Decorative backdrop glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-black shadow-sm">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
                Next Best Action
              </h2>
              {getUrgencyBadge(currentAction.urgency)}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Deterministic priority engine based on active goals, deadlines, and streak health
            </p>
          </div>
        </div>

        {/* Action Candidate Tabs */}
        {actions.length > 1 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-neutral-200/50 dark:bg-neutral-800/80 p-1 rounded-xl">
            {actions.map((act, idx) => (
              <button
                key={act.id}
                onClick={() => setSelectedIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedIndex === idx
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                #{idx + 1} {act.type === 'habit' ? 'Habit' : act.type === 'milestone' ? 'Goal' : 'Task'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Action Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Details & Trigger */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <span>CANONICAL PRIORITY SCORE: {currentAction.priorityScore}/100</span>
              {currentAction.estimatedMinutes && (
                <span>• ~{currentAction.estimatedMinutes} mins</span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {currentAction.title}
            </h3>
            {currentAction.subtitle && (
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                {currentAction.subtitle}
              </p>
            )}
          </div>

          {/* Streak Risk Callout if applicable */}
          {currentAction.streakRisk && currentAction.streakRisk.currentStreak > 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
              <Flame className="w-4 h-4 text-orange-500 shrink-0 fill-current" />
              <p>
                <strong className="font-bold">Streak Protection Active:</strong> Checking this today secures your {currentAction.streakRisk.currentStreak}-day streak and protects against shield depletion.
              </p>
            </div>
          )}

          {/* Rationale & Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                Why this matters now
              </span>
              <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                {currentAction.why}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                Downstream Ripple Impact
              </span>
              <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                {currentAction.strategicImpact}
              </p>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onExecutePrimary) {
                  onExecutePrimary(currentAction);
                } else {
                  onNavigate(currentAction.targetPath);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-98 cursor-pointer"
            >
              <span>Execute Action Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate(currentAction.targetPath)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer"
            >
              <span>View in {currentAction.targetPath.replace('/', '').toUpperCase() || 'PLANNER'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Strategic Recommendation Box */}
        <div className="rounded-xl p-4 bg-neutral-900 text-white dark:bg-black border border-neutral-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Strategic Context</span>
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Inference
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              "{currentAction.aiRationale}"
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-emerald-400" />
              <span>Grounded in canonical state</span>
            </span>
            <button
              onClick={() => onNavigate('/ai')}
              className="text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              Ask Coach →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
