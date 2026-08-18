import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  Sliders,
  DollarSign,
  Briefcase,
  BookOpen,
  Dumbbell,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  Layers,
  ArrowUpRight,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { storage } from '../lib/storage';
import { LifeSimulationModel } from '../types';

export const SimulatorPage: React.FC = () => {
  const [model, setModel] = useState<LifeSimulationModel | null>(null);
  const [horizon, setHorizon] = useState<number>(5);

  // Form State
  const [habitRate, setHabitRate] = useState(92);
  const [deepWorkHours, setDeepWorkHours] = useState(4.5);
  const [monthlySavings, setMonthlySavings] = useState(2500);
  const [annualReturn, setAnnualReturn] = useState(11.5);
  const [learningHours, setLearningHours] = useState(1.5);
  const [exerciseDays, setExerciseDays] = useState(5);

  const [activeMetric, setActiveMetric] = useState<'wealth' | 'mastery' | 'composite'>('wealth');

  useEffect(() => {
    loadSimulation();
  }, []);

  const loadSimulation = () => {
    const data = storage.getSimulationModel();
    setModel(data);
    setHorizon(data.timeHorizonYears || 5);
    setHabitRate(data.baseParameters.habitConsistencyRate);
    setDeepWorkHours(data.baseParameters.dailyDeepWorkHours);
    setMonthlySavings(data.baseParameters.monthlySavingsRate);
    setAnnualReturn(data.baseParameters.investmentAnnualReturn);
    setLearningHours(data.baseParameters.dailyLearningHours);
    setExerciseDays(data.baseParameters.exerciseDaysPerWeek);
  };

  const handleRecalculate = (
    newParams: Partial<LifeSimulationModel['baseParameters']>,
    newHorizon: number = horizon
  ) => {
    const updated = storage.recalculateSimulation(newParams, newHorizon);
    setModel(updated);
  };

  const applyPreset = (preset: 'alpha' | 'balanced' | 'conservative') => {
    let p = {
      habitConsistencyRate: 92,
      dailyDeepWorkHours: 4.5,
      monthlySavingsRate: 2500,
      investmentAnnualReturn: 11.5,
      dailyLearningHours: 1.5,
      exerciseDaysPerWeek: 5,
    };

    if (preset === 'alpha') {
      p = {
        habitConsistencyRate: 98,
        dailyDeepWorkHours: 6.0,
        monthlySavingsRate: 4000,
        investmentAnnualReturn: 14.0,
        dailyLearningHours: 2.0,
        exerciseDaysPerWeek: 6,
      };
    } else if (preset === 'conservative') {
      p = {
        habitConsistencyRate: 78,
        dailyDeepWorkHours: 3.0,
        monthlySavingsRate: 1200,
        investmentAnnualReturn: 7.5,
        dailyLearningHours: 0.8,
        exerciseDaysPerWeek: 3,
      };
    }

    setHabitRate(p.habitConsistencyRate);
    setDeepWorkHours(p.dailyDeepWorkHours);
    setMonthlySavings(p.monthlySavingsRate);
    setAnnualReturn(p.investmentAnnualReturn);
    setLearningHours(p.dailyLearningHours);
    setExerciseDays(p.exerciseDaysPerWeek);

    handleRecalculate(p, horizon);
  };

  if (!model) return null;

  // Prepare chart dataset
  const chartData = model.trajectories.p50.map((p50Point, idx) => {
    const p10Point = model.trajectories.p10[idx] || p50Point;
    const p90Point = model.trajectories.p90[idx] || p50Point;

    return {
      year: `Year ${p50Point.year - 2026}`,
      yearLabel: `${p50Point.year}`,
      p10Wealth: p10Point.wealthScore,
      p50Wealth: p50Point.wealthScore,
      p90Wealth: p90Point.wealthScore,
      p10Mastery: p10Point.masteryScore,
      p50Mastery: p50Point.masteryScore,
      p90Mastery: p90Point.masteryScore,
      p50Vitality: p50Point.vitalityScore,
      compositeScore: p50Point.compositeLifeScore,
    };
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/40 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quantum Life Scenario Engine</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Monte Carlo Life Simulator
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Forecast multi-year compounding trajectories across wealth, skill mastery, and vitality based on daily input consistency and investment velocity.
            </p>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            {[1, 5, 10].map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setHorizon(yr);
                  handleRecalculate({}, yr);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  horizon === yr
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr}-Year Horizon
              </button>
            ))}
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold">Simulation Presets:</span>
          <button
            onClick={() => applyPreset('alpha')}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium transition-colors cursor-pointer"
          >
            Sovereign Alpha (98% Habits, $4k/mo)
          </button>
          <button
            onClick={() => applyPreset('balanced')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium transition-colors cursor-pointer"
          >
            Balanced Mastery (92% Habits, $2.5k/mo)
          </button>
          <button
            onClick={() => applyPreset('conservative')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium transition-colors cursor-pointer"
          >
            Defensive Baseline (78% Habits, $1.2k/mo)
          </button>
        </div>
      </div>

      {/* Projected Outcome Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Projected Net Worth</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${model.projectedOutcomes.netWorth.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Median p50 outcome at Year {horizon}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Skill Mastery Points</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {model.projectedOutcomes.skillMasteryPoints.toLocaleString()} XP
          </div>
          <div className="text-[11px] text-indigo-400 flex items-center gap-1 mt-1 font-medium">
            <Zap className="w-3 h-3" />
            <span>Deep work & learning compound</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Biological Age Offset</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">
            {model.projectedOutcomes.vitalityBiologicalAgeOffset} yrs
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
            <span>vs Chronological baseline</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Life Synergy Index</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {model.projectedOutcomes.lifeSynergyIndex} / 100
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-medium">
            <span>Optimal cross-domain harmonic</span>
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace: Sliders on Left, Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-4 space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Dynamic Parameters
            </h2>
            <button
              onClick={() => applyPreset('balanced')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Slider 1: Habit Consistency */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Habit Consistency</span>
              <span className="font-bold text-indigo-400">{habitRate}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={habitRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHabitRate(val);
                handleRecalculate({ habitConsistencyRate: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 2: Daily Deep Work Hours */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Daily Deep Work Hours</span>
              <span className="font-bold text-indigo-400">{deepWorkHours} hrs</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={deepWorkHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDeepWorkHours(val);
                handleRecalculate({ dailyDeepWorkHours: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 3: Monthly Savings */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Monthly DCA / Savings</span>
              <span className="font-bold text-emerald-400">${monthlySavings.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="250"
              value={monthlySavings}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMonthlySavings(val);
                handleRecalculate({ monthlySavingsRate: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Slider 4: Investment Return */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Annual Investment Return</span>
              <span className="font-bold text-emerald-400">{annualReturn}% APY</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="25.0"
              step="0.5"
              value={annualReturn}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAnnualReturn(val);
                handleRecalculate({ investmentAnnualReturn: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Slider 5: Daily Learning */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Daily Active Recall / Learning</span>
              <span className="font-bold text-amber-400">{learningHours} hrs</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.25"
              value={learningHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLearningHours(val);
                handleRecalculate({ dailyLearningHours: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Slider 6: Exercise Days */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Exercise / Training Days</span>
              <span className="font-bold text-rose-400">{exerciseDays} days/wk</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={exerciseDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                setExerciseDays(val);
                handleRecalculate({ exerciseDaysPerWeek: val });
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Trajectory Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Monte Carlo Probabilistic Trajectory</h3>
                <p className="text-xs text-slate-400">P10 (Conservative) vs P50 (Expected) vs P90 (Optimal Alpha)</p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveMetric('wealth')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeMetric === 'wealth' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wealth ($)
                </button>
                <button
                  onClick={() => setActiveMetric('mastery')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    activeMetric === 'mastery' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mastery (XP)
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(v) => (activeMetric === 'wealth' ? `$${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) =>
                      activeMetric === 'wealth'
                        ? [`$${Number(val).toLocaleString()}`, '']
                        : [`${Number(val).toLocaleString()} XP`, '']
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={activeMetric === 'wealth' ? 'p90Wealth' : 'p90Mastery'}
                    name="p90 (Optimal Alpha)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#p90Grad)"
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric === 'wealth' ? 'p50Wealth' : 'p50Mastery'}
                    name="p50 (Expected Baseline)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#p50Grad)"
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric === 'wealth' ? 'p10Wealth' : 'p10Mastery'}
                    name="p10 (Conservative / Degraded)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Quantum Trajectory Insights & Sensitivity Vectors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {model.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <ArrowUpRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
