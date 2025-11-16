# Personal Finance Tracker

A single-user Next.js App Router project deployed on Vercel to record, summarize, and export Supabase transactions. The stack is optimized for automations (Shortcuts, Make.com, curl) and daily self-serve dashboards—no auth, no multi-tenancy.

## Overview
- **Landing snapshot (`/`)** – Server-rendered KPIs, a daily spend sparkline, automation quick links, and the latest 10 transactions pulled straight from Supabase.
- **Interactive dashboard (`/dashboard`)** – URL-driven filters for date range, account, and category with KPI cards, per-day + per-category charts, an optional budget status card, and a 20-row transaction table.
- **Public API routes** – `/api/add`, `/api/list`, `/api/summary`, and `/api/notify` power automations, Apple Shortcuts, and cron jobs.
- **Deterministic backups** – `pnpm export:transactions` plus a scheduled GitHub Actions workflow export JSON + CSV snapshots into `public/backups`.

The entire system still relies on a **single Supabase table named `transactions`** with the columns `id`, `date`, `account`, `category`, `subcategory`, `note`, `amount`, `type`, and `created_at`.

## Environment variables
Set these variables in Vercel, GitHub Actions, or your shell before running any server/API features:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUDGET_NOTIFY_WEBHOOK_URL` *(optional)* – POST target for `/api/notify` alerts.

Keep them server-side only—never expose them to the browser bundle or commit them to the repo.

## Development
Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Useful scripts:

```bash
pnpm lint                # Run ESLint
pnpm export:transactions # Compile + execute the TypeScript exporter
```

## API routes
| Route | Method | Description |
| --- | --- | --- |
| `/api/add` | `POST` | Inserts a transaction. Expects JSON with `date`, `amount`, `type` (`income` or `expense`), and optional `account`, `category`, `subcategory`, `note`. |
| `/api/list` | `GET` | Returns transactions ordered by date/created_at. Supports `startDate`, `endDate`, `account`, and `category` query params to mirror dashboard filters. |
| `/api/summary` | `GET` | Aggregates totals, per-day, and per-category series plus the current budget status (if configured). Accepts the same filter query params. |
| `/api/notify` | `GET` | Evaluates current budgets and optionally forwards overspend payloads to `BUDGET_NOTIFY_WEBHOOK_URL`. |

### Automation tips
- **curl ingestion** – `curl -X POST https://<host>/api/add -H 'Content-Type: application/json' -d '{"date":"2024-06-01","amount":-75000,"category":"Food","account":"Wallet","type":"expense"}'`
- **Apple Shortcuts** – Use a “Get Contents of URL” action targeting `/api/notify` to display overspend alerts inline on iOS/macOS.
- **Make.com / cron** – Poll `/api/summary` or `/api/notify` for headless monitoring. All routes respond with JSON.

## Budgets & alerts
Budgets are defined in [`lib/config.ts`](./lib/config.ts) via a typed `BudgetConfig`. Update the `categories` and `accounts` maps (IDR values by default) to enable:
- The **Budget status** card on `/dashboard`.
- `budgets` metadata returned by `/api/summary`.
- Overspend checks inside `/api/notify`.

Deleting all entries disables budget features without touching code.

## Backups
### Manual export
```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
pnpm export:transactions
```
Exports land in `public/backups/<timestamp>.json` and `.csv` (ignored by Git but available locally).

### Scheduled GitHub Action
`.github/workflows/export.yml` runs nightly at 02:00 UTC, executes the same script, and uploads `public/backups` as the `transactions-backup` artifact. Download the latest artifact from the workflow run when you need an off-site copy.

## Notes
- The Supabase service role key grants full access; store it securely.
- Charts and KPI cards rely entirely on data returned by `/api/summary`, so automation clients get the same numbers the UI displays.
- Dashboard filters are reflected in the URL, making saved views and shared links trivial.
