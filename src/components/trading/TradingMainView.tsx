import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MarketSymbol,
  CandleStick,
  Timeframe,
  ChartType,
  DrawingToolType,
  ChartDrawing,
  IndicatorConfig,
  ActiveOrder,
  TradeJournalEntry,
  TradingAccount,
} from '../../types';
import {
  generateCandlesticks,
  simulatePriceTick,
  INITIAL_SYMBOLS,
} from '../../lib/tradingData';
import { storage } from '../../lib/storage';
import { TradingHeader } from './TradingHeader';
import { TradingWatchlist } from './TradingWatchlist';
import { TradingChartCanvas } from './TradingChartCanvas';
import { DrawingToolbar } from './DrawingToolbar';
import { IndicatorsModal } from './IndicatorsModal';
import { ReplayControlDeck } from './ReplayControlDeck';
import { OpenPositionsTable } from './OpenPositionsTable';
import { PositionCalculatorModal } from './PositionCalculatorModal';
import { TradeJournalView } from './TradeJournalView';
import {
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const TradingMainView: React.FC = () => {
  // 1. Initial State from Storage
  const [symbols, setSymbols] = useState<MarketSymbol[]>(() => storage.getTradingSymbols());
  const [currentSymbol, setCurrentSymbol] = useState<MarketSymbol>(() => symbols[0] || INITIAL_SYMBOLS[0]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'replay' | 'journal' | 'calculator'>('terminal');

  // Chart configuration
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    ema9: true,
    ema21: true,
    ema50: false,
    ema200: false,
    bollingerBands: false,
    vwap: true,
    rsi: true,
    macd: false,
    volume: true,
  });
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

  // Drawing tools
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('cursor');
  const [drawings, setDrawings] = useState<ChartDrawing[]>(() => storage.getChartDrawings(currentSymbol.symbol));
  const [isMagnetEnabled, setIsMagnetEnabled] = useState(true);

  // Candlestick historical dataset for active symbol
  const [candles, setCandles] = useState<CandleStick[]>(() =>
    generateCandlesticks(currentSymbol, timeframe, 140)
  );

  // Live price feed simulation
  const [isLiveFeedActive, setIsLiveFeedActive] = useState(true);

  // Replay Engine State
  const [replayIndex, setReplayIndex] = useState<number>(100);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  // Paper Trading Account & Journal
  const [account, setAccount] = useState<TradingAccount>(() => storage.getTradingAccount());
  const [journal, setJournal] = useState<TradeJournalEntry[]>(() => storage.getTradeJournal());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-generate candles when symbol or timeframe changes
  useEffect(() => {
    const fresh = generateCandlesticks(currentSymbol, timeframe, 140);
    setCandles(fresh);
    setReplayIndex(Math.floor(fresh.length * 0.7));
    setIsReplayPlaying(false);
    // Load drawings for this symbol
    setDrawings(storage.getChartDrawings(currentSymbol.symbol));
  }, [currentSymbol.symbol, timeframe]);

  // Save drawings on change
  const handleUpdateDrawings = (newDrawings: ChartDrawing[]) => {
    setDrawings(newDrawings);
    storage.saveChartDrawings(currentSymbol.symbol, newDrawings);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    storage.saveChartDrawings(currentSymbol.symbol, []);
    showToast('Chart drawings cleared');
  };

  // Live Price Ticking Simulation (only in 'terminal' mode)
  useEffect(() => {
    if (!isLiveFeedActive || activeTab === 'replay') return;

    const interval = setInterval(() => {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastCandle = prevCandles[prevCandles.length - 1];
        const volatility = currentSymbol.category === 'Crypto' ? 0.003 : 0.0015;
        const updatedLast = simulatePriceTick(lastCandle, volatility);

        // Update symbol currentPrice
        const newPrice = updatedLast.close;
        const previousClose = currentSymbol.currentPrice - currentSymbol.change24h || currentSymbol.currentPrice;
        const delta = newPrice - previousClose;
        const deltaPct = previousClose > 0 ? (delta / previousClose) * 100 : 0;

        setCurrentSymbol((prev) => ({
          ...prev,
          currentPrice: newPrice,
          change24h: delta,
          change24hPercent: deltaPct,
          high24h: Math.max(prev.high24h, newPrice),
          low24h: Math.min(prev.low24h, newPrice),
        }));

        // Check Open Orders for SL / TP triggers
        setAccount((prevAccount) => {
          let updatedBalance = prevAccount.balance;
          const updatedOrders: ActiveOrder[] = [];
          const closedToJournal: TradeJournalEntry[] = [];

          prevAccount.openOrders.forEach((order) => {
            if (order.symbol !== currentSymbol.symbol) {
              updatedOrders.push(order);
              return;
            }

            const isLong = order.direction === 'long';
            const price = newPrice;
            let shouldClose = false;
            let closeReason = '';
            let exitPrice = price;

            if (order.stopLoss) {
              if (isLong && price <= order.stopLoss) {
                shouldClose = true;
                closeReason = 'Stop Loss Hit';
                exitPrice = order.stopLoss;
              } else if (!isLong && price >= order.stopLoss) {
                shouldClose = true;
                closeReason = 'Stop Loss Hit';
                exitPrice = order.stopLoss;
              }
            }

            if (order.takeProfit) {
              if (isLong && price >= order.takeProfit) {
                shouldClose = true;
                closeReason = 'Take Profit Target Reached';
                exitPrice = order.takeProfit;
              } else if (!isLong && price <= order.takeProfit) {
                shouldClose = true;
                closeReason = 'Take Profit Target Reached';
                exitPrice = order.takeProfit;
              }
            }

            if (shouldClose) {
              const diff = isLong ? exitPrice - order.entryPrice : order.entryPrice - exitPrice;
              const pnl = diff * order.size;
              const pnlPct = (diff / order.entryPrice) * 100;
              const riskDistance = order.stopLoss ? Math.abs(order.entryPrice - order.stopLoss) : 1;
              const rMultiple = diff / riskDistance;

              updatedBalance += pnl;

              const entry: TradeJournalEntry = {
                id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                symbol: order.symbol,
                category: currentSymbol.category,
                direction: order.direction,
                entryDate: order.timestamp,
                exitDate: new Date().toISOString(),
                entryPrice: order.entryPrice,
                exitPrice,
                stopLoss: order.stopLoss || 0,
                takeProfit: order.takeProfit || 0,
                positionSize: order.size,
                pnl,
                pnlPercent: Number(pnlPct.toFixed(2)),
                rMultiple: Number(rMultiple.toFixed(2)),
                riskAmount: riskDistance * order.size,
                status: pnl > 0 ? 'win' : 'loss',
                setupStrategy: 'Algorithmic Order Automation',
                session: 'New York AM',
                emotion: 'Disciplined',
                notes: `Automated close: ${closeReason}`,
                rating: pnl > 0 ? 5 : 3,
              };

              closedToJournal.push(entry);
              showToast(`${closeReason} on ${order.symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
            } else {
              // Update floating PnL
              const diff = isLong ? price - order.entryPrice : order.entryPrice - price;
              updatedOrders.push({
                ...order,
                pnl: diff * order.size,
              });
            }
          });

          if (closedToJournal.length > 0) {
            setJournal((prevJ) => {
              const nextJ = [...closedToJournal, ...prevJ];
              storage.saveTradeJournal(nextJ);
              return nextJ;
            });
          }

          const newAcc: TradingAccount = {
            ...prevAccount,
            balance: updatedBalance,
            openOrders: updatedOrders,
          };
          storage.saveTradingAccount(newAcc);
          return newAcc;
        });

        return [...prevCandles.slice(0, -1), updatedLast];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, activeTab, currentSymbol, account.openOrders]);

  // Replay Engine Auto-play interval
  useEffect(() => {
    if (!isReplayPlaying || activeTab !== 'replay') return;

    const delay = Math.max(100, 1000 / replaySpeed);
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= candles.length - 1) {
          setIsReplayPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isReplayPlaying, replaySpeed, candles.length, activeTab]);

  // Quick Order Execution Handler
  const handleExecuteQuickOrder = (
    direction: 'long' | 'short',
    size: number,
    slPrice?: number,
    tpPrice?: number
  ) => {
    const activeCandle =
      activeTab === 'replay' && replayIndex < candles.length
        ? candles[replayIndex]
        : candles[candles.length - 1];

    const entryPrice = activeCandle ? activeCandle.close : currentSymbol.currentPrice;

    const newOrder: ActiveOrder = {
      id: `ord-${Date.now()}`,
      symbol: currentSymbol.symbol,
      direction,
      entryPrice,
      size,
      stopLoss: slPrice,
      takeProfit: tpPrice,
      pnl: 0,
      timestamp: new Date().toISOString(),
    };

    const updatedAccount: TradingAccount = {
      ...account,
      openOrders: [...account.openOrders, newOrder],
    };

    setAccount(updatedAccount);
    storage.saveTradingAccount(updatedAccount);
    showToast(`Executed ${direction.toUpperCase()} ${size} ${currentSymbol.symbol} @ $${entryPrice.toFixed(currentSymbol.decimals)}`);
  };

  // Close Order Manually
  const handleCloseOrder = (orderId: string) => {
    const targetOrder = account.openOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const activeCandle =
      activeTab === 'replay' && replayIndex < candles.length
        ? candles[replayIndex]
        : candles[candles.length - 1];

    const exitPrice = activeCandle ? activeCandle.close : currentSymbol.currentPrice;
    const isLong = targetOrder.direction === 'long';
    const priceDiff = isLong ? exitPrice - targetOrder.entryPrice : targetOrder.entryPrice - exitPrice;
    const pnl = priceDiff * targetOrder.size;
    const pnlPercent = (priceDiff / targetOrder.entryPrice) * 100;
    const riskDist = targetOrder.stopLoss ? Math.abs(targetOrder.entryPrice - targetOrder.stopLoss) : 1;
    const rMultiple = priceDiff / riskDist;

    const journalEntry: TradeJournalEntry = {
      id: `trade-${Date.now()}`,
      symbol: targetOrder.symbol,
      category: currentSymbol.category,
      direction: targetOrder.direction,
      entryDate: targetOrder.timestamp,
      exitDate: new Date().toISOString(),
      entryPrice: targetOrder.entryPrice,
      exitPrice,
      stopLoss: targetOrder.stopLoss || 0,
      takeProfit: targetOrder.takeProfit || 0,
      positionSize: targetOrder.size,
      pnl,
      pnlPercent: Number(pnlPercent.toFixed(2)),
      rMultiple: Number(rMultiple.toFixed(2)),
      riskAmount: riskDist * targetOrder.size,
      status: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
      setupStrategy: 'Manual Discretionary Execution',
      session: 'New York AM',
      emotion: 'Disciplined',
      notes: 'Manually closed position at market.',
      rating: pnl > 0 ? 5 : 4,
    };

    const newJournal = [journalEntry, ...journal];
    setJournal(newJournal);
    storage.saveTradeJournal(newJournal);

    const updatedAccount: TradingAccount = {
      ...account,
      balance: account.balance + pnl,
      openOrders: account.openOrders.filter((o) => o.id !== orderId),
    };

    setAccount(updatedAccount);
    storage.saveTradingAccount(updatedAccount);
    showToast(`Closed ${targetOrder.symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} PnL`);
  };

  // Add Manual Trade to Journal
  const handleAddJournalTrade = (tradeData: Omit<TradeJournalEntry, 'id'>) => {
    const newEntry: TradeJournalEntry = {
      ...tradeData,
      id: `trade-${Date.now()}`,
    };
    const updatedJournal = [newEntry, ...journal];
    setJournal(updatedJournal);
    storage.saveTradeJournal(updatedJournal);

    // Update account balance
    const updatedAccount = {
      ...account,
      balance: account.balance + newEntry.pnl,
    };
    setAccount(updatedAccount);
    storage.saveTradingAccount(updatedAccount);
    showToast(`Logged trade ${newEntry.symbol} to journal`);
  };

  // Delete trade from journal
  const handleDeleteJournalTrade = (tradeId: string) => {
    const updated = journal.filter((j) => j.id !== tradeId);
    setJournal(updated);
    storage.saveTradeJournal(updated);
    showToast('Trade entry deleted');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Trading Header */}
      <TradingHeader
        currentSymbol={currentSymbol}
        symbols={symbols}
        onSelectSymbol={setCurrentSymbol}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        accountBalance={account.balance}
        openOrdersCount={account.openOrders.length}
        isLiveFeedActive={isLiveFeedActive}
        onToggleLiveFeed={() => setIsLiveFeedActive(!isLiveFeedActive)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
      />

      {/* Main Content Body */}
      {activeTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left / Center 3 Cols: Drawing Bar + Chart Canvas + Open Positions */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
              {/* Left Floating Drawing Toolbar */}
              <DrawingToolbar
                activeTool={activeDrawingTool}
                onSelectTool={setActiveDrawingTool}
                isMagnetEnabled={isMagnetEnabled}
                onToggleMagnet={() => setIsMagnetEnabled(!isMagnetEnabled)}
                onClearDrawings={handleClearDrawings}
                drawingsCount={drawings.length}
                onTakeScreenshot={() => showToast('Snapshot saved to clipboard')}
              />

              {/* Responsive Chart Canvas */}
              <div className="flex-1 min-h-[500px]">
                <TradingChartCanvas
                  symbol={currentSymbol}
                  rawCandles={candles}
                  timeframe={timeframe}
                  onChangeTimeframe={setTimeframe}
                  chartType={chartType}
                  onChangeChartType={setChartType}
                  indicators={indicators}
                  onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
                  activeDrawingTool={activeDrawingTool}
                  drawings={drawings}
                  onUpdateDrawings={handleUpdateDrawings}
                  isMagnetEnabled={isMagnetEnabled}
                />
              </div>
            </div>

            {/* Open Paper Positions */}
            <OpenPositionsTable
              orders={account.openOrders}
              symbols={symbols}
              onCloseOrder={handleCloseOrder}
            />
          </div>

          {/* Right 1 Col: Market Watchlist & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <TradingWatchlist
              symbols={symbols}
              currentSymbol={currentSymbol}
              onSelectSymbol={setCurrentSymbol}
            />
          </div>
        </div>
      )}

      {/* Historical Replay Mode */}
      {activeTab === 'replay' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <DrawingToolbar
              activeTool={activeDrawingTool}
              onSelectTool={setActiveDrawingTool}
              isMagnetEnabled={isMagnetEnabled}
              onToggleMagnet={() => setIsMagnetEnabled(!isMagnetEnabled)}
              onClearDrawings={handleClearDrawings}
              drawingsCount={drawings.length}
              onTakeScreenshot={() => showToast('Snapshot saved')}
            />

            <div className="flex-1 min-h-[520px]">
              <TradingChartCanvas
                symbol={currentSymbol}
                rawCandles={candles}
                timeframe={timeframe}
                onChangeTimeframe={setTimeframe}
                chartType={chartType}
                onChangeChartType={setChartType}
                indicators={indicators}
                onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
                activeDrawingTool={activeDrawingTool}
                drawings={drawings}
                onUpdateDrawings={handleUpdateDrawings}
                isMagnetEnabled={isMagnetEnabled}
                replayIndex={replayIndex}
              />
            </div>
          </div>

          {/* Replay Control Bar */}
          <ReplayControlDeck
            symbol={currentSymbol}
            totalCandles={candles.length}
            currentIndex={replayIndex}
            onChangeCurrentIndex={setReplayIndex}
            isPlaying={isReplayPlaying}
            onTogglePlay={() => setIsReplayPlaying(!isReplayPlaying)}
            replaySpeed={replaySpeed}
            onChangeSpeed={setReplaySpeed}
            onExecuteQuickOrder={handleExecuteQuickOrder}
            openOrders={account.openOrders}
            onCloseOrder={handleCloseOrder}
            currentCandle={candles[replayIndex]}
          />
        </div>
      )}

      {/* Trade Journal & Analytics Mode */}
      {activeTab === 'journal' && (
        <TradeJournalView
          journal={journal}
          onAddTrade={handleAddJournalTrade}
          onDeleteTrade={handleDeleteJournalTrade}
        />
      )}

      {/* Risk Calculator Tab Mode */}
      {activeTab === 'calculator' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-slate-100 font-mono">
              Institutional Risk & Position Sizing Calculator
            </h3>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              Calculate risk per trade, stop loss invalidation points, and position notional value.
            </p>
            <button
              onClick={() => setIsCalculatorModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs cursor-pointer shadow-xs"
            >
              Open Interactive Calculator
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        indicators={indicators}
        onChangeIndicators={setIndicators}
      />

      <PositionCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        currentSymbol={currentSymbol}
        accountBalance={account.balance}
      />
    </div>
  );
};
