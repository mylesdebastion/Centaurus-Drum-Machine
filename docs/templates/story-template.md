# Story {EPIC}.{STORY}: {STORY_NAME}

## Status
{Draft | PLANNING | Ready for Development | In Progress | Ready for Review | COMPLETE | BLOCKED}

## Story
**As a** {user role},
**I want** {goal},
**so that** {business value}.

## Acceptance Criteria
1. {Deliverable 1}
2. {Deliverable 2}
3. {Deliverable 3}
4. {Deliverable 4}
5. {Deliverable 5}
6. {Deliverable 6}

## Integration Verification
- **IV1**: {Cross-component integration test 1}
- **IV2**: {Cross-component integration test 2}
- **IV3**: {Cross-component integration test 3}

## Tasks / Subtasks

- [ ] **Task 1: {Task Name}** (AC: {Acceptance Criteria numbers this task addresses})
  - [ ] Subtask 1.1
  - [ ] Subtask 1.2
  - [ ] Subtask 1.3

- [ ] **Task 2: {Task Name}** (AC: {AC numbers})
  - [ ] Subtask 2.1
  - [ ] Subtask 2.2
  - [ ] Subtask 2.3

- [ ] **Task 3: {Task Name}** (AC: {AC numbers})
  - [ ] Subtask 3.1
  - [ ] Subtask 3.2

- [ ] **Task 4: Testing** (IV: {IV numbers})
  - [ ] Unit tests for Component A
  - [ ] Unit tests for Component B
  - [ ] Integration test IV1
  - [ ] Integration test IV2
  - [ ] Integration test IV3
  - [ ] Manual testing checklist

## Dev Notes

### Relevant Architecture Context

**Existing Components to Reuse**:
- `{path/to/Component.tsx}` - {Description}
- `{path/to/utility.ts}` - {Description}
- `{path/to/hook.ts}` - {Description}

**Design System References**:
- `{path/to/design-file}` - {What to reference}
- `{tailwind.config.js}` - {Custom styles to use}

**Integration Points**:
- {Component/System 1} - {How this story integrates}
- {Component/System 2} - {How this story integrates}

### Component Structure

{Optional: Code structure example}

```typescript
// Example component structure
interface ComponentProps {
  prop1: string;
  prop2: number;
  onEvent: (data: EventData) => void;
}

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2, onEvent }) => {
  // Implementation pattern
  return (
    <div className="container">
      {/* JSX structure */}
    </div>
  );
};
```

### Key Algorithms

{Optional: Pseudocode or algorithm descriptions}

```typescript
function keyAlgorithm(input: InputType): OutputType {
  // Algorithm steps
  const step1 = processInput(input);
  const step2 = transform(step1);
  return finalizeOutput(step2);
}
```

### Responsive Design Patterns

{Optional: Responsive layout considerations}

**Desktop (>1024px):**
- Layout description
- Component arrangement

**Tablet (768-1024px):**
- Layout description
- Adjustments from desktop

**Mobile (<768px):**
- Layout description
- Simplified UI

### Accessibility Considerations

{Optional but recommended}

- {Accessibility requirement 1}
- {Accessibility requirement 2}
- {Keyboard navigation pattern}
- {Screen reader announcements}

### Testing Strategy

**Unit Tests** (`{ComponentName}.test.tsx`):
- Test case 1
- Test case 2
- Test case 3

**Integration Tests**:
- Integration scenario 1
- Integration scenario 2

**Visual Tests**:
- Screenshot comparison test 1
- Storybook story variants

**Performance Tests**:
- Performance benchmark 1 (target: {X}ms)
- Performance benchmark 2 (target: {Y}fps)

**Testing Standards**:
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Use React Testing Library for component tests
- Minimum {XX}% code coverage

### Performance Considerations

{Optional: Performance targets and optimization notes}

- **Target latency:** {<50ms | <100ms}
- **Rendering performance:** {60fps desktop, 30fps mobile}
- **Memory usage:** {<XXX MB}
- **Bundle size impact:** {<XXX KB}

### Security Considerations

{Optional: Security requirements if applicable}

- {Security requirement 1}
- {Security requirement 2}

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| {YYYY-MM-DD} | 1.0 | Initial story creation | {Author Name (Role)} |
| {YYYY-MM-DD} | 1.1 | {Refinement description} | {Author Name (Role)} |

## Dev Agent Record

### Agent Model Used
_{To be populated by dev agent}_

**Example:**
```
claude-sonnet-4-5-20250929
```

### Debug Log References
_{To be populated by dev agent}_

**Example:**
```
None - Implementation completed without major debugging sessions
```

OR

```
- `logs/debug-2025-01-11.log` lines 234-456 - TypeError in component render
- `logs/debug-2025-01-12.log` lines 89-120 - Performance optimization session
```

### Completion Notes List
_{To be populated by dev agent}_

**Example:**
```
- Created {ComponentName} with full TypeScript interfaces
- Integrated with existing {SystemName} for {purpose}
- Implemented {feature} with {technique} for optimal performance
- Added comprehensive validation for {input type} (range: {X-Y})
- Wrapped {ParentComponent} with {ProviderName} - all routes now have access to {feature}
- Created {XX} comprehensive unit tests covering {test areas}
- Updated {ConfigFile} to include {configuration}
- All tests passing ({XX}/{XX}) with {YY}% coverage
- Verified backward compatibility: {ZZZ} tests passed, existing functionality unchanged
- Dev server confirmed running successfully with {feature} integrated
```

**Required Elements:**
- Brief summary of what was implemented
- Integration points with existing code
- Key technical decisions made
- Testing summary (test count, coverage %)
- Backward compatibility verification
- Any deviations from original story plan

### File List
_{To be populated by dev agent}_

**Example:**
```
**Created:**
- `src/components/{ComponentName}/{ComponentName}.tsx` - Main component implementation (386 lines)
- `src/components/{ComponentName}/subcomponent.tsx` - Subcomponent (120 lines)
- `src/components/{ComponentName}/__tests__/{ComponentName}.test.tsx` - Comprehensive test suite (495 lines)
- `src/hooks/use{HookName}.ts` - Custom hook for {purpose} (89 lines)

**Modified:**
- `src/App.tsx` - Added {feature} integration (5 lines changed)
- `vite.config.ts` - Updated test configuration to include {tests} (3 lines changed)
- `src/types/index.ts` - Added {TypeName} interface (12 lines added)
```

**Required Format:**
- **Created:** section with new files, descriptions, and line counts
- **Modified:** section with changed files, change descriptions, and line counts (if significant)
- Use relative paths from project root
- Include line counts (use `wc -l {file}` or `git show --stat`)

**How to Populate:**

1. **Find implementation commit:**
   ```bash
   git log --grep="Story {EPIC}.{STORY}" --oneline
   ```

2. **Extract file list:**
   ```bash
   git diff --name-status {commit-hash}^..{commit-hash}
   git show {commit-hash} --stat
   ```

3. **Count lines:**
   ```bash
   wc -l {file-path}
   ```

4. **If detail insufficient:** Consult dev agent (`/BMad:agents:dev`)

## QA Results
_{To be populated by QA agent}_

**Example:**
```
**Test Date:** 2025-01-15
**QA Agent:** {Agent Name}
**Environment:** Chrome 120, Firefox 122, Safari 17

**Functional Tests:**
- ✅ AC1: {Acceptance Criteria 1} - PASS
- ✅ AC2: {Acceptance Criteria 2} - PASS
- ✅ AC3: {Acceptance Criteria 3} - PASS

**Integration Tests:**
- ✅ IV1: {Integration Verification 1} - PASS
- ✅ IV2: {Integration Verification 2} - PASS
- ✅ IV3: {Integration Verification 3} - PASS

**Regression Tests:**
- ✅ Existing features unchanged - PASS
- ✅ No console errors - PASS
- ✅ Performance unchanged - PASS

**Cross-Browser Compatibility:**
- ✅ Chrome - PASS
- ✅ Firefox - PASS
- ✅ Safari - PASS
- ⚠️ Edge - Minor styling issue (logged as bug #{XXX})

**Accessibility:**
- ✅ Keyboard navigation - PASS
- ✅ Screen reader compatibility - PASS
- ✅ Color contrast - PASS

**Performance:**
- ✅ Page load <{X}ms - PASS ({Y}ms average)
- ✅ Interaction latency <{Z}ms - PASS ({W}ms average)

**Issues Found:**
- None (or list of bugs logged)

**Overall Status:** ✅ APPROVED FOR PRODUCTION
```

---

## Template Instructions

**Before removing this section:**

1. **Replace all {PLACEHOLDERS}**:
   - `{EPIC}` - Epic number (e.g., 4, 9, 12)
   - `{STORY}` - Story number (e.g., 1, 2, 3)
   - `{STORY_NAME}` - Descriptive name
   - `{user role}` - User persona (e.g., "musician", "developer", "system architect")
   - `{YYYY-MM-DD}` - Date in ISO format

2. **File Naming**:
   - Save as `{EPIC}.{STORY}.story.md` (e.g., `4.2.story.md`)
   - Or `{EPIC}.{STORY}.{description}.story.md` for clarity

3. **Status Updates**:
   - Start: Draft
   - Planning approved: PLANNING
   - Development starts: In Progress
   - Code complete: Ready for Review
   - Merged and tested: COMPLETE

4. **Dev Agent Record**:
   - Leave as "_To be populated by dev agent_" until implementation complete
   - Use git diffs to populate after merge
   - Consult dev agent if git history insufficient

5. **QA Results**:
   - Leave as "_To be populated by QA agent_" until testing complete
   - QA agent runs tests and fills this section

6. **Optional Sections**:
   - Remove if not applicable:
     - Component Structure
     - Key Algorithms
     - Responsive Design Patterns
     - Performance Considerations
     - Security Considerations

7. **Link from Epic**:
   - Add story to parent epic's Stories section
   - Update epic status when story starts/completes

8. **Delete this "Template Instructions" section** when story is ready

---

**Template Version:** 2.0 (2025-01-13)
**Based on:** Story 4.1 structure with documentation standards 2.0 compliance
