# Git Housekeeping TODO

**Status:** Deferred until after pixel sequencer prototype validation
**Priority:** Medium (needed before next major release)
**Owner:** TBD

## Current State (2025-01-24)

### Branch Divergence Issues

```
main (7783984)
├─ Has: Crisp chat, welcome screen refactor, Epic 2 PRD
├─ Missing: Story 22.3, git hooks improvements
│
dev (28abc73)
├─ Has: Story 22.3, git hooks, SEO fixes
├─ Missing: Crisp chat, welcome refactor
├─ Conflict: Story 22.2 exists in both main and dev (duplicate)
│
boomwhacker (89d8a91)
├─ Has: Isometric improvements, DJ visualizer, education features
├─ Missing: Everything from dev and main
├─ Likely conflicts: WLED code modified independently
```

### Orphaned/Outdated Branches

- `education-workshop` - Based on old boomwhacker, needs rebase or archive
- `epic-16-wip` - Old branch, evaluate if work is merged
- `claude/update-isometric-lane-reveal-*` - Feature branch, check if merged

## Recommended Cleanup Strategy

### Option 1: Rebase Approach (Cleanest)

```bash
# 1. Sync dev with main
git checkout dev
git merge origin/main --no-ff -m "chore(sync): merge main into dev"
git push origin dev

# 2. Rebase boomwhacker onto dev
git checkout boomwhacker
git rebase origin/dev
# Resolve WLED conflicts per-commit
git push --force-with-lease origin boomwhacker

# 3. Merge boomwhacker → dev
git checkout dev
git merge boomwhacker --ff-only
git push origin dev
```

### Option 2: Sequential Merge (Safer)

```bash
# 1. Sync main → dev
git checkout dev
git merge origin/main --no-ff
git push origin dev

# 2. PR boomwhacker → dev
# Use GitHub UI, resolve conflicts manually
```

## Post-Cleanup Workflow

```
feature/* → dev → main
            ↓
      dev-jam.audiolux.app
                        ↓
                  jam.audiolux.app
```

## Files to Check for Conflicts

- `src/components/WLED/**/*` - Modified in both boomwhacker and dev
- `.gitignore` - Build artifact fixes in main
- `docs/stories/22.*` - Story 22.2 duplicate
- `vite.config.ts` - Deployment config differences

## Action Items

- [ ] Tag boomwhacker release before merge: `v0.x.0-boomwhacker`
- [ ] Resolve WLED code conflicts (manual review required)
- [ ] Archive or rebase education-workshop branch
- [ ] Delete or document epic-16-wip branch status
- [ ] Verify dev-jam.audiolux.app deployment after dev sync
- [ ] Update CLAUDE.md with finalized workflow

## Notes

- **Why deferred:** Pixel sequencer prototype needs colleague feedback first
- **When to tackle:** After prototype validation, before next feature work
- **Estimated time:** 30-45 minutes of focused work
