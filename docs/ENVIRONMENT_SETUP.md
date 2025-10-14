# Environment Setup & Secrets Management

**Last Updated:** 2025-10-13
**Epic:** Epic 7 - Jam Session Backend Infrastructure

---

## Overview

This document explains how to configure environment variables, manage secrets, and deploy the Centaurus Drum Machine with Supabase integration.

---

## Table of Contents

1. [Environment Files Structure](#environment-files-structure)
2. [Local Development Setup](#local-development-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Environment Files Structure

The project uses three environment files:

```
.env.development      # Development environment (gitignored)
.env.production       # Production environment (gitignored)
.env.example          # Template for other developers (committed to git)
```

### File Purposes

| File | Purpose | Committed to Git? |
|------|---------|------------------|
| `.env.example` | Template showing required variables | ✅ Yes |
| `.env.development` | Local development secrets | ❌ No (gitignored) |
| `.env.production` | Production secrets | ❌ No (gitignored) |

---

## Local Development Setup

### Step 1: Copy Template

```bash
# Copy the example file to create your development environment
cp .env.example .env.development
```

### Step 2: Get Supabase Credentials

**Option A: Use Existing Supabase Project**

If you have access to the project's Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `Centaurus Drum Machine`
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Option B: Create Your Own Supabase Project**

For independent development or testing:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name**: `Centaurus Dev` (or your preferred name)
   - **Database Password**: Generate a secure password
   - **Region**: Choose closest to your location
4. Wait for project creation (~2 minutes)
5. Run database migration (see [Database Setup](#database-setup))
6. Copy your project's URL and anon key

### Step 3: Configure `.env.development`

Edit `.env.development` with your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**Important Notes:**
- Use `VITE_` prefix for all environment variables (required by Vite)
- Never commit `.env.development` to git (it's in `.gitignore`)
- Keep your anon key secret (don't share publicly)

### Step 4: Verify Connection

Start the development server and test the connection:

```bash
npm run dev
```

Navigate to: `http://localhost:5173/supabase-test`

Expected output:
- ✅ **Environment Variables Loaded**: Shows URL and key (partially masked)
- ✅ **Supabase Connection**: Successfully connected to database

---

## Supabase Configuration

### Database Setup

The project requires a `sessions` table for jam session persistence. Create it using one of these methods:

#### Option 1: Using Supabase MCP (Recommended)

If you have Claude Code with Supabase MCP configured:

```bash
# Authenticate with Supabase
npx supabase login

# The migration will be applied automatically via MCP tools
# See Story 7.1 for detailed implementation
```

#### Option 2: Manual SQL (Dashboard)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Run this SQL:

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  state JSONB DEFAULT '{}'::jsonb
);

-- Add index for cleanup queries
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

#### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-id

# Create migration
npx supabase migration new create_sessions_table

# Edit the migration file and add the SQL above

# Apply migration
npx supabase db push
```

### Row Level Security (RLS)

**Note:** For MVP, RLS is disabled on the `sessions` table to allow anonymous access. Future versions will implement proper authentication and RLS policies.

To enable RLS later (Epic 7 Phase 2):

```sql
-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read/write sessions (for now)
CREATE POLICY "Allow all access to sessions"
ON sessions
FOR ALL
USING (true)
WITH CHECK (true);
```

---

## Vercel Deployment

### Prerequisites

- Vercel account connected to your GitHub repository
- Supabase project configured with production database

### Step 1: Prepare Production Environment

Create `.env.production` locally (for reference, not deployed):

```bash
# Production Supabase Configuration
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-production-key
```

### Step 2: Configure Vercel Environment Variables

**Via Vercel Dashboard:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Production, Preview, Development |

**Via Vercel CLI:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set environment variables
vercel env add VITE_SUPABASE_URL production
# Paste your production Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your production anon key when prompted
```

### Step 3: Deploy

**Via GitHub Integration (Recommended):**

Push to your main branch - Vercel will auto-deploy:

```bash
git push origin main
```

**Via Vercel CLI:**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Navigate to `/supabase-test`
3. Verify connection status shows success

---

## Security Best Practices

### ✅ Do's

- ✅ **Use `.env.example`** as a template for other developers
- ✅ **Rotate keys regularly** (every 90 days recommended)
- ✅ **Use different Supabase projects** for dev/staging/prod
- ✅ **Restrict Supabase API keys** via IP allowlisting (Supabase Pro)
- ✅ **Enable RLS** on all tables before production launch
- ✅ **Use Vercel environment scopes** (production vs preview)
- ✅ **Monitor usage** via Supabase dashboard

### ❌ Don'ts

- ❌ **Never commit** `.env.development` or `.env.production` to git
- ❌ **Never share** your anon key in public channels (Slack, Discord, etc.)
- ❌ **Never hardcode** secrets in source code
- ❌ **Never use production keys** in development
- ❌ **Never expose service role keys** (only use anon keys in frontend)
- ❌ **Never disable RLS** in production (only for MVP/testing)

### Environment Variable Naming

Follow Vite's naming convention:

```bash
# ✅ Correct - Exposed to client
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# ❌ Wrong - Not exposed to client
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

**Important:** Only variables prefixed with `VITE_` are exposed to the browser. This is intentional for frontend-safe variables like anon keys.

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Cause:** `.env.development` not created or variables not prefixed with `VITE_`

**Solution:**
1. Ensure `.env.development` exists in project root
2. Verify variables start with `VITE_` prefix
3. Restart dev server: `npm run dev`

### Issue: "Failed to connect to Supabase"

**Cause:** Invalid credentials or network issues

**Solution:**
1. Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)
2. Verify anon key is complete (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
3. Check Supabase project status in dashboard
4. Test connection at `/supabase-test` route

### Issue: "Table 'sessions' does not exist"

**Cause:** Database migration not applied

**Solution:**
1. Run database setup (see [Database Setup](#database-setup))
2. Verify table exists in Supabase Dashboard → **Table Editor**
3. Check migration applied in Supabase Dashboard → **Database** → **Migrations**

### Issue: "Environment variables not updating in Vercel"

**Cause:** Vercel caches build environment

**Solution:**
1. Update environment variables in Vercel dashboard
2. Trigger new deployment:
   ```bash
   vercel --prod --force
   ```
3. Clear Vercel cache if needed

### Issue: "Different values between dev and production"

**Cause:** Using same Supabase project for both environments

**Solution:**
1. Create separate Supabase projects:
   - `centaurus-dev` (development)
   - `centaurus-prod` (production)
2. Use different credentials in `.env.development` vs Vercel production variables
3. Apply migrations to both projects

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Story 7.1**: Supabase Project Setup (implementation details)
- **Epic 7**: Jam Session Backend Infrastructure (architecture overview)

---

## Quick Reference Card

```bash
# Local Development Setup
1. cp .env.example .env.development
2. Edit .env.development with your Supabase credentials
3. npm run dev
4. Visit http://localhost:5173/supabase-test

# Production Deployment (Vercel)
1. Add environment variables in Vercel dashboard
2. Push to main branch (auto-deploy)
3. Verify at https://your-domain.vercel.app/supabase-test

# Database Migration
Option 1: Supabase MCP (npx supabase login)
Option 2: Supabase Dashboard → SQL Editor → Run migration
Option 3: Supabase CLI (npx supabase db push)
```

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or review Story 7.1 for implementation details.
