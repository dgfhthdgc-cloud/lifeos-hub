import React from 'react';
import { DrawingToolType } from '../../types';
import {
  MousePointer,
  Minus,
  MoveUpRight,
  Square,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Magnet,
  Camera,
  Percent,
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  isMagnetEnabled: boolean;
  onToggleMagnet: () => void;
  onClearDrawings: () => void;
  drawingsCount: number;
  onTakeScreenshot: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  isMagnetEnabled,
  onToggleMagnet,
  onClearDrawings,
  drawingsCount,
  onTakeScreenshot,
}) => {
  const tools: { id: DrawingToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'cursor', label: 'Crosshair / Pan', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'trendline', label: 'Trendline', icon: <MoveUpRight className="w-4 h-4" /> },
    { id: 'horizontal_line', label: 'Horizontal Ray (Support/Resistance)', icon: <Minus className="w-4 h-4" /> },
    { id: 'fibonacci', label: 'Fibonacci Retracement', icon: <Percent className="w-4 h-4" /> },
    { id: 'rectangle', label: 'Order Block / FVG Zone', icon: <Square className="w-4 h-4" /> },
    { id: 'long_position', label: 'Long Position (R:R Tool)', icon: <ArrowUpCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> },
    { id: 'short_position', label: 'Short Position (R:R Tool)', icon: <ArrowDownCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" /> },
  ];

  return (
    <div className="flex sm:flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-950/90 border border-neutral-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md">
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`p-2 rounded-xl transition-all cursor-pointer relative group ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-900 border border-transparent'
            }`}
          >
            {t.icon}

            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-slate-900 border border-neutral-800 dark:border-slate-800 text-[11px] text-white dark:text-slate-200 font-mono shadow-xl pointer-events-none">
              {t.label}
            </div>
          </button>
        );
      })}

      <div className="h-px w-full bg-neutral-200 dark:bg-slate-800 my-1 hidden sm:block" />

      {/* Magnet Mode */}
      <button
        onClick={onToggleMagnet}
        title={isMagnetEnabled ? 'Magnet Snap ON (OHLC)' : 'Magnet Snap OFF'}
        className={`p-2 rounded-xl transition-all cursor-pointer relative group ${
          isMagnetEnabled
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : 'text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-900'
        }`}
      >
        <Magnet className="w-4 h-4" />
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-slate-900 border border-neutral-800 dark:border-slate-800 text-[11px] text-white dark:text-slate-200 font-mono shadow-xl pointer-events-none">
          {isMagnetEnabled ? 'Magnet: Active' : 'Magnet: Inactive'}
        </div>
      </button>

      {/* Clear Drawings */}
      {drawingsCount > 0 && (
        <button
          onClick={onClearDrawings}
          title={`Clear ${drawingsCount} Drawing(s)`}
          className="p-2 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer relative group"
        >
          <Trash2 className="w-4 h-4" />
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-slate-900 border border-neutral-800 dark:border-slate-800 text-[11px] text-rose-300 font-mono shadow-xl pointer-events-none">
            Clear {drawingsCount} Object(s)
          </div>
        </button>
      )}

      {/* Screenshot export */}
      <button
        onClick={onTakeScreenshot}
        title="Capture Chart Snapshot"
        className="p-2 rounded-xl text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative group"
      >
        <Camera className="w-4 h-4" />
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-slate-900 border border-neutral-800 dark:border-slate-800 text-[11px] text-white dark:text-slate-200 font-mono shadow-xl pointer-events-none">
          Chart Snapshot
        </div>
      </button>
    </div>
  );
};
