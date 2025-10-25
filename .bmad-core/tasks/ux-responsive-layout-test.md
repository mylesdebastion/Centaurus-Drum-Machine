<!-- Powered by BMAD™ Core -->

# ux-responsive-layout-test

Test responsive design, mobile navigation, touch targets, and layout breakpoints from the perspective of a mobile user trying to access all features on a small device.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "22.1"
  - flow_url: 'URL path to test' # e.g., '/?v=m'
optional:
  - viewport_sizes: '[320, 375, 768]' # Widths to test (default: mobile sizes)
  - device_names: '[iphone-se, android, tablet]' # Device presets
```

## Purpose

Responsive layout testing evaluates whether the interface works smoothly on mobile devices from a **mobile user's perspective**:

**The Core Question**: "Can I access every feature on my phone? Can I navigate without getting stuck? Does everything work with my thumb?"

**Tests:**
- Touch target sizing (44px minimum for accessibility)
- Responsive breakpoints (layout works at 320px, 375px, 768px)
- Mobile navigation (tabs, hamburger menu, clear CTA placement)
- Horizontal scrolling (should be zero)
- Text readability (16px+ minimum)
- Layout reflow (no overlapping elements)
- Form usability (touch keyboards work, inputs accessible)

## Key Difference from Persona UX Testing

| Aspect | Persona UX | Responsive Layout |
|--------|-----------|-------------------|
| **Focus** | User goals/emotions | Device constraints |
| **Viewport** | All (desktop primary) | Mobile only |
| **Question** | "Does this match my needs?" | "Does this work on my phone?" |
| **Bailout Triggers** | Emotional/cognitive | Technical (buttons too small, scrolling) |
| **Persona** | Musician, Educator, etc. | Mobile user (generic) |

---

## Prerequisites

- Dev server running (localhost:5173)
- Playwright setup: `npm install && npx playwright install`

---

## Process

### Step 1: Capture Mobile Viewport Screenshots

Run Playwright with **responsive persona** (auto-activates mobile-only):

```bash
cd testing/persona-ux
node capture-flow.js --persona=responsive --url="/?v=m"
```

**Script captures (mobile-only, auto-configured):**
- Initial landing
- Each tutorial/feature step
- Completion/CTA screen
- Multiple viewport sizes: 320px, 375px, 667px (common mobile sizes)

**Output:** `testing/persona-ux/screenshots/responsive/{YYYYMMDD}-{step}-mobile-{size}px.png`

### Step 2: Analyze Mobile Navigation & Layout

For each screenshot, evaluate:

#### A. Touch Target Sizing
```
Check button/link sizes:
- [ ] All buttons ≥44px (iOS accessibility guideline)
- [ ] All links ≥44px touch target
- [ ] Spacing between targets ≥8px
- [ ] No overlapping touch targets

Scoring:
- PASS: All ≥44px, well-spaced
- CONCERNS: Some 38-44px, spacing tight
- FAIL: Buttons <38px, overlapping
```

#### B. Responsive Layout
```
Check layout at each viewport:
- [ ] No horizontal scrolling at 320px
- [ ] No horizontal scrolling at 375px
- [ ] Layout reflows smoothly
- [ ] No element cutoffs
- [ ] Text readable without zoom

Scoring:
- PASS: Smooth adaptation across sizes
- CONCERNS: Awkward at one breakpoint
- FAIL: Broken at multiple sizes
```

#### C. Mobile Navigation
```
Check navigation patterns:
- [ ] Navigation accessible (not hidden by default)
- [ ] Tab bar OR hamburger menu clear
- [ ] Primary CTA obvious on mobile
- [ ] Back buttons work
- [ ] Menu doesn't overlay important content

Scoring:
- PASS: Navigation clear, intuitive
- CONCERNS: Navigation hard to find
- FAIL: Navigation missing/unusable
```

#### D. Text Readability
```
Check text sizing:
- [ ] Body text ≥16px (readable without zoom)
- [ ] Headings properly scaled
- [ ] High contrast (WCAG AA minimum)
- [ ] No tiny labels
- [ ] Line length reasonable (not full width)

Scoring:
- PASS: Readable, proper sizing
- CONCERNS: Some text small but zoomable
- FAIL: Unreadable without zoom
```

#### E. Form Usability (if applicable)
```
Check mobile forms:
- [ ] Input fields large (≥44px height)
- [ ] Proper input types (email, tel, number)
- [ ] Keyboard appears correctly (not covering field)
- [ ] Labels visible above inputs
- [ ] Error messages clear

Scoring:
- PASS: Inputs fully usable on touch
- CONCERNS: Slightly cramped, works with effort
- FAIL: Inputs unusable, keyboard covers fields
```

### Step 3: Compile Findings

**Create gate YAML** with mobile-specific scores:

```yaml
schema: 1
story: '{story}'
gate: PASS|CONCERNS|FAIL
reviewer: 'Quinn (QA) - Mobile Responsive Test'

responsive_layout_review:
  viewport_tested: '320px, 375px, 667px'
  score: XX
  categories:
    touch_targets: PASS|CONCERNS|FAIL
    responsive_layout: PASS|CONCERNS|FAIL
    mobile_navigation: PASS|CONCERNS|FAIL
    text_readability: PASS|CONCERNS|FAIL
    form_usability: PASS|CONCERNS|FAIL (if forms present)

  top_issues:
    - severity: critical
      category: touch_targets
      description: "Button is 38px (need 44px minimum)"
      viewport: 375px
      screenshot: "testing/persona-ux/screenshots/responsive/20251025-step2-mobile-375px.png"
      mobile_voice: "I can't tap this button accurately - it's too small"
      fix: "Increase button height to 48px, add 8px padding"
```

### Step 4: Gate Decision

```
Score ≥80: PASS
Score 60-79: CONCERNS
Score <60: FAIL

Overrides:
- Touch target FAIL (buttons <38px) → FAIL
- Horizontal scrolling present → FAIL
- Text unreadable without zoom → FAIL
```

### Step 5: Output Summary

Print findings with mobile user's voice:

```
✅ Responsive Layout Test Complete

Story: 22.1
Gate: CONCERNS (72/100)
Tested: 320px, 375px, 667px

Issues Found:
- [CRITICAL] Step 2 button only 36px (need 44px)
- [MAJOR] Horizontal scrolling on 320px viewport
- [MAJOR] Text in footer too small (14px, need 16px+)

Mobile User Voice:
"I can't tap the 'Next' button without accidentally clicking something else.
And your app scrolls sideways on my small phone - that's broken."

Recommendations:
1. Increase all button heights to 48px minimum
2. Fix layout at 320px viewport (button overflow)
3. Increase footer text to 16px minimum
```

---

## Differences from Persona UX Testing

**Persona UX Test** (`ux-persona-review.md`):
- Desktop-only (desktop viewport, speeds up testing)
- Tests user goals: "Does this match my needs?"
- Persona-specific (Musician, Educator, Visual Learner, etc.)
- Emotional/cognitive analysis

**Responsive Layout Test** (this task):
- Mobile-only (mobile viewports only)
- Tests technical/physical: "Does this work on my phone?"
- Generic mobile user persona
- Touch target sizing, layout reflow, navigation clarity

**Use together**:
1. Run `ux-persona-review` to test Musician/Educator/etc. goals
2. Run `ux-responsive-layout-test` to test mobile technical constraints
3. Combine findings: Does it work for the persona? Does it work on mobile?

---

## Output Files

**Gate File:**
- `docs/qa/gates/{epic}.{story}-responsive-{YYYYMMDD}.yml`

**Markdown Report:**
- `docs/qa/assessments/{epic}.{story}-responsive-{YYYYMMDD}.md`

**Screenshots:**
- `testing/persona-ux/screenshots/responsive/{YYYYMMDD}-{step}-mobile-{size}px.png`

---

## Integration with BMAD

### QA Agent Command

Add to `qa.md`:
```yaml
- ux-responsive {story} --url={flow_url}:
    Execute responsive layout test (mobile-only viewports)
    Tests touch targets, navigation, layout reflow, readability
    Produces: Gate decision + assessment report
```

### Usage

```bash
@qa *ux-responsive 22.1 --url="/?v=m"
```

---

## Mobile User Voice & Language

**YES**: "Mobile-first, responsive, touch-friendly, small screen, works on my phone"
**NO**: "Desktop-only, requires zoom, hover-based, requires mouse"

**Bailout Triggers:**
- Button too small (< 44px) - can't tap accurately
- Horizontal scrolling - layout broken
- Text unreadable (< 16px) - need to zoom
- Navigation hidden - can't find menu
- Form inputs cramped - can't type

---

## Key Metrics

| Metric | Good | Acceptable | Bad |
|--------|------|-----------|-----|
| Touch target size | ≥48px | 44-47px | <44px |
| Viewport support | 320-1920px | 375-1920px | <375px or gaps |
| Text size | ≥16px | 14-16px | <14px |
| Horizontal scroll | None | Rare edge case | Present |
| Load time (4G) | <2s | <3s | >3s |

---

## Completion Checklist

- [ ] Capture mobile-only screenshots
- [ ] Analyze touch targets for all buttons
- [ ] Check responsive layout at 320px, 375px, 768px
- [ ] Evaluate mobile navigation clarity
- [ ] Test text readability (zoom requirements)
- [ ] Check form usability (if applicable)
- [ ] Create gate YAML with scores
- [ ] Create markdown report with mobile voice quotes
- [ ] Recommend: "Works on mobile" or "Mobile issues found"
