# Persona UX Testing

BMAD-integrated UX testing framework for persona-driven visual analysis.

## Overview

This testing framework captures screenshots of persona tutorial flows and enables the QA agent to perform visual UX analysis from each persona's perspective.

## Quick Start

### 1. Install Dependencies

```bash
cd testing/persona-ux
npm install
npx playwright install chromium
```

### 2. Start Dev Server

```bash
# In project root
npm run dev
```

Server should be running at `http://localhost:5173`

### 3. Capture Screenshots

```bash
# Capture Musician tutorial
node capture-flow.js --persona=m

# Capture Educator tutorial
node capture-flow.js --persona=e

# Capture Visual Learner tutorial
node capture-flow.js --persona=v

# Capture Producer tutorial
node capture-flow.js --persona=p
```

### 4. Run QA Agent UX Review

```bash
# In Claude Code or IDE
@qa *ux-review 22.1 --persona=m
```

The QA agent will:
1. Load persona context (goals, frustrations, bailout triggers)
2. Analyze screenshots using UX framework
3. Generate visual critique in persona's voice
4. Create gate file with PASS/CONCERNS/FAIL decision
5. Output recommendations with annotated screenshots

## Directory Structure

```
testing/persona-ux/
├── package.json              # Playwright dependencies
├── capture-flow.js           # Screenshot capture script
├── README.md                 # This file
├── screenshots/              # Raw screenshots by persona
│   ├── m/                    # Musician screenshots
│   ├── e/                    # Educator screenshots
│   ├── v/                    # Visual Learner screenshots
│   └── p/                    # Producer screenshots
├── feedback/                 # Annotated screenshots with issues marked
│   ├── m/                    # Musician feedback
│   ├── e/                    # Educator feedback
│   ├── v/                    # Visual Learner feedback
│   └── p/                    # Producer feedback
└── baseline/                 # Baseline screenshots for before/after comparison
    ├── m/
    ├── e/
    ├── v/
    └── p/
```

## Capture Script Usage

### Basic Usage

```bash
node capture-flow.js --persona=m --url="/?v=m"
```

### Options

- `--persona=m|e|v|p` - Persona code (required)
- `--url=path` - URL path to test (default: `/?v={persona}`)
- `--base=url` - Base URL (default: `http://localhost:5173`)
- `--mobile-only` - Only capture mobile viewport (375px)
- `--desktop-only` - Only capture desktop viewport (1920px)

### Examples

```bash
# Capture only mobile viewport for Musician
node capture-flow.js --persona=m --mobile-only

# Capture custom URL path
node capture-flow.js --persona=e --url="/education"

# Capture from staging server
node capture-flow.js --persona=v --base="https://staging.audiolux.app"
```

## QA Agent Integration

### BMAD Task File

The UX review is powered by `.bmad-core/tasks/ux-persona-review.md`

### Data Files

- `.bmad-core/data/persona-contexts.md` - Detailed persona backgrounds
- `.bmad-core/data/ux-analysis-framework.md` - Visual analysis checklists

### Running UX Review

```bash
# Full review for specific persona
@qa *ux-review {epic}.{story} --persona=m

# Example: Review Epic 22 Story 1 from Musician perspective
@qa *ux-review 22.1 --persona=m
```

### Output Files

**Gate File:** `docs/qa/gates/{epic}.{story}-ux-{persona}.yml`
```yaml
ux_review:
  persona: m
  persona_name: Musician
  score: 65
  gate: CONCERNS
  issues:
    critical: 2
    major: 3
    minor: 5
  top_issues:
    - severity: critical
      category: emotional_response
      description: "Tutorial intimidates non-technical musicians"
      persona_voice: "MIDI? I just want to jam!"
```

**Markdown Report:** `docs/qa/assessments/{epic}.{story}-ux-{persona}-{YYYYMMDD}.md`

Contains:
- Executive summary with UX score
- Screenshot-by-screenshot analysis
- Issue categorization (hierarchy, layout, cognitive, emotional, friction)
- Persona voice quotes throughout
- Before/after comparison (if baseline exists)
- Actionable recommendations

**Annotated Screenshots:** `testing/persona-ux/feedback/{persona}/`

Screenshots marked up with:
- Red boxes for CRITICAL issues
- Orange boxes for MAJOR issues
- Yellow boxes for MINOR issues
- Persona voice callouts
- Specific fix suggestions

## Workflow

### First-Time Review

1. **Capture screenshots** for persona
   ```bash
   node capture-flow.js --persona=m
   ```

2. **Run QA review**
   ```bash
   @qa *ux-review 22.1 --persona=m
   ```

3. **Review findings** in:
   - Gate file (quick status)
   - Markdown report (detailed analysis)
   - Annotated screenshots (visual issues)

4. **Implement fixes** based on recommendations

5. **Capture baseline** (optional - for before/after comparison)
   ```bash
   cp -r screenshots/m/ baseline/m/
   ```

### Re-Review After Fixes

1. **Capture new screenshots** (same persona)
   ```bash
   node capture-flow.js --persona=m
   ```

2. **Run QA review with baseline**
   ```bash
   @qa *ux-review 22.1 --persona=m --baseline
   ```

3. **Compare scores:**
   - Before: 65/100 (CONCERNS)
   - After: 85/100 (PASS)
   - Improvement: +20 points

4. **Verify issues resolved** in markdown report

## Testing All Personas

To test complete persona coverage:

```bash
# Capture all 4 personas
for persona in m e v p; do
  node capture-flow.js --persona=$persona
done

# Review all 4 personas
@qa *ux-review 22.1 --persona=all
```

The QA agent will:
- Run analysis for each persona
- Generate individual gate files
- Create aggregated summary
- Set final gate to worst individual result

## Troubleshooting

### "Error: Browser not found"

```bash
npx playwright install chromium
```

### "Connection refused to localhost:5173"

Start the dev server:
```bash
npm run dev
```

### "Could not find next button"

The capture script looks for these selectors:
- `button:has-text("Next")`
- `button:has-text("Continue")`
- `button:has-text("Start")`
- `[data-testid="next-step"]`

If your buttons use different text/selectors, update `capture-flow.js`:
```javascript
const nextButtonSelectors = [
  'your-custom-selector',
  // ... existing selectors
];
```

### "Screenshots are blank/black"

Add longer wait time in `capture-flow.js`:
```javascript
await page.waitForTimeout(2000); // Increase from 1000
```

## Best Practices

### 1. Capture Frequently

Run captures after any UX changes:
- New tutorial step added
- Layout modifications
- Messaging updates
- Visual design changes

### 2. Use Baselines

Save baseline screenshots after major releases:
```bash
cp -r screenshots/m/ baseline/m-v1.0/
```

### 3. Test All Personas

Each persona sees the UX differently. A PASS for Musician might be a FAIL for Educator.

### 4. Address Critical Issues First

Focus on:
- Emotional Response FAIL (users will leave)
- Persona-specific bailout triggers
- Issues marked CRITICAL by QA agent

### 5. Iterate Quickly

The workflow is fast:
- Capture: 30 seconds
- Review: 2 minutes
- Implement fix: 5-10 minutes
- Re-capture: 30 seconds

Run multiple iteration cycles in a single session.

## Integration with BMAD Workflow

### Creating UX Improvement Stories

After QA review, create brownfield stories:

```bash
@pm *create-brownfield-story

Epic: 22 - AI-Native Product-Led Growth
Story: 22.5 - Fix Musician Tutorial UX Issues

Based on QA UX review findings:
- Critical: Simplify technical language in Step 2
- Major: Increase CTA button size on mobile
- Major: Add visual preview before tutorial starts
```

### Quality Gate Integration

UX reviews integrate with existing gates:

```yaml
# docs/qa/gates/22.1-persona-tutorials.yml
schema: 1
story: '22.1'
gate: CONCERNS

ux_reviews:
  - persona: m
    gate: CONCERNS
    score: 65
    report: docs/qa/assessments/22.1-ux-m-20250125.md

  - persona: e
    gate: PASS
    score: 85
    report: docs/qa/assessments/22.1-ux-e-20250125.md
```

Final gate = worst individual persona gate.

## Advanced Usage

### Custom Screenshot Points

Modify `capture-flow.js` to capture specific screens:

```javascript
// After step 2, capture modal
if (step === 2) {
  await page.click('[data-testid="open-modal"]');
  await captureScreenshot(page, 'step2-modal', viewportName);
}
```

### Multiple Flows

Test different user paths:

```javascript
// Success path
node capture-flow.js --persona=m --url="/?v=m&flow=success"

// Error path
node capture-flow.js --persona=m --url="/?v=m&flow=error"
```

### Headless vs Headed

Run with visible browser for debugging:

```javascript
// In capture-flow.js, change:
const browser = await chromium.launch({ headless: false });
```

## Resources

- **BMAD Task:** `.bmad-core/tasks/ux-persona-review.md`
- **Persona Contexts:** `.bmad-core/data/persona-contexts.md`
- **UX Framework:** `.bmad-core/data/ux-analysis-framework.md`
- **Playwright Docs:** https://playwright.dev/

## Support

For issues with:
- **Capture script:** Check Playwright logs, adjust selectors
- **QA review:** Ensure persona code valid, screenshots exist
- **Gate decisions:** Review markdown report for detailed reasoning

---

**Next Steps:**
1. Run your first capture: `node capture-flow.js --persona=m`
2. Run QA review: `@qa *ux-review 22.1 --persona=m`
3. Review findings and implement improvements
4. Re-capture and verify improvements
