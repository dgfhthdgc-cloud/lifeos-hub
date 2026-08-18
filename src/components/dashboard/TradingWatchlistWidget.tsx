import React from 'react';
import { WatchlistSummaryItem, RoutePath } from '../../types';
import { TrendingUp, TrendingDown, ArrowRight, Activity, DollarSign } from 'lucide-react';

interface TradingWatchlistWidgetProps {
  watchlist: WatchlistSummaryItem[];
  onNavigate: (path: RoutePath) => void;
}

export function TradingWatchlistWidget({ watchlist, onNavigate }: TradingWatchlistWidgetProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(price);
  };

  return (
    <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Market Watchlist</h2>
            <p className="text-[11px] text-neutral-400">Simulated Alpha Execution</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/trading')}
          className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>Terminal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {watchlist.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">
            No assets in watchlist. Add tickers in Trading Terminal!
          </div>
        ) : (
          watchlist.slice(0, 4).map((item) => (
            <div
              key={item.symbol}
              onClick={() => onNavigate('/trading')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-neutral-900 dark:text-white">{item.symbol}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">[{item.category}]</span>
                </div>
                <p className="text-[10px] text-neutral-400 truncate max-w-[110px]">{item.name}</p>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                  {formatPrice(item.price)}
                </div>
                <div
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    item.isPositive
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : 'text-rose-500 bg-rose-500/10'
                  }`}
                >
                  {item.isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {item.isPositive ? '+' : ''}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
