<!-- Powered by BMAD™ Core -->

# ux-solution-discovery

Discover existing components, features, and views that could solve UX issues identified in persona testing. Prevents reinventing the wheel by finding brownfield assets before creating new features.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "22.1"
  - persona_code: 'm|e|v|p|d|i' # Which persona was tested
  - assessment_path: 'docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md'
optional:
  - discovery_routes: '["/playground", "/", ...]' # Routes to explore (default: /playground)
  - manual_issues: 'visual-learning,accessibility,pricing' # Override auto-extraction
```

## Purpose

**The Problem**: After UX assessment, we often rush to create stories for new features without checking if solutions already exist in the codebase.

**The Solution**: Intelligent discovery workflow that:
1. Analyzes UX assessment to extract issue keywords
2. Uses Playwright to explore /playground and key routes
3. Discovers existing components/features via DOM inspection
4. AI matches discovered features to persona issues
5. Categorizes solutions: **Integrate Existing** vs **Build New**

**The Value**:
- Save 50-80% development time (integration << new development)
- Discover brownfield assets (features built but not surfaced in tutorials)
- Inform PO/Architect decisions (technical feasibility, effort estimates)
- Prevent duplicate functionality

**Example**: Educator assessment says "no visual learning demo" → Discovery finds Chord Arranger at /playground → Solution: Integrate existing component vs build new one

---

## Prerequisites

- UX assessment completed (`@qa *ux-review {story} --persona={code}`)
- Assessment report exists: `docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md`
- Dev server running (localhost:5173)
- Playwright setup: `npm install && npx playwright install chromium`

---

## Process

### Step 1: Load UX Assessment

Read the assessment report to extract issue keywords.

**File**: `docs/qa/assessments/{epic}.{story}-ux-{persona}-{date}.md`

**Extract from:**
- Critical Issues section
- Major Issues section
- "Persona Voice" quotes
- "What Would Help Me" statements

**Example extraction:**
```
Assessment Issue: "No hands-on visual learning demo"
→ Keywords: ["visual learning", "demo", "interactive", "hands-on"]

Assessment Issue: "Missing accessibility features"
→ Keywords: ["accessibility", "visual feedback", "Deaf/HOH", "inclusive"]

Assessment Issue: "No pricing information"
→ Keywords: ["pricing", "classroom license", "$199"]
```

**Output**: List of 5-15 issue keywords to search for

---

### Step 2: Run Intelligent Discovery

Execute Playwright script to explore routes and discover features.

```bash
cd testing/persona-ux
node discover-solutions.js \
  --story=22.1 \
  --persona=e \
  --assessment=docs/qa/assessments/22.1-ux-educator-20251025.md
```

**Script behavior:**
1. Extracts keywords from assessment automatically
2. Navigates to /playground (primary discovery route)
3. Inspects DOM for:
   - Interactive elements (buttons, links, cards)
   - Feature headings (h1, h2, h3 with descriptive text)
   - Data attributes (`[data-feature]`, `[data-module]`)
   - ARIA labels (accessibility hints)
4. Captures screenshots of each route
5. Matches discovered features to issue keywords
6. Generates discovery report JSON

**Output:**
- `testing/persona-ux/discovery/{story}-{persona}/discovery-report.json`
- `testing/persona-ux/discovery/{story}-{persona}/screenshots/*.png`

---

### Step 3: Analyze Discovery Report

Review the automated matching and identify high-confidence solutions.

**Load report:**
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

**Categorize findings:**

**✅ High Confidence (≥75%)**: Existing feature clearly matches issue
- Action: Recommend integration
- Effort: Low (component reuse)

**⚠️ Medium Confidence (50-74%)**: Feature partially matches
- Action: Requires PO/Architect review
- Effort: Medium (may need adaptation)

**❌ Low Confidence (<50%)** or **No Match**: No existing solution
- Action: New feature development needed
- Effort: High (build from scratch)

---

### Step 4: Collaborative Review (QA + PO + Architect)

**This is a collaborative decision point - DO NOT proceed to stories without this review.**

**Participants:**
- **QA (Quinn)**: Presents discovery findings, UX requirements
- **PO**: Evaluates business value, integration strategy
- **Architect**: Assesses technical feasibility, effort estimates

**Discussion format:**

For each high-confidence match:

**Example: Visual Learning Issue → Chord Arranger Component**

**QA**: "Assessment found 'No visual learning demo' as critical issue. Discovery script found Chord Arranger at /playground with 75% confidence match. Feature shows color-coded notes, which is exactly what Educator persona needs."

**PO**: "Does Chord Arranger work in embedded mode? Can we show it in a tutorial step without full UI?"

**Architect**: "Yes, component has `embeddedMode` prop. We can restrict to 2 chords (C Major, G Major) for tutorial. Effort: 4-6 hours to integrate, add click handlers, style for tutorial context."

**Decision**: ✅ Integrate existing component (Story 22.8 Task 1)

---

For each no-match issue:

**Example: Pricing Information**

**QA**: "Assessment found 'No pricing information' as critical issue. Discovery found no existing pricing display component."

**Architect**: "We don't have a pricing component yet. Need to build from scratch or use external pricing service."

**PO**: "Let's build simple pricing section component. Low complexity, 1-2 hours. Reusable for other personas."

**Decision**: 🆕 New feature development (Story 22.8 Task 3)

---

**Review checklist:**

- [ ] All high-confidence matches reviewed
- [ ] Integration feasibility confirmed by Architect
- [ ] Effort estimates provided for each solution
- [ ] New feature needs identified and scoped
- [ ] PO prioritizes integration vs new development
- [ ] Decisions documented in discovery report

---

### Step 5: Generate Solution Report

Create human-readable report for PM to create stories.

**Report format:**

```markdown
# UX Solution Discovery Report: {Persona} ({story})

**Date**: {ISO date}
**Persona**: {persona_name} ({code})
**Assessment**: docs/qa/assessments/{file}
**Discovery**: testing/persona-ux/discovery/{story}-{persona}/

---

## Executive Summary

- **Issues Analyzed**: X
- **Existing Solutions Found**: Y (Z% of issues)
- **New Features Needed**: W
- **Integration Effort**: N hours
- **New Development Effort**: M hours
- **Total Effort**: N+M hours

---

## Solution Mapping

### Issue 1: {Issue Title} (CRITICAL)

**Assessment Finding:**
- **Severity**: CRITICAL (-20 points)
- **Category**: Emotional Response
- **Description**: No hands-on visual learning demo
- **Persona Voice**: "SHOW me color-coded notes, don't just tell me!"

**Discovery Result:** ✅ EXISTING SOLUTION FOUND

**Existing Feature**: Chord Arranger
- **Location**: /playground → Chord Builder module
- **Screenshot**: `discovery/22.1-e/screenshots/chord-arranger-{date}.png`
- **Confidence**: 75%
- **Current State**: Fully functional, production-ready
- **Capabilities**:
  - Color-coded notes (C=red, E=yellow, G=blue)
  - Interactive chord selection
  - Visual feedback on click
  - Harmony visualization

**Integration Plan:**
- **Approach**: Embed ChordArranger component in Educator tutorial Step 2
- **Changes Needed**:
  - Add `embeddedMode` prop (restrict to 2 chords)
  - Emit `onChordClick` event for tutorial progression
  - Simplify UI for tutorial context (hide advanced features)
- **Effort**: 6 hours (component adaptation + tutorial integration)
- **Risk**: Low (component is stable, well-tested)

**PO Decision**: ✅ INTEGRATE (approved by PO + Architect)

**Story**: 22.8 Task 1 - Integrate Chord Arranger into Educator tutorial

---

### Issue 2: {Issue Title} (CRITICAL)

**Assessment Finding:**
- **Severity**: CRITICAL (-20 points)
- **Category**: Persona Friction
- **Description**: No pricing information for budget approval
- **Persona Voice**: "HOW MUCH? I can't request funding without a price!"

**Discovery Result:** ❌ NO EXISTING SOLUTION

**Search Results**:
- Explored: /playground, /, /about
- Keywords: pricing, classroom license, $199, cost
- Matches found: 0

**New Feature Required:**
- **Component**: PricingSection (new)
- **Requirements**:
  - Display: "$199/year classroom license"
  - Benefits: 30 students, all features, 30-day trial
  - CTAs: "Start Free Trial" + "Explore Studio"
- **Reusability**: Can be used for Enterprise, Institution personas
- **Effort**: 1-2 hours (simple component, no complex logic)
- **Risk**: Low (static content, no API integration)

**PO Decision**: 🆕 BUILD NEW (approved)

**Story**: 22.8 Task 3 - Create pricing section component

---

## Summary by Category

### ✅ Integration Stories (Use Existing Components)

| Issue | Existing Component | Location | Effort |
|-------|-------------------|----------|--------|
| Visual learning demo | Chord Arranger | /playground | 6h |
| Accessibility features | Frequency Visualizer | /playground | 3h |

**Total Integration Effort**: 9 hours

### 🆕 New Feature Stories (Build From Scratch)

| Issue | New Component | Complexity | Effort |
|-------|--------------|------------|--------|
| Pricing information | PricingSection | Low | 1h |

**Total New Development Effort**: 1 hour

---

## Recommendations

**Priority 1: Integration (9 hours)**
- Leverage existing, production-ready components
- Lower risk (already tested and stable)
- Faster time to market

**Priority 2: New Development (1 hour)**
- Simple, low-complexity features
- No existing alternatives found
- Build reusable components for future personas

**Overall Strategy**:
- 90% of effort is integration (reuse existing)
- 10% of effort is new development
- Total: 10 hours (vs 20-30 hours if building everything new)

**ROI**: Saved 10-20 hours by discovering and integrating existing components

---

## Next Steps

1. **PM creates stories** from this report (integration + new features)
2. **Dev implements** in priority order (integrate first, build second)
3. **QA re-tests** Educator persona after implementation
4. **Validate** UX score improves to 85-92 (PASS)

---

**Report Generated**: {ISO datetime} by Quinn (QA) with PO + Architect collaboration
```

**Save to:** `docs/qa/discovery/{epic}.{story}-{persona}-solutions-{YYYYMMDD}.md`

---

### Step 6: Update Discovery Report with Decisions

Update the JSON discovery report with collaborative decisions.

**Add to** `testing/persona-ux/discovery/{story}-{persona}/discovery-report.json`:

```json
{
  "collaborative_review": {
    "reviewDate": "2025-10-25T15:30:00Z",
    "participants": ["Quinn (QA)", "PO", "Architect"],
    "decisions": [
      {
        "issue": "visual learning",
        "decision": "INTEGRATE",
        "component": "Chord Arranger",
        "effort": "6 hours",
        "story": "22.8 Task 1",
        "rationale": "Existing component has exact functionality needed, embeddedMode available"
      },
      {
        "issue": "pricing",
        "decision": "BUILD_NEW",
        "component": "PricingSection",
        "effort": "1 hour",
        "story": "22.8 Task 3",
        "rationale": "No existing pricing display, simple static component"
      }
    ]
  }
}
```

---

## Integration with Story Creation

**PM uses this discovery report to create stories with:**

**For Integration Stories:**
- **Title**: "Integrate {Component} into {Persona} Tutorial"
- **Acceptance Criteria**: Embed existing component, adapt for tutorial context
- **Effort**: {from discovery report}
- **Risk**: Low (component already exists)
- **Technical Debt**: Minimal (reusing tested code)

**For New Feature Stories:**
- **Title**: "Create {Component} for {Persona} Tutorial"
- **Acceptance Criteria**: Build from scratch, ensure reusability
- **Effort**: {from discovery report}
- **Risk**: Medium (new code, needs testing)
- **Technical Debt**: Design for reuse across personas

---

## Key Principles

**1. Discover Before Develop**
- Always run discovery before creating stories
- Prevents reinventing the wheel
- Saves 50-80% development time

**2. Collaborative Decision-Making**
- QA presents findings
- PO evaluates business value
- Architect confirms feasibility
- Consensus required before proceeding

**3. Integration > New Development**
- Prefer existing components when possible
- Lower risk, faster delivery
- Maintain consistency across app

**4. Document Decisions**
- Record why integration was chosen
- Record why new development was needed
- Enables future reference and learning

**5. Measure ROI**
- Track time saved by integration
- Compare estimated effort (build new vs integrate)
- Report savings to stakeholders

---

## Completion Checklist

Execute in order, DO NOT skip:

- [ ] **Step 1**: Load UX assessment, extract issue keywords
- [ ] **Step 2**: Run Playwright discovery script
- [ ] **Step 3**: Analyze discovery report, categorize findings
- [ ] **Step 4**: Collaborative review (QA + PO + Architect)
  - [ ] Review all high-confidence matches
  - [ ] Architect confirms feasibility
  - [ ] PO prioritizes solutions
  - [ ] Document decisions
- [ ] **Step 5**: Generate human-readable solution report
- [ ] **Step 6**: Update JSON discovery report with decisions
- [ ] **Output**: Hand solution report to PM for story creation

---

## Troubleshooting

### "No features discovered at /playground"

**Cause**: Route may not exist or features not rendering

**Fix**:
1. Verify /playground route exists: `curl http://localhost:5173/playground`
2. Check if dev server is running
3. Try alternative routes: `/`, `/studio`
4. Inspect DOM manually in browser DevTools

### "Low confidence matches only"

**Cause**: Issue keywords may not match component naming

**Fix**:
1. Review screenshots manually (visual inspection)
2. Add manual keywords: `--issues="visual,interactive,color-coded"`
3. Expand discovery routes: `--routes="/playground,/studio,/modules"`

### "Feature exists but not discovered"

**Cause**: Feature may be hidden, modal, or require interaction

**Fix**:
1. Add navigation steps to script (click to reveal)
2. Capture screenshots after interactions
3. Manual review of /playground in browser

---

## Example Workflow

```bash
# 1. Complete UX assessment
@qa *ux-review 22.1 --persona=e
# Output: docs/qa/assessments/22.1-ux-educator-20251025.md

# 2. Run solution discovery
@qa *ux-discover 22.1 --persona=e
# Executes: discover-solutions.js script
# Output: testing/persona-ux/discovery/22.1-e/discovery-report.json

# 3. Collaborative review (manual, in meeting/chat)
# QA presents findings
# PO + Architect review
# Decisions documented

# 4. Generate solution report
# Output: docs/qa/discovery/22.1-e-solutions-20251025.md

# 5. PM creates stories
@pm *create-stories --from-discovery=docs/qa/discovery/22.1-e-solutions-20251025.md
# Output: docs/stories/22.8-educator-tutorial-improvements.story.md
```

---

**Task Created**: 2025-10-25
**Last Updated**: 2025-10-25
