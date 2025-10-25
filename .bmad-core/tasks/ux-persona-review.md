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

**Playwright Setup** (if not already installed):
```bash
cd testing/persona-ux
npm install playwright
npx playwright install chromium
```

**Dev Server Running**: `npm run dev` at localhost:5173

## Dependencies

```yaml
data:
  - persona-contexts.md # Detailed persona backgrounds, goals, frustrations
  - ux-analysis-framework.md # Visual hierarchy checklist, layout evaluation criteria
```

## Process

### Step 1: Capture Screenshots

Run the Playwright capture script:

```bash
node testing/persona-ux/capture-flow.js --persona={persona_code} --url={flow_url}
```

**Script captures:**
- Initial landing/selector screen
- Each tutorial step
- Completion/CTA screen
- Mobile viewport (375px)
- Desktop viewport (1920px)

**Output:** `testing/persona-ux/screenshots/{persona_code}/{YYYYMMDD}-{step}.png`

### Step 2: Load Persona Context

Read `persona-contexts.md` to embody the persona:

**For each persona, internalize:**
- Background: Who are they? What's their experience level?
- Goals: What do they want to accomplish? Why are they here?
- Frustrations: What annoys them? What makes them bail?
- Decision Criteria: "I'd quit if...", "I'd trust this if..."
- Attention Span: How patient are they with tutorials?
- Technical Comfort: What jargon is okay? What's intimidating?

### Step 3: Visual Analysis Framework

For each screenshot, analyze using `ux-analysis-framework.md`:

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

## Flow Analysis

### Screenshot 1: {Step Name} (Desktop)

**First Impression:** "{Persona voice - what I notice immediately}"

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

[If baseline_screenshots provided, show side-by-side comparison]

**Previous UX Score:** XX/100
**Current UX Score:** YY/100
**Change:** +/- ZZ points

**Improvements Made:**
- {List of improvements}

**New Issues Introduced:**
- {List of regressions}

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

## Blocking Conditions

Stop the review and request clarification if:

- Dev server not running (can't capture screenshots)
- Persona code invalid or context data missing
- Story doesn't involve user-facing UX
- Flow URL returns 404 or errors
- Screenshots fail to capture (missing Playwright setup)

## Completion

After review:

1. Save gate YAML block for gate file
2. Save markdown report to assessments directory
3. Save annotated screenshots to feedback directory
4. Recommend status: "UX approved" or "UX needs revision"
5. Tag issues with suggested owner: `dev` (code), `design` (visual), `pm` (scope/messaging)
6. **Offer screenshot cleanup** (unless *yolo mode - then auto-cleanup)

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
