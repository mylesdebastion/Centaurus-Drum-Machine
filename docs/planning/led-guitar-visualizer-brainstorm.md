# LED Guitar Visualizer - Epic Planning Notes

**Date:** 2025-10-07
**Status:** Brainstorming / Pre-Epic
**Participants:** Project Lead + BMad Orchestrator

---

## Executive Summary

Planning to integrate LED guitar fretboard visualization into the Centaurus Drum Machine app. Core architectural decision: **LED layout abstraction** rather than separate mode, to maintain educational focus while enabling creative flexibility.

**Key Insight:** Abstract WLED output as configurable "layouts" (1D strip, 2D matrix, guitar fretboard) rather than creating separate modes. This prevents scope drift and UI complexity while enabling powerful visualization options.

---

## Context: Existing Prototype Analysis

### Source: `research/wled-guitar-fretboard-pygame.0.4.py`

**Prototype Capabilities:**
- **Guitar Fretboard Visualization**: 6 strings × 25 frets = 150 LED positions
- **Tuning**: Standard tuning (E A D G B E)
- **Color Mapping**:
  - Chromatic mode (rainbow through 12 notes)
  - Harmonic mode (custom palette emphasizing harmonic relationships)
  - Toggle between modes with keyboard
- **Chord Progression Engine**:
  - Pre-programmed progressions (Jazz ii-V-I, Blues in A, Pop I-V-vi-IV)
  - Auto-cycles every 5 seconds
  - Manual progression switching
- **WLED Integration**:
  - UDP protocol (WARLS) on port 21324
  - Real-time RGB data for all 150 LEDs
  - Synchronized with visual display
- **Audio Playback**: Generated sine wave tones with decay envelope
- **Interactive Features**: Click frets to play notes, visual feedback

**Technology Stack (Prototype):**
- Python + Pygame (desktop application)
- NumPy for audio generation
- UDP socket communication to WLED

---

## Integration Opportunities with Centaurus

### Existing Features to Leverage

✅ **WLED Bridge Already Implemented**
- `vite-plugins/wled-bridge` plugin running on port 21325
- Already forwarding to UDP port 21324
- **Perfect match for guitar visualizer!**

✅ **Audio Engine (Tone.js)**
- Already using Tone.js for synthesis
- Can replace pygame sine waves with professional sounds
- MembraneSynth, PluckSynth ready for guitar-like tones

✅ **Isometric Sequencer**
- 3D visualization already exists
- Shared sequencing/playback engine
- Could complement guitar fretboard view

✅ **React/TypeScript Stack**
- Modern web-based UI (vs pygame desktop app)
- Responsive design patterns established
- Component architecture ready for guitar fretboard

---

## Architectural Decision: LED Layout Abstraction

### Problem Statement
**Primary Concern:** Integration scope and avoiding overwhelming educational users.

**Competing Needs:**
- **Personal use**: Translate musical ideas to different visualizations/instruments
- **Educational use**: Keep focused, avoid complexity/scope drift
- **Technical**: Prevent mode proliferation and UI clutter

### Solution: Layout Abstraction Layer

```
Musical Data (Universal)
    ↓
LED Layout Engine (Abstraction Layer)
    ↓
┌────────────┬──────────────┬─────────────────┐
│ 1D Strip   │ 2D Matrix    │ Guitar Fretboard│
│ (Linear)   │ (Grid)       │ (6×25 Strings)  │
└────────────┴──────────────┴─────────────────┘
```

**Key Principle:** Same sequencer, same patterns, same musical logic → different physical LED arrangements.

### Benefits

**For Education:**
- ✅ Not overwhelming - hidden in settings, opt-in
- ✅ Consistent learning - same musical concepts, different views
- ✅ Progressive disclosure - start simple, advance to complex

**For Personal Use:**
- ✅ Flexibility - switch layouts for different creative needs
- ✅ Experimentation - same pattern, multiple visualizations
- ✅ Extensibility - easy to add drum pad layout, etc.

**For Codebase:**
- ✅ No scope drift - core sequencer unchanged
- ✅ Clean separation - LED rendering is isolated
- ✅ Testable - mock different layouts easily
- ✅ Reusable - WLED bridge already exists

---

## Technical Architecture Sketch

### Proposed Interface

```typescript
interface LEDLayout {
  type: '1d-strip' | '2d-matrix' | 'guitar-fretboard' | 'custom';
  dimensions: {
    width: number;    // For 2D layouts
    height: number;   // For 2D layouts
    total: number;    // Total LED count
  };
  mapping: NoteMappingStrategy;
}

interface NoteMappingStrategy {
  // Maps musical note/pitch to LED position
  noteToPosition(note: number, octave: number): LEDPosition;

  // Maps LED position to RGB based on active notes
  renderFrame(activeNotes: Note[]): RGBData[];
}
```

### Guitar Fretboard Layout Implementation

```typescript
class GuitarFretboardLayout implements LEDLayout {
  type = 'guitar-fretboard';
  dimensions = { width: 25, height: 6, total: 150 };

  // Standard tuning: E A D G B E
  tuning = [4, 9, 2, 7, 11, 4];

  noteToPosition(note: number, octave: number): LEDPosition[] {
    // Returns ALL positions where this note appears
    const positions = [];
    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret < 25; fret++) {
        const fretNote = (this.tuning[string] + fret) % 12;
        if (fretNote === note % 12) {
          positions.push({ string, fret, ledIndex: string * 25 + fret });
        }
      }
    }
    return positions;
  }

  renderFrame(activeNotes: Note[]): RGBData[] {
    // Map active notes to fretboard positions
    // Apply color mapping (chromatic/harmonic)
    // Return 150-element RGB array for WLED
  }
}
```

---

## Design Options & Recommendations

### 1. Integration Point

**Option A: Settings Panel** ⭐ **RECOMMENDED**
- Simple, non-intrusive
- User configures once, uses app normally
- Doesn't clutter main UI

**Option B: Per-Mode Setting**
- Each mode can have different layout
- More complex but more flexible
- Example: Education uses guitar, Isometric uses 2D matrix

**Option C: Quick Toggle in Header**
- Layout switcher always visible
- For users who want to see same pattern multiple ways
- Could be overwhelming for education users

**Recommendation:** Start with **Option A**, add **Option C** later if needed.

---

### 2. Visual Preview

**Option A: WLED Only**
- App sends data to WLED, no in-app visualization
- Keeps UI clean and focused
- Requires physical hardware to see results

**Option B: Optional Preview Panel** ⭐ **RECOMMENDED**
- Small preview in settings to confirm layout
- Optional in-app visualizer for debugging
- Helps users without hardware understand concept

**Option C: Dual View**
- Always show both sequencer UI and LED preview
- Great for power users, overwhelming for learners

**Recommendation:** **Option B** - Optional preview in settings, not always visible.

---

### 3. Settings Panel UI Mockup

```
┌─────────────────────────────────────────┐
│ LED Output Configuration                 │
├─────────────────────────────────────────┤
│ Layout Type: [Dropdown]                  │
│   • 1D Strip (150 LEDs)                  │
│   • 2D Matrix (15×10)                    │
│   • Guitar Fretboard (6 strings × 25)   │
│                                          │
│ Color Mapping: [Chromatic ▼]            │
│   • Chromatic                            │
│   • Harmonic                             │
│   • Scale-based                          │
│                                          │
│ WLED Device: [192.168.0.17]             │
│                                          │
│ [Preview Layout] [Test Connection]      │
└─────────────────────────────────────────┘
```

---

## Recommended Scope

### MVP (Minimal Viable Product)

**In Scope:**
- [ ] LED Layout abstraction interface
- [ ] 1D Strip layout implementation (baseline/default)
- [ ] Guitar Fretboard layout implementation
- [ ] Layout selector in settings panel
- [ ] WLED integration with layout system
- [ ] Chromatic and Harmonic color mapping
- [ ] Basic note-to-LED position mapping for guitar

**Out of Scope (Future Enhancements):**
- [ ] 2D Matrix layout
- [ ] Custom layout editor
- [ ] Always-visible in-app visual preview
- [ ] Per-mode layout preferences
- [ ] Layout presets library
- [ ] Interactive fretboard UI (click to play)
- [ ] Chord progression playback engine

### Success Criteria

**Must Have:**
1. User can select guitar fretboard layout from settings
2. Active notes in sequencer illuminate correct fret positions on physical WLED guitar
3. Color mapping (chromatic/harmonic) works correctly
4. No performance degradation (maintains 30fps rendering)
5. Educational users are not overwhelmed (settings-based, opt-in)

**Nice to Have:**
1. Optional in-app preview of LED layout
2. Test connection button validates WLED communication
3. Layout persists across sessions (localStorage)

---

## Technical Risks & Mitigation

### Risk 1: Performance - Rendering 150 LEDs at 30fps in Browser
**Severity:** Medium
**Likelihood:** Medium
**Mitigation:**
- Use requestAnimationFrame for efficient rendering
- Only update WLED when note state changes (not every frame)
- Batch LED updates into single UDP packet
- Profile performance early in development

### Risk 2: WLED Protocol Compatibility
**Severity:** Low
**Likelihood:** Low
**Mitigation:**
- WLED bridge already working (vite-plugins/wled-bridge)
- Use proven WARLS protocol (same as prototype)
- Test with physical hardware early

### Risk 3: Note Mapping Complexity for Guitar Tuning
**Severity:** Low
**Likelihood:** Low
**Mitigation:**
- Well-understood problem (prototype already solved this)
- Standard tuning is straightforward
- Alternative tunings can be added later

### Risk 4: User Confusion (Settings vs. Mode)
**Severity:** Low
**Likelihood:** Medium
**Mitigation:**
- Clear labeling in settings panel
- Optional tooltip/help text
- Default to simple 1D strip (no change for existing users)
- Documentation in user guide

### Risk 5: Hardware Availability for Testing
**Severity:** Medium
**Likelihood:** Medium
**Mitigation:**
- Build in-app preview for testing without hardware
- Use WLED simulator during development
- Ensure graceful fallback if WLED device unavailable

---

## Epic Structure Preview

When ready to create formal epic with PM agent:

```
EPIC: LED Output Layout System

Goals:
- Abstract WLED output from specific layout assumptions
- Enable guitar fretboard visualization as a layout option
- Maintain educational focus (no UI clutter)
- Enable personal creative flexibility

User Stories:
1. As a developer, I want an LED layout abstraction so that I can support multiple LED configurations without code duplication
2. As a musician, I want to switch LED layouts so that I can visualize musical patterns in different ways
3. As a guitar learner, I want to see notes on a fretboard so that I can understand guitar-specific note positions
4. As an educator, I want layout selection to be opt-in so that students aren't overwhelmed with complexity

Technical Architecture:
- LED layout interface and factory pattern
- Guitar fretboard layout implementation
- Settings panel integration
- WLED communication layer

Dependencies:
- WLED bridge (already exists)
- Settings/preferences system (may need to create)
- Color mapping utilities (partially exists in prototype)
```

---

## Next Steps

1. **Review and refine** these notes with project stakeholders
2. **Validate hardware availability** - confirm physical LED guitar fretboard specs
3. **Create formal epic** with PM agent (`*agent pm` → `*create-epic`)
4. **Break down into user stories** for implementation
5. **Prototype LED layout abstraction** to validate architecture
6. **Design settings UI** with UX Expert agent if needed

---

## Open Questions

1. **Hardware Specifications**
   - Do you have the physical LED guitar fretboard?
   - LED count: Confirmed 150 LEDs (6×25)?
   - WLED device model/version?
   - Current WLED IP/configuration?

2. **Color Mapping Preferences**
   - Should we use exact colors from prototype (chromatic/harmonic)?
   - Any accessibility considerations (colorblind modes)?
   - User-customizable color palettes?

3. **Settings Panel Location**
   - New Settings route/page?
   - Modal overlay?
   - Collapsible panel in existing views?

4. **Default Behavior**
   - What's the default LED layout for new users?
   - Should WLED output be enabled by default or opt-in?

---

## References

- **Prototype Code:** `research/wled-guitar-fretboard-pygame.0.4.py`
- **WLED Bridge Plugin:** `vite-plugins/wled-bridge` (port 21325 → 21324)
- **Existing Architecture Docs:** `docs/architecture/`
- **UX Standards:** `docs/UX_STANDARDS.md`
- **Tech Stack:** `docs/architecture/tech-stack.md`

---

## Appendix: Code Snippets from Prototype

### WLED Communication (Python Reference)

```python
def send_udp_packet(self, data: List[int]):
    packet = bytearray([2, 255])  # WARLS protocol with 255 as second byte
    packet.extend(data)
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.sendto(packet, (WLED_IP, WLED_PORT))
```

### Color Mappings (from Prototype)

```python
CHROMATIC_COLORS = [
    (255, 0, 0), (255, 69, 0), (255, 165, 0), (255, 215, 0),
    (255, 255, 0), (173, 255, 47), (0, 255, 0), (0, 206, 209),
    (0, 0, 255), (138, 43, 226), (148, 0, 211), (199, 21, 133)
]

HARMONIC_COLORS = [
    (255, 0, 0),    # C
    (0, 206, 209),  # C#
    (255, 165, 0),  # D
    (138, 43, 226), # D#
    (255, 255, 0),  # E
    (199, 21, 133), # F
    (0, 255, 0),    # F#
    (255, 69, 0),   # G
    (0, 0, 255),    # G#
    (255, 215, 0),  # A
    (148, 0, 211),  # A#
    (173, 255, 47)  # B
]
```

### Fretboard Matrix Generation

```python
def create_fretboard_matrix(self) -> List[List[int]]:
    # Standard tuning: E A D G B E
    STANDARD_TUNING = [4, 9, 2, 7, 11, 4]
    return [[(open_note + fret) % 12 for fret in range(25)]
            for open_note in STANDARD_TUNING]
```

---

**END OF BRAINSTORMING NOTES**
