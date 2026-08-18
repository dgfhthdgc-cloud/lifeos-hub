import React from 'react';
import { TaskSummary, RoutePath } from '../../types';
import { Clock, CheckSquare, Square, ArrowRight, Zap, Calendar } from 'lucide-react';

interface ScheduleWidgetProps {
  tasks: TaskSummary[];
  onToggleTask: (taskId: string) => void;
  onNavigate: (path: RoutePath) => void;
}

export function ScheduleWidget({ tasks, onToggleTask, onNavigate }: ScheduleWidgetProps) {
  const priorityColors = {
    high: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Daily Schedule & Tasks</h2>
              <p className="text-[11px] text-neutral-400">High-leverage execution blocks</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/planner')}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Full Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No tasks scheduled for today. All systems clear!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  task.completed
                    ? 'bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
                    : 'bg-neutral-50/80 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/60 hover:border-emerald-500/40 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="text-neutral-400 group-hover:text-emerald-500 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold tracking-tight truncate ${
                        task.completed
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                      {task.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.time}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span>{task.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      priorityColors[task.priority] || priorityColors.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                    <Zap className="w-3 h-3" />
                    +{task.xp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
