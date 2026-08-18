import React from 'react';
import { BrokerAccount, BrokerPosition, NewBrokerOrder, RiskAnalysisResult } from '../../types';
import { RiskEngine } from '../../lib/broker/RiskEngine';
import { AlertTriangle, CheckCircle, ShieldAlert, X } from 'lucide-react';

interface LiveOrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: NewBrokerOrder;
  currentPrice: number;
  account: BrokerAccount;
  positions: BrokerPosition[];
}

export function LiveOrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  currentPrice,
  account,
  positions,
}: LiveOrderConfirmationModalProps) {
  if (!isOpen) return null;

  const riskResult: RiskAnalysisResult = RiskEngine.calculateRisk(account, positions, order, currentPrice);

  const isLong = order.direction === 'long';
  const isLive = order.mode === 'LIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${isLive ? 'bg-rose-500/10 border-rose-500/20' : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLive ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-neutral-950'}`}>
              {isLive ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {isLive ? 'Confirm LIVE Market Execution' : 'Confirm Order Parameters'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isLive ? 'Real institutional broker DMA execution' : 'Paper trading execution engine'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-5">
          {/* Order Summary Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Symbol & Category</span>
              <p className="text-sm font-black text-neutral-900 dark:text-white">{order.symbol}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Side / Direction</span>
              <p className={`text-sm font-black uppercase ${isLong ? 'text-emerald-500' : 'text-rose-500'}`}>
                {order.direction} ({order.orderType})
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Execution Size</span>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">{order.quantity} units</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Est. Fill Price</span>
              <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">${currentPrice.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Stop Loss</span>
              <p className="text-sm font-mono font-bold text-rose-500">{order.stopLoss ? `$${order.stopLoss}` : 'None (High Risk)'}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-neutral-400">Take Profit</span>
              <p className="text-sm font-mono font-bold text-emerald-500">{order.takeProfit ? `$${order.takeProfit}` : 'Open'}</p>
            </div>
          </div>

          {/* Risk Engine Assessment */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>Risk Engine Evaluation</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${riskResult.allowed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                {riskResult.allowed ? 'PASSED RISK CHECK' : 'RISK BREACH'}
              </span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-center">
                <span className="text-[10px] text-neutral-400 block">Est. Risk ($)</span>
                <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                  ${riskResult.maximumLoss.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-center">
                <span className="text-[10px] text-neutral-400 block">% of Equity</span>
                <span className={`text-sm font-mono font-bold ${riskResult.riskPercentOfEquity > 2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {riskResult.riskPercentOfEquity}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-center">
                <span className="text-[10px] text-neutral-400 block">Risk:Reward</span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {riskResult.riskRewardRatio > 0 ? `${riskResult.riskRewardRatio}R` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Violations / Warnings */}
            {riskResult.violations.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Order Submission Blocked:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  {riskResult.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}

            {riskResult.warnings.length > 0 && riskResult.violations.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Risk Advisory:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  {riskResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!riskResult.allowed && isLive}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
            }`}
          >
            {isLive ? 'Confirm LIVE Order Execution' : 'Execute Paper Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
