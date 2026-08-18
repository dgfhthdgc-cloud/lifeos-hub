import React from 'react';
import { GoalSummary, RoutePath } from '../../types';
import { Target, ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import { Progress } from '../ui/Progress';

interface GoalsWidgetProps {
  goals: GoalSummary[];
  onNavigate: (path: RoutePath) => void;
}

export function GoalsWidget({ goals, onNavigate }: GoalsWidgetProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Active Goals</h2>
            <p className="text-[11px] text-neutral-400">Quarterly & Year Milestones</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/goals')}
          className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          <span>All Goals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">
            No active goals set. Define your strategic North Star!
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => (
            <div
              key={goal.id}
              onClick={() => onNavigate('/goals')}
              className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-blue-500/30 transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{goal.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                    <span>{goal.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{goal.targetDate}</span>
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-blue-500">{goal.progress}%</span>
              </div>

              <div className="space-y-1">
                <Progress value={goal.progress} />
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-blue-500" />
                    <span>{goal.completedMilestones}/{goal.totalMilestones} Milestones</span>
                  </span>
                  <span>{goal.progress >= 100 ? 'Completed' : 'In Progress'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
