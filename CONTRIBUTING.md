# Contributing to Audiolux Jam Session

## Git Workflow

### Branch Structure

- **`main`** - Production branch (deployed to jam.audiolux.app)
  - Protected branch
  - Only updated via Pull Requests from `dev`
  - Automatically deployed to production by Vercel

- **`dev`** - Development branch (deployed to jam-dev.audiolux.app)
  - Active development happens here
  - Preview deployments on every push
  - Test all changes before merging to main

### Development Workflow

```
1. Work on dev branch
   git checkout dev

2. Make changes and commit
   git add .
   git commit -m "feat: your changes"

3. Push to dev
   git push origin dev

4. Test on preview
   https://jam-dev.audiolux.app

5. When ready for production:
   - Create PR: dev → main
   - Review changes
   - Merge PR to deploy to production
```

### Important Rules

✅ **DO:**
- Develop on `dev` branch
- Test on jam-dev.audiolux.app before merging
- Use Pull Requests to merge dev → main
- Write descriptive commit messages
- Keep commits focused and atomic

❌ **DON'T:**
- Push directly to `main` branch
- Merge main → dev (except for hotfixes)
- Commit build artifacts (dist/, .vercel/output/)
- Skip testing on preview before production deploy

### Merge Direction

```
CORRECT:
dev → main (via Pull Request)

INCORRECT:
main → dev (this pollutes dev with merge commits)
```

### Handling Merge Conflicts

When creating a PR from dev → main with conflicts:

```bash
# On main branch
git checkout main
git pull origin main

# Merge dev into main
git merge dev

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "Merge branch 'dev'"
git push origin main
```

### Vercel Deployments

- **Production:** Deploys from `main` branch → jam.audiolux.app
- **Preview:** Deploys from `dev` branch → jam-dev.audiolux.app
- **Build artifacts:** Not committed to git (Vercel builds from source)

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
refactor: Refactor code
docs: Update documentation
style: Format code
test: Add tests
chore: Update build process
```

### Questions?

If you're unsure about the workflow, ask before merging!
