import { Bar, MarketDataProvider, MarketMode, MarketStatus, Quote, Timeframe } from '../../types';
import { LiveBinanceMarketDataProvider } from './LiveBinanceProvider';
import { LiveForexMarketDataProvider } from './LiveForexProvider';
import { HistoricalDataProvider } from './HistoricalDataProvider';

class MarketDataService {
  private mode: MarketMode = 'PAPER';
  private binanceProvider = new LiveBinanceMarketDataProvider();
  private forexProvider = new LiveForexMarketDataProvider();
  private historicalProvider = new HistoricalDataProvider();

  private isConnected = false;
  private statusListeners: Set<(status: MarketStatus) => void> = new Set();
  private quotesCache: Map<string, Quote> = new Map();

  constructor() {
    // Default to PAPER mode with live public streaming
    this.mode = 'PAPER';
  }

  public getMode(): MarketMode {
    return this.mode;
  }

  public setMode(mode: MarketMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.broadcastStatus();
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    this.isConnected = true;

    try {
      await Promise.allSettled([
        this.binanceProvider.connect(),
        this.forexProvider.connect(),
        this.historicalProvider.connect(),
      ]);
    } catch {
      // Handled in providers
    }

    this.broadcastStatus();
  }

  public disconnect(): void {
    this.isConnected = false;
    this.binanceProvider.disconnect();
    this.forexProvider.disconnect();
    this.historicalProvider.disconnect();
    this.broadcastStatus();
  }

  private getProviderForSymbol(symbol: string): MarketDataProvider {
    const clean = symbol.toUpperCase();
    if (clean === 'BTCUSD' || clean === 'ETHUSD' || clean === 'SOLUSD' || clean.includes('BTC') || clean.includes('ETH')) {
      return this.binanceProvider;
    }
    return this.forexProvider;
  }

  public subscribeQuotes(symbols: string[], callback: (quote: Quote) => void): () => void {
    const unsubs: (() => void)[] = [];

    const cryptoSymbols = symbols.filter((s) => s.includes('BTC') || s.includes('ETH') || s.includes('SOL'));
    const forexSymbols = symbols.filter((s) => !cryptoSymbols.includes(s));

    const wrappedCallback = (quote: Quote) => {
      this.quotesCache.set(quote.symbol, quote);
      callback(quote);
    };

    if (cryptoSymbols.length > 0) {
      unsubs.push(this.binanceProvider.subscribeQuotes(cryptoSymbols, wrappedCallback));
    }
    if (forexSymbols.length > 0) {
      unsubs.push(this.forexProvider.subscribeQuotes(forexSymbols, wrappedCallback));
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }

  public subscribeBars(symbol: string, timeframe: Timeframe, callback: (bar: Bar) => void): () => void {
    const provider = this.getProviderForSymbol(symbol);
    return provider.subscribeBars(symbol, timeframe, callback);
  }

  public async getHistoricalBars(symbol: string, timeframe: Timeframe, limit = 140): Promise<Bar[]> {
    if (this.mode === 'DEMO') {
      return this.historicalProvider.getHistoricalBars(symbol, timeframe, limit);
    }

    try {
      const provider = this.getProviderForSymbol(symbol);
      const bars = await provider.getHistoricalBars(symbol, timeframe, limit);
      if (bars && bars.length > 0) {
        return bars;
      }
    } catch {
      // fallback to historical provider if network failed
    }

    return this.historicalProvider.getHistoricalBars(symbol, timeframe, limit);
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const cached = this.quotesCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 3000) {
      return cached;
    }

    const provider = this.getProviderForSymbol(symbol);
    try {
      const q = await provider.getQuote(symbol);
      this.quotesCache.set(symbol, q);
      return q;
    } catch {
      if (cached) return cached;
      return this.historicalProvider.getQuote(symbol);
    }
  }

  public getStatus(): MarketStatus {
    const activeProvider = this.binanceProvider.getStatus();
    return {
      mode: this.mode,
      state: this.isConnected ? (activeProvider.state === 'error' ? 'error' : 'connected') : 'disconnected',
      provider: this.mode === 'LIVE' ? 'Institutional Live Gateway' : this.mode === 'PAPER' ? 'Binance & Interbank Stream' : 'Historical Simulation Matrix',
      lastUpdated: activeProvider.lastUpdated || Date.now(),
      errorMessage: activeProvider.errorMessage,
    };
  }

  public subscribeStatus(listener: (status: MarketStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private broadcastStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((fn) => fn(status));
  }
}

export const MarketDataManager = new MarketDataService();
