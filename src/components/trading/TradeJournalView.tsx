import React, { useState } from 'react';
import {
  TradeJournalEntry,
  AssetCategory,
  TradingSession,
  TradingEmotion,
} from '../../types';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  DollarSign,
  Award,
  Shield,
  Clock,
  Sparkles,
  Smile,
  Frown,
  AlertTriangle,
  Star,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TradeJournalViewProps {
  journal: TradeJournalEntry[];
  onAddTrade: (trade: Omit<TradeJournalEntry, 'id'>) => void;
  onDeleteTrade: (tradeId: string) => void;
}

export const TradeJournalView: React.FC<TradeJournalViewProps> = ({
  journal,
  onAddTrade,
  onDeleteTrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<TradeJournalEntry | null>(null);

  // New Trade Form State
  const [symbol, setSymbol] = useState('BTC/USD');
  const [category, setCategory] = useState<AssetCategory>('Crypto');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entryPrice, setEntryPrice] = useState<number>(92000);
  const [exitPrice, setExitPrice] = useState<number>(94200);
  const [stopLoss, setStopLoss] = useState<number>(90800);
  const [takeProfit, setTakeProfit] = useState<number>(95000);
  const [positionSize, setPositionSize] = useState<number>(1);
  const [setupStrategy, setSetupStrategy] = useState('Liquidity Sweep + Fair Value Gap');
  const [session, setSession] = useState<TradingSession>('New York AM');
  const [emotion, setEmotion] = useState<TradingEmotion>('Disciplined');
  const [mistakes, setMistakes] = useState<string>('None');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(5);

  // Filtered Journal Entries
  const filteredJournal = journal.filter((j) => {
    const matchesSearch =
      j.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.setupStrategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || j.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || j.status === filterStatus;
    const matchesDirection = filterDirection === 'all' || j.direction === filterDirection;
    return matchesSearch && matchesCategory && matchesStatus && matchesDirection;
  });

  // Calculate Metrics
  const totalTrades = journal.length;
  const wins = journal.filter((j) => j.status === 'win');
  const losses = journal.filter((j) => j.status === 'loss');
  const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;
  const totalPnL = journal.reduce((acc, curr) => acc + curr.pnl, 0);

  const grossProfit = wins.reduce((acc, curr) => acc + curr.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((acc, curr) => acc + curr.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0.00';

  const totalR = journal.reduce((acc, curr) => acc + curr.rMultiple, 0);
  const avgR = totalTrades > 0 ? (totalR / totalTrades).toFixed(2) : '0.00';

  // Cumulative PnL series for mini equity chart
  const equityPoints = [...journal]
    .reverse()
    .reduce<{ date: string; cumulative: number }[]>((acc, curr) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({
        date: new Date(curr.exitDate).toLocaleDateString(),
        cumulative: prev + curr.pnl,
      });
      return acc;
    }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isLong = direction === 'long';
    const priceDiff = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
    const pnl = Number((priceDiff * positionSize).toFixed(2));
    const pnlPercent = Number(((priceDiff / entryPrice) * 100).toFixed(2));
    const riskDistance = Math.abs(entryPrice - stopLoss);
    const riskAmount = Number((riskDistance * positionSize).toFixed(2));
    const rMultiple = riskDistance > 0 ? Number((priceDiff / riskDistance).toFixed(2)) : 0;

    onAddTrade({
      symbol: symbol.toUpperCase(),
      category,
      direction,
      entryDate: new Date(Date.now() - 3600000).toISOString(),
      exitDate: new Date().toISOString(),
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      positionSize,
      pnl,
      pnlPercent,
      rMultiple,
      riskAmount,
      status: pnl > 0.01 ? 'win' : pnl < -0.01 ? 'loss' : 'breakeven',
      setupStrategy,
      session,
      emotion,
      mistakes: mistakes.split(',').map((m) => m.trim()).filter(Boolean),
      notes: notes.trim() || 'Manual journal execution log.',
      rating,
    });

    setIsAddModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Net Realized PnL</div>
          <div
            className={`text-xl font-bold font-mono ${
              totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">Total Cumulative</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Win Rate</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-slate-100 font-mono">{winRate}%</div>
          <div className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">
            {wins.length}W - {losses.length}L - {journal.length - wins.length - losses.length}BE
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Profit Factor</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{profitFactor}</div>
          <div className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">Gross Gain / Loss</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Cumulative R</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">{totalR > 0 ? '+' : ''}{totalR.toFixed(2)}R</div>
          <div className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">Avg {avgR}R / trade</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Recorded Trades</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-slate-100 font-mono">{totalTrades}</div>
          <div className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">Across All Sessions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
          <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Log Entry</div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-mono w-full"
          >
            <Plus className="w-4 h-4" />
            <span>New Trade</span>
          </Button>
        </div>
      </div>

      {/* Equity Progression Visualizer */}
      {equityPoints.length > 1 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-neutral-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                Cumulative Performance Curve ($)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              +{totalPnL.toFixed(2)} Total Return
            </span>
          </div>

          {/* SVG Equity Line */}
          <div className="h-28 w-full relative">
            <svg className="w-full h-full overflow-visible">
              {(() => {
                const maxVal = Math.max(...equityPoints.map((p) => p.cumulative), 1000);
                const minVal = Math.min(...equityPoints.map((p) => p.cumulative), 0);
                const range = maxVal - minVal || 1;

                const pointsStr = equityPoints
                  .map((p, idx) => {
                    const x = (idx / (equityPoints.length - 1)) * 100;
                    const y = 100 - ((p.cumulative - minVal) / range) * 85;
                    return `${x}%,${y}%`;
                  })
                  .join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {equityPoints.map((p, idx) => {
                      const x = `${(idx / (equityPoints.length - 1)) * 100}%`;
                      const y = `${100 - ((p.cumulative - minVal) / range) * 85}%`;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="4"
                          className="fill-white dark:fill-slate-950"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-neutral-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search strategy, notes, symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-xs text-neutral-900 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-mono">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-neutral-800 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Crypto">Crypto</option>
            <option value="Indices">Indices</option>
            <option value="Commodities">Commodities</option>
            <option value="Forex">Forex</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-neutral-800 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Break-Even</option>
          </select>

          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-neutral-800 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Directions</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
      </div>

      {/* Trade Log Cards Table */}
      <div className="space-y-3">
        {filteredJournal.map((trade) => {
          const isWin = trade.status === 'win';
          const isLoss = trade.status === 'loss';

          return (
            <div
              key={trade.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-neutral-50 dark:hover:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 hover:border-neutral-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Symbol & Strategy */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm font-mono shrink-0 ${
                      trade.direction === 'long'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {trade.direction === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-neutral-900 dark:text-slate-100 font-mono">
                        {trade.symbol}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 font-mono uppercase">
                        {trade.direction}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 font-mono">
                        {trade.session}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {trade.setupStrategy}
                    </div>
                  </div>
                </div>

                {/* PnL & R-Multiple */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div
                      className={`text-base sm:text-lg font-bold font-mono ${
                        isWin ? 'text-emerald-600 dark:text-emerald-400' : isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-700 dark:text-slate-300'
                      }`}
                    >
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 dark:text-slate-400">
                      {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%)
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedTradeDetail(trade)}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-slate-950 hover:bg-neutral-200 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTrade(trade.id)}
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-neutral-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Price Flow */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-neutral-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-neutral-200/80 dark:border-slate-800/80">
                <div>
                  <span className="text-neutral-500 dark:text-slate-500">Entry: </span>
                  <span className="text-neutral-900 dark:text-slate-200 font-semibold">${trade.entryPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-slate-500">Exit: </span>
                  <span className="text-neutral-900 dark:text-slate-200 font-semibold">${trade.exitPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-slate-500">Stop: </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">${trade.stopLoss.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-slate-500">Size: </span>
                  <span className="text-neutral-900 dark:text-slate-200 font-semibold">{trade.positionSize}</span>
                </div>
              </div>

              {/* Psychology & Notes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300">
                    State: {trade.emotion}
                  </span>
                  {trade.mistakes && trade.mistakes.length > 0 && trade.mistakes[0] !== 'None' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                      Issue: {trade.mistakes.join(', ')}
                    </span>
                  )}
                </div>

                {/* Rating stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= trade.rating
                          ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400'
                          : 'text-neutral-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {trade.notes && (
                <p className="text-xs text-neutral-600 dark:text-slate-400 line-clamp-2 italic pt-1 border-t border-neutral-100 dark:border-slate-800/60">
                  "{trade.notes}"
                </p>
              )}
            </div>
          );
        })}

        {filteredJournal.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-neutral-200 dark:border-slate-800 text-neutral-400 dark:text-slate-500 space-y-2 font-mono">
            <BookOpen className="w-8 h-8 mx-auto text-neutral-300 dark:text-slate-600" />
            <div>No trade entries found for the current filters.</div>
          </div>
        )}
      </div>

      {/* Log Trade Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Trade to Performance Journal"
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Symbol *</label>
              <input
                type="text"
                required
                placeholder="e.g. BTC/USD or NQ"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Asset Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Crypto">Crypto</option>
                <option value="Indices">Indices</option>
                <option value="Commodities">Commodities</option>
                <option value="Forex">Forex</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'long' | 'short')}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Entry Price *</label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Exit Price *</label>
              <input
                type="number"
                step="any"
                required
                value={exitPrice}
                onChange={(e) => setExitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Stop Loss *</label>
              <input
                type="number"
                step="any"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Position Size *</label>
              <input
                type="number"
                step="any"
                required
                value={positionSize}
                onChange={(e) => setPositionSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Setup Strategy</label>
              <input
                type="text"
                placeholder="e.g. Liquidity Sweep + FVG"
                value={setupStrategy}
                onChange={(e) => setSetupStrategy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Trading Session</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as TradingSession)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Asia">Asia Session</option>
                <option value="London">London Session</option>
                <option value="New York AM">New York AM (Open)</option>
                <option value="New York PM">New York PM (Close)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Emotional State</label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as TradingEmotion)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Disciplined">Disciplined</option>
                <option value="Confident">Confident</option>
                <option value="FOMO">FOMO</option>
                <option value="Revenge">Revenge</option>
                <option value="Hesitant">Hesitant</option>
                <option value="Anxious">Anxious</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Execution Notes & Review</label>
            <textarea
              rows={3}
              placeholder="What went well? Did you follow your trading plan? Any lessons learned?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm text-neutral-900 dark:text-slate-100 placeholder-neutral-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs">
              Save to Trade Journal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Trade Detail Modal */}
      {selectedTradeDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTradeDetail(null)}
          title={`Trade Review: ${selectedTradeDetail.symbol} (${selectedTradeDetail.direction.toUpperCase()})`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase font-mono">Realized PnL</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    selectedTradeDetail.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {selectedTradeDetail.pnl >= 0 ? '+' : ''}${selectedTradeDetail.pnl.toFixed(2)}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">R-Multiple</div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{selectedTradeDetail.rMultiple.toFixed(2)}R</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800">
                <div className="text-neutral-500 dark:text-slate-500 text-[10px]">Entry Price</div>
                <div className="text-neutral-900 dark:text-slate-200 font-bold">${selectedTradeDetail.entryPrice.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800">
                <div className="text-neutral-500 dark:text-slate-500 text-[10px]">Exit Price</div>
                <div className="text-neutral-900 dark:text-slate-200 font-bold">${selectedTradeDetail.exitPrice.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800">
                <div className="text-neutral-500 dark:text-slate-500 text-[10px]">Stop Loss</div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">${selectedTradeDetail.stopLoss.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800">
                <div className="text-neutral-500 dark:text-slate-500 text-[10px]">Position Size</div>
                <div className="text-neutral-900 dark:text-slate-200 font-bold">{selectedTradeDetail.positionSize}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-800 dark:text-slate-300 font-mono">Notes & Debrief:</div>
              <p className="text-xs text-neutral-700 dark:text-slate-300 bg-neutral-50 dark:bg-slate-950 p-4 rounded-xl border border-neutral-200 dark:border-slate-800 leading-relaxed">
                {selectedTradeDetail.notes}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200 dark:border-slate-800">
              <Button variant="primary" onClick={() => setSelectedTradeDetail(null)} className="bg-neutral-900 dark:bg-slate-800 text-white font-mono text-xs">
                Close Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
