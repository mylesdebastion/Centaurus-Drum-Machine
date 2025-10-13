# Epic 14: Module Adapter System & Global State Integration

**Status:** 🚧 PLANNING
**Priority:** High
**Target Completion:** Q1 2025
**Architect:** Winston
**Related Epics:** Epic 4 (Global Music Controls - Foundation), Epic 13 (Documentation Infrastructure)

---

## Epic Overview

**Vision:** Transform the brownfield module system from duplicate local state to a unified greenfield architecture where modules intelligently adapt to their context (standalone vs. Studio/Jam) and consume global musical parameters (tempo, key, scale, color mode, transport state) from GlobalMusicContext.

**Business Requirements:**
- Eliminate duplicate controls across 5 modules (PianoRoll, GuitarFretboard, IsometricSequencer have local key/scale/tempo selectors)
- Enable multi-module workflows in Studio/Jam with synchronized musical parameters
- Preserve standalone view functionality (users share direct links like `/piano` for demos)
- Support professional DAW-style global transport (play/pause) with module flexibility

**Technical Requirements:**
- Create module adapter pattern for context detection (standalone vs. embedded)
- Extend GlobalMusicContext with transport state (play/pause)
- Refactor 5 modules to consume global state with graceful degradation
- Maintain always-mount pattern for audio persistence (no unmount/remount clicks)

---

## Problem Statement

**Current State (Brownfield):**
- **PianoRoll**: Local key/scale/color mode state, not integrated with GlobalMusicContext
- **GuitarFretboard**: Uses `useMusicalScale` hook locally, duplicate controls
- **IsometricSequencer**: Local tempo/BPM slider, key/scale selector, harmonic mode toggle
- **DrumMachine**: Partially integrated (uses global tempo/colorMode via DrumMachineModule wrapper)
- **Studio/Jam**: No global play/pause, modules play independently

**Target State (Greenfield):**
- All modules consume global tempo/key/scale/color mode from GlobalMusicContext
- Modules detect context (standalone vs. Studio/Jam) and hide redundant controls when embedded
- Global transport state (play/pause) in GlobalMusicHeader synchronizes all sequencer modules
- Standalone views continue functioning with local state fallback (no breaking changes)

**Gap Analysis:**
- 3 modules need full refactoring (Piano, Guitar, Isometric)
- 1 module needs completion (DrumMachine - transport state integration)
- 1 module optional (LiveAudioVisualizer - global volume integration)
- GlobalMusicContext needs extension (transport state: isPlaying, updateTransportState)
- GlobalMusicHeader needs transport controls (Play/Pause buttons)

---

## Stories

### **Story 14.1: Brownfield Module System Architecture Design** 🚧 **HIGH**
**Status:** IN PROGRESS
**Complexity:** High
**Prerequisites:** Epic 4 complete, Epic 13 Story 13.1 complete

**Goal:** Create comprehensive architecture document following brownfield-architecture-tmpl.yaml template.

**Progress:**
- ✅ Section 1: Introduction (module analysis, control classification, design principles)
- ✅ Section 2: Enhancement Scope & Integration Strategy
- ⏳ Sections 3-12: Remaining architecture sections

**Deliverables:**
- `docs/architecture/brownfield-module-refactoring.md` (WIP - Sections 1-2 complete)
- `docs/architecture-refactoring-checkpoint.md` (resumability checkpoint)
- `docs/epics/epic-14-module-adapter-system.md` (this file)
- `docs/stories/14.1.story.md` (story file)

---

### **Story 14.2: Module Adapter Pattern Implementation** ⏳ **HIGH**
**Status:** BLOCKED (Story 14.1 must complete)
**Complexity:** Medium

**Goal:** Implement core module adapter infrastructure (hooks, interfaces, context detection).

**Deliverables:**
- `src/hooks/useModuleContext.ts` - Context detection hook (standalone vs. studio vs. jam)
- `src/types/moduleAdapter.ts` - TypeScript interfaces for module adapter pattern
- Extended `src/contexts/GlobalMusicContext.tsx` - Add transport state (isPlaying, updateTransportState)
- Extended `src/components/GlobalMusicHeader/GlobalMusicHeader.tsx` - Add Play/Pause buttons
- Unit tests for useModuleContext hook

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 5 (Component Architecture) when complete

---

### **Story 14.3: PianoRoll Global State Integration** ⏳ **HIGH**
**Status:** BLOCKED (Story 14.2 must complete)
**Complexity:** Medium

**Goal:** Refactor PianoRoll to consume GlobalMusicContext with graceful degradation for standalone mode.

**Deliverables:**
- Modified: `src/components/PianoRoll/PianoRoll.tsx` - Use `useGlobalMusic()` for key/scale/tempo/colorMode
- Conditional rendering of local controls (hidden when embedded in Studio/Jam)
- Tests verifying standalone mode still works

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 2.1 (Code Integration Strategy) when complete

---

### **Story 14.4: GuitarFretboard Global State Integration** ⏳ **HIGH**
**Status:** BLOCKED (Story 14.2 must complete)
**Complexity:** Medium

**Goal:** Refactor GuitarFretboard to consume GlobalMusicContext.

**Deliverables:**
- Modified: `src/components/GuitarFretboard/GuitarFretboard.tsx`
- Remove local `useMusicalScale` hook usage, consume global state
- Tests verifying standalone mode preservation

**Fill this out based on:** Same pattern as Story 14.3

---

### **Story 14.5: IsometricSequencer Global State Integration** ⏳ **HIGH**
**Status:** BLOCKED (Story 14.2 must complete)
**Complexity:** Medium

**Goal:** Refactor IsometricSequencer to consume GlobalMusicContext.

**Deliverables:**
- Modified: `src/components/IsometricSequencer/IsometricSequencer.tsx`
- Remove local tempo/key/scale/harmonic mode state
- Tests verifying standalone mode preservation

**Fill this out based on:** Same pattern as Story 14.3

---

### **Story 14.6: Global Transport State Implementation** ⏳ **MEDIUM**
**Status:** BLOCKED (Stories 14.3-14.5 must complete)
**Complexity:** Medium

**Goal:** Integrate global transport state (play/pause) with all modules, handle edge cases (visualizers continue running).

**Deliverables:**
- Modified: `src/components/DrumMachine/DrumMachine.tsx` - Listen to global transport state
- Modified modules (Piano, Guitar, Isometric) - Respond to global play/pause
- Edge case handling: LiveAudioVisualizer always runs regardless of transport state
- Transport control UI in GlobalMusicHeader

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 1 (Design Principle #1: Global Transport Control) when complete

---

### **Story 14.7: LED Compositor Implementation** 🆕 **HIGH**
**Status:** NEW - Promoted from post-MVP to core Epic 14
**Complexity:** Medium-High
**Prerequisites:** Story 14.2 (Module Adapter) must complete
**Blocks:** Stories 14.3-14.5 (modules need compositor API)
**Design Document:** `docs/architecture/led-compositor-design.md`

**Goal:** Implement LED Compositor Service that blends multiple module outputs onto limited LED hardware using visual compositing (multiply/screen blending modes).

**Business Value:**
- Users with 1-2 LED strips can see multiple visualizations simultaneously (Piano notes + Audio ripples)
- Prevents information loss from priority-based routing
- Compatibility detection prevents confusing output (Piano + Guitar warning)

**Deliverables:**
- `src/services/LEDCompositor.ts` (~250 lines) - Compositor service with frame blending
- `src/types/ledFrame.ts` (~30 lines) - LEDFrame interface
- `src/types/visualizationMode.ts` (~60 lines) - VisualizationMode enum + compatibility matrix
- `src/types/blendMode.ts` (~50 lines) - BlendMode type + blendPixels function
- Blending mode UI controls in GlobalMusicHeader (~30 lines)
- Compatibility warning UI component (~40 lines)
- **Total:** ~460 lines of new code

**Acceptance Criteria:**
1. ✅ LEDCompositor service functional (submitFrame, checkCompatibility, compositeFrames methods)
2. ✅ 4 blending modes implemented (multiply, screen, additive, max)
3. ✅ Compatibility detection working (COMPATIBILITY_MATRIX enforced)
4. ✅ UI controls for blend mode selection
5. ✅ Warning UI when incompatible visualizations detected
6. ✅ Manual verification: Piano + Audio ripple blending (both visible simultaneously)
7. ✅ Manual verification: Piano + Guitar incompatibility warning shown

**Estimated Effort:** 8-10 hours

**Note:** Audio Input Mode toggle deferred to Epic 15+ (existing `/dj-visualizer` work needs review, global vs. local planning required, MIDI note input support missing). See design document Section A.6 for details.

---

## Technical Architecture

### Module Adapter Pattern

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 5 (Component Architecture) when complete

**Placeholder Summary:**
- `useModuleContext()` hook detects context via React Router `useLocation`
- Modules use conditional logic: `const key = context === 'standalone' ? localKey : globalMusic.key`
- Local controls hidden when `context !== 'standalone'`
- No prop drilling (context detection is internal to each module)

### GlobalMusicContext Extension

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 4 (Data Models) when complete

**Placeholder Summary:**
```typescript
// Existing (Epic 4)
interface GlobalMusicState {
  tempo: number;
  key: RootNote;
  scale: ScaleName;
  colorMode: 'chromatic' | 'harmonic';
  masterVolume: number;
  // ... hardware state
}

// NEW (Epic 14)
interface GlobalMusicState {
  // ... existing fields
  isPlaying: boolean; // NEW: Global transport state
  updateTransportState: (playing: boolean) => void; // NEW
}
```

### Integration Strategy

**Fill this out based on:** `docs/architecture/brownfield-module-refactoring.md` Section 2 (Enhancement Scope & Integration Strategy) - COMPLETE

**Summary from Section 2:**
- **Pattern:** Gradual migration with context detection
- **Phase 1:** PianoRoll, GuitarFretboard, IsometricSequencer (high priority)
- **Phase 2:** DrumMachine completion (transport state)
- **Phase 3:** LiveAudioVisualizer (optional - global volume)
- **Backward Compatibility:** Full - standalone views use local state fallback
- **Performance Impact:** Low - existing Epic 4 optimizations (memoization, debouncing)

---

## Success Metrics

### Story 14.1 (Architecture Design)
- [x] Module inventory & control analysis (5 modules catalogued)
- [x] Control classification (global vs. local vs. TBD)
- [x] Design principles established (4 principles)
- [ ] Complete architecture document (Sections 3-12 pending)

### Story 14.2 (Module Adapter Implementation)
- [ ] `useModuleContext()` hook created and tested
- [ ] GlobalMusicContext extended with transport state
- [ ] GlobalMusicHeader has transport controls (Play/Pause buttons)
- [ ] Unit tests pass (module context detection)

### Stories 14.3-14.5 (Module Refactoring)
- [ ] 3 modules refactored (PianoRoll, GuitarFretboard, IsometricSequencer)
- [ ] Duplicate controls eliminated (key/scale/tempo/color mode)
- [ ] Standalone views preserved (no breaking changes)
- [ ] Integration tests pass (global state synchronization)

### Story 14.6 (Global Transport)
- [ ] Global play/pause synchronizes all modules
- [ ] Edge cases handled (visualizers continue running)
- [ ] Performance maintained (no audio clicks on transport changes)

### Story 14.7 (LED Compositor) - NEW
- [ ] LEDCompositor service functional with 4 blending modes
- [ ] Compatibility detection prevents incompatible visualizations
- [ ] UI controls for blend mode selection
- [ ] Warning UI when incompatible modes detected
- [ ] Manual verification: Piano + Audio ripple blending works
- [ ] Manual verification: Piano + Guitar incompatibility warning shown

### Overall Epic Success
- [ ] All 7 stories COMPLETE (was 6, added Story 14.7)
- [ ] Studio/Jam have synchronized musical parameters
- [ ] Standalone views function identically to pre-refactoring
- [ ] LED compositing enables multi-visualization on limited hardware
- [ ] Documentation debt addressed (12 components added to source-tree.md)
- [ ] Zero breaking changes to existing routes

---

## Open Questions & Resolutions

**✅ RESOLVED (2025-10-13 - Stakeholder Feedback from Myles):**

1. **LED Routing Strategy** - ✅ **RESOLVED:** LED Compositor Service with visual blending
   - **Decision:** Multiple modules submit LED frames to compositor, which blends them using multiply/screen modes
   - **Rationale:** Users want to see multiple visualizations simultaneously (Piano notes + Audio ripples), not choose which "wins"
   - **Implementation:** Story 14.7 (LED Compositor Implementation)
   - **Design Document:** `docs/architecture/led-compositor-design.md`

2. **Hardware Sharing (MIDI/WLED)** - ✅ **RESOLVED:** Compatibility detection with toggle mode fallback
   - **Decision:** Compatibility matrix checks visualization modes, prevents incompatible blending (Piano 88 LEDs + Guitar 150 LEDs)
   - **Rationale:** Incompatible addressing schemes create confusing output, must be prevented
   - **Implementation:** Story 14.7 (Compatibility matrix in `visualizationMode.ts`)

**⏸️ DEFERRED to Future Epics:**

3. **Chord Progression System** - ⏸️ **Epic 15+:** Global "chord mode" vs. module-specific content?
   - **Reason:** Separate feature domain, warrants dedicated epic for chord progression features

4. **Transport Edge Cases** - ⏸️ **Partial Resolution:** Visualizers always-on (ignore transport state)
   - **Resolved:** Visualizers continue running when global transport paused (Story 14.6)
   - **Deferred:** Module-level play override behavior (prototype current assumptions, gather user feedback)

5. **Audio Input Mode** - ⏸️ **Epic 15+:** Show Live Audio vs. Clean Triggers Only
   - **Reason:** Existing `/dj-visualizer` work needs review, global vs. local planning required, MIDI note input support missing
   - **Design Note:** See `docs/architecture/led-compositor-design.md` Section A.6

---

## Dependencies

**Builds On:**
- ✅ Epic 4: Global Music Controls (Stories 4.1-4.7 COMPLETE)
  - GlobalMusicContext implementation (Story 4.1)
  - GlobalMusicHeader component (Story 4.2)
  - Audio engine persistence (Story 4.3)
  - Hardware I/O integration (Story 4.4)
  - Color mapping system (Story 4.5)
  - View integration patterns (Story 4.6)
  - Module loading system (Story 4.7)

**Coordinates With:**
- 🚧 Epic 13: Documentation Infrastructure (Story 13.2 IN PROGRESS)
  - Epic/story consolidation (Epics 1-4 moving to docs/epics/)
  - Architecture docs update (12 components need documentation)
  - This epic will add module adapter architecture to component-architecture.md

**Blocks:**
- Future multi-user collaboration features (Epic 6 - requires global state foundation)
- Hardware orchestration enhancements (requires module adapter pattern)

---

## Related Documentation

**Architecture Documents:**
- `docs/architecture/brownfield-module-refactoring.md` - **PRIMARY DOCUMENT** (Story 14.1 deliverable, Sections 1-12 COMPLETE)
- `docs/architecture/led-compositor-design.md` - **LED COMPOSITOR DESIGN** (Story 14.7 deliverable, NEW - 2025-10-13)
- `docs/architecture-refactoring-checkpoint.md` - Session checkpoint for resumability (if needed)
- `docs/architecture/component-architecture.md` - Will be updated with module adapter pattern

**Epic 4 Foundation:**
- `docs/prd/epic-4-global-music-controls.md` - Foundation this builds on
- `docs/stories/4.1.story.md` through `4.7.story.md` - All COMPLETE

**Epic 13 Coordination:**
- `docs/epics/epic-13-documentation-infrastructure.md` - Parallel documentation work
- `docs/reconciliation-audit.md` - Documentation gaps this epic addresses

**Module Analysis:**
- See `docs/architecture/brownfield-module-refactoring.md` Section 1 for complete module inventory

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-13 | 1.0 | Initial epic creation - Module Adapter System & Global State Integration | Winston (Architect) |

---

## Next Steps

1. **Complete Story 14.1** - Finish architecture document Sections 3-12
2. **Create Stories 14.2-14.6** - Detail implementation stories based on completed architecture
3. **Coordinate with Epic 13** - Ensure architecture additions align with documentation consolidation
4. **Product Owner Research** - Get user stories for LED routing, hardware sharing, chord progression sync (TBD questions)
5. **Developer Handoff** - Present architecture to dev team, begin Story 14.2 implementation
