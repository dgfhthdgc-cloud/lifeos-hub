import React, { useState, useEffect } from 'react';
import { TaskItem, TaskPriority, TaskCategory } from '../../types';
import { Storage } from '../../lib/storage';
import { syncManager } from '../../lib/SyncManager';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Tag,
  Filter,
  Flame,
  CheckSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

export function PlannerView() {
  const { addXp } = useAuth();
  const { showToast } = useNotifications();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Engineering');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    setTasks(Storage.getTasks());
  }, []);

  const handleToggleTask = (id: string) => {
    const res = Storage.toggleTask(id);
    if (res.task) {
      setTasks(Storage.getTasks());
      if (res.xpAwarded > 0) {
        // Trigger server-authoritative task completion & XP award
        syncManager.completeTask(id).catch(() => {});
        addXp(res.xpAwarded, `Completed task: ${res.task.title}`);
        showToast(`Task completed! +${res.xpAwarded} XP`, 'success');
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    Storage.deleteTask(id);
    setTasks(Storage.getTasks());
    showToast('Task removed', 'info');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDueDate,
      time: newTime,
      priority: newPriority,
      status: 'todo',
      category: newCategory,
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`)),
      xp: newPriority === 'high' ? 50 : newPriority === 'medium' ? 30 : 15,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    Storage.setTasks(updated);
    setTasks(updated);
    setShowAddModal(false);
    setNewTitle('');
    setNewTags('');
    showToast('New task scheduled', 'success');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedFilter === 'today') return t.dueDate === todayStr;
    if (selectedFilter === 'upcoming') return t.dueDate > todayStr;
    if (selectedFilter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const categories = ['all', 'Engineering', 'Learning', 'Trading', 'Language', 'Health', 'Productivity', 'Personal'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-emerald-500" />
            Execution Planner
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Time-boxed daily execution matrix with automated XP compounding
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Schedule Task
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pending Execution</div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{pendingCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Tasks remaining in queue</div>
        </div>
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Matrix</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">{completedCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{progressPercent}% completion rate</div>
        </div>
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Compounded XP Yield</div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            +{tasks.filter((t) => t.completed).reduce((acc, t) => acc + (t.xp || 20), 0)} XP
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Earned through task mastery</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-100 dark:bg-neutral-900/50 p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800/60">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedFilter === filter
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-white focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-12 text-center space-y-3">
            <CheckSquare className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No tasks in this view</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Schedule your next tactical block to keep your momentum high and earn XP.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-neutral-50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800/50 opacity-60'
                  : 'bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold truncate ${
                        task.completed
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {task.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.time || task.dueDate}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                      <Zap className="w-3 h-3" />
                      +{task.xp || 30} XP
                    </span>
                    {task.tags && task.tags.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1 text-neutral-500">
                        <Tag className="w-3 h-3" />
                        {task.tags.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-rose-500 transition-all ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Schedule Tactical Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket Reconnect Logic"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Time Block</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="low">Low (+15 XP)</option>
                    <option value="medium">Medium (+30 XP)</option>
                    <option value="high">High (+50 XP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {categories
                      .filter((c) => c !== 'all')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="core, architecture, frontend"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
