# LIFE OS — Modernization & Production Roadmap

This document outlines the systematic engineering execution roadmap to upgrade LifeOS from a prototype into a secure, scalable, multi-user production operating system.

---

## Phase Summary & Progress Tracking

| Step | Focus Area | Status | Key Deliverables |
|:---|:---|:---|:---|
| **Step 1** | **Codebase Audit** | ✅ Complete | Mapped frontend/backend, storage, auth, AI, trading safety, and integration boundaries. |
| **Step 2** | **Architecture & Roadmap Specs** | ✅ Complete | Authored `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`. |
| **Step 3** | **Security Hardening & Label Integrity** | 🟡 In Progress | Fix misleading "LIVE" trading claims, remove dummy live broker routes, enforce `PAPER/SIMULATED` labeling. |
| **Step 4** | **Backend Database & Storage Layer** | ⚪ Scheduled | Multi-user backend persistence schema for tasks, habits, goals, XP ledger, and trading. |
| **Step 5** | **Real Authentication & User Scoping** | ⚪ Scheduled | JWT session tokens, password hashing, user-isolated data, protected endpoints. |
| **Step 6** | **AI Gateway & Context Engine** | ⚪ Scheduled | Server-side Gemini AI gateway synthesizing cross-domain telemetry into structured coaching. |
| **Step 7** | **Event-Driven Automation Engine** | ⚪ Scheduled | Real reactive event bus with triggers, conditions, and execution audit logging. |
| **Step 8** | **Gamification & XP Ledger** | ⚪ Scheduled | Server-authoritative XP transactions, quest validation, and boss raid mechanics. |
| **Step 9** | **Testing & Reliability Suite** | ⚪ Scheduled | Unit and integration test suites for auth, trading risk engine, XP calculations, and automations. |
| **Step 10** | **UI/UX & PWA Refinement** | ⚪ Scheduled | Navigation hierarchy (Today, Plan, Grow, Perform, System), offline cache sync, responsive polish. |

---

## Detailed Step Milestones

### Step 3: Security Hardening & Label Integrity
- [x] Identify misleading claims in trading, biometrics, and integrations.
- [ ] Update `src/lib/broker/BrokerManager.ts` to disable live money execution and enforce `PaperBroker` / `SIMULATED` status.
- [ ] Update `src/components/trading/TradingHeader.tsx` to clearly present `PAPER TRADING (ACTIVE)` and `LIVE (UNAVAILABLE)`.
- [ ] Remove mock live order submission proxy in `server.ts` that fabricated DMA execution.
- [ ] Add explicit `DEMO / SIMULATED` indicators to Biometric and External Connector views.

### Step 4 & 5: Backend Database & Real Authentication
- [ ] Implement backend user store with cryptographic password hashing (Scrypt/PBKDF2/Argon2).
- [ ] Create token issuance (`/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout`).
- [ ] Implement auth middleware for Express server.
- [ ] Build backend repository service for user-isolated data storage (tasks, habits, goals, journal, XP, settings).
- [ ] Connect client `AuthContext` to backend session endpoints.

### Step 6: Server-Side AI Coach Gateway
- [ ] Build `/api/ai/coach/chat` route accepting user query + session token.
- [ ] Implement server-side context gatherer (aggregates today's tasks, streak counts, overdue items, risk metrics).
- [ ] Use `@google/genai` with `gemini-2.5-flash` model and rich system prompt.
- [ ] Connect `AICoachMainView.tsx` to the live backend AI gateway.

### Step 7: Event Automation Engine
- [ ] Implement server-side event dispatcher and rule evaluator.
- [ ] Support triggers: task completion, habit streak increments, trade logged, level up.
- [ ] Execute actions with transaction logs: deal boss damage, grant XP, award streak shields.

### Step 8: Gamification XP Audit Ledger
- [ ] Create immutable XP ledger backend store.
- [ ] Validate XP awards against defined action reward tables.
- [ ] Expose XP transaction stream API.

### Step 9: Testing & Quality Assurance
- [ ] Write unit tests for risk engine calculations (position sizing, stop loss, margin).
- [ ] Write tests for XP calculation and level progression formulas.
- [ ] Write integration tests for auth token generation and protected routes.
- [ ] Run full typecheck and build validation.

---

## Two-Developer / Multi-Agent Branch Guidelines
- **Main Branch**: Always production-runnable and fully compilable (`npm run build`).
- **Feature Branches**:
  - `feature/security-and-labels`
  - `feature/auth-and-database`
  - `feature/ai-coach-gateway`
  - `feature/automation-engine`
  - `feature/ui-pwa-polish`
