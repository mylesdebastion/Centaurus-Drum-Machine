# Supabase Keep-Alive Setup Guide

## Problem
Supabase free tier pauses projects after 7 days of inactivity. This breaks jam sessions and user experience.

## Solution
Daily Vercel cron job that reads + writes to Supabase, keeping the project active.

---

## Setup Steps

### 1. Restore Supabase Project (If Paused)

1. Go to https://supabase.com/dashboard
2. Find your Centaurus project
3. Click **"Restore project"** or **"Unpause"**
4. Wait ~2 minutes for project to become active

---

### 2. Create Keep-Alive Table

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the SQL from `supabase-keep-alive-setup.sql`:

```sql
CREATE TABLE IF NOT EXISTS _keep_alive (
  id INTEGER PRIMARY KEY,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _keep_alive (id, last_ping, created_at) 
VALUES (1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON _keep_alive TO service_role;
GRANT SELECT ON _keep_alive TO anon;
```

3. Verify table created: Go to **Table Editor** → `_keep_alive`

---

### 3. Add Environment Variables to Vercel

1. Go to Vercel Dashboard → **Centaurus project** → **Settings** → **Environment Variables**

2. Add these variables (if not already present):

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (long key) | Supabase Dashboard → Settings → API → **service_role** key |
| `CRON_SECRET` | Generate random string | Use: `openssl rand -base64 32` |

**Important:**
- `NEXT_PUBLIC_SUPABASE_URL` should already exist (used by app)
- `SUPABASE_SERVICE_ROLE_KEY` is **SECRET** - only add to Vercel (never commit)
- `CRON_SECRET` is for security (prevents unauthorized cron calls)

3. After adding variables, redeploy: **Deployments** → Latest deployment → **Redeploy**

---

### 4. Deploy Cron Job

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/keep-supabase-alive",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** `0 2 * * *` = Every day at 2:00 AM UTC (6:00 PM PST)

**To deploy:**
1. Commit changes:
   ```bash
   git add pages/api/cron/keep-supabase-alive.ts vercel.json
   git commit -m "Add Supabase keep-alive cron job"
   git push
   ```

2. Vercel will auto-deploy (if GitHub integration enabled)

3. Verify deployment: **Vercel Dashboard** → **Deployments** → Check latest is ✅

---

### 5. Test Cron Job Manually

**Option A: Test via Vercel Dashboard**
1. Go to **Vercel Dashboard** → **Cron** tab
2. Find `/api/cron/keep-supabase-alive`
3. Click **"Run now"** button
4. Check logs for success

**Option B: Test via curl**
```bash
# Get CRON_SECRET from Vercel env vars
CRON_SECRET="your-secret-here"

# Call the endpoint
curl -X POST https://jam.audiolux.app/api/cron/keep-supabase-alive \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected response:
{
  "ok": true,
  "project": "centaurus",
  "timestamp": "2026-02-04T18:00:00.000Z",
  "previous_ping": "first run"
}
```

**Option C: Check Supabase Table**
1. Go to Supabase Dashboard → **Table Editor** → `_keep_alive`
2. Check `last_ping` column is updated to current time

---

### 6. Verify Cron is Running

**After 24 hours:**
1. Check Vercel Dashboard → **Cron** → **Logs**
2. Should see daily executions at 2:00 AM UTC
3. All should show ✅ success

**Check Supabase:**
1. Table Editor → `_keep_alive`
2. `last_ping` should update daily
3. If `last_ping` is stale (>24 hours old), cron isn't working

---

## Troubleshooting

### Cron Returns 401 Unauthorized

**Problem:** `CRON_SECRET` mismatch

**Fix:**
1. Verify `CRON_SECRET` in Vercel env vars
2. Redeploy after adding env var
3. Test again with correct secret

---

### Cron Returns 500 Error

**Problem:** Supabase connection failed

**Check:**
1. `NEXT_PUBLIC_SUPABASE_URL` correct?
2. `SUPABASE_SERVICE_ROLE_KEY` correct? (not anon key)
3. Supabase project is active (not paused)?
4. Table `_keep_alive` exists?

**Verify connection:**
```bash
# Test Supabase connection manually
curl https://your-project.supabase.co/rest/v1/_keep_alive \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

### Table Does Not Exist

**Problem:** SQL not run in Supabase

**Fix:**
1. Go to Supabase SQL Editor
2. Run `supabase-keep-alive-setup.sql`
3. Verify in Table Editor

---

### Cron Not Showing in Vercel Dashboard

**Problem:** Vercel crons require **Hobby** plan or higher (free plan doesn't support crons)

**Fix:**
1. Upgrade to Hobby plan ($20/month)
2. Or use GitHub Actions instead (free):

```yaml
# .github/workflows/keep-supabase-alive.yml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://jam.audiolux.app/api/cron/keep-supabase-alive \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Testing Jam Sessions

After setup, test that jam sessions work:

### 1. Create Jam Session

1. Go to https://jam.audiolux.app
2. Click **"Start Jam Session"** (or equivalent)
3. Enter your name
4. Room code should be generated (e.g., "ABC123")

### 2. Join from Another Device

1. On second device, go to https://jam.audiolux.app
2. Click **"Join Jam Session"**
3. Enter room code "ABC123"
4. Enter your name
5. Should see first participant in list

### 3. Test State Sync

1. On device 1 (host):
   - Change tempo
   - Change key/scale
   - Place drum step
2. On device 2 (follower):
   - Verify tempo updates
   - Verify key/scale updates
   - Verify drum step appears

**If sync works:** ✅ Supabase is active and cron is working!

---

## Monitoring

### Check Cron Health

**Weekly:** Check Vercel Dashboard → Cron → Logs
- All executions should be ✅ green
- If any ❌ red, investigate error

**Monthly:** Check Supabase Dashboard → Database
- Go to Table Editor → `_keep_alive`
- `last_ping` should be within last 24 hours
- If stale, cron stopped working

### Set Up Alerts (Optional)

**Vercel Webhook:**
1. Go to Vercel → Settings → Webhooks
2. Add webhook for "Cron Failed"
3. Send to Slack/Discord/Email

**Example Slack webhook:**
```json
{
  "event": "cron.failed",
  "payload": {
    "cronId": "cron_...",
    "path": "/api/cron/keep-supabase-alive"
  }
}
```

---

## Cost

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free Tier | $0/month |
| Vercel | Hobby | $20/month* |

*Vercel Hobby plan required for cron jobs. If already on Hobby for other features, no additional cost.

---

## FAQ

**Q: How often does the cron run?**
A: Daily at 2:00 AM UTC (6:00 PM PST).

**Q: What if cron misses a day?**
A: Supabase pauses after 7 days, so 1 missed day is fine. 7+ missed days = pause.

**Q: Can I change the schedule?**
A: Yes, edit `schedule` in `vercel.json`. Use cron syntax: https://crontab.guru

**Q: Does this prevent all pausing?**
A: Yes, as long as cron runs at least once every 7 days, project stays active.

**Q: What if I exceed free tier limits?**
A: Supabase will show warnings. Upgrade to Pro ($25/month) if needed.

**Q: Can I use this for other Supabase projects?**
A: Yes! Adapt the cron to ping multiple projects (see PixelBoop plan for example).

---

## Next Steps

After Centaurus is working:
1. ✅ Verify jam sessions work
2. ✅ Monitor cron for 1 week
3. 🚀 Apply same pattern to PixelBoop (create separate Supabase project)
4. 🚀 Add PixelBoop to same cron (ping both projects daily)

---

**Questions?** Check Vercel cron docs: https://vercel.com/docs/cron-jobs
