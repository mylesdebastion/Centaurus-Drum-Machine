# Legacy Testing Documentation

**Status**: Archived (2025-10-25)
**Reason**: Pre-dates BMAD QA framework

## Contents

This directory contains manual test scenarios from before the BMAD QA framework was implemented:

- `epic-18-test-scenarios.md` - Manual test scenarios for Epic 18
- `epic-7-story-7.3-manual-testing.md` - Manual testing documentation for Epic 7, Story 7.3

## Migration to BMAD QA Framework

The BMAD QA framework now provides:
- **Quality Gates**: `docs/qa/gates/` - Pass/Concerns/Fail decisions
- **Test Design**: `.bmad-core/tasks/test-design.md` - Systematic test scenario generation
- **Requirements Tracing**: `.bmad-core/tasks/trace-requirements.md` - Given-When-Then mapping
- **UX Persona Testing**: `.bmad-core/tasks/ux-persona-review.md` - Visual persona-driven UX critique

## Accessing BMAD QA Features

```bash
@qa *help                          # See all QA commands
@qa *review {story}                # Comprehensive story review
@qa *test-design {story}           # Generate test scenarios
@qa *ux-review {story} --persona=m # UX persona review
```

## Historical Context

These files represent early manual testing efforts before the systematic QA framework was established. They remain for historical reference but are no longer actively maintained.

**Canonical QA location**: `docs/qa/`
