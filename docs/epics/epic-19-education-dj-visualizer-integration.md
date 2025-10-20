# Epic 19: Education Mode DJ Visualizer Integration - Brownfield Enhancement

## Epic Goal

Integrate the existing LiveAudioVisualizer (DJ Visualizer) into Education Mode lessons 2 and 4 to enhance audio/pitch learning with real-time frequency visualization, while preserving step sequencer UI for rhythm-focused lessons 1 and 3.

## Epic Description

### Existing System Context

**Current Education Mode Functionality:**
- Located at `/src/components/Education/EducationMode.tsx`
- Four interactive lessons: Basic Beat (L1), Color and Pitch (L2), Rhythm Patterns (L3), Melody & Harmony (L4)
- **Lessons 1 & 3**: Use step sequencer UI (pattern grid) - optimal for teaching rhythm
- **Lesson 2**: Uses `CompactVisualizer` - limited frequency visualization
- **Lesson 4**: Simplified piano keyboard - no visualizer currently
- Manual audio playback via Tone.js and audioEngine
- Fixed color modes (spectrum, chromatic, harmonic)

**Current DJ Visualizer (LiveAudioVisualizer) Functionality:**
- Located at `/src/components/LiveAudioVisualizer/LiveAudioVisualizer.tsx`
- Accessible at `/dj-visualizer` route
- Three visualization modes: spectrum, waveform, ripple
- Real-time audio input capture with device selection
- FrequencySourceManager for audio data mixing
- WLED LED matrix output support
- 60fps rendering with performance monitoring
- Advanced settings: gain control, frequency scaling, ripple direction

**Technology Stack:**
- React with TypeScript
- Tone.js for audio synthesis
- Canvas API for visualizations
- React Router for navigation
- Tailwind CSS for styling
- Custom audio engine utilities

**Integration Points:**
- Education Mode triggers drum sounds via `audioEngine.playDrum()`
- DJ Visualizer captures audio via `AudioInputManager` and `FrequencySourceManager`
- Shared visualization color mapping system (spectrum/chromatic/harmonic)
- Common UI patterns using ViewTemplate and ViewCard components

### Enhancement Details

**What's Being Added/Changed:**

1. **Replace CompactVisualizer with LiveAudioVisualizer in Lesson 2 ONLY**
   - Embed LiveAudioVisualizer in lesson 2 (Color and Pitch) - frequency/pitch focus
   - Connect drum playback to FrequencySourceManager for real-time visualization
   - **DO NOT replace step sequencer in lessons 1 & 3** - rhythm lessons keep pattern grid UI

2. **Add LiveAudioVisualizer to Lesson 4 (Melody & Harmony)**
   - Integrate LiveAudioVisualizer with piano keyboard for note visualization
   - Show spectrum peaks for each piano note played
   - Show waveform for melodic contour during scales

3. **Adapt DJ Visualizer for Embedded Mode**
   - Add embedded mode prop to hide/simplify controls for education context
   - Auto-initialize audio capture when entering visualization lessons (2 & 4)
   - Preset appropriate visualization modes per lesson step

4. **Pedagogically Matched Visualization Strategy**
   - **Lesson 1 (Basic Beat)**: Step sequencer grid ONLY (rhythm = visual timing)
   - **Lesson 2 (Color & Pitch)**: DJ visualizer spectrum mode (drums → frequency peaks)
   - **Lesson 3 (Rhythm Patterns)**: Step sequencer grid ONLY (layered drums = pattern grid)
   - **Lesson 4 (Melody & Harmony)**: DJ visualizer spectrum/waveform (notes → frequency visualization)

**How It Integrates:**
- LiveAudioVisualizer component embedded directly in EducationMode.tsx
- FrequencySourceManager integration via audioEngine drum playback
- Shared visualization settings state management
- Responsive layout using existing Tailwind patterns

**Success Criteria:**
- **Lesson 1 & 3**: Step sequencer grid remains unchanged (no DJ visualizer)
- **Lesson 2**: Students see real-time spectrum visualization when playing drums
- **Lesson 4**: Students see spectrum peaks for piano notes and waveform for scales
- Smooth transition between visualization modes (spectrum, waveform) where applicable
- Performance remains at 60fps during lessons 2 & 4 visualization
- Embedded visualizer uses simplified controls appropriate for education

### Stories

1. **Story 19.1: LiveAudioVisualizer Embedded Mode**
   - Add `embedded` prop to LiveAudioVisualizer component
   - Create simplified control panel for education context
   - Hide advanced settings (device selection, gain, frequency scale)
   - Auto-initialize with default microphone input
   - Acceptance Criteria:
     - Embedded mode renders without device picker or advanced controls
     - Audio auto-initializes on component mount
     - Canvas rendering works in smaller embedded layout
     - Error handling gracefully falls back if microphone unavailable

2. **Story 19.2: Lesson 2 (Color & Pitch) Visualizer Integration**
   - Replace CompactVisualizer with LiveAudioVisualizer in lesson 2 ONLY
   - Connect drum playback to FrequencySourceManager for spectrum visualization
   - **Do NOT modify lessons 1 & 3** - preserve step sequencer pattern grids
   - Update lesson 2 instructions to reference spectrum visualization
   - Acceptance Criteria:
     - Lesson 2 shows spectrum visualization of drum sounds (frequency peaks)
     - Drum sounds trigger real-time visual feedback
     - Color mode switching (spectrum/chromatic/harmonic) works
     - **Lessons 1 & 3 step sequencer grids remain completely unchanged**
     - Lesson completion logic remains intact

3. **Story 19.3: Performance Optimization & Polish (Lessons 2 & 4)**
   - Verify 60fps rendering during lessons 2 & 4 (visualizer lessons)
   - Add loading states and smooth transitions for LiveAudioVisualizer
   - Test responsive behavior on mobile/tablet/desktop
   - Verify lessons 1 & 3 step sequencer performance unchanged
   - Update Education Mode documentation
   - Acceptance Criteria:
     - Visualization maintains 60fps on target devices (lessons 2 & 4)
     - Smooth fade-in when visualizer initializes
     - **Step sequencer performance in lessons 1 & 3 verified (no regression)**
     - Responsive layout works across breakpoints (sm:, md:, lg:)
     - No console errors or warnings
     - Manual testing checklist completed

4. **Story 19.4: Lesson 4 (Melody & Harmony) Visualizer Integration**
   - Add LiveAudioVisualizer to lesson 4 piano keyboard interface
   - Connect piano note playback to FrequencySourceManager
   - Step 4.1: Spectrum mode for individual note frequency peaks
   - Step 4.2: Waveform mode for scale melodic contour
   - Step 4.3: Spectrum mode for chord harmonic visualization
   - Acceptance Criteria:
     - Piano notes show frequency peaks in spectrum mode
     - Scales show pitch progression in waveform mode
     - Chords show multiple simultaneous frequency peaks
     - Visualization responds to all 8 piano keys (C-D-E-F-G-A-B-C)
     - Lesson 4 completion logic works correctly

5. **Story 19.5: Spectrum Mode WLED Visualization (1D LED Strips)** ⚠️ **POTENTIALLY SKIP/RESOLVED**
   - ⚠️ **Discovery (2025-10-19):** May already work by configuring LED matrix as 90×1 (width=90, height=1) instead of 1×90
   - **Why it works:** Existing SpectrumVisualization already renders bars across canvas width → maps to LED width
   - **Verification needed:** Fade-out smoothing, brightness mapping, performance, color saturation
   - **If tests pass:** Mark as SKIP - Already Resolved
   - Original scope (if needed):
     - Horizontal frequency layout: LED 0 = bass, LED N = treble
     - Amplitude → brightness mapping (bar height controls LED brightness)
     - Color mapping from virtual spectrum visualization
     - Fade-out smoothing to prevent LED flicker

6. **Story 19.6: Spectrum Mode WLED Visualization (2D LED Matrices)**
   - Implement spectrum bar chart rendering for 2D WLED LED matrices (M×N)
   - Orientation control: define X or Y axis as frequency (vertical vs. horizontal bars)
   - Flip/mirror control: invert bar direction (top-to-bottom vs. bottom-to-top)
   - Compression/scaling: adapt bar count to matrix dimensions
   - Acceptance Criteria:
     - 2D matrices (height > 1) render as bar charts (matches virtual canvas)
     - Orientation control: vertical (X=frequency) or horizontal (Y=frequency)
     - Flip control: invert bar direction independently of LED wiring
     - Color mapping matches virtual canvas for all orientations
     - Compression/scaling preserves bass/mid/treble balance
     - Education Mode lesson 2 and standalone DJ visualizer compatibility

### Compatibility Requirements

- [x] **Lessons 1 & 3 step sequencer grids remain completely unchanged** (no visualizer integration)
- [x] CompactVisualizer can be safely replaced in lesson 2 only (no other dependencies)
- [x] LiveAudioVisualizer embedded mode doesn't break standalone /dj-visualizer route
- [x] UI changes follow existing ViewTemplate and ViewCard patterns
- [x] Performance impact minimal for lessons 2 & 4 (maintains 60fps target)
- [x] No performance regression in lessons 1 & 3 step sequencer

### Risk Mitigation

**Primary Risk:** Microphone permission denial breaks lesson flow
**Mitigation:**
- Graceful fallback to visual-only mode if microphone unavailable
- Clear user messaging about microphone permissions
- Alternative lesson completion path if audio input fails

**Secondary Risk:** Performance degradation on mobile devices
**Mitigation:**
- Test on representative mobile devices (iOS/Android)
- Add performance monitoring during development
- Implement reduced rendering quality option if needed

**Rollback Plan:**
- Revert to CompactVisualizer by restoring EducationMode.tsx from git history
- LiveAudioVisualizer changes are isolated to embedded mode (doesn't affect /dj-visualizer route)
- No database or backend changes required

### Definition of Done

- [ ] All six stories completed with acceptance criteria met (19.1, 19.2, 19.3, 19.4, 19.5*, 19.6)
  - *Story 19.5 may be SKIPPED if simple config change (90×1 LED matrix) proves sufficient
- [ ] **Lessons 1 & 3 step sequencer grids verified unchanged** (manual testing)
- [ ] Lesson 2 spectrum visualization working correctly (drum frequency peaks)
- [ ] Lesson 4 piano visualization working correctly (note/scale/chord visualization)
- [ ] **WLED 1D LED strip spectrum visualization** (Story 19.5* - may already work with 90×1 config)
  - If skip: Verify fade-out, brightness, performance, colors all acceptable
  - If implement: Only address specific gaps found during verification
- [ ] **WLED 2D LED matrix spectrum visualization** (Story 19.6 - bar charts, orientation/flip controls)
- [ ] Performance verified at 60fps canvas rendering on desktop and mobile (lessons 2 & 4)
- [ ] WLED output verified at 30+ fps with minimal latency (1D and 2D configurations)
- [ ] No regression in lessons 1 & 3 step sequencer performance
- [ ] No regression in existing /dj-visualizer standalone mode
- [ ] Manual testing checklist completed (browser DevTools verification)
- [ ] Documentation updated in `/docs/architecture/` if needed

---

## Validation Checklist

### Scope Validation

- [x] Epic can be completed in 6 stories (19.1-19.6)
- [x] No architectural documentation is required (follows existing patterns)
- [x] Enhancement follows existing patterns (ViewTemplate, embedded components, step sequencer)
- [x] Integration complexity is manageable (component props and state)
- [x] **Step sequencer in lessons 1 & 3 preserved** (no changes to rhythm UI)
- [x] **WLED spectrum visualization split into 2 stories** (19.5 = 1D strips, 19.6 = 2D matrices)

### Risk Assessment

- [x] Risk to existing system is low (isolated to Education Mode lesson 2)
- [x] Rollback plan is feasible (git revert, no database changes)
- [x] Testing approach covers existing functionality (manual browser testing)
- [x] Team has sufficient knowledge of integration points (FrequencySourceManager, audioEngine)

### Completeness Check

- [x] Epic goal is clear and achievable (enhance lesson 2 with DJ visualizer)
- [x] Stories are properly scoped (embedded mode → integration → polish)
- [x] Success criteria are measurable (60fps, lesson completion, responsive)
- [x] Dependencies are identified (LiveAudioVisualizer, FrequencySourceManager, audioEngine)

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing Education Mode running React + TypeScript + Tone.js + Canvas API
- Integration points:
  - EducationMode.tsx (replace CompactVisualizer)
  - LiveAudioVisualizer component (add embedded mode)
  - FrequencySourceManager (connect drum playback)
  - audioEngine.playDrum() method
- Existing patterns to follow:
  - ViewTemplate and ViewCard components for UI
  - Tailwind CSS responsive patterns (sm:, md:, lg:)
  - Embedded component props (see LiveAudioVisualizer existing `embedded` prop)
- Critical compatibility requirements:
  - Lessons 1 and 3 must remain unchanged
  - Standalone /dj-visualizer route must not break
  - Maintain 60fps rendering performance
  - Graceful fallback if microphone permission denied
- Each story must include verification that existing functionality remains intact (manual browser testing)

The epic should maintain system integrity while delivering enhanced visual learning in Education Mode lesson 2 (Color and Pitch)."

---

## Epic Metadata

- **Epic Number:** 19
- **Status:** 🚧 IN PROGRESS (Story 19.2 active)
- **Priority:** Medium
- **Estimated Stories:** 6 (19.1-19.6) - Story 19.5 may be SKIPPED
- **Type:** Brownfield Enhancement
- **Affected Components:** EducationMode (lessons 2 & 4), LiveAudioVisualizer, WLED LED output
- **Testing Strategy:** Manual browser testing with DevTools performance monitoring
- **Pedagogical Approach:** Step sequencer for rhythm (L1 & L3), DJ visualizer for audio/pitch (L2 & L4)
- **WLED Support:** 1D LED strips (19.5* - potentially already working), 2D LED matrices (19.6)
- **Discovery (2025-10-19):** 1D LED strip spectrum may already work via 90×1 matrix configuration
