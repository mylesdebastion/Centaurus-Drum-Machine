# Epic 8: Launchpad Pro Hardware Integration

**Epic ID:** 8
**Status:** 📝 PLANNING
**Priority:** High
**Estimated Effort:** 11-16 hours (4 stories: 1 prerequisite + 3 implementation)
**Target Sprint:** TBD
**Type:** Brownfield Enhancement
**Critical Prerequisite:** Story 8.0 must be completed first (blocks all other stories)

---

## Epic Goal

Enable Novation Launchpad Pro (Mk3 and 2015 models) as hardware controllers for the Audiolux App, providing users with a larger 8×8 RGB grid, full velocity sensitivity, and enhanced control capabilities compared to the existing APC40 implementation.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- Drum sequencer with 8-step patterns and 5 tracks
- Isometric note lanes with progressive reveal
- APC40 hardware controller support via Web MIDI API
- Queue-based LED update system with color mapping (spectrum/chromatic/harmonic modes)
- Hardware controller abstraction with proven connection management patterns

**Technology Stack:**
- React + TypeScript
- Web MIDI API (Chrome/Edge/Opera)
- Vite build system
- Existing `HardwareController` pattern (from APC40 implementation)

**Integration Points:**
- `/src/lib/controllers/` - Hardware controller classes
- Drum sequencer modules - LED visualization and button input
- Isometric note visualization - Grid mapping and color rendering
- Web MIDI connection management - Device detection and initialization

### Enhancement Details

**What's Being Added:**

1. **Launchpad Pro Controller Support:**
   - Novation Launchpad Pro Mk3 (USB-C, 2020+ model) - PRIMARY
   - Novation Launchpad Pro 2015 (original model) - SECONDARY
   - 8×8 RGB grid (64 pads vs. APC40's 40 pads = 60% larger workspace)
   - Full RGB color control (262,144 colors vs. APC40's ~8 basic colors)
   - Velocity-sensitive pads (0-127 dynamic input)
   - Polyphonic aftertouch (pressure-sensitive performance)

2. **Enhanced Features:**
   - Horizontal/vertical layout orientation toggle
   - Larger grid enables 8-track drum sequencer (vs. current 5-track limitation)
   - Superior color mapping for educational visualization
   - More control buttons for navigation and mode switching

**How It Integrates:**

- **Extends existing `HardwareController` interface** (non-breaking abstraction)
- **Shares APC40 patterns:** Queue-based LED updates, color mapping utilities, Web MIDI connection
- **Device-specific implementations:** `LaunchpadProController` class with Mk3/2015 protocol support
- **Backwards compatible:** APC40 functionality remains unchanged

**Success Criteria:**

✅ Launchpad Pro Mk3 and 2015 models connect and initialize via Web MIDI API
✅ 8×8 grid displays drum sequencer patterns with full RGB color accuracy
✅ Button presses trigger note input with velocity sensitivity
✅ LED update performance achieves 60fps visualization target (1200+ LEDs/sec)
✅ Horizontal/vertical layout orientation toggles smoothly
✅ Existing APC40 controller remains fully functional (no regressions)
✅ Browser compatibility maintained (Chrome/Edge/Opera)

---

## Stories

### Story 8.0: Hardware Controller Selection Infrastructure (PREREQUISITE)

**Title:** Refactor hardcoded APC40 controller to dynamic multi-controller selection system

**Brief Description:**
Transform the hardcoded `new APC40Controller()` instantiation in IsometricSequencer into a dynamic controller selection system using the existing HardwareManager abstraction. Creates a Controller Registry with factory pattern, React hook for controller switching, and UI dropdown for selection. Enables zero-modification integration for Launchpad Pro (Story 8.1) and future controllers (Epic 11: ROLI LUMI).

**Key Tasks:**
- Create `ControllerRegistry.ts` with factory pattern for all controller types
- Implement `useControllerSelection()` hook with localStorage persistence
- Build `HardwareControllerSelector.tsx` UI component (dropdown with connection status)
- Refactor `IsometricSequencer.tsx` to use HardwareManager instead of direct instantiation
- Add controller selector to IsometricSequencer settings panel
- Regression test APC40 functionality (verify no breaking changes)

**Acceptance Criteria:**
- ✅ Controller registry lists all controller types (APC40 available, Launchpad/ROLI disabled)
- ✅ Dropdown UI allows switching between controllers
- ✅ Selection persists across browser sessions (localStorage)
- ✅ IsometricSequencer uses HardwareManager abstraction (no direct `new APC40Controller()`)
- ✅ APC40 connects and functions identically to before refactoring (no regressions)
- ✅ Story 8.1 can add LaunchpadProController by setting `available: true` in registry

**Status:** 📝 Planning
**Estimated Effort:** 3-4 hours
**Document:** [Story 8.0 - Hardware Controller Selection Infrastructure](../stories/8.0-hardware-controller-selection-infrastructure.md)

**Critical:** This story MUST be completed before Stories 8.1-8.3. Without it, Launchpad Pro integration requires editing IsometricSequencer code, defeating the purpose of the HardwareController abstraction.

---

### Story 8.1: LaunchpadProController Implementation

**Title:** Implement LaunchpadProController class with Web MIDI integration and RGB LED control

**Brief Description:**
Create the core `LaunchpadProController` TypeScript class that handles device connection, SysEx initialization (Mk3 and 2015 protocols), RGB LED control (velocity palette + RGB SysEx methods), and button input handling (velocity-sensitive pads + polyphonic aftertouch). Includes device detection, queue-based LED updates, and connection management.

**Key Tasks:**
- Implement device detection via Web MIDI API (identify Mk3 vs. 2015 models)
- SysEx initialization sequences for both hardware versions
- RGB LED control methods (velocity palette + RGB SysEx with 0-63 range)
- Button input event handling (Note On/Off, velocity, aftertouch)
- LED update queue with batching and throttling (16 LEDs per 5ms batch)

**Acceptance Criteria:**
- Connects to Launchpad Pro Mk3 and 2015 models
- Initializes device into Programmer Mode via correct SysEx
- Sets individual LED colors using RGB SysEx (0-63 per channel)
- Receives button press/release events with velocity values
- Queue processes LED updates without MIDI buffer overflow

---

### Story 8.2: Drum Sequencer Integration & Layout Orientation

**Title:** Integrate LaunchpadProController with drum sequencer and implement horizontal/vertical layout toggle

**Brief Description:**
Connect the new `LaunchpadProController` to the existing drum sequencer module, mapping the 8×8 grid to sequencer patterns (horizontal: 8 steps × 8 tracks, vertical: 8 pitches × 8 time steps). Implement color mapping utilities (spectrum/chromatic/harmonic modes adapted from APC40). Add layout orientation toggle controlled via top control button.

**Key Tasks:**
- Map 8×8 grid note numbers (0-119) to sequencer step positions
- Implement horizontal layout mapping (timeline left-to-right)
- Implement vertical layout mapping (timeline bottom-to-top)
- Adapt color mapping utilities (spectrum/chromatic/harmonic) to Launchpad RGB
- Create `LayoutManager` class for orientation switching
- Add button control for layout toggle (top row control button)

**Acceptance Criteria:**
- Drum sequencer patterns display correctly on 8×8 grid
- Note input from Launchpad pads updates sequencer patterns
- Velocity sensitivity controls note accent/brightness
- Horizontal layout maps correctly (columns = steps, rows = tracks)
- Vertical layout maps correctly (rows = pitches, columns = time)
- Layout toggle button switches orientation and refreshes grid LEDs
- Colors match intended spectrum/chromatic/harmonic modes

---

### Story 8.3: Performance Optimization & Multi-Device Testing

**Title:** Optimize LED update performance and validate cross-device compatibility (Mk3/2015/APC40)

**Brief Description:**
Benchmark LED update throughput, implement delta updates (only changed LEDs), and optimize batching strategy to achieve 60fps target. Test with both Launchpad Pro Mk3 and 2015 hardware to validate protocol compatibility. Ensure APC40 integration remains functional (regression testing). Create hardware integration documentation.

**Key Tasks:**
- Benchmark LED update rate (measure LEDs/second throughput)
- Implement delta update tracking (cache LED states, skip redundant updates)
- Optimize batch size and throttling interval (target: 1200+ LEDs/sec)
- Test with Launchpad Pro Mk3 hardware (SysEx `0x0E` protocol)
- Test with Launchpad Pro 2015 hardware (SysEx `0x10` protocol)
- Regression test APC40 functionality (ensure no breaking changes)
- Document hardware setup, troubleshooting, and browser compatibility

**Acceptance Criteria:**
- Full grid updates (64 LEDs) achieve 60fps smoothness (no jitter)
- LED update throughput measured at 1200+ LEDs/second
- Delta updates reduce unnecessary MIDI messages by 50%+
- Launchpad Pro Mk3 initializes and operates correctly
- Launchpad Pro 2015 initializes and operates correctly (if available)
- APC40 functionality verified unchanged (existing tests pass)
- Hardware integration guide created in `/docs/hardware-integration/launchpad-pro.md`

---

## Compatibility Requirements

### Existing APIs Remain Unchanged
- ✅ `HardwareController` interface extended, not modified
- ✅ APC40 controller implementation untouched
- ✅ Existing drum sequencer and isometric modules use same interface
- ✅ Web MIDI connection management follows established patterns

### Database Schema Changes
- ✅ N/A - No database in this project

### UI Changes Follow Existing Patterns
- ✅ Hardware controller selection UI uses existing dropdown pattern
- ✅ Layout orientation toggle uses existing button mapping pattern
- ✅ Color modes (spectrum/chromatic/harmonic) reuse APC40 implementation
- ✅ Consistent with existing component styling (Tailwind CSS)

### Performance Impact Minimal
- ✅ LED updates optimized with queue batching (no performance regression)
- ✅ Device detection runs only on connection (one-time overhead)
- ✅ Memory footprint similar to APC40 controller (LED state cache)
- ✅ No impact on audio/MIDI playback timing

---

## Risk Mitigation

### Primary Risk: RGB Color Conversion Errors

**Risk Description:**
Launchpad Pro uses **0-63 RGB range** (not standard 0-255). Incorrect conversion leads to saturated/wrong colors, degrading educational visualization quality.

**Mitigation:**
- Create `toLaunchpadRGB()` utility function with range clamping
- Unit tests for color conversion edge cases (0, 127, 255 inputs)
- Visual testing with known color palette from research findings
- Code review checklist includes RGB range verification

**Likelihood:** Medium
**Impact:** Medium
**Mitigation Effectiveness:** High

### Secondary Risk: Browser Compatibility Issues

**Risk Description:**
Web MIDI API not supported in Firefox (experimental flag required) or Safari (no support). Users may attempt to use unsupported browsers.

**Mitigation:**
- Feature detection with user-friendly error message
- Documentation explicitly recommends Chrome/Edge/Opera
- Graceful fallback UI explaining browser requirements
- Browser compatibility noted in README and setup guide

**Likelihood:** Low (most users use Chrome/Edge)
**Impact:** Low (alternative browsers readily available)
**Mitigation Effectiveness:** High

### Tertiary Risk: Device Detection with Multiple Launchpads

**Risk Description:**
User may have multiple Launchpad devices connected (Mk3 + Mini, etc.), causing ambiguous device selection.

**Mitigation:**
- Device selection dropdown UI (list all detected Launchpads)
- Auto-detect and prefer Launchpad Pro Mk3 over other models
- Save user's device preference to `localStorage`
- Clear visual feedback of which device is connected

**Likelihood:** Low
**Impact:** Low (user can manually select)
**Mitigation Effectiveness:** High

### Rollback Plan

**If integration causes issues:**

1. **Immediate Rollback (Code Level):**
   - Remove `LaunchpadProController` class from codebase
   - Remove Launchpad option from hardware selector UI
   - APC40 functionality remains unaffected (isolated implementation)
   - Revert via Git: `git revert <commit-hash>` (clean rollback)

2. **Partial Rollback (Feature Flag):**
   - Add `ENABLE_LAUNCHPAD_PRO` environment variable
   - Hide Launchpad option in UI when flag is false
   - Keep code in place for future debugging/fixes

3. **User Communication:**
   - Update documentation to note APC40 as recommended controller
   - Provide troubleshooting guide for users experiencing issues
   - Gather user feedback to prioritize bug fixes

**Rollback Feasibility:** HIGH (additive feature, no dependencies)

---

## Definition of Done

### All Stories Completed with Acceptance Criteria Met
- [ ] Story 8.0: Hardware Controller Selection Infrastructure complete (PREREQUISITE)
  - [ ] ControllerRegistry.ts created with all controller types
  - [ ] HardwareControllerSelector.tsx UI component working
  - [ ] IsometricSequencer refactored to use HardwareManager
  - [ ] APC40 regression testing passed (no functionality lost)
- [ ] Story 8.1: `LaunchpadProController` class implemented and tested
- [ ] Story 8.2: Drum sequencer integration and layout toggle working
- [ ] Story 8.3: Performance optimized and multi-device testing complete

### Existing Functionality Verified Through Testing
- [ ] APC40 controller connects and operates without regression
- [ ] Drum sequencer patterns display correctly on APC40 (unchanged)
- [ ] Existing color mapping modes work on APC40 (unchanged)
- [ ] No performance degradation in LED updates or MIDI timing

### Integration Points Working Correctly
- [ ] Launchpad Pro Mk3 connects via Web MIDI API
- [ ] Launchpad Pro 2015 connects and operates (if available for testing)
- [ ] Drum sequencer receives button input from Launchpad pads
- [ ] Isometric note lanes can use Launchpad grid (future integration verified)
- [ ] Layout orientation toggle switches grid mapping correctly

### Documentation Updated Appropriately
- [ ] Hardware integration guide created: `/docs/hardware-integration/launchpad-pro.md`
- [ ] README updated with Launchpad Pro support information
- [ ] Browser compatibility documented (Chrome/Edge/Opera recommended)
- [ ] Setup instructions include Launchpad connection steps
- [ ] Troubleshooting section covers common issues (device detection, color accuracy)

### No Regression in Existing Features
- [ ] APC40 drum sequencer functionality verified unchanged
- [ ] Web MIDI connection management works for both controllers
- [ ] Color mapping utilities produce correct output for APC40
- [ ] Performance benchmarks match or exceed pre-integration baseline

---

## Technical Context from Research

### MIDI Protocol Specifications

**Launchpad Pro Mk3:**
- **SysEx Header:** `F0 00 20 29 02 0E`
- **Programmer Mode Init:** `F0 00 20 29 02 0E 0E 01 F7`
- **RGB LED Control:** `F0 00 20 29 02 0E 0B [note] [R 0-63] [G 0-63] [B 0-63] F7`
- **Grid Note Range:** 0-119 (16-note row increments, non-contiguous)

**Launchpad Pro 2015:**
- **SysEx Header:** `F0 00 20 29 02 10`
- **Programmer Mode Init:** `F0 00 20 29 02 10 0E 01 F7`
- **Protocol Compatibility:** Legacy Mode in Mk3 provides backward compatibility

**Device Detection (Web MIDI API):**
- **Mk3 Device Name:** `"Launchpad Pro MK3"` or `"LPProMK3 MIDI"`
- **2015 Device Name:** `"Launchpad Pro"` (without "MK3")

### Performance Targets

**LED Update Benchmarks:**
- **Target:** 60fps (16.67ms per frame)
- **Full Grid (64 LEDs):** 3840 LEDs/sec required for 60fps
- **Batched RGB SysEx:** ~1200 LEDs/sec achievable (adequate for use case)
- **Optimization Strategy:** Delta updates (only changed LEDs) + 16 LED batches per 5ms

**Latency Expectations:**
- **Button Input:** 10-20ms (physical press → JavaScript event)
- **LED Update:** 10-15ms (JavaScript → LED change)
- **Total Responsiveness:** Imperceptible to users (<30ms round-trip)

---

## Dependencies

### External Dependencies
- Web MIDI API (browser support: Chrome 43+, Edge 79+, Opera 33+)
- Physical hardware: Launchpad Pro Mk3 (PRIMARY) and/or 2015 model (SECONDARY)

### Internal Dependencies
- **🔥 CRITICAL:** Story 8.0 - Hardware Controller Selection Infrastructure (MUST complete first)
- Existing `HardwareController` interface (from APC40 implementation)
- Web MIDI connection management utilities
- Color mapping utilities (spectrum/chromatic/harmonic modes)
- Drum sequencer module integration points

### Blocking Dependency: Story 8.0
- ⚠️ **Story 8.0 MUST be completed before Stories 8.1-8.3 can begin**
- Story 8.0 refactors hardcoded `new APC40Controller()` into dynamic controller selection
- Without Story 8.0, LaunchpadProController integration requires editing IsometricSequencer code
- Story 8.0 creates ControllerRegistry, enabling simple `available: true` toggle to activate Launchpad Pro

### Other Prerequisites
- ✅ All other prerequisites exist in current codebase
- ✅ Research findings provide complete protocol specifications
- ✅ Open-source reference implementations available for validation

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing music education application (Audiolux/Centaurus Drum Machine) running **React + TypeScript + Web MIDI API**
- **Integration points:**
  - `/src/lib/controllers/` - Hardware controller abstraction layer
  - Drum sequencer modules - LED visualization and button input handling
  - Isometric note lanes - Grid mapping and color rendering
  - Web MIDI connection management - Device detection and initialization
- **Existing patterns to follow:**
  - Queue-based LED updates with batching and throttling (from APC40 implementation)
  - Color mapping utilities (spectrum/chromatic/harmonic modes)
  - `HardwareController` interface for device abstraction
  - Web MIDI API connection lifecycle (detect, initialize, disconnect)
- **Critical compatibility requirements:**
  - Extend `HardwareController` interface without breaking APC40 implementation
  - Maintain existing APC40 functionality (regression testing required)
  - Support both Launchpad Pro Mk3 and 2015 protocols (different SysEx headers)
  - RGB color conversion must use 0-63 range (not standard 0-255)
  - Browser compatibility: Chrome/Edge/Opera only (Web MIDI API limitation)
- **Each story must include verification that existing functionality remains intact:**
  - APC40 controller connects and operates without regression
  - Drum sequencer patterns display correctly on APC40
  - Color mapping utilities produce correct output for APC40
  - No performance degradation in LED updates or MIDI timing

The epic should maintain system integrity while delivering **Launchpad Pro hardware controller support with 8×8 RGB grid, velocity sensitivity, and horizontal/vertical layout orientation for enhanced educational visualization and drum sequencing.**

**Reference Documentation:**
- **Story 8.0:** `/docs/stories/8.0-hardware-controller-selection-infrastructure.md` (PREREQUISITE - complete first)
- Research findings: `/research/launchpad-pro-integration-findings.md` (comprehensive MIDI protocol, code scaffolding, performance benchmarks)
- Research prompt: `/research/launchpad-pro-integration-research-prompt.md` (detailed requirements and success criteria)

**Estimated Effort:** 11-16 hours total
- Story 8.0 (PREREQUISITE): 3-4 hours
- Story 8.1: 3-5 hours
- Story 8.2: 2-3 hours
- Story 8.3: 2-3 hours
- Documentation: 1 hour

**Priority:** HIGH - First user story for drum sequencing and isometric lanes hardware integration.

**CRITICAL PREREQUISITE:** Story 8.0 must be completed first to enable dynamic controller selection (otherwise Launchpad Pro requires hardcoding into IsometricSequencer)."

---

## Validation Checklist

### Scope Validation
- ✅ Epic can be completed in 1-3 stories maximum (3 stories defined)
- ✅ No architectural documentation is required (extends existing patterns)
- ✅ Enhancement follows existing patterns (`HardwareController` abstraction, Web MIDI API)
- ✅ Integration complexity is manageable (proven APC40 pattern + comprehensive research)

### Risk Assessment
- ✅ Risk to existing system is low (additive feature, APC40 untouched)
- ✅ Rollback plan is feasible (Git revert, feature flag option)
- ✅ Testing approach covers existing functionality (APC40 regression testing)
- ✅ Team has sufficient knowledge of integration points (research findings provide complete specifications)

### Completeness Check
- ✅ Epic goal is clear and achievable (Launchpad Pro hardware support)
- ✅ Stories are properly scoped (3 focused stories, 8-12h total estimate)
- ✅ Success criteria are measurable (connection, LED accuracy, performance benchmarks)
- ✅ Dependencies are identified (Web MIDI API, hardware availability)

---

**Epic Status:** Draft → Ready for Story Manager
**Next Step:** Story Manager develops detailed user stories with tasks, subtasks, and acceptance criteria
**Hardware Availability:** ✅ Launchpad Pro Mk3 (USB-C) + Launchpad Pro 2015 (developer has both devices for testing)
