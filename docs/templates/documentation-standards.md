# Centaurus Drum Machine - Documentation Standards

**Version:** 2.0
**Last Updated:** 2025-01-13
**Status:** ✅ Active (Greenfield Structure)

---

## Overview

This document defines the greenfield documentation structure for the Centaurus Drum Machine project after Phase 1 reconciliation audit. All documentation follows consistent formats, naming conventions, and completion criteria.

---

## 1. Documentation Structure

### 1.1 Directory Organization

```plaintext
docs/
├── prd/                          # Product Requirements Documents
│   ├── index.md                  # PRD Table of Contents (links to epics, no inline content)
│   ├── intro-project-analysis-and-context.md
│   ├── requirements.md           # Functional and Non-Functional Requirements
│   ├── user-interface-enhancement-goals.md
│   ├── technical-constraints-and-integration-requirements.md
│   └── epic-and-story-structure.md
│
├── epics/                        # Epic Documentation (consolidated location)
│   ├── epic-1-apc40-hardware-controller-integration.md
│   ├── epic-4-global-music-controls.md
│   ├── epic-5-universal-responsive-architecture.md
│   ├── epic-6-multi-client-sessions-wled.md
│   ├── epic-9-multi-instrument-midi-visualization.md
│   ├── epic-11-roli-lumi-integration.md
│   └── epic-12-sound-engine-expansion.md
│
├── stories/                      # Story Documentation (sharded by story ID)
│   ├── 1.1.story.md             # Format: {epic}.{story}.story.md
│   ├── 4.1.story.md
│   ├── 4.2.story.md
│   └── ...
│
├── architecture/                 # Architecture Documentation
│   ├── index.md
│   ├── source-tree.md           # Component directory structure
│   ├── component-architecture.md
│   ├── tech-stack.md
│   ├── responsive-component-patterns.md
│   └── ...
│
├── templates/                    # NEW: Documentation Templates
│   ├── documentation-standards.md (this file)
│   ├── epic-template.md
│   └── story-template.md
│
└── reconciliation-audit.md       # Phase 1 audit deliverable (archive)
```

---

## 2. Epic Documentation Standards

### 2.1 Epic Location

**All epics MUST be in `docs/epics/`** (consolidated from previous `docs/prd/` split).

**File Naming Convention:**
- Format: `epic-{number}-{kebab-case-name}.md`
- Example: `epic-4-global-music-controls.md`

### 2.2 Epic Structure

Every epic MUST include these sections (see `docs/templates/epic-template.md`):

1. **Header** - Status, Priority, Target Completion
2. **Epic Overview** - Vision and business context
3. **Stories** - List of child stories with status
4. **Technical Architecture** - High-level design (optional but recommended)
5. **Success Metrics** - Measurable completion criteria
6. **Change Log** - Version history with dates and authors
7. **Next Steps** - Action items and story sequencing

### 2.3 Epic Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| 📝 **PLANNING** | Epic defined, no stories started | Initial creation |
| 🚧 **IN PROGRESS** | 1+ stories in progress or complete | First story starts |
| ✅ **COMPLETE** | All stories complete and tested | All child stories done |
| ⏸️ **PAUSED** | Temporarily blocked or deprioritized | External dependency |
| ❌ **CANCELLED** | Epic abandoned (rare) | Business decision |

**IMPORTANT:** Update epic status when child stories complete!

---

## 3. Story Documentation Standards

### 3.1 Story Location

**All stories MUST be in `docs/stories/`**.

**File Naming Convention:**
- Format: `{epic}.{story}.story.md`
- Example: `4.2.story.md` (Epic 4, Story 2)
- For multi-phase stories: `11.1.roli-lumi-integration.story.md` (descriptive suffix OK)

### 3.2 Story Structure

Every story MUST include these sections (see `docs/templates/story-template.md`):

1. **Title** - `# Story {epic}.{story}: {Name}`
2. **Status** - Current state (see 3.3)
3. **Story** - As a / I want / So that format
4. **Acceptance Criteria** - Numbered list of deliverables
5. **Integration Verification** - IV1, IV2, IV3 cross-component tests
6. **Tasks / Subtasks** - Detailed implementation checklist
7. **Dev Notes** - Architecture context, code examples, testing strategy
8. **Change Log** - Version history
9. **Dev Agent Record** - CRITICAL completion metadata (see 3.4)
10. **QA Results** - Populated by QA agent

### 3.3 Story Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **Draft** | Story written, not started | Initial creation |
| **PLANNING** | Story refined, ready to start | Pre-sprint planning |
| **Ready for Development** | Story approved, assigned | Sprint backlog |
| **In Progress** | Developer actively working | First commit |
| **Ready for Review** | Implementation complete, needs code review | Pre-PR |
| **COMPLETE** | Code reviewed, merged, tested | Post-merge |
| **BLOCKED** | Cannot proceed (dependency) | External blocker |

**IMPORTANT:** Update status immediately when work progresses!

### 3.4 Dev Agent Record Requirements

**MANDATORY for all COMPLETE stories:**

```markdown
## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5-20250929

### Debug Log References
- None (clean implementation)
OR
- `logs/debug-2025-01-11.log` lines 234-456 (TypeError fix)

### Completion Notes List
- Bullet list of what was implemented
- Key decisions made during development
- Integration points with existing code
- Deviations from original story (if any)
- Performance benchmarks achieved

### File List
**Created:**
- `src/path/to/NewComponent.tsx` - Description (X lines)
- `src/path/to/__tests__/NewComponent.test.tsx` - Test suite (X lines)

**Modified:**
- `src/App.tsx` - Added route for new component
- `vite.config.ts` - Updated test configuration
```

**How to Populate:**

1. **First**: Use `git show {commit-hash}` to get file diffs
2. **If insufficient detail**: Consult dev agent persona (`/BMad:agents:dev`)
3. **Agent Model Used**: Check git commit author or `.bmad-core/` config
4. **File List**: Extract from `git diff --name-status {commit-hash}^..{commit-hash}`

---

## 4. PRD vs Epic Relationship

### 4.1 PRD Purpose

The Product Requirements Document (`docs/prd/index.md`) serves as:
- **High-level roadmap** - Links to epics, doesn't contain them inline
- **Requirements summary** - Functional/non-functional/technical requirements
- **Project context** - Business goals, user personas, constraints

### 4.2 Epic-First Development

**New feature workflow:**

1. **PO creates Epic** in `docs/epics/` (using template)
2. **PO creates Stories** in `docs/stories/` (using template)
3. **PO updates PRD index** with epic link
4. **Dev starts work** (story status → In Progress)
5. **Dev completes work** (git commit with story reference)
6. **Dev updates story** (status → Ready for Review, populate Dev Agent Record)
7. **PM reviews** (verify Dev Agent Record complete)
8. **QA validates** (populate QA Results section)
9. **PM marks story COMPLETE** (all sections filled)

### 4.3 Epic Consolidation (Option A)

**Historical epics in `docs/prd/` (Epics 1-3):**

1. **Copy epic files** from `docs/prd/epic-*.md` to `docs/epics/`
2. **Update PRD index** to link to `docs/epics/` instead of inline
3. **Delete inline epic content** from PRD (replace with links)
4. **Maintain PRD** as requirements summary only

**Timeline:** Complete during Phase 3 (PM execution).

---

## 5. Naming Conventions

### 5.1 File Names

| Document Type | Format | Example |
|---------------|--------|---------|
| Epic | `epic-{number}-{kebab-case}.md` | `epic-4-global-music-controls.md` |
| Story | `{epic}.{story}.story.md` | `4.2.story.md` |
| Story (descriptive) | `{epic}.{story}.{description}.story.md` | `11.1.roli-lumi-integration.story.md` |
| PRD section | `{kebab-case}.md` | `requirements.md` |
| Architecture | `{kebab-case}.md` | `source-tree.md` |

**Rules:**
- Use kebab-case (lowercase with hyphens)
- No spaces, underscores, or camelCase
- Story files MUST end with `.story.md`
- Epic files MUST start with `epic-{number}`

### 5.2 Component Names (in Architecture Docs)

| Component Type | Format | Example |
|----------------|--------|---------|
| React Component | PascalCase | `GlobalMusicHeader` |
| Directory | PascalCase | `src/components/GlobalMusicHeader/` |
| Utility file | camelCase | `audioEngine.ts` |
| Hook | camelCase with `use` prefix | `useGlobalMusic.ts` |
| Context | PascalCase with `Context` suffix | `GlobalMusicContext.tsx` |

---

## 6. Completion Criteria

### 6.1 Story Completion Checklist

A story is NOT complete until:

- [x] Status updated to COMPLETE
- [x] All Acceptance Criteria met
- [x] All Integration Verification tests passed
- [x] Dev Agent Record fully populated:
  - [x] Agent Model Used
  - [x] Debug Log References (or "None")
  - [x] Completion Notes List (3+ bullets)
  - [x] File List (Created + Modified with line counts)
- [x] Git commit references story ID (e.g., `feat: implement Story 4.2`)
- [x] Code reviewed and merged
- [x] Tests written and passing

### 6.2 Epic Completion Checklist

An epic is NOT complete until:

- [x] All child stories COMPLETE
- [x] Epic status updated to ✅ COMPLETE
- [x] Success Metrics validated
- [x] Change Log updated with completion date
- [x] PRD index updated with epic status

---

## 7. Maintenance Guidelines

### 7.1 Daily Developer Workflow

**When starting a story:**
1. Update story status: Draft → In Progress
2. Create feature branch: `git checkout -b story/{epic}.{story}-description`

**During development:**
3. Commit with story reference: `git commit -m "feat: implement Story 4.2 - tempo control"`
4. Update story tasks: Check off completed subtasks

**When completing a story:**
5. Update story status: In Progress → Ready for Review
6. Populate Dev Agent Record (use `git show` for file lists)
7. Create PR with story link
8. After merge: Update story status → COMPLETE

### 7.2 Weekly PM Workflow

**Documentation audit:**
1. Review stories marked COMPLETE (verify Dev Agent Record populated)
2. Check for orphan commits (feat: commits without story reference)
3. Update epic statuses (if child stories completed)
4. Update PRD index (if epics completed)

**Target:** Maintain 1:3 docs:feat commit ratio (1 docs commit per 3 feature commits).

### 7.3 Monthly PO Workflow

**Quarterly planning:**
1. Create new epics for upcoming features
2. Break epics into stories
3. Update PRD roadmap
4. Archive completed epics (move to `docs/archive/` if needed)

---

## 8. Git Commit Standards

### 8.1 Commit Message Format

```
<type>: <description>

[optional body]

[optional story reference]
```

**Types:**
- `feat:` - New feature (maps to story)
- `fix:` - Bug fix
- `docs:` - Documentation updates
- `refactor:` - Code refactoring (no new features)
- `test:` - Test additions/updates
- `chore:` - Build, config, dependencies

**Story Reference Format:**
```
feat: implement Story 4.2 - Global Music Header Bar Component

- Added TempoControl subcomponent
- Integrated ScaleSelector
- Implemented mobile responsive layout

Story: docs/stories/4.2.story.md
```

### 8.2 Bulk Story Implementation

**When implementing multiple stories in one commit:**

```
feat: implement Epic 4 Stories 4.1-4.7 - Global Music Controls & Module Loading System

Completed all 7 stories in Epic 4:
- Story 4.1: GlobalMusicContext with localStorage persistence
- Story 4.2: GlobalMusicHeader with tempo, key, scale controls
- Story 4.3: Persistent AudioEngine lifecycle
- Story 4.4: Hardware I/O integration points
- Story 4.5: Visualization color mapping system
- Story 4.6: View integration & refactoring
- Story 4.7: Module loading system & dynamic canvas

Stories: docs/stories/4.1.story.md through 4.7.story.md
```

**IMPORTANT:** Still update each story's Dev Agent Record individually!

---

## 9. Templates

### 9.1 Using Templates

**Create new epic:**
```bash
cp docs/templates/epic-template.md docs/epics/epic-13-new-feature.md
# Edit file, replace all {PLACEHOLDERS}
```

**Create new story:**
```bash
cp docs/templates/story-template.md docs/stories/13.1.story.md
# Edit file, replace all {PLACEHOLDERS}
```

### 9.2 Template Locations

- **Epic Template:** `docs/templates/epic-template.md`
- **Story Template:** `docs/templates/story-template.md`

---

## 10. Migration from Brownfield

### 10.1 Phase 3 Execution (PM Tasks)

See `docs/reconciliation-audit.md` Section 8 for detailed migration checklist:

**HIGH PRIORITY (1 sprint):**
1. Update 11 outdated story statuses
2. Backfill Dev Agent Records for Stories 4.2-4.7, 5.1, 6.1, 9.1, 9.2
3. Create Epics 5, 6, 11, 12
4. Update architecture docs (source-tree.md)

**MEDIUM PRIORITY (2 sprints):**
5. Document orphan features
6. Consolidate epic documentation (copy Epics 1-3 from prd/ to epics/)

### 10.2 Backfill Workflow

**For each completed story with missing Dev Agent Record:**

1. Find implementation commit:
   ```bash
   git log --grep="Story 4.2" --oneline
   ```

2. Extract file list:
   ```bash
   git diff --name-status {commit-hash}^..{commit-hash}
   ```

3. Get file details:
   ```bash
   git show {commit-hash} --stat
   ```

4. Count lines (for Created/Modified):
   ```bash
   wc -l {file-path}
   ```

5. Write completion notes based on:
   - Git commit message
   - Story Acceptance Criteria (what was delivered)
   - Code changes (git diff)
   - If insufficient detail: Consult dev agent

---

## 11. Success Metrics

### 11.1 Documentation Health KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Story Status Accuracy | 100% | Audited stories with correct status |
| Dev Agent Record Completion | 100% | COMPLETE stories with populated records |
| Docs:Feat Commit Ratio | 1:3 | docs: commits per feat: commits |
| Epic Documentation Coverage | 100% | Implemented epics in docs/epics/ |
| Architecture Doc Currency | <1 month lag | Last update vs latest component |

### 11.2 Monthly Audit Checklist

- [ ] All COMPLETE stories have Dev Agent Records
- [ ] All implemented epics documented in `docs/epics/`
- [ ] `docs/architecture/source-tree.md` matches `src/components/`
- [ ] PRD index links valid
- [ ] No orphan feat: commits (all reference stories)

---

## 12. Questions and Troubleshooting

### 12.1 Common Questions

**Q: Story implemented but no Dev Agent Record. What do I do?**
A: Follow Section 10.2 Backfill Workflow. Use git diffs first, consult dev agent if needed.

**Q: Epic spans multiple quarters. How do I track status?**
A: Keep epic IN PROGRESS. Add "Completion: 3/7 stories" note in overview. Update when all stories done.

**Q: Orphan feature found (commit with no story). What do I do?**
A: Create retro story in `docs/stories/`, mark COMPLETE, populate Dev Agent Record from git history.

**Q: Story was implemented differently than planned. Update story or Dev Agent Record?**
A: Keep story Acceptance Criteria as original plan. Document deviations in "Completion Notes" section of Dev Agent Record.

### 12.2 Escalation

**Documentation issues:**
- **Minor**: PM resolves (story status updates, backfills)
- **Major**: PO involvement (epic restructuring, requirements changes)

**Technical questions:**
- Consult dev agent: `/BMad:agents:dev`

---

## 13. Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-13 | 2.0 | Greenfield documentation standards (post-reconciliation) | Sarah (PO) |
| 2025-01-13 | 2.1 | Added git commit standards, backfill workflow, success metrics | Sarah (PO) |

---

## 14. Appendix: Quick Reference

### File Naming Cheat Sheet

```bash
# Epic
docs/epics/epic-4-global-music-controls.md

# Story (simple)
docs/stories/4.2.story.md

# Story (descriptive)
docs/stories/11.1.roli-lumi-integration.story.md

# Architecture
docs/architecture/source-tree.md
```

### Status Quick Lookup

**Epic:** PLANNING → IN PROGRESS → COMPLETE
**Story:** Draft → PLANNING → In Progress → Ready for Review → COMPLETE

### Git Commit Examples

```bash
# Feature with story reference
git commit -m "feat: implement Story 4.2 - Global Music Header"

# Bulk epic implementation
git commit -m "feat: implement Epic 4 Stories 4.1-4.7"

# Documentation update
git commit -m "docs: update Story 4.2 Dev Agent Record"

# Bug fix
git commit -m "fix: resolve tempo control validation bug (Story 4.2)"
```

---

**This document is the single source of truth for Centaurus documentation standards. All team members (PO, PM, Dev, QA) must follow these guidelines.**
