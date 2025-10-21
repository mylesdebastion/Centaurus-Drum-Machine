# Novation Launchpad Pro Integration Research Prompt

**Generated:** 2025-10-21
**Priority:** High (First user story for drum sequencing and isometric lanes)
**Hardware Available:** Launchpad Pro Mk3 (USB-C) + Launchpad Pro 2015

---

## Research Objective

**Primary Goal:** Investigate technical requirements, protocols, and implementation patterns for bidirectional Web MIDI communication with the **Novation Launchpad Pro Mk3** (USB-C, latest model) to enable drum sequencing and isometric note visualization in the Audiolux App.

**Secondary Goal:** Document protocol compatibility pathways with the **original Launchpad Pro (2015)** to enable graceful degradation or feature parity across both devices.

**Key Decision to Inform:** Architectural design for Launchpad Pro controller support, including LED control, button input mapping, layout orientation switching, and multi-device compatibility strategy.

---

## Background Context

### Current State

**Proven Implementation:**
- Audiolux App successfully integrates **APC40 drum sequencer** (reference: `research/apc40-drum-sequencer (3).html`)
- Web MIDI API implementation proven for hardware controller communication
- Existing patterns: Connection management, LED queue optimization, color mapping systems (spectrum/chromatic/harmonic)

**Existing Modules:**
- Drum machine sequencing (8-step patterns, 5 tracks)
- Isometric note lanes (progressive reveal, rhythm education)
- Rhythm Patterns lesson (educational context)

### Integration Requirements

**Hardware Coverage:**
- **Primary Target:** Launchpad Pro Mk3 (USB-C, slim version)
- **Secondary Target:** Launchpad Pro 2015 (original version)
- **Goal:** Support both devices with single codebase (graceful feature detection)

**8x8 RGB Grid:**
- Full bidirectional control (send visualizations, receive button presses)
- Support for drum sequencer patterns (8 steps × 5+ tracks)
- Support for isometric note visualization (vertical/horizontal layout)
- Real-time LED updates synchronized with audio playback

**Control Buttons:**
- **Navigation:** Up/Down, Left/Right arrows
- **Transport:** Play/Stop buttons
- **App Features:** Control Audiolux modules (sequencer, isometric lanes)

**First User Story:**
- Display and input drum sequences from existing modules
- Program isometric note lanes with hardware controller
- Toggle between horizontal and vertical layout (architecture team will implement switching logic)

### Reference Implementation (APC40)

Proven patterns from `research/apc40-drum-sequencer (3).html`:
- **Connection Pattern:** Web MIDI API device detection and SysEx initialization
- **LED Control:** Queue-based update system (8 LEDs per batch, 5ms throttle)
- **Color Mapping:** Three modes (spectrum, chromatic, harmonic) with rainbow color palette
- **Input Handling:** Button press/release mapping with velocity tracking
- **Performance:** Efficient LED updates to avoid MIDI buffer overflow

---

## Research Questions

### PRIMARY QUESTIONS (Must Answer)

#### 1. Web MIDI Protocol - Launchpad Pro Mk3

**Question 1.1: Grid MIDI Mapping**
- What are the exact MIDI note numbers for the Launchpad Pro Mk3's 8x8 grid?
- How are rows and columns numbered (physical vs. MIDI note mapping)?
- Are note numbers contiguous or organized by row/column offsets?

**Question 1.2: Device Initialization**
- What SysEx messages are required to initialize the Launchpad Pro Mk3 into "Programmer Mode" or custom control mode?
- What is the complete initialization sequence (mode switch, LED clear, ready state)?
- Are there device handshake messages or confirmation responses?

**Question 1.3: RGB LED Control**
- What is the MIDI message format for setting RGB LED colors on the Mk3?
  - Is it velocity-based with indexed palette (0-127)?
  - Or full RGB SysEx (0-255 per channel)?
  - Or hybrid approach (basic velocity + extended SysEx)?
- What is the exact SysEx format for RGB control (if applicable)?
- Are there limitations on color resolution or palette size?

#### 2. LED Animation & Performance

**Question 2.1: Animation Modes**
- What LED animation modes are supported? (solid, pulse, blink, etc.)
- How are animation modes specified in MIDI messages?
- Can animations run independently on the device, or require continuous updates?

**Question 2.2: Update Throughput**
- What is the optimal LED update rate to avoid MIDI buffer overflow?
- What batch size and timing work best for smooth visualizations?
- Are there performance differences between Mk3 and 2015 models?

**Question 2.3: Synchronization**
- Can LED updates be synchronized with audio timing (MIDI clock)?
- What latency should be expected between MIDI send and LED change?

#### 3. Button Input Mapping

**Question 3.1: Control Buttons**
- What are the MIDI note numbers for:
  - Up/Down arrows
  - Left/Right arrows
  - Play/Stop buttons
  - Scene Launch buttons (if applicable)
  - User/Shift buttons (if applicable)

**Question 3.2: Input Event Format**
- How are button press/release events distinguished?
  - Note On/Off messages?
  - Velocity values (press = 127, release = 0)?
  - Separate MIDI channels?
- Are there velocity-sensitive pads (127 levels or binary on/off)?

**Question 3.3: Additional Inputs**
- What other buttons/controls are available on the Mk3?
- Can side LED strips be controlled independently?
- Are there encoders, faders, or other input types?

#### 4. Device Identification & Compatibility

**Question 4.1: Device Detection**
- What device name(s) does the Launchpad Pro Mk3 report via Web MIDI API?
  - Example: `MIDIAccess.inputs/outputs` device name strings
- How can the app differentiate between Mk3 and 2015 models?
- Are there unique device identifiers (manufacturer ID, device ID)?

**Question 4.2: Protocol Differences**
- What are the key protocol differences between Launchpad Pro Mk3 and 2015?
- Are MIDI note mappings identical or different?
- Do both models support the same RGB color control method?
- What features are exclusive to Mk3?

**Question 4.3: Backward Compatibility**
- Can a single implementation support both Mk3 and 2015 models?
- What feature detection logic is required?
- Are there graceful degradation strategies for older hardware?

#### 5. Performance & Browser Compatibility

**Question 5.1: Web MIDI API Support**
- Are there known compatibility issues with specific browsers/OS combinations?
  - Chrome/Edge on Windows/Mac/Linux?
  - Firefox/Safari (if Web MIDI is supported)?
- What are recommended browser versions?

**Question 5.2: Throughput & Latency**
- What is the maximum LED update throughput before latency/jitter occurs?
- How does performance compare to APC40 (reference implementation)?
- Are there USB bandwidth considerations (USB-C vs. older USB)?

**Question 5.3: Best Practices**
- What are recommended practices for maintaining responsive input while updating visualizations?
- Should LED updates be throttled, batched, or queued?
- Are there timing considerations for SysEx messages vs. Note On/Off?

---

### SECONDARY QUESTIONS (Nice to Have)

#### 6. Existing Implementation Patterns

**Question 6.1: Open-Source Libraries**
- Are there JavaScript/TypeScript libraries for Launchpad Pro control?
  - npm packages: `launchpad-pro`, `launchpad`, `node-launchpad`?
  - GitHub repositories with Web MIDI integration?
- What is the quality/maintenance status of existing libraries?

**Question 6.2: Visualization Examples**
- What visualization techniques have been successfully implemented?
  - Audio reactive visualizations
  - Sequencer grids (drum machines, step sequencers)
  - Keyboard/note layouts (piano, isometric)
- Are there CodePen/JSFiddle demos of Launchpad Web MIDI integration?

**Question 6.3: Color Mapping Strategies**
- Are there documented color palettes for music applications?
- What RGB values map to musically meaningful colors (drum kits, note pitches)?
- How do professional applications (Ableton Live) use colors on Launchpad?

#### 7. Advanced Features

**Question 7.1: Velocity Sensitivity**
- Do the Launchpad Pro pads support velocity-sensitive input?
- What is the velocity resolution (0-127 or quantized levels)?
- Can velocity be used for dynamic input (e.g., accent notes, volume control)?

**Question 7.2: Side LED Strips**
- Can the side LED strips (scene launch row) be controlled independently?
- What MIDI notes/messages control the side LEDs?
- Can they be used for mode indicators or timeline visualization?

**Question 7.3: Power & Resource Usage**
- What is the power consumption impact of full RGB grid usage?
- Are there thermal considerations for sustained LED usage?
- Does USB-C (Mk3) provide more power/stability than older USB (2015)?

#### 8. User Experience Patterns

**Question 8.1: DAW Layout Conventions**
- How do popular DAWs (Ableton Live, FL Studio) map drum kits to the 8x8 grid?
- What are common timeline orientations (horizontal vs. vertical)?
- Are there established button mapping conventions for transport controls?

**Question 8.2: Color-Coding Standards**
- Are there industry-standard colors for drum instruments?
  - Example: Kick = red, Snare = blue, Hi-hat = green?
- How do music educators use color for rhythm visualization?

**Question 8.3: Orientation Best Practices**
- When is horizontal layout preferred vs. vertical?
- How do users mentally map physical grid orientation to musical concepts?
- Are there accessibility considerations for color-blind users?

---

## Research Methodology

### Information Sources (Prioritized)

#### 1. Official Documentation (HIGHEST PRIORITY)

- **Novation Launchpad Pro Mk3 Programmer's Reference Manual** (PDF)
- **Novation Launchpad Pro (2015) Programmer's Reference Manual** (PDF)
- **Novation Developer Resources:**
  - GitHub: `novationmusic` organization repositories
  - Developer forums: https://support.novationmusic.com/hc/en-gb/community/topics
  - MIDI implementation charts and SysEx specifications
- **MIDI Manufacturers Association (MMA):**
  - SysEx message format standards
  - Web MIDI API best practices

#### 2. Open-Source Projects (HIGH PRIORITY)

- **GitHub Repositories:**
  - Search: `launchpad pro` + `web midi` + `javascript`
  - Search: `launchpad mk3` + `typescript` + `led control`
  - Example repos: `launchpad-mini`, `launchpad.js`, `node-launchpad`
- **npm Packages:**
  - Search: `launchpad` + `midi` on npmjs.com
  - Review package documentation and code examples
- **Web Demos:**
  - CodePen: Search `launchpad web midi`
  - JSFiddle: Launchpad integration examples
  - Observable: Interactive Web MIDI notebooks

#### 3. Community Knowledge (MEDIUM PRIORITY)

- **Novation Forums:**
  - Search: "Web MIDI API" + "Launchpad Pro Mk3"
  - Search: "Programmer Mode" + "RGB control"
- **Reddit:**
  - r/Novation: Controller integration discussions
  - r/WeAreTheMusicMakers: Hardware controller threads
  - r/ableton: Launchpad usage patterns
- **Stack Overflow:**
  - Tag: `web-midi` + `launchpad`
  - Questions about protocol implementation

#### 4. Comparable Implementations (REFERENCE)

- **Existing APC40 Implementation:**
  - Analyze patterns in `research/apc40-drum-sequencer (3).html`
  - Identify reusable code patterns
- **LUMI Keys Integration:**
  - Review any existing research on LUMI controller integration
  - Compare RGB LED control approaches
- **Other Grid Controllers:**
  - Ableton Push (similar 8x8 grid + RGB)
  - Monome Grid (LED control patterns)

### Analysis Frameworks

#### 1. Protocol Compatibility Matrix

**Comparison Dimensions:**
- MIDI note ranges (grid, control buttons)
- RGB color control methods (velocity vs. SysEx)
- Initialization sequences (SysEx messages)
- Animation capabilities (solid, pulse, blink)
- Performance characteristics (update rate, latency)

**Output:** Table comparing Launchpad Pro Mk3 vs. 2015 vs. APC40

#### 2. Feature Feasibility Assessment

**Evaluation Criteria:**
- **RGB Color Resolution:** Palette size, color accuracy, visual quality
- **Input Latency:** Button press → app response time
- **Visualization Complexity:** How many LEDs can update per frame (60fps target)?
- **Cross-Device Compatibility:** Shared vs. device-specific code paths

**Output:** Feasibility ratings (High/Medium/Low) for each feature

#### 3. Implementation Pattern Analysis

**Code Pattern Review:**
- **Controller Class Architecture:** Connection, LED control, input handling
- **Queue-Based Updates:** Batch size, throttling, priority queues
- **Color Mode Systems:** Spectrum, chromatic, harmonic mapping strategies
- **Device Abstraction:** Shared interface for multiple hardware controllers

**Output:** Recommended architecture with code scaffolding

### Data Requirements

**Quality Standards:**
- **Recency:** Prioritize Launchpad Pro Mk3 documentation (2020+)
- **Credibility:** Official Novation sources > verified open-source projects > community posts
- **Completeness:** Must include MIDI note mappings, SysEx initialization, RGB color format
- **Verifiability:** Prefer code examples and testable specifications over descriptions

---

## Expected Deliverables

### EXECUTIVE SUMMARY (1-2 pages)

#### 1. Feasibility Assessment

**Primary Question:**
- Can the Launchpad Pro Mk3 achieve feature parity with APC40 implementation? (Yes/No + rationale)

**Development Complexity:**
- Estimated effort: Low/Medium/High
- Key technical challenges identified
- Required expertise (Web MIDI, SysEx, RGB color mapping)

**Device Compatibility:**
- Can Mk3 and 2015 models share a single implementation? (Yes/No + strategy)
- Feature parity vs. graceful degradation approach

**Key Technical Risks:**
- Browser compatibility issues
- Performance limitations (LED update rate, latency)
- Color palette restrictions
- Protocol differences between Mk3 and 2015

#### 2. Critical Technical Specs

**MIDI Note Mapping:**
- 8x8 grid note range (e.g., 0x00-0x3F)
- Control button notes (Up/Down/Left/Right/Play/Stop)
- Side LED strip notes (if applicable)

**RGB Color Control:**
- Method: Velocity-indexed palette vs. RGB SysEx
- Message format: Exact MIDI bytes/SysEx structure
- Color resolution: 128 colors vs. 16.7M RGB

**Device Initialization:**
- Required SysEx messages (mode switch, LED clear)
- Initialization sequence with timing
- Device identification strings (Web MIDI API names)

#### 3. Recommended Implementation Approach

**Controller Class Architecture:**
- Extend APC40 pattern vs. refactor for shared abstraction?
- Device-specific subclasses vs. feature detection?

**LED Update Strategy:**
- Batch size (8 LEDs? 16 LEDs? Full grid?)
- Throttling interval (5ms? 16ms for 60fps?)
- Priority queue for timeline vs. static visualization?

**Color Mapping System:**
- Reuse existing spectrum/chromatic/harmonic modes?
- Adapt to Launchpad palette (if velocity-indexed)?
- New color mapping strategies for improved visual quality?

**Multi-Device Support:**
- Feature detection at connection time
- Graceful degradation for 2015 model
- User messaging for unsupported features

---

### DETAILED ANALYSIS

#### Section 1: Device Communication Protocol

**1.1 MIDI Note Mapping Table**

Complete table with 3 columns:
- **Physical Location:** Row/Column (e.g., "Row 1, Column 1")
- **MIDI Note Number:** Hex and decimal (e.g., "0x00 (0)")
- **Purpose:** Grid pad, control button, or side LED

**Format:**
```
| Physical Location    | MIDI Note | Purpose          |
|---------------------|-----------|------------------|
| Grid: Row 1, Col 1  | 0x00 (0)  | Sequencer Step 1 |
| Grid: Row 1, Col 2  | 0x01 (1)  | Sequencer Step 2 |
| ...                 | ...       | ...              |
| Up Arrow            | 0x68 (104)| Navigation       |
| Play Button         | 0x73 (115)| Transport        |
```

**1.2 SysEx Message Documentation**

**Initialization Sequence:**
```
Step 1: Enter Programmer Mode
SysEx: [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x21, 0x01, 0xF7]
Purpose: Switch device to custom control mode
Expected Response: [confirmation bytes if applicable]

Step 2: Clear All LEDs
SysEx: [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x0E, 0x00, 0xF7]
Purpose: Turn off all LEDs to known state

Step 3: Set Color Mode (if applicable)
SysEx: [0xF0, ...]
Purpose: Configure RGB vs. palette mode
```

**RGB LED Control (if SysEx):**
```
Format: [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x0B, note, red, green, blue, 0xF7]
Example: Set note 0x00 to red (255, 0, 0)
Message: [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x0B, 0x00, 0xFF, 0x00, 0x00, 0xF7]
```

**1.3 Device Detection Patterns**

**Web MIDI API Device Names:**
```javascript
// Expected device names for detection
const DEVICE_NAMES_MK3 = [
  'Launchpad Pro MK3',
  'LPProMK3 MIDI',
  // Other variations...
];

const DEVICE_NAMES_2015 = [
  'Launchpad Pro',
  'LPPro MIDI',
  // Other variations...
];
```

**1.4 Code Examples from Reference Implementations**

Include snippets showing:
- Connection establishment
- SysEx initialization
- LED color setting
- Button input handling

---

#### Section 2: RGB LED Control

**2.1 Color Format Specification**

**Method 1: Velocity-Indexed Palette**
- Palette size: 128 colors (0-127)
- Color mapping table: Velocity value → RGB color
- Message format: `[0x90 | channel, note, velocity]`
- Example palette (if available from documentation)

**Method 2: Full RGB SysEx**
- Color resolution: 16.7M colors (0-255 per channel)
- Message format: SysEx with R/G/B bytes
- Performance implications: Larger messages, slower updates?

**Recommendation:** Which method to use for Audiolux App and why?

**2.2 Available LED Animation Modes**

| Mode         | Description                | MIDI Message Format           |
|--------------|----------------------------|-------------------------------|
| Solid        | Static color               | `[0x90, note, color]`         |
| Pulse        | Breathing animation        | `[0x91, note, color]` (?)     |
| Blink        | On/off toggle              | `[0x92, note, color]` (?)     |

**2.3 Performance Benchmarks**

**LED Update Rate:**
- Theoretical max: MIDI bandwidth / message size
- Practical max: Tested update rate without jitter
- Recommended rate: Safe update frequency for smooth visualization

**Latency Measurements:**
- MIDI send to LED change: X ms
- Input button press to app response: Y ms
- Comparison to APC40: Better/same/worse?

**2.4 Color Palette Tables**

If using velocity-indexed palette, provide complete table:

| Velocity | Hex RGB | Color Name       | Musical Use Case       |
|----------|---------|------------------|------------------------|
| 5        | #FF0000 | Red              | Kick drum, downbeat    |
| 13       | #FFDD00 | Yellow           | Snare, accent notes    |
| 21       | #44FF44 | Green            | Hi-hat, steady rhythm  |
| ...      | ...     | ...              | ...                    |

---

#### Section 3: Button Input Handling

**3.1 Input Event Format**

**Note On/Off Structure:**
```javascript
// Button Press
[command, note, velocity]
[0x90, 0x68, 127] // Up arrow pressed

// Button Release
[command, note, velocity]
[0x80, 0x68, 0]   // Up arrow released
// OR
[0x90, 0x68, 0]   // Note On with velocity 0 (alternative release format)
```

**3.2 Control Button MIDI Notes**

| Button      | MIDI Note | Hex   | Event Type        |
|-------------|-----------|-------|-------------------|
| Up Arrow    | 104       | 0x68  | Note On/Off       |
| Down Arrow  | 105       | 0x69  | Note On/Off       |
| Left Arrow  | 106       | 0x6A  | Note On/Off       |
| Right Arrow | 107       | 0x6B  | Note On/Off       |
| Play        | 115       | 0x73  | Note On/Off       |
| Stop        | 116       | 0x74  | Note On/Off (?)   |

**3.3 Additional Buttons & Use Cases**

| Button           | MIDI Note | Potential App Feature           |
|------------------|-----------|----------------------------------|
| Scene Launch 1-8 | ...       | Track selection, layer switching |
| User Button      | ...       | Mode toggle (sequencer/isometric)|
| Shift Button     | ...       | Secondary functions              |

**3.4 Velocity Sensitivity**

- **Question:** Do grid pads send velocity values 0-127 or binary on/off?
- **Testing:** How to verify velocity sensitivity in browser?
- **Use Case:** Can velocity control note accent/volume in drum sequencer?

---

#### Section 4: Implementation Patterns

**4.1 Architecture Comparison: APC40 vs. Launchpad Pro**

**Similarities:**
- Web MIDI API connection pattern
- Queue-based LED updates
- Button input event handling
- Color mapping system (spectrum/chromatic/harmonic)

**Differences:**
- RGB control method (velocity palette vs. SysEx)
- Device initialization (different SysEx messages)
- Grid size (APC40: 5×8, Launchpad: 8×8)
- Additional controls (Launchpad: more buttons, side LEDs)

**Recommendation:**
- **Refactor:** Create shared `HardwareController` base class?
- **Extend:** `APC40Controller` and `LaunchpadProController` subclasses?
- **Feature Detection:** Runtime detection of capabilities?

**4.2 Code Scaffolding: LaunchpadProController Class**

```typescript
/**
 * Launchpad Pro Controller (Mk3 and 2015 support)
 * Based on APC40Controller pattern
 */
class LaunchpadProController {
  input: MIDIInput | null = null;
  output: MIDIOutput | null = null;
  connected: boolean = false;
  modelVersion: 'mk3' | '2015' | 'unknown' = 'unknown';

  ledStates: Map<number, number> = new Map();
  updateQueue: Array<{ note: number; color: number }> = [];

  // Connection & Initialization
  async connect(): Promise<boolean> {
    // Detect device via Web MIDI API
    // Identify model version (Mk3 vs. 2015)
    // Send SysEx initialization sequence
  }

  async initializeDevice(): Promise<void> {
    // Enter Programmer Mode
    // Clear all LEDs
    // Set color mode (if applicable)
  }

  // LED Control
  setLED(note: number, color: number | RGB): void {
    // Convert color to appropriate format (velocity vs. SysEx)
    // Queue update or send immediately
  }

  queueLEDUpdate(note: number, color: number): void {
    // Add to queue with throttling
  }

  async processUpdateQueue(): Promise<void> {
    // Batch updates (8 LEDs per 5ms?)
    // Send MIDI messages
  }

  clearAllLEDs(): void {
    // Turn off all LEDs (0x00-0x3F + controls)
  }

  // Input Handling
  handleMIDIMessage(event: MIDIMessageEvent): void {
    // Parse Note On/Off events
    // Trigger callbacks for button presses
  }

  onButtonPress?: (note: number, velocity: number) => void;
  onButtonRelease?: (note: number) => void;

  // Utility
  disconnect(): void {
    // Clear LEDs and close MIDI connection
  }
}
```

**4.3 Best Practices for Web MIDI API**

**Browser Compatibility:**
- Chrome/Edge: Full support (tested versions)
- Firefox: Experimental flag required?
- Safari: Limited/no support?

**Error Handling:**
```javascript
try {
  const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
} catch (error) {
  if (error.name === 'SecurityError') {
    // User denied MIDI access
  } else if (error.name === 'NotSupportedError') {
    // Browser doesn't support Web MIDI API
  }
}
```

**Connection Resilience:**
- Detect device disconnection (`statechange` event)
- Attempt auto-reconnect on device re-plug
- Graceful handling of MIDI buffer overflow

**4.4 Queue-Based LED Update Optimization**

**From APC40 Implementation:**
```javascript
// Batch size: 8 LEDs
// Throttle interval: 5ms
// Total throughput: ~1600 LEDs/second

async processUpdateQueue() {
  this.isProcessingQueue = true;

  while (this.updateQueue.length > 0) {
    const batch = this.updateQueue.splice(0, 8);

    batch.forEach(({ note, color }) => {
      this.output.send([0x90, note, color]);
    });

    await new Promise(resolve => setTimeout(resolve, 5));
  }

  this.isProcessingQueue = false;
}
```

**Optimization Questions:**
- Is 8 LEDs per batch optimal for Launchpad Pro?
- Should throttle interval be adjusted for faster updates?
- Can we use SysEx for bulk LED updates (multiple LEDs in one message)?

---

#### Section 5: User Experience Considerations

**5.1 Layout Orientation Strategies**

**Horizontal Layout (Timeline Left-to-Right):**
```
[Step 1] [Step 2] [Step 3] [Step 4] [Step 5] [Step 6] [Step 7] [Step 8]
[Kick  ] [      ] [Kick  ] [      ] [Kick  ] [      ] [Kick  ] [      ]
[Snare ] [      ] [      ] [Snare ] [      ] [      ] [      ] [Snare ]
[HiHat ] [HiHat ] [HiHat ] [HiHat ] [HiHat ] [HiHat ] [HiHat ] [HiHat ]
```
- **Use Case:** Drum sequencer (time flows left-to-right)
- **Mapping:** Columns = time steps, Rows = instrument tracks

**Vertical Layout (Timeline Bottom-to-Top):**
```
[Note 8] [Note 8] ...
[Note 7] [Note 7] ...
[Note 6] [Note 6] ...
[Note 5] [Note 5] ...
[Note 4] [Note 4] ...
[Note 3] [Note 3] ...
[Note 2] [Note 2] ...
[Note 1] [Note 1] ...
```
- **Use Case:** Isometric note lanes (pitch flows bottom-to-top)
- **Mapping:** Rows = pitch lanes, Columns = time steps

**5.2 Color-Coding Conventions**

**Drum Sequencer:**
- Kick: Red/orange (low frequency, foundational)
- Snare: Blue/cyan (mid frequency, accent)
- Hi-hat: Green/yellow (high frequency, steady rhythm)
- Clap: Purple/magenta (mid frequency, accent)
- Tom: Warm colors (orange/yellow gradient by pitch)

**Isometric Note Lanes:**
- Spectrum mode: Frequency-based (low = red, high = violet)
- Chromatic mode: Pitch class-based (C = red, C# = orange, etc.)
- Harmonic mode: Circle of fifths (F = warm, B = cool)

**5.3 DAW Implementation Comparison**

**Ableton Live + Launchpad Pro:**
- Session View: 8×8 grid = 64 clip slots
- Drum Rack: 4×4 grid = 16 pads (bottom-left quadrant)
- Note Mode: Chromatic keyboard layout
- Color coding: Clip status (empty, stopped, playing, recording)

**Relevance to Audiolux:**
- Learn from established patterns (muscle memory)
- Adapt conventions for educational context
- Ensure intuitive layout for new users

**5.4 Accessibility & Visual Clarity**

**Color-Blind Considerations:**
- Use brightness/saturation in addition to hue
- Provide alternative visual indicators (blink patterns, brightness levels)
- Test color palettes with color-blindness simulators

**Contrast & Readability:**
- Ensure sufficient contrast for LED visibility in daylight
- Use distinct colors for active vs. inactive states
- Timeline indicator: High-contrast white/yellow

---

### SUPPORTING MATERIALS

#### 1. MIDI Note Mapping Diagram

**Visual Grid Representation:**
```
Launchpad Pro Mk3 - Physical Layout (Top View)

        Col 1  Col 2  Col 3  Col 4  Col 5  Col 6  Col 7  Col 8   [Scene 1]
Row 8   [81]   [82]   [83]   [84]   [85]   [86]   [87]   [88]    [ ? ]
Row 7   [71]   [72]   [73]   [74]   [75]   [76]   [77]   [78]    [ ? ]
Row 6   [61]   [62]   [63]   [64]   [65]   [66]   [67]   [68]    [ ? ]
Row 5   [51]   [52]   [53]   [54]   [55]   [56]   [57]   [58]    [ ? ]
Row 4   [41]   [42]   [43]   [44]   [45]   [46]   [47]   [48]    [ ? ]
Row 3   [31]   [32]   [33]   [34]   [35]   [36]   [37]   [38]    [ ? ]
Row 2   [21]   [22]   [23]   [24]   [25]   [26]   [27]   [28]    [ ? ]
Row 1   [11]   [12]   [13]   [14]   [15]   [16]   [17]   [18]    [ ? ]

        [ ? ]  [ ? ]  [ ? ]  [ ? ]  [ ? ]  [ ? ]  [ ? ]  [ ? ]

Control Buttons:
[Up ↑] [Down ↓] [Left ←] [Right →] [Session] [Note] [Custom] [Capture]
[Play ▶] [Record ●] [Shift] [User] [Duplicate] [Quantize] [Delete] [FixedLength]

NOTE: Replace [ ? ] placeholders with actual MIDI note numbers from research.
```

#### 2. Code Scaffolding: Connection & Initialization

**File: `src/lib/controllers/LaunchpadProController.ts`**

```typescript
// Complete TypeScript implementation skeleton
// Based on APC40Controller pattern
// Includes:
// - Connection management
// - SysEx initialization
// - LED control methods
// - Input event handling
// - Color mapping utilities

export class LaunchpadProController implements HardwareController {
  // ... (full class implementation from Section 4.2)
}

// Color mapping functions
export const getLaunchpadColor = (
  note: number,
  velocity: number,
  mode: 'spectrum' | 'chromatic' | 'harmonic',
  trackIndex?: number
): number | RGB => {
  // Adapt from APC40 implementation
  // Return velocity value (0-127) or RGB object
};
```

**File: `src/lib/controllers/types.ts`**

```typescript
// Shared interface for all hardware controllers
export interface HardwareController {
  connect(): Promise<boolean>;
  disconnect(): void;
  setLED(note: number, color: number | RGB): void;
  clearAllLEDs(): void;
  onButtonPress?: (note: number, velocity: number) => void;
  onButtonRelease?: (note: number) => void;
}

export type RGB = { r: number; g: number; b: number };
export type ColorMode = 'spectrum' | 'chromatic' | 'harmonic';
```

#### 3. Comparison Matrix: APC40 vs. Launchpad Pro

| Feature                  | APC40              | Launchpad Pro Mk3  | Launchpad Pro 2015 | Implementation Notes        |
|--------------------------|--------------------|--------------------|--------------------|-----------------------------|
| Grid Size                | 5 rows × 8 cols    | 8 rows × 8 cols    | 8 rows × 8 cols    | Larger grid on Launchpad    |
| RGB Color Control        | Velocity palette   | ? (TBD)            | ? (TBD)            | Research required           |
| Color Resolution         | ~8 colors (basic)  | ? (TBD)            | ? (TBD)            | Research required           |
| SysEx Initialization     | Yes (mode switch)  | ? (TBD)            | ? (TBD)            | Research required           |
| MIDI Note Range (Grid)   | 0x00-0x27 (40 pads)| ? (TBD)            | ? (TBD)            | Research required           |
| Control Buttons          | Limited            | Many (arrows, etc.)| ? (TBD)            | More flexibility on LP      |
| Velocity Sensitivity     | No (on/off)        | ? (TBD)            | ? (TBD)            | Research required           |
| LED Animation Modes      | Solid, blink       | ? (TBD)            | ? (TBD)            | Research required           |
| Web MIDI Device Name     | "APC40"            | ? (TBD)            | ? (TBD)            | Research required           |
| Update Performance       | Good (5ms batches) | ? (TBD)            | ? (TBD)            | Benchmark required          |

**NOTE:** Fill in "? (TBD)" cells with research findings.

#### 4. Source Documentation

**Official Novation Resources:**
- Programmer's Reference Manual (Mk3): [URL or file path]
- Programmer's Reference Manual (2015): [URL or file path]
- Developer GitHub: https://github.com/novationmusic
- Support Forum: https://support.novationmusic.com/hc/en-gb

**Open-Source Projects:**
- [Project Name]: [GitHub URL] - [Brief description]
- [npm Package]: [npmjs.com URL] - [Version, maintenance status]

**Community Resources:**
- [Forum Thread Title]: [URL] - [Key insights]
- [Stack Overflow Question]: [URL] - [Relevant answer]

**Browser Compatibility:**
- Chrome: Version X+ (full Web MIDI support)
- Edge: Version Y+ (Chromium-based, full support)
- Firefox: Experimental flag required (as of version Z)
- Safari: Limited/no support (as of version W)

---

## Success Criteria

✅ **Research is successful if it provides:**

### 1. Complete MIDI Protocol Specification

**Developers can implement Launchpad Pro connection without trial-and-error:**
- All MIDI note numbers documented (8×8 grid + control buttons)
- Exact SysEx initialization sequence with byte-level detail
- RGB color control method clearly explained (velocity vs. SysEx)
- Code examples validate protocol documentation

### 2. Actionable Implementation Plan

**Architecture team can design controller integration layer:**
- Clear understanding of LED update performance constraints
- Recommended batch size and throttling intervals
- Device abstraction strategy for multi-controller support

**Developers know layout orientation requirements:**
- MIDI note mapping for horizontal vs. vertical grid orientation
- Color mapping strategies for different visualization modes

**UX team understands design constraints:**
- Color palette limitations (if velocity-indexed)
- Animation capabilities (solid, pulse, blink)
- Visual clarity recommendations

### 3. Risk Identification

**Browser/OS compatibility issues are documented:**
- Known working browser versions
- Workarounds for limitations
- Fallback strategies for unsupported browsers

**Performance limitations are quantified:**
- Maximum LED update rate (LEDs per second)
- Expected latency (MIDI send → LED change)
- Comparison to APC40 baseline

**Alternative approaches identified:**
- Backup plan if primary RGB method doesn't work
- Feature detection and graceful degradation
- Manual testing procedures for hardware validation

### 4. Code Reusability Assessment

**Clear understanding of which APC40 patterns can be reused:**
- Connection management (Web MIDI API)
- Queue-based LED updates (batch size, throttling)
- Color mapping system (spectrum/chromatic/harmonic)
- Input event handling (button press/release)

**Identification of new capabilities unique to Launchpad Pro:**
- Larger 8×8 grid (vs. APC40's 5×8)
- More control buttons (arrows, transport)
- Potentially better RGB color resolution
- Side LED strips (if controllable)

**Refactoring recommendations:**
- Create shared `HardwareController` interface
- Device-specific subclasses (`APC40Controller`, `LaunchpadProController`)
- Feature detection vs. device-specific code paths
- Testing strategy for multi-device support

---

## Timeline and Priority

**Priority:** HIGH (First user story for drum sequencing and isometric lanes)

### Suggested Phasing

**Phase 1: Core Protocol Research (IMMEDIATE - 2-3 hours)**
- MIDI note mappings (8×8 grid + control buttons)
- SysEx initialization sequence (Programmer Mode)
- RGB color control method (velocity vs. SysEx)
- Device identification (Web MIDI API device names)

**Phase 2: Implementation Patterns (FOLLOW-UP - 1-2 hours)**
- Open-source code examples (GitHub, npm packages)
- Performance benchmarks (LED update rate, latency)
- Color mapping strategies (spectrum/chromatic/harmonic)
- Queue optimization patterns

**Phase 3: UX Conventions & Advanced Features (NICE-TO-HAVE - 1 hour)**
- DAW layout conventions (Ableton Live, FL Studio)
- Color-coding standards (drum kits, note pitches)
- Velocity sensitivity (if supported)
- Side LED strip control

**Total Estimated Duration:** 4-6 hours for comprehensive investigation

---

## Next Steps After Research

### Architecture Team Handoff

**Use research findings to design:**
- **Controller Abstraction Layer:**
  - Shared `HardwareController` interface
  - Device-specific implementations (`APC40Controller`, `LaunchpadProController`)
  - Feature detection and capability negotiation

- **Layout Orientation System:**
  - Horizontal vs. vertical grid mapping logic
  - MIDI note translation layer (physical → logical coordinates)
  - User preference persistence (localStorage or settings)

- **LED Update Queue:**
  - Batch size and throttling strategy (based on performance benchmarks)
  - Priority queuing (timeline indicator vs. static visualization)
  - Update scheduling (60fps target for smooth animation)

### Development Team Preparation

**Prototype Implementation:**
1. **Create `LaunchpadProController` class** based on research findings
2. **Test Web MIDI connection** with physical Launchpad Pro Mk3
3. **Validate MIDI protocol** (note mappings, SysEx initialization, RGB control)
4. **Implement LED visualization** for drum sequencer grid
5. **Test input handling** (button presses, velocity sensitivity)

**Hardware Testing:**
- **Launchpad Pro Mk3 (USB-C):** Primary test device
- **Launchpad Pro 2015:** Compatibility validation
- **Cross-browser testing:** Chrome, Edge (Windows/Mac)

### Documentation

**Create Developer Resources:**
- **Hardware Integration Guide:** `/docs/hardware-integration/launchpad-pro.md`
  - Protocol specification (MIDI notes, SysEx, RGB control)
  - Code examples (connection, LED control, input handling)
  - Troubleshooting common issues

- **Controller Abstraction Design:** `/docs/architecture/controller-abstraction.md`
  - Interface definition (`HardwareController`)
  - Device detection and feature negotiation
  - Adding new controller support (tutorial)

- **Testing Procedures:** `/docs/hardware-integration/testing-procedures.md`
  - Manual testing checklist (LED visualization, input handling)
  - Cross-device compatibility matrix
  - Performance benchmarking methods

---

## Hardware Testing Strategy

**Advantage:** Access to both Launchpad Pro Mk3 (USB-C) and 2015 (original) models

### Testing Workflow

**Step 1: Protocol Validation (Mk3)**
1. Connect Launchpad Pro Mk3 to development machine
2. Run Web MIDI API device detection
3. Verify device name matches research findings
4. Send SysEx initialization sequence
5. Test LED control (single LED, full grid, batch updates)
6. Test input handling (grid pads, control buttons)
7. Benchmark performance (LED update rate, latency)

**Step 2: Compatibility Testing (2015)**
1. Connect Launchpad Pro 2015 to development machine
2. Verify device name differs from Mk3 (if applicable)
3. Test same initialization sequence
4. Identify protocol differences (if any)
5. Document feature parity or degradation

**Step 3: Cross-Device Validation**
1. Implement feature detection logic
2. Test device switching (Mk3 ↔ 2015) without code changes
3. Validate graceful degradation (if features differ)

### Validation Checklist

**Protocol Verification:**
- [ ] Web MIDI device detection works for both models
- [ ] SysEx initialization sequence successful
- [ ] LED color control functions correctly
- [ ] All control buttons send expected MIDI notes
- [ ] Grid pads send correct MIDI notes
- [ ] Velocity sensitivity works (if supported)

**Performance Benchmarks:**
- [ ] LED update rate meets 60fps target (960 LEDs/sec for full grid)
- [ ] No visual jitter or lag during animation
- [ ] Input latency < 20ms (button press → app response)
- [ ] Queue optimization prevents MIDI buffer overflow

**User Experience:**
- [ ] Colors are visually distinct and clear
- [ ] Timeline indicator is high-contrast and visible
- [ ] Layout orientation switching works smoothly
- [ ] Control buttons feel responsive and intuitive

---

## Research Execution Recommendations

### Preferred Execution Methods

**Option 1: Web Search with AI Research Assistant (RECOMMENDED)**
- Use this prompt with Claude, ChatGPT, or Perplexity
- Leverage web search capabilities to find official documentation
- Compile findings into structured deliverables

**Option 2: Manual Research + Structured Documentation**
- Use this prompt as a checklist/guide
- Research each section systematically
- Document findings in the deliverable format

**Option 3: Developer Community Inquiry**
- Post structured questions to Novation forums
- Share this prompt with Web MIDI developers on Reddit/Discord
- Compile responses into deliverable format

### Research Tips

**Prioritize Official Sources:**
- Novation Programmer's Reference Manuals are gold standard
- MIDI implementation charts are usually accurate
- Community sources should validate, not replace official docs

**Verify with Code:**
- Don't trust documentation blindly - test with real hardware
- Open-source projects can reveal undocumented behaviors
- Web MIDI console logging is essential for debugging

**Document Ambiguities:**
- If sources conflict, note the discrepancy
- Highlight areas requiring hardware testing
- Provide alternative approaches if uncertain

---

## Appendix: Questions for Clarification

**Before executing research, confirm:**

1. **Feature Priority:**
   - Is RGB color control essential, or can we start with basic palette?
   - Is velocity sensitivity required, or binary on/off sufficient?

2. **Compatibility Requirements:**
   - Must both Mk3 and 2015 have identical feature sets?
   - Is graceful degradation acceptable for older hardware?

3. **Performance Targets:**
   - What frame rate is required for smooth animation (30fps? 60fps?)?
   - How many simultaneous LED updates are expected (full grid? partial updates?)?

4. **Implementation Timeline:**
   - When is the first user story scheduled for development?
   - Is there time for iterative prototyping with hardware?

---

**END OF RESEARCH PROMPT**

**Next Step:** Execute research using preferred method (Option 1/2/3), then compile findings into deliverable format outlined above.
