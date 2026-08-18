import React, { useState, useEffect } from 'react';
import { GoalItem, FiveYearPillar } from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Target, Plus, CheckCircle2, Circle, Trophy, Calendar, Sparkles, TrendingUp, Layers } from 'lucide-react';
import { Progress } from '../ui/Progress';

export function GoalsView() {
  const { addXp } = useAuth();
  const { showToast } = useNotifications();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [pillars, setPillars] = useState<FiveYearPillar[]>([]);
  const [activeTab, setActiveTab] = useState<'quarterly' | 'pillars'>('quarterly');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Engineering');
  const [newQuarter, setNewQuarter] = useState<string>('Q3 2026');
  const [newTargetMetric, setNewTargetMetric] = useState('100% Complete');

  useEffect(() => {
    setGoals(Storage.getGoals());
    setPillars(Storage.getFiveYearPlan());
  }, []);

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    const res = Storage.toggleGoalMilestone(goalId, milestoneId);
    if (res.goal) {
      setGoals(Storage.getGoals());
      if (res.xpAwarded > 0) {
        addXp(res.xpAwarded, `Goal milestone achieved: ${res.goal.title}`);
        showToast(`Milestone completed! +${res.xpAwarded} XP`, 'success');
      }
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory as any,
      quarter: newQuarter as any,
      targetMetric: newTargetMetric.trim(),
      progress: 0,
      xpReward: 200,
      completed: false,
      milestones: [
        { id: `ms-${Date.now()}-1`, title: 'Define scope and technical milestones', completed: false, xpReward: 50 },
        { id: `ms-${Date.now()}-2`, title: 'Midpoint execution & performance benchmark', completed: false, xpReward: 75 },
        { id: `ms-${Date.now()}-3`, title: 'Final deployment and retrospective', completed: false, xpReward: 75 },
      ],
      createdAt: new Date().toISOString(),
    };

    const updated = [newGoal, ...goals];
    Storage.setGoals(updated);
    setGoals(updated);
    setShowAddGoalModal(false);
    setNewTitle('');
    setNewDescription('');
    showToast('New tactical goal established', 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-emerald-500" />
            Strategic Goals & Pillars
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Multi-horizon objective tracking spanning quarterly targets and 5-year pillars
          </p>
        </div>
        <button
          onClick={() => setShowAddGoalModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Establish Goal
        </button>
      </div>

      {/* Horizon Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('quarterly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'quarterly'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Quarterly Horizons ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('pillars')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pillars'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          5-Year Strategic Pillars ({pillars.length})
        </button>
      </div>

      {activeTab === 'quarterly' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;
            const progress = goal.milestones.length > 0 ? Math.round((completedMilestones / goal.milestones.length) * 100) : goal.progress;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {goal.quarter || 'Current Quarter'}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          {goal.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">{goal.title}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-500 shrink-0">
                      +{goal.xpReward || 200} XP
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-500">Milestones: {completedMilestones}/{goal.milestones.length}</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  {/* Milestones List */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-semibold uppercase text-neutral-400">Milestone Checkpoints</div>
                    {goal.milestones.map((ms) => (
                      <button
                        key={ms.id}
                        onClick={() => handleToggleMilestone(goal.id, ms.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs bg-neutral-50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {ms.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
                          )}
                          <span className={ms.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}>
                            {ms.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-mono font-medium">
                          +{ms.xpReward || 50} XP
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span>Target: {goal.targetMetric || '100%'}</span>
                  <span>{progress === 100 ? '✅ Target Achieved' : 'In Progress'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    5-Year Horizon
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">{pillar.name}</h3>
                </div>
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{pillar.description}</p>

              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold uppercase text-neutral-400">Pillar Target Metrics</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                    <div className="text-[10px] text-neutral-400 uppercase">Current Baseline</div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">{pillar.currentMetric}</div>
                  </div>
                  <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Target Horizon</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{pillar.targetMetric}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Establish Strategic Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Distributed Consensus Algorithms"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe desired outcomes and success criteria..."
                  rows={2}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Quarter</label>
                  <select
                    value={newQuarter}
                    onChange={(e) => setNewQuarter(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Q1 2027">Q1 2027</option>
                    <option value="Q2 2027">Q2 2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Learning">Learning</option>
                    <option value="Trading">Trading</option>
                    <option value="Language">Language</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
