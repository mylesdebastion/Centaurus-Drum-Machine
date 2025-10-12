# Epic 4: Global Music Controls & State Management

**Epic Goal**: Add a persistent top header bar with global music controls (tempo, key, scale, hardware I/O, visualization colors) that work consistently across all application views.

**Business Requirements**:
- Improve UX consistency - users shouldn't reconfigure settings when switching views
- Enable audio engine persistence across view navigation (professional app standard)
- Establish global state foundation for future features (multi-user sync, monetization)
- Provide centralized hardware I/O management

**Technical Requirements**:
- Use React Context API for global state (no new dependencies)
- Extend existing `AudioEngine` singleton for cross-view persistence
- Leverage existing `useMusicalScale` hook for key/scale management
- Create responsive global header following ViewTemplate design patterns
- Integrate with existing hardware components (HardwareStatusIndicator, WLEDDeviceManager)

---

## Story 4.1: Global Music State Context

As a **system architect**,
I want **a centralized global music state context using React Context API**,
so that **all views can access shared musical configuration (tempo, key, scale, settings)**.

**Acceptance Criteria**:
1. Create `src/contexts/GlobalMusicContext.tsx` with state management
2. Define `GlobalMusicState` TypeScript interface:
   - `tempo: number` (BPM, default 120)
   - `key: RootNote` (musical root, default 'C')
   - `scale: ScaleName` (scale pattern, default 'major')
   - `colorMode: 'chromatic' | 'harmonic'` (visualization mode, default 'chromatic')
   - `masterVolume: number` (0-1, default 0.7)
3. Implement `useGlobalMusic()` hook for components
4. Integrate with existing `useMusicalScale` hook (wrap and extend it)
5. Add localStorage persistence with simple JSON schema
6. Wrap Router in App.tsx with `<GlobalMusicProvider>`

**Integration Verification**:
- **IV1**: Existing views continue working when provider added (no breaking changes)
- **IV2**: State changes in one view reflect in other mounted views instantly
- **IV3**: Settings persist across page refresh via localStorage

---

## Story 4.2: Global Music Header Bar Component

As a **user**,
I want **a persistent header bar with tempo, key, scale, and settings controls**,
so that **I can adjust musical parameters from any view without navigation**.

**Acceptance Criteria**:
1. Create `src/components/GlobalMusicHeader/GlobalMusicHeader.tsx`
2. Implement responsive layout:
   - **Desktop** (>1024px): Full horizontal control bar
   - **Tablet** (768-1024px): Compact control bar
   - **Mobile** (<768px): Collapsible menu with essential controls
3. Add tempo control:
   - BPM input field (40-300 range)
   - Tap tempo button (calculates BPM from taps)
   - Visual tempo indicator (pulsing icon)
4. Add key/scale selector using existing `ScaleSelector` component
5. Add visualization color mode toggle:
   - Button with icon (chromatic: rainbow, harmonic: degrees)
   - Tooltip explaining modes
6. Add master volume slider (0-100%)
7. Add hardware I/O status indicator (reuse `HardwareStatusIndicator`)
8. Follow Tailwind design system and ViewTemplate patterns

**Integration Verification**:
- **IV1**: Header renders on all routes without layout conflicts
- **IV2**: Mobile header collapses properly on small screens
- **IV3**: All controls remain responsive during audio playback

---

## Story 4.3: Persistent Audio Engine Lifecycle

As a **musician**,
I want **audio to continue playing seamlessly when switching between views**,
so that **my workflow isn't interrupted by navigation**.

**Acceptance Criteria**:
1. Update `src/utils/audioEngine.ts` with persistence methods:
   - `AudioEngine.getTransportState()` - Save current playback state
   - `AudioEngine.restoreTransportState(state)` - Restore playback state
2. Add React Router navigation listeners in App.tsx
3. Preserve Tone.js Transport position and tempo during view changes
4. Implement audio context state management (handle browser suspend/resume)
5. Add global volume control integration with GlobalMusicContext
6. Test audio continuity across all route transitions

**Integration Verification**:
- **IV1**: Audio plays continuously navigating /jam → /piano → /guitar-fretboard
- **IV2**: Tone.js Transport maintains BPM and position across views
- **IV3**: No audio glitches, pops, or clicks during navigation

---

## Story 4.4: Hardware I/O Integration Points

As a **hardware controller user**,
I want **centralized hardware settings accessible from the global header**,
so that **I can manage MIDI/WLED devices from any view**.

**Acceptance Criteria**:
1. Create `src/components/GlobalMusicHeader/HardwareSettingsModal.tsx`
2. Add MIDI device selector:
   - Input device dropdown (Web MIDI API)
   - Output device dropdown
   - Connection status indicator (green/red)
3. Add WLED device section:
   - Integrate existing `WLEDDeviceManager` component
   - Show connected devices list
   - Quick connect/disconnect buttons
4. Add "Hardware Settings" button in global header
5. Store selected devices in GlobalMusicContext
6. Add device hot-plug detection (update state on connect/disconnect)

**Integration Verification**:
- **IV1**: Hardware modal accessible from all routes
- **IV2**: Device changes update global state immediately
- **IV3**: Existing JamSession hardware integration continues working

---

## Story 4.5: Visualization Color Mapping System

As a **music educator**,
I want **consistent color mapping across all visualizers (chromatic/harmonic modes)**,
so that **students see consistent visual associations**.

**Acceptance Criteria**:
1. Update `src/utils/colorMapping.ts` with two modes:
   - **Chromatic mode**: C=Red, C#=Orange, D=Yellow, etc. (boomwhacker standard)
   - **Harmonic mode**: Tonic=Blue, Subdominant=Green, Dominant=Purple, etc.
2. Create `getColorForNote(note, mode, currentKey)` utility function
3. Integrate with existing visualizers:
   - `PianoRoll` - update note coloring logic
   - `GuitarFretboard` - update fret coloring logic
   - `IsometricSequencer` - update 3D note coloring
4. Add color mode toggle in global header
5. Update color mode in GlobalMusicContext
6. Add smooth color transitions when switching modes (200ms fade)

**Integration Verification**:
- **IV1**: Switching color mode updates all active visualizers instantly
- **IV2**: Color mode persists across page refresh
- **IV3**: Existing visualizers maintain backward compatibility

---

## Story 4.7: Module Loading System & Dynamic Canvas

As a **user**,
I want **to dynamically load and arrange multiple music modules (piano, guitar, visualizer, etc.) in a flexible canvas**,
so that **I can customize my music production workspace without audio/visualization interruptions**.

**Acceptance Criteria**:
1. Create `/studio` test route with GlobalMusicHeader + ModuleCanvas
2. Implement "+ Add Module" button with module selection panel
3. Desktop layout: CSS Grid with multiple modules visible (2-3 columns)
4. Mobile layout: Single module view with bottom tab navigation
5. **Critical**: All loaded modules always mounted, CSS controls visibility (JamSession pattern)
6. Module-specific settings accessible without conflicting with global settings
7. Optional: Drag-drop module reordering (if not too complex)
8. Persist loaded modules to localStorage

**Integration Verification**:
- **IV1**: Audio continues playing when adding/removing modules (no interruption)
- **IV2**: Visualizations persist across layout changes (responsive resize)
- **IV3**: Module-specific settings don't interfere with global settings

**Architecture Pattern** (from JamSession):
```typescript
/* 🚨 CRITICAL: Always render modules, CSS controls visibility */
{loadedModules.map(module => (
  <div
    key={module.id}
    className={`
      ${isMobile && activeModuleId !== module.id ? 'hidden' : ''}
      ${!isMobile ? 'col-span-1' : ''}
    `}
  >
    <module.component layout={isMobile ? 'mobile' : 'desktop'} />
  </div>
))}
```

---

## Story 4.6: View Integration & Refactoring

As a **developer**,
I want **all existing views to consume global music state**,
so that **settings are consistent and DRY principle is followed**.

**Acceptance Criteria**:
1. Refactor `PianoRoll` to use `useGlobalMusic()` for key/scale/tempo
2. Refactor `GuitarFretboard` to use `useGlobalMusic()` for key/scale
3. Refactor `IsometricSequencer` to use `useGlobalMusic()` for key/scale/tempo
4. Refactor `JamSession` to use `useGlobalMusic()` for tempo (if applicable)
5. Remove local key/scale/tempo state from refactored views
6. Update view components to listen for global state changes
7. Test all views with synchronized settings changes

**Integration Verification**:
- **IV1**: Changing key in header updates all visualizers immediately
- **IV2**: No regressions in existing view functionality
- **IV3**: Remove duplicate ScaleSelector components from individual views

---

## Technical Architecture

### React Component Hierarchy
```
App.tsx
├── GlobalMusicProvider (Context)
│   └── Router
│       ├── GlobalMusicHeader (persistent across routes)
│       └── Routes
│           ├── /jam → JamSession
│           ├── /piano → PianoRoll (consumes useGlobalMusic)
│           ├── /guitar-fretboard → GuitarFretboard (consumes useGlobalMusic)
│           └── /isometric → IsometricSequencer (consumes useGlobalMusic)
```

### GlobalMusicState Interface
```typescript
interface GlobalMusicState {
  tempo: number;                          // BPM (40-300)
  key: RootNote;                          // C, C#, D, etc.
  scale: ScaleName;                       // major, minor, dorian, etc.
  colorMode: 'chromatic' | 'harmonic';    // Visualization mode
  masterVolume: number;                   // 0-1
  hardware: {
    midi: {
      inputDevice: string | null;
      outputDevice: string | null;
      connected: boolean;
    };
    wled: {
      devices: WLEDDevice[];
      activeDeviceId: string | null;
    };
  };
}
```

### localStorage Schema
```json
{
  "version": 1,
  "state": {
    "tempo": 120,
    "key": "C",
    "scale": "major",
    "colorMode": "chromatic",
    "masterVolume": 0.7,
    "hardware": { "midi": {...}, "wled": {...} }
  },
  "timestamp": "2025-01-11T10:30:00Z"
}
```

---

## Integration Strategy

**Phase 1 - Foundation** (Stories 4.1-4.2):
- Add GlobalMusicProvider context (non-breaking)
- Create GlobalMusicHeader component
- No changes to existing views yet

**Phase 2 - Audio Persistence** (Story 4.3):
- Extend AudioEngine with persistence
- Test audio continuity across routes

**Phase 3 - Hardware & Colors** (Stories 4.4-4.5):
- Add hardware settings modal
- Implement color mapping system

**Phase 4 - View Refactoring** (Story 4.6):
- Migrate views one by one to global state
- Remove duplicate code and components

---

## Success Metrics

**Technical Performance**:
- Global state changes propagate in <50ms
- Audio transitions with zero glitches or timing drift
- Header adds <200ms to initial page load

**User Experience**:
- Users can change key/scale/tempo from any view
- Settings persist across browser sessions
- Audio continues playing during view navigation
- Hardware devices remain connected across views

---

## Future Enhancements (Post-MVP)

### Module System Enhancements
- **Drag-drop Module Reordering**: Visual reordering of modules in grid (if Story 4.7 deferred)
- **Module Presets**: Save/load workspace configurations (which modules + layouts)
- **Module Marketplace**: Community-contributed modules
- **Module Isolation**: Run modules in separate audio contexts for independent processing
- **Module Routing**: Audio/MIDI routing between modules

### Global Features
- **Ableton Link Integration**: Tempo sync with other apps/hardware
- **Multi-user Sync**: Shared global state across jam session participants
- **Advanced Hardware Orchestration**: Multi-device coordination patterns
- **Custom Color Palettes**: User-defined visualization color schemes
- **Time Signature Support**: Beyond 4/4 (3/4, 5/4, 7/8, etc.)
- **Swing/Groove Controls**: Global swing percentage for humanization

---

**This epic establishes the professional UX foundation for Centaurus while maintaining MVP focus on core functionality. Story 4.7 introduces a modular workspace system that could potentially replace JamSession as the main collaborative environment.**
