import React, { useState } from 'react';
import { MarketSymbol } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShieldCheck, DollarSign, Percent, ArrowRight, Sparkles } from 'lucide-react';

interface PositionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: MarketSymbol;
  accountBalance: number;
}

export const PositionCalculatorModal: React.FC<PositionCalculatorModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  accountBalance,
}) => {
  const [balance, setBalance] = useState<number>(accountBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [entryPrice, setEntryPrice] = useState<number>(currentSymbol.currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    Number((currentSymbol.currentPrice * 0.985).toFixed(currentSymbol.decimals))
  );

  // Calculations
  const dollarRisk = (balance * riskPercent) / 100;
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const positionUnits = priceDistance > 0 ? dollarRisk / priceDistance : 0;
  const positionNotional = positionUnits * entryPrice;

  const target2R =
    entryPrice > stopLossPrice
      ? entryPrice + priceDistance * 2
      : entryPrice - priceDistance * 2;
  const target3R =
    entryPrice > stopLossPrice
      ? entryPrice + priceDistance * 3
      : entryPrice - priceDistance * 3;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Risk & Position Sizing Calculator"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          Calculate the exact lot or contract size for {currentSymbol.symbol} to ensure risk never exceeds your pre-determined capital threshold.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Account Balance ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Risk Per Trade (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={10}
                value={riskPercent}
                onChange={(e) => setRiskPercent(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1">
                {[0.5, 1.0, 2.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className="px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-[11px] font-mono text-neutral-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Entry Price ($)</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300 font-mono">Stop Loss Price ($)</label>
            <input
              type="number"
              step="any"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-sm font-mono text-neutral-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Calculation Result Summary Card */}
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-slate-100 font-mono">Optimal Execution Metrics</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Max $ Risk (1R)</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400">${dollarRisk.toFixed(2)}</div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Stop Distance</div>
              <div className="text-base font-bold text-neutral-800 dark:text-slate-200">
                ${priceDistance.toFixed(currentSymbol.decimals)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Recommended Size</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {positionUnits.toFixed(currentSymbol.category === 'Crypto' ? 4 : 2)} {currentSymbol.category === 'Crypto' ? 'Units' : 'Lots'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Target 2R Price</div>
              <div className="text-sm font-semibold text-neutral-700 dark:text-slate-300">${target2R.toFixed(currentSymbol.decimals)}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">+${(dollarRisk * 2).toFixed(2)}</div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Target 3R Price</div>
              <div className="text-sm font-semibold text-neutral-700 dark:text-slate-300">${target3R.toFixed(currentSymbol.decimals)}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">+${(dollarRisk * 3).toFixed(2)}</div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 dark:text-slate-500 uppercase">Notional Position</div>
              <div className="text-sm font-semibold text-neutral-700 dark:text-slate-300">${positionNotional.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-slate-800">
          <Button variant="primary" onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs">
            Close Calculator
          </Button>
        </div>
      </div>
    </Modal>
  );
};
