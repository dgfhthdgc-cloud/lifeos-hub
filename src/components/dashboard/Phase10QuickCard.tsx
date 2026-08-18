import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Compass,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { storage } from '../../lib/storage';

interface Phase10QuickCardProps {
  onNavigate: (path: RoutePath) => void;
}

export const Phase10QuickCard: React.FC<Phase10QuickCardProps> = ({ onNavigate }) => {
  const [agentsCount, setAgentsCount] = useState(5);
  const [projectedWorth, setProjectedWorth] = useState(660000);
  const [milestonesCount, setMilestonesCount] = useState(5);

  useEffect(() => {
    try {
      const agents = storage.getSwarmAgents();
      setAgentsCount(agents.length || 5);
      const sim = storage.getSimulationModel();
      setProjectedWorth(sim?.projectedOutcomes?.netWorth || 660000);
      const ms = storage.getEpochMilestones();
      setMilestonesCount(ms.length || 5);
    } catch {
      // fallback to initial defaults
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Swarm Command Hub */}
      <div
        onClick={() => onNavigate('/swarm')}
        className="group p-4 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Neural Swarm
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
            {agentsCount} Sub-Agents
          </span>
        </div>

        <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors mb-1">
          Autonomous AI Swarm Console
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Asynchronous proactive agents continuously optimizing habits, calendar, and trading risk.
        </p>

        <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          <span>Dispatch & Command</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 2. Quantum Life Simulator */}
      <div
        onClick={() => onNavigate('/simulator')}
        className="group p-4 rounded-xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Life Simulator
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
            Monte Carlo
          </span>
        </div>

        <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors mb-1">
          Quantum Trajectory Forecast
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Multi-variable scenario modeling: projected <span className="text-emerald-400 font-bold">${projectedWorth.toLocaleString()}</span> wealth & biological age offset.
        </p>

        <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
          <span>Model Scenarios</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3. Sovereign Vault & Codex */}
      <div
        onClick={() => onNavigate('/vault')}
        className="group p-4 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Legacy Vault
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
            {milestonesCount} Milestones
          </span>
        </div>

        <div className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors mb-1">
          Epoch Codex & Zero-Knowledge Archive
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Multi-year milestone codex, encrypted offline JSON/HTML backups, and 100% data sovereignty.
        </p>

        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
          <span>Open Legacy Codex</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
