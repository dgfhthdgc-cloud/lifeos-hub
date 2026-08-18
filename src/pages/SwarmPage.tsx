import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Bot,
  ShieldAlert,
  TrendingUp,
  Brain,
  Calendar,
  Compass,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  Sliders,
  Flame,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { SwarmAgent, SwarmAgentInsight } from '../types';

export const SwarmPage: React.FC = () => {
  const [agents, setAgents] = useState<SwarmAgent[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [promptInput, setPromptInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'agents' | 'matrix'>('insights');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAgents(storage.getSwarmAgents());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleAutonomy = (agentId: string) => {
    const updated = storage.toggleAgentAutonomy(agentId);
    if (updated) {
      loadData();
      showToast(`${updated.name} mode switched to ${updated.autonomyLevel.toUpperCase()}`);
    }
  };

  const handleApplyInsight = (insightId: string) => {
    const applied = storage.applyAgentInsight(insightId);
    if (applied) {
      loadData();
      showToast(`Action Executed: "${applied.suggestedAction}" (+100 XP awarded)`);
    }
  };

  const handleDismissInsight = (insightId: string) => {
    const dismissed = storage.dismissAgentInsight(insightId);
    if (dismissed) {
      loadData();
      showToast('Optimization insight dismissed.');
    }
  };

  const handleDispatchPrompt = (customText?: string) => {
    const textToDispatch = customText || promptInput;
    if (!textToDispatch.trim()) return;

    setIsDispatching(true);
    setTimeout(() => {
      storage.dispatchSwarmPrompt(textToDispatch);
      loadData();
      setIsDispatching(false);
      setPromptInput('');
      showToast(`Swarm completed analysis for "${textToDispatch.slice(0, 24)}..."`);
    }, 900);
  };

  const allInsights: SwarmAgentInsight[] = agents.flatMap((a) => a.insights);
  const filteredInsights = allInsights.filter((ins) => {
    if (selectedDomain === 'all') return true;
    return ins.domain === selectedDomain;
  });

  const getAgentIcon = (role: SwarmAgent['role']) => {
    switch (role) {
      case 'Sentinel':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'Oracle':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'Archivist':
        return <Brain className="w-5 h-5 text-amber-400" />;
      case 'Tactician':
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case 'Strategist':
        return <Compass className="w-5 h-5 text-purple-400" />;
      default:
        return <Bot className="w-5 h-5 text-indigo-400" />;
    }
  };

  const totalExecuted = agents.reduce((acc, a) => acc + a.actionsExecuted, 0);
  const avgAccuracy = (agents.reduce((acc, a) => acc + a.accuracyRate, 0) / (agents.length || 1)).toFixed(1);
  const activeCount = agents.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-indigo-950/95 border border-indigo-500/40 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Autonomous Agent Swarm Engine v10.4</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Neural Swarm Command
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                {activeCount} Sub-Agents Active
              </span>
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Specialized autonomous agents operating asynchronously across discipline, risk management, cognitive retention, and bio-matched schedule allocation.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xs text-slate-400 font-medium">Avg Accuracy</div>
              <div className="text-xl font-black text-emerald-400">{avgAccuracy}%</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xs text-slate-400 font-medium">Optimizations</div>
              <div className="text-xl font-black text-indigo-400">{totalExecuted}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xs text-slate-400 font-medium">Latency</div>
              <div className="text-xl font-black text-cyan-400">14ms</div>
            </div>
          </div>
        </div>

        {/* Command Dispatch Input */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDispatchPrompt()}
                placeholder="Dispatch natural language instruction to Swarm (e.g., 'Calibrate risk limits for tomorrow', 'Protect morning sleep peak')..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={() => handleDispatchPrompt()}
              disabled={isDispatching || !promptInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
            >
              {isDispatching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>Dispatch Swarm</span>
            </button>
          </div>

          {/* Quick Directive Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Quick Directives:</span>
            {[
              'Enforce 22:30 digital lockdown',
              'Scan trading journal for tilt patterns',
              'Generate 10 SRS flashcards on Distributed Consensus',
              'Align high-HRV slots with architecture tasks',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleDispatchPrompt(chip)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'insights' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Optimization Stream ({allInsights.length})
          {activeTab === 'insights' && (
            <motion.div layoutId="swarmTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'agents' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Sub-Agents ({agents.length})
          {activeTab === 'agents' && (
            <motion.div layoutId="swarmTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'matrix' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Decision Matrix & Latency
          {activeTab === 'matrix' && (
            <motion.div layoutId="swarmTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* TAB 1: INSIGHTS STREAM */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'discipline', 'trading', 'learning', 'health', 'time'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedDomain === dom
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Insights List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-5 rounded-xl border transition-all ${
                  insight.status === 'applied'
                    ? 'bg-slate-950/40 border-emerald-500/30 opacity-80'
                    : insight.status === 'dismissed'
                    ? 'bg-slate-950/30 border-slate-800/40 opacity-50'
                    : insight.impact === 'critical'
                    ? 'bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                      {insight.agentName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        insight.impact === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : insight.impact === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {insight.impact}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Conf: {insight.confidenceScore}%
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{insight.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{insight.description}</p>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium">{insight.suggestedAction}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] text-slate-500">
                    {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    {insight.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleDismissInsight(insight.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleApplyInsight(insight.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Apply & Execute</span>
                        </button>
                      </>
                    ) : insight.status === 'applied' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Optimization Applied</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Dismissed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AGENTS GRID */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {getAgentIcon(agent.role)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{agent.name}</h3>
                      <p className="text-xs text-slate-400">{agent.role} Agent</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      agent.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-medium mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Specialization</span>
                  {agent.specialization}
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Objective:</span>
                  </div>
                  <p className="text-slate-300 text-xs bg-slate-800/40 p-2 rounded border border-slate-800">
                    {agent.currentObjective}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 border-y border-slate-800/80 my-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Accuracy</span>
                    <span className="font-bold text-emerald-400">{agent.accuracyRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Optimizations</span>
                    <span className="font-bold text-indigo-400">{agent.actionsExecuted}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="capitalize">{agent.autonomyLevel}</span>
                </span>
                <button
                  onClick={() => handleToggleAutonomy(agent.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Cycle Autonomy Mode
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DECISION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Real-Time Swarm Orchestration Topology
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sub-agents broadcast low-latency state vectors over the local bus. When confidence crosses 90%, the swarm executes proactive interventions to maintain sovereign compound velocity.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Discipline & Lapsus Shielding (Sentinel)', health: '99.4%', status: 'Nominal', color: 'emerald' },
                { label: 'Portfolio Risk & Tilt Circuit (Oracle)', health: '97.2%', status: 'Nominal', color: 'emerald' },
                { label: 'Memory Retention & SRS Spaced Loop (Archivist)', health: '98.8%', status: 'Compiling', color: 'amber' },
                { label: 'Biometric Peak Synchronization (Tactician)', health: '99.1%', status: 'Nominal', color: 'emerald' },
                { label: 'Multi-Epoch Quantum Trajectory (Strategist)', health: '95.9%', status: 'Calibrated', color: 'emerald' },
              ].map((row, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-300">{row.health}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Sovereignty & Air-Gapped Autonomy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every swarm inference runs client-side with zero telemetry leakage. Neural weights and decision graphs are stored exclusively in your browser storage.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Local Bus Latency</span>
                <span className="font-mono font-bold text-cyan-400">14.2 ms</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Client Compute Footprint</span>
                <span className="font-mono font-bold text-emerald-400">0.08% CPU</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Decision Graph Checksum</span>
                <span className="font-mono text-slate-500">0x8f2a...9c41</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
