import { AIChatMessage, AICoachSettings } from '../types';

export const INITIAL_AI_SETTINGS: AICoachSettings = {
  defaultPersona: 'mentor',
  autoContextInjection: true,
  voiceReadoutEnabled: false,
  proactiveMorningBriefing: true,
  tradingSafeguardConfirmed: true,
};

export const INITIAL_AI_CHAT_HISTORY: AIChatMessage[] = [
  {
    id: 'msg-init-1',
    role: 'assistant',
    persona: 'mentor',
    content: `Greetings! I am your Life OS AI Operating Partner & Polymath Architect. 

I continuously monitor your task velocity, habit streaks, learning curricula, and trading telemetry to assist you with high-leverage execution.

How can I assist your objectives today?`,
    timestamp: new Date().toISOString(),
    suggestedActions: [
      {
        id: 'act-1',
        label: 'Run Daily Schedule Audit',
        actionType: 'adjust_schedule',
        payload: { action: 'audit_today' },
      },
      {
        id: 'act-2',
        label: 'Analyze Trading Psychology Leaks',
        actionType: 'add_trade_rule',
        payload: { action: 'audit_trading' },
      },
      {
        id: 'act-3',
        label: 'Generate Distributed Systems Study Plan',
        actionType: 'create_course',
        payload: { topic: 'Distributed Systems' },
      },
    ],
  },
];
