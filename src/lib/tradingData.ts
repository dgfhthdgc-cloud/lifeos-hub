import {
  MarketSymbol,
  CandleStick,
  Timeframe,
  IndicatorConfig,
  TradeJournalEntry,
  ActiveOrder,
  TradingAccount,
} from '../types';

export const INITIAL_MARKET_SYMBOLS: MarketSymbol[] = [
  // Crypto
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'Crypto',
    currentPrice: 94850.0,
    change24h: 2150.0,
    change24hPercent: 2.32,
    high24h: 96200.0,
    low24h: 92400.0,
    volume24h: 38400000000,
    decimals: 1,
    pipSize: 1.0,
    description: 'Digital gold and benchmark cryptocurrency asset',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    category: 'Crypto',
    currentPrice: 3420.5,
    change24h: 84.2,
    change24hPercent: 2.52,
    high24h: 3495.0,
    low24h: 3310.0,
    volume24h: 19800000000,
    decimals: 2,
    pipSize: 0.1,
    description: 'Smart contract platform powering DeFi and Layer 2 ecosystems',
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    category: 'Crypto',
    currentPrice: 198.4,
    change24h: 9.8,
    change24hPercent: 5.19,
    high24h: 204.5,
    low24h: 187.2,
    volume24h: 5600000000,
    decimals: 2,
    pipSize: 0.01,
    description: 'High-throughput monolithic L1 blockchain',
  },
  // Indices
  {
    symbol: 'NQ',
    name: 'Nasdaq 100 Futures',
    category: 'Indices',
    currentPrice: 20840.25,
    change24h: 165.5,
    change24hPercent: 0.8,
    high24h: 20920.0,
    low24h: 20645.0,
    volume24h: 420000000,
    decimals: 2,
    pipSize: 0.25,
    description: 'E-mini NASDAQ 100 benchmark tech index',
  },
  {
    symbol: 'ES',
    name: 'S&P 500 E-mini',
    category: 'Indices',
    currentPrice: 5985.75,
    change24h: 32.25,
    change24hPercent: 0.54,
    high24h: 6005.0,
    low24h: 5948.5,
    volume24h: 890000000,
    decimals: 2,
    pipSize: 0.25,
    description: 'Broad market benchmark US 500 equities index',
  },
  {
    symbol: 'DXY',
    name: 'US Dollar Index',
    category: 'Indices',
    currentPrice: 104.35,
    change24h: -0.22,
    change24hPercent: -0.21,
    high24h: 104.8,
    low24h: 104.15,
    volume24h: 150000000,
    decimals: 2,
    pipSize: 0.01,
    description: 'Relative strength index of USD against basket of currencies',
  },
  // Commodities
  {
    symbol: 'XAU/USD',
    name: 'Gold Spot',
    category: 'Commodities',
    currentPrice: 2742.8,
    change24h: 18.4,
    change24hPercent: 0.67,
    high24h: 2755.0,
    low24h: 2720.5,
    volume24h: 24000000000,
    decimals: 2,
    pipSize: 0.1,
    description: 'Precious metal global safe-haven commodity',
  },
  {
    symbol: 'WTI',
    name: 'Crude Oil WTI',
    category: 'Commodities',
    currentPrice: 71.45,
    change24h: -1.25,
    change24hPercent: -1.72,
    high24h: 73.1,
    low24h: 70.85,
    volume24h: 14000000000,
    decimals: 2,
    pipSize: 0.01,
    description: 'West Texas Intermediate crude oil light sweet energy contract',
  },
  // Forex
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    currentPrice: 1.0845,
    change24h: 0.0032,
    change24hPercent: 0.3,
    high24h: 1.0875,
    low24h: 1.0805,
    volume24h: 95000000000,
    decimals: 4,
    pipSize: 0.0001,
    description: 'Most heavily traded FX major currency pair',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    category: 'Forex',
    currentPrice: 1.2985,
    change24h: 0.0048,
    change24hPercent: 0.37,
    high24h: 1.302,
    low24h: 1.293,
    volume24h: 62000000000,
    decimals: 4,
    pipSize: 0.0001,
    description: 'Cable: British Pound Sterling versus US Dollar',
  },
];

export const INITIAL_SYMBOLS = INITIAL_MARKET_SYMBOLS;

// Timeframe duration in milliseconds
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1H': 60 * 60 * 1000,
  '4H': 4 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

/**
 * Deterministic pseudo-random number generator for reproducible historical charts
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates realistic candlestick price series
 */
export function generateCandlesticks(
  symbolOrPrice: MarketSymbol | number | undefined,
  timeframe: Timeframe,
  count = 180
): CandleStick[] {
  const duration = TIMEFRAME_MS[timeframe] || 15 * 60 * 1000;
  const now = Date.now();
  const startTime = now - count * duration;

  const candles: CandleStick[] = [];
  const basePrice =
    typeof symbolOrPrice === 'number'
      ? symbolOrPrice
      : (typeof symbolOrPrice === 'object' && symbolOrPrice !== null && 'currentPrice' in symbolOrPrice)
      ? symbolOrPrice.currentPrice
      : 1000;
  const decimals =
    typeof symbolOrPrice === 'object' && symbolOrPrice !== null && 'decimals' in symbolOrPrice
      ? symbolOrPrice.decimals
      : basePrice > 1000
      ? 2
      : 4;
  const category =
    typeof symbolOrPrice === 'object' && symbolOrPrice !== null && 'category' in symbolOrPrice
      ? symbolOrPrice.category
      : 'Crypto';
  const symbolKey =
    typeof symbolOrPrice === 'object' && symbolOrPrice !== null && 'symbol' in symbolOrPrice
      ? symbolOrPrice.symbol
      : 'BTC/USD';

  let currentPrice = basePrice * 0.94; // start slightly lower for an overall trend

  const baseVol =
    category === 'Crypto'
      ? 0.007
      : category === 'Indices'
      ? 0.004
      : category === 'Commodities'
      ? 0.005
      : 0.002;

  // Scale volatility slightly with timeframe (longer timeframe = wider ranges per candle)
  const tfMultiplier =
    timeframe === '1m'
      ? 0.4
      : timeframe === '5m'
      ? 0.6
      : timeframe === '15m'
      ? 0.85
      : timeframe === '30m'
      ? 1.0
      : timeframe === '1H' || timeframe === '1h'
      ? 1.3
      : timeframe === '4H' || timeframe === '4h'
      ? 1.8
      : timeframe === '1D'
      ? 2.5
      : 3.5; // 1W

  const volatility = baseVol * tfMultiplier;

  // Generate seed from symbol name and timeframe
  const seedKey = `${symbolKey}_${timeframe}`;
  let seed = seedKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000);

  for (let i = 0; i < count; i++) {
    const time = startTime + i * duration;
    const r1 = seededRandom(seed++);
    const r2 = seededRandom(seed++);
    const r3 = seededRandom(seed++);
    const r4 = seededRandom(seed++);

    // Market trend cycle component + random walk
    const cycle = Math.sin(i / 15) * 0.4 + Math.cos(i / 35) * 0.6;
    const changePct = (r1 - 0.485 + cycle * 0.08) * volatility;

    const open = currentPrice;
    let close = open * (1 + changePct);

    // High and low wicks
    const maxBody = Math.max(open, close);
    const minBody = Math.min(open, close);
    const highWick = (maxBody * volatility * r2 * 0.8);
    const lowWick = (minBody * volatility * r3 * 0.8);

    const high = maxBody + highWick;
    const low = Math.max(minBody - lowWick, minBody * 0.99);

    const baseVol = 5000000 / (count * 2);
    const volume = baseVol * (0.5 + r4 * 1.2 + Math.abs(changePct) / volatility);

    candles.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.round(volume),
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Simulates micro-tick on the latest candle in real-time
 */
export function simulatePriceTick(lastCandle: CandleStick, volatility = 0.002): CandleStick {
  const delta = (Math.random() - 0.49) * volatility * lastCandle.close;
  const newClose = Math.max(0.01, lastCandle.close + delta);
  return {
    ...lastCandle,
    close: newClose,
    high: Math.max(lastCandle.high, newClose),
    low: Math.min(lastCandle.low, newClose),
    volume: lastCandle.volume + Math.floor(Math.random() * 5 + 1),
  };
}

// -------------------------------------------------------------
// TECHNICAL INDICATORS CALCULATION
// -------------------------------------------------------------

export function calculateSMA(candles: CandleStick[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(candles: CandleStick[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevEma === null) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      const currentEma = candles[i].close * k + prevEma * (1 - k);
      prevEma = currentEma;
      result.push(currentEma);
    }
  }
  return result;
}

export function calculateBollingerBands(
  candles: CandleStick[],
  period = 20,
  multiplier = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const ma = middle[i];
    if (ma === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - ma;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(ma + multiplier * stdDev);
    lower.push(ma - multiplier * stdDev);
  }

  return { upper, middle, lower };
}

export function calculateVWAP(candles: CandleStick[]): (number | null)[] {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  return candles.map((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
  });
}

export function calculateRSI(candles: CandleStick[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (i < period) {
      avgGain += gain;
      avgLoss += loss;
      result.push(null);
      continue;
    }

    if (i === period) {
      avgGain = (avgGain + gain) / period;
      avgLoss = (avgLoss + loss) / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(rsi);
    }
  }
  return result;
}

export function calculateMACD(
  candles: CandleStick[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate EMA of macdLine
  const validMacdValues: { index: number; val: number }[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) validMacdValues.push({ index: idx, val });
  });

  const signalLine: (number | null)[] = new Array(candles.length).fill(null);
  const k = 2 / (signalPeriod + 1);
  let prevSignal: number | null = null;

  for (let i = 0; i < validMacdValues.length; i++) {
    const { index, val } = validMacdValues[i];
    if (i < signalPeriod - 1) {
      continue;
    }
    if (prevSignal === null) {
      let sum = 0;
      for (let j = 0; j < signalPeriod; j++) {
        sum += validMacdValues[i - j].val;
      }
      prevSignal = sum / signalPeriod;
      signalLine[index] = prevSignal;
    } else {
      prevSignal = val * k + prevSignal * (1 - k);
      signalLine[index] = prevSignal;
    }
  }

  const histogram: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram.push(macdLine[i]! - signalLine[i]!);
    } else {
      histogram.push(null);
    }
  }

  return { macdLine, signalLine, histogram };
}

export function toHeikinAshi(candles: CandleStick[]): CandleStick[] {
  const haCandles: CandleStick[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen =
      i === 0 ? (c.open + c.close) / 2 : (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }
  return haCandles;
}

// -------------------------------------------------------------
// INITIAL SEED TRADE JOURNAL ENTRIES
// -------------------------------------------------------------

export const INITIAL_TRADE_JOURNAL: TradeJournalEntry[] = [];

export const INITIAL_TRADING_ACCOUNT: TradingAccount = {
  balance: 100000.0,
  initialBalance: 100000.0,
  currency: 'USD',
  riskPerTradePercent: 1.0,
  openOrders: [],
  closedOrders: [],
  journal: INITIAL_TRADE_JOURNAL,
};
