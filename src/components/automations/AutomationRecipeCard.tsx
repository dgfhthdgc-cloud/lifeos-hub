import React from 'react';
import { LifeAutomationRule } from '../../types';
import {
  Swords,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Clock,
  ArrowRight,
  Play,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface AutomationRecipeCardProps {
  key?: React.Key;
  rule: LifeAutomationRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTestRun?: (rule: LifeAutomationRule) => void;
}

export function AutomationRecipeCard({
  rule,
  onToggle,
  onDelete,
  onTestRun,
}: AutomationRecipeCardProps) {
  const getIcon = () => {
    switch (rule.iconName) {
      case 'Swords':
        return <Swords className="w-4 h-4 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-sky-500" />;
      case 'Clock':
      default:
        return <Clock className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getCategoryBadge = () => {
    switch (rule.category) {
      case 'execution':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'discipline':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'trading':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'learning':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'health':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
  };

  return (
    <div
      className={cn(
        'p-5 rounded-2xl border transition-all space-y-4 bg-white dark:bg-neutral-900/80',
        rule.enabled
          ? 'border-neutral-200/80 dark:border-neutral-800 shadow-xs'
          : 'border-neutral-200/40 dark:border-neutral-800/40 opacity-75'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {rule.title}
              </h3>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  getCategoryBadge()
                )}
              >
                {rule.category}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {rule.description}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(rule.id)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
            rule.enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
              rule.enabled ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Logic Pipeline Chips */}
      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs flex-wrap font-mono">
        <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
          <span className="text-[10px] font-bold uppercase text-amber-500">IF:</span>
          <span className="font-sans font-medium">{rule.trigger.label}</span>
        </div>

        {rule.condition && (
          <>
            <span className="text-neutral-400">&</span>
            <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
              <span className="text-[10px] font-bold uppercase text-indigo-500">WHEN:</span>
              <span className="font-sans font-medium">{rule.condition.label}</span>
            </div>
          </>
        )}

        <ArrowRight className="w-3 h-3 text-neutral-400" />

        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="text-[10px] font-bold uppercase text-emerald-500 font-mono">THEN:</span>
          <span className="font-sans font-bold">{rule.action.label}</span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            Triggered <strong className="text-neutral-700 dark:text-neutral-300">{rule.runCount}</strong> times
          </span>
          {rule.lastTriggeredAt && (
            <span>• Last: {new Date(rule.lastTriggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onTestRun && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTestRun(rule)}
              className="text-[11px] h-7 px-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <Play className="w-3 h-3 mr-1 text-emerald-500" /> Test Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule.id)}
            className="text-[11px] h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
