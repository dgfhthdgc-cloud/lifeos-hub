import React from 'react';
import { AIInsightSummary, RoutePath } from '../../types';
import { Sparkles, ArrowRight, Brain, AlertTriangle, PartyPopper } from 'lucide-react';

interface AICoachInsightWidgetProps {
  insight: AIInsightSummary;
  onNavigate: (path: RoutePath) => void;
}

export function AICoachInsightWidget({ insight, onNavigate }: AICoachInsightWidgetProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'celebration':
        return <PartyPopper className="w-5 h-5 text-pink-500 shrink-0" />;
      case 'opportunity':
      default:
        return <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />;
    }
  };

  const getBorderAndBg = () => {
    switch (insight.type) {
      case 'warning':
        return 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30';
      case 'celebration':
        return 'bg-pink-500/5 dark:bg-pink-950/20 border-pink-500/30';
      case 'opportunity':
      default:
        return 'bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/30';
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${getBorderAndBg()} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm">
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              AI Life Architect Proactive Insight
            </span>
          </div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">{insight.title}</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-3xl leading-relaxed">
            {insight.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {insight.actionLabel && (
          <button
            onClick={() => onNavigate(insight.actionRoute || '/ai')}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>{insight.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onNavigate('/ai')}
          className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Consult AI Operating Partner"
        >
          <Brain className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
