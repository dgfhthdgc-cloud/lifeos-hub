import React from 'react';
import { ActiveOrder, MarketSymbol } from '../../types';
import { TrendingUp, TrendingDown, XCircle, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface OpenPositionsTableProps {
  orders: ActiveOrder[];
  symbols: MarketSymbol[];
  onCloseOrder: (orderId: string) => void;
}

export const OpenPositionsTable: React.FC<OpenPositionsTableProps> = ({
  orders,
  symbols,
  onCloseOrder,
}) => {
  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-slate-100 font-mono uppercase tracking-wider">
            Open Paper Positions ({orders.length})
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400 text-[10px] uppercase">
              <th className="pb-2">Asset</th>
              <th className="pb-2">Side</th>
              <th className="pb-2">Size</th>
              <th className="pb-2">Entry Price</th>
              <th className="pb-2">Current Price</th>
              <th className="pb-2">Stop Loss</th>
              <th className="pb-2">Take Profit</th>
              <th className="pb-2">Floating PnL</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
            {orders.map((order) => {
              const sym = symbols.find((s) => s.symbol === order.symbol);
              const currentPrice = sym?.currentPrice || order.entryPrice;
              const decimals = sym?.decimals || 2;

              const isLong = order.direction === 'long';
              const priceDiff = isLong ? currentPrice - order.entryPrice : order.entryPrice - currentPrice;
              const pnl = priceDiff * order.size;
              const pnlPercent = (priceDiff / order.entryPrice) * 100;
              const isProfit = pnl >= 0;

              return (
                <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 font-bold text-neutral-900 dark:text-slate-100">{order.symbol}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        isLong
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {order.direction}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-700 dark:text-slate-300">{order.size}</td>
                  <td className="py-3 text-neutral-700 dark:text-slate-300">${order.entryPrice.toFixed(decimals)}</td>
                  <td className="py-3 text-neutral-900 dark:text-slate-100 font-bold">${currentPrice.toFixed(decimals)}</td>
                  <td className="py-3 text-rose-600 dark:text-rose-400">
                    {order.stopLoss ? `$${order.stopLoss.toFixed(decimals)}` : '--'}
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400">
                    {order.takeProfit ? `$${order.takeProfit.toFixed(decimals)}` : '--'}
                  </td>
                  <td className="py-3">
                    <div className={isProfit ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                      {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onCloseOrder(order.id)}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] py-1 px-2.5 rounded-lg"
                    >
                      Close Position
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
