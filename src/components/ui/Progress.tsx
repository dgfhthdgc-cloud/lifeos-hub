import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className = '', indicatorClassName = '' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 h-2', className)}>
      <div
        className={cn('h-full bg-emerald-500 transition-all duration-300 rounded-full', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
