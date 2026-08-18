import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CandleStick,
  MarketSymbol,
  Timeframe,
  ChartType,
  DrawingToolType,
  ChartDrawing,
  IndicatorConfig,
} from '../../types';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateVWAP,
  calculateRSI,
  calculateMACD,
  toHeikinAshi,
  detectMarketStructure,
  detectFairValueGaps,
  detectOrderBlocks,
  detectLiquidityLevels,
} from '../../lib/tradingData';
import { useTheme } from '../../context/ThemeContext';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  TrendingUp,
  BarChart,
  Activity,
  Layers,
  Info,
} from 'lucide-react';

interface TradingChartCanvasProps {
  symbol: MarketSymbol;
  rawCandles: CandleStick[];
  timeframe: Timeframe;
  onChangeTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  indicators: IndicatorConfig;
  onOpenIndicatorsModal: () => void;
  activeDrawingTool: DrawingToolType;
  onDrawingCompleted?: (drawing: ChartDrawing) => void;
  drawings: ChartDrawing[];
  onUpdateDrawings: (drawings: ChartDrawing[]) => void;
  isMagnetEnabled: boolean;
  replayIndex?: number; // if set, only show candles up to this index
}

const SUPPORTED_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];

export const TradingChartCanvas: React.FC<TradingChartCanvasProps> = ({
  symbol,
  rawCandles,
  timeframe,
  onChangeTimeframe,
  chartType,
  onChangeChartType,
  indicators,
  onOpenIndicatorsModal,
  activeDrawingTool,
  onDrawingCompleted,
  drawings,
  onUpdateDrawings,
  isMagnetEnabled,
  replayIndex,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewport window state (how many candles visible, offset from right)
  const [visibleCount, setVisibleCount] = useState(65);
  const [rightOffset, setRightOffset] = useState(0); // 0 means latest candle is rightmost
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  // Mouse crosshair position
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Active drawing in progress
  const [currentDraftPoints, setCurrentDraftPoints] = useState<{ time: number; price: number }[]>(
    []
  );

  // State to force re-renders on resize
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement && !isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          // Fallback to CSS fullscreen
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === containerRef.current;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle ESC key for CSS fullscreen fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // ResizeObserver for responsive chart resizing
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    resizeObserver.observe(canvasContainer);
    return () => resizeObserver.disconnect();
  }, []);

  // Prepare candle data based on Replay filter & Chart style
  const candles = useMemo(() => {
    let dataset = rawCandles;
    if (replayIndex !== undefined && replayIndex >= 0 && replayIndex < rawCandles.length) {
      dataset = rawCandles.slice(0, replayIndex + 1);
    }
    if (chartType === 'heikin_ashi') {
      return toHeikinAshi(dataset);
    }
    return dataset;
  }, [rawCandles, replayIndex, chartType]);

  // Compute indicators
  const indicatorData = useMemo(() => {
    return {
      ema9: indicators.ema9 ? calculateEMA(candles, 9) : [],
      ema21: indicators.ema21 ? calculateEMA(candles, 21) : [],
      ema50: indicators.ema50 ? calculateEMA(candles, 50) : [],
      ema200: indicators.ema200 ? calculateEMA(candles, 200) : [],
      bollinger: indicators.bollingerBands ? calculateBollingerBands(candles, 20, 2) : null,
      vwap: indicators.vwap ? calculateVWAP(candles) : [],
      rsi: indicators.rsi ? calculateRSI(candles, 14) : [],
      macd: indicators.macd ? calculateMACD(candles, 12, 26, 9) : null,
      marketStructure: indicators.marketStructure ? detectMarketStructure(candles) : [],
      fairValueGaps: indicators.fairValueGaps ? detectFairValueGaps(candles) : [],
      orderBlocks: indicators.orderBlocks ? detectOrderBlocks(candles) : [],
      liquidityLevels: indicators.liquidityLevels ? detectLiquidityLevels(candles) : [],
    };
  }, [candles, indicators]);

  // Determine slice of visible candles
  const totalCount = candles.length;
  const endIndex = Math.max(1, Math.min(totalCount, totalCount - rightOffset));
  const startIndex = Math.max(0, endIndex - visibleCount);
  const visibleCandles = candles.slice(startIndex, endIndex);

  // Price Range in visible area
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: 1, maxPrice: 2, maxVolume: 100 };
    }
    let min = Infinity;
    let max = -Infinity;
    let volMax = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > volMax) volMax = c.volume;
    });

    // Add a 5% margin top & bottom
    const pad = (max - min) * 0.05 || max * 0.02;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      maxVolume: volMax || 1,
    };
  }, [visibleCandles]);

  // Coordinate Conversion Helpers
  const getXCoord = useCallback(
    (indexInVisible: number, width: number) => {
      const candleWidth = (width - 70) / visibleCount;
      return indexInVisible * candleWidth + candleWidth / 2;
    },
    [visibleCount]
  );

  const getYCoord = useCallback(
    (price: number, mainHeight: number) => {
      const range = maxPrice - minPrice || 1;
      const ratio = (price - minPrice) / range;
      return mainHeight - ratio * mainHeight;
    },
    [minPrice, maxPrice]
  );

  const getPriceFromY = useCallback(
    (y: number, mainHeight: number) => {
      const ratio = (mainHeight - y) / mainHeight;
      return minPrice + ratio * (maxPrice - minPrice);
    },
    [minPrice, maxPrice]
  );

  const getTimeFromX = useCallback(
    (x: number, width: number) => {
      const candleWidth = (width - 70) / visibleCount;
      const idx = Math.floor(x / candleWidth);
      if (idx >= 0 && idx < visibleCandles.length) {
        return visibleCandles[idx].time;
      }
      return candles[candles.length - 1]?.time || Date.now();
    },
    [visibleCount, visibleCandles, candles]
  );

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Determine sub-pane heights (Oscillators: RSI / MACD)
    const hasOscillators = indicators.rsi || indicators.macd;
    const oscHeight = hasOscillators ? 90 : 0;
    const mainHeight = Math.max(100, height - oscHeight - 30); // 30px for bottom time scale

    // Theme Colors
    const bgFill = isDark ? '#090d16' : '#ffffff';
    const gridStroke = isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.8)';
    const textFill = isDark ? '#64748b' : '#64748b';
    const dividerStroke = isDark ? '#1e293b' : '#e2e8f0';
    const hudBadgeBg = isDark ? '#334155' : '#0f172a';
    const hudBadgeText = '#f8fafc';

    // Clear background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, width, height);

    // 1. Grid Lines (Horizontal Price Grid)
    const priceSteps = 6;
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i <= priceSteps; i++) {
      const y = (mainHeight / priceSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 70, y);
      ctx.stroke();

      // Price label on right axis
      const p = getPriceFromY(y, mainHeight);
      ctx.fillStyle = textFill;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${p.toFixed(symbol.decimals)}`, width - 62, y + 3);
    }

    // 2. Vertical Time Grid Lines & Labels
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 6));
    ctx.fillStyle = textFill;
    ctx.textAlign = 'center';

    visibleCandles.forEach((c, idx) => {
      if (idx % timeStep === 0) {
        const x = getXCoord(idx, width);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mainHeight);
        ctx.stroke();

        // Time label
        const date = new Date(c.time);
        const timeStr =
          timeframe === '1D' || timeframe === '1W'
            ? `${date.getMonth() + 1}/${date.getDate()}`
            : `${date.getHours().toString().padStart(2, '0')}:${date
                .getMinutes()
                .toString()
                .padStart(2, '0')}`;
        ctx.fillText(timeStr, x, height - 10);
      }
    });

    ctx.setLineDash([]); // Reset dashed lines

    // 3. Volume Sub-Bars (rendered in bottom 22% of main chart)
    if (indicators.volume) {
      const volAreaHeight = mainHeight * 0.22;
      const volBaseY = mainHeight;
      const candleWidth = (width - 70) / visibleCount;
      const barW = Math.max(1, candleWidth * 0.7);

      visibleCandles.forEach((c, idx) => {
        const x = getXCoord(idx, width);
        const barH = (c.volume / maxVolume) * volAreaHeight;
        const isBull = c.close >= c.open;

        ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(x - barW / 2, volBaseY - barH, barW, barH);
      });
    }

    // 4. Bollinger Bands (Cloud / Fill)
    if (indicators.bollingerBands && indicatorData.bollinger) {
      const { upper, middle, lower } = indicatorData.bollinger;

      // Draw cloud fill
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const globalIdx = startIndex + i;
        const u = upper[globalIdx];
        if (u !== null && u !== undefined) {
          const x = getXCoord(i, width);
          const y = getYCoord(u, mainHeight);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const globalIdx = startIndex + i;
        const l = lower[globalIdx];
        if (l !== null && l !== undefined) {
          const x = getXCoord(i, width);
          const y = getYCoord(l, mainHeight);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(52, 211, 153, 0.06)' : 'rgba(16, 185, 129, 0.08)';
      ctx.fill();

      // Draw upper & lower boundaries
      const drawLine = (series: (number | null)[], color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        let active = false;
        for (let i = 0; i < visibleCandles.length; i++) {
          const globalIdx = startIndex + i;
          const val = series[globalIdx];
          if (val !== null && val !== undefined) {
            const x = getXCoord(i, width);
            const y = getYCoord(val, mainHeight);
            if (!active) {
              ctx.moveTo(x, y);
              active = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };

      drawLine(upper, 'rgba(52, 211, 153, 0.5)');
      drawLine(middle, 'rgba(52, 211, 153, 0.85)');
      drawLine(lower, 'rgba(52, 211, 153, 0.5)');
    }

    // 5. Moving Averages & VWAP
    const drawIndicatorLine = (series: (number | null)[], color: string, widthPx = 1.5) => {
      if (!series || series.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
      let active = false;

      for (let i = 0; i < visibleCandles.length; i++) {
        const globalIdx = startIndex + i;
        const val = series[globalIdx];
        if (val !== null && val !== undefined) {
          const x = getXCoord(i, width);
          const y = getYCoord(val, mainHeight);
          if (!active) {
            ctx.moveTo(x, y);
            active = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (indicators.ema9) drawIndicatorLine(indicatorData.ema9, '#38bdf8', 1.5);
    if (indicators.ema21) drawIndicatorLine(indicatorData.ema21, '#fb923c', 1.5);
    if (indicators.ema50) drawIndicatorLine(indicatorData.ema50, '#a855f7', 1.5);
    if (indicators.ema200) drawIndicatorLine(indicatorData.ema200, isDark ? '#f1f5f9' : '#334155', 2);
    if (indicators.vwap) drawIndicatorLine(indicatorData.vwap, '#facc15', 1.5);

    // 5.1 Fair Value Gaps (FVG)
    if (indicators.fairValueGaps && indicatorData.fairValueGaps) {
      indicatorData.fairValueGaps.forEach((fvg) => {
        const startVisibleIdx = fvg.startIndex - startIndex;
        if (startVisibleIdx + 15 < 0 || startVisibleIdx > visibleCandles.length + 5) return;

        const xStart = getXCoord(Math.max(0, startVisibleIdx), width);
        const xEnd = Math.min(width - 70, xStart + ((width - 70) / visibleCount) * 12);
        const yTop = getYCoord(fvg.top, mainHeight);
        const yBottom = getYCoord(fvg.bottom, mainHeight);
        const height = Math.abs(yBottom - yTop);
        const topY = Math.min(yTop, yBottom);

        ctx.fillStyle =
          fvg.direction === 'bullish'
            ? isDark
              ? 'rgba(16, 185, 129, 0.18)'
              : 'rgba(16, 185, 129, 0.15)'
            : isDark
            ? 'rgba(244, 63, 94, 0.18)'
            : 'rgba(244, 63, 94, 0.15)';
        ctx.fillRect(xStart, topY, xEnd - xStart, height);

        ctx.strokeStyle = fvg.direction === 'bullish' ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(xStart, topY, xEnd - xStart, height);
        ctx.setLineDash([]);

        ctx.fillStyle = fvg.direction === 'bullish' ? '#10b981' : '#f43f5e';
        ctx.font = '8px monospace';
        ctx.fillText(
          `${fvg.direction === 'bullish' ? '+FVG' : '-FVG'} ${fvg.mitigated ? '(Mit)' : ''}`,
          xStart + 3,
          topY + 9
        );
      });
    }

    // 5.2 Order Blocks (OB)
    if (indicators.orderBlocks && indicatorData.orderBlocks) {
      indicatorData.orderBlocks.forEach((ob) => {
        const startVisibleIdx = ob.candleIndex - startIndex;
        if (startVisibleIdx + 20 < 0 || startVisibleIdx > visibleCandles.length + 5) return;

        const xStart = getXCoord(Math.max(0, startVisibleIdx), width);
        const xEnd = Math.min(width - 70, xStart + ((width - 70) / visibleCount) * 16);
        const yTop = getYCoord(ob.top, mainHeight);
        const yBottom = getYCoord(ob.bottom, mainHeight);
        const height = Math.abs(yBottom - yTop);
        const topY = Math.min(yTop, yBottom);

        ctx.fillStyle =
          ob.direction === 'bullish'
            ? isDark
              ? 'rgba(245, 158, 11, 0.16)'
              : 'rgba(245, 158, 11, 0.14)'
            : isDark
            ? 'rgba(168, 85, 247, 0.16)'
            : 'rgba(168, 85, 247, 0.14)';
        ctx.fillRect(xStart, topY, xEnd - xStart, height);

        ctx.strokeStyle = ob.direction === 'bullish' ? '#f59e0b' : '#a855f7';
        ctx.lineWidth = 1;
        ctx.strokeRect(xStart, topY, xEnd - xStart, height);

        ctx.fillStyle = ob.direction === 'bullish' ? '#f59e0b' : '#a855f7';
        ctx.font = '8px monospace';
        ctx.fillText(`${ob.direction === 'bullish' ? '+OB' : '-OB'} Zone`, xStart + 4, topY + 9);
      });
    }

    // 5.3 Liquidity Pools (BSL / SSL)
    if (indicators.liquidityLevels && indicatorData.liquidityLevels) {
      indicatorData.liquidityLevels.forEach((liq) => {
        const startVisibleIdx = liq.startIndex - startIndex;
        if (startVisibleIdx > visibleCandles.length + 5) return;

        const xStart = getXCoord(Math.max(0, startVisibleIdx), width);
        const y = getYCoord(liq.price, mainHeight);

        ctx.strokeStyle = liq.type === 'BSL' ? '#06b6d4' : '#ec4899';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(width - 70, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tag label
        ctx.fillStyle = liq.type === 'BSL' ? '#06b6d4' : '#ec4899';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`$$$ ${liq.label}`, Math.max(xStart + 6, 8), y - 3);
      });
    }

    // 5.4 Market Structure Breaks (BOS / CHoCH)
    if (indicators.marketStructure && indicatorData.marketStructure) {
      indicatorData.marketStructure.forEach((msb) => {
        const startVisibleIdx = msb.brokenLevelIndex - startIndex;
        const endVisibleIdx = msb.candleIndex - startIndex;

        if (endVisibleIdx < 0 || startVisibleIdx > visibleCandles.length) return;

        const xStart = getXCoord(Math.max(0, startVisibleIdx), width);
        const xEnd = getXCoord(Math.min(visibleCandles.length - 1, endVisibleIdx), width);
        const y = getYCoord(msb.price, mainHeight);

        const color =
          msb.type === 'CHoCH'
            ? '#eab308' // yellow for CHoCH
            : msb.direction === 'bullish'
            ? '#10b981'
            : '#f43f5e';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
        ctx.stroke();

        // Marker tag at break point
        ctx.fillStyle = color;
        ctx.fillRect(xEnd - 4, y - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${msb.type} (${msb.direction})`, xStart + 4, y - 3);
      });
    }

    // 6. Candlesticks / Line Chart
    const candleWidth = (width - 70) / visibleCount;
    const bodyWidth = Math.max(2, candleWidth * 0.72);

    if (chartType === 'line') {
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; // emerald
      ctx.lineWidth = 2;
      visibleCandles.forEach((c, idx) => {
        const x = getXCoord(idx, width);
        const y = getYCoord(c.close, mainHeight);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else {
      // Candlesticks (or Heikin-Ashi)
      visibleCandles.forEach((c, idx) => {
        const x = getXCoord(idx, width);
        const openY = getYCoord(c.open, mainHeight);
        const closeY = getYCoord(c.close, mainHeight);
        const highY = getYCoord(c.high, mainHeight);
        const lowY = getYCoord(c.low, mainHeight);

        const isBull = c.close >= c.open;
        const color = isBull ? '#10b981' : '#f43f5e';

        // Draw Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw Candle Body
        const topY = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, topY, bodyWidth, bodyHeight);
      });
    }

    // 7. Latest Price Horizontal Line & Tag
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      const latestY = getYCoord(latestCandle.close, mainHeight);
      const isBull = latestCandle.close >= latestCandle.open;

      ctx.beginPath();
      ctx.strokeStyle = isBull ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(0, latestY);
      ctx.lineTo(width - 70, latestY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge on right
      ctx.fillStyle = isBull ? '#10b981' : '#f43f5e';
      ctx.fillRect(width - 68, latestY - 9, 64, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${latestCandle.close.toFixed(symbol.decimals)}`, width - 64, latestY + 4);
    }

    // 8. Oscillator Sub-Pane (RSI / MACD)
    if (hasOscillators) {
      const oscTopY = mainHeight + 10;
      const oscBottomY = height - 25;
      const oscAreaH = Math.max(20, oscBottomY - oscTopY);

      // Divider line
      ctx.strokeStyle = dividerStroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, oscTopY - 5);
      ctx.lineTo(width, oscTopY - 5);
      ctx.stroke();

      if (indicators.rsi && indicatorData.rsi) {
        // RSI 70 and 30 reference lines
        const rsi70Y = oscTopY + oscAreaH * 0.3;
        const rsi30Y = oscTopY + oscAreaH * 0.7;

        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, rsi70Y);
        ctx.lineTo(width - 70, rsi70Y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, rsi30Y);
        ctx.lineTo(width - 70, rsi30Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // RSI Labels
        ctx.fillStyle = textFill;
        ctx.font = '9px monospace';
        ctx.fillText('RSI (14)', 8, oscTopY + 12);
        ctx.fillText('70', width - 60, rsi70Y + 3);
        ctx.fillText('30', width - 60, rsi30Y + 3);

        // Draw RSI line
        ctx.beginPath();
        ctx.strokeStyle = '#818cf8'; // indigo-400
        ctx.lineWidth = 1.5;
        let started = false;

        for (let i = 0; i < visibleCandles.length; i++) {
          const globalIdx = startIndex + i;
          const rsiVal = indicatorData.rsi[globalIdx];
          if (rsiVal !== null && rsiVal !== undefined) {
            const x = getXCoord(i, width);
            const y = oscBottomY - (rsiVal / 100) * oscAreaH;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }
    }

    // 9. Chart Drawings Overlay
    const allDrawingsToRender = [...drawings];
    if (currentDraftPoints.length > 0) {
      allDrawingsToRender.push({
        id: 'draft',
        type: activeDrawingTool,
        points: currentDraftPoints,
        color: activeDrawingTool === 'short_position' ? '#f43f5e' : '#10b981',
      });
    }

    allDrawingsToRender.forEach((d) => {
      if (d.points.length === 0) return;

      const p1 = d.points[0];
      const p2 = d.points[1] || p1;

      const findIdx = (time: number) => {
        let bestIdx = 0;
        let minDiff = Infinity;
        visibleCandles.forEach((c, idx) => {
          const diff = Math.abs(c.time - time);
          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = idx;
          }
        });
        return bestIdx;
      };

      const idx1 = findIdx(p1.time);
      const x1 = getXCoord(idx1, width);
      const y1 = getYCoord(p1.price, mainHeight);

      const idx2 = findIdx(p2.time);
      const x2 = getXCoord(idx2, width);
      const y2 = getYCoord(p2.price, mainHeight);

      ctx.save();

      if (d.type === 'horizontal_line') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.lineTo(width - 70, y1);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`KEY LEVEL $${p1.price.toFixed(symbol.decimals)}`, 10, y1 - 4);
      } else if (d.type === 'trendline') {
        ctx.strokeStyle = d.color || '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'rectangle') {
        const leftX = Math.min(x1, x2);
        const topY = Math.min(y1, y2);
        const rectW = Math.abs(x2 - x1) || 60;
        const rectH = Math.abs(y2 - y1) || 30;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(leftX, topY, rectW, rectH);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(leftX, topY, rectW, rectH);

        ctx.fillStyle = '#34d399';
        ctx.font = '9px monospace';
        ctx.fillText('ORDER BLOCK / FVG', leftX + 4, topY + 12);
      } else if (d.type === 'fibonacci') {
        const ratios = [
          { r: 0, label: '0.0% ($' + p1.price.toFixed(symbol.decimals) + ')', color: '#94a3b8' },
          { r: 0.236, label: '23.6%', color: '#f43f5e' },
          { r: 0.382, label: '38.2%', color: '#fb923c' },
          { r: 0.5, label: '50.0% (Equilibrium)', color: '#38bdf8' },
          { r: 0.618, label: '61.8% (Golden Pocket)', color: '#facc15' },
          { r: 0.786, label: '78.6%', color: '#a855f7' },
          { r: 1.0, label: '100.0% ($' + p2.price.toFixed(symbol.decimals) + ')', color: '#94a3b8' },
        ];

        ratios.forEach(({ r, label, color }) => {
          const fibPrice = p1.price + (p2.price - p1.price) * r;
          const fibY = getYCoord(fibPrice, mainHeight);

          ctx.strokeStyle = color;
          ctx.lineWidth = r === 0.5 || r === 0.618 ? 1.5 : 1;
          ctx.setLineDash(r === 0 || r === 1 ? [] : [3, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, fibY);
          ctx.lineTo(Math.max(x2, width - 70), fibY);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.font = '9px monospace';
          ctx.fillText(`Fib ${label}`, Math.max(x1 + 8, 12), fibY - 3);
        });
      } else if (d.type === 'long_position' || d.type === 'short_position') {
        const isLong = d.type === 'long_position';
        const entryPrice = p1.price;
        const targetPrice = p2.price;
        const riskDistance = Math.abs(targetPrice - entryPrice) / 2.5; // default 2.5 R:R
        const stopPrice = isLong ? entryPrice - riskDistance : entryPrice + riskDistance;

        const entryY = getYCoord(entryPrice, mainHeight);
        const targetY = getYCoord(targetPrice, mainHeight);
        const stopY = getYCoord(stopPrice, mainHeight);

        const leftX = Math.min(x1, x2);
        const boxW = Math.max(Math.abs(x2 - x1), 100);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        const profitTop = Math.min(entryY, targetY);
        const profitH = Math.abs(entryY - targetY);
        ctx.fillRect(leftX, profitTop, boxW, profitH);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
        const lossTop = Math.min(entryY, stopY);
        const lossH = Math.abs(entryY - stopY);
        ctx.fillRect(leftX, lossTop, boxW, lossH);

        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(leftX, profitTop, boxW, profitH);
        ctx.strokeStyle = '#f43f5e';
        ctx.strokeRect(leftX, lossTop, boxW, lossH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`Target: $${targetPrice.toFixed(symbol.decimals)} (2.50 R:R)`, leftX + 6, profitTop + 14);
        ctx.fillText(`Stop: $${stopPrice.toFixed(symbol.decimals)}`, leftX + 6, lossTop + lossH - 6);
      }

      ctx.restore();
    });

    // 10. Mouse Crosshair & Cursor HUD
    if (hoverPos && hoverPos.x < width - 70 && hoverPos.y < mainHeight) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverPos.x, 0);
      ctx.lineTo(hoverPos.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverPos.y);
      ctx.lineTo(width - 70, hoverPos.y);
      ctx.stroke();

      // Hover Price badge on right
      const hoverPrice = getPriceFromY(hoverPos.y, mainHeight);
      ctx.fillStyle = hudBadgeBg;
      ctx.fillRect(width - 68, hoverPos.y - 9, 64, 18);
      ctx.fillStyle = hudBadgeText;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${hoverPrice.toFixed(symbol.decimals)}`, width - 64, hoverPos.y + 4);

      ctx.restore();
    }
  }, [
    visibleCandles,
    candles,
    symbol,
    timeframe,
    chartType,
    indicators,
    indicatorData,
    drawings,
    currentDraftPoints,
    activeDrawingTool,
    hoverPos,
    visibleCount,
    startIndex,
    minPrice,
    maxPrice,
    maxVolume,
    getXCoord,
    getYCoord,
    getPriceFromY,
    isDark,
    canvasDimensions,
  ]);

  // Handle Mouse Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mainHeight = rect.height - (indicators.rsi || indicators.macd ? 90 : 0) - 30;

    if (activeDrawingTool !== 'cursor') {
      let clickedPrice = getPriceFromY(y, mainHeight);
      let clickedTime = getTimeFromX(x, rect.width);

      if (isMagnetEnabled && visibleCandles.length > 0) {
        const candleW = (rect.width - 70) / visibleCount;
        const idx = Math.min(visibleCandles.length - 1, Math.max(0, Math.floor(x / candleW)));
        const candle = visibleCandles[idx];
        if (candle) {
          const prices = [candle.open, candle.high, candle.low, candle.close];
          const closest = prices.reduce((prev, curr) =>
            Math.abs(curr - clickedPrice) < Math.abs(prev - clickedPrice) ? curr : prev
          );
          clickedPrice = closest;
          clickedTime = candle.time;
        }
      }

      if (currentDraftPoints.length === 0) {
        if (activeDrawingTool === 'horizontal_line') {
          const newDrawing: ChartDrawing = {
            id: `draw-${Date.now()}`,
            type: 'horizontal_line',
            points: [{ time: clickedTime, price: clickedPrice }],
            color: '#38bdf8',
          };
          onUpdateDrawings([...drawings, newDrawing]);
          onDrawingCompleted?.(newDrawing);
        } else {
          setCurrentDraftPoints([{ time: clickedTime, price: clickedPrice }]);
        }
      } else {
        const newDrawing: ChartDrawing = {
          id: `draw-${Date.now()}`,
          type: activeDrawingTool,
          points: [currentDraftPoints[0], { time: clickedTime, price: clickedPrice }],
          color:
            activeDrawingTool === 'short_position'
              ? '#f43f5e'
              : activeDrawingTool === 'long_position'
              ? '#10b981'
              : '#38bdf8',
        };
        onUpdateDrawings([...drawings, newDrawing]);
        setCurrentDraftPoints([]);
        onDrawingCompleted?.(newDrawing);
      }
    } else {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartOffset(rightOffset);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });

    if (isDragging && activeDrawingTool === 'cursor') {
      const deltaX = e.clientX - dragStartX;
      const candleWidth = (rect.width - 70) / visibleCount;
      const candleDelta = Math.round(deltaX / candleWidth);
      const newOffset = Math.max(
        0,
        Math.min(candles.length - visibleCount, dragStartOffset + candleDelta)
      );
      setRightOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setVisibleCount((prev) => Math.max(15, prev - 4));
    } else {
      setVisibleCount((prev) => Math.min(Math.min(candles.length, 250), prev + 4));
    }
  };

  // Active candle under cursor for HUD
  const hoveredCandle = useMemo(() => {
    if (!hoverPos || visibleCandles.length === 0 || !canvasRef.current) {
      return candles[candles.length - 1];
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const candleWidth = (rect.width - 70) / visibleCount;
    const idx = Math.floor(hoverPos.x / candleWidth);
    if (idx >= 0 && idx < visibleCandles.length) {
      return visibleCandles[idx];
    }
    return candles[candles.length - 1];
  }, [hoverPos, visibleCandles, candles, visibleCount]);

  return (
    <div
      ref={containerRef}
      className={`border rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none bg-white dark:bg-slate-950 border-none'
          : 'relative w-full h-full bg-white dark:bg-slate-950 border-neutral-200/80 dark:border-slate-800'
      }`}
    >
      {/* Top Chart Toolbar: Timeframe, Chart Type, Indicator Triggers, OHLC HUD, Fullscreen */}
      <div className="p-3 bg-neutral-100/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Timeframe Selectors */}
        <div className="flex items-center gap-1 overflow-x-auto bg-neutral-200/80 dark:bg-slate-950 p-1 rounded-xl border border-neutral-300/60 dark:border-slate-800">
          {SUPPORTED_TIMEFRAMES.map((tf) => {
            const isActive =
              timeframe === tf ||
              (tf === '1H' && timeframe === '1h') ||
              (tf === '4H' && timeframe === '4h');
            return (
              <button
                key={tf}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer text-xs ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 hover:bg-neutral-300/60 dark:hover:bg-slate-900'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Center-Left: Chart Style Selector */}
        <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-slate-950 p-1 rounded-xl border border-neutral-300/60 dark:border-slate-800">
          <button
            onClick={() => onChangeChartType('candlestick')}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer ${
              chartType === 'candlestick'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            Candles
          </button>
          <button
            onClick={() => onChangeChartType('heikin_ashi')}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer ${
              chartType === 'heikin_ashi'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            Heikin Ashi
          </button>
          <button
            onClick={() => onChangeChartType('line')}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer ${
              chartType === 'line'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200'
            }`}
          >
            Line
          </button>
        </div>

        {/* Indicators Trigger & Demo Data Badge */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenIndicatorsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-neutral-50 dark:hover:bg-slate-800 border border-neutral-300/80 dark:border-slate-800 text-neutral-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono">Indicators</span>
          </button>

          <span
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-medium"
            title="Chart displays simulated historical market demo data"
          >
            <Info className="w-3 h-3" />
            <span>DEMO DATA</span>
          </span>
        </div>

        {/* Right: OHLC HUD for Active/Hovered Candle */}
        {hoveredCandle && (
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-[11px] font-mono bg-white/80 dark:bg-slate-950/80 px-3 py-1 rounded-xl border border-neutral-200 dark:border-slate-800/80 text-neutral-500 dark:text-slate-400 shadow-2xs">
            <span>
              O: <span className="text-neutral-900 dark:text-slate-200 font-semibold">${hoveredCandle.open.toFixed(symbol.decimals)}</span>
            </span>
            <span>
              H: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${hoveredCandle.high.toFixed(symbol.decimals)}</span>
            </span>
            <span>
              L: <span className="text-rose-600 dark:text-rose-400 font-semibold">${hoveredCandle.low.toFixed(symbol.decimals)}</span>
            </span>
            <span>
              C:{' '}
              <span
                className={`font-semibold ${
                  hoveredCandle.close >= hoveredCandle.open
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ${hoveredCandle.close.toFixed(symbol.decimals)}
              </span>
            </span>
          </div>
        )}

        {/* Reset Viewport Controls & Fullscreen */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisibleCount((prev) => Math.max(15, prev - 10))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisibleCount((prev) => Math.min(candles.length, prev + 10))}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200 border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setRightOffset(0);
              setVisibleCount(65);
            }}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-emerald-500 border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-white dark:bg-slate-950 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-emerald-500 border-neutral-200 dark:border-slate-800'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen Chart'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Chart Canvas Area */}
      <div
        ref={canvasContainerRef}
        className="relative flex-1 w-full min-h-[460px] cursor-crosshair bg-white dark:bg-slate-950 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Drawing Status banner if user is in a 2-point drawing mode */}
        {currentDraftPoints.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-mono font-bold shadow-xl animate-pulse pointer-events-none z-10">
            Click second anchor point to complete {activeDrawingTool.replace('_', ' ')}
          </div>
        )}
      </div>
    </div>
  );
};
