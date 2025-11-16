# AGENT.md — Personal Finance Tracker Context

## Project Summary
This repository hosts a **personal-only finance tracker** deployed on **Vercel** and backed by **Supabase**. It exposes:
- A landing snapshot (`/`) with KPIs, a daily spend chart, automation shortcuts, and the latest Supabase transactions.
- A `/dashboard` view with URL-driven filters, per-day + per-category charts, an optional budget status card, and a paginated transaction feed.
- Lightweight API routes (`/api/add`, `/api/list`, `/api/summary`, `/api/notify`) for automations, Apple Shortcuts, and cron jobs.
- A TypeScript exporter plus a scheduled GitHub Actions workflow for JSON/CSV backups under `public/backups`.

## Data Model & Hosting
- **Database:** Supabase (PostgreSQL) with a single `transactions` table containing `(id, date, account, category, subcategory, note, amount, type, created_at)`.
- **Automation:** All API routes are public server handlers; keep Supabase service keys server-side.
- **Hosting:** Next.js App Router deployed on Vercel. No auth, no multi-tenancy.

## Agent Objectives
1. Keep documentation and code aligned with the current landing page, dashboard, automation endpoints, and exporter.
2. Prioritize performance, clarity, and ease-of-automation (filterable APIs, copy-friendly commands, deterministic exports).
3. Suggest improvements within the single-user scope—no auth systems or multi-user flows.
4. Preserve compatibility with Vercel + Supabase deployments (edge-friendly, env-driven config).

## Development Principles
- No login, JWT, or RLS layers; endpoints stay public but server-side.
- Keep environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `BUDGET_NOTIFY_WEBHOOK_URL`) off the client bundle.
- Prefer explicit TypeScript types and descriptive UI copy.
- Budget config lives in `lib/config.ts` and drives both UI cards and `/api/summary` responses.
