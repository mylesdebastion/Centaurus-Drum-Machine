# PRD Epic Consolidation Plan (Option A)

**Date:** 2025-01-13
**Author:** Sarah (Product Owner)
**Status:** ✅ Approved
**Execution Owner:** PM
**Estimated Effort:** 1-2 hours

---

## Overview

This plan implements **Option A** from the Phase 1 reconciliation audit: Consolidate all epic documentation into `docs/epics/` and maintain the PRD as a high-level requirements summary that references (not contains) epics.

**Current State:**
- Epics 1-4 documented inline in `docs/prd/epic-{number}-{name}.md`
- Epic 9 documented in `docs/epics/epic-9-multi-instrument-midi-visualization.md`
- Inconsistent structure causes confusion

**Target State:**
- **ALL epics in `docs/epics/`** (single source of truth)
- **PRD references epics** via links in `docs/prd/index.md`
- **No inline epic content in PRD** (high-level summary only)

---

## Rationale for Option A

### Advantages
1. **Single source of truth** - Epics in one location only
2. **Simpler maintenance** - Update epic once, PRD links to it
3. **Clear separation of concerns** - PRD = requirements, Epics = implementation plans
4. **Easier navigation** - Developers go straight to `docs/epics/`
5. **Consistent with Epic 9** - Already using `docs/epics/` pattern

### Disadvantages (Accepted Trade-offs)
1. **Historical context lost** - Original PRD structure modified
2. **Migration effort** - 1-2 hours to consolidate

**Decision:** Advantages outweigh trade-offs. Proceed with Option A.

---

## Migration Steps

### Step 1: Copy Epics from PRD to docs/epics/

**Files to copy:**

```bash
# Copy Epic 1
cp docs/prd/epic-1-apc40-hardware-controller-integration.md docs/epics/

# Copy Epic 2
cp docs/prd/epic-2-boomwhacker.md docs/epics/

# Copy Epic 3
cp docs/prd/epic-3-multi-controller-pro-monetization.md docs/epics/

# Copy Epic 4
cp docs/prd/epic-4-global-music-controls.md docs/epics/
```

**Verify copies:**
```bash
ls -lh docs/epics/epic-*.md
```

**Expected result:**
```
docs/epics/epic-1-apc40-hardware-controller-integration.md
docs/epics/epic-2-boomwhacker.md
docs/epics/epic-3-multi-controller-pro-monetization.md
docs/epics/epic-4-global-music-controls.md
docs/epics/epic-9-multi-instrument-midi-visualization.md
```

### Step 2: Update Epic Statuses in Copied Files

Based on Phase 1 audit findings:

**Epic 1 (APC40):** Status unknown, requires verification
**Epic 2 (Boomwhacker):** Status unknown, requires verification
**Epic 3 (Multi-Controller Pro):** Status unknown, requires verification
**Epic 4 (Global Music Controls):** **✅ COMPLETE** (Stories 4.1-4.7 all complete)
**Epic 9 (Multi-Instrument MIDI):** **🚧 IN PROGRESS** (Stories 9.1-9.3 complete, 9.4 pending)

**Actions:**

1. Edit `docs/epics/epic-4-global-music-controls.md`:
   ```markdown
   **Status:** ✅ **COMPLETE**
   **Priority:** High
   **Target Completion:** Q1 2025 ✅ **COMPLETED**
   ```

2. Edit `docs/epics/epic-9-multi-instrument-midi-visualization.md`:
   ```markdown
   **Status:** 🚧 **IN PROGRESS** (was: 📝 **PLANNING**)
   **Priority:** High
   **Target Completion:** Q1 2025
   ```

3. Verify Epics 1-3 implementation status:
   ```bash
   # Search for Epic 1 story implementations
   git log --grep="Epic 1" --grep="Story 1\." --oneline | head -20

   # Search for APC40 implementations
   git log --grep="APC40" --oneline | head -20

   # Repeat for Epic 2, 3
   ```

4. Update Epic 1-3 statuses based on findings (likely PLANNING or IN PROGRESS)

### Step 3: Create Epic Index in docs/epics/

Create `docs/epics/index.md` for easy navigation:

```markdown
# Centaurus Drum Machine - Epics

This directory contains all epic documentation for the Centaurus Drum Machine project. For high-level requirements, see `docs/prd/index.md`.

---

## Active Epics

| Epic | Name | Status | Priority | Target |
|------|------|--------|----------|--------|
| [Epic 1](./epic-1-apc40-hardware-controller-integration.md) | APC40 Hardware Controller Integration | {STATUS} | High | Q1 2025 |
| [Epic 4](./epic-4-global-music-controls.md) | Global Music Controls & State Management | ✅ COMPLETE | High | Q1 2025 |
| [Epic 5](./epic-5-universal-responsive-architecture.md) | Universal Responsive Architecture | ✅ COMPLETE | High | Q4 2024 |
| [Epic 6](./epic-6-multi-client-sessions-wled.md) | Multi-Client Sessions & WLED Integration | 🚧 IN PROGRESS | High | Q1 2025 |
| [Epic 9](./epic-9-multi-instrument-midi-visualization.md) | Multi-Instrument MIDI Visualization Suite | 🚧 IN PROGRESS | High | Q1 2025 |
| [Epic 11](./epic-11-roli-lumi-integration.md) | ROLI LUMI Integration | 🚧 IN PROGRESS | Medium | Q1 2025 |
| [Epic 12](./epic-12-sound-engine-expansion.md) | Sound Engine Expansion | 📝 PLANNING | Medium | Q2 2025 |

---

## Future Epics

| Epic | Name | Status | Priority | Target |
|------|------|--------|----------|--------|
| [Epic 2](./epic-2-boomwhacker.md) | Boomwhacker Color Mapping | {STATUS} | Low | Q2 2025 |
| [Epic 3](./epic-3-multi-controller-pro-monetization.md) | Multi-Controller Pro Monetization | {STATUS} | Low | Q2 2025 |

---

## Epic Status Legend

- 📝 **PLANNING** - Epic defined, no stories started
- 🚧 **IN PROGRESS** - 1+ stories in progress or complete
- ✅ **COMPLETE** - All stories complete and tested
- ⏸️ **PAUSED** - Temporarily blocked or deprioritized
- ❌ **CANCELLED** - Epic abandoned

---

**Last Updated:** {YYYY-MM-DD}
```

### Step 4: Update PRD Index to Reference Epics

Edit `docs/prd/index.md` to replace inline epic content with links:

**BEFORE (current structure):**
```markdown
## Table of Contents
- [Epic 1: APC40 Hardware Controller Integration](./epic-1-apc40-hardware-controller-integration.md)
- [Epic 4: Global Music Controls & State Management](./epic-4-global-music-controls.md)
```

**AFTER (consolidated structure):**
```markdown
## Table of Contents

- [Intro Project Analysis and Context](./intro-project-analysis-and-context.md)
- [Requirements](./requirements.md)
- [User Interface Enhancement Goals](./user-interface-enhancement-goals.md)
- [Technical Constraints and Integration Requirements](./technical-constraints-and-integration-requirements.md)
- [Epic and Story Structure](./epic-and-story-structure.md)

## Epics

For detailed epic documentation, see [docs/epics/](../epics/index.md).

| Epic | Name | Status | Stories |
|------|------|--------|---------|
| [Epic 1](../epics/epic-1-apc40-hardware-controller-integration.md) | APC40 Hardware Controller Integration | {STATUS} | 1.1-1.6 |
| [Epic 2](../epics/epic-2-boomwhacker.md) | Boomwhacker Color Mapping | {STATUS} | TBD |
| [Epic 3](../epics/epic-3-multi-controller-pro-monetization.md) | Multi-Controller Pro Monetization | {STATUS} | TBD |
| [Epic 4](../epics/epic-4-global-music-controls.md) | Global Music Controls & State Management | ✅ COMPLETE | 4.1-4.7 |
| [Epic 5](../epics/epic-5-universal-responsive-architecture.md) | Universal Responsive Architecture | ✅ COMPLETE | 5.1 |
| [Epic 6](../epics/epic-6-multi-client-sessions-wled.md) | Multi-Client Sessions & WLED Integration | 🚧 IN PROGRESS | 6.1+ |
| [Epic 9](../epics/epic-9-multi-instrument-midi-visualization.md) | Multi-Instrument MIDI Visualization Suite | 🚧 IN PROGRESS | 9.1-9.4 |
| [Epic 11](../epics/epic-11-roli-lumi-integration.md) | ROLI LUMI Integration | 🚧 IN PROGRESS | 11.1+ |
| [Epic 12](../epics/epic-12-sound-engine-expansion.md) | Sound Engine Expansion | 📝 PLANNING | 12.1+ |
```

### Step 5: Remove Inline Epic Content from PRD

**CRITICAL: Do not delete epic files from docs/prd/ yet!**

Instead, replace epic content with redirects:

**Edit `docs/prd/epic-1-apc40-hardware-controller-integration.md`:**
```markdown
# Epic 1: APC40 Hardware Controller Integration

**This epic has been moved to maintain consistency.**

**New Location:** [docs/epics/epic-1-apc40-hardware-controller-integration.md](../epics/epic-1-apc40-hardware-controller-integration.md)

**Reason:** All epics are now consolidated in `docs/epics/` for easier maintenance and navigation.

---

**Redirected on:** 2025-01-13
**Phase:** Documentation Reconciliation (Phase 2)
```

Repeat for Epics 2, 3, 4 in `docs/prd/`.

**Rationale:** Keep redirect files to maintain link integrity and provide migration context.

### Step 6: Verify No Broken Links

```bash
# Search for epic links in all markdown files
grep -r "epic-[0-9]" docs/ --include="*.md" | grep -v "docs/epics/"

# Verify PRD links valid
grep -r "\.\./epics/epic-" docs/prd/ --include="*.md"

# Check story files for epic references
grep -r "Epic [0-9]" docs/stories/ --include="*.md" | head -20
```

Fix any broken links found.

### Step 7: Update Architecture Documentation

Edit `docs/architecture/index.md` to reference `docs/epics/`:

```markdown
## Documentation Structure

- **Product Requirements:** `docs/prd/` - High-level requirements and constraints
- **Epics:** `docs/epics/` - Feature implementation plans
- **Stories:** `docs/stories/` - Detailed user stories with acceptance criteria
- **Architecture:** `docs/architecture/` - Technical architecture documentation
```

### Step 8: Create Epic 5, 6, 11, 12 (Per Phase 1 Audit)

**NEW epics to create (not in PRD yet):**

```bash
# Use epic template
cp docs/templates/epic-template.md docs/epics/epic-5-universal-responsive-architecture.md
cp docs/templates/epic-template.md docs/epics/epic-6-multi-client-sessions-wled.md
cp docs/templates/epic-template.md docs/epics/epic-11-roli-lumi-integration.md
cp docs/templates/epic-template.md docs/epics/epic-12-sound-engine-expansion.md
```

**Populate based on reconciliation audit findings:**

- **Epic 5:** Extract from Story 5.1 (Responsive Architecture)
- **Epic 6:** Extract from Story 6.1 (WLED Integration)
- **Epic 11:** Extract from Story 11.1 (ROLI LUMI)
- **Epic 12:** Extract from orphan sound engine commits

**Details in Phase 3 execution plan (PM task).**

---

## Validation Checklist

After completing all steps, verify:

- [ ] All epics (1-4, 9) copied to `docs/epics/`
- [ ] Epic statuses updated (Epic 4 = COMPLETE, Epic 9 = IN PROGRESS)
- [ ] `docs/epics/index.md` created with all epics listed
- [ ] `docs/prd/index.md` updated to reference `docs/epics/`
- [ ] Epic files in `docs/prd/` replaced with redirect notices
- [ ] No broken links in `docs/` directory
- [ ] `docs/architecture/index.md` updated with epic reference
- [ ] New epics (5, 6, 11, 12) created (Phase 3 task)

---

## Rollback Plan

If consolidation causes issues:

1. **Immediate:** Revert redirect files in `docs/prd/` to original content
2. **Short-term:** Git revert to pre-consolidation commit
3. **Long-term:** Address specific issues, re-attempt consolidation

**Git safety:**
```bash
# Before starting consolidation
git checkout -b consolidate-epics-prd
git add docs/
git commit -m "docs: consolidate epics from prd/ to epics/ (Option A)"

# If rollback needed
git checkout main
git branch -D consolidate-epics-prd
```

---

## Timeline

**Phase 3 Execution (PM):**

| Step | Task | Est. Time | Priority |
|------|------|-----------|----------|
| 1 | Copy Epics 1-4 to docs/epics/ | 15 min | HIGH |
| 2 | Update Epic 4, 9 statuses | 10 min | HIGH |
| 3 | Create docs/epics/index.md | 15 min | HIGH |
| 4 | Update docs/prd/index.md | 10 min | HIGH |
| 5 | Replace PRD epic files with redirects | 10 min | MEDIUM |
| 6 | Verify no broken links | 10 min | HIGH |
| 7 | Update docs/architecture/index.md | 5 min | MEDIUM |
| 8 | Create Epics 5, 6, 11, 12 | 60 min | HIGH |

**Total:** 2 hours 15 minutes

---

## Success Criteria

Consolidation is successful when:

- ✅ All epics documented in `docs/epics/` (single location)
- ✅ PRD references epics via links (no inline content)
- ✅ No broken links in documentation
- ✅ Epic statuses accurate (based on Phase 1 audit)
- ✅ New epics (5, 6, 11, 12) created and documented
- ✅ Documentation structure matches `documentation-standards.md`

---

## Related Documents

- **Phase 1 Audit:** `docs/reconciliation-audit.md`
- **Documentation Standards:** `docs/templates/documentation-standards.md`
- **Epic Template:** `docs/templates/epic-template.md`
- **Phase 3 Execution Plan:** (PM to create detailed task breakdown)

---

**Approval:** ✅ Approved by PO (Sarah) on 2025-01-13
**Execution:** PM to execute during Phase 3
**Validation:** PO + PM sign-off in Phase 4
