import React, { useState } from 'react';
import { DomainRadarMetric } from '../../types';
import { Shield, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CrossDomainRadarChartProps {
  metrics: DomainRadarMetric[];
  overallScore: number;
  synergyTier: string;
}

export function CrossDomainRadarChart({
  metrics,
  overallScore,
  synergyTier,
}: CrossDomainRadarChartProps) {
  const [selectedPillarKey, setSelectedPillarKey] = useState<string>(metrics[0]?.domainKey || 'execution');

  const selectedMetric = metrics.find((m) => m.domainKey === selectedPillarKey) || metrics[0];

  // Radar geometry math for SVG polygon
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const totalSides = metrics.length || 6;
  const angleStep = (Math.PI * 2) / totalSides;

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // User polygon points
  const userPolygonPoints = metrics
    .map((m, i) => {
      const ratio = Math.max(0.15, Math.min(1, m.score / 100));
      const pt = getCoordinates(i, ratio);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  // Benchmark polygon points
  const benchmarkPolygonPoints = metrics
    .map((m, i) => {
      const ratio = Math.max(0.15, Math.min(1, m.benchmark / 100));
      const pt = getCoordinates(i, ratio);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  // Web levels (25%, 50%, 75%, 100%)
  const webLevels = [0.25, 0.5, 0.75, 1.0];

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'transcendent':
        return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'optimal':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'balanced':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'A':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30';
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Cross-Domain Life Synergy Radar
            </h3>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                getTierColor(synergyTier)
              )}
            >
              {synergyTier} Synergy ({overallScore}/100)
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Holistic equilibrium calculated across execution, habit consistency, strategy, intellect, languages, and market discipline.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-emerald-500/40 border border-emerald-500" />
            <span className="font-medium">Active Life Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-neutral-400 border-dashed" />
            <span className="text-neutral-400">Target Benchmark</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Radar Chart Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative select-none">
          <div className="relative w-[320px] h-[320px] max-w-full">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
              {/* Radial Web background circles */}
              {webLevels.map((lvl, idx) => (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius * lvl}
                  className="stroke-neutral-200 dark:stroke-neutral-800 fill-none"
                  strokeWidth="1"
                  strokeDasharray={idx === webLevels.length - 1 ? 'none' : '2,3'}
                />
              ))}

              {/* Radial Axes */}
              {metrics.map((_, i) => {
                const pt = getCoordinates(i, 1.0);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={pt.x}
                    y2={pt.y}
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Target Benchmark Polygon */}
              <polygon
                points={benchmarkPolygonPoints}
                className="fill-neutral-400/5 stroke-neutral-400/60 dark:stroke-neutral-600"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* User Live Performance Polygon */}
              <polygon
                points={userPolygonPoints}
                className="fill-emerald-500/25 stroke-emerald-500 dark:fill-emerald-400/20 dark:stroke-emerald-400 transition-all duration-500 ease-out"
                strokeWidth="2"
              />

              {/* Metric Vertices */}
              {metrics.map((m, i) => {
                const ratio = Math.max(0.15, Math.min(1, m.score / 100));
                const pt = getCoordinates(i, ratio);
                const isSelected = m.domainKey === selectedPillarKey;

                return (
                  <g
                    key={m.domainKey}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPillarKey(m.domainKey)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      className={cn(
                        'transition-all duration-300',
                        isSelected
                          ? 'fill-emerald-400 stroke-white dark:stroke-neutral-900 stroke-2'
                          : 'fill-emerald-500 stroke-transparent'
                      )}
                    />
                  </g>
                );
              })}

              {/* Pillar Labels around circumference */}
              {metrics.map((m, i) => {
                const labelPt = getCoordinates(i, 1.22);
                const isSelected = m.domainKey === selectedPillarKey;

                return (
                  <text
                    key={m.domainKey}
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    onClick={() => setSelectedPillarKey(m.domainKey)}
                    className={cn(
                      'text-[11px] font-semibold transition-all cursor-pointer select-none',
                      isSelected
                        ? 'fill-emerald-600 dark:fill-emerald-400 font-bold scale-105'
                        : 'fill-neutral-600 dark:fill-neutral-400 hover:fill-neutral-900 dark:hover:fill-white'
                    )}
                  >
                    {m.pillar.split(' ')[0]} ({m.score})
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Pillar Detailed Sub-metrics Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border font-mono',
                    getGradeBadgeColor(selectedMetric.grade)
                  )}
                >
                  {selectedMetric.grade}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {selectedMetric.pillar}
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Domain Key: <span className="font-mono text-emerald-500 uppercase">{selectedMetric.domainKey}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedMetric.score}%
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  Benchmark: {selectedMetric.benchmark}%
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {selectedMetric.summary}
            </p>

            {/* Primary KPI */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 font-medium">
                {selectedMetric.primaryMetricLabel}
              </span>
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                {selectedMetric.primaryMetricValue}
              </span>
            </div>

            {/* Submetric list */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Pillar Health Indicators
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedMetric.submetrics.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-left"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-neutral-400 truncate">
                        {sub.label}
                      </span>
                      {sub.status === 'optimal' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : sub.status === 'good' ? (
                        <TrendingUp className="w-3 h-3 text-blue-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200">
                      {sub.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Domain Switcher Pills */}
          <div className="flex flex-wrap gap-1.5">
            {metrics.map((m) => {
              const active = m.domainKey === selectedPillarKey;
              return (
                <button
                  key={m.domainKey}
                  onClick={() => setSelectedPillarKey(m.domainKey)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
                    active
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent font-bold shadow-2xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {m.pillar.split(' ')[0]} ({m.score})
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
