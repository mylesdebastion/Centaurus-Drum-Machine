# LED Compositor System - Design Document

**Epic:** 14 - Module Adapter System & Global State Integration
**New Story:** 14.7 - LED Compositor Implementation (NEW - promoted to core Epic 14)
**Status:** 🚧 DESIGN - Awaiting stakeholder approval
**Author:** Winston (Architect)
**Stakeholder Feedback:** Myles (Visionary/Primary User) - 2025-10-13
**Date:** 2025-10-13
**Version:** 1.0

---

## Document Purpose

This document describes the LED Compositor System architecture based on stakeholder feedback from Myles. This is a **focused, MVP-scoped design** that addresses the core requirement: **visual blending of multiple module outputs onto limited LED hardware**.

**Scope Control:** This document focuses ONLY on LED compositing and visualization compatibility. Related features (Audio Input Mode, advanced blending) are marked as future enhancements (Epic 15+) to avoid feature creep.

---

## Executive Summary

**Problem:** Original priority-based LED routing forces users to choose which visualization "wins" on shared hardware. This causes **information loss** when users have Piano notes AND audio ripples but can only see one.

**Solution:** LED Compositor Service that blends multiple module outputs using standard blending modes (multiply, screen) before sending to hardware.

**Stakeholder Quote (Myles, 2025-10-13):**
> "We can overlay different visualizations virtually and on LED strips. We can't send multiple data streams, no but we can overlay visually different viz at the same time if our pixel surfaces are limited (1 matrix, 1 or 2 LED strips). Different blending modes would be offered but most helpful are multiply/screen."

**MVP Scope (Epic 14 Story 14.7):**
- ✅ LED Compositor Service with frame blending
- ✅ Blending modes: multiply, screen, additive, max (4 modes)
- ✅ Compatibility detection (prevent incompatible visualizations)
- ✅ Toggle mode fallback (incompatible frames use latest only)
- ✅ UI controls for blend mode selection
- ✅ Warning UI when incompatible visualizations detected

**Future Enhancements (Epic 15+):**
- ⏸️ Audio Input Mode toggle (acknowledge existing `/dj-visualizer` work, needs global vs. local planning, MIDI note input support)
- ⏸️ Per-device blend mode overrides (advanced users)
- ⏸️ GPU acceleration (WebGL shaders for blending)
- ⏸️ Custom blend functions (user-defined JavaScript)

---

##  A.1 Core Requirements (MVP - Epic 14)

### Requirement 1: Visual Blending on Limited Hardware

**User Need:** Users with 1-2 LED strips want to see multiple visualizations simultaneously

**Example:** Piano notes (specific LED positions) + Audio ripple (full strip wave) = Composited output with both visible

**Blending Modes (MVP):**
- **Multiply** (darkens overlaps) - Myles: "most helpful"
- **Screen** (lightens overlaps) - Myles: "most helpful"
- **Additive** (adds RGB values) - Standard compositing mode
- **Max** (brightest pixel wins) - Good for triggers + ambient viz

**Implementation:** Pixel-by-pixel RGB blending before sending to hardware

---

### Requirement 2: Compatibility Detection

**User Need:** Prevent confusing output when visualizations use incompatible addressing schemes

**INCOMPATIBLE Example:**
- Piano: 88 LEDs (1 note per LED, direct mapping)
- Guitar: 150 LEDs (25 notes per string × 6, different addressing)
- Result if blended: **Extremely confusing, unusable**

**COMPATIBLE Examples:**
- Piano (note-per-led) + Audio Ripple (full-strip-wave) = ✅ Compatible
- Drum triggers (beat-flash) + Audio spectrum (full-strip-wave) = ✅ Compatible

**Stakeholder Quote (Myles):**
> "We might have COMPLETELY DIFFERENT viz modes, such as an LED strip that is showing 1 note per LED for a piano visualization, whereas we might have a guitar visualization that has 25 notes per string/25 LEDs and this would be EXTREMELY confusing. In this use case, those note visualizations must ABSOLUTELY be on separate LED strip/display matrix, and/or toggleable one at a time to be the focus."

**Implementation:** Compatibility matrix checks visualization modes, falls back to toggle mode if incompatible

---

### Requirement 3: User Feedback for Incompatibility

**User Need:** Clear warning when incompatible visualizations detected

**UI Design:**
- Toast notification: "⚠️ Cannot blend Piano + Guitar (incompatible addressing)"
- Explanation: "Only the most recent visualization is shown."
- Action: "Use separate LED devices for each module"

**Implementation:** Compositor detects incompatibility, triggers UI warning component

---

## A.2 Architecture Overview

### System Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Module Visualization Layer                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ PianoRoll│  │  Guitar  │  │  Drum    │  │LiveAudio │   │
│  │          │  │ Fretboard│  │ Machine  │  │Visualizer│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       │ LEDFrame    │ LEDFrame     │ LEDFrame     │ LEDFrame │
│       └─────────────┴──────────────┴──────────────┘          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               LED Compositor Service (NEW)                   │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Step 1: Receive Frames                              │     │
│  │    - Modules submit LEDFrame objects                │     │
│  │    - Frame buffer stores latest frame per module   │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Step 2: Compatibility Check                         │     │
│  │    - Pixel count validation (must match)            │     │
│  │    - Visualization mode compatibility matrix        │     │
│  │    Result: Compatible ✅ or Incompatible ❌         │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Step 3A: Blend Frames (if compatible)               │     │
│  │    - Apply blend mode (multiply/screen/additive/max)│     │
│  │    - Composite pixel-by-pixel (RGB triplets)       │     │
│  │                                                      │     │
│  │ Step 3B: Toggle Mode (if incompatible)             │     │
│  │    - Use most recent frame only                     │     │
│  │    - Trigger warning UI                             │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Step 4: Rate Limiting (30 FPS)                      │     │
│  │    - Min 33.3ms between sends                       │     │
│  │    - Prevents UDP packet flooding                   │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Hardware Output Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  WLED    │  │   ROLI   │  │  WLED    │                  │
│  │ Strip 1  │  │   LUMI   │  │  Matrix  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## A.3 Data Models (NEW - Epic 14 Story 14.7)

### LEDFrame Interface

**Purpose:** Standard data structure for modules to submit visualization frames

**Location:** `src/types/ledFrame.ts` (NEW FILE)

```typescript
/**
 * LED visualization frame submitted by modules to compositor
 */
export interface LEDFrame {
  moduleId: string;              // 'piano-roll', 'drum-machine', etc.
  deviceId: string;              // Target WLED device ID
  timestamp: number;             // performance.now() for ordering
  pixelData: Uint8ClampedArray;  // RGB values [R,G,B, R,G,B, ...]
  visualizationMode: VisualizationMode; // For compatibility checking
}
```

---

### VisualizationMode Enum

**Purpose:** Categorize visualization patterns for compatibility detection

**Location:** `src/types/visualizationMode.ts` (NEW FILE)

```typescript
/**
 * Visualization addressing modes
 */
export type VisualizationMode =
  | 'note-per-led'        // Direct note-to-LED mapping (Piano: 88, Guitar: 150)
  | 'full-strip-wave'     // Full strip patterns (Audio ripple, spectrum)
  | 'grid-pattern'        // 2D grid patterns (Isometric sequencer)
  | 'beat-flash';         // Reactive flashes (Drum machine)

/**
 * Compatibility matrix - defines which modes can be blended
 */
export const COMPATIBILITY_MATRIX: Record<VisualizationMode, VisualizationMode[]> = {
  'note-per-led': ['full-strip-wave', 'beat-flash'],
  'full-strip-wave': ['note-per-led', 'grid-pattern', 'beat-flash', 'full-strip-wave'],
  'grid-pattern': ['full-strip-wave', 'beat-flash'],
  'beat-flash': ['note-per-led', 'full-strip-wave', 'grid-pattern']
};

/**
 * Special case: Two 'note-per-led' modes with different pixel counts = INCOMPATIBLE
 * Example: Piano (88) + Guitar (150) = Different addressing
 */
export function checkNotePerLedCompatibility(frame1: LEDFrame, frame2: LEDFrame): boolean {
  if (frame1.visualizationMode === 'note-per-led' && frame2.visualizationMode === 'note-per-led') {
    return frame1.pixelData.length === frame2.pixelData.length; // Must match
  }
  return true;
}
```

---

### BlendMode Type

**Purpose:** Define pixel blending algorithms

**Location:** `src/types/blendMode.ts` (NEW FILE)

```typescript
/**
 * Pixel blending modes for LED compositor
 */
export type BlendMode = 'multiply' | 'screen' | 'additive' | 'max';

export type RGB = [number, number, number];

/**
 * Blend two RGB pixels using specified blending mode
 */
export function blendPixels(base: RGB, overlay: RGB, mode: BlendMode): RGB {
  switch (mode) {
    case 'multiply':
      // Formula: (base * overlay) / 255 [darkens overlaps]
      return [
        Math.round((base[0] * overlay[0]) / 255),
        Math.round((base[1] * overlay[1]) / 255),
        Math.round((base[2] * overlay[2]) / 255)
      ];

    case 'screen':
      // Formula: 255 - ((255-base) * (255-overlay)) / 255 [lightens overlaps]
      return [
        Math.round(255 - ((255 - base[0]) * (255 - overlay[0])) / 255),
        Math.round(255 - ((255 - base[1]) * (255 - overlay[1])) / 255),
        Math.round(255 - ((255 - base[2]) * (255 - overlay[2])) / 255)
      ];

    case 'additive':
      // Formula: min(255, base + overlay) [adds RGB values]
      return [
        Math.min(255, base[0] + overlay[0]),
        Math.min(255, base[1] + overlay[1]),
        Math.min(255, base[2] + overlay[2])
      ];

    case 'max':
      // Formula: max(base, overlay) per channel [brightest wins]
      return [
        Math.max(base[0], overlay[0]),
        Math.max(base[1], overlay[1]),
        Math.max(base[2], overlay[2])
      ];
  }
}
```

---

## A.4 LEDCompositor Service Implementation

**Location:** `src/services/LEDCompositor.ts` (NEW FILE)

**Key Methods:**
- `submitFrame(frame: LEDFrame)` - Modules call this to submit frames
- `clearModuleFrame(moduleId: string, deviceId: string)` - Remove frame when module unmounts
- `setBlendMode(mode: BlendMode)` - User-configurable blending mode
- `checkCompatibility(frames: LEDFrame[])` - Internal compatibility check
- `compositeFrames(frames: LEDFrame[], mode: BlendMode)` - Internal pixel blending
- `sendToDevice(deviceId: string, pixelData: Uint8ClampedArray)` - Output to hardware

**See full implementation:** Reference `brownfield-module-refactoring.md` Addendum A.3.3 (if created) or implement based on this design.

---

## A.5 Story 14.7 Requirements

### Story 14.7: LED Compositor Implementation

**Status:** NEW - Promoted from post-MVP to core Epic 14
**Priority:** HIGH (same as Story 14.2)
**Prerequisites:** Story 14.2 (Module Adapter) must complete
**Blocks:** Stories 14.3-14.5 (modules need compositor API)
**Estimated Effort:** 8-10 hours

**Acceptance Criteria:**
1. ✅ LEDCompositor service created (`src/services/LEDCompositor.ts`)
2. ✅ LEDFrame, VisualizationMode, BlendMode types created
3. ✅ Blending modes functional (multiply, screen, additive, max)
4. ✅ Compatibility detection working (COMPATIBILITY_MATRIX enforced)
5. ✅ UI controls for blend mode selection (GlobalMusicHeader or Settings panel)
6. ✅ Warning UI when incompatible visualizations detected (toast notification)
7. ✅ Manual verification: Piano + Audio ripple blending visible simultaneously
8. ✅ Manual verification: Piano + Guitar incompatibility warning shown

**Deliverables:**
- `src/services/LEDCompositor.ts` (~250 lines)
- `src/types/ledFrame.ts` (~30 lines)
- `src/types/visualizationMode.ts` (~60 lines)
- `src/types/blendMode.ts` (~50 lines)
- Blending mode UI controls (~30 lines)
- Compatibility warning UI component (~40 lines)
- **Total:** ~460 lines of new code

---

## A.6 Out of Scope (Future Enhancements - Epic 15+)

### Audio Input Mode Toggle

**Status:** ⏸️ Deferred to Epic 15+

**Reason:** Feature creep concern. Existing `/dj-visualizer` has preliminary audio mode support (drum machine specific, no MIDI note input yet). Needs global vs. local planning.

**Requirements to Document for Future:**
- Review existing `/dj-visualizer` audio mode implementation
- Design global vs. local audio input mode settings
- Add MIDI note input support (currently missing)
- Context-aware defaults (education vs. performance)
- Noise gate threshold UI controls

**Estimated Future Effort:** 6-8 hours (Epic 15 Story 15.x)

---

### Per-Device Blend Mode Overrides

**Status:** ⏸️ Deferred to Epic 15+

**Reason:** Advanced feature, not required for MVP. Default global blend mode sufficient for most users.

**Requirements to Document for Future:**
- GlobalMusicContext extension: `deviceBlendModes: { [deviceId: string]: BlendMode }`
- UI for per-device overrides (advanced settings panel)
- Use case: User wants multiply for Strip 1, screen for Strip 2

**Estimated Future Effort:** 2-3 hours (Epic 15 Story 15.x)

---

### GPU Acceleration (WebGL Shaders)

**Status:** ⏸️ Deferred to Epic 15+

**Reason:** Optimization not needed unless performance issues arise. Naive pixel blending should handle 1-3 modules at 30 FPS.

**Requirements to Document for Future:**
- WebGL fragment shader for pixel blending (GPU parallelization)
- Fallback to naive implementation if WebGL unsupported
- Performance benchmarks: <1ms GPU blending vs. ~2ms CPU blending

**Estimated Future Effort:** 4-6 hours (Epic 15 Story 15.x)

---

## A.7 Integration with Epic 14 Stories

### Story 14.2 (Module Adapter) - Scope Update

**Add to Story 14.2:**
- LEDCompositor types (LEDFrame, VisualizationMode, BlendMode)
- GlobalMusicContext extension: `ledCompositor.defaultBlendMode`
- Blending mode UI controls skeleton (implementation in Story 14.7)

**Estimated Additional Effort:** +2 hours (types only, service in Story 14.7)

---

### Stories 14.3-14.5 (Module Refactoring) - Pattern Update

**Updated Pattern:**
- Modules submit LED frames to compositor (not direct hardware control)
- Example: `ledCompositor.submitFrame({ moduleId: 'piano-roll', deviceId, pixelData, visualizationMode: 'note-per-led' })`
- Module cleanup: `ledCompositor.clearModuleFrame('piano-roll', deviceId)` on unmount

**Estimated Additional Effort per Module:** +1-2 hours each

---

## A.8 Success Metrics

**Quantitative Metrics (Story 14.7):**
- ✅ 460 lines of new code (~1.5KB gzipped)
- ✅ 4 blending modes implemented
- ✅ <2ms compositing overhead (2-module blend)
- ✅ 30 FPS output rate (rate limited, no UDP flooding)

**Qualitative Metrics:**
- ✅ Multiple visualizations visible simultaneously (Piano + Audio ripple)
- ✅ Incompatible visualizations prevented (Piano + Guitar warning shown)
- ✅ User-friendly blend mode controls (multiply/screen clearly labeled)
- ✅ Clear warning messages (explain incompatibility, suggest solutions)

---

## A.9 Manual Verification (Story 14.7)

**Test 1: Piano + Audio Ripple Blending (5 min)**
- Setup: `/studio` with PianoRoll + LiveAudioVisualizer, 1 WLED strip
- Actions: Play piano notes, play music through mic
- Expected: White piano notes with blue audio ripple overlay (both visible)
- Validates: Compositor blending, compatibility detection (note-per-led + full-strip-wave)

**Test 2: Incompatibility Warning (3 min)**
- Setup: `/studio` with PianoRoll + GuitarFretboard, 1 WLED strip
- Actions: Play piano notes, play guitar chord
- Expected: Warning: "Cannot blend Piano + Guitar (incompatible addressing)", only guitar visible
- Validates: Compatibility detection, toggle mode fallback, warning UI

**Test 3: Blend Mode Switching (3 min)**
- Setup: `/studio` with PianoRoll + DrumMachine, 1 WLED strip
- Actions: Play piano + drums, switch blend mode (multiply → screen → additive)
- Expected: Visual output changes per blend mode (darkens → lightens → brightens)
- Validates: Blend mode controls, visual correctness

**Total Verification Time:** ~11 minutes

---

## A.10 References

**Stakeholder Feedback:**
- Date: 2025-10-13
- Participant: Myles (Visionary/Primary User)
- Context: Design review discussing LED routing, visual compositing, feature scope

**Related Documentation:**
- `docs/architecture/brownfield-module-refactoring.md` (Sections 1-12, parent architecture document)
- `docs/epics/epic-14-module-adapter-system.md` (needs update with Story 14.7)
- `docs/stories/14.1.story.md` (architecture story - reference this design document)

**Existing Code (Reference for Future Work):**
- `/dj-visualizer` audio mode (existing implementation - drum machine specific, needs review)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-13 | 1.0 | Initial LED Compositor design document - MVP scope, avoid feature creep | Winston (Architect) |

---

**Document Status:** 🚧 DRAFT - Awaiting stakeholder approval (Myles) and Story Manager review

**Next Steps:**
1. Myles reviews and approves LED Compositor design
2. Story Manager creates Story 14.7 using this document
3. Update Epic 14 file with Story 14.7 and revised effort estimates
4. Mark Audio Input Mode as Epic 15+ future work (avoid scope creep)
