import { BrokerAccount, BrokerOrder, BrokerPosition, NewBrokerOrder } from '../../types';
import { PaperBroker } from './PaperBroker';

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
    this.mode = mode;
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  public async getAccount(): Promise<BrokerAccount> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch('/api/broker/account');
        if (resp.ok) {
          return await resp.json();
        }
      } catch {
        // fallback
      }
    }
    return PaperBroker.getAccount();
  }

  public async getPositions(): Promise<BrokerPosition[]> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch('/api/broker/positions');
        if (resp.ok) {
          return await resp.json();
        }
      } catch {
        // fallback
      }
    }
    return PaperBroker.getPositions();
  }

  public async getOrders(): Promise<BrokerOrder[]> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch('/api/broker/orders');
        if (resp.ok) {
          return await resp.json();
        }
      } catch {
        // fallback
      }
    }
    return PaperBroker.getOrders();
  }

  public async submitOrder(
    newOrder: NewBrokerOrder,
    currentPrice: number
  ): Promise<{ success: boolean; order?: BrokerOrder; error?: string }> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch('/api/broker/orders/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newOrder, currentPrice }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          return { success: false, error: err.message || 'Live order execution failed' };
        }
        return await resp.json();
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error connecting to broker gateway' };
      }
    }

    return PaperBroker.submitOrder(newOrder, currentPrice);
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch(`/api/broker/orders/cancel/${orderId}`, { method: 'POST' });
        return resp.ok;
      } catch {
        return false;
      }
    }
    return PaperBroker.cancelOrder(orderId);
  }

  public async closePosition(positionId: string, currentPrice: number): Promise<{ success: boolean; pnl?: number }> {
    if (this.mode === 'LIVE') {
      try {
        const resp = await fetch(`/api/broker/positions/close/${positionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPrice }),
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch {
        return { success: false };
      }
    }
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
