# Git Workflow - Centaurus Drum Machine

## Branch Strategy

### Protected Branches

#### `main` - Production
- **Vercel Deployment**: Auto-deploys to production URL
- **Protection**: Pre-push hook requires successful build
- **Merge Policy**: Only merge from `dev` after staging validation
- **Direct Commits**: Strongly discouraged

#### `dev` - Staging
- **Vercel Deployment**: Auto-deploys to dev preview URL
- **Protection**: Pre-push hook requires successful build
- **Purpose**: Integration testing and staging validation
- **Merge Policy**: Merge feature branches here first

### Working Branches

#### `feature/*` - Feature Development
- **Pattern**: `feature/short-description` (e.g., `feature/midi-controller`)
- **Created From**: `dev`
- **Merged To**: `dev`
- **Lifespan**: Delete after merge
- **Vercel Deployment**: No auto-deploy (manual previews only)

#### `epic-*` - Epic Work in Progress
- **Pattern**: `epic-N-wip` (e.g., `epic-16-wip`)
- **Created From**: `dev`
- **Purpose**: Long-lived branches for multi-story epics
- **Merge To**: `dev` when epic complete
- **Vercel Deployment**: No auto-deploy

#### `claude/*` - AI-Generated Temp Branches
- **Pattern**: `claude/description-hash`
- **Purpose**: Temporary branches created by Claude Code
- **Merge To**: `dev` or delete if experimental
- **Cleanup**: Delete after PR merge or abandonment

---

## Standard Workflow

### 1. Starting New Work

```bash
# Update dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feat: implement my feature"
```

### 2. Testing Locally

```bash
# Always test build before pushing
npm run build

# Preview production build
npm run preview

# Check for TypeScript errors
npx tsc --noEmit
```

### 3. Pushing Feature Branch

```bash
# Push feature branch (pre-push hook runs automatically)
git push -u origin feature/my-feature
```

### 4. Merging to Staging

```bash
# Create PR: feature/my-feature → dev
# Or merge directly if you're solo:
git checkout dev
git pull origin dev
git merge feature/my-feature
git push origin dev

# Verify staging deployment on Vercel dev URL
# Test all changes in staging environment
```

### 5. Promoting to Production

```bash
# Only after staging validation!
git checkout main
git pull origin main
git merge dev
git push origin main

# Monitor production deployment on Vercel
# Verify production URL
```

### 6. Cleanup

```bash
# Delete merged feature branches
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## Pre-Push Hook Protection

The `.git/hooks/pre-push` hook automatically checks:

### 1. Build Artifact Prevention
- **Check**: Scans for `dist/` files in commits
- **Action**: Blocks push if detected
- **Reason**: Vercel builds from source; artifacts cause conflicts

### 2. Build Validation (main/dev only)
- **Check**: Runs `npm run build` before pushing to main or dev
- **Action**: Blocks push if build fails
- **Reason**: Prevents broken deployments to Vercel

### 3. Main Branch Warning
- **Check**: Confirms direct pushes to main
- **Action**: Prompts for confirmation
- **Reason**: Encourages dev → main workflow

---

## Vercel Deployment Configuration

From `vercel.json`:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,   // Production deployment
      "dev": true     // Staging deployment
    }
  }
}
```

### Deployment URLs
- **Production**: `main` → https://centaurus-drum-machine.vercel.app
- **Staging**: `dev` → https://centaurus-drum-machine-dev.vercel.app
- **Feature Previews**: Manual deployment links from Vercel dashboard

---

## Common Scenarios

### Scenario 1: Quick Bug Fix

```bash
# From dev branch
git checkout dev
git pull origin dev
git checkout -b feature/fix-bug

# Make fix
git add .
git commit -m "fix: resolve sequencer timing issue"

# Test build
npm run build

# Push and merge
git push -u origin feature/fix-bug
git checkout dev
git merge feature/fix-bug
git push origin dev

# Verify in staging, then promote to main
```

### Scenario 2: Working on Epic

```bash
# Create long-lived epic branch
git checkout dev
git pull origin dev
git checkout -b epic-17-wip

# Work on multiple stories
# Commit regularly
git add .
git commit -m "feat(story-17.1): implement feature X"

# Push periodically to backup work
git push -u origin epic-17-wip

# When epic complete, merge to dev
git checkout dev
git merge epic-17-wip
git push origin dev
```

### Scenario 3: Emergency Production Fix

```bash
# ONLY for critical production bugs!
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make minimal fix
git add .
git commit -m "hotfix: resolve critical production issue"

# Test build thoroughly
npm run build
npm run preview

# Push to main (pre-push hook will confirm)
git push -u origin hotfix/critical-issue
git checkout main
git merge hotfix/critical-issue
git push origin main

# Backport to dev
git checkout dev
git merge main
git push origin dev
```

---

## Branch Naming Conventions

### Good Branch Names
- ✅ `feature/midi-integration`
- ✅ `feature/user-auth`
- ✅ `epic-17-wip`
- ✅ `hotfix/audio-crash`
- ✅ `docs/api-documentation`

### Bad Branch Names
- ❌ `test` (too vague)
- ❌ `my-changes` (not descriptive)
- ❌ `v2` (use semantic versioning elsewhere)
- ❌ `final` (never name branches "final")

---

## Rollback Strategy

### Rollback Production Deployment

```bash
# Option 1: Revert commit on main
git checkout main
git revert HEAD
git push origin main

# Option 2: Rollback to previous working commit
git checkout main
git reset --hard <commit-hash>
git push origin main --force

# ⚠️ Use --force ONLY for production emergencies!
```

### Vercel Dashboard Rollback
1. Go to Vercel dashboard
2. Find project deployments
3. Click "..." on previous working deployment
4. Select "Promote to Production"

---

## Git Configuration Recommendations

```bash
# Set default branch for new repos
git config --global init.defaultBranch main

# Always create tracking branch on first push
git config --global push.default current

# Use SSH for GitHub (more secure)
git remote set-url origin git@github.com:mylesdebastion/Centaurus-Drum-Machine.git

# Helpful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
```

---

## Troubleshooting

### Pre-Push Hook Not Running

```bash
# Make hook executable (Windows Git Bash)
chmod +x .git/hooks/pre-push

# Verify hook exists
ls -la .git/hooks/pre-push
```

### Build Failing on Push

```bash
# Check TypeScript errors locally
npx tsc --noEmit

# Check for linting issues
npm run lint

# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Wrong Branch Deployed to Vercel

1. Check `vercel.json` configuration
2. Verify branch in Vercel dashboard settings
3. Ensure branch names match exactly (case-sensitive)

### Merge Conflicts

```bash
# Update your branch with latest dev
git checkout feature/my-feature
git fetch origin
git merge origin/dev

# Resolve conflicts in editor
# Then:
git add .
git commit -m "merge: resolve conflicts with dev"
```

---

## Pre-Commit Checklist

Before committing, ensure:
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] Code follows project conventions (see `docs/architecture/coding-standards.md`)
- [ ] No console.log debugging statements (unless intentional)
- [ ] No hardcoded credentials or API keys
- [ ] Commit message follows conventional commits format

---

## Pre-Push Checklist

Before pushing to dev/main:
- [ ] Build succeeds: `npm run build`
- [ ] No build artifacts in commit: `git status`
- [ ] Feature tested locally
- [ ] Documentation updated (if applicable)
- [ ] CLAUDE.md guidelines followed

---

## Resources

- **Conventional Commits**: https://www.conventionalcommits.org/
- **Git Best Practices**: https://git-scm.com/book/en/v2
- **Vercel Git Integration**: https://vercel.com/docs/concepts/git

---

## Quick Reference

```bash
# Daily workflow
git checkout dev && git pull                    # Start day
git checkout -b feature/my-feature              # New feature
git add . && git commit -m "feat: ..."          # Commit work
npm run build                                    # Test build
git push -u origin feature/my-feature           # Push feature
git checkout dev && git merge feature/my-feature # Merge to staging

# View branches
git branch -a                                    # All branches
git branch -vv                                   # With tracking info

# Cleanup
git branch -d feature/my-feature                 # Delete local
git push origin --delete feature/my-feature      # Delete remote

# Emergency
git stash                                        # Save uncommitted work
git stash pop                                    # Restore stashed work
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-24
**Related**: `CLAUDE.md`, `docs/assessments/workflow-assessment-2025-01-24.md`
