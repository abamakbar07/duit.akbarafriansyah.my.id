# Personal Finance Tracker

A lightweight Next.js app deployed on Vercel to track daily transactions stored in Supabase.

## Features

- **Spending snapshot landing page:** At-a-glance KPIs, daily trend, and latest transactions sourced straight from Supabase.
- **Interactive dashboard (`/dashboard`):** Composable widgets with filters for date range, account, and category alongside daily and category visualizations.

## Prerequisites

Set the following environment variables for server-side features and the exporter:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep these values **server-only** (Vercel, GitHub Actions, or your shell session). They must never be exposed to the browser or committed to the repository.

## Development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

## Transaction Backups

### Run an export locally

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
pnpm export:transactions
```

This command compiles the TypeScript exporter, runs it, and writes both JSON and CSV files under `public/backups/<timestamp>.{json,csv}`. Files are ignored by Git but remain available locally for manual download.

### Scheduled exports

A GitHub Actions workflow (`.github/workflows/export.yml`) runs daily at 02:00 UTC. It executes the same script with repository secrets and uploads the generated `public/backups` directory as a run artifact. Download the latest artifact from the workflow run to retrieve off-site backups.

### Manual retrieval

1. Navigate to the **Actions** tab in GitHub.
2. Open the latest **Export transactions backup** run.
3. Download the `transactions-backup` artifact – it contains the JSON and CSV files produced on that run.

## Notes

- Backups rely on the Supabase service role key, which grants full access. Store it only in secure server-side environments (Vercel project settings or GitHub repository secrets).
- The exporter queries the `transactions` table ordered by `date` and `created_at` to produce deterministic outputs.
