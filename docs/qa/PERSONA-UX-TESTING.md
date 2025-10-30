# Persona-Driven UX Testing with BMAD QA Agent

BMAD extension for visual UX analysis from persona perspectives using MCP Playwright browser automation and AI-powered critique.

**NEW: MCP Playwright Integration** - Direct browser control via Model Context Protocol enables:
- Live browser interaction (click, type, navigate)
- Accessibility snapshots (DOM structure, semantic HTML)
- Console log monitoring (JavaScript errors, warnings)
- Network request inspection (API calls, failures)
- No external scripts required

## Overview

This testing framework extends the BMAD QA agent to evaluate user experience from specific persona viewpoints, catching issues that traditional code review and functional testing miss:

- **Visual hierarchy problems** - What draws attention first?
- **Layout issues** - Alignment, spacing, responsive breakpoints
- **Cognitive load** - Too much text, unclear CTAs, jargon
- **Emotional response** - Intimidating, boring, exciting, confusing
- **Persona-specific friction** - Features not aligned with goals

## Quick Start (2 Minutes)

### 1. One-Time Setup

**MCP Playwright Server** (already configured in `.mcp.json`):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

No additional installation required - Claude Code loads MCP servers automatically.

### 2. Start Dev Server

```bash
npm run dev  # From project root
```

### 3. Run UX Review (MCP handles browser automation)

```bash
@qa *ux-review 22.1 --persona=m --url="/?v=m"
```

**What happens:**
1. QA agent uses MCP Playwright to:
   - Navigate to `http://localhost:5173/?v=m`
   - Resize viewport (1920x1080 for desktop)
   - Capture accessibility snapshots (DOM structure)
   - Take visual screenshots (evidence)
   - Monitor browser console (errors/warnings)
   - Click through tutorial flow
2. Agent embodies Musician persona and analyzes UX
3. Generates gate file, report, and annotated screenshots

**Output:**
- Gate file: `docs/qa/gates/22.1-ux-m.yml`
- Report: `docs/qa/assessments/22.1-ux-m-20250125.md`
- Annotated screenshots: `testing/persona-ux/feedback/m/`
- Console log analysis (JavaScript errors/warnings)

## How It Works

### 1. MCP Playwright Browser Automation (NEW)

QA agent uses MCP Playwright commands to control browser directly - no external scripts needed.

**MCP Commands Used:**
- `browser_navigate` - Navigate to test URL (e.g., `/?v=m`)
- `browser_resize` - Set viewport (1920x1080 desktop, 375x667 mobile)
- `browser_snapshot` - Capture accessibility tree (DOM structure, ARIA, semantic HTML)
- `browser_take_screenshot` - Visual evidence capture (PNG images)
- `browser_console_messages` - Monitor JavaScript errors/warnings
- `browser_click` - Navigate through tutorial steps
- `browser_wait_for` - Wait for animations/state changes

**What it captures:**
- **Accessibility snapshots** - DOM structure, form labels, button dimensions
- **Visual screenshots** - Initial landing, each tutorial step, completion screen
- **Console logs** - JavaScript errors, React warnings, network failures
- **Desktop viewport (1920px)** - Default for regular personas (m, e, v, p)
- **Mobile viewport (375px)** - For responsive testing (use `ux-responsive-layout-test`)

**Key Benefit:** All browser automation happens within Claude Code workflow - no separate scripts to run.

### 2. QA Agent Embodies Persona

The QA agent loads persona context from `.bmad-core/data/persona-contexts.md`:

**For Musician (m):**
- Goals: "Quick creative jamming with minimal setup"
- Frustrations: "Setup hell, technical jargon, too many steps"
- Bailout triggers: "Tutorial >5 steps, see 'configuration', need to read paragraphs"
- Language: Music terms YES, tech terms NO

The agent then "becomes" that persona, viewing the UX through their lens.

### 3. Visual Analysis Framework (Enhanced with MCP Data)

For each screenshot and accessibility snapshot, the agent evaluates 5 categories using `.bmad-core/data/ux-analysis-framework.md`:

**NEW: Browser Console Analysis**
- JavaScript errors (red flags for code quality)
- React warnings (hydration issues, deprecated APIs)
- Performance warnings (large bundles, slow renders)
- Network errors (failed API calls)

**NEW: Accessibility Snapshot Analysis**
- Semantic HTML structure (heading hierarchy)
- Form label associations (aria-labelledby, for attributes)
- Button/link accessibility (role, aria-label, name)
- Touch target sizes (computed dimensions from DOM)
- Keyboard navigation order (tab index analysis)

**Visual Analysis Categories:**
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

### First-Time Review (MCP Playwright)

1. **Start Dev Server**
   ```bash
   npm run dev  # Ensure localhost:5173 is running
   ```

2. **Run UX Review** (MCP handles browser automation)
   ```bash
   @qa *ux-review 22.1 --persona=m --url="/?v=m"
   ```

   **Behind the scenes:**
   - QA agent uses MCP Playwright to navigate browser
   - Captures accessibility snapshots + visual screenshots
   - Monitors console for errors/warnings
   - Clicks through tutorial flow
   - Analyzes UX from Musician persona perspective

3. **Analyze Outputs**
   - Gate file: Quick status (PASS/CONCERNS/FAIL)
   - Markdown report: Detailed findings + console log analysis
   - Annotated screenshots: Visual evidence
   - Accessibility findings: DOM structure issues

4. **Fix**
   - Address CRITICAL issues first (console errors, UX blockers)
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

# 3. Fresh review (MCP handles browser automation)
@qa *ux-review 22.1 --persona=m --url="/?v=m"
# MCP Playwright navigates browser, captures new screenshots
# Agent analyzes as if seeing UX for first time
# Outputs new gate and report with new timestamp
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
# baseline.json contains: score, gate, issues, categories, console errors

# 2. Implement fixes
# ... code changes ...

# 3. Comparison review (MCP handles browser automation)
@qa *ux-review 22.1 --persona=m --url="/?v=m" --baseline
# MCP Playwright captures new screenshots
# Agent loads baseline.json + baseline screenshots
# Compares old vs new side-by-side
# Outputs comparison report with:
#   - Score delta (72 → 90 = +18)
#   - Issues resolved ✅
#   - Issues persisting ⚠️
#   - New issues introduced ❌
#   - Console errors fixed/introduced
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
# Review all personas (MCP handles automation for each)
@qa *ux-review 22.1 --persona=all --url="/?v={persona}"
# Runs review for m, e, v, p sequentially
# Generates individual reports + aggregate gate
```

Final gate = worst individual persona result

---

## Testing Types (MCP Playwright)

### 1. UX Persona Review (`ux-persona-review.md`)
**Focus:** Visual hierarchy, cognitive load, emotional response from persona perspective
**Viewport:** Desktop (1920x1080) - Default for m/e/v/p personas
**Tools:** `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`
**Command:** `@qa *ux-review 22.1 --persona=m --url="/?v=m"`

### 2. Responsive Layout Test (`ux-responsive-layout-test.md`)
**Focus:** Mobile breakpoints, touch targets, layout reflow
**Viewport:** Mobile (320px, 375px, 768px)
**Tools:** `browser_resize`, `browser_snapshot` (touch target measurement)
**Command:** `@qa *ux-responsive 22.1 --url="/?v=m"`

### 3. Interactive Review (NEW - `ux-interactive-review.md`)
**Focus:** Click interactions, form behavior, keyboard navigation, error handling
**Viewport:** Desktop or Mobile
**Tools:** `browser_click`, `browser_type`, `browser_fill_form`, `browser_press_key`, `browser_network_requests`
**Command:** `@qa *ux-interactive 22.1 --url="/?v=m" --scenarios="click drums, change tempo"`

**Use Interactive Review when:**
- Testing button clicks, drum pad interactions
- Validating form inputs (BPM, pattern name)
- Testing keyboard shortcuts (Space = play/pause)
- Monitoring network calls (save pattern, load preset)
- Checking error handling (invalid BPM input)

---

## Solution Discovery Workflow

**Purpose**: Prevent reinventing the wheel by discovering existing components that can solve UX issues BEFORE creating new feature stories.

### When to Use

Run `*ux-discover` **after** UX assessment identifies issues and **before** PM creates improvement stories.

**The Problem**: Teams often rush to create stories for new features without checking if solutions already exist in the codebase.

**The Solution**: Intelligent discovery workflow that:
1. Analyzes UX assessment to extract issue keywords
2. Uses Playwright to explore `/playground` and key routes
3. Discovers existing components/features via DOM inspection
4. AI matches discovered features to persona issues
5. Categorizes solutions: **Integrate Existing** vs **Build New**

**The Value**:
- Save 50-80% development time (integration << new development)
- Discover brownfield assets (features built but not surfaced in tutorials)
- Inform PO/Architect decisions (technical feasibility, effort estimates)
- Prevent duplicate functionality

---

### Quick Start: Solution Discovery

**1. Complete UX Assessment First**
```bash
# Capture screenshots
node capture-flow.js --persona=e

# Run UX review
@qa *ux-review 22.1 --persona=e
# Outputs: gate file + assessment report
```

**2. Run Solution Discovery**
```bash
@qa *ux-discover 22.1 --persona=e
```

This executes:
- Runs `testing/persona-ux/discover-solutions.js` Playwright script
- Auto-extracts issue keywords from assessment report
- Navigates `/playground` to discover existing features
- Matches features to issues with confidence scoring
- Outputs discovery report JSON + screenshots

**3. Collaborative Review (QA + PO + Architect)**

**CRITICAL**: This is a decision point - DO NOT proceed to stories without review.

For each high-confidence match:
- **QA (Quinn)**: Presents discovery findings, UX requirements
- **PO**: Evaluates business value, integration strategy
- **Architect**: Assesses technical feasibility, effort estimates
- **Decision**: ✅ INTEGRATE or 🆕 BUILD NEW

**4. PM Creates Stories**

PM uses solution report to create stories informed by discovery:
- **Integration stories**: "Integrate Chord Arranger into Educator tutorial" (6 hours)
- **New feature stories**: "Create pricing section component" (1 hour)

---

### Solution Categorization

**✅ High Confidence (≥75%)**: Existing feature clearly matches issue
- Action: Recommend integration
- Effort: Low (component reuse)
- Example: "No visual learning demo" → Chord Arranger found at `/playground` (75% match)

**⚠️ Medium Confidence (50-74%)**: Feature partially matches
- Action: Requires PO/Architect review
- Effort: Medium (may need adaptation)

**❌ Low Confidence (<50%)** or **No Match**: No existing solution
- Action: New feature development needed
- Effort: High (build from scratch)
- Example: "No pricing information" → No pricing component found → Build new

---

### Discovery Output

**Discovery Report JSON**: `testing/persona-ux/discovery/{story}-{persona}/discovery-report.json`

```json
{
  "solutions": {
    "existing": [
      {
        "issue": "visual learning",
        "existingFeature": "Chord Arranger",
        "location": "/playground",
        "confidence": "75%",
        "recommendation": "Consider integrating Chord Arranger into Educator tutorial"
      }
    ],
    "newFeaturesNeeded": [
      {
        "issue": "pricing",
        "status": "No existing solution found",
        "recommendation": "New feature development required"
      }
    ]
  }
}
```

**Solution Report Markdown**: `docs/qa/discovery/{story}-{persona}-solutions-{date}.md`

Human-readable report with:
- Executive summary (issues analyzed, solutions found, effort estimates)
- Solution mapping (for each issue, show existing solution or new feature required)
- Integration plan (approach, changes needed, effort, risk)
- PO decisions (✅ INTEGRATE or 🆕 BUILD NEW)
- Summary by category (integration vs new development)
- ROI calculation (time saved by integration)

**Screenshots**: `testing/persona-ux/discovery/{story}-{persona}/screenshots/`
- Route overviews (`route-playground-{date}.png`)
- Feature captures as needed

---

### Complete Workflow Example

```bash
# 1. Complete UX assessment
@qa *ux-review 22.1 --persona=e
# Output: docs/qa/assessments/22.1-ux-educator-20251025.md
# Score: 68/100 (CONCERNS)
# Issues: No visual learning demo, missing accessibility, no pricing

# 2. Run solution discovery
@qa *ux-discover 22.1 --persona=e
# Playwright navigates /playground
# Discovers: Chord Arranger, Frequency Visualizer
# Matches: "visual learning" → Chord Arranger (75% confidence)
# No match: "pricing" → Build new

# 3. Collaborative review (in meeting or async)
# QA: "Found Chord Arranger at /playground - 75% match for visual learning issue"
# Architect: "Component has embeddedMode prop, can integrate in 6 hours"
# PO: "✅ Approve integration - faster than building new"

# 4. PM creates stories
@pm *create-brownfield-story
# Story 22.8 Task 1: Integrate Chord Arranger (6h) ✅
# Story 22.8 Task 3: Create pricing section (1h) 🆕
# Total effort: 7h (vs 15h if building both new)
```

---

### Troubleshooting Discovery

**"No features discovered at /playground"**
- Verify `/playground` route exists: `curl http://localhost:5173/playground`
- Check if dev server is running
- Try alternative routes: `/, /studio`

**"Low confidence matches only"**
- Review screenshots manually (visual inspection)
- Add manual keywords: `--issues="visual,interactive,color-coded"`
- Expand discovery routes: `--routes="/playground,/studio,/modules"`

**"Feature exists but not discovered"**
- Feature may be hidden, modal, or require interaction
- Manual review of `/playground` in browser
- Update discover-solutions.js to add navigation steps

---

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

**MCP Configuration:**
- `.mcp.json` - Playwright MCP server configuration

**BMAD Extensions:**
- `.bmad-core/tasks/ux-persona-review.md` - UX review task (MCP Playwright)
- `.bmad-core/tasks/ux-responsive-layout-test.md` - Mobile responsive testing (MCP Playwright)
- `.bmad-core/tasks/ux-interactive-review.md` - NEW: Interactive behavior testing (MCP Playwright)
- `.bmad-core/tasks/ux-solution-discovery.md` - Solution discovery task
- `.bmad-core/data/persona-contexts.md` - Persona backgrounds
- `.bmad-core/data/ux-analysis-framework.md` - Evaluation criteria
- `.bmad-core/agents/qa.md` - Updated with *ux-review, *ux-responsive, *ux-interactive, *ux-discover commands

**Testing Infrastructure (Legacy - Use MCP Playwright instead):**
- `testing/persona-ux/capture-flow.js` - Node.js Playwright script (DEPRECATED - use MCP commands)
- `testing/persona-ux/discover-solutions.js` - Feature discovery script
- `testing/persona-ux/package.json` - Dependencies (only needed for legacy scripts)
- `testing/persona-ux/README.md` - Detailed usage guide

**Output Locations:**
- `docs/qa/gates/{epic}.{story}-ux-{persona}.yml` - Gate files (includes console log findings)
- `docs/qa/gates/{epic}.{story}-responsive-{date}.yml` - Responsive layout gate files
- `docs/qa/gates/{epic}.{story}-interactive-{date}.yml` - Interactive review gate files
- `docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md` - UX assessment reports
- `docs/qa/assessments/{epic}.{story}-responsive-{date}.md` - Responsive layout reports
- `docs/qa/assessments/{epic}.{story}-interactive-{date}.md` - Interactive review reports
- `docs/qa/discovery/{story}-{persona}-solutions-{date}.md` - Solution reports
- `testing/persona-ux/screenshots/{story}-{persona}/` - Screenshots captured via MCP
- `testing/persona-ux/feedback/{story}-{persona}/` - Annotated screenshots
- `testing/persona-ux/baseline/{story}-{persona}/` - Baseline screenshots + metadata
- `testing/persona-ux/discovery/{story}-{persona}/` - Discovery reports + screenshots

---

**Ready to test?**

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Run UX review (MCP Playwright handles browser automation)
@qa *ux-review 22.1 --persona=m --url="/?v=m"

# 3. Test responsive layout
@qa *ux-responsive 22.1 --url="/?v=m"

# 4. Test interactive behaviors (NEW)
@qa *ux-interactive 22.1 --url="/?v=m" --scenarios="click drums, change tempo"
```

**No setup required** - MCP Playwright server configured in `.mcp.json` works automatically with Claude Code.
