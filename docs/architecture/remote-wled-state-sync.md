# Remote WLED Control via State Sync - Design Document

**Epic:** 17 - Remote WLED Control via Jam Sessions
**Status:** 🚧 DESIGN - Ready for Epic Creation
**Author:** Winston (Architect)
**Stakeholder:** Myles (Visionary/Primary User)
**Date:** 2025-10-18
**Version:** 1.0

---

## Document Purpose

This document describes the architecture for enabling remote devices (e.g., iPad at jam.audiolux.app) to control local WLED hardware via jam sessions. This solves the **WebSocket security limitation** that prevents domain deployments from directly controlling local WLED devices.

**Core Insight:** Instead of relaying LED frames across the network, we sync **musical state** (drum patterns, notes, chords) and generate LED frames **locally on the device with WLED access**.

**Scope Control:** This design focuses ONLY on musical state synchronization and local LED generation. No new bridge infrastructure, no device role detection - follows KISS principle.

---

## Executive Summary

**Problem:** Domain deployment (jam.audiolux.app) cannot control local WLED devices due to WebSocket mixed-content security restrictions (HTTPS cannot connect to HTTP WebSocket on local network).

**Solution:** Sync musical state via Supabase Realtime, generate LED frames locally on devices with WLED access.

**Stakeholder Quote (Myles, 2025-10-18):**
> "The LEDframes are not generated on the remote device i.e iPad, they are generated on the local device which it can do so because it's own drum machine is a 1:1 clone and has all the drum state information it needs as well as additional (as needed) mic/audio input for dj-visualizer. This keeps latency to a minimum whilst the music notes/triggers/chords/melodies etc are synced via supabase."

**Architecture Benefits:**
- ✅ **Zero new infrastructure** - Extends existing Supabase session sync (Epic 7)
- ✅ **Minimal latency** - LED frames generated milliseconds before WLED output
- ✅ **Low bandwidth** - Musical state (~2-20 bytes per event) vs LED frames (~450 bytes @ 30 FPS)
- ✅ **KISS principle** - No bridge mode detection, no device roles
- ✅ **Scalable** - Free tier supports 50 concurrent jams, Pro tier 125+ jams

**MVP Scope (Epic 17):**
- ✅ Delta-based drum pattern sync (step changes only)
- ✅ Client-side color derivation (sync colorMode, derive colors locally)
- ✅ Multi-module state sync (DrumMachine, Piano, IsometricSequencer)
- ✅ Optimized message format (<1KB per message)
- ✅ Natural "bridge" behavior (devices with WLED automatically output)

**Future Enhancements (Epic 18+):**
- ⏸️ Binary message format (Uint8Array instead of JSON)
- ⏸️ DJ visualizer audio input integration
- ⏸️ Pattern compression for complex sequences
- ⏸️ Session recording/playback

---

## 1. Problem Statement

### 1.1 Current Limitation

**Vercel deployment (jam.audiolux.app):**
- Served over HTTPS (required for production)
- Browser security blocks HTTP WebSocket connections to local network
- **Result:** Remote devices cannot control WLED

**Local development (localhost:5173):**
- Served over HTTP
- Can connect to local WLED devices via HTTP WebSocket
- **Result:** Works perfectly, but only locally

### 1.2 User Story

**Scenario:**
1. User A (iPad @ jam.audiolux.app) programs drum pattern
2. User B (Desktop on same network as WLED) joins same jam session
3. **Expected:** Drum pattern triggers LED strips on User B's local network
4. **Current:** Cannot happen due to WebSocket security

**Epic 17 Goal:** Enable this scenario with **zero new infrastructure**.

---

## 2. Architecture Overview

### 2.1 Data Flow (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│ Remote Device (iPad @ jam.audiolux.app)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. User programs DrumMachine pattern                        │
│ 2. Broadcast musical state via Supabase:                    │
│    - Step toggle: { track: 0, step: 7, enabled: true }      │
│    - Note trigger: { note: 60, velocity: 80 }               │
│    - ColorMode: { mode: 'harmonic' }                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                 Supabase Realtime Channel
                 (Musical State - 2-20 bytes per event)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Local Device (Desktop with WLED on same network)            │
├─────────────────────────────────────────────────────────────┤
│ 1. Subscribe to musical state broadcasts                    │
│ 2. Run local DrumMachine instance (1:1 state clone)        │
│ 3. Apply state changes to local module                      │
│ 4. Generate LED frames LOCALLY (<1ms before output)         │
│ 5. LEDCompositor → WLED (EXISTING)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    WLED Hardware (Local Network)
```

### 2.2 Key Principles

**1. State Sync, Not Frame Relay**
- Sync: Musical state (drum patterns, notes, chords)
- Don't sync: LED frames (generated locally)

**2. KISS - No Bridge Mode**
- Every device runs modules based on session state
- Devices with WLED automatically output (via existing compositor)
- No special "bridge" role detection needed

**3. Delta Updates Only**
- Send only changes (step toggles, note triggers)
- No full-state broadcasts during playback loops
- Pattern loops locally with zero network traffic

**4. Client-Side Derivation**
- Sync `colorMode` once when changed
- Each device calculates `note → color` locally
- Reduces bandwidth by 50%+

---

## 3. Technical Components

### 3.1 Existing Infrastructure (Epic 7)

**Already Built:**
- ✅ Supabase Realtime Channels (`supabaseSessionService`)
- ✅ Session management (room codes, participants)
- ✅ Broadcast/subscribe patterns (`broadcastTempo`, `onTempoChange`)
- ✅ State sync (tempo, playback, key/scale)

**Location:** `src/services/supabaseSession.ts`

**Current Broadcasts:**
```typescript
// Already working in Epic 7:
supabaseSessionService.broadcastTempo(120);
supabaseSessionService.broadcastPlayback(true);
supabaseSessionService.broadcastKeyScale('C', 'major');
```

### 3.2 Existing LED Infrastructure (Epic 14)

**Already Built:**
- ✅ LEDCompositor Service (`src/services/LEDCompositor.ts`)
- ✅ WLED device management (`GlobalMusicContext.hardware.wled`)
- ✅ LED frame types (`LEDFrame`, `RGB`, `BlendMode`)
- ✅ Multi-module blending (multiply, screen, additive, max)

**Flow:**
```typescript
// Module generates LED frame
const frame: LEDFrame = {
  moduleId: 'drum-machine',
  deviceId: 'wled-strip-1',
  pixelData: new Uint8ClampedArray([255, 0, 0]) // Red
};

// Submit to compositor (EXISTING)
ledCompositor.submitFrame(frame);

// Compositor sends to WLED (EXISTING)
// Only happens if device has WLED configured
```

### 3.3 New Components (Epic 17)

**Extend `supabaseSessionService`:**
```typescript
// src/services/supabaseSession.ts

class SupabaseSessionService {
  // NEW: Drum pattern state sync
  broadcastDrumStep(data: {
    track: number;    // uint8 index
    step: number;     // uint8 0-15
    enabled: boolean;
    velocity: number; // uint8 0-100
  }): void;

  onDrumStep(callback: (data: DrumStepEvent) => void): () => void;

  // NEW: Note triggers
  broadcastNote(data: {
    note: number;     // uint8 MIDI note
    velocity: number; // uint8 0-100
  }): void;

  onNote(callback: (data: NoteEvent) => void): () => void;

  // NEW: Color mode sync (existing pattern)
  broadcastColorMode(mode: ColorMode): void;
  onColorModeChange(callback: (mode: ColorMode) => void): () => void;

  // NEW: Full pattern reset (sent rarely)
  broadcastDrumPattern(tracks: DrumTrack[]): void;
  onDrumPatternReset(callback: (tracks: DrumTrack[]) => void): () => void;
}
```

**Natural Bridge Behavior:**
```typescript
// In JamSession.tsx or module components

// When receiving remote state
supabaseSessionService.onDrumStep(({ track, step, enabled, velocity }) => {
  // Apply to local module instance
  setTracks(prev => updateStep(prev, track, step, enabled, velocity));

  // LED frames generated automatically by module
  // LEDCompositor sends to WLED if device has it configured
  // No special "bridge mode" logic needed
});
```

---

## 4. Message Optimization

### 4.1 Optimization Strategies

**Priority Ranking:**

1. **Delta Updates Only** (99% bandwidth savings) ✅ CRITICAL
   - Send step changes, not full patterns
   - Pattern loops locally, zero network traffic during playback

2. **Client-Side Color Derivation** (50% savings) ✅ HIGH
   - Sync colorMode once when changed
   - Derive note colors locally: `note → color(note, mode, key, scale)`

3. **State Compression** (20-30% savings) 🟡 MEDIUM (Future)
   - Use Uint8Array instead of JSON
   - Track indices instead of string IDs

4. **Debouncing** (30-50% savings on rapid edits) 🟡 MEDIUM (Future)
   - Batch rapid edits (50ms window)

5. **Presence-Based Filtering** (variable savings) 🟢 LOW (Future)
   - Don't broadcast if solo practice mode

### 4.2 Message Format Specifications

**Optimized Message Types (JSON MVP):**

```typescript
// 1. Drum Step Toggle (~70 bytes JSON, target: 7 bytes binary future)
{
  type: 'drum-step',
  track: 0,        // uint8 index (0-7)
  step: 7,         // uint8 (0-15)
  enabled: true,   // boolean
  velocity: 80     // uint8 (0-100)
}

// 2. Note Trigger (~50 bytes JSON, target: 2-3 bytes binary future)
{
  type: 'note',
  note: 60,        // uint8 MIDI note (0-127)
  velocity: 80     // uint8 (0-100), optional default 80
}

// 3. Color Mode Sync (~30 bytes JSON, sent once)
{
  type: 'color-mode',
  mode: 'harmonic' // 'chromatic' | 'harmonic' | 'spectrum'
}

// 4. Full Pattern Reset (~1.5KB JSON, sent rarely)
{
  type: 'drum-pattern-reset',
  tracks: [
    {
      id: 'kick',
      steps: [true, false, ...], // 16 booleans
      velocities: [80, 0, ...],   // 16 uint8
      muted: false,
      solo: false,
      volume: 100
    },
    // ... 7 more tracks
  ]
}
```

**Bandwidth Comparison:**

| Event Type | Naive Full-State | Optimized Delta | Savings |
|------------|------------------|-----------------|---------|
| Step Toggle | 1.7 KB (full pattern) | 70 bytes (JSON) | 96% |
| Note Trigger (with RGB) | 13 bytes | 50 bytes (JSON) | - |
| Note Trigger (color derived) | 13 bytes | 50 bytes (JSON) | 62% |
| Color Mode Change | - | 30 bytes (JSON) | - |

**Future Binary Format (Epic 18+):**
- Drum step: 7 bytes (vs 70 bytes JSON) = 90% reduction
- Note trigger: 2 bytes (vs 50 bytes JSON) = 96% reduction

### 4.3 Client-Side Color Derivation

**Current (Inefficient):**
```typescript
// Send RGB with every note (13 bytes)
broadcastNote({ note: 60, velocity: 80, r: 255, g: 0, b: 0 });
```

**Optimized (Epic 17):**
```typescript
// Send note only (2 bytes binary future, 50 bytes JSON MVP)
broadcastNote({ note: 60, velocity: 80 });

// Receiver derives color locally
const music = useGlobalMusic(); // colorMode already synced
const color = getNoteColor(
  note,
  music.colorMode,
  music.key,
  music.scale
);

// Function: src/utils/colorMapping.ts (EXISTING)
export function getNoteColor(
  note: number,
  colorMode: ColorMode,
  key: RootNote,
  scale: ScaleName
): RGB {
  // ... existing logic
}
```

**Benefits:**
- 50%+ bandwidth reduction
- Color consistency across all devices
- Single source of truth (colorMode)

---

## 5. Scale & Cost Analysis

### 5.1 Supabase Free Tier Limits

- **200 concurrent connections** (across all sessions)
- **2M messages/month**
- **256KB max message size**

### 5.2 Bandwidth Projections

**Optimized Architecture (Epic 17 MVP):**

| Metric | Value |
|--------|-------|
| **Per step toggle** | 70 bytes (JSON) |
| **Per note trigger** | 50 bytes (JSON) |
| **Active editing** | ~100 edits/min/user |
| **4-user jam, 1 hour** | ~330 KB total |
| **Messages per jam** | ~24,000 |

**Scale Capacity (Free Tier):**

| Metric | Calculation | Result |
|--------|------------|--------|
| **Connection limit** | 200 / 4 users | **50 concurrent jams** |
| **Message limit** | 2M / (24K msgs × 30 jams) | **~83 jams/month sustainable** |
| **Bottleneck** | Connections | **50 jams max** |

**Cost Scaling:**

| Concurrent Jams | Users | Monthly Cost |
|-----------------|-------|--------------|
| 1-50 | 4-200 | **$0** (free tier) |
| 51-125 | 204-500 | **$25** (Pro tier) |
| 126-250 | 504-1000 | **$25 + overages** |

**Overage Pricing (Pro tier):**
- Messages: $2.50 per 1M additional
- Connections: Custom pricing

### 5.3 Comparison: Naive vs Optimized

**Naive Full-State Broadcasting:**
- Per jam (1 hour, 4 users): ~26 MB
- Messages: ~432K/month for 30 jams
- **Free tier supports: ~5 concurrent jams**

**Optimized Delta Updates (Epic 17):**
- Per jam (1 hour, 4 users): ~330 KB (79x smaller)
- Messages: ~432K/month for 30 jams (same count, smaller size)
- **Free tier supports: 50 concurrent jams (10x more)**

**Epic 17 Optimization Impact:**
- ✅ 79x bandwidth reduction
- ✅ 10x scale increase on free tier
- ✅ $0 → $25/month breakpoint moves from 5 jams → 50 jams

---

## 6. Implementation Strategy

### 6.1 Story Breakdown

**Story 17.1: Delta-Based Drum State Sync** (~4-5 hours)
- Add `broadcastDrumStep()` to `supabaseSessionService`
- Add `onDrumStep()` subscription handler
- Update DrumMachine to broadcast step changes only
- Debounce rapid edits (50ms batching)
- Test: Remote step toggles appear on local device

**Story 17.2: Client-Side Color Derivation** (~2-3 hours)
- Add `broadcastColorMode()` / `onColorModeChange()`
- Remove RGB from note broadcasts
- Update modules to derive colors locally
- Test: Color mode changes reflected across devices

**Story 17.3: Full Pattern Sync** (~3-4 hours)
- Add `broadcastDrumPattern()` for full pattern reset
- Add `onDrumPatternReset()` handler
- Send on pattern load, not during playback
- Test: Loading default pattern syncs to all devices

**Story 17.4: Multi-Module State Sync** (~4-6 hours)
- Extend to Piano Roll (note triggers)
- Extend to IsometricSequencer (triggers)
- Generic state broadcast pattern
- Test: Multiple modules synced simultaneously

**Story 17.5: LED Output Integration** (~2-3 hours)
- Verify LEDCompositor receives frames from remote state
- Test devices with/without WLED (natural bridge behavior)
- Bandwidth monitoring (DevTools network tab)
- Documentation updates

**Total Estimate:** 15-21 hours

### 6.2 Testing Strategy

**Manual Verification Steps:**

1. **Remote Pattern Programming**
   - iPad @ jam.audiolux.app: Program drum pattern
   - Desktop with WLED: Verify pattern appears
   - WLED strip: Verify LED output matches pattern

2. **Color Mode Sync**
   - Remote device: Change colorMode to 'harmonic'
   - Local device: Verify colors derived correctly
   - WLED strip: Verify color changes

3. **Multi-Device Compositing**
   - 2 remote devices: Program different drum patterns
   - Local device: Verify both patterns composited
   - WLED strip: Verify blended output

4. **Bandwidth Monitoring**
   - Open DevTools → Network → WS
   - Program pattern for 1 minute
   - Verify <100 KB transmitted
   - Verify zero traffic during playback loops

5. **Scale Testing**
   - 4 devices in single jam
   - Simultaneous pattern editing
   - Verify no lag or dropped messages

### 6.3 Success Criteria

**Functional:**
- ✅ Remote device controls local WLED via state sync
- ✅ Drum patterns sync in real-time (<500ms latency)
- ✅ Color modes consistent across all devices
- ✅ Multiple modules composited correctly
- ✅ No network traffic during playback loops

**Performance:**
- ✅ Bandwidth <500 KB per 1-hour jam session
- ✅ State sync latency <500ms (Supabase Broadcast typical: 50-150ms)
- ✅ LED generation latency <1ms (local processing)
- ✅ Free tier supports 50 concurrent jams

**Quality:**
- ✅ No message loss or dropped connections
- ✅ Graceful handling of network interruptions
- ✅ Clear documentation for future developers

---

## 7. Integration Points

### 7.1 Existing Systems

**Epic 7: Jam Session Backend**
- Extends `supabaseSessionService` with new message types
- Reuses session management, room codes, participants
- No changes to connection/presence logic

**Epic 14: LED Compositor**
- Modules submit LED frames (EXISTING)
- Compositor blends and sends to WLED (EXISTING)
- No changes to compositor logic

**GlobalMusicContext**
- Already manages WLED device configuration
- Already manages colorMode, key, scale
- Natural "bridge" detection via `hardware.wled.devices.length > 0`

### 7.2 Module Integration Pattern

**Template for any module:**

```typescript
// In any module component (DrumMachine, PianoRoll, etc.)

const MyModule: React.FC = () => {
  const [state, setState] = useState(initialState);

  // Broadcast state changes
  useEffect(() => {
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastModuleState(state);
    }
  }, [state]);

  // Subscribe to remote state changes
  useEffect(() => {
    const unsubscribe = supabaseSessionService.onModuleState((remoteState) => {
      setState(remoteState); // Apply remote state locally
    });

    return unsubscribe;
  }, []);

  // LED frames generated automatically from local state
  // LEDCompositor sends to WLED if available
  // No special logic needed
};
```

---

## 8. Future Enhancements

### 8.1 Binary Message Format (Epic 18+)

**Motivation:** Further reduce bandwidth by 90%+

**Implementation:**
- Use `Uint8Array` instead of JSON
- Custom serialization/deserialization
- Track indices instead of string IDs

**Impact:**
- Drum step: 70 bytes → 7 bytes (90% reduction)
- Note trigger: 50 bytes → 2 bytes (96% reduction)
- Free tier supports 450+ concurrent jams (vs 50 current)

### 8.2 DJ Visualizer Audio Input (Epic 18+)

**Motivation:** Blend remote musical triggers + local audio analysis

**Implementation:**
- Local microphone input via Web Audio API
- Frequency analysis on local device only
- Combine remote triggers + local audio for LED generation
- Zero network traffic for audio (local processing)

**Use Case:**
- Remote drummer programs pattern
- Local DJ has microphone input
- LED strip shows: drum triggers + audio spectrum blend

### 8.3 Session Recording/Playback (Epic 19+)

**Motivation:** Save and replay jam sessions

**Implementation:**
- Record state change events with timestamps
- Store in Supabase database
- Playback replays events to local modules
- LED output recreated exactly

---

## 9. Open Questions for PO (Sarah)

### Q1: Module Sync Scope (MVP)

Should Epic 17 include:
- **Option A**: DrumMachine only (simplest, proves concept)
- **Option B**: DrumMachine + Piano Roll note triggers
- **Option C**: All modules (DrumMachine, Piano, IsometricSequencer)

**Recommendation:** Option A for MVP (Story 17.1-17.3), extend with Stories 17.4+ if time permits.

### Q2: Audio Input (DJ Visualizer)

Is DJ visualizer audio input:
- **Option A**: MVP Required (Epic 17 Story 17.6)
- **Option B**: Future Enhancement (Epic 18+)

**Recommendation:** Option B - Epic 17 proves state sync architecture, Epic 18 adds audio blending.

### Q3: Binary Message Format

Should we implement binary format in Epic 17 MVP?
- **Option A**: Yes (Uint8Array, 7-byte messages)
- **Option B**: No (JSON, 70-byte messages, optimize later)

**Recommendation:** Option B - JSON is simpler for MVP, binary optimization after scale validation.

---

## 10. References

**Related Documentation:**
- Epic 7: `docs/epics/epic-7-jam-session-backend.md`
- Epic 14: `docs/architecture/led-compositor-design.md`
- Supabase Service: `src/services/supabaseSession.ts`
- LED Compositor: `src/services/LEDCompositor.ts`
- Global Music Context: `src/contexts/GlobalMusicContext.tsx`

**External Resources:**
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Pricing](https://supabase.com/pricing)
- [WebSocket Security (Mixed Content)](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

## Appendix A: Stakeholder Conversation Summary

**Date:** 2025-10-18
**Participants:** Myles (Stakeholder), Winston (Architect), Sarah (Product Owner)

**Key Decisions:**

1. **No Bridge Infrastructure** (Myles feedback)
   - KISS principle: Every device runs modules, outputs to available hardware
   - No explicit "bridge mode" detection
   - Natural behavior via WLED device configuration

2. **Local LED Generation** (Myles feedback)
   - LED frames generated on device with WLED access
   - Remote devices sync musical state only
   - Minimizes latency, reduces bandwidth

3. **Optimization Priority** (Myles feedback)
   - Delta updates: Critical (99% savings)
   - Client-side color derivation: High (50% savings)
   - Binary format: Future enhancement

4. **Scale Requirements** (Myles question)
   - Free tier must support 4-5 participant jams
   - Must scale to dozens/hundreds of concurrent jams
   - Optimization essential for cost management

**Quote (Myles):**
> "Does local device need to know it's a bridge? KISS?"

**Architecture Response:**
No explicit bridge mode needed. Devices with WLED configured automatically output LED frames via existing LEDCompositor. Zero special logic required.

---

**Document Status:** ✅ Ready for Epic Creation

**Next Steps:**
1. Sarah (PO) creates Epic 17 with stories based on this architecture
2. Dev team implements Stories 17.1-17.5
3. Manual testing per Section 6.2
4. Stakeholder validation with real hardware

**Approval:** Awaiting Sarah (PO) for epic formalization.
