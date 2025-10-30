<!-- Powered by BMAD™ Core -->

# ux-persona-review

Perform persona-driven UX evaluation with visual analysis and screenshot-based critique. Evaluates user experience from specific persona perspectives to identify hierarchy, layout, cognitive load, and emotional response issues.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "22.1"
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md' # Path from core-config.yaml
  - story_title: '{title}' # If missing, derive from story file H1
  - story_slug: '{slug}' # If missing, derive from title (lowercase, hyphenated)
  - persona_code: 'm|e|v|p|d|i' # Which persona to embody for review
  - flow_url: 'URL path to test' # e.g., '/?v=m' for Musician tutorial
optional:
  - screenshot_dir: 'testing/persona-ux/screenshots/{persona_code}' # Where to save screenshots
  - baseline_screenshots: 'testing/persona-ux/baseline/{persona_code}' # For before/after comparison
```

## Purpose

Evaluate user experience from a specific persona's perspective, catching issues that traditional testing misses:
- Visual hierarchy problems (what draws attention first?)
- Layout issues (alignment, spacing, mobile breakpoints)
- Cognitive load (too much text, unclear CTAs, visual clutter)
- Emotional response (intimidating, boring, exciting, confusing)
- Persona-specific friction (irrelevant features, missing expectations)

## Prerequisites

**MCP Playwright Server**: Configured in `.mcp.json` (automatically available in Claude Code)

**Dev Server Running**: `npm run dev` at localhost:5173

**MCP Tools Available**:
- `mcp__playwright__browser_navigate` - Navigate to test URLs
- `mcp__playwright__browser_resize` - Set viewport sizes
- `mcp__playwright__browser_snapshot` - Capture accessibility tree
- `mcp__playwright__browser_take_screenshot` - Visual evidence capture
- `mcp__playwright__browser_console_messages` - Error/warning detection
- `mcp__playwright__browser_wait_for` - Wait for elements/animations

## Dependencies

```yaml
data:
  - ux-analysis-framework.md # Visual hierarchy checklist, layout evaluation criteria
external:
  - docs/personas/{persona_code}-*.md # Canonical persona documents (m/d/e/v/p/i)
```

## Process

### Step 1: Navigate and Capture Screenshots

Use MCP Playwright commands to navigate, capture screenshots, and monitor browser behavior.

#### 1A. Navigate to Flow URL

```
Use: mcp__playwright__browser_navigate
URL: http://localhost:5173{flow_url}
```

**Example:** Navigate to `http://localhost:5173/?v=m` for Musician persona

#### 1B. Set Viewport (Desktop-First for Persona Reviews)

```
Use: mcp__playwright__browser_resize
Desktop: width=1920, height=1080
Mobile: width=375, height=667 (if testing mobile)
```

**Default Strategy:**
- Regular personas (m, e, v, p): Desktop-only (speeds up testing)
- Responsive testing: Use ux-responsive-layout-test.md instead

#### 1C. Capture Initial State

**Accessibility Snapshot (Preferred):**
```
Use: mcp__playwright__browser_snapshot
Purpose: Capture DOM structure, semantic HTML, accessibility tree
Better than screenshots for: aria labels, form associations, keyboard nav
```

**Visual Screenshot:**
```
Use: mcp__playwright__browser_take_screenshot
Options:
  - filename: testing/persona-ux/screenshots/{story}-{persona}/step0-landing-{date}.png
  - fullPage: false (viewport only)
  - type: png
```

#### 1D. Monitor Browser Console (NEW)

```
Use: mcp__playwright__browser_console_messages
onlyErrors: false (get all messages including warnings)
```

**Check for:**
- JavaScript errors (red flags for code quality)
- React warnings (hydration issues, deprecated APIs)
- Performance warnings (large bundles, slow renders)
- Network errors (failed API calls)

**Save console output** for inclusion in assessment report.

#### 1E. Navigate Through Flow

For each tutorial step:

1. **Find and click** "Next"/"Continue" button:
   ```
   Use: mcp__playwright__browser_click
   element: "Next button"
   ref: [from browser_snapshot]
   ```

2. **Wait for transition**:
   ```
   Use: mcp__playwright__browser_wait_for
   time: 1 (seconds for animations)
   ```

3. **Capture snapshot and screenshot** of new step

4. **Check console messages** for new errors

**Repeat** until completion screen reached.

#### 1F. Organize Screenshots

**Directory structure:**
```
testing/persona-ux/screenshots/{story}-{persona}/
  ├── step0-landing-desktop-{YYYYMMDD-HHMM}.png
  ├── step1-desktop-{YYYYMMDD-HHMM}.png
  ├── step2-desktop-{YYYYMMDD-HHMM}.png
  └── completion-desktop-{YYYYMMDD-HHMM}.png
```

**Naming convention:** `{step}-{viewport}-{timestamp}.png`

### Step 2: Load Persona Context

Read canonical persona document from `docs/personas/{persona_code}-*.md`:

**For each persona, internalize:**
- Who They Are: Background, experience level, context
- Demographics: Age range, budget, platforms
- Pain Points: What frustrates them? (in their own words)
- Goals: What do they want to accomplish?
- Bailout Triggers: "I'd quit if..." scenarios
- Language Preferences: YES terms (use) vs NO terms (avoid)
- Trust Factors: What makes them trust us?
- Conversion Factors: What makes them convert or advocate?

**Map persona codes to files:**
- `m` → docs/personas/m-musician.md
- `d` → docs/personas/d-deaf-hoh.md
- `e` → docs/personas/e-educator.md
- `v` → docs/personas/v-visual-learner.md
- `p` → docs/personas/p-producer.md
- `i` → docs/personas/i-enterprise.md

### Step 2B: Load Baseline (If --baseline Flag Provided)

**Execute this step ONLY if baseline comparison was requested.**

#### Check Baseline Exists

**Location:** `testing/persona-ux/baseline/{story}-{persona}/`

**Required files:**
- `baseline.json` - Metadata from previous review
- Screenshot PNGs with previous timestamps

**If baseline not found:**
- Warn user: "Baseline not found. Run cleanup with --keep-baseline after first review."
- Abort comparison, proceed with fresh review only

#### Load Baseline Metadata

Read `baseline.json`:

```json
{
  "story": "22.1",
  "persona": "m",
  "date": "2025-10-25T14:30:00Z",
  "timestamp": "20251025-1430",
  "ux_score": 72,
  "gate": "CONCERNS",
  "issues": {
    "critical": 3,
    "major": 2,
    "minor": 3
  },
  "categories": {
    "visual_hierarchy": "PASS",
    "layout_responsive": "PASS",
    "cognitive_load": "FAIL",
    "emotional_response": "FAIL",
    "persona_friction": "CONCERNS"
  },
  "top_issues": [
    {
      "severity": "critical",
      "category": "cognitive_load",
      "description": "Step 2 text wall explains features before action"
    },
    {
      "severity": "critical",
      "category": "emotional_response",
      "description": "No hands-on music creation during tutorial"
    }
  ]
}
```

#### Map Baseline Screenshots to Current Screenshots

**Compare screenshot sets:**

**Baseline:**
- `baseline/{story}-{persona}/adhoc-m-step1-desktop-20251025-1430.png`
- `baseline/{story}-{persona}/adhoc-m-step2-desktop-20251025-1430.png`

**Current:**
- `screenshots/{story}-{persona}/adhoc-m-step1-desktop-20251026-0915.png`
- `screenshots/{story}-{persona}/adhoc-m-step2-desktop-20251026-0915.png`

**Match by step name (not timestamp):**
- step1 baseline → step1 current
- step2 baseline → step2 current

**Note:** If step count changed (e.g., Step 2 removed), note structural changes in comparison.

#### Prepare for Comparison Analysis

During Step 3 analysis, you'll compare:
- **Visual differences:** Layout changes, color changes, text changes
- **Issue resolution:** Were baseline critical issues fixed?
- **New issues:** Did fixes introduce regressions?
- **Score delta:** How did each category score change?

### Step 3: Visual Analysis Framework

For each screenshot and accessibility snapshot, analyze using `ux-analysis-framework.md`.

**NEW: Use Accessibility Snapshots** from `browser_snapshot` to validate:
- Semantic HTML structure (proper heading hierarchy)
- Form label associations (aria-labelledby, for attributes)
- Keyboard navigation order (tab index, focus management)
- Button/link accessibility (role, aria-label, name)
- ARIA attributes (aria-hidden, aria-live, aria-expanded)

**Combine with Visual Screenshots** for complete analysis:

#### A. Visual Hierarchy (What do I notice first/second/third?)

**Scoring:**
- **FAIL**: Primary action buried, confusing layout, can't find what matters
- **CONCERNS**: Hierarchy unclear, competing elements, requires effort
- **PASS**: Clear visual flow, obvious primary action, intuitive layout

**Check:**
- [ ] Primary CTA is immediately obvious (size, color, position)
- [ ] Text hierarchy guides eye correctly (H1 → H2 → body → CTA)
- [ ] Important info stands out (not buried in paragraphs)
- [ ] Whitespace guides attention effectively

**Persona Voice:** "As a {persona}, the first thing I see is... The second thing is... I'm looking for {goal} but I see..."

**What Would Help Me:** "{Persona suggests what they need in their own words}"

#### B. Layout & Responsiveness

**Scoring:**
- **FAIL**: Broken layout, elements overlap, unusable on mobile
- **CONCERNS**: Alignment issues, cramped spacing, awkward breakpoints
- **PASS**: Clean alignment, comfortable spacing, mobile-first design

**Check:**
- [ ] Elements align properly (no floating oddities)
- [ ] Spacing is consistent (padding/margins feel intentional)
- [ ] Mobile viewport is usable (not just "scaled down")
- [ ] Touch targets are ≥44px (mobile accessibility)

**Persona Voice:** "On my phone, I can't... The spacing feels... Elements are..."

**What Would Help Me:** "{Persona suggests layout improvements in their words}"

#### C. Cognitive Load

**Scoring:**
- **FAIL**: Overwhelming text walls, unclear purpose, decision paralysis
- **CONCERNS**: Too many options, unclear labeling, requires mental effort
- **PASS**: Scannable content, clear choices, minimal friction

**Check:**
- [ ] Text is scannable (short paragraphs, bullets, headings)
- [ ] Choices are clear (not too many options at once)
- [ ] CTAs have clear labels ("Start Tutorial" not "Continue")
- [ ] No jargon that persona wouldn't understand

**Persona Voice:** "I don't understand what... There's too much... I just want to... Why are they asking me about...?"

**What Would Help Me:** "{Persona suggests how to reduce cognitive load}"

#### D. Emotional Response

**Scoring:**
- **FAIL**: Intimidating, boring, frustrating, makes me want to leave
- **CONCERNS**: Feels generic, lacks personality, meh engagement
- **PASS**: Exciting, relevant, trustworthy, makes me want to continue

**Check:**
- [ ] Tone matches persona expectations (casual for Musicians, educational for Educators)
- [ ] Visuals evoke appropriate emotion (excitement, trust, curiosity)
- [ ] Copy speaks to persona's goals ("Jam in 30 seconds" not "Configure audio settings")
- [ ] No friction points that trigger persona's frustrations

**Persona Voice:** "This feels... I'm excited about... This makes me nervous because... I'd bail if..."

**What Would Help Me:** "{Persona suggests what would make them feel confident/excited/engaged}"

#### E. Persona-Specific Friction

**Check against persona context:**
- [ ] Features highlighted match persona's goals
- [ ] No irrelevant features distracting from main goal
- [ ] Messaging uses persona's language (not generic)
- [ ] Tutorial length matches persona's attention span
- [ ] Complexity matches persona's technical comfort

**Persona Voice:** "Why are they showing me... I don't care about... What I actually need is... This assumes I know..."

**What Would Help Me:** "{Persona suggests features/changes that align with their specific goals}"

### Step 4: Screenshot Annotation

For each identified issue:
1. Mark up screenshot with annotations (arrows, highlights, notes)
2. Label with issue type: [HIERARCHY] [LAYOUT] [COGNITIVE] [EMOTIONAL] [FRICTION]
3. Note severity: CRITICAL / MAJOR / MINOR
4. Provide persona voice quote
5. Add "What Would Help Me" persona suggestion

**Annotation Format:**
```
[RED/ORANGE/YELLOW BOX around element]
❌ CRITICAL/MAJOR/MINOR: [Category] - [Issue Description]
Persona Voice: "[Reaction/frustration in their words]"
What Would Help Me: "[Persona suggests solution in their words]"
Fix: [Specific technical action to implement]
```

**Example:**
```
[RED BOX around "Configure MIDI Input" heading]
❌ CRITICAL: Cognitive Load + Persona Friction
Persona Voice (Musician): "MIDI? Audio buffer? I just want to jam! This is way too technical for me."
What Would Help Me (Musician): "Just show me a picture of a keyboard or tell me I can use my computer keys. I need to know I can start right now without buying anything."
Fix: Replace with "Connect Your Keyboard (Optional)" + visual preview + "Computer keyboard works too!" callout
```

**Save annotated images:** `testing/persona-ux/feedback/{persona_code}/{YYYYMMDD}-{step}-annotated.png`

### Step 5: Scoring & Gate Decision

#### UX Score Calculation

```text
Base Score = 100
For each screenshot analyzed:
  - FAIL issue: Deduct 20 points
  - CONCERNS issue: Deduct 10 points
  - PASS: No deduction

Category thresholds:
  - Visual Hierarchy FAIL: -20 per screen
  - Layout FAIL: -15 per screen
  - Cognitive Load FAIL: -20 per screen
  - Emotional Response FAIL: -25 per screen (critical for engagement)
  - Persona Friction FAIL: -15 per friction point

Minimum score = 0 (unusable UX)
Maximum score = 100 (excellent UX)
```

#### Gate Decision Criteria

- **FAIL**: UX Score < 50 OR any Emotional Response FAIL OR ≥3 CRITICAL issues
- **CONCERNS**: UX Score 50-75 OR ≥2 MAJOR issues
- **PASS**: UX Score > 75 AND no CRITICAL issues
- **WAIVED**: Documented acceptance of UX debt with improvement plan

## Outputs

### Output 1: Gate YAML Block

Generate for inclusion in quality gate:

```yaml
ux_review:
  persona: '{persona_code}'
  persona_name: '{Musician|Educator|Visual Learner|Producer}'
  score: XX # 0-100
  screenshots_analyzed: X
  issues:
    critical: X
    major: Y
    minor: Z
  categories:
    visual_hierarchy: PASS|CONCERNS|FAIL
    layout_responsive: PASS|CONCERNS|FAIL
    cognitive_load: PASS|CONCERNS|FAIL
    emotional_response: PASS|CONCERNS|FAIL
    persona_friction: PASS|CONCERNS|FAIL
  top_issues:
    - severity: critical
      category: emotional_response
      description: 'Tutorial feels intimidating to non-technical musicians'
      screenshot: 'testing/persona-ux/feedback/m/20250125-step2-annotated.png'
      persona_voice: '"This assumes I know what a MIDI device is - I just want to jam!"'
      what_would_help_me: '"Just show me I can start with what I have. A picture of a keyboard or mouse would help. Tell me I don''t need special equipment."'
      suggested_fix: 'Replace technical jargon with simple music terms'
  recommendations:
    immediate: # Fix before launch
      - 'Simplify step 2 language - remove MIDI jargon'
      - 'Increase CTA button size on mobile (currently 38px, need 44px)'
    future: # Nice to have improvements
      - 'Add visual preview of drum machine before tutorial starts'
```

### Output 2: Markdown Report

**Save to:** `qa.qaLocation/assessments/{epic}.{story}-ux-{persona_code}-{YYYYMMDD}.md`

```markdown
# UX Persona Review: {persona_name} - Story {epic}.{story}

Date: {date}
Reviewer: Quinn (Test Architect)
Persona: {persona_name} ({persona_code})
Flow Tested: {flow_url}

## Executive Summary

- **UX Score**: XX/100
- **Gate Decision**: PASS|CONCERNS|FAIL
- **Screenshots Analyzed**: X (mobile + desktop)
- **Critical Issues**: X (must fix)
- **Major Issues**: Y (should fix)
- **Minor Issues**: Z (nice to have)

## Persona Context

**Who am I?** {Background summary}
**What do I want?** {Goals}
**What frustrates me?** {Frustrations}
**I'd quit if...** {Bailout triggers}

## Browser Console Analysis (NEW)

**Console Messages Captured:** {count} messages ({errors} errors, {warnings} warnings)

### Critical JavaScript Errors

{List any console errors that impact functionality}

**Example:**
```
[ERROR] Uncaught TypeError: Cannot read property 'play' of null
  at DrumMachine.tsx:45
  Impact: Drum sounds not playing on button click
```

### Warnings & Performance Issues

{List React warnings, performance warnings, network errors}

**Example:**
```
[WARNING] Component re-rendering 15 times per second
  at Studio.tsx:122
  Impact: May cause performance issues on slower devices
```

## Accessibility Snapshot Findings (NEW)

**Semantic HTML Issues:**
- {List heading hierarchy problems, missing landmarks, etc.}

**Form Accessibility:**
- {List missing labels, improper associations, etc.}

**Keyboard Navigation:**
- {List tab order issues, missing focus styles, trapped focus}

**ARIA Issues:**
- {List incorrect ARIA usage, missing attributes}

## Flow Analysis

### Screenshot 1: {Step Name} (Desktop)

**First Impression:** "{Persona voice - what I notice immediately}"

**Accessibility Snapshot:** {Link to snapshot data or key findings}

#### Visual Hierarchy: [PASS|CONCERNS|FAIL]
- Primary CTA prominence: {assessment}
- Text hierarchy flow: {assessment}
- Attention guidance: {assessment}
- **Issues Found:**
  - [CRITICAL] Primary "Start Tutorial" button buried below paragraph
  - [MAJOR] Heading competes with persona card for attention

#### Layout & Responsiveness: [PASS|CONCERNS|FAIL]
- Alignment: {assessment}
- Spacing: {assessment}
- Mobile usability: {assessment}
- **Issues Found:** (none|list)

#### Cognitive Load: [PASS|CONCERNS|FAIL]
- Text scannability: {assessment}
- Choice clarity: {assessment}
- Label clarity: {assessment}
- **Issues Found:** (none|list)

#### Emotional Response: [PASS|CONCERNS|FAIL]
- Tone match: {assessment}
- Visual appeal: {assessment}
- Relevance: {assessment}
- **Persona Voice:** "{Quote about how this makes me feel}"
- **Issues Found:** (none|list)

#### Persona-Specific Friction: [PASS|CONCERNS|FAIL]
- Goals alignment: {assessment}
- Feature relevance: {assessment}
- Language match: {assessment}
- **Issues Found:** (none|list)

**Annotated Screenshot:** `testing/persona-ux/feedback/{persona_code}/{YYYYMMDD}-{step}-annotated.png`

---

[Repeat for each screenshot...]

## Issue Summary by Severity

### Critical Issues (Must Fix Before Launch)

1. **[EMOTIONAL] Tutorial intimidates non-technical users**
   - Location: Step 2 - Equipment Setup
   - Persona Voice: "MIDI controller? Audio buffer? I have no idea what this means!"
   - What Would Help Me: "Just tell me I can use my computer keyboard or show me a simple picture. I need to know I don't need to buy anything special to get started."
   - Impact: Users will abandon tutorial
   - Suggested Fix: Replace with: "Connect your gear (optional - keyboard works too!)"
   - Screenshot: `step2-annotated.png`

### Major Issues (Should Fix Soon)

### Minor Issues (Nice to Have)

## Before/After Comparison

**ONLY include this section if --baseline flag was provided and baseline loaded successfully.**

### Baseline Review Summary

**Previous Review:**
- **Date:** {baseline.date} (ISO format)
- **UX Score:** {baseline.ux_score}/100
- **Gate:** {baseline.gate}
- **Issues Found:**
  - Critical: {baseline.issues.critical}
  - Major: {baseline.issues.major}
  - Minor: {baseline.issues.minor}

**Current Review:**
- **Date:** {current_date} (ISO format)
- **UX Score:** {current_score}/100
- **Gate:** {current_gate}
- **Issues Found:**
  - Critical: {current_issues.critical}
  - Major: {current_issues.major}
  - Minor: {current_issues.minor}

**Overall Change:** {score_delta} points ({baseline.gate} → {current_gate})

### Category Score Changes

| Category | Baseline | Current | Change |
|----------|----------|---------|--------|
| Visual Hierarchy | {baseline.categories.visual_hierarchy} | {current.visual_hierarchy} | ↑/↓/→ |
| Layout & Responsiveness | {baseline.categories.layout_responsive} | {current.layout_responsive} | ↑/↓/→ |
| Cognitive Load | {baseline.categories.cognitive_load} | {current.cognitive_load} | ↑/↓/→ |
| Emotional Response | {baseline.categories.emotional_response} | {current.emotional_response} | ↑/↓/→ |
| Persona Friction | {baseline.categories.persona_friction} | {current.persona_friction} | ↑/↓/→ |

### Issues Resolved ✅

For each baseline issue that no longer appears in current review:

#### 1. {Baseline Issue Title} - FIXED

**Baseline State:**
- **Severity:** {critical|major|minor}
- **Category:** {category}
- **Description:** {baseline description}
- **Screenshot:** `baseline/{story}-{persona}/{filename}.png`
- **Persona Voice:** "{baseline persona quote}"

**Current State:**
- **Status:** RESOLVED
- **Evidence:** {Describe what changed in screenshots}
- **Screenshot:** `screenshots/{story}-{persona}/{filename}.png`
- **Impact:** {How this fix improved UX}

**Example:**
```markdown
#### 1. Text Wall Before Action (Step 2) - FIXED

**Baseline State:**
- **Severity:** CRITICAL
- **Category:** Cognitive Load
- **Description:** 3-paragraph explanation before user takes action
- **Screenshot:** `baseline/adhoc-m/adhoc-m-step2-desktop-20251025-1430.png`
- **Persona Voice:** "I don't want to read, I want to PLAY!"

**Current State:**
- **Status:** RESOLVED
- **Evidence:** Step 2 removed entirely, user goes straight to interactive drum machine
- **Screenshot:** `screenshots/adhoc-m/adhoc-m-step2-desktop-20251026-0915.png`
- **Impact:** Saved 10 seconds, eliminated cognitive load, user reaches action faster
```

### Issues Persisting ⚠️

For each baseline issue that STILL appears in current review:

#### 1. {Issue Title} - STILL PRESENT

**Status:** Not addressed in this iteration
**Screenshots:** Baseline vs Current show same problem
**Recommendation:** Prioritize for next iteration

### New Issues Introduced ❌

For each current issue that was NOT present in baseline:

#### 1. {New Issue Title} - REGRESSION

**Severity:** {critical|major|minor}
**Category:** {category}
**Description:** {what's wrong}
**Screenshot:** `screenshots/{story}-{persona}/{filename}.png`
**Persona Voice:** "{quote}"
**Root Cause:** {What change introduced this issue?}
**Fix:** {How to address this regression}

**Example:**
```markdown
#### 1. Interactive Step Too Fast - REGRESSION

**Severity:** MAJOR
**Category:** Emotional Response
**Description:** New interactive beat creation step auto-advances after 2 seconds
**Screenshot:** `screenshots/adhoc-m/adhoc-m-step3-desktop-20251026-0915.png`
**Persona Voice:** "Wait, what just happened? I didn't even get to click!"
**Root Cause:** Auto-advance timer added to speed up tutorial
**Fix:** Replace timer with explicit "Continue" button, let user control pacing
```

### Visual Comparison Notes

**Structural Changes:**
- Steps added: {list}
- Steps removed: {list}
- Steps reordered: {list}

**Visual Design Changes:**
- Color scheme updates: {describe}
- Typography changes: {describe}
- Layout shifts: {describe}

### Improvement Assessment

**Wins:**
- {List major improvements with impact}
- {Quantify improvements: "Reduced cognitive load by X seconds"}

**Concerns:**
- {List any regressions or new issues}
- {Assess if regressions outweigh improvements}

**Overall:**
{1-2 paragraph summary: Did the fixes work? Is the UX better? What's left to address?}

## Recommendations

### Immediate Actions (Block Launch)

1. **Simplify Technical Language (Step 2)**
   - Current: "Configure MIDI input device"
   - Proposed: "Connect your keyboard (optional)"
   - Why: Musicians != audio engineers

2. **Increase Mobile CTA Size (All Steps)**
   - Current: 38px touch target
   - Proposed: 48px minimum
   - Why: iOS accessibility guidelines

### Short-Term Improvements (Next Sprint)

### Long-Term Enhancements (Backlog)

## Next Steps

- [ ] Developer: Address immediate actions
- [ ] Designer: Review annotated screenshots
- [ ] Re-run UX review after fixes
- [ ] Test with real users from persona group
```

### Output 3: Story Hook Line

**Print this line for review task to quote:**

```text
UX review ({persona_name}): qa.qaLocation/assessments/{epic}.{story}-ux-{persona_code}-{YYYYMMDD}.md
Annotated screenshots: testing/persona-ux/feedback/{persona_code}/
```

## Integration with Quality Gates

**Gate Decision Rules:**

1. **UX Score threshold:**
   - Score < 50 → Gate = FAIL
   - Score 50-75 → Gate = CONCERNS
   - Score > 75 → Gate = PASS

2. **Issue severity override:**
   - Any CRITICAL Emotional Response issue → Gate = FAIL
   - ≥3 CRITICAL issues (any category) → Gate = FAIL
   - ≥2 MAJOR issues → Gate = CONCERNS

3. **Persona friction special rule:**
   - If persona can't complete core goal → Gate = FAIL (regardless of score)

**Multi-Persona Aggregation:**

When reviewing all 4 personas:
- Final Gate = Worst individual gate
- Any persona FAIL → Overall FAIL
- ≥2 personas CONCERNS → Overall FAIL
- Document persona-specific issues separately

## Key Principles

- **Embody the persona** - Think, feel, react as they would
- **First impressions matter** - Note immediate reactions before deep analysis
- **Voice authenticity** - Use persona's language, not UX jargon
- **Visual evidence** - Every critique needs annotated screenshot
- **Actionable feedback** - "This sucks" → "Change X to Y because Z"
- **Emotional honesty** - Capture frustration, confusion, delight
- **Persona-first decisions** - Generic UX rules don't apply if persona doesn't care
- **NEW: Browser console monitoring** - JavaScript errors indicate code quality issues
- **NEW: Accessibility snapshots** - DOM structure reveals semantic HTML quality
- **NEW: Visual mode first** - Use `browser_snapshot` before screenshots for structure analysis

## Blocking Conditions

Stop the review and request clarification if:

- Dev server not running (browser navigation fails)
- MCP Playwright server not configured (.mcp.json missing playwright entry)
- Persona code invalid or context data missing
- Story doesn't involve user-facing UX
- Flow URL returns 404 or errors
- Browser fails to launch (run `mcp__playwright__browser_install` if needed)

## Completion

**CRITICAL**: All outputs must be generated before review is considered complete.

### Completion Checklist

Execute in order, DO NOT skip:

- [ ] **Output 1**: Save gate YAML block
  - Location: `docs/qa/gates/{epic}.{story}-ux-{persona}.yml`
  - Confirm file created and verify content

- [ ] **Output 2**: Save markdown report
  - Location: `docs/qa/assessments/{epic}.{story}-ux-{persona}-{YYYYMMDD}.md`
  - Confirm file created (should be 5000+ words with detailed analysis)
  - **DO NOT SKIP THIS** - this is the human-readable documentation

- [ ] **Output 3**: Save annotated screenshots (if annotations created)
  - Location: `testing/persona-ux/feedback/{persona}/`
  - Red/orange/yellow boxes with issue callouts

- [ ] **Summary**: Print completion summary
  - Gate decision (PASS/CONCERNS/FAIL)
  - Score and file locations
  - Recommend next steps

- [ ] **Cleanup**: Offer screenshot cleanup options

After checklist complete:

1. Confirm all files created
2. Recommend status: "UX approved" or "UX needs revision"
3. Tag issues with suggested owner: `dev` (code), `design` (visual), `pm` (scope/messaging)
4. **Offer screenshot cleanup** (unless *yolo mode - then auto-cleanup)

### Screenshot Cleanup Prompt

After generating all outputs, prompt user:

```
✅ UX Review Complete

Gate: {PASS|CONCERNS|FAIL} ({score}/100)
Report: docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md
Annotated screenshots: testing/persona-ux/feedback/{story}-{persona}/
Raw screenshots: testing/persona-ux/screenshots/{story}-{persona}/

Screenshot cleanup options:
  1. Move annotated to docs/qa/screenshots/ and delete raw (recommended)
  2. Keep baseline for before/after comparison
  3. Skip cleanup (keep all files)

Clean up screenshots? (Y/n)
Create baseline for next review? (y/N)
```

**If user says yes to cleanup:**
- Execute ux-cleanup-screenshots task
- Move annotated screenshots to `docs/qa/screenshots/{story}-{persona}/`
- Delete raw screenshots from `testing/persona-ux/screenshots/{story}-{persona}/`
- Update gate file screenshot paths to new location

**If user says yes to baseline:**
- Copy current screenshots to `testing/persona-ux/baseline/{story}-{persona}/`
- Create baseline.json metadata file
- These will be used for before/after comparison in next review

**If *yolo mode active:**
- Automatically move annotated screenshots
- Automatically delete raw screenshots
- Skip baseline (unless explicitly requested with --keep-baseline flag)
- Log actions without confirmation prompts

### Final Summary

```
🎉 UX Review and Cleanup Complete

Preserved:
  ✓ Gate file: docs/qa/gates/{epic}.{story}-ux-{persona}.yml
  ✓ Report: docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md
  ✓ Annotated screenshots: docs/qa/screenshots/{story}-{persona}/ ({X} files)
  {if baseline}
  ✓ Baseline saved: testing/persona-ux/baseline/{story}-{persona}/ ({Y} files)
  {endif}

Cleaned:
  ✓ Deleted raw screenshots (freed {Z} MB)

Next steps:
  1. Review findings: docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md
  2. Address critical issues (see "Immediate Actions" section)
  3. Re-capture and review after fixes
  4. Compare against baseline to verify improvements
```
