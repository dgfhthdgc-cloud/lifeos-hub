import React from 'react';
import { DomainDistributionPoint } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';

interface DomainDistributionChartProps {
  data: DomainDistributionPoint[];
}

export function DomainDistributionChart({ data }: DomainDistributionChartProps) {
  const totalXp = data.reduce((acc, curr) => acc + curr.xp, 0);

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Domain Energy Allocation
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {totalXp.toLocaleString()} Total XP
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Breakdown of cognitive focus and achievement points across life disciplines.
          </p>
        </div>
        <Layers className="w-4 h-4 text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Recharts Pie */}
        <div className="sm:col-span-5 h-48 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23, 23, 23, 0.95)',
                  borderColor: '#404040',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val: number) => [`${val} XP`, 'Earned']}
              />
              <Pie
                data={data}
                dataKey="xp"
                nameKey="name"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total</span>
            <span className="text-sm font-black font-mono text-neutral-900 dark:text-white">
              {totalXp.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend bars */}
        <div className="sm:col-span-7 space-y-2.5">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-neutral-500">{item.xp.toLocaleString()} XP</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {item.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
