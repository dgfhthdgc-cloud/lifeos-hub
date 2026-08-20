import React, { useState, useEffect } from 'react';
import { GoalItem, FiveYearPillar, RoutePath } from '../../types';
import { Storage } from '../../lib/storage';
import { syncManager } from '../../lib/SyncManager';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trophy,
  Calendar,
  Sparkles,
  TrendingUp,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
  GraduationCap,
} from 'lucide-react';
import { Progress } from '../ui/Progress';
import { GoalMissionControlModal } from './GoalMissionControlModal';

interface GoalsViewProps {
  onNavigate?: (path: RoutePath) => void;
}

export function GoalsView({ onNavigate = () => {} }: GoalsViewProps) {
  const { isAuthenticated, isDemoMode, setAuthoritativeUser, addXp } = useAuth();
  const { showToast } = useNotifications();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [pillars, setPillars] = useState<FiveYearPillar[]>([]);
  const [activeTab, setActiveTab] = useState<'quarterly' | 'pillars'>('quarterly');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [selectedGoalForMissionControl, setSelectedGoalForMissionControl] = useState<GoalItem | null>(null);

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

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    if (isAuthenticated && !isDemoMode) {
      // Calculate optimistic progress
      const targetMilestone = goal.milestones.find((m) => m.id === milestoneId);
      const isCompleting = !targetMilestone?.completed;
      const updatedMilestones = goal.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: isCompleting } : m
      );
      const compCount = updatedMilestones.filter((m) => m.completed).length;
      const calcProgress = Math.round((compCount / updatedMilestones.length) * 100);

      const optimisticGoal: GoalItem = {
        ...goal,
        milestones: updatedMilestones,
        progress: calcProgress,
        completed: calcProgress === 100,
      };

      const optimisticGoals = goals.map((g) => (g.id === goalId ? optimisticGoal : g));
      setGoals(optimisticGoals);
      if (selectedGoalForMissionControl?.id === goalId) {
        setSelectedGoalForMissionControl(optimisticGoal);
      }

      try {
        const res = await syncManager.updateGoalProgress(goalId, calcProgress, milestoneId);
        if (res.success) {
          if (res.goal) {
            const finalGoals = goals.map((g) => (g.id === goalId ? res.goal! : g));
            setGoals(finalGoals);
            Storage.setGoals(finalGoals);
            if (selectedGoalForMissionControl?.id === goalId) {
              setSelectedGoalForMissionControl(res.goal);
            }
          } else {
            Storage.setGoals(optimisticGoals);
          }
          if (res.profile) {
            setAuthoritativeUser(res.profile);
          }
          if (res.xpTransaction) {
            showToast({
              title: 'Milestone Completed!',
              description: `+${res.xpTransaction.amount} XP • 250 Boss Damage dealt`,
              type: 'xp',
              xpAmount: res.xpTransaction.amount,
            });
          }
        } else {
          setGoals(goals);
          showToast({ title: 'Error', description: res.error || 'Failed to update milestone', type: 'system' });
        }
      } catch {
        setGoals(goals);
        showToast({ title: 'Error', description: 'Network error updating goal progress', type: 'system' });
      }
    } else {
      // Demo / Guest mode
      const res = Storage.toggleGoalMilestone(goalId, milestoneId);
      if (res.goal) {
        const updated = Storage.getGoals();
        setGoals(updated);
        if (selectedGoalForMissionControl?.id === goalId) {
          setSelectedGoalForMissionControl(res.goal);
        }
        if (res.xpAwarded > 0) {
          addXp(res.xpAwarded, `Goal milestone achieved: ${res.goal.title}`);
          showToast({
            title: 'Milestone Achieved!',
            description: `+${res.xpAwarded} XP awarded`,
            type: 'xp',
            xpAmount: res.xpAwarded,
          });
        }
      }
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const goalId = `goal-${Date.now()}`;
    const newGoal: GoalItem = {
      id: goalId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory as any,
      quarter: newQuarter as any,
      targetMetric: newTargetMetric.trim(),
      progress: 0,
      xpReward: 200,
      completed: false,
      milestones: [
        { id: `ms-${Date.now()}-1`, goalId, order: 1, title: 'Define scope and technical milestones', completed: false, xpReward: 50 },
        { id: `ms-${Date.now()}-2`, goalId, order: 2, title: 'Midpoint execution & performance benchmark', completed: false, xpReward: 75 },
        { id: `ms-${Date.now()}-3`, goalId, order: 3, title: 'Final deployment and retrospective', completed: false, xpReward: 75 },
      ],
      createdAt: new Date().toISOString(),
    };

    const updated = [newGoal, ...goals];
    Storage.setGoals(updated);
    setGoals(updated);

    if (isAuthenticated && !isDemoMode) {
      syncManager.syncOperations([
        {
          operationId: `op_${Date.now()}`,
          type: 'UPDATE_GOAL_PROGRESS',
          entityId: goalId,
          payload: { goalId, progress: 0 },
        },
      ]).catch(() => {});
    }

    setShowAddGoalModal(false);
    setNewTitle('');
    setNewDescription('');
    showToast({ title: 'Goal Established', description: `${newGoal.title} is now active`, type: 'success' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-emerald-500" />
            Strategic Goals & Mission Control
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Connective tissue uniting high-horizon objectives, supporting tasks, habits, and execution velocity
          </p>
        </div>
        <button
          onClick={() => setShowAddGoalModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Establish Goal
        </button>
      </div>

      {/* Horizon Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('quarterly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
        goals.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">You don't have an active goal yet</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Goals establish the overarching "Why" for your daily habits and scheduled tasks. Create your first quarterly objective to unlock the Command Center.
            </p>
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20"
            >
              Establish First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const completedMilestones = goal.milestones.filter((m) => m.completed).length;
              const progress = goal.milestones.length > 0 ? Math.round((completedMilestones / goal.milestones.length) * 100) : goal.progress;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {goal.quarter || 'Current Quarter'}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {goal.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">{goal.title}</h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-500 shrink-0 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        +{goal.xpReward || 200} XP
                      </span>
                    </div>

                    {goal.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                        {goal.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-500">Milestone Progress ({completedMilestones}/{goal.milestones.length})</span>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Milestones List */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Tactical Milestones (Click to toggle)
                      </div>
                      {goal.milestones.map((ms, idx) => (
                        <button
                          key={ms.id}
                          onClick={() => handleToggleMilestone(goal.id, ms.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                            ms.completed
                              ? 'bg-emerald-500/5 border border-emerald-500/20 text-neutral-400 line-through'
                              : 'bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 text-neutral-900 dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {ms.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span className="truncate">
                              {idx + 1}. {ms.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
                            +{ms.xpReward || 50} XP
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal Card Footer & Mission Control CTA */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-neutral-500">
                      Target: <strong className="text-neutral-700 dark:text-neutral-300">{goal.targetMetric || '100%'}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedGoalForMissionControl(goal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mission Control</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* 5-Year Pillars Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">{pillar.title}</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {pillar.vision}
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-500">Strategic Alignment</span>
                  <span className="font-mono font-bold text-emerald-500">{pillar.progress}%</span>
                </div>
                <Progress value={pillar.progress} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">Establish Strategic Goal</h2>
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Mission Control Detail Modal */}
      <GoalMissionControlModal
        goal={selectedGoalForMissionControl}
        isOpen={Boolean(selectedGoalForMissionControl)}
        onClose={() => setSelectedGoalForMissionControl(null)}
        onToggleMilestone={handleToggleMilestone}
        onNavigate={onNavigate}
      />
    </div>
  );
}
