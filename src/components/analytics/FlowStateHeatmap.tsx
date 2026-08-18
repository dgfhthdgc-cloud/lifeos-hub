import React from 'react';
import { FlowHourHeatmapPoint } from '../../types';
import { Clock, Zap, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FlowStateHeatmapProps {
  data: FlowHourHeatmapPoint[];
}

export function FlowStateHeatmap({ data }: FlowStateHeatmapProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'peak':
        return 'bg-emerald-500 text-neutral-950 font-bold shadow-xs';
      case 'high':
        return 'bg-emerald-500/70 text-white';
      case 'medium':
        return 'bg-emerald-500/35 text-neutral-800 dark:text-neutral-200';
      case 'low':
        return 'bg-emerald-500/15 text-neutral-500';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400';
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              24-Hour Cognitive Flow Heatmap
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Peak: 09:00 – 11:30 AM
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Diurnal energy curve mapping deep work intensity and task throughput by time of day.
          </p>
        </div>
        <Clock className="w-4 h-4 text-emerald-500" />
      </div>

      {/* Hourly blocks grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2">
        {data.map((point) => (
          <div
            key={point.hour}
            className="flex flex-col items-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 text-center"
          >
            <span className="text-[10px] font-mono text-neutral-400 mb-1.5 flex items-center gap-1">
              {point.hour < 12 ? (
                <Sun className="w-2.5 h-2.5 text-amber-500" />
              ) : (
                <Moon className="w-2.5 h-2.5 text-indigo-400" />
              )}
              {point.label}
            </span>

            <div
              className={cn(
                'w-full py-1.5 rounded-lg text-xs font-mono transition-all',
                getIntensityColor(point.intensity)
              )}
            >
              {point.focusUnits}%
            </div>

            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 mt-1">
              {point.intensity}
            </span>
          </div>
        ))}
      </div>

      {/* Insight Footer */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
        <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          <strong>Biometric Flow Recommendation:</strong> Schedule your most demanding code architecture and language drills in the 09:00–11:00 AM window for maximum retention and output velocity.
        </span>
      </div>
    </div>
  );
}
