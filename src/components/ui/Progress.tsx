import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, size = 'md', className = '', indicatorClassName = '' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800', heightClass, className)}>
      <div
        className={cn('h-full bg-emerald-500 transition-all duration-300 rounded-full', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
