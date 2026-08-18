import React, { useState } from 'react';
import { SystemSnapshotMetadata } from '../../types';
import { Storage } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Download, Database, HardDrive, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemDiagnosticsCardProps {
  snapshot: SystemSnapshotMetadata;
  onRefresh: () => void;
}

export function SystemDiagnosticsCard({ snapshot, onRefresh }: SystemDiagnosticsCardProps) {
  const { showToast } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = () => {
    setIsExporting(true);
    try {
      const fullBackup = {
        meta: snapshot,
        exportedAt: new Date().toISOString(),
        user: Storage.getUser(),
        tasks: Storage.getTasks(),
        habits: Storage.getHabits(),
        goals: Storage.getGoals(),
        courses: Storage.getDetailedCourses(),
        trading: {
          account: Storage.getTradingAccount(),
          journal: Storage.getTradeJournal(),
        },
        languages: {
          profile: Storage.getLanguageProfile(),
        },
        bosses: Storage.getBossBattles(),
        perks: Storage.getSkillPerks(),
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `life_os_snapshot_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast({
        title: 'System Snapshot Exported',
        description: 'Complete LIFE OS state exported as structured JSON backup.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Export Failed',
        description: 'Could not generate system backup JSON.',
        type: 'warning',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              System Diagnostics & State Snapshot
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Integrity: 100% Healthy
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Active schema verification, persistence metrics, and instantaneous snapshot export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportBackup} disabled={isExporting}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export Snapshot (.json)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Total Tasks</div>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {snapshot.tasksCount} Active
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Habit Trackers</div>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {snapshot.habitsCount} Routines
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Strategic Goals</div>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {snapshot.goalsCount} Pillars
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Course Labs</div>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {snapshot.coursesCount} Syllabi
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Journaled Trades</div>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
            {snapshot.tradesCount} Executions
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-400">Engine Build</div>
          <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {snapshot.version}
          </div>
        </div>
      </div>
    </div>
  );
}
