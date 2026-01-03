# State Management Patterns

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Scan Type:** Deep Scan

---

## Overview

This project uses **React Context API** for global state management with **localStorage persistence** for user preferences. No external state management libraries (Redux, Zustand, etc.) are used.

**State Management Strategy:**
- **Global State:** React Context API
- **Local State:** React useState/useReducer
- **Persistence:** localStorage for preferences
- **Real-time Sync:** Supabase Realtime (collaborative features)

---

## Primary Context: GlobalMusicContext

**File:** `src/contexts/GlobalMusicContext.tsx`

### Purpose

Centralized musical configuration accessible to all modules. Ensures consistent tempo, key, scale, and playback state across DrumMachine, PianoRoll, GuitarFretboard, and other musical components.

### State Interface

```typescript
interface GlobalMusicState {
  // Musical Parameters
  tempo: number;                       // BPM (40-300)
  key: RootNote;                       // Musical root note
  scale: ScaleName;                    // Scale pattern
  colorMode: ColorMode;                // Visualization mode
  masterVolume: number;                // 0-1
  isPlaying: boolean;                  // Transport state (NOT persisted)

  // Hardware Configuration
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

  // Authentication State (Story 18.0)
  auth: {
    user: User | null;
    profile: UserProfile | null;
    isAuthenticated: boolean;
    loading: boolean;
  };
}
```

### Context Actions

```typescript
interface GlobalMusicContextValue extends GlobalMusicState {
  // Musical Parameter Updates
  updateTempo(tempo: number): void;
  updateKey(key: RootNote): void;
  updateScale(scale: ScaleName): void;
  updateColorMode(mode: ColorMode): void;
  updateMasterVolume(volume: number): void;
  updateTransportState(playing: boolean): void;

  // Hardware Updates
  updateMidiInput(device: string | null): void;
  updateMidiOutput(device: string | null): void;
  updateMidiConnected(connected: boolean): void;
  updateWLEDDevices(devices: WLEDDevice[]): void;
  updateActiveWLEDDevice(deviceId: string | null): void;

  // Musical Utilities
  getCurrentScale(): number[];
  isNoteInScale(noteClass: number): boolean;
  getScaleDisplayName(): string;
  getKeySignature(): string;
  rootNotes: string[];
  scaleNames: string[];
}
```

### Usage Pattern

**Provider Setup (App.tsx):**
```tsx
import { GlobalMusicProvider } from '@/contexts/GlobalMusicContext';

function App() {
  return (
    <GlobalMusicProvider>
      <Router>
        <Routes />
      </Router>
    </GlobalMusicProvider>
  );
}
```

**Consumer Hook:**
```tsx
import { useGlobalMusicContext } from '@/contexts/GlobalMusicContext';

function MyComponent() {
  const {
    tempo,
    key,
    scale,
    updateTempo,
    getCurrentScale
  } = useGlobalMusicContext();

  return (
    <div>
      <p>Current Tempo: {tempo} BPM</p>
      <p>Key: {key} {scale}</p>
      <button onClick={() => updateTempo(140)}>
        Set Tempo to 140
      </button>
    </div>
  );
}
```

### Persistence Strategy

**localStorage Keys:**
- `globalMusicSettings` - Persisted musical parameters

**Persisted Fields:**
- ✅ `tempo`
- ✅ `key`
- ✅ `scale`
- ✅ `colorMode`
- ✅ `masterVolume`
- ❌ `isPlaying` (always starts paused)
- ❌ `auth` (managed by Supabase Auth)

**Load on Mount:**
```typescript
useEffect(() => {
  const saved = localStorage.getItem('globalMusicSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    setState(settings);
  }
}, []);
```

**Save on Change:**
```typescript
useEffect(() => {
  const settings = {
    tempo,
    key,
    scale,
    colorMode,
    masterVolume
  };
  localStorage.setItem('globalMusicSettings', JSON.stringify(settings));
}, [tempo, key, scale, colorMode, masterVolume]);
```

---

## Integration with Audio Engine

### Tone.js Transport Sync

**Epic 14, Story 14.2** - Global transport state synchronization

```typescript
const updateTransportState = useCallback(async (playing: boolean) => {
  // Optimistic update for iOS Safari user gesture requirements
  setState((prev) => ({ ...prev, isPlaying: playing }));

  try {
    // Ensure audio context is started (required for iOS)
    await audioEngine.ensureStarted();

    if (playing) {
      audioEngine.transport.start();
    } else {
      audioEngine.transport.stop();
    }
  } catch (error) {
    console.error('Failed to update transport state:', error);
    // Revert on failure
    setState((prev) => ({ ...prev, isPlaying: !playing }));
  }
}, []);
```

**Key Features:**
- Optimistic UI updates
- iOS Safari user gesture handling
- Error recovery with state revert
- Synchronized across all modules

---

## Collaborative State (Supabase Realtime)

### Jam Session Context

**File:** `src/services/supabaseSession.ts`

When users join a jam session, GlobalMusicContext **listens to broadcast events** and synchronizes state:

```typescript
// Subscribe to tempo changes
supabaseSessionService.onTempoChange((tempo) => {
  updateTempo(tempo);
});

// Subscribe to key/scale changes
supabaseSessionService.onKeyScaleChange((key, scale) => {
  updateKey(key);
  updateScale(scale);
});

// Subscribe to playback changes
supabaseSessionService.onPlaybackChange((isPlaying) => {
  updateTransportState(isPlaying);
});

// Subscribe to color mode changes
supabaseSessionService.onColorModeChange((mode) => {
  updateColorMode(mode);
});
```

**State Ownership:**
- **Host controls:** Tempo, key, scale, playback
- **All participants:** Synchronized read-only state
- **Local overrides:** Disabled during jam sessions

---

## Module Adapter Pattern

**Epic 14, Story 14.2** - Context-aware module behavior

### Context Detection

Modules detect their execution context and adapt behavior:

```typescript
type ModuleContext = 'standalone' | 'studio' | 'jam';

// Detect context from route
const detectContext = (): ModuleContext => {
  const path = window.location.pathname;
  if (path.startsWith('/studio')) return 'studio';
  if (path.startsWith('/jam')) return 'jam';
  return 'standalone';
};
```

### Conditional State Consumption

```typescript
function MyModule() {
  const context = detectContext();
  const globalMusic = useGlobalMusicContext();

  // Use global state when embedded
  const tempo = context === 'standalone'
    ? localTempo
    : globalMusic.tempo;

  // Hide controls when embedded
  const showControls = context === 'standalone';

  return (
    <div>
      {showControls && <TempoControl />}
      <Sequencer tempo={tempo} />
    </div>
  );
}
```

---

## WLED Device State

### Device Registry Context

**Pattern:** Service singleton with React hook

```typescript
import { wledDeviceRegistry } from '@/services/WLEDDeviceRegistry';

function useWLEDDevices() {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);

  useEffect(() => {
    // Subscribe to device changes
    const unsubscribe = wledDeviceRegistry.subscribeToDevices((devices) => {
      setDevices(devices);
    });

    return unsubscribe;
  }, []);

  return devices;
}
```

**Storage:**
- **Anonymous:** localStorage polling (1s interval)
- **Authenticated:** Supabase Realtime subscription

---

## Authentication State

### Auth Hook

**File:** `src/hooks/useAuth.ts`

```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    isAuthenticated: !!user,
    loading
  };
}
```

**Integrated into GlobalMusicContext** for app-wide access

---

## Local State Patterns

### Component State (useState)

**Simple state:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedTrack, setSelectedTrack] = useState(0);
```

### Complex State (useReducer)

**For multi-step state transitions:**
```typescript
type State = {
  pattern: boolean[][];
  playhead: number;
  isPlaying: boolean;
};

type Action =
  | { type: 'TOGGLE_STEP'; track: number; step: number }
  | { type: 'ADVANCE_PLAYHEAD' }
  | { type: 'SET_PLAYING'; playing: boolean };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_STEP':
      // ...
    case 'ADVANCE_PLAYHEAD':
      // ...
    case 'SET_PLAYING':
      // ...
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```

---

## Custom Hooks

### Musical Scale Hook

**File:** `src/hooks/useMusicalScale.ts`

```typescript
function useMusicalScale(key: RootNote, scale: ScaleName) {
  const getCurrentScale = useCallback(() => {
    // Returns MIDI note classes (0-11)
    return calculateScaleNotes(key, scale);
  }, [key, scale]);

  const isNoteInScale = useCallback((noteClass: number) => {
    const scaleNotes = getCurrentScale();
    return scaleNotes.includes(noteClass % 12);
  }, [getCurrentScale]);

  return {
    getCurrentScale,
    isNoteInScale,
    getScaleDisplayName: () => `${key} ${scale}`,
    getKeySignature: () => keySignatures[key]
  };
}
```

---

## State Management Best Practices

### 1. **Prefer Context for Global State**
- Use GlobalMusicContext for app-wide musical parameters
- Avoid prop drilling for shared state

### 2. **Keep Local State Local**
- UI-specific state (modals, dropdowns) → useState
- Component-only state → Don't lift unnecessarily

### 3. **Persist User Preferences**
- Musical settings → localStorage
- Device configs → Supabase (authenticated) or localStorage (anonymous)

### 4. **Separate Concerns**
- Musical state → GlobalMusicContext
- Auth state → useAuth hook (integrated into GlobalMusicContext)
- Device state → Service singletons with hooks

### 5. **Optimistic Updates**
- Update UI immediately
- Sync to backend/storage asynchronously
- Revert on failure

---

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    GlobalMusicContext                    │
│  (tempo, key, scale, colorMode, masterVolume, isPlaying)│
└──────────────────────────────────────────────────────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
        ┌────────────┬────────────┬──────────────┐
        │DrumMachine │ PianoRoll  │GuitarFretboard│
        │            │            │              │
        │ (consumes  │ (consumes  │  (consumes   │
        │  global)   │  global)   │   global)    │
        └────────────┴────────────┴──────────────┘
                           │
                           ▼
                ┌──────────────────┐
                │   localStorage   │
                │ (persists prefs) │
                └──────────────────┘

    ┌──────────────────────────────────────────────┐
    │       Jam Session (Supabase Realtime)       │
    │  Broadcast: tempo, key, scale, playback     │
    └──────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────┐
                │ GlobalMusicContext│
                │  (synchronized)   │
                └──────────────────┘
```

---

## Summary

**State Management:** React Context API
**Persistence:** localStorage + Supabase
**Real-time Sync:** Supabase Realtime
**Auth State:** Supabase Auth + useAuth hook
**Device State:** Service singletons with subscriptions

**Key Patterns:**
- ✅ GlobalMusicContext for musical parameters
- ✅ Module adapter pattern for context-aware components
- ✅ localStorage persistence for preferences
- ✅ Supabase Realtime for collaborative state
- ✅ Custom hooks for reusable state logic
- ✅ Optimistic updates for transport control
- ✅ Graceful degradation (standalone vs embedded)
