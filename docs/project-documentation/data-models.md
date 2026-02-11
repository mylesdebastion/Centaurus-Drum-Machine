# Data Models and TypeScript Types

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Scan Type:** Deep Scan

---

## Overview

This project uses **TypeScript for complete type safety** across the entire codebase. All data models are defined as TypeScript interfaces and types in the `src/types/` directory with **15 type definition files**.

---

## Type Definition Files

### Core Type Files

1. **api-contracts.ts** - Versioned public API interfaces (see API Contracts doc)
2. **wled.ts** - WLED device models and capabilities
3. **session.ts** - Real-time collaboration models
4. **chordProgression.ts** - Musical data structures
5. **visualization.ts** - Visualization routing models
6. **moduleAdapter.ts** - Module context and execution
7. **led.ts** - LED strip configuration and control
8. **ledFrame.ts** - LED frame data structures
9. **moduleRouting.ts** - Module routing system
10. **routing-rules.ts** - Visualization routing rules
11. **auth.ts** - Authentication models
12. **blendMode.ts** - LED blend modes
13. **visualizationMode.ts** - Visualization mode types
14. **index.ts** - Type re-exports
15. **window.d.ts** - Global window type extensions

---

## WLED Device Models

**File:** `src/types/wled.ts`

### Core Device Interface

```typescript
interface WLEDDevice {
  id: string;                          // Device UUID
  user_id: string;                     // Owner user ID
  name: string;                        // User-friendly name
  ip: string;                          // IPv4 address
  location?: string;                   // Physical location (optional)
  capabilities: DeviceCapabilities;    // Device capabilities
  priority: number;                    // 0-100 (higher = preferred)
  brightness: number;                  // 0-255
  reverse_direction: boolean;          // Reverse LED order
  enabled: boolean;                    // Active/inactive
  assigned_color?: string;             // Identification color (hex)
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
  last_seen_at?: string;              // ISO timestamp
}
```

### Device Capabilities

```typescript
interface DeviceCapabilities {
  dimensions: '1D' | '2D';             // Strip or grid
  ledCount: number;                    // Total LEDs
  gridConfig?: GridConfig;             // Required for 2D devices
  supportedVisualizations: VisualizationType[];
}

interface GridConfig {
  width: number;                       // Columns
  height: number;                      // Rows
  serpentine: boolean;                 // Wiring pattern
  orientation: 'horizontal' | 'vertical';
}
```

### Visualization Types

```typescript
type VisualizationType =
  | 'step-sequencer-grid'       // Drum machine on 2D grid
  | 'step-sequencer-1d'         // Drum machine on 1D strip
  | 'piano-keys'                // Piano keyboard on 1D strip
  | 'piano-roll-grid'           // Piano roll on 2D grid
  | 'fretboard-grid'            // Guitar fretboard on 2D grid
  | 'midi-trigger-ripple'       // Audio-reactive ripple
  | 'audio-spectrum'            // Frequency spectrum (1D)
  | 'generic-color-array';      // Generic fallback
```

### WLED Protocol Types

```typescript
interface WLEDInfoResponse {
  ver: string;                         // WLED version
  vid: number;                         // Version ID
  leds: {
    count: number;                     // Total LED count
    rgbw: boolean;                     // RGBW support
    wv: boolean;                       // White value
    cct: boolean;                      // Color temperature
    pwr: number;                       // Estimated power (mW)
    fps: number;                       // Current FPS
    maxpwr: number;                    // Max power limit
    maxseg: number;                    // Max segments
  };
  str: boolean;                        // Streaming active
  name: string;                        // Device name
  udpport: number;                     // UDP port
  live: boolean;                       // Live mode
  lm: string;                          // Live mode type
  lip: string;                         // IP address
  ws: number;                          // WebSocket clients
  fxcount: number;                     // Effect count
  palcount: number;                    // Palette count
  wifi: {
    bssid: string;
    rssi: number;                      // Signal strength
    signal: number;                    // Signal quality
    channel: number;
  };
  arch: string;                        // Architecture
  core: string;                        // Core version
  lwip: number;                        // LwIP version
  freeheap: number;                    // Free heap memory
  uptime: number;                      // Uptime (seconds)
  opt: number;                         // Options
  brand: string;                       // Brand
  product: string;                     // Product name
  mac: string;                         // MAC address
  ip: string;                          // IP address
}
```

---

## Session and Collaboration Models

**File:** `src/types/session.ts`

### Participant Model

```typescript
interface Participant {
  id: string;                          // Supabase presence ID
  name: string;                        // Display name
  isHost: boolean;                     // Session creator
  joinedAt: string;                    // ISO timestamp
}
```

### Session State

```typescript
interface SessionState {
  tempo: number;                       // BPM (40-300)
  isPlaying: boolean;                  // Transport state
  key?: string;                        // Musical key (optional)
  scale?: string;                      // Scale pattern (optional)
}
```

### Drum Step Event (Delta Sync)

**Story 17.1** - Delta-based state synchronization

```typescript
interface DrumStepEvent {
  track: number;                       // 0-7
  step: number;                        // 0-15
  enabled: boolean;                    // On/off
  velocity: number;                    // 0-100
}
```

### Broadcast Event Types

```typescript
type BroadcastEventType =
  | 'tempo-change'
  | 'playback-control'
  | 'key-change'
  | 'state-request'
  | 'state-response'
  | 'drum-step'
  | 'color-mode';
```

### Connection Status

```typescript
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
```

---

## Musical Data Models

**File:** `src/types/chordProgression.ts`

### Chord Structure

```typescript
interface ChordNote {
  string: number;                      // 1-6 (guitar string)
  fret: number;                        // 0-24
}

interface Chord {
  name: string;                        // e.g., "Cmaj7", "Am"
  notes: ChordNote[];                  // Fret/string positions
}
```

### Chord Progressions

```typescript
interface ChordProgression {
  name: string;                        // e.g., "Jazz ii-V-I in C"
  chords: Chord[];                     // Progression chords
}
```

### Roman Numeral Progressions

Key-agnostic progression representation:

```typescript
interface RomanNumeralProgression {
  name: string;                        // e.g., "Pop I-V-vi-IV"
  romanNumerals: string[];             // ["I", "V", "vi", "IV"]
  description: string;                 // Genre/usage description
  genre: string;                       // "Pop", "Jazz", "Blues", "Rock"
  scaleType: 'major' | 'minor';       // Scale context
}
```

### Musical Types

```typescript
type RootNote =
  | 'C' | 'C#' | 'Db'
  | 'D' | 'D#' | 'Eb'
  | 'E'
  | 'F' | 'F#' | 'Gb'
  | 'G' | 'G#' | 'Ab'
  | 'A' | 'A#' | 'Bb'
  | 'B';

type ScaleType = 'major' | 'minor';
```

---

## Visualization Routing Models

**File:** `src/types/visualization.ts`

### Module Identifiers

```typescript
type ModuleId =
  | 'drum-machine'
  | 'guitar-fretboard'
  | 'piano-roll'
  | 'audio-reactive'
  | 'isometric-sequencer';
```

### Visualization Producer

```typescript
interface VisualizationProducer {
  type: VisualizationType;
  dimensionPreference: '1D' | '2D' | 'either';
  overlayCompatible: boolean;
  priority: number;                    // 1-100 (higher = precedence)
}
```

**Priority Levels:**
- **100:** Exclusive (DrumMachine step sequencer)
- **50-99:** High priority (Guitar fretboard)
- **10-49:** Medium priority (Piano roll)
- **1-9:** Low priority (Generic fallbacks)

### Module Capability Declaration

```typescript
interface ModuleVisualizationCapability {
  moduleId: ModuleId;
  produces: VisualizationProducer[];
}
```

### Device Assignment

Result of routing matrix calculation:

```typescript
interface DeviceAssignment {
  device: WLEDDevice;
  primary: {
    moduleId: ModuleId;
    visualizationType: VisualizationType;
    producer: VisualizationProducer;
    compatibilityScore: number;        // 0-100
  };
  overlays: Array<{
    moduleId: ModuleId;
    visualizationType: VisualizationType;
    producer: VisualizationProducer;
  }>;
}
```

---

## Module Adapter Pattern

**File:** `src/types/moduleAdapter.ts`
**Epic 14, Story 14.2**

### Module Context

```typescript
type ModuleContext = 'standalone' | 'studio' | 'jam';
```

**Contexts:**
- **standalone:** Direct route access (/piano, /guitar-fretboard)
  - Uses local state
  - Shows all controls
- **studio:** Multi-module workspace
  - Consumes GlobalMusicContext
  - Hides redundant controls
- **jam:** Collaborative session
  - Consumes GlobalMusicContext
  - Hides redundant controls

### State Resolution

```typescript
interface ModuleStateResolution {
  isGlobalState: boolean;              // Using global vs local state
  context: ModuleContext;
  showLocalControls: boolean;          // Shorthand for context check
}
```

### Adapter Props

```typescript
interface ModuleAdapterProps {
  forceContext?: ModuleContext;        // Override detection
  disableContextDetection?: boolean;   // Always use local state
}
```

---

## LED Control Models

**File:** `src/types/led.ts`

### LED Color

```typescript
interface LEDColor {
  r: number;                           // 0-255
  g: number;                           // 0-255
  b: number;                           // 0-255
}
```

### LED Strip Configuration

```typescript
interface LEDStripConfig {
  id: string;                          // Unique identifier
  laneIndex: number;                   // Chromatic lane (0-11)
  ipAddress: string;                   // WLED device IP
  studentName?: string;                // Student identifier (education mode)
  enabled: boolean;
  lastSeen?: Date;
  status: 'connected' | 'disconnected' | 'error';
  ledCount: number;
  multiNotesMode: boolean;             // Multi-color visualization
  assignedLanes: number[];             // Multiple lane support
  reverseDirection: boolean;
}
```

### WLED State

```typescript
interface WLEDState {
  on: boolean;
  bri: number;                         // Brightness 0-255
  seg: Array<{
    id: number;
    start: number;                     // Start LED index
    stop: number;                      // Stop LED index
    col: number[][];                   // Colors array
    fx?: number;                       // Effect ID
    sx?: number;                       // Speed
    ix?: number;                       // Intensity
  }>;
}
```

### Classroom Controls

**Education Mode:**

```typescript
interface ClassroomControls {
  muteAllStrips: boolean;
  soloStripId: string | null;
  highlightDownbeats: boolean;
  showBeatNumbers: boolean;
  tempoVisualization: boolean;
  recordMode: boolean;
  playbackMode: boolean;
}
```

### Visualization Settings

```typescript
interface LEDVisualizationSettings {
  updateRate: number;                  // FPS for updates
  brightness: number;                  // Global brightness 0-1
  activeIntensity: number;             // Active note multiplier
  baseIntensity: number;               // Inactive step brightness
}
```

---

## Storage and Persistence

### Supabase Tables

**wled_devices table:**
- Primary storage for authenticated users
- Real-time sync across devices
- Row-level security (user_id filter)
- Columns match `WLEDDevice` interface

**profiles table:**
- User profile data
- Username, avatar URL
- Authentication metadata

### localStorage

**wled-devices key:**
- Anonymous user device storage
- JSON array of `WLEDDevice` objects
- Migrated to Supabase on sign-in
- Polled every 1 second for changes

---

## Type Safety Features

### Strict TypeScript Configuration

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

### Path Aliases

```json
{
  "@/*": ["./src/*"]
}
```

### Type Guards

Many interfaces include runtime type guards for validation:
- `isModuleCapabilities_v1()`
- `isNoteEvent_v1()`
- `isChordEvent_v1()`

---

## Database Schema

### WLED Devices Table (Supabase)

```sql
CREATE TABLE wled_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  location TEXT,
  capabilities JSONB NOT NULL,
  priority INTEGER DEFAULT 50,
  brightness INTEGER DEFAULT 204,
  reverse_direction BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  assigned_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);
```

**Indexes:**
- `user_id` for filtering
- `enabled` for active device queries

**Row-Level Security:**
- Users can only access their own devices
- Policy: `user_id = auth.uid()`

---

## Summary

**Total Type Files:** 15
**Core Data Models:** 8 major categories
**Supabase Tables:** 2 (wled_devices, profiles)
**localStorage Keys:** 1 (wled-devices)
**Type Safety:** Full TypeScript strict mode
**Storage Strategy:** Hybrid (Supabase + localStorage)

**Key Characteristics:**
- ✅ Complete type coverage
- ✅ Runtime type guards
- ✅ Versioned API contracts
- ✅ Hybrid storage (anonymous + authenticated)
- ✅ Real-time sync capabilities
- ✅ Education mode support
- ✅ Musical data structures
- ✅ Hardware integration models
