# Epic {NUMBER}: {EPIC_NAME}

**Status:** 📝 **PLANNING** _(Update: PLANNING → IN PROGRESS → COMPLETE)_
**Priority:** {High | Medium | Low}
**Target Completion:** {Q1 2025 | Sprint XX}

---

## Epic Overview

{2-3 paragraph description of the epic vision and business value}

**Vision:** {1-2 sentence aspirational goal}

**Business Requirements:**
- {Business need 1}
- {Business need 2}
- {Business need 3}

**Technical Requirements:**
- {Technical constraint 1}
- {Technical constraint 2}
- {Technical constraint 3}

---

## Core Philosophy

{Optional: Key design principles or architectural decisions guiding this epic}

### {Principle 1 Name}
{Description}

### {Principle 2 Name}
{Description}

---

## Reference Implementations

{Optional: Link to proof-of-concepts, research, or prior art}

### {Reference 1 Name}
- **Location:** `path/to/reference/code.py`
- **Proven features:**
  - Feature 1
  - Feature 2

---

## Stories

### **Story {NUMBER}.1: {STORY_NAME}** 🔥 **{PRIORITY}**
**Status:** {Draft | PLANNING | In Progress | COMPLETE}
**Complexity:** {Low | Medium | High}
**Prerequisites:** {None | Story X.Y}

**Goal:** {1 sentence description}

**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**Deliverables:**
- `src/path/to/Component.tsx` - Description (~XXX lines)
- `src/path/to/utility.ts` - Description (~XXX lines)

**Reuse:**
- ✅ {Existing component/utility to reuse}
- ✅ {Existing pattern to follow}

---

### **Story {NUMBER}.2: {STORY_NAME}**
**Status:** {Status}
**Complexity:** {Complexity}
**Prerequisites:** {Prerequisites}

**Goal:** {Goal}

{Repeat structure from Story 1}

---

## Component Reuse Strategy

{Optional: Document shared infrastructure and module-specific code}

### Shared Infrastructure (Maximize Reuse)
- ✅ **{Component 1}** → Used by X, Y, Z
- ✅ **{Component 2}** → Consistent pattern across all modules
- ✅ **{Utility 1}** → Shared by all features

### Module-Specific Code (Minimal Duplication)
- 🆕 **{New Component}** - Epic-specific functionality
- 🆕 **{New Utility}** - Epic-specific data

---

## Technical Architecture

{Optional but recommended: High-level design diagrams, code examples, data flow}

### {Architecture Component 1}

```typescript
// Example code structure
interface ExampleInterface {
  property1: string;
  property2: number;
}

class ExampleClass {
  // Implementation pattern
}
```

### {Architecture Component 2}

{Diagram, flow chart, or sequence description}

---

## Integration Strategy

{Optional: Phased rollout plan}

**Phase 1 - Foundation** (Stories X.1-X.2):
- Deliverable 1
- Deliverable 2

**Phase 2 - Core Features** (Stories X.3-X.4):
- Deliverable 3
- Deliverable 4

**Phase 3 - Enhancements** (Stories X.5+):
- Deliverable 5
- Deliverable 6

---

## Success Metrics

{Measurable criteria to validate epic completion}

### Story {NUMBER}.1 ({Story Name})
- [ ] Success criterion 1
- [ ] Success criterion 2
- [ ] Performance benchmark met (e.g., <50ms latency)

### Story {NUMBER}.2 ({Story Name})
- [ ] Success criterion 1
- [ ] Success criterion 2

### Overall Epic Success
- [ ] All stories COMPLETE
- [ ] Integration tests passing
- [ ] No regressions in existing features
- [ ] Performance targets met
- [ ] Documentation complete

---

## Future Enhancements (Post-MVP)

{Optional: Ideas for future iterations beyond this epic}

### {Enhancement 1}
{Description}

### {Enhancement 2}
{Description}

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| {YYYY-MM-DD} | 1.0 | Initial epic creation | {Author Name} |
| {YYYY-MM-DD} | 1.1 | {Change description} | {Author Name} |

---

## Next Steps

1. **Story {NUMBER}.1** - {Action item}
2. **Story {NUMBER}.2** - {Action item}
3. **Integration** - {Action item}

---

## Template Instructions

**Before removing this section:**

1. **Replace all {PLACEHOLDERS}**:
   - `{NUMBER}` - Epic number (e.g., 4, 9, 12)
   - `{EPIC_NAME}` - Descriptive name (e.g., "Global Music Controls & State Management")
   - `{STORY_NAME}` - Short story name
   - `{YYYY-MM-DD}` - Date in ISO format

2. **Remove optional sections** if not applicable:
   - Core Philosophy
   - Reference Implementations
   - Component Reuse Strategy
   - Technical Architecture (recommended to keep)
   - Integration Strategy
   - Future Enhancements

3. **Update Status** as stories progress:
   - PLANNING: No stories started
   - IN PROGRESS: 1+ stories in progress or complete
   - COMPLETE: All stories complete

4. **Add stories** as needed (copy Story template structure)

5. **Populate Success Metrics** with specific, measurable criteria

6. **Update Change Log** with each significant revision

7. **Link from PRD**: Add epic to `docs/prd/index.md` table of contents

8. **Delete this "Template Instructions" section** when epic is ready

---

**Template Version:** 2.0 (2025-01-13)
**Based on:** Epic 9 structure with documentation standards 2.0 compliance
