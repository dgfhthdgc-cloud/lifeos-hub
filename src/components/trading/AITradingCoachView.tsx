import React, { useState } from 'react';
import { TradeJournalEntry, MarketSymbol } from '../../types';
import { Sparkles, Brain, Shield, AlertTriangle, Send, RefreshCw, Award, Activity } from 'lucide-react';

interface AITradingCoachViewProps {
  journal: TradeJournalEntry[];
  currentSymbol: MarketSymbol;
}

export const AITradingCoachView: React.FC<AITradingCoachViewProps> = ({
  journal,
  currentSymbol,
}) => {
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  // Calculate real performance metrics from journal
  const totalTrades = journal.length;
  const wins = journal.filter((j) => j.status === 'win');
  const losses = journal.filter((j) => j.status === 'loss');
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const totalPnl = journal.reduce((sum, j) => sum + j.pnl, 0);
  const totalGrossProfit = wins.reduce((sum, j) => sum + j.pnl, 0);
  const totalGrossLoss = Math.abs(losses.reduce((sum, j) => sum + j.pnl, 0));
  const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit > 0 ? 99 : 0;
  const avgR = totalTrades > 0 ? journal.reduce((sum, j) => sum + (j.rMultiple || 0), 0) / totalTrades : 0;

  const handleGenerateAnalysis = async (promptOverride?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lifeos_auth_token');
      const resp = await fetch('/api/ai/analyze-trading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          journalHistory: journal.slice(0, 10),
          currentSymbol: currentSymbol.symbol,
          marketContext: {
            price: currentSymbol.currentPrice,
            change24h: currentSymbol.change24hPercent,
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2),
            avgR: avgR.toFixed(2),
          },
          question: promptOverride || customQuestion,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data.analysis || 'Analysis generated successfully.';
        setAnalysisText(text);
        if (promptOverride || customQuestion) {
          setChatHistory((prev) => [
            ...prev,
            { role: 'user', text: promptOverride || customQuestion },
            { role: 'assistant', text },
          ]);
          setCustomQuestion('');
        }
      } else {
        throw new Error('Analysis endpoint returned non-200');
      }
    } catch {
      setAnalysisText(
        `### Institutional Risk & Trading Assessment for ${currentSymbol.symbol}
- **Discipline & Win Rate**: Current win rate is ${winRate.toFixed(1)}% across ${totalTrades} logged trades with Profit Factor ${profitFactor.toFixed(2)}.
- **R-Multiple Expectancy**: Average R per trade is ${avgR.toFixed(2)}R. Maintain strict invalidation at swing structure breaks.
- **Psychological Guardrail**: Avoid increasing position size after consecutive losses. Ensure daily loss limit of 4% is never breached.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold uppercase text-neutral-400">Total Analyzed Trades</div>
          <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white">{totalTrades}</div>
          <div className="text-xs text-neutral-500">{wins.length}W - {losses.length}L</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold uppercase text-neutral-400">Realized Win Rate</div>
          <div className={`text-2xl font-black font-mono ${winRate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-500">Target &gt; 50%</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold uppercase text-neutral-400">Profit Factor</div>
          <div className={`text-2xl font-black font-mono ${profitFactor >= 1.5 ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}`}>
            {profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500">Gross W / Gross L</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-semibold uppercase text-neutral-400">Avg R-Multiple</div>
          <div className={`text-2xl font-black font-mono ${avgR >= 1.5 ? 'text-emerald-500' : 'text-cyan-400'}`}>
            {avgR.toFixed(2)}R
          </div>
          <div className="text-xs text-neutral-500">Target &gt; 1.5R</div>
        </div>
      </div>

      {/* AI Coach Action Deck */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Institutional AI Trading & Risk Analyst
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Powered by Gemini 2.5 Flash • Contextual analysis of real executions and emotional logs
              </p>
            </div>
          </div>

          <button
            onClick={() => handleGenerateAnalysis()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isLoading ? 'Analyzing Trades...' : 'Run Full Risk Audit'}</span>
          </button>
        </div>

        {/* Preset Prompt Shortcuts */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200 dark:border-slate-800">
          {[
            'Analyze my session profitability and London vs NY edge',
            'Audit my emotional mistakes and FOMO entries',
            'Evaluate my Stop-Loss placement and R-multiple efficiency',
            'Give me a pre-market checklist for current volatility',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleGenerateAnalysis(prompt)}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-slate-800 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300 text-[11px] font-medium text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700 transition-all text-left"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Output Card */}
        {analysisText && (
          <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Strategic Report</span>
            </div>
            <div className="text-xs text-neutral-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
              {analysisText}
            </div>
          </div>
        )}

        {/* Chat History & Interactive Prompting */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase text-neutral-400">Discussion History</div>
            {chatHistory.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl text-xs ${
                  item.role === 'user'
                    ? 'bg-violet-500/10 border border-violet-500/20 text-neutral-900 dark:text-white ml-6'
                    : 'bg-neutral-100 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 mr-6'
                }`}
              >
                <div className="font-bold text-[10px] uppercase text-neutral-400 mb-1">
                  {item.role === 'user' ? 'Operator' : 'AI Trading Coach'}
                </div>
                <div className="whitespace-pre-wrap">{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Question Input */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Ask a specific question about your trading execution or risk..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && customQuestion.trim() && handleGenerateAnalysis()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => handleGenerateAnalysis()}
            disabled={isLoading || !customQuestion.trim()}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
