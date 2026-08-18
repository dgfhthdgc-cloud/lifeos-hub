import React, { useState, useEffect } from 'react';
import { AIChatMessage, AICoachSettings, AIScheduleAuditResult } from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  Calendar,
  Brain,
  Shield,
  Activity,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function AICoachMainView() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'audit' | 'briefing'>('chat');
  const [isThinking, setIsThinking] = useState(false);
  const [auditResults, setAuditResults] = useState<AIScheduleAuditResult[]>([]);

  useEffect(() => {
    setMessages(Storage.getAIChatHistory());
    setAuditResults(Storage.getAIScheduleAudits());
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    Storage.addAIChatMessage(userMsg);
    setMessages(newHistory);
    setInputText('');
    setIsThinking(true);

    // Dynamic AI response generation
    setTimeout(() => {
      const responseContent = generateAIResponse(userMsg.content, user?.level || 1);
      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'LIFE-OS-Omni-Flash-2.5',
      };
      Storage.addAIChatMessage(assistantMsg);
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 800);
  };

  const generateAIResponse = (query: string, userLevel: number): string => {
    const q = query.toLowerCase();
    if (q.includes('schedule') || q.includes('plan') || q.includes('routine')) {
      return `Based on your cognitive baseline and Level ${userLevel} profile, I recommend reserving high-gravity engineering blocks for the 09:00 - 11:30 AM window. Group minor administrative rituals into a single 30-minute sync block at 16:30.`;
    }
    if (q.includes('trade') || q.includes('market') || q.includes('risk')) {
      return `Quant Protocol Check: Ensure your risk-per-trade does not exceed 1.0% of your current account balance. Maintain disciplined execution logs in your Trade Journal to track statistical edge and R-multiple distribution.`;
    }
    if (q.includes('learn') || q.includes('study') || q.includes('course')) {
      return `Accelerated Learning Protocol: Apply spaced repetition retrieval practice immediately after theoretical modules. Active recall testing boosts 30-day concept retention by over 340%.`;
    }
    return `Synthesizing Life OS state: You are operating with optimal cognitive telemetry. Focus on executing your primary high-priority task block today to maximize compound XP momentum.`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500" />
            AI Strategy & Execution Coach
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Autonomous multi-domain intelligence analyzing schedule entropy, learning velocity, and performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Engine: Gemini-Omni • Ready
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          Strategic Dialogue
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Schedule Entropy Audit
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Persona / Quick Prompts Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Tactical Quick Actions</h3>
              <div className="space-y-2">
                {[
                  'Audit my today schedule for friction points',
                  'Generate optimal Deep Work block for coding',
                  'Review quant trading risk parameters',
                  'Suggest spaced repetition study plan',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(prompt);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-neutral-950 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Brain className="w-4 h-4" />
                <span>Life OS Context Injection</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Coach actively synthesizes active tasks, habits, and trade journals to deliver context-aware directives.
              </p>
            </div>
          </div>

          {/* Chat Stream View */}
          <div className="lg:col-span-3 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col h-[580px]">
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                      msg.role === 'user'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium ml-12 rounded-tr-none'
                        : 'bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 mr-12 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && <span className="font-mono">{msg.modelUsed}</span>}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-black text-xs flex items-center justify-center shrink-0">
                      Ω
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Analyzing Life OS state telemetry...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask coach for strategic optimization, schedule fixes, or domain analysis..."
                className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Schedule Audit View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase">Schedule Optimization Score</div>
              <div className="text-2xl font-black text-emerald-500 mt-1">94/100</div>
              <div className="text-[11px] text-neutral-400 mt-1">Optimal energy alignment</div>
            </div>
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase">Cognitive Load Index</div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">Low-Medium</div>
              <div className="text-[11px] text-neutral-400 mt-1">2 Context switches detected</div>
            </div>
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase">Deep Work Capacity</div>
              <div className="text-2xl font-black text-blue-500 mt-1">4.5 Hours</div>
              <div className="text-[11px] text-neutral-400 mt-1">High-focus uninterrupted time</div>
            </div>
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase">Recovery Buffer</div>
              <div className="text-2xl font-black text-amber-500 mt-1">Adequate</div>
              <div className="text-[11px] text-neutral-400 mt-1">Circadian rhythm synced</div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Real-Time Schedule Recommendations
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    High Impact
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Protect Morning Focus Window (09:00 - 11:30)</h4>
                  <p className="text-xs text-neutral-500">
                    Schedule engineering tasks during morning peak cortisol and alertness cycles.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500 shrink-0">+15% Efficiency</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
