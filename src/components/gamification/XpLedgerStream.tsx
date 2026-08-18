import React, { useState } from 'react';
import { XpTransaction, XpCategory } from '../../types';
import { Zap, Clock, ArrowUpRight, Filter, Database } from 'lucide-react';

interface XpLedgerStreamProps {
  transactions: XpTransaction[];
}

export function XpLedgerStream({ transactions }: XpLedgerStreamProps) {
  const [filterCategory, setFilterCategory] = useState<XpCategory | 'all'>('all');

  const filtered = filterCategory === 'all'
    ? transactions
    : transactions.filter((t) => t.category === filterCategory);

  const getCategoryColor = (category: XpCategory) => {
    switch (category) {
      case 'task':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'habit':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'quest':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'course':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'language':
        return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
      case 'trading':
        return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
      case 'badge':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const totalXpLogged = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
            Immutable XP Ledger & Audit Stream
          </h2>
          <p className="text-xs text-neutral-400">
            Total recorded yield: <strong className="text-amber-500 font-mono">+{totalXpLogged.toLocaleString()} XP</strong>
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'task', 'habit', 'quest', 'course', 'language', 'trading', 'badge'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No XP transactions recorded in this filter view.
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {tx.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                    <span className={`px-1.5 py-0.2 rounded border font-mono font-bold uppercase ${getCategoryColor(tx.category)}`}>
                      {tx.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    </span>
                    {tx.streakMultiplier && tx.streakMultiplier > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-orange-500 font-bold">{tx.streakMultiplier}x Streak</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black font-mono text-emerald-500">
                  +{tx.amount} XP
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
