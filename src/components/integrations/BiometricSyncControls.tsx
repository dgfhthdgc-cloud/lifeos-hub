import React, { useState } from 'react';
import { BiometricReadinessMetric } from '../../types';
import { RefreshCw, Radio, CheckCircle2, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface BiometricSyncControlsProps {
  metrics: BiometricReadinessMetric;
  onSync: () => void;
}

export function BiometricSyncControls({
  metrics,
  onSync,
}: BiometricSyncControlsProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSync();
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {metrics.sourceDevice}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Bridge Active
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
            Last Synced: {new Date(metrics.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="text-xs font-bold"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5 text-sky-500', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Ingesting Biomarkers...' : 'Sync Wearables Now'}
        </Button>
      </div>
    </div>
  );
}
