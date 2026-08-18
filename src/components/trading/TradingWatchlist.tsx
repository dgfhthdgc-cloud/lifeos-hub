import React, { useState } from 'react';
import { MarketSymbol, AssetCategory } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface TradingWatchlistProps {
  symbols: MarketSymbol[];
  currentSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
}

export const TradingWatchlist: React.FC<TradingWatchlistProps> = ({
  symbols,
  currentSymbol,
  onSelectSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'name'>('volume');

  const filteredSymbols = symbols
    .filter((s) => {
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesSearch =
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return b.volume24h - a.volume24h;
      if (sortBy === 'change') return Math.abs(b.change24hPercent) - Math.abs(a.change24hPercent);
      return a.symbol.localeCompare(b.symbol);
    });

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col h-full space-y-4">
      {/* Watchlist Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-slate-100 font-mono uppercase tracking-wider">
            Markets Watchlist
          </h3>
        </div>
        <span className="text-[11px] font-mono text-neutral-500 dark:text-slate-500">{symbols.length} Assets</span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter pairs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-xs text-neutral-900 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['All', 'Crypto', 'Indices', 'Commodities', 'Forex'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-100 dark:bg-slate-950 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Symbols List */}
      <div className="space-y-1.5 overflow-y-auto max-h-[480px] pr-1 custom-scrollbar">
        {filteredSymbols.map((item) => {
          const isSelected = item.symbol === currentSymbol.symbol;
          const isPos = item.change24h >= 0;

          // Mini price range bar calculation
          const range = item.high24h - item.low24h;
          const posInRange = range > 0 ? ((item.currentPrice - item.low24h) / range) * 100 : 50;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                  : 'bg-neutral-50 dark:bg-slate-950/60 hover:bg-neutral-100 dark:hover:bg-slate-950 border-neutral-200/80 dark:border-slate-800/80 hover:border-neutral-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-slate-100 font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-slate-400 truncate max-w-[110px]">
                    {item.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-neutral-900 dark:text-slate-100 font-mono">
                    ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: item.decimals })}
                  </div>
                  <div
                    className={`text-[10px] font-mono font-medium flex items-center justify-end gap-0.5 ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {isPos ? '+' : ''}
                      {item.change24hPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 24h Range Indicator Bar */}
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-neutral-500 dark:text-slate-500">
                <span>L: ${item.low24h.toLocaleString(undefined, { maximumFractionDigits: item.decimals })}</span>
                <div className="w-16 h-1 bg-neutral-200 dark:bg-slate-800 rounded-full overflow-hidden mx-1.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.max(5, Math.min(95, posInRange))}%` }}
                  />
                </div>
                <span>H: ${item.high24h.toLocaleString(undefined, { maximumFractionDigits: item.decimals })}</span>
              </div>
            </div>
          );
        })}

        {filteredSymbols.length === 0 && (
          <div className="p-6 text-center text-xs text-neutral-400 dark:text-slate-500 font-mono">
            No assets match filter
          </div>
        )}
      </div>
    </div>
  );
};
