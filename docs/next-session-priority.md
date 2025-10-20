# Next Session Priority

**Last Updated:** 2025-10-19 (End of Day)
**Current Branch:** `epic-16-wip`

---

## 🔴 PRIORITY 1: Fix WLED Manager Virtual Preview

**Issue:** `docs/issues/issue-wled-manager-virtual-preview-problems.md`

**Quick Context:**
- ✅ **Working:** `LEDMatrixManager.tsx` (used in /dj-visualizer and /education)
  - Height/Width inputs, responsive virtual preview
  - Virtual preview **matches real-world WLED output perfectly**
- ❌ **Broken:** `WLEDVirtualPreview.tsx` (used in /wled-manager)
  - Poor visual rendering, data flow issues
- Need to align WLEDManager with proven LEDMatrixManager pattern

**Session Plan:**
1. **Forensic Analysis** (30-45 min)
   - Read `src/components/LiveAudioVisualizer/LEDMatrixManager.tsx` (working reference)
     - Focus on lines 392-418 (virtual preview rendering)
     - Focus on lines 186-226 (serpentine conversion logic)
   - Read `src/components/WLED/WLEDVirtualPreview.tsx` (broken implementation)
   - Compare data formats, rendering approaches, serpentine handling
   - Document exact differences in issue file

2. **Fix Strategy Decision** (15 min)
   - Option A: Reuse LEDMatrixManager pattern (RECOMMENDED)
   - Option B: Replace WLEDVirtualPreview with LEDMatrixManager
   - Option C: Fix WLEDVirtualPreview in-place
   - Option D: Simplify preview (remove complexity)

3. **Implementation** (1-2 hours)
   - Apply chosen fix
   - Test with physical device (if available)
   - Verify virtual preview matches physical output

4. **Documentation** (15 min)
   - Update Story 18.5 with resolution
   - Mark Epic 18 Story 18.5 as complete

**Files to Review:**
- ✅ **Working:** `src/components/LiveAudioVisualizer/LEDMatrixManager.tsx`
  - Lines 392-418: Virtual preview rendering (the GOOD stuff)
  - Lines 186-226: Serpentine conversion logic (works correctly)
  - Data format: `RGB[][]` (2D array of RGB objects)
- ❌ **Broken:** `src/components/WLED/WLEDVirtualPreview.tsx`
  - Need to understand what's different/wrong
- `src/components/WLEDManager/DeviceCard.tsx` (line 140 uses broken preview)

---

## Background Context

### Epic 18: Intelligent WLED Visualization Routing
**Status:** Story 18.5 partially complete, issue blocking Story 18.6

**Completed:**
- ✅ Story 18.0: User Authentication
- ✅ Story 18.1: WLED Device Registry
- ✅ Story 18.2: Module Capability Declaration
- ✅ Story 18.3: Visualization Routing Matrix
- ✅ Story 18.4: Routing Rules Engine
- ⚠️ Story 18.5: WLED Manager UI (virtual preview issues)

**Next After Fix:**
- Story 18.6: LEDCompositor Integration
- Story 18.7: Multi-Module Testing & Documentation

### Related Stories
- **Story 19.5:** Spectrum WLED Enhancement (POTENTIALLY SKIP - simple config fix works)
- **Story 19.6:** Spectrum WLED 2D Matrix (DJ Visualizer integration)

---

## Dev Server Status

**Assumed Running:** `npm run dev` at `localhost:5173`

If not running or encountering issues, see: `docs/dev-server-troubleshooting.md`

---

## Manual Testing Checklist (After Fix)

Test on `/wled-manager`:
- [ ] 1D strip (90×1 config) - virtual preview matches physical device
- [ ] 2D grid (6×25) - serpentine wiring correctly visualized
- [ ] Rainbow test pattern - virtual preview shows same colors as device
- [ ] Spectrum visualization - matches dj-visualizer behavior
- [ ] Multiple devices - each preview independent and correct

---

## Additional Context

**Git Status:** Clean working directory (as of last session)

**Recent Commits:**
- `cedfef0` - fix: Change default LED matrix config to 90×1 for proper spectrum layout
- `51a39f6` - docs: Mark Story 19.5 as POTENTIALLY SKIP/RESOLVED
- `ee6809d` - feat(education): Complete Lesson 2 UX refinements

**No merge conflicts expected** - Epic 16 branch is clean

---

## Quick Links

- **Epic 18:** `docs/epics/epic-18-intelligent-wled-routing.md`
- **Story 18.5:** `docs/stories/18.5-wled-manager-ui.md`
- **Issue Doc:** `docs/issues/issue-wled-manager-virtual-preview-problems.md`
- **Architecture:** `docs/architecture/wled-visualization-routing.md`

---

**Session Goal:** Fix WLED Manager virtual preview to match LiveAudioVisualizer quality

**Success Criteria:** Virtual preview correctly shows what physical device displays

**Estimated Time:** 2-3 hours (analysis + fix + verification)
