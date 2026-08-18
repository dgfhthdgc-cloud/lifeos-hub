import React, { useState } from 'react';
import { HistoricalXpTrendPoint } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, CheckSquare, Flame, BookOpen, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HistoricalVelocityChartProps {
  data: HistoricalXpTrendPoint[];
}

export function HistoricalVelocityChart({ data }: HistoricalVelocityChartProps) {
  const [metricMode, setMetricMode] = useState<'xp' | 'tasks' | 'habits' | 'study' | 'trading'>('xp');

  const getMetricConfig = () => {
    switch (metricMode) {
      case 'tasks':
        return {
          dataKey: 'tasksCompleted',
          label: 'Tasks Completed',
          stroke: '#10b981',
          fill: '#10b981',
          unit: 'tasks',
        };
      case 'habits':
        return {
          dataKey: 'habitsChecked',
          label: 'Habits Checked',
          stroke: '#f59e0b',
          fill: '#f59e0b',
          unit: 'habits',
        };
      case 'study':
        return {
          dataKey: 'studyMinutes',
          label: 'Study Minutes',
          stroke: '#6366f1',
          fill: '#6366f1',
          unit: 'mins',
        };
      case 'trading':
        return {
          dataKey: 'tradingTrades',
          label: 'Disciplined Trades',
          stroke: '#ec4899',
          fill: '#ec4899',
          unit: 'trades',
        };
      default:
        return {
          dataKey: 'xp',
          label: 'Experience Points (XP)',
          stroke: '#10b981',
          fill: '#10b981',
          unit: 'XP',
        };
    }
  };

  const config = getMetricConfig();

  const totalValue = data.reduce((acc, curr) => acc + (curr[config.dataKey as keyof HistoricalXpTrendPoint] as number), 0);
  const avgDaily = Math.round(totalValue / (data.length || 1));

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Life Velocity & Output Trends
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              15-Day Rolling Window
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Track kinetic output velocity across experience gains, tasks, habits, learning, and trading execution.
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 overflow-x-auto">
          <button
            onClick={() => setMetricMode('xp')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
              metricMode === 'xp'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>XP Gain</span>
          </button>

          <button
            onClick={() => setMetricMode('tasks')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
              metricMode === 'tasks'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => setMetricMode('habits')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
              metricMode === 'habits'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Habits</span>
          </button>

          <button
            onClick={() => setMetricMode('study')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
              metricMode === 'study'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Study (Mins)</span>
          </button>

          <button
            onClick={() => setMetricMode('trading')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
              metricMode === 'trading'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <BarChart2 className="w-3.5 h-3.5 text-pink-500" />
            <span>Trades</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400 font-medium">15-Day Total</div>
          <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {totalValue.toLocaleString()} {config.unit}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400 font-medium">Daily Average</div>
          <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {avgDaily.toLocaleString()} {config.unit}/day
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400 font-medium">Peak Day</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            Aug 17 ({data[data.length - 1]?.[config.dataKey as keyof HistoricalXpTrendPoint]} {config.unit})
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400 font-medium">Kinetic Momentum</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            +18.4% WoW
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${config.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.fill} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.fill} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-neutral-200 dark:stroke-neutral-800/80"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#888888' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888888' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(23, 23, 23, 0.95)',
                borderColor: '#404040',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
              labelStyle={{ color: '#a3a3a3', marginBottom: '4px', fontWeight: 'bold' }}
              formatter={(val: number) => [`${val} ${config.unit}`, config.label]}
            />
            <Area
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.stroke}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#gradient-${config.dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
