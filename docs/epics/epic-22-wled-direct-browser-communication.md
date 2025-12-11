# Epic 22: WLED Direct Browser Communication - Brownfield Enhancement

**Status:** 🚧 **PLANNED**
**Priority:** Medium
**Type:** Brownfield Enhancement (Investigation & Fix)
**Target Completion:** 1-2 weeks
**Scope:** 1-3 focused stories

---

## Epic Goal

Investigate and fix direct browser-to-WLED device communication in `/wled-test` experiment, enabling reliable LED data transmission without the wled-bridge plugin by identifying why HTTP commands work (device OFF) while LED streaming commands fail (Rainbow animation, Test pattern).

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**

The project has two WLED communication methods:

1. **WLED Bridge (Reliable)** - `/vite-plugins/wled-bridge.ts`
   - Server-side Vite plugin using Node.js
   - WebSocket (browser) → UDP WARLS protocol (server → WLED)
   - Works reliably for all LED data streaming
   - Used by all production features (LiveAudioVisualizer, GuitarFretboard, etc.)

2. **Direct Browser Communication (Partially Working)** - `/src/components/WLEDExperiment/WLEDDirectTest.tsx`
   - Uses `WLEDDeviceManager` component (legacy)
   - HTTP fetch to WLED's `/json/info` endpoint - ✅ **Works**
   - HTTP POST to `/json/state` with `{on: false}` - ✅ **Works** (turns off LEDs)
   - LED data streaming (Test, Rainbow) - ❌ **Fails** (uses wled-bridge fallback)

**Technology Stack:**
- React 18.2 + TypeScript (strict mode)
- WLED JSON API (HTTP REST endpoints)
- WLED WebSocket endpoint `/ws` (native WLED feature)
- Web Audio API, Fetch API
- Chrome "Local Network Access" permission required

**Current Integration Points:**
- `/src/components/WLED/WLEDDeviceManager.tsx` (legacy component, line 240-295)
- `/src/components/WLEDExperiment/WLEDDirectTest.tsx` (test page)
- `/vite-plugins/wled-bridge.ts` (reference implementation)
- Global `window.wledBridge` WebSocket instance

### Problem Statement

**User-Reported Issue:**

> "When Chrome's 'Local Network Access' permission is granted, we can connect to WLED devices and the toggle OFF successfully turns off LEDs. However, Test button and Rainbow animation do NOT work. Toggling back ON also doesn't turn LEDs back on."

**Root Cause Analysis (Preliminary):**

After reviewing the code:

1. **HTTP Commands Work:**
   - `testConnection()` (line 192-238 in WLEDDeviceManager.tsx) uses HTTP fetch to `/json/info` - ✅ Works
   - `toggleEnabled()` (line 351-374) uses HTTP POST to `/json/state` - ✅ Works
   - These are direct browser → WLED HTTP calls with CORS

2. **LED Data Streaming Fails:**
   - `sendLEDData()` (line 241-295) uses `window.wledBridge` WebSocket
   - **NOT doing direct communication!** Falls back to wled-bridge plugin
   - Test button → calls `sendLEDData()` → uses bridge ❌
   - Rainbow animation → triggers `sendLEDData()` via useEffect → uses bridge ❌

3. **Key Discovery:**
   - The `/wled-test` page is **not actually testing direct communication** for LED data
   - It only tests HTTP REST API for connection/power (which works)
   - All LED color data goes through wled-bridge (which requires dev server)

### Enhancement Details

**What's Being Added/Changed:**

1. **Investigation:** Compare wled-bridge UDP WARLS packet format vs WLED's native HTTP/WebSocket APIs
2. **Implementation:** Add true direct browser→WLED LED data streaming using one of:
   - WLED HTTP JSON API: POST to `/json/state` with segment data `{"seg":[{"col":[[r,g,b],...]}]}`
   - WLED WebSocket API: Connect to `ws://[ip]/ws` and send JSON protocol messages
3. **Documentation:** Document browser security limitations, performance characteristics, and fallback strategy

**How It Integrates:**

- Extends existing `WLEDDeviceManager` component with direct communication mode
- Maintains wled-bridge as primary production method (reliable, proven)
- Adds experimental direct mode for mobile/remote scenarios (Epic 6 blocker investigation)
- No breaking changes to existing WLED features

**Success Criteria:**

- [ ] Rainbow animation works in `/wled-test` without wled-bridge running
- [ ] Test button sends LED data directly to WLED device
- [ ] Performance measured: HTTP vs WebSocket vs UDP WARLS (FPS, latency)
- [ ] Browser security limitations documented (CORS, Local Network Access)
- [ ] Clear decision on whether direct communication is viable for production

---

## Stories

### Story 22.1: Investigate WLED Communication Protocols

**Description:** Compare wled-bridge WARLS implementation vs WLED's native HTTP/WebSocket APIs to understand why HTTP commands work but LED streaming doesn't.

**Deliverables:**
- Document WLED HTTP JSON API packet format for LED data
- Document WLED WebSocket `/ws` protocol for real-time streaming
- Compare with wled-bridge UDP WARLS protocol (vite-plugins/wled-bridge.ts)
- Identify security restrictions (CORS headers, Private Network Access)
- Research document with findings and recommendations

### Story 22.2: Implement Direct HTTP JSON API Communication

**Description:** Extend `WLEDDeviceManager` to send LED data via WLED's HTTP JSON API, bypassing the wled-bridge for the `/wled-test` experiment.

**Deliverables:**
- Add `sendLEDDataHTTP()` method using POST to `/json/state`
- Convert hex color array to WLED segment format `{"seg":[{"col":[[r,g,b],...]}]}`
- Test Rainbow animation and Test button with HTTP-only communication
- Measure performance (FPS, latency) vs wled-bridge UDP
- Handle CORS errors and connection failures gracefully

### Story 22.3: Implement Direct WebSocket Communication (If HTTP is Too Slow)

**Description:** If HTTP polling is too slow for real-time LED streaming (Story 22.2 findings), implement WebSocket connection to WLED's native `/ws` endpoint.

**Deliverables:**
- Connect to `ws://[ip]/ws` endpoint (WLED native WebSocket)
- Send LED data via WebSocket JSON protocol
- Compare performance with HTTP (Story 22.2) and UDP bridge (baseline)
- Document WebSocket message format and connection lifecycle
- Add fallback chain: WebSocket → HTTP → wled-bridge
- **Note:** Only implement if HTTP proves insufficient for real-time streaming

---

## Compatibility Requirements

- [ ] **Existing APIs remain unchanged** - wled-bridge is primary production method
- [ ] **No changes to WLEDManager/ architecture** (Epic 18) - this is legacy WLEDDeviceManager only
- [ ] **UI patterns follow existing design** - ViewTemplate, existing button styles
- [ ] **Performance impact minimal** - Direct mode is opt-in for `/wled-test` only
- [ ] **localStorage keys unchanged** - `wled-test-devices` storage key maintained

---

## Risk Mitigation

**Primary Risk:** Direct browser communication may not be viable due to browser security restrictions (CORS, Mixed Content, Private Network Access).

**Mitigation:**
1. Keep wled-bridge as primary production method (no removal/deprecation)
2. Direct communication is experimental for mobile/native app scenarios only
3. Test on multiple browsers (Chrome, Safari, Firefox) with "Local Network Access" permission
4. Document limitations clearly in `/wled-test` UI and technical notes

**Rollback Plan:**
1. Revert changes to `WLEDDeviceManager.tsx` and `WLEDDirectTest.tsx`
2. Remove new HTTP/WebSocket methods if they don't work
3. Update `/wled-test` documentation to clarify wled-bridge requirement
4. No impact on other features (wled-bridge remains unchanged)

---

## Definition of Done

- [ ] All 2-3 stories completed with acceptance criteria met
- [ ] Rainbow animation and Test button work via direct communication (HTTP or WebSocket)
- [ ] Performance benchmarks documented (HTTP vs WebSocket vs UDP comparison)
- [ ] Browser compatibility tested (Chrome with Local Network Access permission)
- [ ] Existing WLED features verified (no regressions in LiveAudioVisualizer, GuitarFretboard)
- [ ] Epic 6 blocker status updated (can direct communication solve HTTPS→HTTP issue?)
- [ ] Technical notes in `/wled-test` UI updated with findings
- [ ] No regression in wled-bridge functionality

---

## Context & Background

### Relationship to Epic 6

This epic directly investigates the blocker described in **Epic 6: Multi-Client Sessions & WLED Integration**:

> "Modern browsers block HTTPS websites from making HTTP requests to local devices (Mixed Content Security Restriction). Phase 0 (WLED Device Manager) is complete and works perfectly in development (`http://localhost:5173`), but cannot work in production without a native app approach (Capacitor)."

**Key Questions This Epic Answers:**
1. Can WLED's HTTP JSON API work reliably for LED streaming from browsers?
2. Can WLED's WebSocket `/ws` endpoint bypass Mixed Content restrictions?
3. What are the performance tradeoffs vs UDP WARLS (wled-bridge)?
4. Should Epic 6's native app (Capacitor) approach be pursued, or is there a web-only solution?

### Browser Security Context

**Chrome Private Network Access (PNA):**
- Chrome 130+ requires `Access-Control-Allow-Private-Network: true` header from local devices
- WLED firmware may not support this header (as of 2024)
- Manual "Local Network Access" permission workaround exists (site settings)

**Mixed Content Blocking:**
- HTTPS sites cannot fetch HTTP resources (blocked by default)
- Production deployment (`https://jam.audiolux.app`) → HTTP WLED device blocked
- Development (`http://localhost:5173`) → HTTP WLED device works

**Potential Solutions:**
1. HTTP JSON API with CORS headers (test in this epic)
2. WebSocket `ws://` endpoint (test in this epic)
3. Capacitor native app (Epic 6's proposed solution)
4. WLED firmware update with PNA headers (external dependency)

---

## Technical Notes

### WLED API Reference

**HTTP Endpoints:**
- `GET /json/info` - Device information (name, LED count, version)
- `GET /json/state` - Current state (on/off, brightness, segments)
- `POST /json/state` - Set state, including segment colors

**WebSocket Endpoint:**
- `ws://[ip]/ws` - Real-time bidirectional communication
- JSON protocol for state updates and live data

**UDP Protocol (WARLS):**
- Port 21324
- Packet format: `[2, 255, r1, g1, b1, r2, g2, b2, ...]`
- Used by wled-bridge plugin (reliable, server-side)

### Code References

**Key Files:**
- `/src/components/WLED/WLEDDeviceManager.tsx` (legacy, lines 240-295 for sendLEDData)
- `/src/components/WLEDExperiment/WLEDDirectTest.tsx` (test page)
- `/vite-plugins/wled-bridge.ts` (reference WARLS implementation)

**Successful HTTP Patterns:**
- `testConnection()` - WLEDDeviceManager.tsx:192-238
- `toggleEnabled()` - WLEDDeviceManager.tsx:351-374

---

## Next Steps After Epic Completion

1. Update Epic 6 documentation with findings (viable web solution or Capacitor required?)
2. If direct communication works: Plan migration of LiveAudioVisualizer to use HTTP/WebSocket
3. If direct communication fails: Proceed with Capacitor native app for Epic 6
4. Archive or improve `/wled-test` based on results (deprecate if not viable)
