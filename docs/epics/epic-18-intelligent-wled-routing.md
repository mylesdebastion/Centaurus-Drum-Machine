# Epic 18: Intelligent WLED Visualization Routing

**Status:** PLANNING
**Priority:** 🔴 HIGH
**Epic Owner:** Winston (Architect) / Sarah (Product Owner)
**Created:** 2025-10-18

---

## Epic Vision

**"Configure hardware once, visualize any module automatically"**

Build an intelligent middleware system that automatically routes module visualizations (Drum Machine, Piano Roll, Guitar Fretboard, etc.) to appropriate WLED hardware based on device capabilities, module requirements, and context-aware rules.

**User Impact:** Users configure their LED hardware **once** (saved to Supabase), and every module they use automatically displays on the most appropriate LEDs without manual device selection.

---

## Problem Statement

### Current State (Epic 17 Limitation)
- **WLEDDeviceManager** - Simple device connection manager (generic hex color array input)
- **LEDStripManager** - Pattern-aware sequencer LED visualization (classroom-specific)
- **Manual Configuration** - Users must configure devices per module
- **No Intelligence** - Modules hardcoded to specific LED layouts
- **No Persistence** - Device configuration lost across sessions

### Desired State (Epic 18 Solution)
- **Unified WLED Manager** - Single device registry (Supabase-backed)
- **Intelligent Routing** - Automatic module-to-device matching
- **Context-Aware** - Routing adapts based on active module
- **Overlay System** - Audio reactive can layer on top of other visualizations
- **Zero Re-Configuration** - Devices configured once, work everywhere

---

## Architecture Overview

### System Layers

```
[Modules] → [Visualization Routing Matrix] → [WLED Device Registry] → [Physical LEDs]
   ↓              ↓                               ↓
Piano Roll    Intelligence Layer            6x25 Grid (DB)
DrumMachine   (Capability Matching)         90-LED Strip (DB)
Guitar        (Overlay Rules)               144-LED Strip (DB)
Audio         (Priority System)
```

**Key Components:**
1. **WLED Device Registry** - Persistent device storage (Supabase)
2. **Module Capability Declarations** - Modules declare what visualizations they produce
3. **Routing Matrix** - Intelligent matching algorithm
4. **Rules Engine** - Context-aware routing behaviors
5. **LEDCompositor Extension** - Integration with existing Epic 14 compositor

**Architecture Document:** [wled-visualization-routing.md](../architecture/wled-visualization-routing.md)

---

## Success Criteria

### User Experience
- ✅ Users configure WLED devices **once** via WLED Manager UI
- ✅ Device configuration **persists** in Supabase (accessible from iPad/Desktop)
- ✅ Switching modules (Drum Machine → Guitar) **automatically** re-routes visualizations
- ✅ Audio Reactive mode **overlays** on existing visualizations (no manual switching)
- ✅ Intelligent **fallbacks** work even with mismatched hardware (Piano Roll on 1D strip)

### Technical
- ✅ Capability-based routing (modules declare visualizations, system figures out routing)
- ✅ Type-safe module declarations (`ModuleVisualizationCapability` interface)
- ✅ Realtime device sync via Supabase (changes on desktop reflect on iPad)
- ✅ Extensible rules engine (add new routing rules without refactoring)
- ✅ Zero breaking changes to existing modules

### Performance
- ✅ Routing decision: <10ms (imperceptible latency)
- ✅ Device registry sync: <200ms (Supabase Realtime)
- ✅ LED frame generation: <16ms (60 FPS maintained)

---

## Stories

### **Story 18.0: Low-Friction User Authentication (Supabase Auth)**
**Estimate:** 4-6 hours | **Priority:** 🔴 HIGH (BLOCKS ALL OTHER STORIES)

Implement minimal user authentication to enable persistent features while maintaining low-friction UX for basic app usage.

**Deliverables:**
- Supabase Auth configuration (Email/Password + Magic Link)
- `user_profiles` table with RLS policies
- `useAuth` hook and AuthModal component
- Hybrid anonymous + authenticated system
- Username migration from localStorage

**Acceptance Criteria:**
- Basic features work without accounts (/jam, /studio)
- Advanced features prompt for optional account creation
- RLS policies enforced (auth.uid() available)
- Session persistence across browser tabs
- Anonymous-to-authenticated upgrade seamless

**Rationale:** Story 18.1+ require `auth.uid()` for Row Level Security. Without user authentication, the WLED device registry cannot enforce user-specific data access.

---

### **Story 18.1: WLED Device Registry (Supabase Backend)**
**Estimate:** 4-5 hours | **Priority:** 🔴 HIGH
**Prerequisites:** Story 18.0 (User Authentication)

Create Supabase-backed persistent storage for WLED device configurations, enabling cross-device access and real-time synchronization.

**Deliverables:**
- Supabase table: `wled_devices` (with RLS policies)
- Realtime subscription for device changes
- `WLEDDeviceRegistry` service (CRUD + sync)
- Migration from localStorage to Supabase

**Acceptance Criteria:**
- Device added on desktop appears on iPad within 200ms
- RLS policies enforce user-only access
- Existing devices migrated from localStorage
- Offline support with optimistic UI updates

---

### **Story 18.2: Module Capability Declaration System**
**Estimate:** 3-4 hours | **Priority:** 🔴 HIGH

Define TypeScript interfaces for modules to declare visualization capabilities and implement capability registration system.

**Deliverables:**
- `ModuleVisualizationCapability` interface
- `VisualizationType` enum (piano-keys, step-sequencer-grid, fretboard-grid, etc.)
- Module capability declarations (DrumMachine, PianoRoll, GuitarFretboard)
- Registration API in LEDCompositor

**Acceptance Criteria:**
- Type-safe module declarations
- Modules register capabilities on mount
- LEDCompositor tracks active modules
- Capability introspection API (`getModuleCapabilities(moduleId)`)

---

### **Story 18.3: Visualization Routing Matrix**
**Estimate:** 5-6 hours | **Priority:** 🔴 HIGH

Implement intelligent routing algorithm that matches module visualizations to appropriate WLED devices based on capabilities and priority.

**Deliverables:**
- `VisualizationRoutingMatrix` class
- Compatibility scoring algorithm
- Priority-based assignment
- Overlay detection and layering

**Acceptance Criteria:**
- Drum Machine + 6x25 Grid → `step-sequencer-grid` visualization
- Guitar Fretboard + 6x25 Grid → `fretboard-grid` visualization
- Piano Roll + 1D Strip → `piano-keys` fallback
- Audio Reactive → Overlays on all devices (additive)
- Unit tests for routing scenarios

---

### **Story 18.4: Context-Aware Routing Rules Engine**
**Estimate:** 4-5 hours | **Priority:** 🟡 MEDIUM

Build rule-based system for context-aware routing behaviors (active module detection, exclusive vs overlay modes, intelligent fallbacks).

**Deliverables:**
- `RoutingRule` interface
- Built-in rules:
  - Active Module Priority
  - Guitar Grid Exclusive
  - Drum Machine Grid Takeover
  - Audio Reactive Overlay
  - Piano Roll 1D Fallback
  - Generic Fallback
- Rule evaluation engine
- Rule priority system

**Acceptance Criteria:**
- Active module gets highest priority device
- Exclusive visualizations (Guitar/Drum) don't overlay
- Audio Reactive always overlays (never exclusive)
- Fallback rules apply when perfect match unavailable
- Rules evaluated in priority order

---

### **Story 18.5: WLED Manager UI (Unified Component)**
**Estimate:** 4-5 hours | **Priority:** 🟡 MEDIUM
**Status:** ⚠️ **PARTIALLY COMPLETE - CRITICAL ISSUE IDENTIFIED**

Create unified WLED Manager UI component for device registry management and real-time routing status display.

**Deliverables:**
- `WLEDManager` component (replaces WLEDDeviceManager)
- Device CRUD UI (add/edit/delete devices)
- Routing status display (which module → which device)
- Capability configuration UI (1D vs 2D, LED count, grid config)
- ViewTemplate-based layout

**Acceptance Criteria:**
- Add device with name, IP, LED count, capabilities
- Real-time routing status ("DrumMachine → Fretboard Grid (step-sequencer-grid)")
- Test connection button (HTTP `/json/info`)
- Visual preview of current routing assignments
- Mobile-responsive layout

**🔴 CRITICAL ISSUE (2025-10-19):**
Virtual preview implementation has poor visual rendering and data flow issues compared to working `/dj-visualizer` (LEDMatrixManager) implementation. Course correction needed.

**See:** `docs/issues/issue-wled-manager-virtual-preview-problems.md`

**⭐ STRATEGIC CONTEXT:**
This issue revealed a broader architectural need: consolidate all WLED implementations to one canonical pattern (LEDMatrixManager). Story 18.10 addresses the full consolidation strategy.

**See:** `docs/architecture/wled-implementation-consolidation.md`

---

### **Story 18.6: LEDCompositor Integration & Module Migration**
**Estimate:** 5-6 hours | **Priority:** 🟡 MEDIUM

Extend Epic 14 LEDCompositor with routing matrix integration and migrate first module (DrumMachine) to new system.

**Deliverables:**
- `LEDCompositor.registerModule()` API
- Auto-routing on `submitFrame()`
- Overlay blending algorithm
- DrumMachine migration (register capability, use compositor)
- Integration tests

**Acceptance Criteria:**
- DrumMachine registers capabilities on mount
- Frame submission triggers routing decision
- Overlays blend correctly (additive composition)
- Existing DrumMachine functionality unchanged
- No performance regression (<16ms frame time)

---

### **Story 18.7: Multi-Module Routing Testing & Documentation**
**Estimate:** 3-4 hours | **Priority:** 🟢 LOW

Comprehensive testing with multiple modules active simultaneously and complete documentation for developers.

**Deliverables:**
- Test scenarios:
  - Drum Machine + Audio Reactive (overlay)
  - Guitar + Drum Machine (device switching)
  - Piano Roll + Audio Reactive (1D strip fallback)
- Developer documentation (how to add module capabilities)
- Architecture diagram (Mermaid)
- Video demo (multi-module routing)

**Acceptance Criteria:**
- All test scenarios pass manual verification
- Documentation published to `/docs/architecture/`
- New module integration guide created
- Video demo showing automatic routing

---

### **Story 18.10: WLED Implementation Consolidation**
**Estimate:** 8-10 hours | **Priority:** 🟡 MEDIUM
**Prerequisites:** Story 18.5 (WLED Manager UI fixed)

**⭐ NEW STORY (2025-10-19)** - Consolidate all WLED implementations to one canonical pattern.

Deprecate legacy WLED implementations (WLEDDeviceManager) and migrate all modules to use the canonical LEDMatrixManager pattern. Ensures consistent 1:1 data flow (audio/visual input → virtual preview → physical device) across entire application.

**Deliverables:**
- Mark WLEDDeviceManager as `@deprecated` with migration guide
- Migrate GuitarFretboard to use LEDMatrixManager
- Create backward compatibility tests
- Extract LEDMatrixManager to shared utility
- Remove legacy WLED code (WLEDDeviceManager, WLEDDeviceCard)

**Acceptance Criteria:**
- All modules use canonical LEDMatrixManager pattern
- Virtual preview matches physical device output (1:1) in all views
- GuitarFretboard WLED output preserved (no breaking changes)
- Legacy code removed, no duplicate WLED logic
- Documentation updated (migration guide, architecture docs)

**Architecture Document:** [wled-implementation-consolidation.md](../architecture/wled-implementation-consolidation.md)

**Phases:**
- Phase 1: Fix Story 18.5 (prerequisite, see issue doc)
- Phase 2: Deprecate legacy implementations (2-3 hours)
- Phase 3: Migrate GuitarFretboard (3-4 hours)
- Phase 4: Unified WLED API, cleanup (3-4 hours)

**Rationale:** Discovered during Story 18.5 that multiple WLED implementations exist with varying quality. LEDMatrixManager (used in /dj-visualizer and /education) has perfect 1:1 data flow, while others have virtual preview issues. Consolidating to one pattern improves maintainability and user experience.

---

## Dependencies

### Epic Dependencies
- **Epic 14 (LEDCompositor)** - Extends compositor with routing
- **Epic 7 (Supabase Backend)** - Uses Supabase for device registry
- **Epic 17 (Remote WLED Control)** - Builds on WLED infrastructure

### Story Dependencies
- **18.0 → 18.1** - User authentication required for RLS policies
- **18.1 → 18.2** - Device registry before capability system
- **18.2 → 18.3** - Capabilities before routing matrix
- **18.3 → 18.4** - Routing matrix before rules engine
- **18.0, 18.1, 18.2, 18.3 → 18.5** - UI requires auth + all backend components
- **18.1-18.5 → 18.6** - Module migration requires full system
- **18.6 → 18.7** - Testing after migration
- **18.5 (fixed) → 18.10** - Consolidation requires working WLED Manager UI first

---

## Technical Approach

### Phase 0: Authentication Foundation (Story 18.0)
1. Enable Supabase Auth (Email/Password + Magic Link)
2. Create `user_profiles` table with RLS policies
3. Build `useAuth` hook and AuthModal component
4. Implement hybrid anonymous + authenticated system

### Phase 1: Backend Infrastructure (Stories 18.1-18.4)
1. Create Supabase `wled_devices` table (requires auth.uid())
2. Define TypeScript interfaces
3. Implement routing matrix algorithm
4. Build rules engine

### Phase 2: UI & Integration (Stories 18.5-18.6)
5. Build WLED Manager component
6. Extend LEDCompositor
7. Migrate DrumMachine module

### Phase 3: Testing & Documentation (Story 18.7)
8. Multi-module testing
9. Developer documentation
10. Video demo

---

## Impact on Story 17.3

**Story 17.3: Full Pattern Sync & LED Integration** requires Epic 18 implementation **first** for proper WLED Manager architecture.

**Updated Dependency:**
- ❌ **Old:** Story 17.3 uses simple `WLEDDeviceManager` (limited to hex color arrays)
- ✅ **New:** Story 17.3 blocked until Epic 18 Stories 18.0-18.6 complete (authentication + routing required)

**Rationale:**
- Story 17.3 goal: "Remote iPad controls local desktop WLED"
- Epic 18 Story 18.0 provides user authentication (required for RLS)
- Epic 18 Story 18.1 provides persistent device registry (Supabase)
- Without authentication, devices cannot be stored per-user
- Without routing, modules can't automatically visualize

**Recommendation:** Implement Epic 18 Stories 18.0-18.6 **before** Story 17.3

---

## Risks & Mitigation

### Risk: Routing Algorithm Complexity
**Impact:** HIGH
**Mitigation:**
- Start with simple priority-based matching
- Add complexity incrementally (overlays → rules → AI)
- Unit test each routing scenario

### Risk: Performance Degradation
**Impact:** MEDIUM
**Mitigation:**
- Cache routing decisions (recalculate only on module/device change)
- Profile frame generation pipeline
- Maintain 60 FPS target (16ms budget)

### Risk: Breaking Existing Modules
**Impact:** HIGH
**Mitigation:**
- Make registration opt-in (modules work without capabilities)
- Provide generic fallback (`generic-color-array`)
- Thorough integration testing

---

## Future Enhancements (Epic 19+)

### AI-Powered Routing
- Machine learning model learns user preferences
- "User always routes Piano Roll to Strip 1" → auto-suggest

### Advanced Overlays
- Custom blend modes (additive, multiply, screen)
- Per-device overlay toggles
- Overlay intensity controls

### Collaborative Device Registry
- Shared device pools in jam sessions
- Device borrowing/lending between participants
- Multi-user conflict resolution

### Hardware Auto-Discovery
- mDNS/Bonjour detection of WLED devices on network
- One-click device setup (no manual IP entry)
- Firmware version detection and compatibility warnings

---

## Success Metrics

### User Metrics
- **Device Configuration Time:** <2 minutes (one-time setup)
- **Module Switch Time:** <1 second (automatic routing)
- **User Satisfaction:** >90% (post-Epic survey)

### Technical Metrics
- **Routing Decision Latency:** <10ms (imperceptible)
- **Device Sync Latency:** <200ms (Supabase Realtime)
- **Frame Generation:** <16ms (60 FPS maintained)
- **Test Coverage:** >80% (routing matrix + rules engine)

---

## Timeline Estimate

**Total Effort (Core):** 32-41 hours (Stories 18.0-18.7)
**Total Effort (With Consolidation):** 40-51 hours (includes Story 18.10)

**Week 1:** Story 18.0 + Stories 18.1-18.3 (Auth + Backend Infrastructure)
**Week 2:** Stories 18.4-18.6 (Rules Engine + UI & Integration)
**Week 3:** Story 18.7 (Testing & Documentation)
**Week 4:** Story 18.10 (WLED Implementation Consolidation)

**Target Completion:** 4 weeks from start

**Story Breakdown:**
- Story 18.0: 4-6 hours (User Authentication MVP)
- Story 18.1: 4-5 hours (WLED Device Registry)
- Story 18.2: 3-4 hours (Module Capability Declaration)
- Story 18.3: 5-6 hours (Visualization Routing Matrix)
- Story 18.4: 4-5 hours (Rules Engine)
- Story 18.5: 4-5 hours (WLED Manager UI) + fix time (2-3 hours)
- Story 18.6: 5-6 hours (LEDCompositor Integration)
- Story 18.7: 3-4 hours (Testing & Documentation)
- Story 18.10: 8-10 hours (WLED Implementation Consolidation) - **NEW**

---

## Related Documents

- **Architecture:** [wled-visualization-routing.md](../architecture/wled-visualization-routing.md)
- **Epic 14:** Module Adapter System (LEDCompositor foundation)
- **Epic 17:** Remote WLED Control via Jam Sessions (prerequisite)
- **Story 17.3:** Full Pattern Sync & LED Integration (blocked by Epic 18)

---

**Epic Owner Approval:**
- [x] Architecture approved (Winston)
- [x] Stories validated (Sarah)
- [ ] Dev team capacity confirmed
- [ ] Stakeholder buy-in

**Next Steps:**
1. ✅ Update Story 17.3 to mark Epic 18 as dependency (COMPLETE)
2. ✅ Create Story 18.0 (User Authentication MVP) - COMPLETE
3. Create Story 18.1 in `/docs/stories/` - PENDING
4. Sequence remaining stories (18.2-18.7)
5. Assign to dev team for estimation review
