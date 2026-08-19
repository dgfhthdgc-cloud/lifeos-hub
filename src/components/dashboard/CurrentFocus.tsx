import React from 'react';
import { Target, CheckCircle2, Clock, Calendar, ArrowRight, Sparkles, Plus, Flag, Compass } from 'lucide-react';
import { TaskItem, GoalItem, RoutePath } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface CurrentFocusProps {
  tasks: TaskItem[];
  goals: GoalItem[];
  onToggleTask: (taskId: string) => void;
  onNavigate: (path: RoutePath) => void;
  onAddTaskClick: () => void;
}

export function CurrentFocus({
  tasks,
  goals,
  onToggleTask,
  onNavigate,
  onAddTaskClick,
}: CurrentFocusProps) {
  // Find highest-priority incomplete task
  const pendingTasks = tasks.filter((t) => !t.completed);

  const currentFocusTask = [...pendingTasks].sort((a, b) => {
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (pDiff !== 0) return pDiff;
    return (a.time || '').localeCompare(b.time || '');
  })[0];

  // Resolve linked goal & milestone
  let linkedGoal: GoalItem | undefined;
  let linkedMilestoneTitle: string | undefined;

  if (currentFocusTask?.goalId) {
    linkedGoal = goals.find((g) => g.id === currentFocusTask.goalId);
    if (linkedGoal && currentFocusTask.milestoneId) {
      const milestone = linkedGoal.milestones.find((m) => m.id === currentFocusTask.milestoneId);
      if (milestone) {
        linkedMilestoneTitle = milestone.title;
      }
    }
  }

  if (!currentFocusTask) {
    const totalToday = tasks.length;
    const completedToday = tasks.filter((t) => t.completed).length;

    return (
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Focus Status: Clear
              </span>
              {totalToday > 0 && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                  {completedToday} of {totalToday} tasks resolved
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              {totalToday > 0
                ? 'All primary tasks completed for today — great work!'
                : 'No pending focus task scheduled'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {totalToday > 0
                ? 'Your priority queue is clear. Review your long-term goals or plan upcoming milestones in the Planner.'
                : 'Set a high-impact objective to anchor your daily focus and maintain streak momentum.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/planner')}
              className="flex-1 sm:flex-initial text-xs gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Open Planner
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTaskClick}
              className="flex-1 sm:flex-initial text-xs gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Focus Task
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const priorityColors = {
    high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Task Content & Hierarchy */}
        <div className="space-y-3 min-w-0 flex-1">
          {/* Header row: Focus Badge + Category + Priority + XP */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
              <Compass className="w-3.5 h-3.5 text-violet-500 animate-spin-slow" />
              CURRENT FOCUS
            </span>

            <span
              className={cn(
                'text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border',
                priorityColors[currentFocusTask.priority] || priorityColors.medium
              )}
            >
              {currentFocusTask.priority} priority
            </span>

            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-700/60">
              {currentFocusTask.category}
            </span>

            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded ml-auto sm:ml-0">
              +{currentFocusTask.xp || 50} XP
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight leading-snug">
              {currentFocusTask.title}
            </h2>
            {currentFocusTask.description && (
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {currentFocusTask.description}
              </p>
            )}
          </div>

          {/* Metadata Row: Linked Goal & Milestone + Time Block */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            {currentFocusTask.time && (
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {currentFocusTask.time}
                  {currentFocusTask.endTime ? ` - ${currentFocusTask.endTime}` : ''}
                </span>
              </div>
            )}

            {currentFocusTask.dueDate && (
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentFocusTask.dueDate}</span>
              </div>
            )}

            {linkedGoal && (
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[260px] font-medium">
                  {linkedGoal.title}
                  {linkedMilestoneTitle ? ` → ${linkedMilestoneTitle}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800/80">
          <Button
            variant="primary"
            size="md"
            onClick={() => onToggleTask(currentFocusTask.id)}
            className="flex-1 md:flex-initial gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete & Claim XP</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/planner')}
            className="flex-1 md:flex-initial gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <span>View in Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
