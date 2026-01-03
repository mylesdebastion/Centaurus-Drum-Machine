# API Contracts Documentation

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Scan Type:** Deep Scan

---

## Overview

This project implements a comprehensive **versioned API contract system** to ensure backward compatibility and prevent breaking changes. All public interfaces follow semantic versioning (v1, v2, etc.) and include type guards, migration helpers, and deprecation tracking.

---

## API Contract Categories

### 1. **Global Music State API (v1)**

**Purpose:** Central musical configuration shared across all modules

**Provider:** `GlobalMusicContext`

**State Interface:**
```typescript
interface GlobalMusicState_v1 {
  tempo: number;              // BPM (40-300)
  key: string;                // Musical root note (A-G with # or b)
  scale: string;              // Scale pattern (major, minor, pentatonic, etc.)
  colorMode: 'spectrum' | 'chromatic' | 'harmonic';
  masterVolume: number;       // 0-1
  isPlaying: boolean;         // Transport state
}
```

**Actions:**
- `updateTempo(tempo: number)`
- `updateKey(key: string)`
- `updateScale(scale: string)`
- `updateColorMode(mode)`
- `updateMasterVolume(volume: number)`
- `updateTransportState(playing: boolean)`

**Utilities:**
- `getCurrentScale()` → `number[]` (MIDI note classes)
- `isNoteInScale(noteClass: number)` → `boolean`
- `getScaleDisplayName()` → `string`

**Consumers:** All modules (DrumMachine, PianoRoll, GuitarFretboard, etc.)

---

### 2. **Module System API (v1)**

**Purpose:** Inter-module communication and routing

**Module Capabilities:**
```typescript
interface ModuleCapabilities_v1 {
  canReceiveNotes?: boolean;
  canReceiveChords?: boolean;
  canReceiveTempo?: boolean;
  canEmitNotes?: boolean;
  canEmitChords?: boolean;
}
```

**Event Types:**
- **NoteEvent_v1:** MIDI note on/off events
  - `type`: 'note-on' | 'note-off'
  - `pitch`: 0-127
  - `velocity`: 0-127
  - `sourceInstanceId`: string

- **ChordEvent_v1:** Chord change events
  - `chordName`: "Cmaj7", "Am", etc.
  - `notes`: MIDI note numbers
  - `sourceInstanceId`: string

**Module Contexts:**
- `standalone` - Independent operation
- `studio` - Multi-module workspace
- `jam` - Collaborative session

---

### 3. **Hardware Abstraction API (v1)**

**Purpose:** Unified interface for MIDI controllers

**Connection Status:**
- `connected` | `disconnected` | `error`

**Hardware Events:**
- `step_toggle` - Pad/button press
- `connection_change` - Device connect/disconnect
- `hardware_input` - Generic input event

**Controller Capabilities:**
```typescript
interface ControllerCapabilities_v1 {
  hasLEDs: boolean;
  hasVelocityPads: boolean;
  hasKnobs: boolean;
  hasTransportControls: boolean;
  stepButtonCount: number;
  trackButtonCount: number;
}
```

**Supported Controllers:**
- Akai APC40/APC40 MkII (optimized)
- Novation Launchpad series
- Arturia BeatStep
- Generic MIDI controllers

**Interface Methods:**
- `connect()` / `disconnect()`
- `addEventListener(type, callback)`
- `removeEventListener(type, callback)`
- `handleError(error)`

---

### 4. **Visualization System API (v1)**

**Purpose:** WLED LED visualization routing

**Dimension Preferences:**
- `1D` - Strip/linear layout
- `2D` - Grid/matrix layout
- `either` - Compatible with both

**Visualization Declaration:**
```typescript
interface VisualizationProducer_v1 {
  type: string;                          // "step-sequencer", "piano-roll", etc.
  dimensionPreference: '1D' | '2D' | 'either';
  overlayCompatible: boolean;
  priority: number;                      // 1-100 (higher = precedence)
}
```

**Module IDs:**
- `drum-machine`
- `guitar-fretboard`
- `piano-roll`
- `audio-reactive`
- `isometric-sequencer`

**Routing Rules:**
- Guitar on 2D grid gets exclusive access
- Drum machine prefers grids
- Audio reactive overlays on active devices
- Context-aware priority system

---

### 5. **Session/Collaboration API (v1)**

**Purpose:** Real-time jam session management (Supabase Realtime)

**Service:** `supabaseSessionService`

**Session State:**
```typescript
interface JamSessionState_v1 {
  sessionId: string;
  sessionCode: string;           // 6-character code
  users: User_v1[];
  tempo: number;
  isPlaying: boolean;
  currentStep: number;
}
```

**Session Actions:**
- `createSession(userName)` → `Promise<string>` (room code)
- `joinSession(roomCode, userName)` → `Promise<void>`
- `leaveSession()` → `Promise<void>`

**Broadcast Events:**
- `tempo-change` - Sync BPM across participants
- `playback-control` - Play/pause state
- `key-change` - Musical key and scale
- `drum-step` - Delta-based pattern sync
- `color-mode` - Visualization color mode

**Presence Tracking:**
- Automatic participant join/leave detection
- Peer ID assignment
- Host/guest designation

**Real-time Sync:**
- <200ms latency for state changes
- Supabase Realtime channels
- Automatic reconnection handling

---

### 6. **Authentication API (v1)**

**Purpose:** User authentication and profile management

**Provider:** Supabase Auth

**Auth State:**
```typescript
interface AuthState_v1 {
  user: { id: string; email?: string } | null;
  profile: { id: string; username: string; avatar_url?: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
}
```

**Features:**
- Anonymous user support
- Email/password authentication
- Profile management
- Session persistence

---

## WLED Device Registry Service

**File:** `src/services/WLEDDeviceRegistry.ts`

**Purpose:** Manage WLED LED controller devices

**Storage Strategy:**
- **Anonymous Users:** localStorage (local only)
- **Authenticated Users:** Supabase (synced across devices)
- **Sign-in Sync:** Automatic migration on authentication

**CRUD Operations:**
- `getDevices()` → `Promise<WLEDDevice[]>`
- `getDevice(deviceId)` → `Promise<WLEDDevice | null>`
- `createDevice(input)` → `Promise<WLEDDevice>`
- `updateDevice(id, updates)` → `Promise<WLEDDevice>`
- `deleteDevice(id)` → `Promise<void>`

**Device Capabilities:**
```typescript
interface WLEDDeviceCapabilities {
  dimensions: '1D' | '2D';
  ledCount: number;
  gridConfig?: {
    width: number;
    height: number;
    serpentine: boolean;
    orientation: 'horizontal' | 'vertical';
  };
  supportedVisualizations: string[];
}
```

**Connection Testing:**
- `testConnection(ip)` → `Promise<WLEDInfoResponse>`
- 5-second timeout
- Fetches device info from WLED HTTP API (`/json/info`)

**Device Control:**
- `turnOffDevice(ip)` - Power off device
- `sendSolidColor(ip, color)` - Send RGB color
- `sendRainbowTestPattern(ip, ledCount)` - Test pattern

**Real-time Sync:**
- Authenticated: Supabase Realtime subscription
- Anonymous: localStorage polling (1s interval)

**Subscription:**
```typescript
const unsubscribe = wledDeviceRegistry.subscribeToDevices((devices) => {
  console.log('Devices updated:', devices);
});
```

---

## Supabase Session Service

**File:** `src/services/supabaseSession.ts`

**Purpose:** Real-time collaborative jam sessions

**Channel Naming:** `jam-session:{roomCode}`

**Room Code:** 6 alphanumeric characters (e.g., "ABC123")

**Methods:**

**Session Management:**
```typescript
// Host creates session
const roomCode = await supabaseSessionService.createSession('Alice');

// Guest joins session
await supabaseSessionService.joinSession('ABC123', 'Bob');

// Leave session
await supabaseSessionService.leaveSession();
```

**Presence Tracking:**
```typescript
// Subscribe to participant changes
const unsubscribe = supabaseSessionService.onPresenceSync((participants) => {
  console.log('Participants:', participants);
});
```

**Broadcasting:**
```typescript
// Broadcast tempo change
await supabaseSessionService.broadcastTempo(140);

// Listen for tempo changes
supabaseSessionService.onTempoChange((tempo) => {
  console.log('New tempo:', tempo);
});

// Other broadcast methods:
await supabaseSessionService.broadcastPlayback(true);
await supabaseSessionService.broadcastKeyScale('C', 'major');
await supabaseSessionService.broadcastDrumStep({ track, step, enabled, velocity });
await supabaseSessionService.broadcastColorMode('harmonic');
```

**Connection Status:**
- `connectionStatus` - 'connected' | 'disconnected'
- `isInSession()` - Check active session
- `myPeerId` - Current user's presence key
- `isHost` - Host status

**Story Implementation:**
- Story 7.2: Supabase Realtime Service Layer
- Story 17.1: Delta Drum State Sync
- Story 17.2: Client-side Color Derivation

---

## Versioning and Breaking Changes

**Version Registry:**
```typescript
export const API_VERSION_REGISTRY = {
  GlobalMusicAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
  ModuleSystemAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
  HardwareAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
  VisualizationAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
  SessionAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
  AuthAPI: { current: 'v1', versions: ['v1'], deprecated: [] },
};
```

**Breaking Change Policy:**
- **NEVER** modify existing versioned interfaces
- **ALWAYS** add new fields as optional (`?`)
- **NEVER** remove fields (deprecate instead)
- **ALWAYS** bump version for breaking changes (v1 → v2)
- **KEEP** deprecated versions for minimum 2 release cycles

**Related Documentation:**
- `docs/architecture/breaking-change-policy.md`

---

## Type Guards

All major interfaces include runtime type guards for validation:

- `isModuleCapabilities_v1(obj)`
- `isNoteEvent_v1(obj)`
- `isChordEvent_v1(obj)`

---

## Integration Points

**Supabase Tables:**
- `wled_devices` - WLED device registry (authenticated users)
- `profiles` - User profiles
- Real-time channels for jam sessions

**External APIs:**
- **WLED HTTP API:** `/json/info`, `/json/state`
- **Web MIDI API:** Browser native MIDI device access
- **Supabase Realtime:** WebSocket-based state sync

**Browser APIs:**
- Web MIDI API (HTTPS required)
- localStorage (anonymous device storage)
- fetch with AbortSignal (timeout handling)

---

## Summary

**Total API Contracts:** 6 major categories
**Current Version:** v1 (all contracts)
**Versioning Strategy:** Semantic versioning with backward compatibility
**Storage Layers:** Supabase (auth) + localStorage (anonymous)
**Real-time Sync:** Supabase Realtime + localStorage polling
**Hardware Integration:** Web MIDI API + WLED HTTP/WebSocket

This versioned contract system ensures:
- ✅ Backward compatibility across releases
- ✅ Safe inter-module communication
- ✅ Predictable breaking change handling
- ✅ Runtime type validation
- ✅ Clear migration paths
