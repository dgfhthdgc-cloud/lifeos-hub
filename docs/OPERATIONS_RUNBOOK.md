# LIFE OS — OPERATIONS & OBSERVABILITY RUNBOOK
**Document Version:** 1.0.0 (Phase 8 Production Release)  
**System Status:** GO FOR PRODUCTION (Validated across Phases 1–7)

---

## 1. System Overview & Architecture

LIFE OS is an intelligent, privacy-first personal operating system designed to integrate planning, habits, goals, learning, trading simulation, algorithmic automations, and AI coaching into a cohesive single-pane platform.

### Core Architectural Layers
- **Frontend Client:** React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Motion animations.
- **Backend API Gateway:** Express server binding on `0.0.0.0:3000` with strict rate limiting, correlation IDs, and security headers.
- **Durable Persistence Engine:** Multi-tenant `SqlDatabaseAdapter` with primary SQLite driver and optional PostgreSQL support.
- **Event Nervous System:** `DomainEventBus` implementing deterministic dispatching, cycle protection (`MAX_CHAIN_DEPTH = 3`), audit trails, and automatic side-effect triggers.
- **AI Strategic Gateway:** Gemini 2.5 Flash with fallback heuristics and telemetry tracking.

---

## 2. Health & Readiness Probes

The system provides three standard observability and liveness endpoints for container orchestrators (e.g. Cloud Run, Kubernetes):

| Endpoint | Method | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | No | Liveness probe: returns process uptime and status `ok`. |
| `/api/ready` | GET | No | Readiness probe: validates SQLite/PostgreSQL connection and readiness. |
| `/api/telemetry/metrics` | GET | Yes (`Bearer token`) | Deep telemetry: latency percentiles (p50/p95/p99), error rates, funnel stats. |

### Sample Readiness Check
```bash
curl -i http://localhost:3000/api/ready
# Expected response: HTTP 200 OK
# {"status":"ready","database":{"ready":true,"adapter":"sqlite","userCount":1},"uptime":120}
```

---

## 3. Production Telemetry & Metrics

### Key Performance Indicators (KPIs) & SLOs
- **API Availability SLO:** 99.9% uptime.
- **P95 Latency Target:** < 150ms for core domain operations (Tasks, Habits, Goals).
- **AI Gateway Timeout Target:** < 2500ms before fallback heuristic execution.
- **Database Write Latency Target:** < 25ms.

### Activation Funnel Metrics
The telemetry engine tracks user progression through the activation journey:
1. **Signup:** User account registered.
2. **Goal Created:** First strategic objective established.
3. **Tasks/Habits Created:** Tactical actions created to support goals.
4. **First Completion (Activated):** First task/habit execution completed.

### Retention Tracking Cohorts
- **D1 Retention:** Daily engagement within 24 hours of signup.
- **D3 Retention:** Habit cadence formation.
- **D7 Retention:** Weekly review and active workflow adoption.
- **D14 / D30 Retention:** Habitual Life OS reliance and long-term stickiness.

---

## 4. Disaster Recovery & Backup Procedures (RPO/RTO)

### Objectives
- **Recovery Point Objective (RPO):** < 1 hour.
- **Recovery Time Objective (RTO):** < 15 minutes.

### Creating a Point-in-Time Snapshot
Snapshots are created on disk under `.backups/` and verified with a SHA256 cryptographic hash.

**CLI / API Execution:**
```bash
curl -X POST http://localhost:3000/api/admin/backup/create \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Verifying Backup Integrity
The backup manager mounts the candidate snapshot into a sandboxed SQLite instance, executes `PRAGMA integrity_check`, validates the schema, and checks record counts.

```bash
curl -X POST http://localhost:3000/api/admin/backup/verify \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filepath":".backups/lifeos_backup_2026-08-19.sqlite"}'
```

### Restoring from Backup
Restoration creates an instantaneous safety copy (`.pre_restore_<timestamp>`) of the current database before atomically replacing the active database file.

```bash
curl -X POST http://localhost:3000/api/admin/backup/restore \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filepath":".backups/lifeos_backup_2026-08-19.sqlite"}'
```

---

## 5. Staged Deployment Protocol

```
+------------------+       +-------------------+       +--------------------+
|  Phase 8.1       |  -->  |  Phase 8.2        |  -->  |  Phase 8.3         |
|  Internal Canary |       |  Beta Cohort (5%) |       |  General (GA 100%) |
+------------------+       +-------------------+       +--------------------+
```

1. **Internal Canary (Phase 8.1):**
   - Deploy container image to staging environment.
   - Run automated acceptance and Phase 8 telemetry test suites.
   - Verify `/api/health` and `/api/ready`.
2. **Beta Cohort (Phase 8.2):**
   - Direct 5%–10% of traffic to new build.
   - Monitor error rate (< 0.1%) and p95 latency (< 150ms).
   - Verify CSAT / feedback submissions in `ObservabilityCard`.
3. **General Availability (Phase 8.3):**
   - Shift 100% of traffic to production container.
   - Enable automated hourly snapshot cron.

---

## 6. Incident Response & Troubleshooting Runbook

### Issue A: High API Error Rate (> 1%)
1. Inspect server logs via `logger.ts` outputs.
2. Query `/api/telemetry/metrics` to isolate the offending route.
3. If rate-limiting triggered (429), verify client retry backoff.

### Issue B: Gemini AI Latency Spikes or Quota Exhaustion
1. `generateAICoachResponse` automatically falls back to local strategic rules if Gemini API is unresponsive or missing `GEMINI_API_KEY`.
2. Verify API key in environment variables: `echo $GEMINI_API_KEY`.

### Issue C: State Conflict (409) During Multi-Device Sync
1. State conflict is designed behavior to prevent split-brain overwrites.
2. The client fetches the canonical server revision and merges differences.

---

## 7. Rollback Procedure

If fatal defects occur during deployment:
1. Re-route ingress proxy / container traffic to previous image tag.
2. If database schema was modified, restore previous snapshot via `backupManager.restoreFromBackup()`.
3. Verify restored system state with `/api/ready`.
