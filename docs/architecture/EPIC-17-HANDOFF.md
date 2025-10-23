# Epic 17: Remote WLED Control - PO Handoff Summary

**Date:** 2025-10-18
**From:** Winston (Architect)
**To:** Sarah (Product Owner)
**Status:** ✅ Ready for Epic Creation

---

## Quick Summary

**Problem:** Domain deployment (jam.audiolux.app) cannot control local WLED devices due to WebSocket security restrictions.

**Solution:** Sync musical state via Supabase Realtime, generate LED frames locally on devices with WLED access.

**Epic Name:** Epic 17 - Remote WLED Control via Jam Sessions

**Estimated Duration:** 15-21 hours (5 stories)

**Dependencies:**
- Epic 7: Jam Session Backend (✅ Complete)
- Epic 14: LED Compositor (✅ Complete)

---

## Architecture Document

**Full Technical Specification:** [remote-wled-state-sync.md](./remote-wled-state-sync.md)

**Key Sections:**
- Section 2: Architecture Overview (simplified data flow)
- Section 4: Message Optimization (bandwidth analysis)
- Section 5: Scale & Cost Analysis (free tier supports 50 jams)
- Section 6: Implementation Strategy (story breakdown)

---

## Epic 17 Story Breakdown

### Story 17.1: Delta-Based Drum State Sync
**Estimate:** 4-5 hours
**Priority:** 🔴 HIGH

**Goal:** Send only drum pattern changes (step toggles), not full pattern broadcasts.

**Deliverables:**
- `broadcastDrumStep()` method in `supabaseSessionService`
- `onDrumStep()` subscription handler
- DrumMachine broadcasts step changes only
- 50ms debouncing for rapid edits

**Acceptance Criteria:**
- Remote step toggle appears on local device within 500ms
- Zero network traffic during playback loops
- Bandwidth <5 KB/min per active editor

---

### Story 17.2: Client-Side Color Derivation
**Estimate:** 2-3 hours
**Priority:** 🔴 HIGH

**Goal:** Sync colorMode once, derive note colors locally (50% bandwidth savings).

**Deliverables:**
- `broadcastColorMode()` / `onColorModeChange()` methods
- Remove RGB from note broadcasts
- Modules derive colors via `getNoteColor(note, colorMode, key, scale)`

**Acceptance Criteria:**
- Color mode changes reflected across all devices
- Note events reduced from 13 bytes → 2 bytes (future binary)
- All devices show identical colors for same note

---

### Story 17.3: Full Pattern Sync
**Estimate:** 3-4 hours
**Priority:** 🟡 MEDIUM

**Goal:** Sync full drum pattern on initial load/pattern change only.

**Deliverables:**
- `broadcastDrumPattern()` for full pattern reset
- `onDrumPatternReset()` handler
- Sent only on pattern load, not during playback

**Acceptance Criteria:**
- Loading default pattern syncs to all devices
- Full pattern broadcast <2 KB
- Sent <5 times per jam session

---

### Story 17.4: Multi-Module State Sync
**Estimate:** 4-6 hours
**Priority:** 🟡 MEDIUM

**Goal:** Extend state sync to Piano Roll, IsometricSequencer.

**Deliverables:**
- `broadcastNote()` / `onNote()` for piano triggers
- Generic module state broadcast pattern
- Support for multiple simultaneous modules

**Acceptance Criteria:**
- Piano Roll notes sync across devices
- IsometricSequencer triggers sync across devices
- Multi-module compositing works (DrumMachine + Piano)

---

### Story 17.5: LED Output Integration & Testing
**Estimate:** 2-3 hours
**Priority:** 🟢 LOW

**Goal:** Verify LED output from remote state, document bandwidth metrics.

**Deliverables:**
- Test iPad (no WLED) + Desktop (with WLED)
- Bandwidth monitoring (DevTools)
- Documentation updates
- Manual verification checklist

**Acceptance Criteria:**
- Remote device controls local WLED successfully
- Bandwidth <500 KB per 1-hour jam
- Natural "bridge" behavior (no special mode needed)

---

## Key Architecture Decisions

### 1. KISS Principle - No Bridge Mode
**Decision:** Every device runs modules, outputs to available hardware naturally.

**Rationale:**
- Devices with WLED configured automatically output via LEDCompositor
- No special "bridge mode" detection needed
- Simpler implementation, fewer edge cases

**Stakeholder Quote (Myles):**
> "Does local device need to know it's a bridge? KISS?"

---

### 2. State Sync, Not Frame Relay
**Decision:** Sync musical state (drum patterns, notes), not LED frames.

**Rationale:**
- 79x bandwidth reduction (330 KB vs 26 MB per jam)
- Minimal latency (<1ms LED generation locally)
- Enables local audio input integration (DJ visualizer)

**Stakeholder Quote (Myles):**
> "LEDframes are not generated on the remote device i.e iPad, they are generated on the local device which it can do so because it's own drum machine is a 1:1 clone and has all the drum state information it needs."

---

### 3. Delta Updates Only
**Decision:** Send step changes only, pattern loops locally.

**Rationale:**
- 99% bandwidth savings (7 bytes vs 1.7 KB per change)
- Zero network traffic during playback loops
- Scales to 50 concurrent jams on free tier

**Stakeholder Feedback (Myles):**
> "Instead of sending each note when the timeline bar moves across a looping 1 page pattern to the network each time, it would send just the column/step that has changes in it (if no changes, then no more music notes need to be sent even though each device is locally looping)."

---

### 4. Client-Side Color Derivation
**Decision:** Sync colorMode once, derive colors locally.

**Rationale:**
- 50% bandwidth savings on note events
- Color consistency across all devices
- Single source of truth (colorMode)

**Stakeholder Feedback (Myles):**
> "We don't need to send full note & color if all devices simply sync their color state (harmonic/chromatic/spectrum) then locally they will know what note (Received) = what color."

---

## Scale & Cost Summary

### Free Tier Capacity (Optimized)
- **50 concurrent jams** (connection limit: 200 / 4 users)
- **~83 jams/month sustainable** (message limit: 2M / 24K msgs)
- **$0/month** for up to 50 concurrent jams

### Pro Tier Scaling
- **125 concurrent jams** for **$25/month**
- **250+ concurrent jams** for **$25/month + overages**

### Bandwidth Comparison

| Approach | Per Jam (1hr, 4 users) | Free Tier Capacity |
|----------|------------------------|---------------------|
| Naive Full-State | ~26 MB | 5 concurrent jams |
| **Epic 17 Optimized** | **~330 KB** | **50 concurrent jams** |
| **Improvement** | **79x smaller** | **10x more jams** |

---

## Open Questions for Sarah (PO)

### Q1: Module Sync Scope (MVP)

**Options:**
- **A:** DrumMachine only (simplest, proves concept)
- **B:** DrumMachine + Piano Roll note triggers
- **C:** All modules (DrumMachine, Piano, IsometricSequencer)

**Recommendation:** Option A for MVP (Stories 17.1-17.3), Option C if time permits (Story 17.4).

---

### Q2: Audio Input (DJ Visualizer)

**Options:**
- **A:** MVP Required (Epic 17 Story 17.6)
- **B:** Future Enhancement (Epic 18+)

**Recommendation:** Option B - Epic 17 proves state sync architecture, Epic 18 adds audio blending.

**Rationale:**
- DJ visualizer integration adds complexity
- State sync pattern more valuable to prove first
- Audio input can leverage same architecture in Epic 18

---

### Q3: Binary Message Format

**Options:**
- **A:** Yes - Implement Uint8Array (7-byte messages)
- **B:** No - Use JSON (70-byte messages), optimize later

**Recommendation:** Option B - JSON is simpler for MVP, binary optimization after scale validation.

**Impact if delayed:**
- JSON: 70 bytes per step toggle
- Binary: 7 bytes per step toggle
- Still achieves 50 concurrent jams on free tier with JSON

---

## Technical Verification Points

Before epic approval, verify:

1. **Epic 7 (Jam Sessions) is complete** ✅
   - `supabaseSessionService` exists
   - Broadcast/subscribe patterns working
   - Room codes, participants, tempo sync functional

2. **Epic 14 (LED Compositor) is complete** ✅
   - `LEDCompositor` service exists
   - Multi-module blending works
   - WLED output functional

3. **GlobalMusicContext has WLED management** ✅
   - `hardware.wled.devices` array exists
   - WLED device configuration UI exists
   - Natural bridge detection possible via `devices.length > 0`

---

## Success Criteria

**Functional:**
- ✅ Remote device (iPad @ jam.audiolux.app) controls local WLED
- ✅ Drum patterns sync in real-time (<500ms latency)
- ✅ Color modes consistent across all devices
- ✅ Zero network traffic during playback loops

**Performance:**
- ✅ Bandwidth <500 KB per 1-hour jam session
- ✅ State sync latency <500ms
- ✅ LED generation latency <1ms (local processing)
- ✅ Free tier supports 50 concurrent jams

**Quality:**
- ✅ No message loss or dropped connections
- ✅ Graceful handling of network interruptions
- ✅ Clear documentation for future developers

---

## Next Steps for Sarah (PO)

1. **Review architecture document:** [remote-wled-state-sync.md](./remote-wled-state-sync.md)
2. **Answer Q1-Q3** (module scope, audio input, binary format)
3. **Create Epic 17** using story breakdown above
4. **Assign to dev team** with link to architecture doc
5. **Schedule stakeholder demo** after Story 17.1 completion

---

## References

**Architecture Documents:**
- [Remote WLED State Sync (Full Spec)](./remote-wled-state-sync.md)
- [LED Compositor Design](./led-compositor-design.md) - Epic 14
- [Jam Session Backend](./jam-session-backend.md) - Epic 7

**Code Locations:**
- Supabase Service: `src/services/supabaseSession.ts`
- LED Compositor: `src/services/LEDCompositor.ts`
- Global Music Context: `src/contexts/GlobalMusicContext.tsx`
- Jam Session UI: `src/components/JamSession/JamSession.tsx`

**External Resources:**
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Pricing](https://supabase.com/pricing)

---

**Approval Status:** ✅ Architecture complete, awaiting PO epic creation

**Architect Sign-Off:** Winston 🏗️
**Date:** 2025-10-18
