# Documentation Maintenance Guidelines

**Version:** 1.0
**Last Updated:** 2025-01-13
**Purpose:** Practical workflows for keeping documentation synchronized with implementation

---

## Overview

This guide provides daily, weekly, and monthly workflows to prevent documentation debt from accumulating. It complements `documentation-standards.md` with actionable maintenance procedures.

**Target Audience:**
- **Developers (Dev):** Daily story updates, Dev Agent Record population
- **Project Manager (PM):** Weekly audits, backfill orphan features
- **Product Owner (PO):** Monthly epic reviews, roadmap updates

---

## Daily Workflows

### Developer: Starting a Story

**When:** Beginning work on a new story

**Steps:**
1. Find story file in `docs/stories/{epic}.{story}.story.md`
2. Update status:
   ```markdown
   ## Status
   In Progress
   ```
3. Create feature branch:
   ```bash
   git checkout -b story/{epic}.{story}-{description}
   ```
4. Make first commit:
   ```bash
   git commit -m "chore: start Story {epic}.{story} - {name}"
   ```

**Time:** 2 minutes

---

### Developer: Checking Off Tasks

**When:** Completing story subtasks during development

**Steps:**
1. Open story file: `docs/stories/{epic}.{story}.story.md`
2. Find completed task in "Tasks / Subtasks" section
3. Change `- [ ]` to `- [x]`:
   ```markdown
   - [x] **Task 1: Create Component** (AC: 1, 2)
     - [x] Create component file
     - [x] Add TypeScript interfaces
     - [ ] Write unit tests ← Still in progress
   ```
4. Commit changes:
   ```bash
   git add docs/stories/{epic}.{story}.story.md
   git commit -m "docs: update Story {epic}.{story} task checklist"
   ```

**Time:** 1 minute per task

**Tip:** Commit task updates with related code commits:
```bash
git add src/components/MyComponent.tsx docs/stories/4.2.story.md
git commit -m "feat: implement Story 4.2 tempo control component"
```

---

### Developer: Completing a Story

**When:** Story implementation complete, ready for code review

**Steps:**

1. **Update story status:**
   ```markdown
   ## Status
   Ready for Review
   ```

2. **Populate Dev Agent Record** (CRITICAL):

   a. Find implementation commit(s):
   ```bash
   git log --grep="Story {epic}.{story}" --oneline
   ```

   b. Get file list:
   ```bash
   git diff --name-status {commit-hash}^..{commit-hash}
   git show {commit-hash} --stat
   ```

   c. Count lines for created files:
   ```bash
   wc -l src/path/to/NewComponent.tsx
   ```

   d. Fill in Dev Agent Record:
   ```markdown
   ## Dev Agent Record

   ### Agent Model Used
   claude-sonnet-4-5-20250929

   ### Debug Log References
   None - Implementation completed without major debugging sessions

   ### Completion Notes List
   - Created GlobalMusicHeader component with responsive layout (desktop/tablet/mobile)
   - Integrated existing ScaleSelector for key/scale controls
   - Implemented tap tempo functionality with 4-tap averaging
   - Added visual tempo indicator synced with Tone.js Transport
   - Connected to GlobalMusicContext for state persistence
   - Created 15 unit tests covering all acceptance criteria
   - All tests passing (15/15) with 94% code coverage
   - Verified responsive behavior across breakpoints (tested 320px - 1920px)

   ### File List
   **Created:**
   - `src/components/GlobalMusicHeader/GlobalMusicHeader.tsx` - Main component (328 lines)
   - `src/components/GlobalMusicHeader/TempoControl.tsx` - Tempo subcomponent (156 lines)
   - `src/components/GlobalMusicHeader/__tests__/GlobalMusicHeader.test.tsx` - Test suite (412 lines)
   - `src/components/GlobalMusicHeader/index.ts` - Barrel export (3 lines)

   **Modified:**
   - `src/App.tsx` - Added GlobalMusicHeader above Router (8 lines changed)
   - `src/index.css` - Added .tempo-pulse animation (12 lines added)
   ```

3. **Commit documentation:**
   ```bash
   git add docs/stories/{epic}.{story}.story.md
   git commit -m "docs: complete Story {epic}.{story} Dev Agent Record"
   ```

4. **Create Pull Request** with story link in description:
   ```markdown
   ## Story Reference
   Implements [Story {epic}.{story}](../docs/stories/{epic}.{story}.story.md)

   ## Summary
   {Brief description}

   ## Acceptance Criteria
   - [x] AC1: {Criterion 1}
   - [x] AC2: {Criterion 2}
   ```

**Time:** 10-15 minutes

**If git diff insufficient:** Consult dev agent:
```bash
# Use BMad dev agent persona
/BMad:agents:dev
```

---

### Developer: After Story Merged

**When:** PR approved and merged to main

**Steps:**
1. Update story status:
   ```markdown
   ## Status
   COMPLETE
   ```
2. Update story Change Log:
   ```markdown
   | 2025-01-15 | 1.1 | Implementation complete, merged to main | Alice (Dev) |
   ```
3. Commit:
   ```bash
   git checkout main
   git pull
   git add docs/stories/{epic}.{story}.story.md
   git commit -m "docs: mark Story {epic}.{story} COMPLETE"
   git push
   ```

**Time:** 2 minutes

---

## Weekly Workflows

### PM: Story Status Audit

**When:** Every Friday end-of-week

**Steps:**

1. **Find stories marked "In Progress":**
   ```bash
   grep -l "^In Progress$" docs/stories/*.story.md
   ```

2. **For each story, verify:**
   - [ ] Is it actually in progress? (Check git commits this week)
   - [ ] Are tasks checked off?
   - [ ] Is developer blocked?

3. **Update stale statuses:**
   - No commits in 2 weeks → Change to "PAUSED" or "BLOCKED"
   - All tasks done but status not updated → Remind developer

4. **Check for completed stories missing Dev Agent Records:**
   ```bash
   grep -l "^COMPLETE$" docs/stories/*.story.md | while read file; do
     if grep -q "^_To be populated by dev agent_$" "$file"; then
       echo "Missing Dev Agent Record: $file"
     fi
   done
   ```

5. **Report to PO:**
   - X stories in progress
   - Y stories completed this week
   - Z stories missing Dev Agent Records (list)

**Time:** 15-20 minutes

---

### PM: Orphan Commit Detection

**When:** Every Friday end-of-week

**Steps:**

1. **Find feat: commits from this week without story references:**
   ```bash
   git log --since="1 week ago" --grep="^feat:" --oneline | \
     grep -v "Story [0-9]\+\.[0-9]\+" | \
     grep -v "Epic [0-9]\+"
   ```

2. **For each orphan commit:**
   - Identify what was implemented
   - Check if it belongs to an existing story
   - If yes: Update story to reference commit
   - If no: Create retro story (see Monthly Workflows)

3. **Log orphans for monthly review:**
   ```bash
   echo "{commit-hash} - {description}" >> docs/orphan-commits-{YYYY-MM}.txt
   ```

**Time:** 10 minutes

---

### PM: Epic Status Updates

**When:** Every Friday end-of-week (if child stories completed)

**Steps:**

1. **For each epic, check child story statuses:**
   ```bash
   # Example for Epic 4
   grep "^## Status" docs/stories/4.*.story.md
   ```

2. **Update epic status based on child stories:**
   - All stories COMPLETE → Epic status: ✅ COMPLETE
   - 1+ stories In Progress → Epic status: 🚧 IN PROGRESS
   - No stories started → Epic status: 📝 PLANNING

3. **Update epic file:**
   ```markdown
   **Status:** 🚧 **IN PROGRESS** (3 of 7 stories complete)
   ```

4. **Update epic Change Log:**
   ```markdown
   | 2025-01-15 | 1.2 | Stories 4.1-4.3 completed, status updated | Bob (PM) |
   ```

5. **Commit:**
   ```bash
   git add docs/epics/epic-{number}-*.md
   git commit -m "docs: update Epic {number} status (3/7 stories complete)"
   git push
   ```

**Time:** 5 minutes per epic

---

## Monthly Workflows

### PO: Quarterly Epic Review

**When:** First Monday of each month

**Steps:**

1. **Review all active epics** in `docs/epics/index.md`:
   - Epic 1, 4, 5, 6, 9, 11, 12

2. **For each epic:**
   - [ ] Status accurate?
   - [ ] Target completion date still valid?
   - [ ] Priority still correct?
   - [ ] Success metrics achieved (if COMPLETE)?

3. **Update roadmap** in `docs/prd/index.md`:
   - Completed epics this quarter
   - In-progress epics
   - Planned epics for next quarter

4. **Archive completed epics** (optional):
   ```bash
   mkdir -p docs/archive/epics/2025-Q1/
   cp docs/epics/epic-{completed}.md docs/archive/epics/2025-Q1/
   ```

**Time:** 30 minutes

---

### PM: Create Retro Stories for Orphan Features

**When:** First week of each month

**Steps:**

1. **Review orphan commits log:**
   ```bash
   cat docs/orphan-commits-{YYYY-MM}.txt
   ```

2. **For each orphan commit:**

   a. **Create retro story:**
   ```bash
   cp docs/templates/story-template.md docs/stories/{epic}.{story}.{description}.story.md
   ```

   b. **Mark status COMPLETE** (already implemented):
   ```markdown
   ## Status
   COMPLETE (Retro Documentation)
   ```

   c. **Populate from git history:**
   ```bash
   git show {commit-hash} --stat
   git diff {commit-hash}^..{commit-hash}
   ```

   d. **Fill Dev Agent Record** with commit details

   e. **Add note in story:**
   ```markdown
   **Note:** This story was created retroactively to document an implemented feature.
   Commit: {commit-hash} - {commit message}
   ```

3. **Update parent epic** to include retro story

**Time:** 20 minutes per orphan feature

---

### PM: Architecture Documentation Sync

**When:** Last Friday of each month

**Steps:**

1. **Update source tree documentation:**
   ```bash
   # Get current component list
   ls -1 src/components/

   # Compare with docs/architecture/source-tree.md
   diff <(ls -1 src/components/) <(grep "^├── " docs/architecture/source-tree.md | sed 's/├── //' | sed 's|/||')
   ```

2. **Add missing components** to `docs/architecture/source-tree.md`

3. **Update component descriptions** if functionality changed

4. **Update tech stack** in `docs/architecture/tech-stack.md`:
   - New dependencies added this month
   - Version upgrades
   - Deprecated libraries removed

5. **Commit:**
   ```bash
   git add docs/architecture/
   git commit -m "docs: sync architecture docs with source tree (monthly audit)"
   ```

**Time:** 15 minutes

---

## Quarterly Workflows

### PO: Documentation Health Metrics

**When:** End of each quarter (Q1, Q2, Q3, Q4)

**Steps:**

1. **Calculate KPIs** (see documentation-standards.md Section 11.1):

   a. **Story Status Accuracy:**
   ```bash
   # Total stories
   TOTAL=$(ls docs/stories/*.story.md | wc -l)

   # Stories marked COMPLETE with Dev Agent Records
   COMPLETE=$(grep -l "^COMPLETE$" docs/stories/*.story.md | while read file; do
     grep -q "^_To be populated by dev agent_$" "$file" || echo "$file"
   done | wc -l)

   echo "Story Status Accuracy: $COMPLETE / $TOTAL"
   ```

   b. **Docs:Feat Commit Ratio:**
   ```bash
   # Last 3 months
   FEAT=$(git log --since="3 months ago" --grep="^feat:" --oneline | wc -l)
   DOCS=$(git log --since="3 months ago" --grep="^docs:" --oneline | wc -l)

   echo "Docs:Feat Ratio: $DOCS:$FEAT (target: 1:3)"
   ```

   c. **Epic Documentation Coverage:**
   ```bash
   # Count epics in docs/epics/
   ls docs/epics/epic-*.md | wc -l
   ```

2. **Generate Quarterly Report:**
   ```markdown
   # Q1 2025 Documentation Health Report

   ## Metrics
   - Story Status Accuracy: 92% (33/36 complete stories with Dev Agent Records)
   - Dev Agent Record Completion: 92%
   - Docs:Feat Commit Ratio: 1:3.5 (Target: 1:3) ⚠️
   - Epic Documentation Coverage: 100% (7/7 epics documented)
   - Architecture Doc Currency: 2 weeks lag ✅

   ## Action Items
   - [ ] Backfill Dev Agent Records for Stories 2.3, 3.1, 7.2
   - [ ] Increase docs: commits (currently 1:3.5, target 1:3)
   - [ ] Update source-tree.md with 3 new components

   ## Trends
   - Documentation accuracy improved from 76% (Q4 2024) to 92% (Q1 2025)
   - Epic completion rate: 2 epics completed this quarter
   ```

3. **Present to stakeholders**

**Time:** 1 hour

---

## Emergency Workflows

### Developer: Story Blocked

**When:** Cannot proceed with story due to external dependency

**Steps:**

1. **Update story status:**
   ```markdown
   ## Status
   BLOCKED - {Brief reason}
   ```

2. **Add blocker note to story:**
   ```markdown
   ## Blocker Information

   **Blocked On:** {YYYY-MM-DD}
   **Reason:** {Detailed explanation}
   **Dependency:** {What needs to happen to unblock}
   **Impact:** {Business impact of delay}
   **Workaround:** {Possible alternative approach}
   ```

3. **Notify PM and PO immediately** (Slack/email)

4. **Update epic status** if all child stories blocked:
   ```markdown
   **Status:** ⏸️ **PAUSED** (Blocked by {dependency})
   ```

**Time:** 5 minutes

---

### PM: Documentation Crisis (Debt > 20%)

**When:** Weekly audit shows >20% completed stories missing Dev Agent Records

**Steps:**

1. **Declare Documentation Sprint:**
   - Next sprint dedicates 20% velocity to documentation backfill
   - Pause new feature work until backlog cleared

2. **Create Backfill Task List:**
   ```markdown
   # Documentation Backfill Sprint

   ## Stories Missing Dev Agent Records
   - [ ] Story 2.3 (commit: abc123)
   - [ ] Story 3.1 (commit: def456)
   - [ ] Story 7.2 (commit: ghi789)

   ## Orphan Commits to Document
   - [ ] Commit xyz123 - Feature X
   - [ ] Commit uvw456 - Feature Y

   ## Architecture Doc Updates
   - [ ] Add 5 missing components to source-tree.md
   - [ ] Update tech-stack.md with new dependencies
   ```

3. **Assign backfill tasks to developers:**
   - Each developer backfills their own stories
   - PM backfills orphan commits (create retro stories)

4. **Daily standup focus:**
   - Report backfill progress
   - Unblock stuck documentation tasks

5. **Exit criteria:**
   - Dev Agent Record completion > 90%
   - Orphan commit backlog < 5
   - Architecture docs synchronized

**Time:** 2-3 days (team effort)

---

## Tools and Automation

### Recommended Scripts

**1. Story Status Report (`scripts/story-status-report.sh`):**
```bash
#!/bin/bash
echo "=== Story Status Report ==="
echo "Draft: $(grep -l "^Draft$" docs/stories/*.story.md | wc -l)"
echo "In Progress: $(grep -l "^In Progress$" docs/stories/*.story.md | wc -l)"
echo "Ready for Review: $(grep -l "^Ready for Review$" docs/stories/*.story.md | wc -l)"
echo "COMPLETE: $(grep -l "^COMPLETE$" docs/stories/*.story.md | wc -l)"
echo "BLOCKED: $(grep -l "^BLOCKED" docs/stories/*.story.md | wc -l)"
```

**2. Dev Agent Record Checker (`scripts/check-dev-agent-records.sh`):**
```bash
#!/bin/bash
echo "=== Stories Missing Dev Agent Records ==="
grep -l "^COMPLETE$" docs/stories/*.story.md | while read file; do
  if grep -q "^_To be populated by dev agent_$" "$file"; then
    echo "❌ $file"
  else
    echo "✅ $file"
  fi
done
```

**3. Orphan Commit Detector (`scripts/find-orphan-commits.sh`):**
```bash
#!/bin/bash
echo "=== Orphan Commits (Last 30 Days) ==="
git log --since="30 days ago" --grep="^feat:" --oneline | \
  grep -v "Story [0-9]\+\.[0-9]\+" | \
  grep -v "Epic [0-9]\+"
```

**Usage:**
```bash
chmod +x scripts/*.sh
./scripts/story-status-report.sh
```

---

## Best Practices

### Documentation Culture

1. **Write as you code** - Update story tasks during development, not after
2. **Commit docs with code** - Bundle documentation updates with feature commits
3. **Dev Agent Record is mandatory** - No story is complete without it
4. **Weekly audits prevent crises** - 15 minutes/week prevents 2-day backfill sprints
5. **Celebrate documentation wins** - Recognize developers who maintain great docs

### Common Pitfalls to Avoid

❌ **Don't:** Wait until story complete to update docs
✅ **Do:** Update story tasks as you complete them

❌ **Don't:** Skip Dev Agent Record because "git history is enough"
✅ **Do:** Populate Dev Agent Record with context git can't provide

❌ **Don't:** Create stories without linking to parent epic
✅ **Do:** Update epic with new story references

❌ **Don't:** Ignore orphan commits ("I'll document it later")
✅ **Do:** Create retro story immediately or within same week

❌ **Don't:** Let architecture docs fall >1 month behind
✅ **Do:** Update source-tree.md when adding new components

---

## Success Metrics

**Healthy documentation maintenance:**
- ✅ Weekly story audit takes <20 minutes
- ✅ Dev Agent Record completion rate >90%
- ✅ Orphan commits <5 per month
- ✅ Architecture docs <1 month lag
- ✅ No documentation backfill sprints needed

**Signs of documentation debt:**
- ⚠️ Weekly audit takes >30 minutes
- ⚠️ Dev Agent Record completion rate <80%
- ⚠️ Orphan commits >10 per month
- ⚠️ Architecture docs >2 months outdated
- ⚠️ Backfill sprints needed quarterly

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-13 | 1.0 | Initial maintenance guidelines | Sarah (PO) |

---

## Related Documents

- **Documentation Standards:** `docs/templates/documentation-standards.md`
- **Epic Template:** `docs/templates/epic-template.md`
- **Story Template:** `docs/templates/story-template.md`
- **Reconciliation Audit:** `docs/reconciliation-audit.md`

---

**These guidelines are mandatory for all team members. Consistency in documentation maintenance prevents technical debt and ensures project sustainability.**
