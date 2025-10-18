# Epic 17: Remote WLED Control via Jam Sessions

**Status:** 📝 **PLANNING**
**Epic Type:** Brownfield Enhancement
**Priority:** High
**Target Completion:** Q1 2025
**Product Owner:** Sarah
**Architect:** Winston
**Related Epics:**
- Epic 7 (Jam Session Backend - Supabase Realtime infrastructure)
- Epic 14 (Module Adapter System - LED Compositor integration)

---

## Epic Goal

Enable remote devices (e.g., iPad at jam.audiolux.app) to control local WLED hardware via jam sessions by syncing musical state through Supabase Realtime and generating LED frames locally, solving the WebSocket security limitation that prevents domain deployments from directly controlling local WLED devices.

---

## Epic Description

### Problem Statement

**Current Limitation:**
Domain deployment (jam.audiolux.app) is served over HTTPS, and browser security blocks HTTP WebSocket connections to local network WLED devices. This prevents remote users from controlling WLED hardware, despite local development (localhost:5173) working perfectly.

**User Scenario:**
1. User A (iPad @ jam.audiolux.app) programs drum pattern
2. User B (Desktop on same network as WLED) joins same jam session
3. **Expected:** Drum pattern triggers LED strips on User B's local network
4. **Current:** Cannot happen due to WebSocket mixed-content security restrictions

### Existing System Context

**Current relevant functionality:**
- **Epic 7 (Complete):** Jam Session Backend with Supabase Realtime
  - Real-time session management (room codes, participants)
  - State sync infrastructure (tempo, playback, key/scale)
  - Broadcast/subscribe patterns via `supabaseSessionService`
  - Location: `src/services/supabaseSession.ts`

- **Epic 14 (Complete):** LED Compositor System
  - Multi-module LED frame blending
  - WLED device management via `GlobalMusicContext.hardware.wled`
  - Blending modes: multiply, screen, additive, max
  - Location: `src/services/LEDCompositor.ts`

- **DrumMachine Module:** Fully integrated with GlobalMusicContext, syncs tempo/playback via JamSession

**Technology stack:**
- React 18.2 + TypeScript 5.2
- Supabase Realtime (Broadcast API)
- Existing `supabaseSessionService` with broadcast/subscribe patterns
- LEDCompositor service for multi-module LED blending
- WLED hardware via HTTP WebSocket (local network only)

**Integration points:**
- `supabaseSessionService` - Extend with drum state broadcast methods
- `DrumMachine` component - Add state broadcasting on changes
- `LEDCompositor` - Receives frames from modules (EXISTING, no changes)
- `GlobalMusicContext` - WLED device configuration (EXISTING, no changes)

### Enhancement Details

**What's being added/changed:**

1. **Musical State Synchronization (Not LED Frames):**
   - Sync drum patterns via Supabase (step toggles, velocities)
   - Sync color mode for client-side color derivation
   - Generate LED frames **locally** on devices with WLED access
   - **Key insight:** State sync (~2-20 bytes per event) vs LED frame relay (~450 bytes @ 30 FPS)

2. **Delta-Based Updates (99% Bandwidth Savings):**
   - Send only step changes, not full patterns
   - Pattern loops locally with zero network traffic during playback
   - Example: Step toggle = 7 bytes (binary future) vs 1.7 KB full pattern

3. **Client-Side Color Derivation (50% Bandwidth Savings):**
   - Sync `colorMode` once when changed
   - Each device calculates `note → color` locally using existing `getNoteColor()` function
   - Removes RGB from note broadcasts (13 bytes → 2 bytes future binary)

4. **KISS Principle - No Bridge Mode:**
   - Every device runs modules based on session state
   - Devices with WLED configured automatically output via existing LEDCompositor
   - No special "bridge" role detection needed
   - Natural behavior emerges from existing infrastructure

**How it integrates:**

```typescript
// Extend supabaseSessionService (src/services/supabaseSession.ts)
class SupabaseSessionService {
  // NEW: Drum state sync methods
  broadcastDrumStep(data: { track: number, step: number, enabled: boolean, velocity: number }): void
  onDrumStep(callback: (data: DrumStepEvent) => void): () => void

  broadcastDrumPattern(tracks: DrumTrack[]): void  // Full pattern reset (rare)
  onDrumPatternReset(callback: (tracks: DrumTrack[]) => void): () => void

  broadcastColorMode(mode: ColorMode): void  // Already exists pattern
  onColorModeChange(callback: (mode: ColorMode) => void): () => void
}

// DrumMachine broadcasts state changes
useEffect(() => {
  if (supabaseSessionService.isInSession()) {
    supabaseSessionService.broadcastDrumStep({ track, step, enabled, velocity });
  }
}, [tracks]); // On step toggle

// All devices receive and apply changes
useEffect(() => {
  return supabaseSessionService.onDrumStep(({ track, step, enabled, velocity }) => {
    setTracks(prev => updateStep(prev, track, step, enabled, velocity));
    // LED frames generated automatically by module
    // LEDCompositor sends to WLED if device has it configured
  });
}, []);
```

**Data Flow:**
```
Remote Device (iPad @ jam.audiolux.app)
  ↓ Broadcast musical state (Supabase Realtime)
  ↓ { track: 0, step: 7, enabled: true, velocity: 80 }
  ↓
Local Device (Desktop with WLED)
  ↓ Subscribe to state changes
  ↓ Apply to local DrumMachine instance (1:1 clone)
  ↓ Generate LED frames LOCALLY (<1ms before output)
  ↓ LEDCompositor → WLED (EXISTING)
  ↓
WLED Hardware (Local Network)
```

**Success criteria:**
- Remote device (iPad @ jam.audiolux.app) successfully controls local WLED hardware
- Drum patterns sync across devices in real-time (<500ms latency)
- Color modes consistent across all devices (client-side derivation)
- Zero network traffic during playback loops (pattern loops locally)
- Bandwidth <500 KB per 1-hour jam session (vs ~26 MB naive approach)
- Free tier supports 50 concurrent jams (connection limit: 200 / 4 users)

### Architecture Decisions

**1. State Sync, Not Frame Relay**
- **Decision:** Sync musical state (drum patterns), generate LED frames locally
- **Rationale:** 79x bandwidth reduction (330 KB vs 26 MB per jam), minimal latency (<1ms local generation)
- **Stakeholder Quote (Myles):** "LEDframes are not generated on the remote device i.e iPad, they are generated on the local device which it can do so because it's own drum machine is a 1:1 clone."

**2. Delta Updates Only**
- **Decision:** Send step changes only, pattern loops locally
- **Rationale:** 99% bandwidth savings (7 bytes vs 1.7 KB per change), scales to 50 concurrent jams on free tier
- **Stakeholder Quote (Myles):** "Instead of sending each note when the timeline bar moves across a looping pattern, send just the column/step that has changes."

**3. KISS - No Bridge Mode**
- **Decision:** Natural bridge behavior via WLED device configuration
- **Rationale:** Simpler implementation, fewer edge cases, no special role detection needed
- **Stakeholder Quote (Myles):** "Does local device need to know it's a bridge? KISS?"

**4. JSON for MVP (Binary Future)**
- **Decision:** Use JSON messages for MVP, defer Uint8Array optimization
- **Rationale:** Faster implementation, easier debugging, still achieves 50 concurrent jams
- **Impact:** JSON ~70 bytes per step vs binary 7 bytes (can optimize in Epic 18+ after validating usage)

---

## Stories

### **Story 17.1: Delta-Based Drum State Sync**
**Estimate:** 4-5 hours | **Priority:** 🔴 HIGH

Extend `supabaseSessionService` with delta-based drum pattern synchronization, broadcasting only step changes (not full patterns) with 50ms debouncing for rapid edits.

**Deliverables:**
- `broadcastDrumStep()` method in `supabaseSessionService`
- `onDrumStep()` subscription handler
- DrumMachine component integration (broadcast on step toggle)
- 50ms debouncing for rapid edits

**Acceptance Criteria:**
- Remote step toggle appears on local device within 500ms
- Zero network traffic during playback loops
- Bandwidth <5 KB/min per active editor
- Pattern state synchronized across all session participants

### **Story 17.2: Client-Side Color Derivation**
**Estimate:** 2-3 hours | **Priority:** 🔴 HIGH

Implement client-side color derivation by syncing `colorMode` once and calculating note colors locally using existing `getNoteColor()` function, achieving 50% bandwidth savings on note events.

**Deliverables:**
- `broadcastColorMode()` / `onColorModeChange()` methods
- Remove RGB from note broadcasts (future)
- Modules derive colors via `getNoteColor(note, colorMode, key, scale)`

**Acceptance Criteria:**
- Color mode changes reflected across all devices within 500ms
- All devices show identical colors for same note
- Reduced bandwidth vs sending RGB with every note

### **Story 17.3: Full Pattern Sync & LED Integration**
**Estimate:** 3-4 hours | **Priority:** 🟡 MEDIUM

Implement full drum pattern broadcast for initial load/pattern changes, and verify LED output from remote state with bandwidth monitoring.

**Deliverables:**
- `broadcastDrumPattern()` for full pattern reset (sent rarely)
- `onDrumPatternReset()` handler
- LED output integration testing (iPad + Desktop with WLED)
- Bandwidth monitoring documentation

**Acceptance Criteria:**
- Loading default pattern syncs to all devices
- Full pattern broadcast <2 KB
- Sent <5 times per jam session (initial load, pattern change only)
- Remote device successfully controls local WLED
- Bandwidth <500 KB per 1-hour jam
- Natural "bridge" behavior (no special mode needed)

---

## Compatibility Requirements

- [x] Existing `supabaseSessionService` API extended (no breaking changes)
- [x] LEDCompositor unchanged (receives frames from modules as before)
- [x] GlobalMusicContext unchanged (WLED device management existing)
- [x] DrumMachine component enhanced (add state broadcasting)
- [x] No changes to session management, room codes, or participant tracking
- [x] Backward compatible with non-WLED devices (they receive state but don't output)

---

## Risk Mitigation

**Primary Risk:** Message volume exceeds Supabase free tier limits (2M messages/month)

**Mitigation:**
- Delta updates only (99% bandwidth reduction vs full-state broadcasts)
- 50ms debouncing for rapid edits
- Zero traffic during playback loops (pattern loops locally)
- Monitoring: Bandwidth tracking in DevTools, message count metrics

**Rollback Plan:**
- Remove `broadcastDrumStep()` calls from DrumMachine component
- Revert `supabaseSessionService` to Epic 7 state
- No database changes (all client-side)
- No WLED configuration changes

**Secondary Risk:** State sync latency >500ms causes desync

**Mitigation:**
- Supabase Broadcast typical latency: 50-150ms
- Acceptable for LED visualization (not real-time audio)
- Local LED generation <1ms (no additional latency)
- Manual testing across multiple devices before deployment

---

## Scale & Cost Analysis

### Free Tier Capacity (Optimized Architecture)
- **50 concurrent jams** (connection limit: 200 / 4 users)
- **~83 jams/month sustainable** (message limit: 2M / 24K messages per jam)
- **$0/month** for up to 50 concurrent jams

### Pro Tier Scaling
- **125 concurrent jams** for **$25/month** (500 connections)
- **250+ concurrent jams** for **$25/month + overages** ($2.50 per 1M additional messages)

### Bandwidth Comparison

| Approach | Per Jam (1hr, 4 users) | Free Tier Capacity |
|----------|------------------------|---------------------|
| Naive Full-State Broadcasting | ~26 MB | 5 concurrent jams |
| **Epic 17 Optimized (Delta + Client Derivation)** | **~330 KB** | **50 concurrent jams** |
| **Improvement** | **79x smaller** | **10x more capacity** |

---

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Remote device (iPad @ jam.audiolux.app) controls local WLED successfully
- [x] Bandwidth <500 KB per 1-hour jam session verified
- [x] State sync latency <500ms verified
- [x] Zero network traffic during playback loops verified
- [x] Existing jam session functionality unchanged (tempo sync, participants, etc.)
- [x] No regression in LED Compositor or WLED output
- [x] Documentation updated in architecture docs
- [x] Manual verification checklist completed (iPad + Desktop with WLED)

---

## Future Enhancements (Epic 18+)

**Deferred from Epic 17 (Stakeholder Approved Option A):**
- **Multi-Module State Sync:** Piano Roll note triggers, IsometricSequencer
- **Binary Message Format:** Uint8Array (7 bytes vs 70 bytes JSON) - 90% further reduction
- **DJ Visualizer Audio Input:** Blend remote musical triggers + local microphone
- **Pattern Compression:** Complex sequences beyond 16-step patterns
- **Session Recording/Playback:** Save and replay jam sessions

**Rationale for Deferral:**
- Validates state sync architecture with smallest scope
- Proves concept with DrumMachine before expanding
- Can measure actual bandwidth in production before binary optimization
- Keeps Epic 17 focused and testable (9-12 hours vs 15-21 hours)

---

## Technical References

**Architecture Documents:**
- [Remote WLED State Sync (Full Spec)](../architecture/remote-wled-state-sync.md) - Complete technical design
- [Epic 17 Handoff Summary](../architecture/EPIC-17-HANDOFF.md) - PO handoff from Winston
- [LED Compositor Design](../architecture/led-compositor-design.md) - Epic 14
- [Jam Session Backend](../architecture/jam-session-backend.md) - Epic 7

**Code Locations:**
- Supabase Service: `src/services/supabaseSession.ts`
- LED Compositor: `src/services/LEDCompositor.ts`
- Global Music Context: `src/contexts/GlobalMusicContext.tsx`
- Jam Session UI: `src/components/JamSession/JamSession.tsx`
- DrumMachine: `src/components/DrumMachine/DrumMachine.tsx`

**External Resources:**
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Pricing](https://supabase.com/pricing)
- [WebSocket Security (Mixed Content)](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

## Story Manager Handoff

**Ready for Story Development:**

This epic extends the existing Jam Session Backend (Epic 7) and integrates with LED Compositor (Epic 14) to enable remote WLED control via musical state synchronization.

**Key Considerations for Story Development:**

1. **Integration Context:**
   - Extending `supabaseSessionService` (Epic 7) with new broadcast methods
   - DrumMachine component already integrated with GlobalMusicContext
   - LEDCompositor already handles multi-module blending (no changes needed)

2. **Existing Patterns to Follow:**
   - Broadcast/subscribe pattern: `broadcastTempo()`, `onTempoChange()` (Epic 7)
   - State sync via Supabase Realtime Broadcast API
   - LED frame generation: `ledCompositor.submitFrame()` (Epic 14)

3. **Critical Compatibility Requirements:**
   - No breaking changes to `supabaseSessionService` API
   - DrumMachine component enhanced (not replaced)
   - LEDCompositor and GlobalMusicContext unchanged
   - Backward compatible with non-WLED devices

4. **Each Story Must Include:**
   - Verification that existing jam session functionality remains intact
   - Bandwidth monitoring/metrics
   - Manual testing checklist (remote + local device)
   - Integration testing with existing Epic 7 and Epic 14 functionality

**Epic Goal:** Enable remote devices to control local WLED hardware by syncing musical state (not LED frames), achieving 79x bandwidth reduction and supporting 50 concurrent jams on free tier.

**Approval Status:** ✅ Stakeholder approved Option A (DrumMachine only, JSON messages, defer multi-module to Epic 18+)

---

**Epic Created:** 2025-10-18
**Product Owner:** Sarah 📝
**Architect:** Winston 🏗️
**Stakeholder:** Myles (Approved Option A)
