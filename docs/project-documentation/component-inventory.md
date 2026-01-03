# UI Component Inventory

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Scan Type:** Deep Scan

---

## Overview

This project contains **24 major component categories** with **87 total component files** (TypeScript/TSX). All components are built with **React 18 functional components** using hooks, TypeScript, and Tailwind CSS.

---

## Component Architecture

### Design System
- **Framework:** React 18 (functional components only)
- **Styling:** Tailwind CSS with custom design tokens
- **Icons:** Lucide React
- **Accessibility:** Form accessibility via @tailwindcss/forms
- **Responsiveness:** Mobile-first with breakpoint system

### Component Patterns
- **ViewTemplate:** Standardized view layout wrapper
- **ViewCard:** Reusable card container
- **Responsive containers:** Mobile/desktop adaptive layouts
- **Module system:** Pluggable musical modules

---

## Component Categories

### 1. **DrumMachine** (5 files)
**Purpose:** Step sequencer for drum pattern programming

**Key Files:**
- `DrumMachine.tsx` - Main drum sequencer interface
- `CompactDrumMachine.tsx` - Compact view variant
- `TrackManager.tsx` - Track CRUD operations
- `TrackRow.tsx` - Individual track UI
- `TransportControls.tsx` - Play/pause/tempo controls

**Features:**
- 8-track step sequencer (16 steps per track)
- MIDI output support
- WLED visualization integration
- Velocity-sensitive steps
- Pattern save/load

**Related Stories:** Epic 2 (Boomwhacker), Epic 6 (Multi-client sessions)

---

### 2. **PianoRoll** (multiple files)
**Purpose:** Piano-style MIDI note sequencer

**Key Features:**
- Vertical piano keyboard (88 keys)
- Grid-based note placement
- Velocity editing
- MIDI controller integration
- Scale highlighting (from GlobalMusicContext)

**Related Stories:** Epic 4 (Global Music Controls)

---

### 3. **GuitarFretboard** (multiple files)
**Purpose:** Interactive guitar fretboard with chord visualization

**Key Features:**
- 6-string fretboard (24 frets)
- Chord library integration
- Roman numeral progression support
- Scale degree visualization
- WLED 2D grid visualization
- Multiple tuning support (standard, drop D, etc.)

**Related Stories:** Epic 15 (Chord Melody Arranger), Story 16.5

---

### 4. **Studio** (7 files)
**Purpose:** Multi-module workspace container

**Key Files:**
- `Studio.tsx` - Main studio container
- `moduleRegistry.ts` - Module plugin system
- `ModuleCanvas.tsx` - Module rendering area
- `ModuleSelector.tsx` - Module picker UI
- `ModuleWrapper.tsx` - Module lifecycle wrapper
- `useModuleManager.ts` - Module state hook
- `modules/` - Individual module adapters

**Module Registry:**
- DrumMachine
- PianoRoll
- GuitarFretboard
- ChordMelodyArranger
- IsometricSequencer

**Features:**
- Multiple simultaneous modules
- Shared GlobalMusicContext
- Module communication (note/chord events)
- Module routing system

**Related Stories:** Epic 14 (Module Adapter System), Epic 15 (Module Routing)

---

### 5. **JamSession** (multiple files)
**Purpose:** Real-time collaborative jam sessions

**Key Features:**
- Supabase Realtime integration
- Room code system (6-character codes)
- Participant presence tracking
- State synchronization (tempo, key, playback)
- Delta-based drum pattern sync
- Host/guest roles

**Related Stories:** Epic 7 (Jam Session Backend), Story 17.1-17.2

---

### 6. **WLED Components** (3 categories)

#### **WLED** (4 files)
- `WLEDDeviceCard.tsx` - Device display card
- `WLEDDeviceManager.tsx` - Device list management
- `WLEDVirtualPreview.tsx` - Virtual LED preview
- `types.ts` - WLED type definitions

#### **WLEDManager** (multiple files)
- Device registry UI
- Connection testing
- Device configuration
- Real-time preview

#### **WLEDExperiment** (experimental features)
- Direct browser WebSocket communication
- HTTP JSON API testing
- Protocol research

**Related Stories:** Epic 18 (Intelligent WLED Routing), Epic 22 (Direct Browser Communication)

---

### 7. **GlobalMusicHeader** (multiple files)
**Purpose:** Shared music controls across all modules

**Controls:**
- Tempo slider (40-300 BPM)
- Key selector (C-B with sharps/flats)
- Scale selector (major, minor, pentatonic, etc.)
- Color mode (spectrum, chromatic, harmonic)
- Master volume
- Transport controls (play/pause)

**Provider:** GlobalMusicContext

**Related Stories:** Epic 4 (Global Music Controls)

---

### 8. **IsometricSequencer** (multiple files)
**Purpose:** 3D isometric grid sequencer visualization

**Key Features:**
- Isometric grid rendering
- Step sequencing
- Visual feedback
- WLED integration

**Related Stories:** Story 20.5 (Isometric Architecture)

---

### 9. **Education** (multiple files)
**Purpose:** Workshop-ready education mode

**Key Features:**
- Classroom controls
- Student device management
- Multi-strip LED coordination
- Boomwhacker integration
- Rhythm lessons

**Related Stories:** Epic 19 (Education/DJ Visualizer), Epic 20 (Workshop Mode)

---

### 10. **Hardware** (multiple files)
**Purpose:** MIDI hardware controller integration

**Supported Controllers:**
- Akai APC40/APC40 MkII
- Novation Launchpad Pro
- Roli Lumi keyboard
- Generic MIDI controllers

**Features:**
- Hardware abstraction layer
- LED feedback
- Pad velocity support
- Controller selection UI

**Related Stories:** Epic 1 (APC40), Epic 8 (Launchpad Pro), Epic 11 (Roli Lumi)

---

### 11. **Auth** (multiple files)
**Purpose:** User authentication and profile management

**Features:**
- Supabase Auth integration
- Email/password authentication
- Anonymous user support
- Profile management
- Session persistence

**Related Stories:** Story 18.0 (User Accounts MVP)

---

### 12. **Layout** (multiple files)
**Purpose:** Reusable layout components

**Key Components:**
- `ViewTemplate.tsx` - Standard view wrapper
- `ViewCard.tsx` - Card container
- `Header.tsx` - App header
- `MobileNavigation.tsx` - Mobile nav
- `ResponsiveContainer.tsx` - Responsive wrapper

**Usage:** All views should use ViewTemplate for consistency

---

### 13. **Welcome** (multiple files)
**Purpose:** Landing page and module navigation

**Features:**
- Module showcase
- Getting started guide
- Feature overview
- Quick links

---

### 14. **LiveAudioVisualizer** (multiple files)
**Purpose:** Real-time audio frequency visualization

**Features:**
- FFT frequency analysis
- Spectrum visualization
- WLED integration (1D strips)
- Configurable update rate

**Related Stories:** Epic 9 (Multi-instrument MIDI Visualization)

---

### 15. **Visualizer** (multiple files)
**Purpose:** Audio reactive visualizations

**Features:**
- Audio input processing
- Visual effects
- WLED output
- Frequency-based color mapping

---

### 16. **LEDStripManager** (multiple files)
**Purpose:** LED strip device management

**Features:**
- Device configuration
- Connection testing
- Strip direction control
- Multi-lane assignment

---

### 17. **Music** (shared utilities)
**Purpose:** Musical utility components

**Features:**
- Scale calculators
- Note name converters
- Chord parsers
- Music theory utilities

---

### 18. **MIDI** (multiple files)
**Purpose:** MIDI I/O components

**Features:**
- MIDI device selection
- MIDI input visualization
- MIDI output testing
- Note on/off display

---

### 19. **PixelBoop** (experimental)
**Purpose:** Experimental pixel sequencer

**Features:**
- Pixel grid editor
- Pattern sequencing
- Animation playback

---

### 20. **LumiTest** (hardware testing)
**Purpose:** Roli Lumi keyboard testing utilities

**Features:**
- Lumi connection testing
- LED control testing
- MIDI message debugging

**Related Stories:** Epic 11 (Roli Lumi Integration)

---

### 21. **JamSessionLegacy** (deprecated)
**Purpose:** Legacy jam session implementation

**Status:** Replaced by current JamSession component

---

### 22. **AnnouncementBanner** (utility)
**Purpose:** App-wide announcement system

**Features:**
- Dismissible banners
- Persistent state
- Styled notifications

---

## Component Composition Patterns

### ViewTemplate Usage

**Standard Pattern:**
```tsx
import { ViewTemplate, ViewCard } from '@/components/Layout/ViewTemplate';

export const MyView: React.FC<Props> = ({ onBack }) => {
  return (
    <ViewTemplate
      title="My View"
      subtitle="Brief description"
      onBack={onBack}
      variant="centered"
      maxWidth="4xl"
    >
      <ViewCard title="Section 1">
        {/* Content */}
      </ViewCard>

      <ViewCard title="Section 2">
        {/* Content */}
      </ViewCard>
    </ViewTemplate>
  );
};
```

### Module Wrapper Pattern

**For Studio-embedded modules:**
```tsx
import { useGlobalMusicContext } from '@/contexts/GlobalMusicContext';

export const MyModule: React.FC = () => {
  const context = useGlobalMusicContext();
  const showControls = !context; // Hide when embedded

  return (
    <div>
      {showControls && <LocalControls />}
      <MainInterface />
    </div>
  );
};
```

---

## Shared Contexts

Components consume these React contexts:

1. **GlobalMusicContext** - Shared music state (tempo, key, scale)
2. **WLEDContext** - WLED device registry
3. **AuthContext** - User authentication state
4. **SessionContext** - Jam session state (collaborative mode)

---

## Component File Statistics

**Total Files:** 87 (TypeScript/TSX)
**Component Categories:** 24
**Average Files per Category:** 3.6

**File Type Distribution:**
- `.tsx` files (React components): ~75
- `.ts` files (utilities, types, hooks): ~12

**Largest Components:**
- Studio (7 files + modules)
- DrumMachine (5 files)
- WLED ecosystem (3 categories, 10+ files)

---

## Reusable Component Classes

**From `src/index.css` (@layer components):**

```css
.btn-primary           /* Primary action button */
.btn-secondary         /* Secondary action button */
.step-button           /* Drum step button */
.track-row             /* Drum track row */
.piano-key             /* Piano keyboard key */
.fret-marker           /* Guitar fret marker */
.led-preview           /* Virtual LED preview */
```

---

## Design System Tokens

**Color Scales:**
- `primary-*` (50-900) - Blue accent
- `accent-*` (50-900) - Purple accent
- `gray-*` (50-900) - Grayscale

**Border Radius:**
- `rounded-lg` - Standard interactive elements
- `rounded-md` - Small containers
- `rounded-full` - Circular elements

**Spacing:**
- Mobile: `p-4`, `space-y-4`
- Desktop: `p-6`, `space-y-6`

**Typography:**
- Headings: `text-2xl sm:text-3xl`
- Body: `text-base sm:text-lg`
- Small: `text-sm`

---

## Component Testing

**Manual Testing Approach:**
- Browser DevTools inspection
- Visual verification
- Audio/MIDI testing with physical devices
- Responsive design testing (mobile/tablet/desktop)

**No Automated Test Suites:**
- Project uses manual testing workflow
- Dev Agent Records document testing performed
- See CLAUDE.md for testing philosophy

---

## Component Dependencies

**Common Dependencies:**
- React 18.2.0
- React Router 7.9.3
- Lucide React 0.294.0 (icons)
- Tailwind CSS 3.3.6
- Tone.js 15.1.22 (audio)
- @supabase/supabase-js 2.75.0

**Hardware Integration:**
- Web MIDI API (native)
- WLED HTTP/WebSocket (custom)

---

## Summary

**Total Component Categories:** 24
**Total Component Files:** 87
**Design Pattern:** ViewTemplate + ViewCard
**State Management:** React Context API
**Styling:** Tailwind CSS utility classes
**Icons:** Lucide React
**Testing:** Manual browser-based testing

**Key Architectural Patterns:**
- ✅ Component-based React architecture
- ✅ Module plugin system (Studio)
- ✅ Shared state via contexts
- ✅ Hardware abstraction layer
- ✅ Responsive mobile-first design
- ✅ ViewTemplate standardization
- ✅ Type-safe props with TypeScript
