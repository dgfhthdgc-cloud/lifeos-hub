import React, { useState, useEffect } from 'react';
import { CandleStick, MarketSymbol, ActiveOrder } from '../../types';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ReplayControlDeckProps {
  symbol: MarketSymbol;
  totalCandles: number;
  currentIndex: number;
  onChangeCurrentIndex: (newIndex: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  replaySpeed: number;
  onChangeSpeed: (speed: number) => void;
  onExecuteQuickOrder: (direction: 'long' | 'short', size: number, slPrice?: number, tpPrice?: number) => void;
  openOrders: ActiveOrder[];
  onCloseOrder: (orderId: string) => void;
  currentCandle?: CandleStick;
}

export const ReplayControlDeck: React.FC<ReplayControlDeckProps> = ({
  symbol,
  totalCandles,
  currentIndex,
  onChangeCurrentIndex,
  isPlaying,
  onTogglePlay,
  replaySpeed,
  onChangeSpeed,
  onExecuteQuickOrder,
  openOrders,
  onCloseOrder,
  currentCandle,
}) => {
  const [lotSize, setLotSize] = useState<number>(symbol.category === 'Crypto' ? 0.5 : symbol.category === 'Indices' ? 2 : 5);
  const [slPips, setSlPips] = useState<number>(30);
  const [tpPips, setTpPips] = useState<number>(75);

  const currentPrice = currentCandle?.close || symbol.currentPrice;

  const currentOpenOrderForSymbol = openOrders.find((o) => o.symbol === symbol.symbol);

  // Auto calculate SL and TP prices based on pips/ticks
  const longSlPrice = Number((currentPrice - slPips * symbol.pipSize).toFixed(symbol.decimals));
  const longTpPrice = Number((currentPrice + tpPips * symbol.pipSize).toFixed(symbol.decimals));
  const shortSlPrice = Number((currentPrice + slPips * symbol.pipSize).toFixed(symbol.decimals));
  const shortTpPrice = Number((currentPrice - tpPips * symbol.pipSize).toFixed(symbol.decimals));

  const rrRatio = slPips > 0 ? (tpPips / slPips).toFixed(2) : '2.50';

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Replay Timeline & Speed Deck */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          {/* Reset button */}
          <button
            onClick={() => onChangeCurrentIndex(Math.max(20, Math.floor(totalCandles * 0.3)))}
            title="Jump to Start of Replay"
            className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <Button
            variant="primary"
            size="sm"
            onClick={onTogglePlay}
            className={`gap-2 font-mono ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play Bar-by-Bar'}</span>
          </Button>

          {/* Step forward 1 candle */}
          <button
            onClick={() => onChangeCurrentIndex(Math.min(totalCandles - 1, currentIndex + 1))}
            disabled={isPlaying || currentIndex >= totalCandles - 1}
            title="Step Forward 1 Candle"
            className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-neutral-200 dark:border-slate-800 text-neutral-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-slate-950 p-1 rounded-xl border border-neutral-200 dark:border-slate-800 ml-2">
            {[0.5, 1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  replaySpeed === s
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-neutral-500 dark:text-slate-500 hover:text-neutral-800 dark:hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress scrub bar & Time display */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <span className="text-[11px] font-mono text-neutral-500 dark:text-slate-500 shrink-0">
            Bar {currentIndex + 1} / {totalCandles}
          </span>
          <input
            type="range"
            min={15}
            max={totalCandles - 1}
            value={currentIndex}
            onChange={(e) => onChangeCurrentIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          {currentCandle && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0 bg-neutral-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-slate-800">
              {new Date(currentCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Instant Replay Paper Execution Station */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-950/80 border border-neutral-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Sizing & Risk Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Position Size ({symbol.category === 'Crypto' ? 'Units' : 'Contracts'})</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={symbol.category === 'Crypto' ? 0.1 : 1}
                min={0.1}
                value={lotSize}
                onChange={(e) => setLotSize(Math.max(0.1, Number(e.target.value)))}
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Stop Loss ({symbol.pipSize} pts)</span>
            <input
              type="number"
              min={5}
              value={slPips}
              onChange={(e) => setSlPips(Math.max(1, Number(e.target.value)))}
              className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Take Profit ({symbol.pipSize} pts)</span>
            <input
              type="number"
              min={5}
              value={tpPips}
              onChange={(e) => setTpPips(Math.max(1, Number(e.target.value)))}
              className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">R:R Ratio</span>
            <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              1 : {rrRatio}
            </div>
          </div>
        </div>

        {/* Action Execution Buttons */}
        <div className="flex items-center gap-3">
          {currentOpenOrderForSymbol ? (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-neutral-200 dark:border-slate-800">
              <div className="space-y-0.5 text-xs font-mono">
                <div className="text-neutral-500 dark:text-slate-400">
                  Active {currentOpenOrderForSymbol.direction.toUpperCase()} ({currentOpenOrderForSymbol.size} size)
                </div>
                <div
                  className={`font-bold ${
                    currentOpenOrderForSymbol.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Floating PnL: ${currentOpenOrderForSymbol.pnl.toFixed(2)}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCloseOrder(currentOpenOrderForSymbol.id)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono"
              >
                Close Trade
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onExecuteQuickOrder('long', lotSize, longSlPrice, longTpPrice)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-mono flex-1 sm:flex-initial"
              >
                <TrendingUp className="w-4 h-4" />
                <span>BUY Market</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onExecuteQuickOrder('short', lotSize, shortSlPrice, shortTpPrice)}
                className="bg-rose-600 hover:bg-rose-500 text-white gap-2 font-mono flex-1 sm:flex-initial"
              >
                <TrendingDown className="w-4 h-4" />
                <span>SELL Market</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
