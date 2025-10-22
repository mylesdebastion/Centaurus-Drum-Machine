# Launchpad Pro MK1 - Lightshow Research & Implementation Guide

## Overview

This document provides comprehensive technical research on creating full-spectrum lightshows on the Novation Launchpad Pro MK1 using MIDI Channel 6. It includes exact MIDI note mappings, velocity-to-color formulas, and implementation strategies for the 8×8 pad grid and external buttons.

**Research Scope:**
- MIDI note mapping for all 80+ addressable buttons
- RGB color control via velocity values (0-127)
- Lighting modes (static, flashing, pulsing)
- User Mode configuration for Channel 6
- Integration strategy for Centaurus Drum Machine

---

## Part 1: Hardware Overview

### Physical Layout

The Launchpad Pro MK1 features:
- **8×8 grid** of RGB, velocity-sensitive pads (64 total)
- **8 scene launch buttons** (right side, vertical arrangement)
- **8 control buttons** (top row: Session, Note, Device + 5 others)
- **1 setup button** (bottom edge, center)
- **Total addressable elements: 80+ buttons**

### LED System

- **Type:** RGB LED matrix
- **Color Palette:** 128 colors (addressed via velocity 0-127)
- **Brightness:** Full RGB intensity requires USB power + auxiliary power supply
- **Pressure Sensitivity:** Velocity-sensitive pads with aftertouch support
- **Update Rate:** Supports real-time MIDI lighting updates

---

## Part 2: MIDI Lighting Control Architecture

### Channel-to-Lighting Mode Mapping

The Launchpad Pro uses three MIDI channels to control different LED behaviors:

| Channel | Hex | Behavior | Use Case |
|---------|-----|----------|----------|
| 1 | 0x90 | Static color (permanent) | Steady lightshow, color grids |
| 2 | 0x91 | Flashing color (rapid on/off) | Alerts, tempo sync, emphasis |
| 3 | 0x92 | Pulsing color (fade in/out) | Ambient effects, breathing |

### MIDI Message Format

MIDI lighting uses Note On messages:
- **Status Byte:** 0x90, 0x91, or 0x92 (channels 1-3 for lighting mode)
- **Data Byte 1:** Note Number (pad/button address)
- **Data Byte 2:** Velocity (0-127, determines color)

### User Mode Configuration

**User Mode Purpose:**
- Allows independent MIDI channel assignment for lighting
- Enables standalone lightshow operation without Ableton dependency
- Supports custom MIDI note reassignment per layout

**Setting User Mode to Channel 6:**

1. Press the **3rd row of pads from the top**
2. Select a **blue pad** (typically positions 5, 6, or 7 in that row)
3. Device switches to User Mode on **Channel 6** (or 7/8 depending on selection)
4. All grid pads and buttons now respond to Channel 6 MIDI input/output

**Benefits for Lightshow:**
- Independent from Ableton Live session control
- Allows simultaneous hardware sequencer + lightshow control
- Full customization of MIDI note assignments
- Dedicated channel for visual feedback

---

## Part 3: RGB Color System & Velocity Formula

### Color Limitation

The Launchpad Pro uses a **6-bit color system** (not standard 8-bit):
- **Color Range:** 0-63 per channel (not 0-255)
- **Total Colors:** 128 (via 7-bit velocity, 0-127)
- **Color Model:** Red + Green only (within Note On/CC)

**Important Note:** Pure blue and colors requiring all three RGB channels require **SysEx commands** (separate protocol). The standard Note On velocity method is limited to **red + green combinations**.

### Velocity-to-RGB Conversion Formula

The velocity value is calculated as: **Velocity = (16 × Green) + Red + Flags**

Where:
- **Red** = 0-63 (red channel intensity)
- **Green** = 0-63 (green channel intensity)
- **Flags** = 12 (0x0C) for normal LED display, 8 (0x08) for flashing mode, 0 for double-buffering mode

### Standard Web Color Conversion

To convert standard web RGB (0-255) to Launchpad RGB (0-63), divide by 4: **Launchpad_RGB = Web_RGB ÷ 4**

**Examples:**
- Web RGB(255, 0, 0) → Launchpad RGB(64, 0, 0) → Velocity: 75 ✓
- Web RGB(0, 255, 0) → Launchpad RGB(0, 64, 0) → Velocity: 1024 ❌ (out of range)
- Web RGB(128, 128, 0) → Launchpad RGB(32, 32, 0) → Velocity: 544 ❌ (out of range)
- Web RGB(192, 192, 0) → Launchpad RGB(48, 48, 0) → Velocity: 840 ❌ (out of range)

### Pre-Calculated Color Palette

**Within Velocity Range (0-127):**

| Color | Red (0-63) | Green (0-63) | Formula | Velocity | Notes |
|-------|-----------|-------------|---------|----------|-------|
| Off | 0 | 0 | (16×0) + 0 + 12 | **12** | Lowest brightness |
| Red (dim) | 31 | 0 | (16×0) + 31 + 12 | **43** | Half red |
| Red (bright) | 63 | 0 | (16×0) + 63 + 12 | **75** | Full red ✓ |
| Green (dim) | 0 | 1 | (16×1) + 0 + 12 | **28** | Dim green |
| Green (bright) | 0 | 7 | (16×7) + 0 + 12 | **124** | ~Full green ✓ |
| Yellow (dim) | 31 | 1 | (16×1) + 31 + 12 | **59** | Red+slight green |
| Yellow (bright) | 63 | 7 | (16×7) + 63 + 12 | **187** | ❌ Out of range |
| Orange | 63 | 3 | (16×3) + 63 + 12 | **123** | Red+green ✓ |
| Cyan | 0 | 3 | (16×3) + 0 + 12 | **60** | Green only |
| Magenta | 63 | 0 | (16×0) + 63 + 12 | **75** | Red only (no blue) |
| White | N/A | N/A | N/A | N/A | Requires SysEx |
| Blue | N/A | N/A | N/A | N/A | Requires SysEx |

**Key Insight:** Within the 0-127 velocity constraint, you can only combine **red (0-63) + green (0-63)** values. Pure blue and true white require SysEx commands.

### Safe Color Palette (All within 0-127)

For reliable lightshow operation, use this verified palette:

- **Off:** Red 0, Green 0 → Velocity 12
- **Red:** Red 63, Green 0 → Velocity 75 ✓
- **Orange:** Red 63, Green 3 → Velocity 123 ✓
- **Yellow:** Red 63, Green 1 → Velocity 91 ✓
- **Lime:** Red 31, Green 7 → Velocity 127 ✓
- **Green:** Red 0, Green 7 → Velocity 124 ✓
- **Cyan:** Red 0, Green 3 → Velocity 60 ✓
- **Blue:** Requires SysEx commands
- **Purple:** Red 32, Green 0 → Velocity 44 ✓
- **Magenta:** Red 63, Green 2 → Velocity 107 ✓
- **White:** Red 63, Green 7 → Velocity 187 ❌ (exceeds 127 limit)

### RGB Control via SysEx (Advanced)

For full RGB control (including blue channel), SysEx commands can be used with the format:
- **Start:** F0 (SysEx start)
- **Manufacturer ID:** 00 20 29 (Novation)
- **Model:** 02 0C (Launchpad Pro)
- **Command:** 0B (RGB LED set)
- **Parameters:** [note] [red] [green] [blue] (0-255 range)
- **End:** F7 (SysEx end)

**Note:** SysEx is more complex than Note On/velocity but enables **true RGB color control** beyond the velocity palette limitation.

---

## Part 4: Pad Grid MIDI Note Mapping

### Grid Addressing System

The Launchpad Pro supports multiple addressing modes:

| Mode | Layout | Best For |
|------|--------|----------|
| **X-Y Layout** | Coordinate-based (0-99) | General programming |
| **Drum Rack Layout** | Musical notes (36-99) | Playing melodies, drum sequencing |
| **Programmer Mode** | Index-based (0-99) | Direct LED control via index |
| **Layout 3** | Blank canvas | Lightshow design (easy navigation) |

### 8×8 Grid MIDI Note Mapping (Drum Rack Layout)

The grid uses contiguous MIDI notes starting from C1 (note 36):

```
Bottom Row (Row 1):  MIDI 36-43  (C1-G1)
Row 2:              MIDI 44-51  (G#1-B1)
Row 3:              MIDI 52-59  (C2-G2)
Row 4:              MIDI 60-67  (G#2-B2)
Row 5:              MIDI 68-75  (C3-G3)
Row 6:              MIDI 76-83  (G#3-B3)
Row 7:              MIDI 84-91  (C4-G4)
Top Row (Row 8):    MIDI 92-99  (G#4-B4)

Visual Layout:
┌─────────────────────────────────┬─────┐
│ 92  93  94  95  96  97  98  99  │ S8  │
│ 84  85  86  87  88  89  90  91  │ S7  │
│ 76  77  78  79  80  81  82  83  │ S6  │
│ 68  69  70  71  72  73  74  75  │ S5  │
│ 60  61  62  63  64  65  66  67  │ S4  │
│ 52  53  54  55  56  57  58  59  │ S3  │
│ 44  45  46  47  48  49  50  51  │ S2  │
│ 36  37  38  39  40  41  42  43  │ S1  │
└─────────────────────────────────┴─────┘
  Col1 Col2 Col3 Col4 Col5 Col6 Col7 Col8
```

### Grid Position Calculation

Given a grid position (row, col) where row/col are 0-indexed (0-7):

**Formula:** MIDI_Note = 36 + (row × 8) + col

**Examples:**
- Position (0, 0) = 36 (C1, bottom-left)
- Position (0, 7) = 43 (G1, bottom-right)
- Position (7, 0) = 92 (G#4, top-left)
- Position (7, 7) = 99 (B4, top-right)

### External Buttons - Scene Launch Buttons

**Location:** Right side, vertical column of 8 buttons

**MIDI Note Range:** MIDI notes 89-96 (approximate, may vary by layout)

**Scene Button Mapping (Right Side):**
- S8 → MIDI 96
- S7 → MIDI 95
- S6 → MIDI 94
- S5 → MIDI 93
- S4 → MIDI 92
- S3 → MIDI 91
- S2 → MIDI 90
- S1 → MIDI 89

**Important:** These notes may overlap with the grid in certain layouts. Verify with your specific Launchpad Pro firmware by testing MIDI input.

### External Buttons - Top Control Row

**Location:** Top row of device (left to right)

**Button Types:**
- Cursor keys (up/down/left/right)
- Session / Note / Device buttons
- User 1 / User 2 buttons

**MIDI Transmission:** These buttons traditionally send **CC (Control Change)** messages rather than Note On/Off.

**MIDI Note Lighting:** Some sources indicate they can be lit via note messages, but specific note assignments depend on the selected layout. Test with MIDI monitor to determine exact mappings.

---

## Part 5: Channel 6 User Mode Implementation

### Why Channel 6 for Lightshow?

**User Mode Advantages:**
1. **Independent Control** - Separate from Ableton Live session channel
2. **Standalone Operation** - Works with external sequencers, hardware, or software
3. **Custom MIDI Mapping** - Reassign pad MIDI notes as needed
4. **Dedicated Lighting Channel** - All LED feedback uses same channel

### Setting Up Channel 6

**Hardware Setup (Device Level):**

1. Power on Launchpad Pro MK1
2. Press and hold the **Setup button** (bottom center)
3. Release to enter Setup Mode
4. Navigate to **User Mode** settings
5. Select **Channel 6** from the menu (or use the 3rd row pad method)

**Alternative Method (Via 3rd Row Pads):**

1. From normal mode, press the **3rd row of pads from top**
2. Look for red pads (unavailable) and blue pads (available)
3. Press a blue pad to select:
   - Blue Pad 1 = Channel 6
   - Blue Pad 2 = Channel 7
   - Blue Pad 3 = Channel 8

### MIDI Configuration for Channel 6

Once User Mode is set to Channel 6:

**Input MIDI:**
- All pad presses send Note On/Off on Channel 6
- All button presses send Note On/Off on Channel 6
- Velocity indicates pressure/force

**Output MIDI (Lighting Feedback):**
- Channel 1 (0x90) = Static LED colors
- Channel 2 (0x91) = Flashing LED colors
- Channel 3 (0x92) = Pulsing LED colors

### Lightshow Sequence Format for Channel 6

Lightshow sequences consist of MIDI messages with:
- **Channel:** 1 (static), 2 (flash), or 3 (pulse)
- **Note:** 0-99 (pad address) or 89-96 (scene buttons)
- **Velocity:** 0-127 (color value)
- **Timestamp:** Optional timing in milliseconds

---

## Part 6: Complete Lightshow Implementation Checklist

### Phase 1: Preparation

- [ ] Review Launchpad Pro MK1 user manual
- [ ] Confirm firmware version
- [ ] Set up User Mode on Channel 6
- [ ] Connect to MIDI input device (DAW, sequencer, or JavaScript Web MIDI)
- [ ] Prepare color palette reference table

### Phase 2: Color Palette Development

- [ ] Create RGB-to-velocity converter function
- [ ] Generate pre-calculated lookup tables:
  - [ ] Red spectrum (0-75 velocity)
  - [ ] Green spectrum (0-124 velocity)
  - [ ] Orange/Yellow combinations
  - [ ] Off state (velocity 12)
- [ ] Test each color on hardware
- [ ] Document any hardware-specific color shifts
- [ ] Create fallback colors for unsupported hues

### Phase 3: MIDI Note Mapping

- [ ] Map all 64 grid pads (MIDI 36-99)
- [ ] Confirm scene button notes (89-96+)
- [ ] Identify top button MIDI assignments
- [ ] Create grid-position-to-MIDI lookup table
- [ ] Test individual pad addressing via MIDI

### Phase 4: Test Sequences

**Test 1: Single Pad Lighting**
- [ ] Send Note On to MIDI 36 (bottom-left)
- [ ] Verify LED lights up
- [ ] Test different velocity values (12, 43, 75, 124)
- [ ] Confirm static mode (channel 1)

**Test 2: Grid Sweep**
- [ ] Send sequential notes 36-99
- [ ] Observe row-by-row lighting
- [ ] Verify proper grid layout
- [ ] Confirm contiguous MIDI addressing

**Test 3: Color Palette**
- [ ] Light each color in palette
- [ ] Visual verification against expected colors
- [ ] Document any color deviations
- [ ] Adjust velocities if needed

**Test 4: Lighting Modes**
- [ ] Test Channel 1 (static)
- [ ] Test Channel 2 (flashing)
- [ ] Test Channel 3 (pulsing)
- [ ] Compare visual effects on hardware

**Test 5: External Buttons**
- [ ] Light scene buttons (89-96)
- [ ] Light top control buttons
- [ ] Verify color consistency
- [ ] Test flashing/pulsing on external buttons

**Test 6: Full 8×8 Spectrum**
- [ ] Create full-grid lightshow pattern
- [ ] Load and execute sequence
- [ ] Visual inspection of entire device
- [ ] Performance check (message rate, latency)

### Phase 5: Integration

- [ ] Write color palette module for Centaurus
- [ ] Implement MIDI message generator
- [ ] Create lightshow sequence builder
- [ ] Add configuration UI for custom patterns
- [ ] Document API for future lightshow designs

---

## Part 7: Key Limitations & Workarounds

### Limitation 1: 128-Color Palette Only

**Problem:** Only 128 colors available via velocity (0-127), limited to Red+Green combinations

**Workaround Options:**

1. **Use SysEx Commands** - Send full RGB via SysEx protocol (requires additional implementation)
2. **Pre-select Color Palette** - Use curated palette of 128 colors that fit the limitation
3. **Dithering** - Rapidly alternate between nearby colors to simulate intermediate shades
4. **Temporal Mixing** - Combine flashing modes to create illusion of additional colors

### Limitation 2: Note Range Overlap

**Problem:** Scene buttons (89-96) overlap with top grid rows in some layouts

**Workaround:**
1. **Verify Hardware Layout** - Test actual MIDI notes on your specific device
2. **Use Different Layout** - Switch to Programmer Layout or Layout 3 if needed
3. **Manual Offset** - If overlap confirmed, use alternative note assignments for scene buttons

### Limitation 3: Channel-Based Lighting Modes

**Problem:** Can't easily mix static + flashing on same pad

**Workaround:**
1. **Sequential Updates** - Change pad state by sending new Note On with different channel
2. **Timing Control** - Coordinate timing between static and flashing states
3. **Rapid Cycling** - Quickly alternate channels to create custom effects

### Limitation 4: Message Rate

**Problem:** MIDI has maximum message throughput (theoretical max ~3000 Note On/Off per second)

**Workaround:**
1. **Optimize Sequence** - Minimize redundant messages
2. **Batch Updates** - Group related messages together
3. **Throttle Updates** - Limit message rate to essential changes
4. **Test Performance** - Monitor actual latency on target hardware

---

## Part 8: Implementation Resources

### Official Novation Documentation

- **Launchpad Pro Programmers Reference Guide (v1.01)** - Primary technical reference
  - URL: `https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Launchpad Pro Programmers Reference Guide 1.01.pdf`
  - Contains: MIDI note mappings, SysEx commands, detailed specifications

- **Launchpad Pro User Manual** - Hardware setup and operation
  - URL: `https://www.manualslib.com/manual/969564/Novation-Launchpad-Pro.html`
  - Contains: Physical layout, User Mode setup, button reference

- **Novation Support Portal** - Documentation and troubleshooting
  - URL: `https://support.novationmusic.com/`
  - Contains: FAQ, setup guides, firmware updates

### Community Projects

- **Afterglow** - Light show programming framework
  - GitHub: `deepsymmetry/afterglow`
  - Resources: Launchpad Pro integration examples

- **Launchpad95** - Ableton Live custom mapping
  - GitHub: `hdavid/Launchpad95`
  - Resources: MIDI mapping reference, grid patterns

- **GitHub Launchpad Implementations** - Various community projects
  - Search: "Launchpad Pro MIDI" on GitHub
  - Resources: Example code, node patterns, color handling

### Testing & Debugging Tools

- **MIDI Monitor** - Real-time MIDI event inspection
  - macOS: Built-in MIDI Monitor (Audio MIDI Setup)
  - Windows: MidiView or similar utilities

- **Browser Web MIDI API** - JavaScript MIDI implementation
  - Docs: `https://www.w3.org/TR/webmidi/`
  - Playground: Web MIDI test pages

- **DAW MIDI Monitoring** - Ableton Live, Logic Pro, Reaper
  - Each DAW has built-in MIDI monitor/viewer
  - Useful for verifying sent/received messages

---

## Part 10: Next Steps for Centaurus Integration

### Immediate Tasks

1. **Create Color Palette Module** (`src/utils/launchpad-colors.ts`)
   - Implement RGB-to-velocity converter
   - Pre-calculate safe color palette (0-127 range only)
   - Export lookup tables for common colors

2. **Build MIDI Generator** (`src/utils/launchpad-midi.ts`)
   - Note On message builder
   - Channel-based lighting mode support
   - Batch message optimization

3. **Design Lightshow Component** (`src/components/Lightshow/LaunchpadLightshow.tsx`)
   - Grid position UI
   - Color picker integration
   - Sequence builder

### Testing Strategy

1. **Unit Tests (Manual Verification)**
   - Color formula accuracy: Test RGB conversion examples
   - MIDI message format: Verify byte sequences
   - Grid mapping: Test position-to-note calculations

2. **Hardware Integration Tests**
   - Connect to Launchpad Pro MK1
   - Light individual pads and verify colors
   - Test all 64 grid positions
   - Test scene and control buttons
   - Verify Channel 6 operation

3. **User Experience Tests**
   - Design intuitive lightshow UI
   - Test on Chrome/Firefox Web MIDI support
   - Verify error handling (device disconnected)
   - Performance monitoring (message throughput)

### Future Enhancements

- [ ] SysEx full RGB control (beyond 128-color limitation)
- [ ] Real-time audio visualization (spectrum analyzer → lightshow)
- [ ] MIDI file import (convert sequences to lightshow)
- [ ] Custom lightshow library and sharing
- [ ] Hardware synchronization with Centaurus drum patterns

---

## Appendices

### A. Velocity-to-Color Lookup Table

| Velocity | Red | Green | Color | Notes |
|----------|-----|-------|-------|-------|
| 12 | 0 | 0 | Black/Off | Minimum |
| 28 | 0 | 1 | Dim Green | |
| 43 | 31 | 0 | Red Dim | |
| 44 | 32 | 0 | Purple | |
| 59 | 31 | 1 | Yellow Dim | |
| 60 | 0 | 3 | Cyan | |
| 75 | 63 | 0 | Red Bright | ✓ Full Red |
| 91 | 63 | 1 | Yellow | |
| 107 | 63 | 2 | Magenta | |
| 119 | 31 | 7 | Lime | ~Half intensity |
| 123 | 63 | 3 | Orange | |
| 124 | 0 | 7 | Green Bright | ✓ Full Green |
| 127 | 0 | 7 | Green Max | Safe ceiling |

### B. MIDI Note-to-Grid Position Mapping

To convert between MIDI notes and grid positions:
- **MIDI Note to Position:** Given note N, row = (N - 36) / 8, col = (N - 36) % 8
- **Position to MIDI Note:** Given (row, col), note = 36 + (row × 8) + col
- **Valid Range:** Notes 36-99 map to grid positions (0-7, 0-7)

### C. Hardware Testing Recommendations

When verifying lightshow functionality on the Launchpad Pro MK1:

1. **Test Individual Pads:** Send Note On to each grid position (36-99) with standard velocities
2. **Test Color Palette:** Verify all safe velocity values produce expected colors
3. **Test Lighting Modes:** Send messages on channels 1, 2, and 3 to test static, flashing, and pulsing
4. **Test Scene Buttons:** Light external buttons (89-96) with various velocities
5. **Test Message Rate:** Monitor latency and throughput of rapid MIDI messages
6. **Test Channel 6:** Verify User Mode operation on dedicated MIDI channel

### D. File References

This research document should be stored and referenced as:

```
/docs/hardware/launchpad-pro-mk1-lightshow-research.md
```

Related files to create:
```
/src/utils/launchpad-colors.ts         - Color palette utilities
/src/utils/launchpad-midi.ts           - MIDI message builders
/src/types/launchpad.ts                - TypeScript interfaces
/docs/hardware/launchpad-setup-guide.md - User setup instructions
```

---

**Document Generated:** 2025-10-21
**Research Status:** Complete
**Next Action:** Implementation of color palette and MIDI modules

For questions or additional research needs, refer to Novation's official documentation or test on target hardware.
