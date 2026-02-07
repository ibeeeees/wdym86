# Merge to `main` Report (shaws_new_updates → main)

**Date**: 2026-02-07  
**Source branch**: `shaws_new_updates`  
**Target branch**: `main`  

## Summary (what’s going into `main`)

This branch adds/implements:
- **Stripe** (subscriptions + POS payments): backend services/routers + frontend Payment UI integration
- **TaxJar** sales tax integration (backend + POS usage)
- **Payroll** frontend connected to backend APIs (replaces demo-only flows)
- **POS check-first workflow + BOHPOS** (kitchen display) + navigation restrictions
- **Large documentation set**: audit reports, go-live guides, roadmap/completion reports, diffs, etc.

## Diff artifacts (generated in repo)

These files were generated to support review/merge:
- `DIFFSTAT_main_vs_shaws_new_updates.txt`: high-level diffstat
- `DIFF_FILES_main_vs_shaws_new_updates.txt`: changed file list
- `DIFF_main_vs_shaws_new_updates.patch`: full patch (main → branch)
- `COMMITS_main_to_shaws_new_updates.txt`: commits on branch not in main

## Issues we are having (and why the POS page “just loads”)

### 1) Backend not reachable (root cause of “infinite loading”)
**Symptom**
- Clicking **Dine In** transitions to the CheckList view but UI appears to “load forever”.

**Root cause**
- Backend was **crashing on startup** due to missing dependency:
  - `email-validator` required by Pydantic’s `EmailStr`

**Fix applied**
- Added `email-validator>=2.0.0` to `backend/requirements.txt`.

**How to validate**
- Backend should start cleanly and `/health` should return OK:
  - `http://localhost:8001/health`

### 2) Frontend API base URL / proxy mismatch
**Symptom**
- Frontend attempts calls that hang or fail due to CORS/incorrect port/base URL.

**Root cause**
- Frontend calls were using a direct backend URL (or env var) instead of the dev proxy consistently.

**Fix applied**
- Updated `frontend/src/services/api.ts` to prefer **same-origin** `/api` in dev:
  - `VITE_API_URL` if set, otherwise `'/api'` when `import.meta.env.DEV`.
- Vite proxy already routes `/api → http://localhost:8001` (`frontend/vite.config.ts`).

### 3) Missing request timeouts (UI looks “stuck” instead of showing errors)
**Symptom**
- When backend is down or slow, UI shows spinners with no clear failure.

**Fix applied**
- Added `frontend/src/services/http.ts` helper with:
  - **6s hard timeout**
  - fast error messages (e.g., “Backend request timed out. Is the backend running?”)
- Updated `frontend/src/services/checks.ts` and `frontend/src/services/bohpos.ts` to use it.

### 4) PaymentModal props mismatch (can trigger runtime errors)
**Symptom**
- Payment modal integration could break with incorrect prop names/types.

**Root cause**
- `PaymentModal` expects props: `order`, `onPaymentComplete`, optional `orderId`.
- POS code previously called it with other props.

**Fix applied**
- POS now adapts check totals into an `order` object and calls:
  - `onPaymentComplete(...)` properly
  - passes `orderId`

### 5) HMR Fast Refresh warning (dev-only annoyance)
**Symptom**
- Vite log: “Could not Fast Refresh (export is incompatible)”

**Root cause**
- `NavigationGuard.tsx` exports a default component plus named exports, which can confuse React Fast Refresh.

**Impact**
- Dev-only. It causes a full page reload during edits; it’s not a prod runtime issue.

## Current state / known limitations

- **Receipt display**: UI component exists; full receipt generation + retrieval wiring may still need follow-up endpoints if not already present.
- **POS “demo_restaurant” fallback**: Some flows rely on localStorage defaults; real auth/restaurant selection should be enforced for production.
- **Docs size**: Many large markdown files are included. This is good for documentation but increases repo size and PR review load.

## Merge readiness evaluation

### ✅ Good to merge (engineering perspective)
- Work is committed and diff artifacts are generated.
- Major backend modules are added cleanly (services + routers).
- Frontend now fails fast on backend issues (timeouts + health checks).

### ⚠️ Risks / things to verify right after merge
- Start backend locally and confirm:
  - `/health`, `/docs`, `/checks/*`, `/bohpos/*`, `/pos-payments/*`, `/tax/*`
- Start frontend and confirm:
  - POS loads, Dine In shows CheckList, can create check, open modal, add item, send to BOHPOS.
- Stripe env vars must be configured for any card-payment testing.

### Deployment recommendation
- Merge to `main`, deploy to **staging first**, run POS flow end-to-end.
- Only then deploy to production.

## Merge procedure (local)

From repo root:

```bash
git checkout main
git pull origin main
git merge --no-ff shaws_new_updates
git push origin main
```

If push fails due to credentials, run the merge steps locally and push from your authenticated environment.

