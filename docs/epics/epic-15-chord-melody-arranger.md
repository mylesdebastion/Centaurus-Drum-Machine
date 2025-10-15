# Epic 15: Chord Progression & Melody Arranger Module

**Status:** 📝 **PLANNING**
**Priority:** High
**Target Completion:** Q1 2025
**Product Owner:** Sarah
**Related Epics:**
- Epic 4 (Global Music Controls - Foundation)
- Epic 9 (Multi-Instrument MIDI Visualization - Guitar Fretboard chord progressions)
- Epic 14 (Module Adapter System - Module routing patterns)

---

## Epic Overview

**Vision:** Transform the existing guitar fretboard chord progression feature into a standalone Studio module with melody arranger capabilities and intelligent module routing, enabling users to compose chord progressions and melodies that automatically sync with global musical parameters and can be sent to any loaded instrument module.

**Business Requirements:**
- Extract chord progression system from GuitarFretboard into reusable Studio module
- Add melody arranger component for creating melodic sequences
- Enable module-to-module routing (send chords/melodies to Piano, Guitar, Drum, etc.)
- Respect global key/scale/tempo from GlobalMusicContext (Epic 4)
- Preserve legacy standalone /piano and /guitar routes (no breaking changes)
- Professional composer workflow (like Ableton's MIDI clip editor)

**Technical Requirements:**
- Create ChordMelodyArranger module with chord builder and melody sequencer
- Implement module routing system (output destination selection via UI)
- Integrate with GlobalMusicContext for key/scale/tempo synchronization
- Register new module in Studio moduleRegistry
- MIDI output to selected target modules (Piano, Guitar, Drum, etc.)
- Support for Roman numeral progressions (adaptable to any key)

---

## Problem Statement

**Current State (Brownfield):**
- **GuitarFretboard**: Has comprehensive chord progression library (chordProgressions.ts, romanNumeralConverter.ts)
- **Chord system is tightly coupled**: Only accessible via /guitar route, not reusable in Studio
- **No melody arranger**: Users can only create chords, not melodic sequences
- **No module routing**: Cannot send chord/melody output to other loaded modules
- **Standalone routes**: /piano and /guitar work independently, no module-to-module communication

**Target State (Greenfield):**
- **ChordMelodyArranger module**: Loadable in Studio alongside Piano, Guitar, Drum, etc.
- **Chord progression builder**: Visual chord selection UI with genre-based presets
- **Melody arranger**: Step sequencer for creating melodies that respect global scale
- **Module routing system**: Icon-based UI to select output destination (Piano, Guitar, etc.)
- **GlobalMusicContext integration**: Chords/melodies adapt to global key/scale/tempo changes
- **Legacy preservation**: /guitar and /piano routes remain unchanged (standalone mode)

**Gap Analysis:**
- Need to extract chord progression logic into reusable service layer
- Need to create new ChordMelodyArranger component
- Need to implement melody sequencer UI (note grid, step editor)
- Need to build module routing system (output destination selector)
- Need MIDI/note event dispatching to target modules
- Need module registry integration for Studio loading

---

## Stories

### **Story 15.1: Chord Progression Service Extraction** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 4-6 hours
**Prerequisites:** None

**Goal:** Extract chord progression logic from GuitarFretboard into reusable service layer that can be consumed by both GuitarFretboard (backward compatibility) and new ChordMelodyArranger module.

**Acceptance Criteria:**
1. Create `src/services/chordProgressionService.ts`
   - Export `ChordProgressionService` class
   - Methods: `getProgressionsByGenre()`, `resolveRomanNumerals()`, `transposeChords()`, `getChordNotes()`
2. Refactor GuitarFretboard to use new service (no breaking changes)
3. Service respects GlobalMusicContext key/scale
4. TypeScript interfaces for ChordProgression, Chord, ChordNote
5. Unit tests (manual verification via browser)

**Deliverables:**
- `src/services/chordProgressionService.ts` (~300 lines)
- `src/types/chordProgression.ts` (~80 lines) - Shared types
- Updated GuitarFretboard imports (backward compatible)

---

### **Story 15.2: ChordMelodyArranger Module UI** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** High
**Time Estimate:** 8-10 hours
**Prerequisites:** Story 15.1

**Goal:** Create ChordMelodyArranger Studio module with chord builder UI and basic module structure.

**Acceptance Criteria:**
1. Create `src/components/Studio/modules/ChordMelodyArranger/ChordMelodyArranger.tsx`
   - Chord progression builder UI (genre dropdown, progression list)
   - Chord sequence timeline (4/8/16 bar grid)
   - Placeholder for melody arranger (Story 15.3)
   - Module chrome (header, settings panel)
2. Integrate ChordProgressionService for chord selection
3. Visual chord display (chord names, Roman numerals)
4. Play/pause controls (respects GlobalMusicContext transport state)
5. Responsive layout (mobile/desktop)

**Deliverables:**
- `src/components/Studio/modules/ChordMelodyArranger/ChordMelodyArranger.tsx` (~400 lines)
- `src/components/Studio/modules/ChordMelodyArranger/ChordBuilder.tsx` (~200 lines)
- `src/components/Studio/modules/ChordMelodyArranger/ChordTimeline.tsx` (~150 lines)

---

### **Story 15.3: Melody Arranger Component** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** High
**Time Estimate:** 8-10 hours
**Prerequisites:** Story 15.2

**Goal:** Add melody arranger component to ChordMelodyArranger module - step sequencer for creating melodic sequences.

**Acceptance Criteria:**
1. Create `MelodySequencer.tsx` component
   - Piano roll-style note grid (vertical: notes, horizontal: steps)
   - 16-step sequencer (extendable to 32/64 steps)
   - Note input via click/touch (add/remove notes)
   - Velocity control (note intensity)
   - Note length adjustment (gate)
2. Scale-aware note grid
   - Only show notes in current GlobalMusicContext scale
   - Gray out non-scale notes (chromatic mode)
   - Auto-snap to scale notes
3. Playback synchronization
   - Respect global tempo (BPM from GlobalMusicContext)
   - Loop 16-step sequence
   - Visual playback cursor
4. Integration with chord progression
   - Melody plays over selected chord progression
   - Chord changes highlighted in timeline

**Deliverables:**
- `src/components/Studio/modules/ChordMelodyArranger/MelodySequencer.tsx` (~350 lines)
- `src/components/Studio/modules/ChordMelodyArranger/NoteGrid.tsx` (~200 lines)
- Scale filtering logic integrated with GlobalMusicContext

---

### **Story 15.4: Module Routing System** 🔴 **CRITICAL**
**Status:** PLANNING
**Complexity:** High
**Time Estimate:** 6-8 hours
**Prerequisites:** Story 15.2

**Goal:** Implement module-to-module routing system allowing ChordMelodyArranger to send MIDI/note events to any loaded Studio module (Piano, Guitar, Drum, etc.).

**Acceptance Criteria:**
1. Create `src/services/moduleRoutingService.ts`
   - `ModuleRoutingService` class
   - Methods: `registerModule()`, `unregisterModule()`, `routeNoteEvent()`, `getAvailableTargets()`
   - Event bus for inter-module communication
2. Output destination selector UI
   - Icon-based module selector (Piano icon, Guitar icon, etc.)
   - Multi-select capability (send to multiple modules)
   - Visual routing indicators (active connections)
3. Note event dispatching
   - Convert chord/melody to MIDI note events
   - Dispatch to selected target modules
   - Respect target module's note range (Guitar: 6 strings, Piano: 88 keys)
4. Module registry integration
   - Query loaded modules from Studio
   - Filter by category (instruments only, exclude visualizers)
   - Dynamic updates when modules load/unload

**Deliverables:**
- `src/services/moduleRoutingService.ts` (~250 lines)
- `src/types/moduleRouting.ts` (~60 lines) - Event interfaces
- `src/components/Studio/modules/ChordMelodyArranger/OutputSelector.tsx` (~150 lines)
- Updated moduleRegistry.ts with routing metadata

---

### **Story 15.5: GlobalMusicContext Integration** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 3-4 hours
**Prerequisites:** Stories 15.2, 15.3

**Goal:** Integrate ChordMelodyArranger with GlobalMusicContext to ensure chords and melodies automatically adapt to global key/scale/tempo changes.

**Acceptance Criteria:**
1. Hook into GlobalMusicContext
   - Use `useGlobalMusic()` hook
   - Subscribe to key/scale/tempo changes
   - Auto-transpose chords when key changes
   - Re-filter melody notes when scale changes
2. Tempo synchronization
   - Playback respects global BPM
   - Sequence loop syncs with global transport
   - Beat/bar alignment with other modules
3. Transport state integration
   - Play/pause respects `isPlaying` from GlobalMusicContext
   - Stop button resets playback position
   - Visual feedback (play/pause button state)
4. Scale visualization
   - Highlight scale notes in melody grid
   - Display current key/scale in module header
   - Visual feedback when global scale changes

**Deliverables:**
- Updated ChordMelodyArranger.tsx with GlobalMusicContext integration
- Key/scale change handlers (~80 lines)
- Tempo/transport synchronization (~60 lines)

---

### **Story 15.6: Module Registry Integration & Studio Loading** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 2-3 hours
**Prerequisites:** Stories 15.2, 15.4, 15.5

**Goal:** Register ChordMelodyArranger in Studio moduleRegistry and enable loading/unloading in Studio workspace.

**Acceptance Criteria:**
1. Add ChordMelodyArranger to `moduleRegistry.ts`
   - Module ID: `chord-melody`
   - Name: "Chord & Melody Arranger"
   - Description: "Create chord progressions and melodies with module routing"
   - Icon: Music note icon (from Lucide)
   - Color: `purple-400`
   - Category: `composer` (NEW category)
2. Module wrapper for Studio compatibility
   - Implements `ModuleComponentProps` interface
   - Handles embedded mode (no back button in Studio)
   - Respects layout prop (mobile/desktop)
3. Settings persistence
   - Save/load chord progressions to localStorage
   - Save/load melody sequences
   - Save output routing configuration
4. Module instance management
   - Support multiple ChordMelodyArranger instances
   - Unique instance IDs (chord-melody-1, chord-melody-2, etc.)

**Deliverables:**
- Updated `src/components/Studio/moduleRegistry.ts` (add ChordMelodyArranger)
- ChordMelodyArranger wrapper with ModuleComponentProps (~40 lines)
- Settings persistence logic (~80 lines)

---

## Technical Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│   React Frontend (Studio)                                  │
│                                                             │
│   ┌──────────────────────────────────────────────────┐    │
│   │  ChordMelodyArranger Module                      │    │
│   │  ┌────────────────┐  ┌────────────────────────┐ │    │
│   │  │ Chord Builder  │  │   Melody Sequencer     │ │    │
│   │  │  - Genre list  │  │  - 16-step grid        │ │    │
│   │  │  - Progression │  │  - Scale-aware notes   │ │    │
│   │  │  - Timeline    │  │  - Velocity control    │ │    │
│   │  └────────────────┘  └────────────────────────┘ │    │
│   │          ↕                       ↕                │    │
│   │  ┌─────────────────────────────────────────┐    │    │
│   │  │      Output Destination Selector        │    │    │
│   │  │  [Piano Icon] [Guitar Icon] [Drum Icon] │    │    │
│   │  └─────────────────────────────────────────┘    │    │
│   └──────────────────────────────────────────────────┘    │
│                      ↕                                      │
│   ┌──────────────────────────────────────────────────┐    │
│   │  ModuleRoutingService                            │    │
│   │  - Register/unregister modules                   │    │
│   │  - Route note events to targets                  │    │
│   │  - Query available modules                       │    │
│   └──────────────────────────────────────────────────┘    │
│         ↓                ↓                ↓                │
│   ┌──────────┐    ┌───────────┐    ┌──────────┐          │
│   │  Piano   │    │  Guitar   │    │   Drum   │          │
│   │  Module  │    │  Module   │    │  Module  │          │
│   └──────────┘    └───────────┘    └──────────┘          │
│                                                             │
│   ┌──────────────────────────────────────────────────┐    │
│   │  GlobalMusicContext                              │    │
│   │  - Tempo/Key/Scale/Transport State               │    │
│   └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Models

**Chord Progression (Existing - from GuitarFretboard)**
```typescript
interface Chord {
  name: string;
  notes: ChordNote[];
}

interface ChordNote {
  string: number;  // 1-6 (guitar specific)
  fret: number;    // 0-24
}

interface ChordProgression {
  name: string;
  chords: Chord[];
}

interface RomanNumeralProgression {
  name: string;
  romanNumerals: string[];
  description: string;
  genre: string;
  scaleType: 'major' | 'minor';
}
```

**Melody Sequence (NEW)**
```typescript
interface MelodyNote {
  step: number;      // 0-15 (16-step sequencer)
  pitch: number;     // MIDI note number (0-127)
  velocity: number;  // 0-127 (note intensity)
  duration: number;  // Note length in steps (1 = 16th note)
}

interface MelodySequence {
  name: string;
  notes: MelodyNote[];
  length: number;    // Sequence length in steps (16/32/64)
}
```

**Module Routing (NEW)**
```typescript
interface ModuleRoute {
  sourceId: string;      // Source module instance ID
  targetIds: string[];   // Target module instance IDs
  noteMapping?: (note: number) => number; // Optional pitch mapping
}

interface NoteEvent {
  type: 'noteOn' | 'noteOff';
  pitch: number;     // MIDI note number
  velocity: number;  // 0-127
  timestamp: number; // Performance.now()
  sourceId: string;  // Originating module
}
```

### Service Layer Architecture

**ChordProgressionService (Story 15.1)**
```typescript
class ChordProgressionService {
  getProgressionsByGenre(genre: string): RomanNumeralProgression[]
  resolveRomanNumerals(progression: RomanNumeralProgression, key: RootNote): ChordProgression
  transposeChords(chords: Chord[], fromKey: RootNote, toKey: RootNote): Chord[]
  getChordNotes(chordName: string, key: RootNote): number[] // MIDI note numbers
}
```

**ModuleRoutingService (Story 15.4)**
```typescript
class ModuleRoutingService {
  registerModule(moduleId: string, instanceId: string, capabilities: ModuleCapabilities): void
  unregisterModule(instanceId: string): void
  routeNoteEvent(event: NoteEvent, targetIds: string[]): void
  getAvailableTargets(sourceId: string): LoadedModule[]
  subscribeToEvents(targetId: string, callback: (event: NoteEvent) => void): () => void
}
```

---

## Integration Strategy

**Phase 1 - Service Extraction** (Story 15.1):
- Extract chord progression logic from GuitarFretboard
- Create reusable ChordProgressionService
- Ensure backward compatibility (GuitarFretboard still works)

**Phase 2 - Module Foundation** (Story 15.2):
- Build ChordMelodyArranger component structure
- Chord builder UI with progression selection
- Chord timeline visualization

**Phase 3 - Melody Arranger** (Story 15.3):
- Add melody sequencer component
- Piano roll-style note grid
- Scale-aware note input

**Phase 4 - Module Routing** (Story 15.4):
- Implement ModuleRoutingService
- Output destination selector UI
- Note event dispatching to target modules

**Phase 5 - Global State Integration** (Story 15.5):
- Connect to GlobalMusicContext
- Key/scale/tempo synchronization
- Transport state integration

**Phase 6 - Studio Integration** (Story 15.6):
- Register in moduleRegistry
- Module loading/unloading
- Settings persistence

---

## Success Metrics

### Story 15.1 (Chord Service Extraction)
- [x] ChordProgressionService created
- [x] GuitarFretboard refactored (no breaking changes)
- [x] Service respects GlobalMusicContext key/scale
- [x] TypeScript types defined

### Story 15.2 (ChordMelodyArranger UI)
- [x] ChordMelodyArranger component created
- [x] Chord builder UI functional
- [x] Chord timeline displays progressions
- [x] Responsive layout (mobile/desktop)

### Story 15.3 (Melody Arranger)
- [x] MelodySequencer component created
- [x] 16-step note grid functional
- [x] Scale-aware note filtering
- [x] Playback synchronized with global tempo

### Story 15.4 (Module Routing)
- [x] ModuleRoutingService implemented
- [x] Output destination selector UI
- [x] Note events dispatch to target modules
- [x] Multiple module targets supported

### Story 15.5 (GlobalMusicContext Integration)
- [x] Chords auto-transpose on key change
- [x] Melody notes filter on scale change
- [x] Tempo synchronization functional
- [x] Transport state integration (play/pause)

### Story 15.6 (Module Registry)
- [x] ChordMelodyArranger registered in moduleRegistry
- [x] Module loads in Studio workspace
- [x] Settings persistence functional
- [x] Multiple instances supported

### Story 15.7 (Intelligent Melody Generator)
- [ ] Chord-aware melody generation algorithm
- [ ] Brightness-weighted harmonic guidance (LED-compatible)
- [ ] Settings-driven visual feedback (chord tone density, contour, passing tones)
- [ ] Educational visualization features
- [ ] ColorMode integration (chromatic/harmonic/spectrum)

### Story 15.8 (Pattern Recognition Suggestions) - BACKLOG
- [ ] Arpeggio detection (chord tone outlines)
- [ ] Scale run detection (stepwise motion)
- [ ] Intervallic sequence detection
- [ ] Emerging prediction visualization
- [ ] Pattern continuation tool

### Overall Epic Success
- [x] Stories 1-6 COMPLETE
- [ ] Story 15.7 READY FOR DEVELOPMENT
- [ ] Story 15.8 BACKLOG (needs detailed requirements)
- [x] ChordMelodyArranger loadable in Studio
- [x] Module routing system functional
- [x] GlobalMusicContext integration complete
- [x] Legacy /guitar and /piano routes unchanged (no breaking changes)
- [x] Professional composer workflow achieved

---

## Dependencies

**Builds On:**
- ✅ Epic 4: Global Music Controls (GlobalMusicContext, transport state, key/scale/tempo)
- ✅ Epic 9: Multi-Instrument MIDI Visualization (GuitarFretboard chord progressions)
- 🚧 Epic 14: Module Adapter System (Module routing patterns, useModuleContext hook)

**Coordinates With:**
- Epic 6: Multi-Client Sessions & WLED (Future: collaborative chord/melody editing)
- Epic 7: Jam Session Backend (Future: sync chord progressions in jam sessions)

**Blocks:**
- Future: Chord progression sharing library (Epic 16+)
- Future: AI-assisted melody generation (Epic 17+)

---

## Risk Assessment & Mitigation

### Risk 1: Module Routing Complexity
**Severity:** Medium
**Mitigation:**
- Start with simple note event dispatching (Story 15.4)
- Use event bus pattern (proven in Epic 14)
- Limit routing to instrument modules only (exclude visualizers initially)
- Test with 2-3 target modules before expanding

### Risk 2: Chord-Melody Synchronization Timing
**Severity:** Medium
**Mitigation:**
- Use Tone.js Transport for precise timing (existing Epic 4 infrastructure)
- Leverage GlobalMusicContext tempo/transport state
- Add timing offset adjustment if needed (user-configurable)
- Test with multiple modules loaded to verify sync accuracy

### Risk 3: Performance Impact (Multiple Modules Loaded)
**Severity:** Low
**Mitigation:**
- Module routing service uses efficient event dispatching
- Melody sequencer uses requestAnimationFrame for smooth UI
- Leverage existing Epic 4 audio engine optimizations (memoization, debouncing)
- Monitor performance with DevTools (maintain 60fps)

### Risk 4: Backward Compatibility (GuitarFretboard)
**Severity:** Low
**Mitigation:**
- Story 15.1 explicitly requires backward compatibility
- GuitarFretboard imports ChordProgressionService (no logic duplication)
- Manual verification that /guitar route still works
- Keep original chordProgressions.ts as fallback if service refactor breaks

---

## Open Questions & Resolutions

**✅ RESOLVED (2025-01-13 - Initial Planning):**

1. **Chord Progression Reusability** - ✅ **RESOLVED:** Extract to ChordProgressionService
   - **Decision:** Create service layer (Story 15.1) consumed by both GuitarFretboard and ChordMelodyArranger
   - **Rationale:** Avoids code duplication, enables future chord features (AI generation, sharing library)

2. **Module Routing Architecture** - ✅ **RESOLVED:** ModuleRoutingService with event bus
   - **Decision:** Centralized routing service with registerModule/routeNoteEvent methods
   - **Rationale:** Follows existing patterns from Epic 14, enables future multi-input/multi-output routing

3. **Legacy Route Preservation** - ✅ **RESOLVED:** No changes to /guitar and /piano routes
   - **Decision:** ChordMelodyArranger is a NEW module, standalone routes remain unchanged
   - **Rationale:** Zero breaking changes, users can still share direct links like /guitar

**⏸️ DEFERRED to Future Epics:**

4. **Collaborative Chord Editing** - ⏸️ **Epic 16+:** Multi-user chord progression editing
   - **Reason:** Requires Epic 7 (Jam Session Backend) completion first

5. **AI Melody Generation** - ⏸️ **Epic 17+:** AI-assisted melody suggestions
   - **Reason:** Separate feature domain, requires ML model integration research

6. **Chord Progression Sharing Library** - ⏸️ **Epic 18+:** Community chord progression marketplace
   - **Reason:** Requires user accounts (Epic 7 Story 7.9), database persistence, moderation system

---

## Related Documentation

**Architecture Documents:**
- `docs/architecture/component-architecture.md` - Will be updated with ChordMelodyArranger patterns
- `docs/architecture/brownfield-module-refactoring.md` - Module adapter pattern reference (Epic 14)

**Epic Dependencies:**
- `docs/epics/epic-4-global-music-controls.md` - GlobalMusicContext foundation
- `docs/epics/epic-9-multi-instrument-midi-visualization.md` - GuitarFretboard chord progressions
- `docs/epics/epic-14-module-adapter-system.md` - Module routing patterns

**Source Code References:**
- `src/components/GuitarFretboard/chordProgressions.ts` - Existing chord data (to be extracted)
- `src/components/GuitarFretboard/romanNumeralConverter.ts` - Roman numeral logic (to be refactored)
- `src/components/Studio/moduleRegistry.ts` - Module registration (Story 15.6 updates)
- `src/contexts/GlobalMusicContext.tsx` - Global state integration (Story 15.5)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-13 | 1.0 | Initial epic creation - Chord Progression & Melody Arranger Module | Sarah (PO) |

---

## Next Steps

1. **Stakeholder Approval** - Present Epic 15 for review and approval
2. **Story Refinement** - PM to create detailed story documents (15.1-15.6)
3. **Design Mockups** - UX Expert to create UI mockups for ChordMelodyArranger module
4. **Coordinate with Epic 14** - Verify ModuleRoutingService aligns with module adapter patterns
5. **Developer Handoff** - Present epic to dev team, begin Story 15.1 implementation

---

## Estimated Timeline

**Total Estimated Time:** 31-41 hours (6 stories)

**Breakdown:**
- Story 15.1 (Chord Service): 4-6 hours
- Story 15.2 (Module UI): 8-10 hours
- Story 15.3 (Melody Arranger): 8-10 hours
- Story 15.4 (Module Routing): 6-8 hours
- Story 15.5 (Global State): 3-4 hours
- Story 15.6 (Registry): 2-3 hours

**Target Completion:** 4-5 weeks (assuming 8-10 hours/week development capacity)
