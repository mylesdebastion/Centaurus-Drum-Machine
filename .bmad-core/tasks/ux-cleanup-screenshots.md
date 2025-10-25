<!-- Powered by BMAD™ Core -->

# ux-cleanup-screenshots

Clean up screenshot artifacts after UX review completion, keeping only documentation-worthy annotated screenshots and baselines.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "22.1"
  - persona_code: 'm|e|v|p' # Which persona's screenshots to clean
optional:
  - keep_annotated: true # Move annotated screenshots to docs/qa/screenshots/
  - keep_baseline: false # Save current screenshots as baseline for next review
  - yolo_mode: false # Skip confirmation prompts
```

## Purpose

Screenshots are test artifacts (binary files) that shouldn't bloat the repository. This task:
- Preserves annotated screenshots with documentation value
- Optionally creates baseline for before/after comparison
- Removes intermediate raw screenshots
- Keeps repo clean while maintaining traceability

## Prerequisites

- UX review completed (`@qa *ux-review {story} --persona={code}`)
- Gate file created with screenshot references
- Markdown report generated

## Cleanup Strategy

### What to Keep

**1. Annotated Screenshots** (have documentation value)
- Location: `testing/persona-ux/feedback/{story}-{persona}/`
- These have issue markup (red/orange/yellow boxes)
- Referenced in gate files and markdown reports
- **Action**: Move to `docs/qa/screenshots/{story}-{persona}/`

**2. Baseline Screenshots** (optional - for before/after)
- Location: `testing/persona-ux/baseline/{story}-{persona}/`
- Used for comparison in future reviews
- **Action**: Keep if requested, otherwise delete old baselines

### What to Delete

**1. Raw Screenshots** (temporary test artifacts)
- Location: `testing/persona-ux/screenshots/{story}-{persona}/`
- These are source images for annotation
- No longer needed after annotated versions created
- **Action**: Delete entire directory

**2. Old Baselines** (if creating new one)
- Previous baseline for same story/persona
- **Action**: Replace with current screenshots if keep_baseline=true

## Process

### Step 1: Verify Prerequisites

Check that UX review completed:
- [ ] Gate file exists: `docs/qa/gates/{epic}.{story}-ux-{persona}.yml`
- [ ] Report exists: `docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md`
- [ ] Annotated screenshots exist: `testing/persona-ux/feedback/{story}-{persona}/`

If any missing, warn user and abort cleanup.

### Step 2: Confirmation Prompt (unless yolo_mode)

```
🧹 Screenshot Cleanup for Story {story} - {persona_name}

Current artifacts:
  Raw screenshots: testing/persona-ux/screenshots/{story}-{persona}/
    Count: X files (Y MB)

  Annotated screenshots: testing/persona-ux/feedback/{story}-{persona}/
    Count: Z files (W MB)
    These will be moved to: docs/qa/screenshots/{story}-{persona}/

Actions:
  ✓ Move annotated screenshots to docs/qa/screenshots/
  ✓ Delete raw screenshots from testing/persona-ux/screenshots/
  {if keep_baseline}
  ✓ Save current screenshots as baseline
  {endif}

Continue? (Y/n)
```

If user says no, abort cleanup.

### Step 3: Move Annotated Screenshots

**Create destination directory:**
```bash
mkdir -p docs/qa/screenshots/{story}-{persona}
```

**Move annotated images:**
```bash
mv testing/persona-ux/feedback/{story}-{persona}/*.png \
   docs/qa/screenshots/{story}-{persona}/
```

**Update gate file screenshot references** (if paths changed):
```yaml
# Before:
screenshot: 'testing/persona-ux/feedback/{story}-{persona}/...'

# After:
screenshot: 'docs/qa/screenshots/{story}-{persona}/...'
```

**Update markdown report screenshot references** similarly.

### Step 4: Create Baseline (if requested)

If `keep_baseline=true`:

**Create baseline directory:**
```bash
mkdir -p testing/persona-ux/baseline/{story}-{persona}
```

**Copy current screenshots:**
```bash
cp testing/persona-ux/screenshots/{story}-{persona}/*.png \
   testing/persona-ux/baseline/{story}-{persona}/
```

**Create baseline metadata:**

Extract from completed gate file (`docs/qa/gates/{epic}.{story}-ux-{persona}.yml`):

```json
{
  "story": "{story}",
  "persona": "{persona}",
  "date": "{ISO-8601 with time}",
  "timestamp": "{YYYYMMDD-HHMM}",
  "ux_score": 72,
  "gate": "PASS|CONCERNS|FAIL",
  "issues": {
    "critical": 3,
    "major": 2,
    "minor": 3
  },
  "categories": {
    "visual_hierarchy": "PASS|CONCERNS|FAIL",
    "layout_responsive": "PASS|CONCERNS|FAIL",
    "cognitive_load": "PASS|CONCERNS|FAIL",
    "emotional_response": "PASS|CONCERNS|FAIL",
    "persona_friction": "PASS|CONCERNS|FAIL"
  },
  "top_issues": [
    {
      "severity": "critical|major|minor",
      "category": "category_name",
      "description": "Brief issue description"
    }
  ],
  "note": "Baseline for before/after comparison"
}
```

**Source data from:**
- `ux_score`: From gate YAML `ux_review.score`
- `gate`: From gate YAML `gate` field
- `issues`: Count from gate YAML `ux_review.issues`
- `categories`: From gate YAML `ux_review.categories`
- `top_issues`: From gate YAML `ux_review.top_issues` (first 3-5 critical/major)

Save to: `testing/persona-ux/baseline/{story}-{persona}/baseline.json`

### Step 5: Delete Raw Screenshots

**Remove screenshot directory:**
```bash
rm -rf testing/persona-ux/screenshots/{story}-{persona}
```

**Remove feedback directory** (now empty after move):
```bash
rm -rf testing/persona-ux/feedback/{story}-{persona}
```

### Step 6: Summary Report

```
✅ Screenshot Cleanup Complete

Preserved:
  ✓ Annotated screenshots: docs/qa/screenshots/{story}-{persona}/ (Z files)
  {if baseline}
  ✓ Baseline saved: testing/persona-ux/baseline/{story}-{persona}/ (X files)
  {endif}

Cleaned:
  ✓ Deleted raw screenshots (freed Y MB)
  ✓ Removed temporary feedback directory

Gate file references updated: docs/qa/gates/{epic}.{story}-ux-{persona}.yml
Report references updated: docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md

Next review will compare against baseline: testing/persona-ux/baseline/{story}-{persona}/
```

## Batch Cleanup (All Personas)

If cleaning up after reviewing all 4 personas:

```bash
@qa *ux-cleanup {story} --all-personas
```

This runs cleanup for m, e, v, p sequentially.

## Cleanup Policy

### Recommended Schedule

**After each UX review:**
- Keep annotated screenshots (move to docs/)
- Delete raw screenshots
- Create baseline if first review OR major changes

**Weekly/monthly maintenance:**
- Review old baselines (>30 days)
- Archive to external storage if needed
- Keep only latest baseline per story/persona

### Storage Guidelines

**In Repository (tracked by git):**
- Annotated screenshots in docs/qa/screenshots/
- Small, documentation-critical images only
- Max 5 images per story/persona recommended

**Outside Repository (gitignored):**
- All raw screenshots (testing/persona-ux/screenshots/)
- All baselines (testing/persona-ux/baseline/)
- These are test artifacts, not source code

### External Archival (Optional)

For long-term storage:

```bash
# Archive to S3, Google Cloud Storage, etc.
tar -czf {story}-{persona}-screenshots-{date}.tar.gz \
  testing/persona-ux/screenshots/{story}-{persona}

# Upload to cloud storage
aws s3 cp {story}-{persona}-screenshots-{date}.tar.gz \
  s3://audiolux-qa-archives/screenshots/

# Delete local copies
rm -rf testing/persona-ux/screenshots/{story}-{persona}
```

## Integration with UX Review Task

The ux-persona-review task should automatically offer cleanup at completion:

```
✅ UX Review Complete

Gate: CONCERNS (65/100)
Report: docs/qa/assessments/22.1-ux-m-20250125.md
Screenshots: testing/persona-ux/screenshots/22.1-m/

Clean up screenshots? (Y/n) [Move annotated to docs/, delete raw]
Create baseline for next review? (y/N)
```

If user confirms, automatically run this cleanup task.

## YOLO Mode Behavior

When `*yolo` flag is active:
- Skip all confirmation prompts
- Automatically move annotated screenshots
- Automatically delete raw screenshots
- DO NOT create baseline (unless explicitly requested with --keep-baseline)
- Log actions but don't pause for approval

## Troubleshooting

### "Gate file not found"

Cleanup aborted - complete UX review first:
```bash
@qa *ux-review {story} --persona={code}
```

### "Annotated screenshots missing"

Review didn't create annotated images. Check:
- Did review complete successfully?
- Check: `testing/persona-ux/feedback/{story}-{persona}/`

### "Can't delete screenshots - permission denied"

Screenshots may be open in image viewer. Close applications and retry.

### "Baseline already exists"

Use `--force` to overwrite existing baseline:
```bash
@qa *ux-cleanup {story} --persona={code} --keep-baseline --force
```

## Key Principles

- **Keep docs, delete artifacts** - Annotated screenshots have value, raw don't
- **Traceability** - Gate files and reports reference preserved screenshots
- **Lightweight repo** - Binary files shouldn't bloat git history
- **Baseline strategy** - Only keep baseline if doing before/after analysis
- **Confirmation required** - Unless yolo mode, always confirm deletions
- **Atomic operations** - Move before delete (don't lose data if move fails)

## Completion

After cleanup:
1. Verify annotated screenshots in docs/qa/screenshots/
2. Verify gate file references updated
3. Verify raw screenshots deleted
4. Verify baseline created (if requested)
5. Log cleanup summary
