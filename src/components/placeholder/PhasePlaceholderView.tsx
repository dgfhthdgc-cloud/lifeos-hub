import React from 'react';
import { RoutePath } from '../../types';
import { Construction, Sparkles, ArrowRight } from 'lucide-react';

interface PhasePlaceholderViewProps {
  title?: string;
  description?: string;
  onNavigate?: (path: RoutePath) => void;
}

export function PhasePlaceholderView({
  title = 'Module Active',
  description = 'This section connects with your Life OS core telemetry and storage.',
  onNavigate,
}: PhasePlaceholderViewProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">{description}</p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors mt-2"
          >
            Return to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
