# UX Solution Discovery Report: {Persona Name} ({story})

**Date**: {ISO date}
**Persona**: {persona_name} ({code})
**Assessment**: `docs/qa/assessments/{assessment-file}.md`
**Discovery**: `testing/persona-ux/discovery/{story}-{persona}/`

---

## Executive Summary

- **Issues Analyzed**: {X}
- **Existing Solutions Found**: {Y} ({Z}% of issues)
- **New Features Needed**: {W}
- **Integration Effort**: {N} hours
- **New Development Effort**: {M} hours
- **Total Effort**: {N+M} hours

**Key Finding**: {1-2 sentence summary of brownfield assets discovered vs new development needed}

---

## Solution Mapping

### Issue 1: {Issue Title} ({CRITICAL|MAJOR|MINOR})

**Assessment Finding:**
- **Severity**: {CRITICAL|MAJOR|MINOR} ({-20|-10|-2} points)
- **Category**: {Emotional Response|Persona Friction|Cognitive Load|etc.}
- **Description**: {Issue description from assessment}
- **Persona Voice**: "{Direct quote from persona}"

**Discovery Result:** {✅ EXISTING SOLUTION FOUND | ❌ NO EXISTING SOLUTION}

<!-- For existing solutions: -->
**Existing Feature**: {Component/Feature Name}
- **Location**: {/playground → Module Name | /route}
- **Screenshot**: `discovery/{story}-{persona}/screenshots/{feature-name}-{date}.png`
- **Confidence**: {75-100}%
- **Current State**: {Fully functional | Needs adaptation | Prototype}
- **Capabilities**:
  - {Feature capability 1}
  - {Feature capability 2}
  - {Feature capability 3}

**Integration Plan:**
- **Approach**: {How to integrate into persona tutorial/flow}
- **Changes Needed**:
  - {Change 1: e.g., Add embeddedMode prop}
  - {Change 2: e.g., Emit onInteraction event}
  - {Change 3: e.g., Simplify UI for tutorial context}
- **Effort**: {X hours} ({component adaptation + integration})
- **Risk**: {Low|Medium|High} ({rationale})

**PO Decision**: ✅ INTEGRATE (approved by PO + Architect)

**Story**: {Epic.Story Task N - Brief title}

---

<!-- For new features needed: -->
**Search Results**:
- Explored: {/playground, /, /route1, /route2}
- Keywords: {keyword1, keyword2, keyword3}
- Matches found: 0

**New Feature Required:**
- **Component**: {ComponentName} (new)
- **Requirements**:
  - {Requirement 1}
  - {Requirement 2}
  - {Requirement 3}
- **Reusability**: {Can be used for X, Y, Z personas/features}
- **Effort**: {X-Y hours} ({complexity rationale})
- **Risk**: {Low|Medium|High} ({rationale})

**PO Decision**: 🆕 BUILD NEW (approved)

**Story**: {Epic.Story Task N - Brief title}

---

### Issue 2: {Issue Title} ({CRITICAL|MAJOR|MINOR})

{Repeat pattern above for each issue}

---

## Summary by Category

### ✅ Integration Stories (Use Existing Components)

| Issue | Existing Component | Location | Effort | Risk |
|-------|-------------------|----------|--------|------|
| {Issue 1} | {Component 1} | {/playground} | {Xh} | Low |
| {Issue 2} | {Component 2} | {/route} | {Yh} | Low |

**Total Integration Effort**: {N hours}

### 🆕 New Feature Stories (Build From Scratch)

| Issue | New Component | Complexity | Effort | Risk |
|-------|--------------|------------|--------|------|
| {Issue 3} | {Component 3} | {Low|Medium|High} | {Xh} | {Low|Med|High} |

**Total New Development Effort**: {M hours}

---

## Recommendations

**Priority 1: Integration ({N hours})**
- Leverage existing, production-ready components
- Lower risk (already tested and stable)
- Faster time to market

**Priority 2: New Development ({M hours})**
- Simple, low-complexity features
- No existing alternatives found
- Build reusable components for future personas

**Overall Strategy**:
- {X}% of effort is integration (reuse existing)
- {Y}% of effort is new development
- Total: {N+M hours} (vs {estimated higher number} hours if building everything new)

**ROI**: Saved {X-Y hours} by discovering and integrating existing components

---

## Collaborative Review Notes

**Date**: {ISO datetime}
**Participants**: Quinn (QA), {PO Name}, {Architect Name}

**Key Decisions**:
1. {Decision 1: e.g., Integrate Chord Arranger instead of building new visual demo}
2. {Decision 2: e.g., Build pricing component (reusable across personas)}
3. {Decision 3: e.g., Defer accessibility tour to future sprint (medium priority)}

**Disagreements Resolved**:
- {Issue}: {QA position} vs {PO/Arch position} → **Resolution**: {Consensus reached}

**Assumptions**:
- {Assumption 1: e.g., ChordArranger has embeddedMode prop available}
- {Assumption 2: e.g., /playground components are production-ready}

---

## Next Steps

1. **PM creates stories** from this report (integration + new features)
2. **Dev implements** in priority order (integrate first, build second)
3. **QA re-tests** {Persona} persona after implementation
4. **Validate** UX score improves to {85-92} (PASS)

---

## Appendix: Discovery Details

**Playwright Discovery Script**: `testing/persona-ux/discover-solutions.js`

**Command Used**:
```bash
node discover-solutions.js \
  --story={story} \
  --persona={persona} \
  --assessment=docs/qa/assessments/{assessment-file}.md
```

**Routes Explored**:
- {/playground}
- {/}
- {Custom routes if any}

**Features Discovered**: {Total count}
**Screenshots Captured**: {Count} (see `discovery/{story}-{persona}/screenshots/`)

**Discovery Report JSON**: `testing/persona-ux/discovery/{story}-{persona}/discovery-report.json`

---

**Report Generated**: {ISO datetime} by Quinn (QA) with PO + Architect collaboration
**Next Review**: {Date for re-test after implementation}
