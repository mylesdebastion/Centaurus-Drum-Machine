# Epic 20: Workshop-Ready Education Mode

**Status:** 🔴 **ACTIVE - CRITICAL TIMELINE**
**Priority:** 🔴 **CRITICAL (Workshop in 2 Days)**
**Target Completion:** 2025-10-21 (Tomorrow - End of Day)
**Owner:** Dev Team + Sarah (PO)

---

## Epic Goal

Enable **offline-first workshop mode** for deaf student education with WLED visualization and optional APC40 pattern programming, ensuring **zero-setup deployment** for workshop day with laptop-based instruction and WLED tube synchronization.

---

## Business Context

### Workshop Requirements (Wednesday Deployment)

**Primary Use Case:** Music educator workshop for deaf K5-10 students
- **Hardware:** 6 WLED tubes + APC40 controller + Laptop (no guaranteed internet)
- **Duration:** 1-minute intro + 15-minute activity
- **Constraint:** Limited tech support, zero setup time on-site
- **Success Metric:** Instructor boots laptop → app auto-configures → workshop starts immediately

### Technical Scenarios (Priority Order)

#### **Scenario #1: Offline Workshop MVP** (CRITICAL - Must work tomorrow)
- **Setup:** Laptop + WLED tubes (+ optional APC40)
- **Students see:** Laptop screen (/isometric) + 6 WLED tubes lighting up synchronized
- **Instructor controls:** Laptop keyboard/mouse (+ APC40 if time permits)
- **Features:**
  - Auto-load WLED device IPs from `education/workshop-config.json` (generated via discovery tool)
  - `/isometric` sequencer with 6-tube visualization
  - One-click startup via `education/workshop-start.bat`
  - Fullscreen browser mode (auto-launched)
  - Standalone WLED manager (Story 2.3) for backup manual config
  - All settings from localStorage (no Supabase, no internet)
  - APC40 pattern programming (optional - nice-to-have, not blocking)
- **Timeline:** TODAY + TOMORROW (must be 100% functional)

#### **Scenario #2: Tablet Supplement** (DEFERRED - Optional Standalone)
- **Setup:** Instructor brings tablet (optional, separate from laptop)
- **Use case:** Tablet shows `/education` module or DJ Visualizer **standalone** (not synced with laptop)
- **Features:**
  - Tablet navigates to own localhost or static HTML (no sync needed)
  - Used for supplemental visual demonstrations
  - **NOT connected to WLED** (laptop controls WLED only)
  - **NOT synced with laptop** (independent views)
- **Timeline:** DEFERRED - tablet is optional supplement, not core workshop tech

#### **Scenario #3: Cloud Sync** (DEFERRED - Future Backlog)
- **Setup:** Laptop + WLED + Tablet (both online via Supabase)
- **Features:** Full /jam session with Realtime sync, audio streaming, user accounts
- **Timeline:** Part of Epic 7 expansion (post-workshop)

---

## Existing System Context

### Already Complete (Reuse)

| Story | Epic | Status | Relevance |
|-------|------|--------|-----------|
| **Story 2.3** | Epic 2 | ✅ Complete | Standalone WLED manager, static LED visualization |
| **Story 18.0** | Epic 18 | ✅ Complete | User auth (optional for Scenario #3 only) |
| **Story 7.1** | Epic 7 | ✅ Complete | Supabase setup (optional for Scenario #3 only) |

### Partially Complete (Finish)

| Story | Epic | Status | Needs |
|-------|------|--------|-------|
| **Story 1.6** | Epic 1 | 🔶 Partial | Complete APC40 LED button mapping |

### Newly Planned (Defer Stripe)

| Story | Epic | Status | Workshop Status |
|-------|------|--------|-----------------|
| **Story 7.10** | Epic 7 | 📝 Planned | DEFER (use localStorage only) |
| **Story 10.7** | Epic 3 | 📝 Planned | DEFER Stripe, use local license config |
| **Story 18.11** | Epic 18 | 📝 Planned | DEFER (no migration UI needed for offline) |

---

## Technology Stack

### Existing (Leverage)
- **Frontend:** React 18.2.0, Vite dev server (port 5173)
- **WLED Communication:** WebSocket bridge (`wled-websocket-bridge.cjs` on port 8080)
- **Hardware:** APC40 MIDI integration (Epic 1)
- **Visualization:** `/isometric` sequencer with 90-LED strips
- **Storage:** localStorage for offline settings persistence

### New (Workshop Tools Created)
- **WLED Discovery Tool:** `education/discover-wled-devices.bat` (auto-generates workshop-config.json)
- **Workshop Config:** `education/workshop-config.json` (auto-generated or manual)
- **Workshop Startup Script:** `education/workshop-start.bat` / `.sh` (enhanced with fullscreen browser launch)
- **Emergency Manual Commands:** `docs/workshop/EMERGENCY-MANUAL-COMMANDS.md` (PowerShell fallback reference)

---

## Epic Stories

### **Critical Path (Scenario #1 - Offline MVP)**

#### **Story 20.1: Workshop Config Auto-Load** 🔴 **CRITICAL**
**Priority:** CRITICAL
**Time Estimate:** 2-3 hours
**Prerequisites:** None
**Status:** 📝 PLANNING

**Goal:** Auto-load WLED device IPs, tempo, patterns from `education/workshop-config.json` on `/isometric` startup.

**Acceptance Criteria:**
1. On app startup, check if `education/workshop-config.json` exists
2. If exists AND `workshopMode: true` → auto-load:
   - 6 WLED device IPs (192.168.8.151-156)
   - Device names, colors, LED counts
   - Default tempo (60 BPM for beginners)
   - Workshop patterns (simple/callResponse/fullBeat)
3. Apply settings to GlobalMusicContext
4. Navigate to `/isometric` automatically
5. No manual configuration required (zero clicks)

**Integration Verification:**
- **IV1:** Existing `/isometric` functionality unchanged
- **IV2:** Workshop config overrides localStorage defaults
- **IV3:** Non-workshop users unaffected (config file optional)

**Deliverables:**
- `src/services/WorkshopConfigService.ts` (~150 lines)
- Modified `src/App.tsx` (workshop mode detection)
- Modified `src/contexts/GlobalMusicContext.tsx` (auto-apply config)

---

#### **Story 20.2: APC40 LED Button Mapping Completion** 🟡 **OPTIONAL**
**Priority:** OPTIONAL (Nice-to-have, not blocking)
**Time Estimate:** 3-4 hours
**Prerequisites:** Story 1.6 (partial)
**Status:** 📝 PLANNING

**Goal:** Complete APC40 LED feedback for all buttons, enabling intuitive pattern programming workflow. **NOTE:** Instructor can program patterns via laptop keyboard/mouse if APC40 incomplete.

**Acceptance Criteria:**
1. All 40 APC40 clip launch buttons show LED feedback:
   - **Active step:** Bright color (pattern note exists)
   - **Inactive step:** Dim/off (no note)
   - **Current playhead:** Blinking indicator
2. Track select buttons control active lane (1-6 for workshop 6-tube setup)
3. Scene launch buttons trigger pattern playback
4. Stop/Play buttons control sequencer transport
5. LED colors match WLED tube colors (red/orange/yellow/green/blue/purple)
6. Offline-compatible (no Supabase dependency)

**Integration Verification:**
- **IV1:** Existing APC40 MIDI input unchanged
- **IV2:** LED feedback latency <50ms
- **IV3:** Works with or without WLED devices connected

**Deliverables:**
- Updated `src/hardware/apc40/APC40LEDController.ts` (~200 lines)
- Updated `src/hardware/apc40/APC40Service.ts` (LED state sync)
- Pattern → LED mapping logic

---

#### **Story 20.3: Offline-First Mode Verification** 🔴 **CRITICAL**
**Priority:** CRITICAL
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 20.1, 20.2
**Status:** 📝 PLANNING

**Goal:** Verify all workshop features work without internet connection, with graceful degradation for optional cloud features.

**Acceptance Criteria:**
1. **Startup with no internet:**
   - App loads workshop config from local file
   - `/isometric` renders correctly
   - WLED devices connect via local WebSocket (no internet needed)
   - APC40 controller functional
2. **Settings persistence:**
   - All settings save to localStorage only
   - No Supabase API calls attempted
   - No authentication prompts (anonymous mode)
3. **Error handling:**
   - Network errors shown as warnings (not blocking)
   - Supabase connection failures ignored
   - User sees "Offline Mode" indicator (optional)
4. **Feature toggles:**
   - Disable Supabase settings sync (Story 7.10 deferred)
   - Disable license checks (Story 10.7 deferred)
   - Disable settings migration UI (Story 18.11 deferred)

**Integration Verification:**
- **IV1:** All features from Scenario #1 functional offline
- **IV2:** No console errors from failed network calls
- **IV3:** App degrades gracefully when internet available (doesn't break existing features)

**Deliverables:**
- `src/config/workshopMode.ts` (offline mode flag)
- Modified `src/hooks/useSettings.ts` (offline-first logic)
- Modified `src/services/SupabaseSession.ts` (skip if offline mode)
- Offline mode indicator component (optional)

---

#### **Story 20.4: Workshop Startup Integration Testing** 🔴 **CRITICAL**
**Priority:** CRITICAL
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 20.1, 20.2, 20.3
**Status:** 📝 PLANNING

**Goal:** End-to-end integration testing of workshop flow, ensuring zero-friction deployment.

**Acceptance Criteria:**
1. **Full workshop flow test:**
   - Power on laptop (no internet)
   - Run `education/workshop-start.bat`
   - Verify WLED bridge starts (port 8080)
   - Verify dev server starts (port 5173)
   - Verify browser auto-opens to `/isometric`
   - Verify 6 WLED tubes connect
   - Verify APC40 controller connects
   - Verify default pattern loads and plays
2. **Hardware verification:**
   - All 6 WLED tubes respond to sequencer
   - APC40 buttons trigger notes
   - APC40 LEDs show pattern state
   - Tempo changes reflect on all devices
3. **Performance testing:**
   - Startup time <30 seconds (boot to ready)
   - LED visualization latency <50ms
   - Pattern changes instant (<100ms)
   - No dropped frames or stuttering
4. **Emergency scenarios:**
   - 1 WLED tube offline → continue with 5 tubes
   - APC40 disconnected → manual pattern editing still works
   - Laptop WiFi disabled → WebSocket bridge still works (local)

**Integration Verification:**
- **IV1:** All workshop checklist items pass (SETUP-GUIDE.md)
- **IV2:** Emergency backup plans tested (EMERGENCY-BACKUP.md)
- **IV3:** No blocking errors or crashes

**Deliverables:**
- Workshop testing checklist (updated SETUP-GUIDE.md)
- Performance benchmark results
- Emergency troubleshooting guide update
- Video recording of successful workshop flow (proof)

---

## Dependency Map

### Cross-Epic Dependencies

```
Epic 20 (Workshop Mode)
├── Epic 1 (APC40 Hardware)
│   └── Story 1.6 (LED Mapping) ← FINISH THIS
│
├── Epic 2 (Boomwhacker/Education)
│   └── Story 2.3 (WLED Manager) ✅ COMPLETE
│
├── Epic 7 (Jam Session Backend)
│   ├── Story 7.1 (Supabase Setup) ✅ COMPLETE (optional for Scenario #3)
│   └── Story 7.10 (Settings Persistence) ❌ DEFER (use localStorage only)
│
├── Epic 18 (WLED Routing)
│   ├── Story 18.0 (User Auth) ✅ COMPLETE (optional for Scenario #3)
│   └── Story 18.11 (Migration UI) ❌ DEFER (not needed for offline)
│
└── Epic 3 (Monetization)
    └── Story 10.7 (License Auto-Load) ❌ DEFER Stripe (use local config)
```

### Story Dependencies (Critical Path)

**Day 1 (Today - Oct 20):**
```
Morning:
├── Story 20.1 (Config Auto-Load) [2-3h] ← START HERE (CRITICAL)
│
Afternoon:
├── Story 20.3 (Offline Verification) [2-3h] ← DEPENDS ON 20.1 (CRITICAL)
└── Story 20.2 (APC40 LED Mapping) [3-4h] ← OPTIONAL (if time permits)
```

**Day 2 (Tomorrow - Oct 21):**
```
Morning:
└── Story 20.4 (Integration Testing) [2-3h] ← DEPENDS ON 20.1, 20.3 (CRITICAL)

Afternoon:
├── Story 20.2 (APC40 completion) [IF NOT DONE YESTERDAY - OPTIONAL]
└── Final polish, bug fixes, workshop dry run
```

---

## Compatibility Requirements

### Offline-First Guarantees

- ✅ **Zero internet dependency** for Scenario #1
- ✅ **localStorage-only** settings persistence
- ✅ **No Supabase API calls** in offline mode
- ✅ **Graceful degradation** when network available
- ✅ **Backward compatibility** with existing `/isometric` usage

### Deferred Features (No Impact on Workshop)

- ❌ **Supabase settings sync** (Story 7.10) → localStorage only
- ❌ **Stripe license validation** (Story 10.7) → Local config JSON
- ❌ **Settings migration UI** (Story 18.11) → Not needed
- ❌ **User authentication** (Story 18.0) → Anonymous mode only
- ❌ **Cloud sync** (Scenario #3) → Epic 7 expansion (backlog)

---

## Risk Mitigation

### Primary Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Workshop config fails to load** | CRITICAL | Fallback to manual WLED manager (Story 2.3) |
| **APC40 LED mapping incomplete** | HIGH | Manual pattern editing via UI still works |
| **WLED devices don't connect** | CRITICAL | Pre-configure IPs, test extensively, have backup tubes |
| **Offline mode breaks existing features** | MEDIUM | Feature flags, extensive testing, rollback plan |
| **Local network sync doesn't work** | LOW | Scenario #2 is optional, Scenario #1 is baseline |

### Rollback Plan

**If workshop deployment fails:**
1. Revert to last stable commit (before Epic 20)
2. Use Story 2.3 standalone WLED manager (manual setup)
3. Skip APC40 (manual pattern programming via UI)
4. Activate EMERGENCY-BACKUP.md Plan B (instructor-led, no tech)

**Rollback Time:** <5 minutes (git reset, restart server)

---

## Definition of Done

### Scenario #1 (Offline MVP) - REQUIRED

- ✅ Workshop config auto-loads from `education/workshop-config.json`
- ✅ All 6 WLED tubes connect and visualize patterns
- ✅ `/isometric` sequencer works offline (no internet required)
- ✅ Settings persist via localStorage (no Supabase)
- ✅ Startup time <30 seconds (boot to ready)
- ✅ Workshop startup script works (`workshop-start.bat`)
- ✅ All SETUP-GUIDE.md checklist items pass
- ✅ Emergency backup plans tested
- ✅ Manual pattern programming via laptop UI works (fallback if APC40 unavailable)

### Scenario #1 (Optional Enhancement)

- ⚠️ APC40 controller fully functional (LED buttons, pattern programming) - **NICE-TO-HAVE**
- ⚠️ Story 1.6 (APC40 LED Mapping) completed - **NOT BLOCKING**

### Scenario #2 (Tablet Supplement) - DEFERRED

- ⚠️ Tablet can show `/education` or DJ Visualizer **standalone** (not synced)
- ⚠️ No local network sync needed (fully deferred to post-workshop)

### Cross-Epic Verification

- ✅ Story 2.3 (WLED Manager) integration verified
- ✅ Epic 7/18/3 stories deferred without breaking workshop
- ✅ No regression in existing `/isometric` functionality

---

## Success Metrics

### Workshop Day Metrics

**Technical:**
- Workshop setup time: <5 minutes (goal: 2 minutes)
- Zero blocking errors or crashes
- WLED visualization latency: <50ms
- APC40 LED feedback latency: <50ms

**User Experience:**
- Instructor boots laptop → immediately ready (zero manual config)
- Students see clear LED patterns synchronized with sequencer
- Instructor can program new patterns via APC40 easily
- Emergency backup plans not needed (tech works)

**Deployment:**
- Single command startup: `education/workshop-start.bat`
- No troubleshooting required on-site
- All 6 WLED tubes connect within 30 seconds

---

## Timeline Summary

| Day | Focus | Stories | Hours |
|-----|-------|---------|-------|
| **Today (Oct 20)** | Scenario #1 Critical Path | 20.1 (CRITICAL), 20.3 (CRITICAL), 20.2 (OPTIONAL) | 4-8h |
| **Tomorrow (Oct 21)** | Testing + Polish + Optional APC40 | 20.4 (CRITICAL), 20.2 (if time), bug fixes, dry run | 4-7h |
| **Workshop Day (Oct 22)** | Deployment + Support | N/A | 2h setup + monitoring |

**Total Critical Path Time:** 6-8 hours (3 stories: 20.1, 20.3, 20.4)
**Total with APC40 Optional:** 9-12 hours (4 stories: 20.1, 20.2, 20.3, 20.4)

---

## Post-Workshop Backlog

**Deferred to Epic 21 (Future):**
- **Tablet Sync (Scenario #2):** Local network sync architecture (HTTP polling or WebSocket)
- **Tablet Discovery:** Local network discovery (mDNS/QR codes)
- **Scenario #3 Full Implementation:** Cloud sync via Supabase Realtime (Epic 7 expansion)
- **Story 7.10:** Supabase settings sync (when internet available)
- **Story 10.7:** Stripe license integration (when monetization ready)
- **Story 18.11:** Settings migration UI (when user accounts launched)

---

## Handoff to Development

**Story Manager / Dev Agent:**

"Please implement Epic 20 stories in the following sequence:

**CRITICAL PATH (Must Complete by Tomorrow EOD):**
1. Story 20.1 (Config Auto-Load) - START IMMEDIATELY (2-3h)
2. Story 20.3 (Offline Verification) - AFTER 20.1 (2-3h)
3. Story 20.4 (Integration Testing) - FINAL VERIFICATION (2-3h)

**OPTIONAL (If Time Permits):**
4. Story 20.2 (APC40 LED Mapping) - NICE-TO-HAVE (3-4h)
   - Instructor can program patterns via laptop UI if APC40 incomplete
   - NOT BLOCKING for workshop success

**Key Integration Points:**
- Leverage Story 2.3 (WLED Manager) - already complete (backup manual config)
- Defer Epic 7/18/3 stories - use localStorage only, no Supabase
- Workshop config: `education/workshop-config.json` (generated via discovery tool)
- Workshop startup: `education/workshop-start.bat` (already created)

**Critical Success Criteria:**
- Offline mode MUST work without internet
- Workshop startup MUST be one-click (`workshop-start.bat`)
- WLED tube integration MUST be seamless (6 tubes synchronized)
- Manual pattern programming via laptop UI MUST work (APC40 optional fallback)
- Emergency backup plans MUST be tested (`EMERGENCY-MANUAL-COMMANDS.md`)

**Simplified Scope:**
- APC40 is OPTIONAL - workshop can succeed with laptop keyboard/mouse pattern programming
- Tablet sync is DEFERRED - tablet can show standalone `/education` or DJ visualizer if brought
- Focus on laptop + WLED tubes as core student experience

**Timeline Constraint:** Workshop Wednesday morning - zero margin for error. Prioritize critical path (20.1 → 20.3 → 20.4) above all else."

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-20 | 1.0 | Initial epic creation for workshop readiness | Sarah (PO) |
| 2025-10-20 | 1.1 | Revised scope based on hardware reality: APC40 optional, tablet sync deferred, focus on laptop+WLED critical path | Sarah (PO) + Dev |

---

**Epic Owner:** Sarah (PO)
**Development Lead:** Dev Agent
**Workshop Date:** Wednesday, October 22, 2025
**Current Status:** 🔴 ACTIVE - CRITICAL TIMELINE
