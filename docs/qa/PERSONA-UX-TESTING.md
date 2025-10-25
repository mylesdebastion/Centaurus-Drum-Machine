# Persona-Driven UX Testing with BMAD QA Agent

BMAD extension for visual UX analysis from persona perspectives using Playwright screenshot capture and AI-powered critique.

## Overview

This testing framework extends the BMAD QA agent to evaluate user experience from specific persona viewpoints, catching issues that traditional code review and functional testing miss:

- **Visual hierarchy problems** - What draws attention first?
- **Layout issues** - Alignment, spacing, responsive breakpoints
- **Cognitive load** - Too much text, unclear CTAs, jargon
- **Emotional response** - Intimidating, boring, exciting, confusing
- **Persona-specific friction** - Features not aligned with goals

## Quick Start (5 Minutes)

### 1. One-Time Setup

```bash
cd testing/persona-ux
npm install
npx playwright install chromium
```

### 2. Start Dev Server

```bash
npm run dev  # From project root
```

### 3. Capture Screenshots

```bash
cd testing/persona-ux
node capture-flow.js --persona=m
```

### 4. Run UX Review

```bash
@qa *ux-review 22.1 --persona=m
```

**Output:**
- Gate file: `docs/qa/gates/22.1-ux-m.yml`
- Report: `docs/qa/assessments/22.1-ux-m-20250125.md`
- Annotated screenshots: `testing/persona-ux/feedback/m/`

## How It Works

### 1. Playwright Captures Screenshots

The capture script navigates through the tutorial flow and takes screenshots at each step.

**What it captures:**
- Initial landing/selector screen
- Each tutorial step
- Completion/CTA screen
- **Desktop viewport (1920px)** - Default for regular personas (m, e, v, p)
- **Mobile viewport (375px)** - Only for responsive persona testing

**Note:** Regular persona testing defaults to desktop-only to speed up testing. Use `--mobile-only` flag if needed, or use `persona=responsive` for mobile-specific testing.

### 2. QA Agent Embodies Persona

The QA agent loads persona context from `.bmad-core/data/persona-contexts.md`:

**For Musician (m):**
- Goals: "Quick creative jamming with minimal setup"
- Frustrations: "Setup hell, technical jargon, too many steps"
- Bailout triggers: "Tutorial >5 steps, see 'configuration', need to read paragraphs"
- Language: Music terms YES, tech terms NO

The agent then "becomes" that persona, viewing the UX through their lens.

### 3. Visual Analysis Framework

For each screenshot, the agent evaluates 5 categories using `.bmad-core/data/ux-analysis-framework.md`:

1. **Visual Hierarchy** - Primary CTA obvious? Text flow clear?
2. **Layout & Responsiveness** - Aligned? Spaced? Mobile works?
3. **Cognitive Load** - Scannable? Clear choices? No jargon?
4. **Emotional Response** - Right tone? Builds trust? Engaging?
5. **Persona-Specific Friction** - Supports goals? No bailout triggers?

Each category scored: PASS / CONCERNS / FAIL

### 4. Issue Identification & Scoring

The agent identifies issues with severity:
- **CRITICAL**: Blocks persona goal, triggers bailout (-20 points)
- **MAJOR**: Significant degradation (-10 points)
- **MINOR**: Polish issue (-2 points)

**UX Score:**
```
Base = 100
Final Score = 100 - (20×CRITICAL) - (10×MAJOR) - (2×MINOR)
```

### 5. Gate Decision

```
Score ≥80: PASS
Score 60-79: CONCERNS
Score <60: FAIL

Overrides:
- Emotional Response FAIL → FAIL (engagement critical)
- Cannot complete goal → FAIL
- ≥3 CRITICAL issues → FAIL
```

### 6. Outputs

**Gate File (YAML):**
```yaml
ux_review:
  persona: m
  persona_name: Musician
  score: 65
  gate: CONCERNS
  categories:
    visual_hierarchy: CONCERNS
    layout_responsive: PASS
    cognitive_load: FAIL
    emotional_response: FAIL
    persona_friction: CONCERNS
  top_issues:
    - severity: critical
      category: cognitive_load
      description: "Tutorial uses technical jargon (MIDI, audio buffer)"
      persona_voice: "What's a MIDI device? I just want to jam!"
      screenshot: "testing/persona-ux/feedback/m/20250125-step2-annotated.png"
      suggested_fix: "Replace 'MIDI controller' with 'keyboard or controller (optional)'"
```

**Markdown Report:**
- Executive summary with score
- Screenshot-by-screenshot analysis
- Issue categorization
- Persona voice quotes throughout
- Before/after comparison (if baseline)
- Actionable recommendations

**Annotated Screenshots:**
- Red boxes around CRITICAL issues
- Orange boxes around MAJOR issues
- Yellow boxes around MINOR issues
- Persona voice callouts
- Specific fix suggestions

## Personas

### Musician (m) - 🎵
- **Goal**: Jam with friends in <30 seconds
- **Bailout**: Setup screens, technical jargon, >5 steps
- **Language**: "Jam, beat, loop" YES / "MIDI, buffer, latency" NO
- **Tone**: Casual, excited, action-oriented

### Educator (e) - 📚
- **Goal**: Engage students, teach rhythm/composition
- **Bailout**: Student distractions (chat), account requirements, >2min setup
- **Language**: "Lesson, activity, students" YES / "Jam, friends, game" NO
- **Tone**: Professional, educational, clear

### Visual Learner (v) - 👁️
- **Goal**: Understand music through visual patterns
- **Bailout**: Text-heavy tutorials, no visual feedback, audio-only cues
- **Language**: "Grid, colors, see, watch" YES / "Listen, quarter note" NO
- **Tone**: Visual-first, interactive

### Producer (p) - 🎚️
- **Goal**: Fast idea capture, integrate with DAW
- **Bailout**: Can't export, no controller support, dumbed-down interface
- **Language**: "DAW, MIDI export, workflow" YES / "Easy for beginners" NO
- **Tone**: Technical, professional, efficiency-focused

## Workflow

### First-Time Review

1. **Capture**
   ```bash
   node capture-flow.js --persona=m
   ```

2. **Review**
   ```bash
   @qa *ux-review 22.1 --persona=m
   ```

3. **Analyze**
   - Gate file: Quick status (PASS/CONCERNS/FAIL)
   - Markdown report: Detailed findings
   - Annotated screenshots: Visual evidence

4. **Fix**
   - Address CRITICAL issues first
   - Implement recommendations

5. **Clean up** (after review)
   ```bash
   @qa *ux-cleanup 22.1 --persona=m --keep-baseline
   ```

   This:
   - Moves annotated screenshots to `docs/qa/screenshots/`
   - Saves baseline to `testing/persona-ux/baseline/22.1-m/`
   - Creates `baseline.json` with score and issues
   - Deletes raw screenshots from `testing/persona-ux/screenshots/`

---

## Re-Testing After Fixes

After implementing UX improvements, you have **two testing strategies**:

### Strategy A: Fresh Review (Independent Assessment)

**Use when:** You want an unbiased evaluation of the new UX.

**Steps:**
```bash
# 1. Clean up old test artifacts (no baseline)
@qa *ux-cleanup 22.1 --persona=m
# Deletes screenshots, moves annotated to docs/

# 2. Implement fixes
# ... code changes ...

# 3. Re-capture screenshots
cd testing/persona-ux
node capture-flow.js --persona=m
# Creates: adhoc-m-step1-desktop-20251026-0915.png (new timestamp)

# 4. Fresh review (no comparison)
@qa *ux-review 22.1 --persona=m
# Agent analyzes as if seeing UX for first time
# Outputs new gate and report
```

**Result:** New independent score, no explicit comparison to previous review.

**Best for:**
- Major redesigns
- Testing if agent naturally finds fewer issues
- Avoiding bias from previous findings

---

### Strategy B: Before/After Comparison (Improvement Validation)

**Use when:** You want to validate specific fixes and see score delta.

**Steps:**
```bash
# 1. Save baseline after first review
@qa *ux-cleanup 22.1 --persona=m --keep-baseline
# Saves screenshots + baseline.json to testing/persona-ux/baseline/22.1-m/
# baseline.json contains: score, gate, issues, categories

# 2. Implement fixes
# ... code changes ...

# 3. Re-capture screenshots
cd testing/persona-ux
node capture-flow.js --persona=m
# Creates new screenshots with new timestamp

# 4. Comparison review
@qa *ux-review 22.1 --persona=m --baseline
# Agent loads baseline.json + baseline screenshots
# Compares old vs new side-by-side
# Outputs comparison report with:
#   - Score delta (72 → 90 = +18)
#   - Issues resolved ✅
#   - Issues persisting ⚠️
#   - New issues introduced ❌
```

**Result:** Explicit before/after comparison showing improvements and regressions.

**Best for:**
- Validating that critical issues were fixed
- Quantifying improvement (for PRs/reports)
- Catching regressions introduced by fixes

---

### Comparison Report Example

When using `--baseline`, the report includes:

```markdown
## Before/After Comparison

**Previous Review:** 2025-10-25 | 72/100 | CONCERNS
**Current Review:** 2025-10-26 | 90/100 | PASS
**Change:** +18 points (CONCERNS → PASS)

### Issues Resolved ✅

#### 1. Text Wall Before Action (Step 2) - FIXED
- **Baseline:** 3-paragraph explanation before user takes action
- **Current:** Step removed entirely, user goes straight to interaction
- **Impact:** Saved 10s, eliminated cognitive load

### New Issues Introduced ❌

#### 1. Auto-Advance Too Fast - REGRESSION
- **Severity:** MAJOR
- **Description:** Interactive step auto-advances after 2 seconds
- **Persona Voice:** "Wait, I didn't even get to click!"
- **Fix:** Replace timer with "Continue" button
```

---

### Screenshot Management (Re-Testing)

**Timestamps prevent overwrites:**
- First test: `adhoc-m-step1-desktop-20251025-1430.png`
- Same-day re-test: `adhoc-m-step1-desktop-20251025-1615.png` (different time)
- Next-day re-test: `adhoc-m-step1-desktop-20251026-0915.png` (different date)

**Multiple captures accumulate:**
```
testing/persona-ux/screenshots/22.1-m/
  adhoc-m-step1-desktop-20251025-1430.png  (first capture)
  adhoc-m-step1-desktop-20251025-1615.png  (second capture, same day)
  adhoc-m-step1-desktop-20251026-0915.png  (third capture, next day)
```

**Clean up between tests:**
- Use `*ux-cleanup` to delete old screenshots before re-testing
- Or keep baseline for comparison with `--keep-baseline`
- Agent analyzes newest screenshots (latest timestamp) by default

---

### Decision Tree: Which Strategy?

```
After implementing fixes, ask:

┌─ "Do I want explicit comparison to previous review?"
│
├─ YES → Strategy B (Baseline Comparison)
│  └─ Use: *ux-cleanup --keep-baseline → *ux-review --baseline
│
└─ NO → Strategy A (Fresh Review)
   └─ Use: *ux-cleanup → *ux-review
```

### Testing All Personas

```bash
# Capture all
for persona in m e v p; do
  node capture-flow.js --persona=$persona
done

# Review all
@qa *ux-review 22.1 --persona=all
```

Final gate = worst individual persona result

## Integration with BMAD

### Creating Improvement Stories

```bash
@pm *create-brownfield-story

Epic: 22 - AI-Native Product-Led Growth
Story: 22.5 - Fix Musician Tutorial UX Issues

Based on QA UX review (docs/qa/assessments/22.1-ux-m-20250125.md):
- [CRITICAL] Simplify technical language in Step 2
- [MAJOR] Increase CTA button size on mobile (38px → 48px)
- [MAJOR] Add visual preview before tutorial starts
```

### Quality Gate Integration

```yaml
# docs/qa/gates/22.1-persona-tutorials.yml
story: '22.1'
gate: CONCERNS  # Set to worst persona gate

ux_reviews:
  - persona: m
    gate: CONCERNS
    score: 65

  - persona: e
    gate: PASS
    score: 85

  - persona: v
    gate: FAIL
    score: 45

  - persona: p
    gate: PASS
    score: 80

final_gate: FAIL  # v failed, so overall fails
must_fix_before_launch:
  - "Fix Visual Learner critical issues (no visual feedback)"
```

## Example Output

### Gate File

```yaml
schema: 1
story: '22.1'
gate: CONCERNS
status_reason: 'Musician tutorial has cognitive load and emotional response issues'
reviewer: 'Quinn (Test Architect) - Musician Persona'
updated: '2025-01-25T10:30:00Z'

ux_review:
  persona: m
  persona_name: Musician
  score: 65
  screenshots_analyzed: 8
  issues:
    critical: 2
    major: 3
    minor: 5
  categories:
    visual_hierarchy: CONCERNS
    layout_responsive: PASS
    cognitive_load: FAIL
    emotional_response: FAIL
    persona_friction: CONCERNS
  top_issues:
    - severity: critical
      category: cognitive_load
      description: "Step 2 uses unexplained technical jargon"
      screenshot: "testing/persona-ux/feedback/m/20250125-step2-desktop-annotated.png"
      persona_voice: "MIDI controller? Audio buffer? I have no idea what this means!"
      suggested_fix: "Replace with: 'Connect your keyboard (optional - mouse works too!)'"
      refs: ['src/components/Onboarding/tutorials/MusicianTutorial.tsx:45']

    - severity: critical
      category: emotional_response
      description: "Tutorial feels overwhelming and technical"
      screenshot: "testing/persona-ux/feedback/m/20250125-step2-desktop-annotated.png"
      persona_voice: "This looks complicated. Maybe this isn't for me..."
      suggested_fix: "Add visual demo/preview, reduce text by 50%"
      refs: ['src/components/Onboarding/tutorials/MusicianTutorial.tsx']

  recommendations:
    immediate:
      - action: "Simplify Step 2 language - remove all technical terms"
        refs: ['MusicianTutorial.tsx:45']
      - action: "Increase mobile CTA size to 48px minimum"
        refs: ['PersonaSelector.tsx:76']
    future:
      - action: "Add 10-second video demo before tutorial"
      - action: "Consider skipping tutorial for quick start option"
```

### Markdown Report Excerpt

```markdown
## Screenshot 2: Step 2 - Equipment Setup (Desktop)

**First Impression (Musician):** "Wait, what? MIDI controller? Audio buffer size? I thought this was for jamming, not audio engineering!"

### Visual Hierarchy: CONCERNS
- Primary CTA ("Next") is visible but...
- Text wall dominates attention (bad)
- Technical terms in bold (scares non-tech users)

### Cognitive Load: FAIL ❌
- Paragraph 6 sentences long (max 2-3)
- Technical jargon unexplained: "MIDI controller", "audio buffer", "sample rate"
- Assumes knowledge Musician doesn't have
- **CRITICAL Issue**: Musician bailout trigger HIT ("configuration" mentioned)

**Persona Voice:** "I don't know what half of this means. Do I need to buy equipment? This is too complicated - I'm just gonna close this and try something else."

### Emotional Response: FAIL ❌
- Tone feels technical/intimidating (not casual/fun)
- Creates anxiety ("Am I missing something?")
- No excitement/anticipation
- **CRITICAL Issue**: Destroys trust ("Maybe this isn't for me")

**Annotated Screenshot:** [Link to marked-up image with red boxes around jargon]

### Suggested Fix (Immediate):

**Current Text:**
> "To get the best audio experience, connect your MIDI controller and configure your audio buffer size to 128 samples for optimal latency."

**Proposed Text:**
> "🎹 Got a keyboard or controller? Plug it in! (Or just use your computer keyboard - works great!)"

**Why:** Removes jargon, makes gear optional, uses emojis for casual tone, reassures it works without equipment.
```

## Best Practices

1. **Capture frequently** - After any UX changes
2. **Use baselines** - Track improvements over time
3. **Test all personas** - Each sees UX differently
4. **Address CRITICAL first** - Emotional Response/Friction fails
5. **Iterate quickly** - Capture → Review → Fix → Re-capture (10 min cycle)

## Troubleshooting

See `testing/persona-ux/README.md` for detailed troubleshooting.

## Files

**BMAD Extensions:**
- `.bmad-core/tasks/ux-persona-review.md` - Task definition
- `.bmad-core/data/persona-contexts.md` - Persona backgrounds
- `.bmad-core/data/ux-analysis-framework.md` - Evaluation criteria
- `.bmad-core/agents/qa.md` - Updated with *ux-review command

**Testing Infrastructure:**
- `testing/persona-ux/capture-flow.js` - Playwright capture script
- `testing/persona-ux/package.json` - Dependencies
- `testing/persona-ux/README.md` - Detailed usage guide

**Output Locations:**
- `docs/qa/gates/{epic}.{story}-ux-{persona}.yml` - Gate files
- `docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md` - Reports
- `testing/persona-ux/screenshots/{persona}/` - Raw screenshots
- `testing/persona-ux/feedback/{persona}/` - Annotated screenshots

---

**Ready to test?**

```bash
cd testing/persona-ux
npm install
npx playwright install chromium
node capture-flow.js --persona=m
# Then in IDE: @qa *ux-review 22.1 --persona=m
```
