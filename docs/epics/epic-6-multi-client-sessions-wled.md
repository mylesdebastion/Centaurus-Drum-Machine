# Epic 6: Multi-Client Sessions & WLED Integration

**Status:** 🚧 **IN PROGRESS** (Phase 0 Complete, Blocked by HTTPS→HTTP Security)
**Priority:** High
**Target Completion:** Q1 2025 (Pending Capacitor native app decision)

---

## Epic Overview

This epic enables multiple users to join shared jam sessions where each musician controls their own WLED LED devices while sharing audio/MIDI/visualization data through a session server. The architecture follows a user-ownership model where each musician owns their instrument's LED controllers (guitar, drums, keys) and receives collaborative visualization data.

**Critical Blocker Discovered (2025-10-10):** Modern browsers block HTTPS websites from making HTTP requests to local devices (Mixed Content Security Restriction). This affects production deployment (`https://jam-dev.audiolux.app` → `http://192.168.1.50` WLED device). Phase 0 (WLED Device Manager) is complete and works perfectly in development (`http://localhost:5173`), but cannot work in production without a native app approach (Capacitor).

**Vision:** Musicians jam together in shared sessions with their own WLED devices responding to both individual performance and the group's combined output, creating a cohesive visual experience across distributed hardware.

**Business Requirements:**
- Multi-user collaboration for remote/hybrid jam sessions
- Each user maintains independent control of their WLED hardware
- Real-time audio/MIDI data sharing with <100ms latency
- Consistent WLED device management UX across all experiments
- Reusable components to eliminate code duplication

**Technical Requirements:**
- Unified WLED Device Manager component (reusable across all experiments)
- Session server infrastructure (Socket.io for state/control, WebRTC for audio)
- User ownership model (no multi-client-to-one-WLED complexity)
- Responsive grid layouts for multi-device management
- Progressive disclosure UX for complex device settings
- **Production deployment requires Capacitor native app** (iOS/Android)

---

## Core Philosophy

### User Ownership Model

**Each musician owns their WLED device(s).** No multi-client-to-one-WLED coordination needed.

```
        Session Server (Socket.io/WebRTC)
              ↓         ↓         ↓
         User 1     User 2     User 3
       (Browser)  (Browser)  (Browser)
            ↓          ↓          ↓
      WLED Guitar  WLED Drums  WLED Keys
```

**Guitarist:** Owns WLED strips on guitar neck/body
**Drummer:** Owns WLED strips on drums/cymbals
**Keyboardist:** Owns WLED matrices behind keyboard

Each user's browser:
1. Captures audio from their instrument
2. Connects to session server (shares data)
3. Receives other users' audio/MIDI data
4. Generates combined visualization
5. Sends LED data to THEIR OWN WLED device(s)

### Unified Component Architecture

Single, reusable `WLEDDeviceManager` component used by:
- `/jam` (JamSession)
- `/dj-visualizer` (LiveAudioVisualizer)
- `/isometric` (IsometricSequencer)
- `/piano` (PianoRoll)
- `/session` (Multi-user sessions)

**Benefits:**
- Consistent UX across all experiments
- Reduced code duplication (replaces LEDMatrixManager, LEDStripManager)
- Single source of truth for WLED connection logic
- Easier maintenance and feature additions

### Progressive Disclosure for Complexity

**Essential controls visible:** Enable toggle, IP address, connection status, virtual LED preview
**Advanced settings collapsed:** LED count, orientation, test patterns, solo/mute
**Quick actions:** Test pattern, delete device

Reduces cognitive load on mobile while keeping power user features accessible.

---

## ⚠️ CRITICAL BLOCKER: Mixed Content Security Restriction

### Problem

**All modern browsers block HTTPS websites from making HTTP requests to local devices.** This is a fundamental security restriction with NO workaround in web browsers.

```
✅ Works: http://localhost:5173 → http://192.168.1.50 (dev server, HTTP→HTTP)
❌ Fails: https://jam-dev.audiolux.app → http://192.168.1.50 (production, HTTPS→HTTP)
```

**Browser error:**
> "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://192.168.1.50/...'. This request has been blocked; the content must be served over HTTPS."

**Additional restrictions:**
- **Chrome Private Network Access (PNA):** Chrome 130+ blocks public websites → private network (192.168.x.x) requests unless WLED firmware sends `Access-Control-Allow-Private-Network: true` header (not supported as of 2024)
- **iOS Safari Local Network Permission:** iOS 14+ requires system-level permission, still subject to mixed content blocking

### Solution: Native Mobile App (Capacitor)

**Recommended path forward:** Wrap React app as native iOS/Android app using Capacitor.

```
Current (Blocked):
https://jam-dev.audiolux.app → ❌ → http://192.168.1.50

Future (Unblocked):
Native iOS/Android App → ✅ → http://192.168.1.50
```

**Why this works:**
- Native apps do NOT have mixed content restrictions
- Can freely make HTTP requests to local network devices
- Same React codebase (95% code reuse)
- Better UX for mobile users (app icon, notifications, Bluetooth MIDI)

**Implementation:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Audiolux" "com.audiolux.app"
npx cap add ios
npx cap add android
npm run build
npx cap sync
```

**Tradeoffs:**
- ✅ Solves HTTPS→HTTP blocker permanently
- ✅ Native app features (Bluetooth, notifications, camera)
- ✅ Better mobile UX
- ⚠️ Requires App Store / Google Play submission (review process)
- ⚠️ Users must install app (not instant web access)
- ⚠️ Maintain both web (desktop) + native (mobile) builds

**Decision:** PARK multi-client session features (Phase 1-5) until ready for Capacitor native app development. Phase 0 (WLED Device Manager) complete and available for use in development environment.

---

## Stories

### **Story 6.1: Multi-Client Shared Sessions (Phase 0 - Unified WLED Device Manager)** ✅ **HIGH**
**Status:** COMPLETE (Phase 0 only)
**Complexity:** High
**Prerequisites:** Story 5.1 (Universal Responsive Architecture)

**Goal:** Create reusable, responsive WLED device manager component for all experiments with quick setup, grid layouts, progressive disclosure UX, and Story 5.1 compliance (single instance pattern).

**Key Features (Phase 0 Delivered):**
- Quick setup flow (<3 clicks to add device)
- Auto-connect on device enable (no separate "Connect" button)
- Visual connection status (connected/disconnected/error)
- Virtual LED preview updates immediately when connected
- Grid layout support (1 col mobile, 2-3 col tablet, 3-4 col desktop)
- Compact device cards with expand/collapse for advanced settings
- Progressive disclosure UX (essential visible, advanced collapsed)
- Consistent data flow indicators (idle → receiving → sending)
- Device persistence (localStorage, auto-reconnect on reload)
- Reusability across /jam, /dj-visualizer, /isometric, /piano, /session

**Deliverables:**
- `src/components/WLED/WLEDDeviceManager.tsx` - Main component with WebSocket connections, state management (394 lines)
- `src/components/WLED/WLEDDeviceCard.tsx` - Device card UI with status, settings, quick actions (272 lines)
- `src/components/WLED/WLEDVirtualPreview.tsx` - LED visualization for strips and matrices (125 lines)
- `src/components/WLED/types.ts` - TypeScript interfaces for devices, props, configuration (81 lines)

**Modified:**
- `src/components/WLEDExperiment/WLEDDirectTest.tsx` - Integrated WLEDDeviceManager (+319 lines, refactored)
- `docs/stories/6.1.story.md` - Updated with Phase 0 completion (+28 lines)

**Total:** 951 insertions, 268 deletions across 6 files (~730 new lines)

**Reuse:**
- ✅ Story 5.1 responsive patterns (useResponsive, CollapsiblePanel)
- ✅ Existing colorMapping.ts utilities
- ✅ WLED HTTP JSON API (not WebSocket - simplified for Phase 0)

**Blocker Status:**
- ✅ Works perfectly in dev (`http://localhost:5173`)
- ❌ **BLOCKED in production** (`https://jam-dev.audiolux.app`) - Mixed Content Security
- ⏳ **Future phases (Phase 1-5) deferred** until Capacitor native app decision

---

### **Story 6.2: Session Infrastructure (Phase 1)** 📝 **HIGH**
**Status:** PLANNING (Blocked by Capacitor decision)
**Complexity:** High
**Prerequisites:** Story 6.1 (Phase 0), Capacitor native app implementation

**Goal:** Get 2 users in a room sharing basic MIDI/audio data via Socket.io session server.

**Key Features (Planned):**
- Session creation/joining UI with 6-digit room codes
- User presence tracking (online/offline indicators)
- Socket.io server deployment (Railway/Render)
- Basic MIDI event routing (<50ms latency)
- Connection resilience (auto-reconnect)

**Deliverables (Planned):**
- `src/services/SessionClient.ts` - Session WebSocket client
- `src/components/Session/SessionManager.tsx` - Main session UI
- `src/components/Session/SessionLobby.tsx` - Join/create UI
- `src/components/Session/UserList.tsx` - Connected users display
- `src/hooks/useSession.ts` - Session state hook
- `server/src/index.ts` - Socket.io server entry
- `server/src/SessionManager.ts` - Server-side session logic

**Reuse:**
- ✅ WLEDDeviceManager (Phase 0)
- ✅ midiInputManager (Story 9.1)
- ✅ FrequencySourceManager (Story 4.1)

---

### **Story 6.3: WLED Integration with Unified Manager (Phase 2)** 📝 **MEDIUM**
**Status:** PLANNING (Blocked by Story 6.2)
**Complexity:** Medium
**Prerequisites:** Story 6.2 (Session Infrastructure)

**Goal:** Each user controls their own WLED from shared session data.

**Key Features (Planned):**
- Integrate WLEDDeviceManager into SessionManager
- "Combined" visualization mode (merged session audio)
- Multi-device coordination
- Test with 2 users + 2 WLED devices

**Deliverables (Planned):**
- Modified: `src/components/Session/SessionManager.tsx` - WLEDDeviceManager integration
- Created: `src/utils/sessionVisualization.ts` - Combined visualization logic

**Reuse:**
- ✅ WLEDDeviceManager (Phase 0)
- ✅ Existing visualizationEngine patterns

---

### **Story 6.4: Visualization Modes (Phase 3)** 📝 **MEDIUM**
**Status:** PLANNING (Blocked by Story 6.3)
**Complexity:** Medium
**Prerequisites:** Story 6.3 (WLED Integration)

**Goal:** Multiple ways to visualize collaborative performance.

**Key Features (Planned):**
- "Individual" mode (local audio only)
- "Per-User Lanes" mode (color-coded per user)
- Mode selector UI with persistence
- User color assignment and coordination

**Deliverables (Planned):**
- Created: `src/components/Session/VisualizationModeSelector.tsx`
- Modified: `src/utils/sessionVisualization.ts` - Add mode logic

---

### **Story 6.5: Audio Streaming (Phase 4)** 📝 **LOW (Optional)**
**Status:** PLANNING (Blocked by Story 6.3)
**Complexity:** High
**Prerequisites:** Story 6.3

**Goal:** Share actual audio streams, not just MIDI data.

**Key Features (Planned):**
- WebRTC peer connections setup
- Audio stream capture and routing
- Per-user volume controls
- Audio mixing in browser

**Deliverables (Planned):**
- Created: `src/services/WebRTCClient.ts` - WebRTC audio streaming
- Modified: `src/components/Session/SessionManager.tsx` - Audio mixing

---

## Component Reuse Strategy

### Shared Infrastructure (Phase 0 Delivered)

**WLED Device Management:**
- ✅ **WLEDDeviceManager** → Used by /jam, /dj-visualizer, /isometric, /piano, /session (replaces LEDMatrixManager, LEDStripManager)
- ✅ **WLEDDeviceCard** → Consistent device UI across all experiments
- ✅ **WLEDVirtualPreview** → Visual feedback for LED data flow

**Props-Down Data Flow:**
```typescript
// Simple integration pattern
const MyComponent = () => {
  const ledColors = visualizationEngine.render(audioData);

  return (
    <WLEDDeviceManager
      ledData={ledColors}
      layout={isMobile ? 'mobile' : 'desktop'}
      storageKey="wled-mycomponent"
      deviceType="strip"
    />
  );
};
```

### Future Infrastructure (Phase 1-5, Blocked)

**Session Management:**
- 🚧 **SessionClient** → WebSocket connection to session server
- 🚧 **useSession hook** → Session state and actions
- 🚧 **SessionManager** → Main session UI component

**Audio/MIDI Sharing:**
- 🚧 **WebRTCClient** → Peer-to-peer audio streaming (optional Phase 4)
- 🚧 **sessionVisualization** → Combined visualization logic

---

## Technical Architecture

### WLED Device Manager API (Phase 0 - Complete)

```typescript
interface WLEDDeviceManagerProps {
  // Data (props-down pattern)
  ledData?: string[];                    // Hex color array ['FF0000', '00FF00', ...]

  // Layout (Story 5.1 pattern)
  layout?: 'mobile' | 'desktop';         // Controls responsive grid layout

  // Persistence (required)
  storageKey: string;                    // localStorage key (e.g., "wled-jam")

  // Optional configuration
  deviceType?: 'strip' | 'matrix' | 'auto';  // Default: 'auto'
  maxDevices?: number;                       // Limit devices (default: 10)
  showVirtualPreview?: boolean;              // Default: true
  compactMode?: boolean;                     // Minimal UI for embedded use
}

// Component internally:
// - Manages device list state
// - Maintains HTTP connections to each enabled device (fetch-based, not WebSocket)
// - Sends ledData to all enabled devices when it changes
// - Persists device configs to localStorage
```

**Example Integration:**
```typescript
// In LiveAudioVisualizer
const ledColors = useMemo(() => {
  return visualizationEngine.render(audioData);
}, [audioData]);

return (
  <WLEDDeviceManager
    ledData={ledColors}
    layout={isMobile ? 'mobile' : 'desktop'}
    storageKey="wled-dj-visualizer"
    deviceType="strip"
  />
);
```

### Session Architecture (Phase 1-5 - Planned)

```
┌──────────────────────────────────────────┐
│        Session Server (Node.js)          │
│  - Socket.io for MIDI/state messages    │
│  - WebRTC signaling (optional Phase 4)  │
│  - Room management (6-digit codes)       │
│  - User presence tracking                │
└──────────────────────────────────────────┘
           ↓         ↓         ↓
      ┌─────────┐ ┌─────────┐ ┌─────────┐
      │ User 1  │ │ User 2  │ │ User 3  │
      │ Browser │ │ Browser │ │ Browser │
      └─────────┘ └─────────┘ └─────────┘
           ↓         ↓         ↓
      ┌─────────┐ ┌─────────┐ ┌─────────┐
      │  WLED   │ │  WLED   │ │  WLED   │
      │ Guitar  │ │  Drums  │ │  Keys   │
      └─────────┘ └─────────┘ └─────────┘
```

**Data Flow (Planned):**
1. Local Audio Capture → AudioContext → FFT Analysis → MIDI Note Detection
2. Client → WebSocket → Session Server → Broadcast to Other Clients
3. Local Audio + Other Users' MIDI → Visualization Engine → LED Array → WLED

---

## Integration Strategy

**Phase 0 - Unified WLED Device Manager (Foundation)** ✅ (Story 6.1):
- Created WLEDDeviceManager component (~394 lines)
- Created WLEDDeviceCard component (~272 lines)
- Created WLEDVirtualPreview component (~125 lines)
- Created TypeScript types (~81 lines)
- Integrated into /wled-test route with rainbow test pattern
- Implements all UX specs (error states, loading states, accessibility, mobile patterns)
- Ready for integration into /jam, /dj-visualizer, /isometric, /piano

**Phase 1 - Session Infrastructure (MVP)** 🚧 (Story 6.2 - Blocked):
- Set up Socket.io session server
- Deploy to Railway/Render
- Create session creation/joining UI
- Implement user presence (online/offline)
- Basic MIDI event routing

**Phase 2 - WLED Integration with Unified Manager** 🚧 (Story 6.3 - Blocked):
- Integrate WLEDDeviceManager into SessionManager
- Implement "Combined" visualization mode
- Test with 2 users + 2 WLED devices

**Phase 3 - Visualization Modes** 🚧 (Story 6.4 - Blocked):
- Implement "Individual" mode (local audio only)
- Implement "Per-User Lanes" mode (color-coded)
- Add mode selector UI
- User color assignment

**Phase 4 - Audio Streaming (Optional)** 🚧 (Story 6.5 - Blocked):
- WebRTC peer connections setup
- Audio stream capture and routing
- Per-user volume controls
- Audio mixing in browser

---

## Success Metrics

### Story 6.1 (Phase 0 - Unified WLED Device Manager)
- [x] WLEDDeviceManager component created (~730 lines across 4 files)
- [x] Quick setup flow (<3 clicks to add device)
- [x] Auto-connect on device enable
- [x] Visual connection status indicators
- [x] Virtual LED preview works
- [x] Grid layout responsive (1-4 cols based on breakpoint)
- [x] Progressive disclosure UX (essential visible, advanced collapsed)
- [x] Device persistence (localStorage, auto-reconnect)
- [x] Integrated into /wled-test route
- [x] Works perfectly in dev environment (http://localhost:5173)
- [ ] **BLOCKED:** Production deployment requires native app (Capacitor)

### Future Stories (Phase 1-5 - Blocked by Capacitor)
- [ ] Story 6.2: Session Infrastructure (Socket.io server, room codes, presence tracking)
- [ ] Story 6.3: WLED Integration (2 users + 2 WLED devices in session)
- [ ] Story 6.4: Visualization Modes (Individual, Combined, Per-User Lanes)
- [ ] Story 6.5: Audio Streaming (WebRTC, optional)

### Overall Epic Success (Future)
- [x] Story 6.1 (Phase 0) COMPLETE
- [ ] Production deployment decision made (Capacitor vs alternative)
- [ ] Stories 6.2-6.5 unblocked and prioritized
- [ ] 2+ users can join session simultaneously
- [ ] Each user controls their own WLED device
- [ ] MIDI data shared with <100ms latency
- [ ] Session remains stable for 30+ minutes
- [ ] Works on iOS and Android (via Capacitor native app)

---

## Future Enhancements (Post-MVP)

### Native App Features (Capacitor)
- iOS home screen install
- Android TWA (Trusted Web Activity)
- Push notifications for session invites
- Bluetooth MIDI support (native API access)
- Offline session recording

### Advanced Session Features
- Session recording (save pattern + MIDI events)
- Session playback (replay recorded jams)
- Private sessions (password protection)
- Session persistence (database storage)
- Session discovery (public rooms, join random)

### WLED Enhancements
- WLED device auto-discovery (mDNS/Bonjour)
- Multi-device synchronization (beat-matched timing)
- Device groups (control multiple devices as one)
- Custom LED patterns (user-defined animations)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-09 | 1.0 | Initial story creation for multi-client shared sessions | Claude Code |
| 2025-10-09 | 2.0 | Added Phase 0 (Unified WLED Device Manager) | PM Agent (John) |
| 2025-10-09 | 2.1 | Simplified architecture for fast prototyping | Architect (Winston) |
| 2025-10-09 | 2.2 | Added critical UX specifications | UX Expert (Sally) |
| 2025-10-10 | 2.3 | **CRITICAL BLOCKER DISCOVERED:** HTTPS→HTTP Mixed Content Security | Dev Agent |
| 2025-10-10 | 3.0 | Story 6.1 Phase 0 COMPLETE - Unified WLED Device Manager | Dev Agent (claude-sonnet-4-5-20250929) |
| 2025-01-13 | 3.1 | Epic creation from Story 6.1 Phase 0 completion | Sarah (PO) |

---

## Next Steps

1. ✅ **Story 6.1 Phase 0** - COMPLETE (Unified WLED Device Manager, commit 8ecffbf)
2. **Product Decision:** Evaluate Capacitor native app approach
   - Estimate development effort (2-4 weeks)
   - Evaluate App Store / Google Play requirements
   - Consider alternative: HTTP-only hosting for dev/testing
3. **Integration:** Replace LEDMatrixManager and LEDStripManager with WLEDDeviceManager
   - `/dj-visualizer` (LiveAudioVisualizer)
   - Education Mode (multi-lane LED strips)
4. **Future:** Unblock Stories 6.2-6.5 after native app decision

---

## Git Commit Reference

**Primary Implementation:** Commit `8ecffbf`
```
feat: implement Story 6.1 Phase 0 - Unified WLED Device Manager

Created reusable WLED device management component (~730 lines across 4 files):
- WLEDDeviceManager.tsx - Main component with WebSocket connections, localStorage persistence, responsive grid
- WLEDDeviceCard.tsx - Device card UI with status indicators, settings panel, quick actions
- WLEDVirtualPreview.tsx - LED visualization for strips and matrices with skeleton loading
- types.ts - TypeScript interfaces for device state, props, and configuration

Integrated into /wled-test route with rainbow test pattern support. Implements all UX specs from Story 6.1 v2.2 including error states, loading states, accessibility, and mobile patterns.

Ready for Checkpoint A - manual testing with real WLED hardware.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Files Changed:** 6 files, 951 insertions(+), 268 deletions(-)

**Testing Status:**
- ✅ Dev environment: Works perfectly (http://localhost:5173)
- ❌ Production: Blocked by HTTPS→HTTP Mixed Content Security
- ⏳ Awaiting Capacitor native app decision
