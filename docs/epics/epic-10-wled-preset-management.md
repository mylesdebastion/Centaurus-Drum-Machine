# Epic 10: WLED Preset Management

**Epic ID:** 10
**Status:** 📝 PLANNING
**Priority:** High
**Estimated Effort:** 6-10 hours (1 story currently defined)
**Target Sprint:** TBD
**Type:** Brownfield Enhancement

---

## Epic Goal

Enable users to save, manage, and quickly load WLED device configurations as named presets, dramatically reducing setup time for recurring hardware configurations (guitar rigs, drum kits, full band setups) from 3-5 minutes of manual configuration down to <15 seconds of preset selection.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- WLEDDeviceManager component manages multiple WLED devices (Story 6.1 Phase 0)
- Inline expandable settings pattern established
- localStorage auto-save per experiment (`storageKey` prop)
- Each experiment (`/jam`, `/wled-test`, `/dj-visualizer`) maintains separate device list
- Manual IP address and LED count configuration required for each device
- No named presets or quick switching between configurations

**Technology Stack:**
- React + TypeScript
- localStorage for persistence
- Web MIDI API and WebSocket connections to WLED devices
- Tailwind CSS + shadcn/ui components
- Existing inline UI patterns (no modals/overlays per UX_STANDARDS.md)

**Integration Points:**
- `WLEDDeviceManager` component - Device list management
- `/jam` view - Settings tab integration
- localStorage services - Preset persistence
- Toast notification system - User feedback

### Enhancement Details

**What's Being Added:**

1. **Local Preset Save/Load (Story 10.1):**
   - Inline preset save form (no modals)
   - Preset dropdown with quick selection
   - Unsaved changes detection with visual indicator
   - Non-blocking undo pattern for preset loading
   - Toast notifications for all user feedback
   - localStorage persistence across browser sessions

2. **Future Capabilities (Planned Stories):**
   - Preset import/export functionality
   - Cloud-synced presets (Supabase integration)
   - Preset sharing between users
   - Advanced management (tags, categories, search)

**How It Integrates:**

- **Extends WLEDDeviceManager** with preset controls at top of component
- **Follows UX_STANDARDS.md anti-modal philosophy:** Inline forms, toast notifications, undo patterns
- **Integrates into `/jam` Settings tab:** No navigation required, context preserved
- **localStorage-first approach:** Rapid development, cloud migration path later

**Success Criteria:**

✅ Users can save current device configuration as named preset in <3 clicks
✅ Loading preset restores all devices in <15 seconds (vs 3-5 minutes manual setup)
✅ Inline UI patterns (no modals) maintain design system consistency
✅ Unsaved changes detection prevents accidental data loss
✅ Toast notifications provide clear feedback without blocking interactions
✅ Presets persist across browser sessions (localStorage)
✅ Mobile UX compliant (44px touch targets, safe-area-inset aware)

---

## Stories

### Story 10.1: Local Preset Save/Load (Inline UI - No Modals)

**Title:** Implement local preset save/load with inline UI patterns and localStorage persistence

**Brief Description:**
Enable users to save their current WLED device configurations as named presets and quickly load them later, using inline UI patterns (no modals/overlays) and localStorage for initial implementation. This provides the foundation for cloud-synced presets while allowing rapid UX iteration without database complexity.

**Key Tasks:**
- Implement inline preset save form (expandable, auto-focused input)
- Create preset dropdown with device count and last modified time
- Add unsaved changes detection with "(modified)" indicator
- Implement non-blocking undo toast for preset loading
- Build preset management panel (rename, duplicate, delete inline)
- Add toast notification system for all user feedback
- Integrate into `/jam` Settings tab

**Acceptance Criteria:**
- Inline save form expands/collapses without modal
- Preset dropdown shows sorted presets (newest first)
- Unsaved changes indicator appears when devices modified
- Loading preset shows undo toast (5 second auto-dismiss)
- Management panel allows inline rename/duplicate/delete
- All touch targets ≥44px (mobile compliance)
- Presets persist across browser sessions

**Status:** 📝 Planning

---

### Future Stories (To Be Defined)

**Potential Story 10.2:** Preset Import/Export
- Export presets as JSON files
- Import presets from JSON files
- Backup/restore functionality

**Potential Story 10.3:** Cloud Sync with Supabase
- Migrate from localStorage to Supabase
- Real-time sync across devices
- User authentication integration
- Conflict resolution strategy

**Potential Story 10.4:** Advanced Preset Management
- Tags and categories
- Search and filtering
- Preset templates and recommendations
- Usage analytics

---

## Compatibility Requirements

### Existing APIs Remain Unchanged
- ✅ WLEDDeviceManager interface extended, not modified
- ✅ Existing localStorage services (`storageKey` prop) untouched
- ✅ `/jam` view layout and navigation unchanged
- ✅ WebSocket connection management follows established patterns

### Database Schema Changes
- ✅ N/A for Story 10.1 (localStorage only)
- ⏳ Future: Supabase schema required for Story 10.3 (cloud sync)

### UI Changes Follow Existing Patterns
- ✅ Inline expandable forms (established in WLEDDeviceManager)
- ✅ Toast notifications (follows UX_STANDARDS.md)
- ✅ Preset dropdown uses custom dropdown pattern (not native `<select>`)
- ✅ Consistent with existing component styling (Tailwind CSS)
- ✅ 44px touch targets (Story 5.1 responsive compliance)

### Performance Impact Minimal
- ✅ localStorage operations <50ms (no UI blocking)
- ✅ Preset load time <200ms (parse and apply devices)
- ✅ No impact on WebSocket connection performance
- ✅ Toast animations <150ms (Tailwind transitions)

---

## Risk Mitigation

### Primary Risk: localStorage Quota Exceeded

**Risk Description:**
Browser localStorage limits vary (5-10MB typical). Users with many large presets may exceed quota, causing save failures.

**Mitigation:**
- Implement quota detection before save
- Show error toast with export suggestion: "⚠️ Storage limit reached. [Export Presets]"
- Encourage users to export/backup presets regularly
- Design for migration to cloud storage (Story 10.3)

**Likelihood:** Low (typical preset ~1KB, 5MB = 5000 presets)
**Impact:** Medium (save failures frustrating for users)
**Mitigation Effectiveness:** High

### Secondary Risk: Browser Data Clearing

**Risk Description:**
Users may clear browser data, losing all saved presets. No backup/recovery mechanism in Story 10.1.

**Mitigation:**
- Educate users about export functionality (Story 10.2)
- Add prominent "Export All Presets" button in management panel
- Show toast reminder after saving 5th preset: "💡 Tip: Export presets to back up your configurations"
- Design for cloud sync (Story 10.3) as long-term solution

**Likelihood:** Medium (users clear data for various reasons)
**Impact:** High (complete data loss)
**Mitigation Effectiveness:** Medium (education-based)

### Tertiary Risk: Preset Name Conflicts

**Risk Description:**
User attempts to save preset with duplicate name, causing confusion or accidental overwrites.

**Mitigation:**
- Inline validation in save form: "⚠️ Preset 'Guitar Setup' already exists"
- Disable save button when duplicate detected
- Auto-suggest name: "Guitar Setup 2", "Guitar Setup 3", etc.
- Allow intentional overwrite with explicit confirmation toast

**Likelihood:** Medium
**Impact:** Low (UI prevents accidental overwrites)
**Mitigation Effectiveness:** High

### Rollback Plan

**If preset feature causes issues:**

1. **Immediate Rollback (Code Level):**
   - Remove preset UI from WLEDDeviceManager
   - Revert to auto-save only (existing behavior)
   - localStorage data remains intact (no data loss)
   - Revert via Git: `git revert <commit-hash>`

2. **Partial Rollback (Feature Flag):**
   - Add `ENABLE_WLED_PRESETS` environment variable
   - Hide preset controls when flag is false
   - Keep code in place for debugging/fixes

3. **User Communication:**
   - Inform users of temporary feature removal
   - Provide export instructions if data migration needed
   - Gather feedback to prioritize bug fixes

**Rollback Feasibility:** HIGH (additive feature, no breaking changes)

---

## Definition of Done

### All Stories Completed with Acceptance Criteria Met
- [ ] Story 10.1: Local preset save/load implemented and tested
- [ ] Story 10.2: Import/export functionality (future)
- [ ] Story 10.3: Cloud sync with Supabase (future)

### Existing Functionality Verified Through Testing
- [ ] WLEDDeviceManager auto-save still works per experiment
- [ ] Device connections unaffected by preset operations
- [ ] WebSocket performance maintained (60 FPS LED updates)
- [ ] No regressions in `/jam` Settings tab layout

### Integration Points Working Correctly
- [ ] Preset controls appear at top of WLEDDeviceManager
- [ ] Inline save form expands/collapses smoothly
- [ ] Preset dropdown loads and displays presets correctly
- [ ] Toast notifications appear in safe-area (mobile)
- [ ] Unsaved changes indicator updates reactively

### Documentation Updated Appropriately
- [ ] UX_STANDARDS.md: Toast notification patterns documented
- [ ] Story 10.1: Implementation notes and lessons learned
- [ ] README: Preset feature usage instructions
- [ ] Troubleshooting: localStorage quota exceeded handling

### No Regression in Existing Features
- [ ] `/jam` view loads without errors
- [ ] Settings tab remains functional on mobile and desktop
- [ ] Device auto-save per experiment works unchanged
- [ ] Responsive layout (Story 5.1) compliance verified

---

## Technical Context

### localStorage Schema

**Preset Storage Key:** `wled-presets-v1` (global across all experiments)

**Preset Data Model:**
```typescript
interface WLEDPreset {
  id: string; // UUID
  name: string; // User-provided name (max 50 chars)
  description?: string; // Optional description (max 200 chars)
  devices: WLEDDevice[]; // Array of device configurations
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  version: number; // Schema version for future migrations
}

interface WLEDDevice {
  id: string; // UUID
  name: string; // User-provided name
  ipAddress: string; // IP address or hostname
  ledCount: number; // Number of LEDs
  type: 'strip' | 'matrix'; // Device type
  dimensions?: { width: number; height: number }; // For matrix
  isConnected?: boolean; // Runtime status (not persisted)
}
```

**Storage Operations:**
- `savePreset(preset: WLEDPreset): void` - Add or update preset
- `loadPreset(id: string): WLEDPreset | null` - Get preset by ID
- `deletePreset(id: string): void` - Remove preset
- `listPresets(): WLEDPreset[]` - Get all presets sorted by `updatedAt` DESC

### Performance Targets

**Preset Operations:**
- **Save:** <50ms to localStorage
- **Load:** <200ms to parse and apply devices
- **List:** <100ms for up to 50 presets
- **Delete:** <50ms with undo toast

**UI Animations:**
- **Form expand/collapse:** <150ms (Tailwind transition)
- **Dropdown open/close:** <100ms
- **Toast fade in/out:** <150ms

**Device Connection:**
- **Preset load → devices connected:** <15 seconds for 5 devices
- **WebSocket handshake:** 500-1000ms per device (parallel)

---

## Dependencies

### External Dependencies
- localStorage API (all modern browsers support)
- Existing toast notification system (or create in Story 10.1)
- WLEDDeviceManager component (Story 6.1 Phase 0)

### Internal Dependencies
- UX_STANDARDS.md: Anti-modal design philosophy
- Story 5.1: Responsive architecture patterns
- Story 6.1 Phase 0: WLEDDeviceManager inline UI

### No Blocking Dependencies
- ✅ All prerequisites exist in current codebase
- ✅ localStorage API widely supported (IE8+)
- ✅ No external API or database required for Story 10.1

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing music education application (Audiolux/Centaurus Drum Machine) running **React + TypeScript**
- **Integration points:**
  - WLEDDeviceManager component - Preset controls integrated at top
  - `/jam` view Settings tab - Primary user entry point
  - localStorage services - Preset persistence layer
  - Toast notification system - User feedback mechanism
- **Existing patterns to follow:**
  - Inline expandable forms (no modals/overlays per UX_STANDARDS.md)
  - Toast notifications for all user feedback
  - Non-blocking undo pattern (Gmail-style)
  - Custom dropdowns (not native `<select>`)
  - 44px minimum touch targets (Story 5.1 responsive compliance)
- **Critical compatibility requirements:**
  - Extend WLEDDeviceManager without breaking existing auto-save
  - Maintain WebSocket connection performance during preset operations
  - No modals/overlays/blocking dialogs (anti-modal philosophy)
  - Mobile-first responsive design with safe-area-inset
- **Each story must include verification that existing functionality remains intact:**
  - WLEDDeviceManager auto-save per experiment works unchanged
  - Device connections and LED visualization unaffected
  - `/jam` view Settings tab layout responsive on mobile and desktop

The epic should maintain system integrity while delivering **rapid preset save/load functionality with inline UI patterns and localStorage persistence as foundation for future cloud sync.**

**Reference Documentation:**
- Story 10.1: Complete implementation specification (~1200 lines)
- UX_STANDARDS.md: Anti-modal design philosophy
- Story 6.1 Phase 0: WLEDDeviceManager component patterns

**Estimated Effort:** 6-10 hours total (Story 10.1: 6-10h, Future stories TBD)

**Priority:** HIGH - Reduces setup time from 3-5 minutes to <15 seconds for recurring hardware configurations."

---

## Validation Checklist

### Scope Validation
- ✅ Epic can start with 1 story (Story 10.1 is comprehensive and independently valuable)
- ✅ No architectural documentation required (extends existing patterns)
- ✅ Enhancement follows established patterns (inline UI, toast notifications)
- ✅ Implementation complexity manageable (localStorage-first approach)

### Risk Assessment
- ✅ Risk to existing system is low (additive feature, WLEDDeviceManager extended)
- ✅ Rollback plan is feasible (Git revert, feature flag option)
- ✅ Testing approach covers existing functionality (WebSocket, auto-save verification)
- ✅ Team has sufficient knowledge of integration points (WLEDDeviceManager already exists)

### Completeness Check
- ✅ Epic goal is clear and achievable (preset save/load functionality)
- ✅ Story 10.1 is properly scoped (6-10h estimate, comprehensive AC)
- ✅ Success criteria are measurable (<15 second load time, 44px touch targets)
- ✅ Dependencies are identified (localStorage, WLEDDeviceManager, UX_STANDARDS.md)

---

**Epic Status:** Draft → Ready for Story Manager
**Next Step:** Story Manager develops detailed tasks/subtasks for Story 10.1
**User Value:** **~4 minute time savings per hardware setup** (critical for live performance preparation)
