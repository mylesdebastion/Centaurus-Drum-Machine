# Vercel Deployment Configuration for Vite + React

## Project Configuration

This project is configured for automatic deployments to Vercel with the following setup:

### Build Settings (already configured in `vercel.json`)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: Will use 18.x or latest LTS by default

### Branch Deployments
- **Production Branch**: `main` → your-project.vercel.app
- **Preview Branch**: `dev` → your-project-git-dev.vercel.app

## Setup Instructions

### 1. Initial Vercel Setup (One-time)

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import `Centaurus-Drum-Machine` repository
4. Vercel will auto-detect Vite framework
5. Review settings (should match our `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link project (from project root)
vercel link

# Deploy to preview
vercel

# Deploy to production (from main branch)
vercel --prod
```

### 2. Configure Environment (if needed)

For environment-specific variables:

```bash
# Set environment variables for preview (dev branch)
vercel env add VITE_API_URL preview
# Enter: https://preview-api.example.com

# Set environment variables for production (main branch)
vercel env add VITE_API_URL production
# Enter: https://api.example.com
```

### 3. GitHub Integration Features

Once connected, Vercel provides:
- **Automatic Deployments**: Every push triggers a deployment
- **Preview URLs**: Every PR gets a unique preview URL
- **Deployment Comments**: Bot comments on PRs with preview links
- **Checks Integration**: Deployment status in GitHub checks

## Deployment URLs

After setup, your deployments will be available at:

### Production (from `main` branch)
- `https://centaurus-drum-machine.vercel.app` (or your custom domain)

### Preview (from `dev` branch)
- Latest: `https://centaurus-drum-machine-git-dev-[username].vercel.app`
- Specific commit: `https://centaurus-drum-machine-[commit-hash]-[username].vercel.app`

### Feature Branch Previews
- Pattern: `https://centaurus-drum-machine-git-[branch-name]-[username].vercel.app`

## File Structure

```
├── vercel.json          # Vercel configuration (✅ created)
├── package.json         # Build scripts (✅ configured)
├── vite.config.ts       # Vite configuration (✅ exists)
├── dist/                # Build output (git-ignored)
└── public/              # Static assets (including apc40-demo.html)
```

## Important Notes

### Static Assets
- Files in `public/` are served at the root path
- `public/apc40-demo.html` → `/apc40-demo.html`

### Build Output
- Vite builds to `dist/` directory
- TypeScript compilation happens during build
- All assets are optimized and hashed

### Preview Deployments
- Every push to `dev` creates a new preview
- Preview deployments have production-like environment
- Great for testing before merging to `main`

## Troubleshooting

### Build Failures
1. Check build logs in Vercel dashboard
2. Common issues:
   - TypeScript errors: Fix with `npm run build` locally
   - Missing dependencies: Ensure all deps are in `package.json`
   - Node version: Vercel uses Node 18.x by default

### 404 on Routes
For single-page apps with client-side routing, add to `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Environment Variables
- Prefix with `VITE_` for client-side access
- Set in Vercel Dashboard → Settings → Environment Variables
- Pull locally: `vercel env pull .env.local`

## Current Status

✅ `vercel.json` configured for Vite framework
✅ Build command points to `npm run build`
✅ Output directory set to `dist`
✅ Both `main` and `dev` branches enabled for deployment
✅ GitHub integration enabled for automatic deployments
✅ APC40 demo accessible at `/apc40-demo.html`

## Next Steps

1. Import project in Vercel Dashboard
2. Verify automatic deployment triggers
3. Test preview URL from `dev` branch
4. Share preview URL for APC40 testing