# Epic 16: Unified Studio Module UI Template

**Status:** 📝 **PLANNING**
**Epic Type:** Brownfield Enhancement
**Priority:** Medium
**Target Completion:** Q1 2025
**Product Owner:** Sarah
**Related Epics:**
- Epic 4 (Global Music Controls - Transport state integration)
- Epic 5 (Universal Responsive Architecture - Responsive patterns)
- Epic 15 (Chord & Melody Arranger - Reference implementation)

---

## Epic Goal

Establish a consistent, accessible, and responsive UI template for all Studio modules by extracting the successful ChordMelodyArranger header/settings pattern into a reusable component system, then applying it to existing modules (DrumMachine, PianoRoll, GuitarFretboard, LiveAudioVisualizer, IsometricSequencer).

---

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Studio system supports 6 modules: Piano Roll, Guitar Fretboard, Drum Machine, DJ Visualizer, 3D Sequencer, Chord & Melody Arranger
- ChordMelodyArranger module (Epic 15) implements a well-designed UI pattern:
  - Header bar with icon, title, subtitle (left), settings gear cog (right)
  - Transport controls row (play/pause/stop buttons) below header
  - Slide-up settings panel at bottom (triggered by gear icon)
  - Responsive design that works at different column widths (mobile/desktop layout prop)
- Other modules use inconsistent UI patterns (some have settings, some don't; varying header structures)
- All modules integrate with GlobalMusicContext for tempo/key/scale

**Technology stack:**
- React 18.2 + TypeScript 5.2
- Tailwind CSS for styling
- Lucide React for icons
- Existing `ModuleComponentProps` interface (layout, settings, onSettingsChange)

**Integration points:**
- Studio ModuleCanvas renders modules with layout prop
- GlobalMusicContext provides transport state (isPlaying, tempo)
- Module wrapper (ModuleWrapper.tsx) provides module chrome

### Enhancement Details

**What's being added/changed:**
1. **Extract reusable module UI template components:**
   - `ModuleHeader.tsx` - Icon, title, subtitle, header actions (settings gear)
   - `ModuleTransportControls.tsx` - Play/pause/stop buttons with GlobalMusicContext integration
   - `ModuleSettingsPanel.tsx` - Collapsible slide-up settings panel
   - `useModuleUI.ts` - Hook for managing settings panel state

2. **Update all 6 modules to use new template:**
   - ChordMelodyArranger - Already compliant, migrate to extracted components
   - DrumMachineModule - Add consistent header, settings panel
   - PianoRoll - Add consistent header, settings panel
   - GuitarFretboard - Add consistent header, settings panel
   - LiveAudioVisualizer - Add consistent header, settings panel
   - IsometricSequencer - Add consistent header, settings panel

3. **Establish module UI conventions:**
   - All modules have settings gear icon (top right)
   - Transport controls (if applicable) appear in row below header
   - Settings panel slides up from bottom (not inline)
   - Responsive behavior: header remains visible, content area adjusts

**How it integrates:**
- Modules import `ModuleHeader`, `ModuleTransportControls`, `ModuleSettingsPanel` from `components/Studio/shared/`
- Each module provides its own settings content as children to `ModuleSettingsPanel`
- GlobalMusicContext integration remains unchanged (useGlobalMusic hook)
- Module wrapper and registry unchanged (no breaking changes)

**Success criteria:**
- All 6 Studio modules follow consistent UI pattern
- Settings panel behavior is uniform (slide-up, collapsible)
- Accessibility maintained (44px touch targets, ARIA labels)
- Responsive design works across all breakpoints
- No breaking changes to existing module functionality

---

## Stories

### **Story 16.1: Extract Module UI Template Components**
Extract ChordMelodyArranger UI pattern into reusable template components in `src/components/Studio/shared/` for module headers, transport controls, and settings panels.

### **Story 16.2: Migrate ChordMelodyArranger to Template**
Refactor ChordMelodyArranger to use new template components, ensuring no functional changes while validating template API design.

### **Story 16.3: Apply Template to Remaining Modules**
Update DrumMachineModule, PianoRoll, GuitarFretboard, LiveAudioVisualizer, and IsometricSequencer to use unified module UI template, adding consistent headers and settings panels.

---

## Compatibility Requirements

- [x] Existing module APIs remain unchanged (ModuleComponentProps interface preserved)
- [x] GlobalMusicContext integration unchanged (transport state, tempo, key/scale)
- [x] Module registry unchanged (no new module definitions)
- [x] Responsive layout prop behavior preserved (mobile/desktop)
- [x] Performance impact is minimal (no additional re-renders)

---

## Risk Mitigation

**Primary Risk:** Breaking existing module functionality during refactor
**Mitigation:**
- Start with ChordMelodyArranger migration (Story 16.2) to validate template API
- Manual testing of each module after template application
- Incremental rollout (one module at a time in Story 16.3)
- Keep original module code commented out until verification complete

**Rollback Plan:**
- Each module migration is isolated (can revert individual modules)
- Git commit after each module migration for easy rollback
- Template components are additive (can be removed without breaking modules)

---

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] All 6 Studio modules use ModuleHeader, ModuleTransportControls, ModuleSettingsPanel
- [x] Settings panel behavior is consistent across all modules
- [x] Manual browser testing confirms responsive behavior (mobile/desktop)
- [x] No regression in existing module functionality
- [x] Accessibility verified (keyboard navigation, ARIA labels, touch targets)
- [x] Code follows existing Tailwind component patterns from CLAUDE.md

---

## Validation Checklist

### Scope Validation
- [x] Epic can be completed in 3 stories maximum ✓
- [x] No architectural documentation required ✓
- [x] Enhancement follows existing patterns (Epic 15 ChordMelodyArranger) ✓
- [x] Integration complexity is manageable ✓

### Risk Assessment
- [x] Risk to existing system is low (template components are optional, modules can be migrated incrementally) ✓
- [x] Rollback plan is feasible (git revert per module) ✓
- [x] Testing approach covers existing functionality (manual verification of all module features) ✓
- [x] Team has sufficient knowledge of integration points (ModuleComponentProps, GlobalMusicContext) ✓

### Completeness Check
- [x] Epic goal is clear and achievable ✓
- [x] Stories are properly scoped (extract → migrate reference → apply to rest) ✓
- [x] Success criteria are measurable ✓
- [x] Dependencies are identified (Epic 4, 5, 15 as references) ✓

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running React 18.2 + TypeScript 5.2 + Tailwind CSS
- Integration points:
  - Studio ModuleCanvas (renders modules with layout prop)
  - GlobalMusicContext (provides transport state)
  - ModuleComponentProps interface (standard module props)
- Existing patterns to follow:
  - ChordMelodyArranger module header (lines 158-276 in ChordMelodyArranger.tsx)
  - Tailwind @layer components pattern (CLAUDE.md UX standards)
  - Lucide React icons for all iconography
- Critical compatibility requirements:
  - ModuleComponentProps interface unchanged
  - GlobalMusicContext integration unchanged
  - Responsive layout prop behavior preserved (mobile/desktop)
- Each story must include verification that existing module functionality remains intact (no regressions)

The epic should maintain system integrity while delivering consistent, accessible module UI across all 6 Studio modules."

---

## Technical Notes

**Reference Implementation:**
- `src/components/Studio/modules/ChordMelodyArranger/ChordMelodyArranger.tsx` (lines 158-276)
  - Header structure (lines 158-191)
  - Transport controls (lines 194-219)
  - Settings panel (lines 250-276)

**Target Modules for Migration:**
1. ChordMelodyArranger - Migrate to extracted components (validation)
2. DrumMachineModule - Add header + settings panel
3. PianoRoll - Add header + settings panel
4. GuitarFretboard - Add header + settings panel
5. LiveAudioVisualizer - Add header + settings panel
6. IsometricSequencer - Add header + settings panel

**Template Components Location:**
- `src/components/Studio/shared/ModuleHeader.tsx`
- `src/components/Studio/shared/ModuleTransportControls.tsx`
- `src/components/Studio/shared/ModuleSettingsPanel.tsx`
- `src/components/Studio/shared/useModuleUI.ts`

**Design Tokens (from ChordMelodyArranger):**
- Header background: `border-b border-gray-700`
- Transport controls: `bg-gray-850`
- Settings panel: `border-t border-gray-700 bg-gray-850`
- Buttons: `min-h-[44px] min-w-[44px]` (accessibility)
- Primary action: `bg-primary-600 hover:bg-primary-700`
- Secondary action: `bg-gray-700 hover:bg-gray-600`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-14 | 1.0 | Initial epic creation - Unified Studio Module UI Template | Sarah (PO) |

---

## Next Steps

1. **Story Refinement** - Create detailed story documents (16.1-16.3)
2. **Design Validation** - Review extracted template components API design
3. **Module Inventory** - Document existing module UI patterns for migration planning
4. **Developer Handoff** - Present epic to dev team, begin Story 16.1 implementation
