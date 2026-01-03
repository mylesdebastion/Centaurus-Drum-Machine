# Architecture Overview

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Scan Type:** Deep Scan

---

## Executive Summary

**Centaurus Drum Machine** is a React-based web application for interactive music creation with hardware integration. The system combines traditional web audio synthesis (Tone.js) with hardware MIDI controllers and WLED LED visualizations, enabling both solo and collaborative music-making experiences.

**Project Scale:** Small-to-medium creative coding project (20+ interactive modules)
**Architecture Pattern:** Component-based React with hardware abstraction layer
**Unique Features:** WLED LED visualization routing, real-time jam sessions, educational workshop mode

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 22.21.0 | JavaScript runtime |
| **Language** | TypeScript | 5.2.2 | Type-safe development |
| **Framework** | React | 18.2.0 | UI component architecture |
| **Build Tool** | Vite | 5.0.8 | Fast HMR + bundling |
| **Routing** | React Router | 7.9.3 | Client-side navigation |
| **Styling** | Tailwind CSS | 3.3.6 | Utility-first CSS |
| **Icons** | Lucide React | 0.294.0 | Icon library |
| **Audio** | Tone.js | 15.1.22 | Web audio synthesis |
| **Backend** | Supabase | 2.75.0 | Realtime + Auth + DB |
| **Testing** | Vitest | 3.2.4 | Unit testing |
| **E2E Testing** | Playwright | 1.56.0 | Browser automation |
| **Analytics** | Vercel Analytics | 1.5.0 | Performance monitoring |

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │            React Application Layer                 │     │
│  ├────────────────────────────────────────────────────┤     │
│  │                                                    │     │
│  │  GlobalMusicContext (Shared State)                │     │
│  │  ├─ tempo, key, scale, colorMode                  │     │
│  │  ├─ masterVolume, isPlaying                       │     │
│  │  └─ hardware config (MIDI, WLED)                  │     │
│  │                                                    │     │
│  ├────────────────────────────────────────────────────┤     │
│  │                                                    │     │
│  │  Module Layer (20+ Musical Modules)               │     │
│  │  ├─ DrumMachine (step sequencer)                  │     │
│  │  ├─ PianoRoll (piano sequencer)                   │     │
│  │  ├─ GuitarFretboard (chord player)                │     │
│  │  ├─ Studio (multi-module workspace)               │     │
│  │  └─ JamSession (collaborative mode)               │     │
│  │                                                    │     │
│  ├────────────────────────────────────────────────────┤     │
│  │                                                    │     │
│  │  Hardware Abstraction Layer                       │     │
│  │  ├─ MIDI Controller Abstraction                   │     │
│  │  ├─ WLED Device Registry                          │     │
│  │  └─ Visualization Routing Matrix                  │     │
│  │                                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                   │
│              ┌──────────┼──────────┐                        │
│              │          │          │                        │
│              ▼          ▼          ▼                        │
│       ┌──────────┬──────────┬──────────┐                   │
│       │ Tone.js  │ Web MIDI │ WLED HTTP│                   │
│       │ Audio    │   API    │ /WebSocket│                  │
│       └──────────┴──────────┴──────────┘                   │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Supabase  │
                    ├─────────────┤
                    │ • Realtime  │
                    │ • Auth      │
                    │ • Postgres  │
                    └─────────────┘
```

---

## Core Architectural Patterns

### 1. **Module System Architecture**

**Epic 14: Module Adapter Pattern**

Modules adapt to three execution contexts:

- **Standalone:** Direct route access (`/piano`, `/guitar-fretboard`)
  - Uses local state
  - Shows all controls
- **Studio:** Multi-module workspace (`/studio`)
  - Consumes GlobalMusicContext
  - Hides redundant controls
- **Jam:** Collaborative session (`/jam`)
  - Synchronized with Supabase Realtime
  - Read-only global state

**Module Registry:**
```typescript
const moduleRegistry = {
  'drum-machine': DrumMachineAdapter,
  'piano-roll': PianoRollAdapter,
  'guitar-fretboard': GuitarFretboardAdapter,
  'chord-melody-arranger': ChordMelodyArrangerAdapter,
  'isometric-sequencer': IsometricSequencerAdapter
};
```

---

### 2. **WLED Visualization Routing**

**Epic 18: Intelligent WLED Routing**

Smart routing system that assigns LED devices to modules based on:

- **Device capabilities** (1D strip vs 2D grid)
- **Module priorities** (exclusive, high, medium, low)
- **Dimension preferences** (guitar prefers 2D grids)
- **Overlay compatibility** (audio-reactive can overlay)

**Routing Rules:**
1. **Guitar on 2D grid** → Exclusive access (highest priority)
2. **DrumMachine on 2D grid** → Takes over if guitar inactive
3. **Piano Roll** → Falls back to 1D strip if no 2D available
4. **Audio Reactive** → Overlays on active devices
5. **Generic fallback** → Any unassigned device

**Implementation:**
- `VisualizationRoutingMatrix` service
- Context-aware routing rules
- Real-time device assignment updates

---

### 3. **Hardware Abstraction Layer**

**Purpose:** Unified interface for diverse hardware controllers

**Supported Hardware:**
- **MIDI Controllers:** APC40, Launchpad Pro, generic MIDI
- **MIDI Keyboards:** Roli Lumi, standard MIDI keyboards
- **LED Devices:** WLED-compatible ESP32/ESP8266 strips/grids

**Abstraction Interface:**
```typescript
interface HardwareControllerAPI_v1 {
  id: string;
  name: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  capabilities: ControllerCapabilities_v1;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  addEventListener(type: HardwareEventType_v1, callback: Function): void;
  removeEventListener(type: HardwareEventType_v1, callback: Function): void;
}
```

---

### 4. **Versioned API Contracts**

**Breaking Change Policy:**
- NEVER modify existing versioned interfaces
- ALWAYS add new fields as optional
- NEVER remove fields (deprecate instead)
- ALWAYS bump version for breaking changes (v1 → v2)

**Current Contracts:**
- `GlobalMusicAPI_v1`
- `ModuleSystemAPI_v1`
- `HardwareAPI_v1`
- `VisualizationAPI_v1`
- `SessionAPI_v1`
- `AuthAPI_v1`

All contracts include type guards and migration helpers.

---

## Data Flow Architecture

### Musical State Flow

```
┌─────────────────┐
│ GlobalMusicHeader│ (User changes tempo)
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│GlobalMusicContext   │ updateTempo(140)
│ ├─ localStorage     │ (Persist to disk)
│ └─ Tone.js Transport│ (Sync audio engine)
└────────┬────────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┬──────┬─────────┐
│Drum │Piano │ Guitar  │ (All modules synchronized)
│Machine│Roll│Fretboard│
└─────┴──────┴─────────┘
```

### Collaborative Session Flow

```
┌──────────────┐
│ Host (Alice) │ updateTempo(140)
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ supabaseSessionService  │ broadcastTempo(140)
│  (Supabase Realtime)    │
└────────┬────────────────┘
         │
         │ (Broadcast event via WebSocket)
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌──────┬──────┬──────┐
│Alice │ Bob  │Carol │ (All participants synchronized)
│(Host)│(Guest)│(Guest)│
└──────┴──────┴──────┘
         │
         ▼
┌─────────────────────┐
│GlobalMusicContext   │ updateTempo(140)
│  (Local update)     │
└─────────────────────┘
```

### WLED Visualization Flow

```
┌──────────────┐
│ DrumMachine  │ (Active step highlighted)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ moduleRoutingService │ (Determine target devices)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ LEDCompositor        │ (Generate LED frame data)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ WLEDDeviceRegistry   │ (Send to device via HTTP)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  WLED Device (IP)    │ HTTP POST /json/state
│  192.168.1.100       │ (Display visualization)
└──────────────────────┘
```

---

## Storage Architecture

### Hybrid Storage Strategy

**Anonymous Users:**
- Device configs → `localStorage` (`wled-devices` key)
- Musical preferences → `localStorage` (`globalMusicSettings` key)
- Polling interval: 1 second for device changes

**Authenticated Users:**
- Device configs → Supabase `wled_devices` table
- Musical preferences → `localStorage` (same key)
- Real-time sync via Supabase Realtime

**Migration on Sign-In:**
```
localStorage devices → Supabase wled_devices table
(Automatic sync, then clear localStorage)
```

### Supabase Schema

**wled_devices table:**
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

**Row-Level Security:**
```sql
ALTER TABLE wled_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own devices"
  ON wled_devices
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Component Architecture

### Design System Hierarchy

```
ViewTemplate (Standard layout wrapper)
  ├─ Header (Back button + Title + Actions)
  ├─ Content Area
  │   ├─ ViewCard (Section container)
  │   ├─ ViewCard (Section container)
  │   └─ CollapsiblePanel (Expandable section)
  └─ Footer (optional)
```

**Usage:**
- ✅ Use ViewTemplate for all experiment/demo pages
- ✅ Use ViewCard for logical sections
- ✅ Maintain consistent spacing (space-y-6)
- ✅ Follow mobile-first responsive design

### Component Categories

**24 major component categories:**
1. DrumMachine (step sequencer)
2. PianoRoll (piano sequencer)
3. GuitarFretboard (chord player)
4. Studio (multi-module workspace)
5. JamSession (collaborative mode)
6. WLED ecosystem (device management)
7. GlobalMusicHeader (shared controls)
8. Hardware (MIDI controllers)
9. Auth (authentication)
10. Education (workshop mode)
11. Layout (reusable layouts)
12. ...and 13 more (see component-inventory.md)

---

## Real-Time Collaboration Architecture

**Epic 7: Jam Session Backend**

### Session Lifecycle

1. **Host creates session** → Generates 6-character room code
2. **Host tracks presence** → Supabase Presence API
3. **Guests join via code** → Subscribe to same channel
4. **State synchronization** → Broadcast events (tempo, key, playback)
5. **Delta sync** → Drum step changes (efficient pattern editing)

### Broadcast Events

- `tempo-change` - Sync BPM
- `playback-control` - Play/pause state
- `key-change` - Musical key and scale
- `drum-step` - Delta-based pattern sync (Story 17.1)
- `color-mode` - Visualization mode (Story 17.2)

### Latency Optimization

- **Target:** <200ms state sync across participants
- **Strategy:** Delta-based updates (only changed data)
- **Transport:** WebSocket (Supabase Realtime)
- **Fallback:** Automatic reconnection handling

---

## Security Architecture

### Authentication

**Provider:** Supabase Auth

**Features:**
- Email/password authentication
- Anonymous user support
- Session persistence (local storage + HTTP-only cookies)
- Row-level security on database tables

### Row-Level Security (RLS)

**wled_devices table:**
```sql
CREATE POLICY "Users can only access their own devices"
  ON wled_devices
  FOR ALL
  USING (auth.uid() = user_id);
```

**Enforcement:**
- All Supabase queries automatically filtered by `user_id`
- Anonymous users cannot access Supabase tables
- Public data (session presence) uses unauthenticated channels

---

## Deployment Architecture

### Hosting: Vercel

**Production:** `jam.audiolux.app`
**Preview:** `dev-jam.audiolux.app`

**Build Configuration:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Static Assets

**CDN:** Vercel Edge Network

**Optimization:**
- Image optimization via Vercel
- Automatic code splitting (Vite)
- Tree-shaking for smaller bundles
- Gzip/Brotli compression

---

## Performance Considerations

### Audio Engine

**Tone.js Transport:**
- Scheduled ahead of time for precise timing
- Optimistic updates for iOS Safari user gestures
- Automatic audio context startup

**WLED Updates:**
- Throttled to device capabilities (typically 30-60 FPS)
- Batched HTTP requests
- Color pre-computation for performance

### State Management

**Optimizations:**
- Memoized context values (useMemo)
- Callback memoization (useCallback)
- Selective re-renders (React.memo for expensive components)

---

## Testing Strategy

**Approach:** Manual testing with human-in-the-loop verification

**Testing Workflow:**
- Browser DevTools for debugging
- Visual inspection of modules
- Audio verification by ear
- MIDI controller hardware testing
- WLED device testing with physical hardware

**No Automated Tests:**
- Project uses manual testing approach
- Dev Agent Records document testing performed
- See CLAUDE.md for testing philosophy

---

## Development Workflow

### Branch Strategy (Post-Cleanup)

**Target workflow:**
```
feature/* → dev → main
            ↓
      dev-jam.audiolux.app
                        ↓
                  jam.audiolux.app
```

**Current status:** Branch housekeeping needed (see docs/GIT_HOUSEKEEPING.md)

### Build Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # TypeScript + ESLint
npm run test       # Run Vitest tests
```

---

## Key Architectural Decisions

### 1. **React Context vs Redux**
**Decision:** Use React Context API
**Rationale:** Simpler for project scale, no need for Redux boilerplate

### 2. **Supabase vs Custom Backend**
**Decision:** Use Supabase
**Rationale:** Real-time features out-of-the-box, no server management

### 3. **TypeScript Strict Mode**
**Decision:** Enable all strict flags
**Rationale:** Catch errors at compile time, better IDE support

### 4. **WLED HTTP API vs WebSocket**
**Decision:** Use HTTP for primary communication
**Rationale:** More reliable, simpler error handling (WebSocket in research phase)

### 5. **localStorage vs Cookies**
**Decision:** Use localStorage for preferences
**Rationale:** Larger storage limit, no HTTP overhead

---

## Future Architecture Considerations

### Scalability

**Current:** Single-region deployment (Vercel Edge)
**Future:** Multi-region for lower latency

### Offline Support

**Current:** Requires internet for Supabase features
**Future:** Service worker for offline mode

### Mobile Apps

**Current:** PWA-capable web app
**Future:** React Native mobile apps

---

## Summary

**Architecture Type:** Monolith web application
**Pattern:** Component-based React with hardware abstraction
**State Management:** React Context API + localStorage
**Backend:** Supabase (Realtime + Auth + Postgres)
**Deployment:** Vercel Edge Network
**Testing:** Manual browser-based testing

**Key Strengths:**
- ✅ Modular component architecture
- ✅ Hardware abstraction layer
- ✅ Real-time collaboration
- ✅ Versioned API contracts
- ✅ Type-safe TypeScript
- ✅ Hybrid storage (anonymous + authenticated)
- ✅ Educational workshop mode

**Technical Debt:**
- ⚠️ Branch housekeeping needed
- ⚠️ WLED WebSocket implementation incomplete
- ⚠️ Some legacy components (JamSessionLegacy)

**See Also:**
- `api-contracts.md` - API documentation
- `data-models.md` - TypeScript types
- `component-inventory.md` - Component catalog
- `state-management.md` - State patterns
