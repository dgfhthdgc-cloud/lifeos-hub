import React from 'react';
import { GoalItem, TaskItem, HabitItem, CourseSummary, RoutePath } from '../../types';
import { Storage } from '../../lib/storage';
import {
  Target,
  X,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { Progress } from '../ui/Progress';

interface GoalMissionControlModalProps {
  goal: GoalItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onNavigate: (path: RoutePath) => void;
}

export function GoalMissionControlModal({
  goal,
  isOpen,
  onClose,
  onToggleMilestone,
  onNavigate,
}: GoalMissionControlModalProps) {
  if (!isOpen || !goal) return null;

  const allTasks = Storage.getTasks();
  const allHabits = Storage.getHabits();
  const allCourses = Storage.getCourses();

  // Find linked tasks, habits, courses
  const linkedTasks = allTasks.filter((t) => t.goalId === goal.id || t.category.toLowerCase() === goal.category.toLowerCase());
  const linkedHabits = allHabits.filter((h) => goal.relatedHabitIds?.includes(h.id) || h.category.toLowerCase() === goal.category.toLowerCase());
  const linkedCourses = allCourses.filter((c) => goal.relatedCourseIds?.includes(c.id) || c.category.toLowerCase().includes(goal.category.toLowerCase()));

  const completedMilestones = goal.milestones.filter((m) => m.completed);
  const pendingMilestones = goal.milestones.filter((m) => !m.completed);
  const nextMilestone = pendingMilestones[0];

  // Risk evaluation: if less than 50% done and in active quarter
  const isAtRisk = goal.progress < 50 && goal.quarter?.includes('2026');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-thin"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {goal.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Target: {goal.quarter || 'Ongoing'}
                </span>
              </div>
              <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                {goal.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* 1. WHY / WHAT / WHEN STRATEGIC OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Strategic Why & Purpose
              </span>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                {goal.description || 'Core career and operational objective to establish domain authority and compounding impact.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Target Metric (What)
              </span>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {goal.targetMetric || '100% Deliverable Completion'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Total XP Value: +{goal.xpReward || 500} XP • 600 Boss Damage
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Timeline & Deadline (When)
              </span>
              <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {goal.deadline || goal.quarter || 'Q3 2026 Target'}
              </p>
              {isAtRisk ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Velocity attention advised
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> On Track
                </span>
              )}
            </div>
          </div>

          {/* 2. PROGRESS BAR & MILESTONES */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Milestone Roadmap ({completedMilestones.length}/{goal.milestones.length} Completed)
                </h3>
                <p className="text-xs text-neutral-500">
                  Every milestone checked deals 250 Boss Raid damage and awards XP
                </p>
              </div>
              <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                {goal.progress}%
              </span>
            </div>

            <Progress value={goal.progress} className="h-2.5 bg-neutral-200 dark:bg-neutral-700" />

            {/* Interactive Milestone Items */}
            <div className="space-y-2 pt-2">
              {goal.milestones.map((ms, idx) => (
                <button
                  key={ms.id}
                  onClick={() => onToggleMilestone(goal.id, ms.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    ms.completed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-neutral-500 dark:text-neutral-400 line-through'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {ms.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold">
                      {idx + 1}. {ms.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    +{ms.xpReward || 75} XP
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. CONNECTIVE TISSUE: SUPPORTING TASKS, HABITS & COURSES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Linked Tasks */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Supporting Tasks ({linkedTasks.length})
                  </span>
                  <button
                    onClick={() => { onClose(); onNavigate('/planner'); }}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {linkedTasks.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3">No tasks directly tagged with this goal yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {linkedTasks.slice(0, 3).map((t) => (
                      <li key={t.id} className="flex items-center gap-2 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                        <span className={`truncate ${t.completed ? 'line-through text-neutral-400' : ''}`}>{t.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Linked Habits */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Supporting Habits ({linkedHabits.length})
                  </span>
                  <button
                    onClick={() => { onClose(); onNavigate('/habits'); }}
                    className="text-[10px] font-bold text-orange-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {linkedHabits.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3">No habits linked to this domain.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {linkedHabits.slice(0, 3).map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{h.name}</span>
                        <span className="text-[10px] font-mono text-orange-500">{h.currentStreak}d 🔥</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Linked Learning */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    Curriculum ({linkedCourses.length})
                  </span>
                  <button
                    onClick={() => { onClose(); onNavigate('/learn'); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {linkedCourses.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3">No courses linked.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {linkedCourses.slice(0, 3).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{c.title}</span>
                        <span className="text-[10px] font-mono text-blue-500">{c.progress}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 4. AI COACH STRATEGIC RECOMMENDATION */}
          <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-black border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Strategic Optimization for "{goal.title}"</span>
              </div>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Grounded Strategic Analysis
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {nextMilestone
                ? `Immediate focus should be directed to Milestone: "${nextMilestone.title}". Allocating 2 unbroken 60-minute time-blocks this week will elevate goal progress to ${Math.min(100, goal.progress + 33)}% while safeguarding your schedule velocity.`
                : `All milestones completed! Finalize post-project retrospectives and synthesize lessons learned into your Codex.`}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => { onClose(); onNavigate('/ai'); }}
            className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Consult AI Coach on this goal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
