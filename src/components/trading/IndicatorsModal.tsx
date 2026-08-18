import React from 'react';
import { IndicatorConfig } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Activity, Check, Layers, BarChart2, Eye, EyeOff } from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig;
  onChangeIndicators: (updated: IndicatorConfig) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onChangeIndicators,
}) => {
  const toggleIndicator = (key: keyof IndicatorConfig) => {
    onChangeIndicators({
      ...indicators,
      [key]: !indicators[key],
    });
  };

  const indicatorList: {
    key: keyof IndicatorConfig;
    name: string;
    description: string;
    color: string;
    category: 'Overlay' | 'Oscillator' | 'Volume';
  }[] = [
    {
      key: 'ema9',
      name: 'EMA 9 (Fast Exponential MA)',
      description: 'Ultra-fast trend momentum and momentum scalp trigger',
      color: '#38bdf8', // sky-400
      category: 'Overlay',
    },
    {
      key: 'ema21',
      name: 'EMA 21 (Medium Dynamic Support)',
      description: 'Intermediate trend filter & pullback baseline',
      color: '#fb923c', // orange-400
      category: 'Overlay',
    },
    {
      key: 'ema50',
      name: 'EMA 50 (Major Trend Line)',
      description: 'Institutional swing direction and structural trend level',
      color: '#a855f7', // purple-500
      category: 'Overlay',
    },
    {
      key: 'ema200',
      name: 'EMA 200 (Macro Baseline)',
      description: 'Long-term bull/bear regime divider',
      color: '#64748b', // slate-500
      category: 'Overlay',
    },
    {
      key: 'vwap',
      name: 'VWAP (Volume-Weighted Average Price)',
      description: 'Intraday benchmark used by institutional algorithms',
      color: '#facc15', // yellow-400
      category: 'Overlay',
    },
    {
      key: 'bollingerBands',
      name: 'Bollinger Bands (20, 2σ)',
      description: 'Volatility envelopes for mean reversion and squeeze breakouts',
      color: '#34d399', // emerald-400
      category: 'Overlay',
    },
    {
      key: 'rsi',
      name: 'RSI 14 (Relative Strength Index)',
      description: 'Momentum oscillator with 70 overbought / 30 oversold bands',
      color: '#818cf8', // indigo-400
      category: 'Oscillator',
    },
    {
      key: 'macd',
      name: 'MACD (12, 26, 9)',
      description: 'Moving Average Convergence Divergence with histogram sub-pane',
      color: '#f43f5e', // rose-500
      category: 'Oscillator',
    },
    {
      key: 'volume',
      name: 'Volume Sub-Bars',
      description: 'Colored trading volume bars with moving average line',
      color: '#10b981', // emerald-500
      category: 'Volume',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Technical Indicators & Studies" maxWidth="lg">
      <div className="space-y-6">
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          Toggle algorithmic indicators to overlay onto the candlestick chart or dock into lower oscillator sub-panes.
        </p>

        {/* List of Indicators */}
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {indicatorList.map((ind) => {
            const isEnabled = indicators[ind.key];
            return (
              <div
                key={ind.key}
                onClick={() => toggleIndicator(ind.key)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isEnabled
                    ? 'bg-neutral-50 dark:bg-slate-900 border-emerald-500/40 shadow-xs'
                    : 'bg-white dark:bg-slate-950/60 hover:bg-neutral-50 dark:hover:bg-slate-950 border-neutral-200 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: ind.color }}
                  />

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-slate-100 font-mono">
                        {ind.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 font-mono">
                        {ind.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-slate-400">{ind.description}</div>
                  </div>
                </div>

                <div
                  className={`p-2 rounded-xl border transition-all ${
                    isEnabled
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-neutral-100 dark:bg-slate-900 text-neutral-400 dark:text-slate-600 border-neutral-200 dark:border-slate-800'
                  }`}
                >
                  {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChangeIndicators({
                ema9: true,
                ema21: true,
                ema50: false,
                ema200: false,
                bollingerBands: false,
                vwap: true,
                rsi: true,
                macd: false,
                volume: true,
              })
            }
          >
            Reset to Default
          </Button>

          <Button variant="primary" size="sm" onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            Apply Indicators
          </Button>
        </div>
      </div>
    </Modal>
  );
};
