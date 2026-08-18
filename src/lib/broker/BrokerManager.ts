import { BrokerAccount, BrokerOrder, BrokerPosition, NewBrokerOrder } from '../../types';
import { PaperBroker } from './PaperBroker';

export interface IBrokerAdapter {
  getAccount(): Promise<BrokerAccount>;
  getPositions(): Promise<BrokerPosition[]>;
  getOrders(): Promise<BrokerOrder[]>;
  submitOrder(
    newOrder: NewBrokerOrder,
    currentPrice: number
  ): Promise<{ success: boolean; order?: BrokerOrder; error?: string }>;
  cancelOrder(orderId: string): Promise<boolean>;
  closePosition(positionId: string, currentPrice: number): Promise<{ success: boolean; pnl?: number }>;
}

class BrokerManagerService {
  private mode: 'PAPER' | 'LIVE' = 'PAPER';
  private subscribers: Set<() => void> = new Set();

  constructor() {
    PaperBroker.subscribe(() => this.notify());
  }

  public getMode(): 'PAPER' | 'LIVE' {
    return this.mode;
  }

  public setMode(mode: 'PAPER' | 'LIVE') {
    // Safety check: Always keep execution engine on PAPER simulation
    this.mode = mode;
    this.notify();
  }

  public isLiveExecutionAvailable(): boolean {
    return false; // Live real-money trading is disabled by design
  }

  public subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  public async getAccount(): Promise<BrokerAccount> {
    return PaperBroker.getAccount();
  }

  public async getPositions(): Promise<BrokerPosition[]> {
    return PaperBroker.getPositions();
  }

  public async getOrders(): Promise<BrokerOrder[]> {
    return PaperBroker.getOrders();
  }

  public async submitOrder(
    newOrder: NewBrokerOrder,
    currentPrice: number
  ): Promise<{ success: boolean; order?: BrokerOrder; error?: string }> {
    if (this.mode === 'LIVE') {
      return {
        success: false,
        error: 'Live real-money trading is disabled. Orders must be executed in Paper Trading Simulation mode.',
      };
    }

    return PaperBroker.submitOrder(newOrder, currentPrice);
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    return PaperBroker.cancelOrder(orderId);
  }

  public async closePosition(positionId: string, currentPrice: number): Promise<{ success: boolean; pnl?: number }> {
    return PaperBroker.closePosition(positionId, currentPrice);
  }

  public updateMarketQuotes(quotes: Map<string, number>) {
    PaperBroker.updateMarketPrices(quotes);
  }

  public resetPaperAccount(balance = 100000) {
    PaperBroker.resetAccount(balance);
  }
}

export const BrokerManager = new BrokerManagerService();
