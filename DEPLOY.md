# Deployment Guide — Zorzer Stresser on Vercel

Complete step-by-step guide to push to GitHub and deploy on Vercel.

---

## 1. Prepare your Supabase project

Before deploying, make sure your Supabase project is set up:

1. Go to [supabase.com](https://supabase.com) → your project → **Settings → API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `VITE_SUPABASE_SERVICE_KEY` *(keep this secret)*
3. Run your SQL migrations from `scripts/` in the Supabase SQL editor (run them in order).

---

## 2. Push to GitHub

### First time

```bash
git init                          # if not already a git repo
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Subsequent pushes

```bash
git add .
git commit -m "your message"
git push
```

> **Never commit `.env`** — it's in `.gitignore`. Only `.env.example` gets committed.

---

## 3. Generate secrets

Run these in your terminal to generate strong random secrets:

```bash
openssl rand -hex 32   # use this for SESSION_SECRET
openssl rand -hex 16   # use this for CRON_SECRET
```

Keep these values — you'll paste them into Vercel in the next step.

---

## 4. Deploy on Vercel

### 4a. Import the repo

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Click **Import** next to your GitHub repo
3. Vercel auto-detects Vite — leave **Framework Preset** as `Vite`
4. Set **Root Directory** to `.` (the repo root)
5. Set **Build Command** to `npm run build`
6. Set **Output Directory** to `dist`

### 4b. Set environment variables

In the Vercel project settings, go to **Settings → Environment Variables** and add all of these:

| Name | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | your anon key | Production, Preview, Development |
| `VITE_SUPABASE_SERVICE_KEY` | your service role key | Production, Preview, Development |
| `SESSION_SECRET` | output of `openssl rand -hex 32` | Production, Preview, Development |
| `CRON_SECRET` | output of `openssl rand -hex 16` | Production, Preview, Development |

> ⚠️ `VITE_SUPABASE_SERVICE_KEY` is used **only** by `server.js` (the serverless function). It is never injected into the frontend bundle because the Vite build only inlines `VITE_` vars that are referenced in `src/`. `server.js` is not part of the Vite build.

### 4c. Configure the cron secret in vercel.json

Open `vercel.json` and replace `YOUR_CRON_SECRET` with the actual value you generated:

```json
"crons": [
  { "path": "/proxy/__cron?secret=PASTE_YOUR_CRON_SECRET_HERE", "schedule": "*/5 * * * *" }
]
```

Commit and push this change. The cron will call `/proxy/__cron` every 5 minutes to expire stale attack runs.

> **Note:** Vercel Cron requires a **Pro plan** for frequencies more than 2×/day. On the free Hobby plan, change the schedule to `"0 * * * *"` (once per hour) or just omit the crons block entirely — the Supabase `is_l4_busy` / `is_l7_busy` RPCs still work correctly; only the `status` column update is delayed.

### 4d. Deploy

Click **Deploy**. Vercel will:
1. Run `npm run build` → outputs the React SPA to `dist/`
2. Package `api/index.js` as a Node.js serverless function
3. Route `/proxy/*` requests to that function (via `vercel.json` rewrites)
4. Serve everything else from `dist/` as a static SPA

---

## 5. Update Supabase Auth settings

After your first deploy, Vercel gives you a production URL like `https://your-app.vercel.app`.

1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `https://your-app.vercel.app`
3. Add `https://your-app.vercel.app/**` to **Redirect URLs**

This is required for email confirmation and password reset links to work in production.

---

## 6. Verify the deployment

Open your Vercel URL and check:

- [ ] Login / Register works
- [ ] Dashboard loads and shows busy state
- [ ] Panel loads (try launching a run if nodes are configured)
- [ ] Admin page accessible with admin account
- [ ] `/proxy/launch-token` returns JSON (not HTML) — open DevTools → Network while on the Panel page

If `/proxy/*` returns an HTML 404, check:
- `vercel.json` is committed and in the repo root
- The `api/index.js` file exists and is committed
- Vercel re-deployed after the `vercel.json` was added

---

## 7. Continuous deployment

Every `git push` to `main` automatically triggers a new Vercel deployment. Preview deployments are created for pull requests.

---

## Troubleshooting

### "VITE_SUPABASE_SERVICE_KEY is not set" in function logs

The env var is missing on Vercel. Go to **Settings → Environment Variables**, add it, then **Redeploy**.

### Attacks run but status stays "running" forever

The cleanup cron isn't running. Either:
- Configure the cron in `vercel.json` (requires Pro plan for frequent runs)
- Or update your `is_l4_busy` / `is_l7_busy` Supabase RPC to time-check `started_at + duration` instead of purely checking `status = 'running'`

### "Invalid launch token" error on launch

The `SESSION_SECRET` on Vercel doesn't match the one used in development. Verify the env var is set correctly under **Settings → Environment Variables**.

### Password reset emails don't work

The Supabase **Site URL** or **Redirect URLs** aren't updated. See Step 5 above.
