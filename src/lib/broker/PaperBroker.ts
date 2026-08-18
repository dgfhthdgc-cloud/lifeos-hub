import { AssetCategory, BrokerAccount, BrokerOrder, BrokerPosition, NewBrokerOrder, TradeJournalEntry } from '../../types';
import { Storage } from '../storage';
import { RiskEngine } from './RiskEngine';

const INITIAL_PAPER_ACCOUNT: BrokerAccount = {
  accountId: 'pap_act_8801',
  brokerName: 'Life OS Institutional Paper Engine',
  mode: 'PAPER',
  equity: 100000.0,
  cash: 100000.0,
  buyingPower: 200000.0,
  initialCapital: 100000.0,
  currency: 'USD',
  realizedPnl: 0,
  unrealizedPnl: 0,
  marginUsed: 0,
  dayTradesRemaining: 99,
  status: 'ACTIVE',
  lastSyncTime: Date.now(),
};

export class PaperBrokerProvider {
  private account: BrokerAccount;
  private positions: BrokerPosition[] = [];
  private orders: BrokerOrder[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load persisted state if exists
    try {
      const savedAcc = localStorage.getItem('life_os_paper_broker_account_v2');
      this.account = savedAcc ? JSON.parse(savedAcc) : INITIAL_PAPER_ACCOUNT;
      const savedPos = localStorage.getItem('life_os_paper_broker_positions_v2');
      this.positions = savedPos ? JSON.parse(savedPos) : [];
      const savedOrd = localStorage.getItem('life_os_paper_broker_orders_v2');
      this.orders = savedOrd ? JSON.parse(savedOrd) : [];
    } catch {
      this.account = INITIAL_PAPER_ACCOUNT;
      this.positions = [];
      this.orders = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem('life_os_paper_broker_account_v2', JSON.stringify(this.account));
      localStorage.setItem('life_os_paper_broker_positions_v2', JSON.stringify(this.positions));
      localStorage.setItem('life_os_paper_broker_orders_v2', JSON.stringify(this.orders));
    } catch {
      // Storage error handled
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public async getAccount(): Promise<BrokerAccount> {
    return { ...this.account };
  }

  public async getPositions(): Promise<BrokerPosition[]> {
    return [...this.positions];
  }

  public async getOrders(): Promise<BrokerOrder[]> {
    return [...this.orders];
  }

  public async submitOrder(
    newOrder: NewBrokerOrder,
    currentMarketPrice: number
  ): Promise<{ success: boolean; order?: BrokerOrder; error?: string }> {
    // 1. Evaluate Risk Rules
    const riskAnalysis = RiskEngine.calculateRisk(this.account, this.positions, newOrder, currentMarketPrice);
    if (!riskAnalysis.allowed && newOrder.mode === 'LIVE') {
      return { success: false, error: riskAnalysis.violations.join('; ') };
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const brokerOrderId = `BKR-PAP-${Date.now().toString(36).toUpperCase()}`;

    // Slippage model (0.01% - 0.03% realistic simulated spread)
    const slippage = currentMarketPrice * (newOrder.direction === 'long' ? 0.0002 : -0.0002);
    const fillPrice = Number((currentMarketPrice + slippage).toFixed(currentMarketPrice > 500 ? 2 : 4));

    const brokerOrder: BrokerOrder = {
      id: orderId,
      brokerOrderId,
      symbol: newOrder.symbol,
      direction: newOrder.direction,
      orderType: newOrder.orderType,
      status: 'filled',
      submittedAt: Date.now(),
      filledAt: Date.now(),
      quantity: newOrder.quantity,
      filledQuantity: newOrder.quantity,
      remainingQuantity: 0,
      averageFillPrice: fillPrice,
      limitPrice: newOrder.limitPrice,
      stopLoss: newOrder.stopLoss,
      takeProfit: newOrder.takeProfit,
      estimatedRiskAmount: riskAnalysis.riskAmount,
      mode: 'PAPER',
    };

    this.orders = [brokerOrder, ...this.orders];

    // Determine category
    const sym = newOrder.symbol.toUpperCase();
    let category: AssetCategory = 'Crypto';
    if (sym === 'EURUSD' || sym === 'GBPUSD' || sym === 'USDJPY') category = 'Forex';
    else if (sym === 'NQ' || sym === 'ES') category = 'Indices';
    else if (sym === 'XAUUSD') category = 'Commodities';

    // Create Position
    const positionId = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const position: BrokerPosition = {
      id: positionId,
      symbol: newOrder.symbol,
      direction: newOrder.direction,
      quantity: newOrder.quantity,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      marketValue: fillPrice * newOrder.quantity,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      stopLoss: newOrder.stopLoss,
      takeProfit: newOrder.takeProfit,
      openedAt: Date.now(),
      assetCategory: category,
    };

    this.positions = [position, ...this.positions];
    this.recalculateAccount();
    this.persist();

    return { success: true, order: brokerOrder };
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;
    if (this.orders[idx].status === 'filled') return false;

    this.orders[idx].status = 'cancelled';
    this.persist();
    return true;
  }

  public async closePosition(
    positionId: string,
    currentMarketPrice: number,
    reason = 'Manual Close'
  ): Promise<{ success: boolean; pnl?: number }> {
    const pos = this.positions.find((p) => p.id === positionId);
    if (!pos) return { success: false };

    const isLong = pos.direction === 'long';
    const pointScale = pos.symbol === 'NQ' ? 20 : pos.symbol === 'ES' ? 50 : 1;
    const diff = isLong ? currentMarketPrice - pos.entryPrice : pos.entryPrice - currentMarketPrice;
    const pnl = diff * pos.quantity * pointScale;
    const pnlPct = (diff / pos.entryPrice) * 100;
    const riskDistance = pos.stopLoss ? Math.abs(pos.entryPrice - pos.stopLoss) : pos.entryPrice * 0.015;
    const rMultiple = diff / riskDistance;

    // Remove from open positions
    this.positions = this.positions.filter((p) => p.id !== positionId);

    // Update account realized PnL
    this.account.realizedPnl += pnl;
    this.account.cash += pnl;
    this.recalculateAccount();

    // Log to Trade Journal
    const journalEntry: TradeJournalEntry = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: pos.symbol,
      category: pos.assetCategory,
      direction: pos.direction,
      entryDate: new Date(pos.openedAt).toISOString(),
      exitDate: new Date().toISOString(),
      entryPrice: pos.entryPrice,
      exitPrice: currentMarketPrice,
      stopLoss: pos.stopLoss || 0,
      takeProfit: pos.takeProfit || 0,
      positionSize: pos.quantity,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPct.toFixed(2)),
      rMultiple: Number(rMultiple.toFixed(2)),
      riskAmount: Number((riskDistance * pos.quantity * pointScale).toFixed(2)),
      status: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
      setupStrategy: 'Institutional Execution',
      session: 'New York AM',
      emotion: 'Disciplined',
      notes: `${reason} @ ${currentMarketPrice}`,
      rating: pnl > 0 ? 5 : 3,
    };

    const currentJournal = Storage.getTradeJournal();
    Storage.saveTradeJournal([journalEntry, ...currentJournal]);

    this.persist();
    return { success: true, pnl };
  }

  public updateMarketPrices(quotes: Map<string, number>) {
    let hasChanged = false;

    // Check each open position for SL/TP hits & update unrealized PnL
    const positionsToClose: { id: string; price: number; reason: string }[] = [];

    this.positions = this.positions.map((pos) => {
      const price = quotes.get(pos.symbol) || pos.currentPrice;
      if (price !== pos.currentPrice) hasChanged = true;

      const isLong = pos.direction === 'long';
      const pointScale = pos.symbol === 'NQ' ? 20 : pos.symbol === 'ES' ? 50 : 1;
      const diff = isLong ? price - pos.entryPrice : pos.entryPrice - price;
      const unrealizedPnl = diff * pos.quantity * pointScale;
      const unrealizedPnlPercent = (diff / pos.entryPrice) * 100;

      // Check Stop Loss
      if (pos.stopLoss && pos.stopLoss > 0) {
        if ((isLong && price <= pos.stopLoss) || (!isLong && price >= pos.stopLoss)) {
          positionsToClose.push({ id: pos.id, price: pos.stopLoss, reason: 'Stop Loss Hit' });
        }
      }

      // Check Take Profit
      if (pos.takeProfit && pos.takeProfit > 0) {
        if ((isLong && price >= pos.takeProfit) || (!isLong && price <= pos.takeProfit)) {
          positionsToClose.push({ id: pos.id, price: pos.takeProfit, reason: 'Take Profit Target Reached' });
        }
      }

      return {
        ...pos,
        currentPrice: price,
        marketValue: price * pos.quantity,
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        unrealizedPnlPercent: Number(unrealizedPnlPercent.toFixed(2)),
      };
    });

    if (positionsToClose.length > 0) {
      positionsToClose.forEach((item) => {
        this.closePosition(item.id, item.price, item.reason);
      });
      hasChanged = true;
    }

    if (hasChanged) {
      this.recalculateAccount();
      this.persist();
    }
  }

  private recalculateAccount() {
    const totalUnrealized = this.positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const marginUsed = this.positions.reduce((sum, p) => sum + p.marketValue * 0.1, 0); // 10:1 baseline leverage

    this.account.unrealizedPnl = Number(totalUnrealized.toFixed(2));
    this.account.marginUsed = Number(marginUsed.toFixed(2));
    this.account.equity = Number((this.account.cash + totalUnrealized).toFixed(2));
    this.account.buyingPower = Number((this.account.equity * 2 - marginUsed).toFixed(2));
    this.account.lastSyncTime = Date.now();
  }

  public resetAccount(initialBalance = 100000): void {
    this.account = {
      ...INITIAL_PAPER_ACCOUNT,
      equity: initialBalance,
      cash: initialBalance,
      buyingPower: initialBalance * 2,
      initialCapital: initialBalance,
      realizedPnl: 0,
      unrealizedPnl: 0,
      marginUsed: 0,
      lastSyncTime: Date.now(),
    };
    this.positions = [];
    this.orders = [];
    this.persist();
  }
}

export const PaperBroker = new PaperBrokerProvider();
