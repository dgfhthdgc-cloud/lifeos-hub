import React, { useState, useEffect } from 'react';
import { Storage } from '../../lib/storage';
import {
  CrossDomainLifeRadarData,
  HistoricalXpTrendPoint,
  DomainDistributionPoint,
  FlowHourHeatmapPoint,
  SystemSnapshotMetadata,
  RoutePath,
} from '../../types';
import { CrossDomainRadarChart } from './CrossDomainRadarChart';
import { HistoricalVelocityChart } from './HistoricalVelocityChart';
import { DomainDistributionChart } from './DomainDistributionChart';
import { FlowStateHeatmap } from './FlowStateHeatmap';
import { SynergyInsightsDeck } from './SynergyInsightsDeck';
import { SystemDiagnosticsCard } from './SystemDiagnosticsCard';
import { BarChart3, Activity, Swords, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface AnalyticsMainViewProps {
  onNavigate?: (path: RoutePath) => void;
}

export function AnalyticsMainView({ onNavigate }: AnalyticsMainViewProps) {
  const [radarData, setRadarData] = useState<CrossDomainLifeRadarData | null>(null);
  const [trendData, setTrendData] = useState<HistoricalXpTrendPoint[]>([]);
  const [domainDist, setDomainDist] = useState<DomainDistributionPoint[]>([]);
  const [flowHeatmap, setFlowHeatmap] = useState<FlowHourHeatmapPoint[]>([]);
  const [snapshot, setSnapshot] = useState<SystemSnapshotMetadata | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setRadarData(Storage.getCrossDomainAnalytics());
    setTrendData(Storage.getHistoricalXpTrend());
    setDomainDist(Storage.getDomainDistribution());
    setFlowHeatmap(Storage.getFlowHourHeatmap());
    setSnapshot(Storage.getSystemSnapshot());
  };

  if (!radarData || !snapshot) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500">
        Loading Life OS Analytics & Cross-Domain Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Executive Hero Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-linear-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PHASE 8 • EXECUTIVE ANALYTICS
              </span>
              <span className="text-neutral-400 text-xs">•</span>
              <span className="text-xs text-neutral-300 font-medium">
                Synergy Score: {radarData.overallSynergyScore}/100
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Life OS Intelligence & Synergy Matrix
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Multi-domain performance telemetry reconciling task throughput, habit discipline, code mastery, language acquisition, and trading edge into a unified cognitive equilibrium.
            </p>
          </div>

          {/* Quick Action Jumps */}
          {onNavigate && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/bosses')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                <Swords className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Boss Raids</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('/perks')}
                className="text-xs"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Skill Perk Tree</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 1. Cross-Domain Life Synergy Radar */}
      <CrossDomainRadarChart
        metrics={radarData.metrics}
        overallScore={radarData.overallSynergyScore}
        synergyTier={radarData.synergyTier}
      />

      {/* 2. Historical Output Velocity Trend */}
      <HistoricalVelocityChart data={trendData} />

      {/* 3. Distribution & Flow Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DomainDistributionChart data={domainDist} />
        </div>
        <div className="lg:col-span-6">
          <FlowStateHeatmap data={flowHeatmap} />
        </div>
      </div>

      {/* 4. AI Cross-Domain Synergy Insights */}
      <SynergyInsightsDeck insights={radarData.insights} />

      {/* 5. System Snapshot & Diagnostics */}
      <SystemDiagnosticsCard snapshot={snapshot} onRefresh={loadAnalytics} />
    </div>
  );
}
