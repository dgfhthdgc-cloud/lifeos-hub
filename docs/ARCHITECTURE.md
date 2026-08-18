# LIFE OS — System Architecture & Technical Specification

## 1. Executive Overview

**LIFE OS** is an intelligent personal operating system combining productivity, planning, goal hierarchy, habit discipline, accelerated learning, gamification, quantitative paper trading simulation, event-driven automation, multi-domain analytics, and AI coaching.

---

## 2. Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (React 19 + Vite)                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    TODAY     │  │     PLAN     │  │     GROW     │  │   PERFORM    │ │
│  │  Dashboard   │  │  Planner     │  │  Learn/Lang  │  │  Trading     │ │
│  │  Habits/Tasks│  │  Goals/Road  │  │  Perks/Vault │  │  Swarm/Sim   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                         │
│  Context Layer: AuthContext, ThemeContext, NotificationContext, PWA     │
│  Service/Adapter Layer: API Gateway, BrokerManager, AutomationEngine    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON API (Bearer JWT)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    BACKEND TIER (Node.js / Express / TypeScript)        │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Middleware: Helmet Security Headers, CORS, RateLimiter, AuthGuard │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │                                   │
│  ┌─────────────────┬────────────────┴────────────────┬────────────────┐ │
│  │  Auth & Users   │   Core Domain Service Engine    │  AI Context    │ │
│  │  - Signup/Login │   - Tasks, Habits, Goals        │  Gateway       │ │
│  │  - JWT Sessions │   - Gamification & XP Ledger    │  - Aggregator  │ │
│  │  - Argon2/Scrypt│   - Event Automation Bus        │  - Gemini 2.5  │ │
│  └─────────────────┴────────────────┬────────────────┴────────────────┘ │
│                                     │                                   │
│  ┌──────────────────────────────────┴────────────────────────────────┐  │
│  │ Safe Trading Simulation Engine (Paper Broker / RiskEngine)        │  │
│  │ Explicit SIMULATED/PAPER mode only • Real-money execution disabled│  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │                                   │
│  ┌──────────────────────────────────┴────────────────────────────────┐  │
│  │ Database & Storage Abstraction (User-Scoped Relational/Document)  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Breakdown

### 3.1 Authentication & Security Architecture
- **Identity Model**: Each user record contains `id`, `email`, `passwordHash` (hashed with salt), `name`, `role`, `createdAt`, `updatedAt`.
- **Session Handling**: Bearer JWT tokens signed server-side with secret and expiry.
- **Authorization**: Every database query is scoped strictly by `userId` extracted from validated JWT tokens.
- **Security Headers**: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security.
- **Audit Logging**: Sensitive actions (auth attempts, XP grants, data exports) logged with timestamps and user IDs.

### 3.2 Database & Data Persistence
- **Domain Entities**:
  - `users`, `profiles`, `user_preferences`
  - `tasks` (CRUD, status, priority, recurrence, XP)
  - `habits`, `habit_history`, `streak_shields`
  - `goals`, `goal_milestones`
  - `courses`, `course_lessons`, `course_progress`
  - `languages`, `language_decks`, `srs_cards`, `language_progress`
  - `xp_transactions` (immutable audit ledger)
  - `badges`, `quests`, `skill_perks`
  - `boss_raids`, `boss_damage_logs`
  - `paper_accounts`, `paper_orders`, `paper_positions`, `trade_journal`
  - `automation_rules`, `automation_execution_logs`
  - `ai_conversations`, `ai_messages`
  - `integration_connectors`, `integration_events`
- **Storage Strategy**: Backend database with JSON/relational persistence and transactional consistency. Client uses localStorage strictly for offline cache and UI theme preferences.

### 3.3 AI Strategy & Execution Engine (Server-Side)
- **Engine**: Google Gemini via `@google/genai` on Node.js backend.
- **Context Builder**:
  1. Gathers active user telemetry: today's tasks, overdue items, habit streaks, goals at risk, learning progress, recent trades, and journal entries.
  2. Constructs structured system prompt with safety boundaries.
  3. Returns actionable guidance, structured schedule optimizations, and strategic suggestions.
- **Zero Client Key Exposure**: `GEMINI_API_KEY` is exclusively evaluated server-side.

### 3.4 Trading Simulation & Safety Architecture
- **Strict Simulation Boundary**: Live real-money trading is disabled. All order routing defaults to `PaperBroker` with realistic slippage, spread, commission modeling, and stop-loss/take-profit triggers.
- **BrokerAdapter Interface**:
  ```typescript
  export interface IBrokerAdapter {
    getAccount(): Promise<BrokerAccount>;
    getPositions(): Promise<BrokerPosition[]>;
    getOrders(): Promise<BrokerOrder[]>;
    submitOrder(order: NewBrokerOrder, currentPrice: number): Promise<OrderResult>;
    cancelOrder(orderId: string): Promise<boolean>;
    closePosition(positionId: string, currentPrice: number): Promise<CloseResult>;
  }
  ```
- **Transparent Labelling**: UI explicitly states `PAPER TRADING` / `SIMULATION`. Live DMA buttons marked as `UNAVAILABLE` until institutional KYC broker integrations are established.

### 3.5 Event-Driven Automation Engine
- **Lifecycle**: `Event Trigger` -> `Condition Evaluator` -> `Action Dispatcher` -> `Execution Log`.
- **Triggers**: Task completed, habit streak broken/milestone, goal progress update, level up, trade logged, boss damaged.
- **Actions**: Grant XP, replenish streak shield, deal boss damage, create schedule reminder, dispatch AI reflection.

### 3.6 Gamification Engine
- **Server-Authoritative XP Ledger**: Every XP grant creates an immutable transaction record (`amount`, `category`, `sourceId`, `timestamp`).
- **Level Curve Formula**: Dynamic exponential XP threshold computation (`getXpRequiredForLevel(level)`).
- **Streak Shield Mechanics**: Protects habit streaks when unforeseen disruptions occur.

---

## 4. Environment & Deployment Specs
- **Dev Port**: 3000 (0.0.0.0 host binding)
- **Node.js**: v20+ / ES2022
- **Build Output**: `dist/` (static SPA) + `server.ts`
