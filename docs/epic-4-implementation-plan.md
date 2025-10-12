# Epic 4: Global Music Studio - Implementation Plan

## Overview

Epic 4 creates a **professional global music control system** with a modular workspace that can dynamically load and arrange multiple music tools (piano, guitar, visualizer, drum machine, etc.) without interrupting audio or visualizations.

---

## Critical Learning from JamSession

### The Problem We Solved
- ❌ Audio context interruption when components unmount
- ❌ Visualizations restart when conditionally rendered
- ❌ Responsive layout changes caused component remounting

### The Solution Pattern
```typescript
// ❌ BAD - Causes remounting and audio interruption
{isMobile && <LiveAudioVisualizer />}

// ✅ GOOD - Always mounted, CSS controls visibility
<LiveAudioVisualizer
  layout={isMobile ? 'mobile' : 'desktop'}
  className={isMobile ? (activeView === 'drum' ? 'mt-4' : 'hidden') : 'mt-6'}
/>
```

**Key Principles:**
1. **Always render modules** - never conditional `{condition && <Component>}`
2. **CSS visibility control** - use `className` with `hidden`
3. **Single instance per module** - component renders once, never unmounts
4. **Layout hints via props** - pass `layout` prop but don't control lifecycle

---

## Epic 4 Story Sequence

### Foundation (Stories 4.1-4.3)
**Week 1-2**

| Story | Focus | Days | Status |
|-------|-------|------|--------|
| 4.1 | Global Music State Context | 2-3 | ✅ Documented |
| 4.2 | Global Music Header Bar | 3-4 | ✅ Documented |
| 4.3 | Persistent Audio Engine | 2-3 | ✅ Documented |

**Output**: Global music controls accessible from all views

---

### Integration (Stories 4.4-4.5)
**Week 2-3**

| Story | Focus | Days | Status |
|-------|-------|------|--------|
| 4.4 | Hardware I/O Integration | 2 | ✅ Documented |
| 4.5 | Visualization Color Mapping | 2-3 | ✅ Documented |

**Output**: Hardware settings + color modes centralized

---

### Module System (Story 4.7) ⭐ NEW
**Week 3-4**

| Story | Focus | Days | Status |
|-------|-------|------|--------|
| 4.7 | Module Loading System | 4-5 | ✅ Documented |

**Output**: `/studio` route with dynamic module loading

**Features:**
- "+ Add Module" button
- Desktop: CSS Grid (2-3 columns)
- Mobile: Single module + bottom tabs
- Always-mounted modules (JamSession pattern)
- Module-specific settings
- localStorage persistence
- Optional: Drag-drop reordering

---

### Refactoring (Story 4.6)
**Week 4**

| Story | Focus | Days | Status |
|-------|-------|------|--------|
| 4.6 | View Integration & Refactoring | 3-4 | ✅ Documented |

**Output**: Existing views consume global state

---

## Architecture

### Overall Structure
```
/studio route (test environment)
├── GlobalMusicProvider (Context with global state)
│   └── GlobalMusicHeader (persistent controls)
│       ├── Tempo (BPM, tap tempo, visual indicator)
│       ├── Key/Scale selector
│       ├── Color mode toggle (chromatic/harmonic)
│       ├── Master volume
│       └── Hardware I/O button
│
└── ModuleCanvas (dynamic module area)
    ├── Desktop Layout:
    │   ├── CSS Grid (2-3 columns)
    │   ├── All modules visible
    │   ├── Settings sidebar
    │   └── Optional: Drag-drop
    │
    ├── Mobile Layout:
    │   ├── One module at a time
    │   ├── Bottom tab navigation
    │   └── Swipe between modules
    │
    └── Modules (always mounted):
        ├── [+ Add Module] button
        ├── PianoRoll (hidden when not active)
        ├── GuitarFretboard (hidden when not active)
        ├── DrumMachine (hidden when not active)
        ├── LiveAudioVisualizer (hidden when not active)
        └── ... (dynamically loaded)
```

### Module Rendering Pattern (CRITICAL)
```typescript
// ModuleCanvas.tsx
{loadedModules.map(module => {
  const Module = module.component;
  const isActive = !isMobile || activeModuleId === module.id;

  return (
    <div
      key={module.id}
      className={`
        ${!isActive ? 'hidden' : ''}
        ${isMobile ? 'w-full' : 'col-span-1'}
      `}
    >
      <Module
        layout={isMobile ? 'mobile' : 'desktop'}
        settings={module.settings}
        onSettingsChange={(newSettings) => updateModuleSettings(module.id, newSettings)}
      />
    </div>
  );
})}
```

---

## Settings Architecture

### Global Settings (GlobalMusicContext)
Affects all modules:
- **Tempo** - BPM for all sequencers/players
- **Key** - Root note (C, D, E, etc.)
- **Scale** - Scale pattern (major, minor, etc.)
- **Color Mode** - Chromatic vs harmonic visualization
- **Master Volume** - Overall audio level
- **Hardware** - MIDI/WLED device connections

### Module-Specific Settings
Each module maintains its own:
- **Piano Roll**: Octave range, note labels, grid snap
- **Guitar**: Tuning, capo position, chord display
- **Drum Machine**: Track count, pattern length
- **Visualizer**: FFT size, smoothing, effects

**Clear Separation:**
- Global settings → GlobalMusicHeader
- Module settings → Module's own settings panel
- No confusion or conflicts

---

## Testing Strategy

### Audio Continuity Test (CRITICAL)
```
1. Load Piano Roll → Start playing notes
2. Add Guitar Fretboard → Audio continues ✅
3. Remove Visualizer → Audio continues ✅
4. Resize window (desktop ↔ mobile) → Audio continues ✅
5. Switch modules on mobile → Audio continues ✅
```

### Visualization Persistence Test
```
1. Load Visualizer → Start visualization
2. Add another module → Viz continues ✅
3. Resize window → Viz continues ✅
4. Switch tabs on mobile → Viz continues ✅
```

### Settings Isolation Test
```
1. Change global tempo → All modules update ✅
2. Change Piano octave → Only Piano updates ✅
3. Change global key → All modules update ✅
4. Change Guitar tuning → Only Guitar updates ✅
```

---

## Development Sequence

### Phase 1: Foundation (Stories 4.1-4.3)
**Goal**: Global controls working in isolation

1. Create GlobalMusicContext
2. Create GlobalMusicHeader
3. Create `/test-header` route
4. Test all header controls
5. Extend AudioEngine with persistence

### Phase 2: Integration (Stories 4.4-4.5)
**Goal**: Hardware and colors centralized

1. Hardware settings modal
2. Color mapping system
3. Update visualizers with color modes

### Phase 3: Module System (Story 4.7) ⭐
**Goal**: Dynamic module loading in `/studio`

1. Create Studio component
2. Create ModuleCanvas with grid/mobile layouts
3. Implement module registry
4. Build "+ Add Module" selector
5. Apply JamSession always-mount pattern
6. Add MobileNavigation integration
7. Module-specific settings
8. localStorage persistence

### Phase 4: Migration (Story 4.6)
**Goal**: Existing views use global state

1. Refactor PianoRoll
2. Refactor GuitarFretboard
3. Refactor IsometricSequencer
4. Remove duplicate components

---

## Success Criteria

**Epic 4 is successful when:**

✅ Global music header on all routes
✅ Settings persist across views
✅ Audio continues during navigation
✅ `/studio` loads modules dynamically
✅ Desktop: Multiple modules in grid
✅ Mobile: Single module + tabs
✅ No audio/viz interruption on module add/remove
✅ Module settings isolated from global
✅ Workspace persists across sessions
✅ Could replace `/jam` as main workspace

---

## Files Created

### Documentation
- ✅ `docs/prd/epic-4-global-music-controls.md` - Epic overview
- ✅ `docs/stories/4.1.story.md` - Global Music State Context
- ✅ `docs/stories/4.2.story.md` - Global Music Header Bar
- ✅ `docs/stories/4.3.story.md` - Persistent Audio Engine
- ✅ `docs/stories/4.4.story.md` - Hardware I/O Integration
- ✅ `docs/stories/4.5.story.md` - Visualization Color Mapping
- ✅ `docs/stories/4.7.story.md` - Module Loading System ⭐ NEW
- ✅ `docs/stories/4.6.story.md` - View Integration & Refactoring
- ✅ `docs/epic-4-implementation-plan.md` - This file

### PRD Updates
- ✅ `docs/prd/index.md` - Added Epic 4 to TOC
- ✅ `docs/prd/requirements.md` - Added FR13-FR20, NFR9-NFR12

### Archived
- ✅ `docs/stories/archive/4.1-frequency-visualization-system.md` - Old 4.1 story

---

## Next Steps

1. **Review** this plan with the team
2. **Confirm** Story 4.7 approach (module loading system)
3. **Start development** with Story 4.1 (GlobalMusicContext)
4. **Test incrementally** - each story builds on previous
5. **Iterate** based on `/studio` testing

**The modular workspace (/studio) could become the new main interface if successful!** 🚀
