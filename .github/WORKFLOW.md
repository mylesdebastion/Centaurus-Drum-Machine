# Development Workflow & Deployment Guide

## 🎯 Philosophy: Let Vercel Build, Not Git

**Key Principle:** Only commit **source code**, never build artifacts.

- ✅ Commit: `index.html`, `src/`, `package.json`, etc.
- ❌ Don't Commit: `.vercel/output/`, `dist/`, build artifacts
- 🤖 Vercel automatically builds on every push

---

## 🌳 Branch Strategy

```
main (production)
  ↑
  PR (after testing)
  ↑
dev (staging/preview)
  ↑
  PR (for review)
  ↑
feature/* (new features)
```

### Branch Purposes:

| Branch | Purpose | Vercel Deployment | Protected |
|--------|---------|-------------------|-----------|
| `main` | Production-ready code | 🟢 Production URL | ✅ Yes (require PR) |
| `dev` | Integration & testing | 🟡 Preview URL | ⚠️ Optional |
| `feature/*` | Active development | 🔵 Feature preview | ❌ No |

---

## 🚀 Standard Workflow (Feature Development)

### Step 1: Create Feature Branch

```bash
# Start from latest dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/crisp-chat-widget

# Work on your feature...
# (Make commits as you go)
```

### Step 2: Push & Create PR to Dev

```bash
# Push feature branch
git push origin feature/crisp-chat-widget

# Create PR: feature/crisp-chat-widget → dev
# GitHub UI: "Compare & pull request"
# Title: "feat(feedback): add Crisp chat widget"
# Review changes, merge PR
```

**What Happens:**
- ✅ Vercel builds dev branch automatically
- ✅ Preview deployment at `yourapp-git-dev.vercel.app`
- ✅ Test feature on dev preview URL

### Step 3: Test on Dev Environment

```bash
# Visit dev preview URL
# Test the feature thoroughly
# If bugs found: push more commits to feature branch (auto-updates PR)
```

### Step 4: Promote Dev to Production

```bash
# Create PR: dev → main
# GitHub UI: New pull request
# Base: main, Compare: dev
# Title: "release: deploy Crisp chat widget to production"
# Review changes, merge PR
```

**What Happens:**
- ✅ Vercel builds main branch automatically
- ✅ Production deployment at `yourapp.vercel.app`
- ✅ Feature live on production

---

## 🔥 Hotfix Workflow (Emergency Production Fix)

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix the bug, commit
git add .
git commit -m "fix: resolve critical chat widget bug"

# Push and create PR directly to main
git push origin hotfix/critical-bug-fix

# Create PR: hotfix/critical-bug-fix → main
# Merge immediately after review

# Backport to dev
git checkout dev
git merge main
git push origin dev
```

---

## ⚠️ What NOT to Do

### ❌ Don't Cherry-Pick Between Branches

**Bad:**
```bash
git checkout main
git cherry-pick abc123  # ❌ Causes build artifact conflicts
```

**Good:**
```bash
# Use PR merges instead (Vercel rebuilds automatically)
```

### ❌ Don't Commit Build Artifacts

**Bad:**
```bash
npm run build
git add dist/ .vercel/  # ❌ Never do this
git commit -m "add build artifacts"
```

**Good:**
```bash
# Just commit source code, let Vercel build
git add src/ index.html
git commit -m "feat: add new feature"
```

### ❌ Don't Push Directly to Main

**Bad:**
```bash
git checkout main
git commit -m "quick fix"
git push origin main  # ❌ Bypasses review & testing
```

**Good:**
```bash
# Always use PRs for main
# Forces code review + CI checks
```

---

## 🛠️ Vercel Build Configuration

Vercel automatically detects and builds your project:

**Build Command:** `npm run build` (from `package.json`)
**Output Directory:** `dist/` (auto-detected by Vite)
**Install Command:** `npm install` (auto-detected)

No manual builds needed! Vercel handles everything on push.

---

## 📊 Deployment Checklist

Before merging to `main`:

- [ ] Feature branch merged to `dev`
- [ ] Tested on dev preview URL
- [ ] No console errors in browser DevTools
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Hardware integrations tested (if applicable)
- [ ] PR created: `dev` → `main`
- [ ] PR approved by team member (if working with team)
- [ ] Merge PR to `main`
- [ ] Verify production deployment success
- [ ] Test feature on production URL

---

## 🔧 Troubleshooting

### "Build artifacts out of sync"

**Cause:** You committed `.vercel/` or `dist/` to git
**Fix:**
```bash
# Remove from git, keep local
git rm -r --cached .vercel/ dist/
echo ".vercel/" >> .gitignore
echo "dist/" >> .gitignore
git commit -m "chore: stop tracking build artifacts"
```

### "Production doesn't have my feature"

**Cause:** Feature only merged to `dev`, not `main`
**Fix:**
```bash
# Create PR: dev → main
# Merge to deploy to production
```

### "Preview deployment failed"

**Cause:** TypeScript errors or build failure
**Fix:**
```bash
# Check Vercel deployment logs
# Fix errors locally, push again
npm run build  # Test build locally first
```

---

## 🎓 Quick Reference

| Task | Command |
|------|---------|
| Start new feature | `git checkout dev && git pull && git checkout -b feature/name` |
| Push feature | `git push origin feature/name` |
| Create PR to dev | GitHub UI: "Compare & pull request" |
| Test on dev | Visit dev preview URL from Vercel dashboard |
| Deploy to prod | GitHub UI: Create PR `dev` → `main`, merge |
| Emergency fix | `git checkout -b hotfix/name` from `main` |

---

**Last Updated:** 2025-10-23
**Maintained By:** Development Team
