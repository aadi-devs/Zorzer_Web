# Zorzer Stresser — Project Overview

A full-stack Layer 4 / Layer 7 stress-testing dashboard built with React (Vite) + Express + Supabase.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend proxy | Express (Node.js, ES modules) |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel (frontend static + Express serverless) |

### How it works

- The **frontend** is a React SPA served as static files.
- The **proxy server** (`server.js`) sits between the browser and the attack nodes. It verifies JWTs, enforces plan policies, and forwards requests to registered L4/L7 API nodes — so node URLs and payloads are never exposed to the browser.
- **Supabase** handles user auth, plan assignments, run history, busy state (via RPC), and news/feedback.

## Running locally (Replit)

```bash
npm install
npm run dev        # starts Express on :3001 + Vite on :5000 concurrently
```

## Required environment variables

See `.env.example` for all variables and descriptions.

| Variable | Where used |
|---|---|
| `VITE_SUPABASE_URL` | Frontend + server |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client |
| `VITE_SUPABASE_SERVICE_KEY` | Server only (never in frontend) |
| `SESSION_SECRET` | Server — signs HMAC launch tokens |
| `CRON_SECRET` | Server — protects cleanup cron endpoint |

## Project structure

```
├── api/
│   └── index.js          # Vercel serverless entry (imports server.js)
├── src/
│   ├── components/       # Shared UI components + AppShell
│   ├── lib/              # AuthContext, Supabase client, query client
│   └── pages/            # Dashboard, Panel, Admin, Activity, etc.
├── scripts/              # SQL migrations
├── server.js             # Express proxy server
├── vercel.json           # Vercel routing + cron config
└── vite.config.js        # Vite + dev proxy config
```

## User preferences

- Keep ES module syntax throughout (`import/export`, not `require`)
- All API calls go through `/proxy/*` — never expose node URLs or service key to the browser
- Supabase service key lives in `server.js` only
