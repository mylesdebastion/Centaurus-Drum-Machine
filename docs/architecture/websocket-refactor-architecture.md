# Centaurus Drum Machine - WebSocket Refactor & Device Management Architecture

## Introduction

This document outlines the architectural approach for enhancing **Centaurus Drum Machine** with **robust WebSocket connection management and centralized WLED device management**. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of these enhancements while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new connection management components will integrate with current WLED bridge and device management systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

### Existing Project Analysis

#### Current Project State

- **Primary Purpose:** Creative music production tool with live audio visualization and WLED LED device control
- **Current Tech Stack:**
  - Frontend: React 18 + TypeScript + Vite
  - State: React hooks (functional components)
  - Styling: Tailwind CSS + shadcn/ui components
  - Audio: Web Audio API
  - Device Communication: WebSocket → UDP WARLS protocol
- **Architecture Style:** Component-based frontend with service layer pattern (emerging: `WLEDDeviceRegistry`)
- **Deployment Method:**
  - Dev: Vite dev server (port 5173) + Vite plugin WebSocket bridge (ports 21325-21329)
  - Prod: Standalone Node.js WebSocket bridge (port 8080)

#### Available Documentation

- `/docs/UX_STANDARDS.md` - Comprehensive design guidelines
- `/docs/architecture/component-architecture.md` - Component patterns
- `/docs/dev-server-troubleshooting.md` - Development workflow
- `/CLAUDE.md` - Development guidelines and testing philosophy
- `/src/types/wled.ts` - WLED type definitions
- `/src/types/window.d.ts` - Global type extensions

#### Identified Constraints

- **Manual testing philosophy** - No automated test suites (per CLAUDE.md)
- **Fixed WLED UDP port** - Device listens on port 21324 (WARLS protocol requirement)
- **Browser security** - Must use `wss://` on HTTPS, `ws://` on HTTP
- **Mobile access** - Must support cross-device networking (localhost vs. hostname)
- **Port discovery** - Current 6-port × 3-host = 18-attempt discovery strategy (18 seconds max)
- **Production SSL** - Port 8080 bridge supports SSL certificates for secure connections
- **Single connection singleton** - Current `window.wledBridge` global prevents multi-device scenarios

### User Impact

**Current User Pain Points:**

1. **18-second connection failures** when bridge isn't running - Users wait through lengthy timeout sequences with no feedback
2. **No port configuration UI** - Non-technical users (musicians, visual artists) must edit TypeScript source code to change bridge ports
3. **Connection drops aren't recovered** - Live performance interruptions require manual page reload
4. **Fragmented device management** - Multiple components have separate device lists, causing confusion and inconsistent state
5. **Mobile device setup complexity** - Cross-device networking requires understanding localhost vs. hostname resolution

**Business Value of This Refactor:**

- **Reduced support burden** - Self-service port configuration eliminates "how do I change the port?" support requests
- **Improved reliability** - Live performance stability critical for target users (musicians, VJs, lighting designers)
- **Faster onboarding** - Automatic reconnection removes technical barriers for non-developer users
- **Professional credibility** - Robust connection management signals professional tool quality
- **Multi-device scenarios** - Enable advanced users to control multiple LED installations simultaneously

**Target User Stories:**

1. As a **live performer**, I want automatic reconnection so my LED visuals don't drop mid-performance
2. As a **mobile user**, I want easy port configuration so I can connect from my phone without editing code
3. As a **multi-device user**, I want to control multiple LED strips with different settings
4. As a **developer**, I want centralized device management so changes propagate consistently
5. As a **troubleshooter**, I want clear error messages so I can diagnose connection issues without checking browser console

### Development Sequencing

**Critical Path Dependencies:**

```
Phase 1 (MVP - Sprint 1)
├── WLEDConnectionManager service (core reliability)
│   ├── Exponential backoff retry logic
│   ├── Promise-based connection API (prevents race conditions)
│   └── Proper cleanup on component unmount
└── Basic port configuration (environment variables)

Phase 2 (Polish - Sprint 2)
├── Heartbeat/ping-pong mechanism (depends on Phase 1)
├── Port configuration UI (depends on Phase 1)
│   ├── Preset options ("Local Dev", "Mobile", "Custom")
│   └── localStorage persistence with precedence rules
└── Message queuing during reconnection (depends on Phase 1)

Phase 3 (Refactor - Sprint 3)
├── WLEDDeviceRegistry migration (depends on Phase 1 connection manager)
│   ├── Migration script for existing localStorage keys
│   ├── Update LEDMatrixManager component
│   ├── Update WLEDDeviceManager component
│   ├── Update LEDStripManager component
│   └── Consolidate duplicate logic
└── Connection pooling for multi-device (depends on registry migration)
```

**Estimated Timeline:**
- Solo developer, part-time: **2-3 sprints** (6-9 weeks)
- Solo developer, full-time: **2-3 weeks**
- Pair programming: **1-2 weeks**

**Definition of Done (Per Phase):**

**Phase 1:**
- ✅ Connection succeeds on first attempt (95%+ success rate)
- ✅ Reconnection happens automatically with exponential backoff
- ✅ No race conditions when multiple components mount
- ✅ Clean useEffect cleanup prevents memory leaks
- ✅ Environment variables configure bridge ports

**Phase 2:**
- ✅ Heartbeat detects dead connections within 60 seconds
- ✅ Port configuration UI works on mobile and desktop
- ✅ Message queue prevents data loss during reconnection
- ✅ Clear error messages guide troubleshooting

**Phase 3:**
- ✅ All components use centralized WLEDDeviceRegistry
- ✅ Existing user devices migrated automatically
- ✅ Device changes propagate consistently across app
- ✅ Multiple simultaneous connections supported

### Technical Risks and Mitigation

**Priority 0 (Blocking - Must Solve Before Launch):**

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **Race conditions in connection pool** | Multiple WebSocket connections created, duplicate UDP packets, LED flickering | Implement mutex pattern or Promise caching (first call creates promise, subsequent calls return same promise) |
| **Breaking existing user configurations** | Saved devices disappear after localStorage migration | Migration script runs on first load, reads old keys (`ledStripDevices`, `wledDevices`), writes to new registry format with user prompt |

**Priority 1 (Important - Should Solve in MVP):**

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **WebSocket ping/pong complexity** | JavaScript API doesn't expose native frames (0x9/0xA), must use application-level heartbeat | Use `{type: 'ping'}` / `{type: 'pong'}` JSON messages + TCP keepalive via Node.js `socket.setKeepAlive()` |
| **Vite plugin vs. standalone bridge drift** | Bug fixed in one but not the other → dev/prod inconsistency | Extract shared logic to `/src/services/WLEDConnectionManager.ts`, maintain identical implementations with version hash verification |
| **Cross-origin issues (SSL) on deployed app** | `https://` page can't connect to `ws://localhost` (mixed content) | Standalone bridge already supports SSL (`--ssl-cert` flag), document certificate setup in deployment guide |

**Priority 2 (Enhancement - Can Defer to Phase 2):**

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **Message queue memory leak** | Extended offline period causes unbounded queue growth, browser tab crash | Cap queue at 100 messages or 5MB, oldest-first eviction (or clear queue on reconnect, send only latest frame) |
| **WLED firmware variability** | Older versions (<v0.13) or alternative firmware (WLED-MM) may interpret data incorrectly | Add device capability detection via WLED JSON API query (v0.10+), adjust packet format based on version |
| **Component unmount during active reconnect** | Timers continue after navigation, memory leak + unnecessary network traffic | Cleanup in useEffect return (clear timeouts, close WebSocket, cancel promises) |

**Priority 3 (Polish - Nice-to-Have):**

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **localStorage sync across tabs** | Multiple tabs create separate connections, conflicting LED data | Use BroadcastChannel API or storage event listener to coordinate (note: Safari private mode limitation) |
| **Audio frame rate conflict** | 60 FPS LED updates flood network on reconnect (300+ queued messages) | Throttle LED updates during reconnection or clear queue on connect (user preference?) |
| **Browser tab sleep mode** | Mobile browsers throttle inactive tabs, heartbeat doesn't fire | Use Page Visibility API to detect sleep, pause heartbeat, reconnect on wake |

### Manual Verification Strategy

Per the project's manual testing philosophy (see `/CLAUDE.md`), this enhancement will be verified through browser-based testing with human-in-the-loop validation.

**Connection Lifecycle Testing (Browser DevTools):**

1. **Happy path** - Fresh connection succeeds on first attempt
   - Open Studio → LEDMatrixManager
   - Network tab shows WebSocket connection succeeds
   - UI displays "Connected" badge
   - Send LED data, verify device responds

2. **Bridge offline** - Connection fails gracefully
   - Kill bridge process
   - Open LEDMatrixManager
   - Verify "Reconnecting..." message appears
   - Verify retry attempts visible in console with exponential delays (1s, 2s, 4s...)
   - After max attempts, verify helpful error message shown

3. **Bridge restart** - Mid-session reconnection succeeds automatically
   - Connect successfully
   - Kill bridge process
   - Wait 5 seconds (observe "Reconnecting..." UI)
   - Restart bridge
   - Verify automatic reconnection within 3 seconds
   - Verify queued messages sent after reconnect

4. **Network change** - Mobile device switches WiFi networks
   - Connect from mobile device
   - Switch WiFi network
   - Verify reconnection attempt detected (heartbeat timeout)
   - Verify successful reconnection

5. **Component unmount during reconnect** - No memory leaks
   - Start connection attempt with bridge offline
   - Navigate away from component
   - Open Chrome DevTools Memory profiler
   - Verify no detached event listeners or timers

**Port Configuration Testing (Mobile + Desktop):**

1. **Default port works** - No configuration required
   - Fresh install, no localStorage
   - Open app, verify connection succeeds on default port

2. **Custom port persists** - Across sessions
   - Set custom port in UI (e.g., 21326)
   - Close/reopen browser
   - Verify custom port used (check Network tab)

3. **Invalid port shows error** - User guidance
   - Enter invalid port (e.g., 99999)
   - Verify helpful error message ("Port must be 1-65535")

4. **Port change while connected** - Graceful transition
   - Connect successfully
   - Change port in UI
   - Verify old connection closed cleanly
   - Verify new connection attempt to new port

5. **Environment variable override** - Precedence rules
   - Set `VITE_WLED_BRIDGE_PORT=21327` in `.env.local`
   - Open app
   - Verify env port used (check console log: "Using bridge port from env: 21327")
   - Set different port in UI
   - Verify UI overrides env (localStorage precedence)

**Device Management Testing (Manual Regression):**

1. **Device added propagates** - After registry migration
   - Add device in LEDMatrixManager (IP: 192.168.1.100)
   - Navigate to WLED Device Manager
   - Verify device appears in list
   - Navigate to LED Strip Manager
   - Verify device appears there too

2. **Device IP change updates everywhere**
   - Edit device IP in one component
   - Check other components
   - Verify change reflected (centralized registry benefit)

3. **Multiple devices with same IP** - Error handling
   - Add device with duplicate IP
   - Verify warning message: "Device with this IP already exists"

4. **Registry corruption recovery** - localStorage parse error
   - Manually corrupt localStorage JSON
   - Reload app
   - Verify graceful fallback (empty registry, console error logged)

**Edge Case Manual Verification:**

- **Browser back button during connection** - Open LEDMatrix, hit back immediately, check DevTools for cleanup
- **localStorage quota exceeded** - Add 100+ devices, verify quota warning
- **CORS issues on HTTPS** - Deploy to `https://` domain, verify `wss://` protocol used
- **Firewall blocks WebSocket** - Disable bridge, check error message quality (user-facing vs. console-only)

**Quality Metrics (Manual Tracking):**

- **Connection success rate** on first attempt - Count successes/attempts over 20 manual tests (target: 19/20 = 95%)
- **Reconnection time** after bridge restart - Measure with stopwatch (target: <3 seconds)
- **User-reported connection issues** - Track GitHub issues labeled "connection" (baseline: current state, target: -80% after refactor)

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial draft | 2025-01-30 | 0.1 | Introduction section with analysis, risks, verification strategy | Winston (Architect) |

---

