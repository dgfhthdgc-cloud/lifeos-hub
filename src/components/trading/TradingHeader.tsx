import React, { useState } from 'react';
import { MarketSymbol, AssetCategory } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  Activity,
  Layers,
  Clock,
  RotateCcw,
  BookOpen,
  Sliders,
  DollarSign,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface TradingHeaderProps {
  currentSymbol: MarketSymbol;
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  activeTab: 'terminal' | 'replay' | 'journal' | 'calculator';
  onSelectTab: (tab: 'terminal' | 'replay' | 'journal' | 'calculator') => void;
  accountBalance: number;
  openOrdersCount: number;
  isLiveFeedActive: boolean;
  onToggleLiveFeed: () => void;
  onOpenCalculator: () => void;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({
  currentSymbol,
  symbols,
  onSelectSymbol,
  activeTab,
  onSelectTab,
  accountBalance,
  openOrdersCount,
  isLiveFeedActive,
  onToggleLiveFeed,
  onOpenCalculator,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const isPositive = currentSymbol.change24h >= 0;

  const filteredSymbols = symbols.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Row: Symbol Selector, Live Price Stats, Account Equity */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Active Symbol Selector Dropdown */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 hover:border-neutral-300 dark:hover:border-slate-700 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-mono">
                    {currentSymbol.symbol}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-slate-800 text-neutral-700 dark:text-slate-400 font-mono font-medium">
                    {currentSymbol.category}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                  {currentSymbol.name}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-slate-400 group-hover:text-neutral-700 dark:group-hover:text-slate-200 transition-transform" />
            </button>

            {/* Symbol Switcher Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search crypto, indices, fx..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-xs text-neutral-900 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Category filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {['All', 'Crypto', 'Indices', 'Commodities', 'Forex'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-neutral-100 dark:bg-slate-950 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Symbol list */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredSymbols.map((s) => {
                    const isSelected = s.symbol === currentSymbol.symbol;
                    const pos = s.change24h >= 0;
                    return (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onSelectSymbol(s);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/30'
                            : 'hover:bg-neutral-100 dark:hover:bg-slate-950 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 dark:text-slate-200 font-mono">
                              {s.symbol}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
                              {s.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-slate-500 truncate max-w-[150px]">
                            {s.name}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-neutral-900 dark:text-slate-200">
                            ${s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: s.decimals })}
                          </div>
                          <div
                            className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${
                              pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {pos ? '+' : ''}
                            {s.change24hPercent.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current Ticker Price Display */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-slate-100 font-mono tracking-tight">
                ${currentSymbol.currentPrice.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.decimals })}
              </span>
              <div
                className={`flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isPositive ? '+' : ''}
                  {currentSymbol.change24hPercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 dark:text-slate-400 flex items-center gap-2">
              <span>24h Delta: {isPositive ? '+' : ''}${currentSymbol.change24h.toFixed(currentSymbol.decimals)}</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
                Demo Feed
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: 24h Stats Badges */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs bg-neutral-50 dark:bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-neutral-200/80 dark:border-slate-800/80 shadow-2xs">
          <div>
            <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">24h High</div>
            <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ${currentSymbol.high24h.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.decimals })}
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-slate-800" />

          <div>
            <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">24h Low</div>
            <div className="font-mono font-semibold text-rose-600 dark:text-rose-400">
              ${currentSymbol.low24h.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.decimals })}
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-slate-800" />

          <div>
            <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">24h Volume</div>
            <div className="font-mono font-semibold text-neutral-800 dark:text-slate-200">
              ${(currentSymbol.volume24h / 1000000).toFixed(1)}M
            </div>
          </div>

          <div className="h-6 w-px bg-neutral-200 dark:bg-slate-800" />

          {/* Live Tick simulation toggle */}
          <button
            onClick={onToggleLiveFeed}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all cursor-pointer ${
              isLiveFeedActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-neutral-100 dark:bg-slate-900 text-neutral-500 dark:text-slate-500 border border-neutral-200 dark:border-slate-800 hover:text-neutral-700 dark:hover:text-slate-300'
            }`}
            title="Toggle Live Price Simulation"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveFeedActive ? 'bg-emerald-500 dark:bg-emerald-400 animate-ping' : 'bg-neutral-400 dark:bg-slate-600'
              }`}
            />
            <span>{isLiveFeedActive ? 'Simulated Feed' : 'Paused'}</span>
          </button>
        </div>

        {/* Right: Account Balance & Quick Calculator Trigger */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Paper Capital</div>
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-slate-100 font-mono">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button
            onClick={onOpenCalculator}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
            title="Risk & Position Sizing Calculator"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-neutral-200/80 dark:border-slate-800/80">
        <button
          onClick={() => onSelectTab('terminal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'terminal'
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
              : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-950/60'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Live Terminal</span>
          {openOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold">
              {openOrdersCount} Active
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('replay')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'replay'
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
              : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-950/60'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Bar-by-Bar Replay Engine</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-950 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Simulator
          </span>
        </button>

        <button
          onClick={() => onSelectTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
              : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-950/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Trade Journal & Analytics</span>
        </button>

        <button
          onClick={() => onSelectTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
              : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-950/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Risk Calculator</span>
        </button>
      </div>
    </div>
  );
};
