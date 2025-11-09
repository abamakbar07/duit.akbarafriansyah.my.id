# AGENT.md — Personal Finance Tracker Context

## Project Summary
This app is a **simple personal finance tracker** built with **Next.js (Vercel)** and a lightweight database (**Supabase**).  
It is **for personal use only** — no authentication, no multi-user support, and no sensitive data beyond my own daily transactions.

The app records and summarizes daily financial data with focus on:
- **Speed:** lightweight insert and query endpoints.
- **Automation:** integration with external tools (Notion, Apple Shortcuts, Google Sheets, Make.com, etc.).
- **Reliability:** stable schema, daily JSON/CSV backups.
- **Simplicity:** minimal manual input, no login or account system.

## Agent Objectives
1. Analyze current progress of this project (codebase, structure, features).
2. Plan and propose next development steps — focusing on:
   - Code optimization and refactoring.
   - Extending automation capabilities (e.g., API hooks, cron exports).
   - Improving data visualization and summaries.
3. Maintain consistent architecture standards for Vercel deployment.
4. Avoid suggesting authentication, user management, or complex role systems.

## Technical Context
- **Frontend:** Next.js (App Router), React, Tailwind.
- **Backend:** Next.js API routes.
- **Database:** Supabase (PostgreSQL).
- **Data Model:** Single `transactions` table with columns  
  `(id, date, account, category, subcategory, note, amount, type, created_at)`.
- **Automation Layer:** Public API endpoints (`/api/add`, `/api/list`, `/api/summary`) for external integrations.
- **Storage:** Periodic CSV/JSON backup; no sensitive keys exposed on client side.
- **Hosting:** Vercel with optional GitHub Actions for scheduled exports.

## Development Principles
- No login, no JWT, no RLS.
- Keep endpoints public but server-only (safe keys in environment vars).
- Prefer simplicity and clarity over complexity.
- Optimize for automation and self-usage rather than user scalability.
