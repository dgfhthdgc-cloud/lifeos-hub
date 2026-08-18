import React from 'react';
import { AutomationExecutionLog } from '../../types';
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AutomationExecutionLogsProps {
  logs: AutomationExecutionLog[];
}

export function AutomationExecutionLogs({ logs }: AutomationExecutionLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-60" />
        <p className="text-xs text-neutral-500">No automation firings recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="p-4 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs flex items-start justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {log.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-900 dark:text-white">
                  {log.ruleTitle}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {log.status.toUpperCase()}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 font-medium">
                {log.actionTaken}
              </p>
              <p className="text-[11px] text-neutral-400">
                {log.triggerEvent} • {log.details}
              </p>
            </div>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 shrink-0 text-right">
            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
}
