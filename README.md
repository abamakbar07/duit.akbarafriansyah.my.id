# Personal Finance Tracker

A lightweight Next.js app deployed on Vercel to track daily transactions stored in Supabase.

## Features

- **Spending snapshot landing page:** At-a-glance KPIs, daily trend, and latest transactions sourced straight from Supabase.
- **Interactive dashboard (`/dashboard`):** Composable widgets with filters for date range, account, and category alongside daily and category visualizations.
- **Budget monitoring:** Month-to-date category and account limits rendered on the dashboard with automation-friendly alerts.

## Prerequisites

Set the following environment variables for server-side features, alerts, and the exporter:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUDGET_NOTIFY_WEBHOOK_URL` *(optional)* – HTTP endpoint that receives JSON payloads when an overspend is detected.

Keep these values **server-only** (Vercel, GitHub Actions, or your shell session). They must never be exposed to the browser or committed to the repository.

## Development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

## Budgets & Alerts

### Configure monthly limits

Monthly budgets live in [`lib/config.ts`](./lib/config.ts) as a plain JSON object so they can be tracked in Git, synced via `git pull`, or edited by automations. Update the `categories` and `accounts` maps with IDR values to match your envelopes:

```ts
export const budgetConfig = {
  currency: 'IDR',
  categories: {
    Groceries: 3_000_000,
    Dining: 1_500_000,
    // ...
  },
  accounts: {
    'BCA Debit': 5_000_000,
  },
};
```

Save and redeploy to update the dashboard and alert endpoints instantly. Removing all entries disables budget calculations.

### Dashboard overview

The `/dashboard` page now includes a **Budget status** card. It calculates month-to-date expenses per configured category/account, displays remaining rupiah, and highlights overspend in red for quick triage.

### API integrations

- `GET /api/summary` returns a `budgets` object alongside the existing totals so Shortcuts, Make.com, or scripts can reuse the same data source as the UI.
- `GET /api/notify` triggers an on-demand evaluation. The response includes overspent categories/accounts and logs to the server console. When `BUDGET_NOTIFY_WEBHOOK_URL` is set, the route forwards the payload to that webhook.

Example Shortcut/Make.com webhook step:

```bash
curl https://duit.akbarafriansyah.my.id/api/notify \
  | jq '.overspentCategories, .overspentAccounts'
```

- **Make.com:** Create an HTTP module that polls `/api/notify`. Use a filter where `status == "alert"` to branch into notifications (Telegram, email, etc.).
- **Apple Shortcuts:** Add a “Get Contents of URL” action pointing to `/api/notify`, parse the JSON, and conditionally display an alert or push a reminder.

Both endpoints are stateless and safe to call from cron jobs or automations.

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
