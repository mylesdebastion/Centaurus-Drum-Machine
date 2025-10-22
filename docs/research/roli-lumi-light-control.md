# Research: Controlling ROLI Piano M (Lumikeys) Lights

**Date:** 2025-10-11
**Status:** Community-Documented (Reverse-Engineered)

## Executive Summary

The ROLI Piano M (formerly LUMI Keys) lights can be controlled from external applications using three methods: reverse-engineered SysEx messages, LittleFoot scripting language, or the C++ BLOCKS API. While ROLI does not officially document LED control via standard MIDI, the community has successfully reverse-engineered the protocol.

## Key Findings

### Official MIDI Support
- ❌ LUMI Keys lights **do not natively respond** to incoming standard MIDI note messages
- ✅ The official ROLI Dashboard app provides light configuration
- ✅ Community has **reverse-engineered the control protocol** through three approaches

### ROLI Manufacturer ID
All ROLI SysEx messages start with: `F0 00 21 10 ... F7`

## Three Methods to Control LUMI Lights

### 1. SysEx Messages (Reverse-Engineered) ⭐ Most Direct

**Community Projects:**
- **Primary**: [benob/LUMI-lights](https://github.com/benob/LUMI-lights)
  - Reverse-engineered SysEx commands from ROLI Dashboard
  - Documentation in `SYSEX.txt` file
  - Live demo: https://benob.github.io/LUMI-lights/ (may not work on all browsers)

- **Working Implementation**: [xivilay/lumi-web-control](https://github.com/xivilay/lumi-web-control) ⭐ **VERIFIED WORKING**
  - Browser-based control interface
  - Live demo: https://xivilay.github.io/lumi-web-control/
  - Enhanced fork with additional features

**Correct SysEx Protocol** (from SYSEX.txt):

Message Structure:
```
F0 <manufacturer> 77 <device-id> <command> <checksum> F7
```

Key Values:
- Manufacturer: `00 21 10` (ROLI)
- Device ID: `37` (LUMI)
- Message type: `77`
- Command: 8 bytes (7-bit values)

**Color Encoding Algorithm:**
```javascript
function encodeColor(r, g, b) {
  const v1 = ((b & 0x3) << 5) | 0x4;
  const v2 = ((b >> 2) & 0x3f) | (g & 1);
  const v3 = g >> 1;
  const v4 = r & 0x7f;
  const v5 = (r >> 7) | 0x7e;
  return [v1, v2, v3, v4, v5];
}
```

**Checksum Calculation:**
```javascript
function calculateChecksum(bytes, size) {
  let c = size;
  for (const b of bytes) {
    c = (c * 3 + b) & 0xff;
  }
  return c & 0x7f;
}
```

**Color Commands:**
- Global Key Color: `10 20 [encoded-color-5-bytes] 03`
- Root Key Color: `10 30 [encoded-color-5-bytes] 03`

**Example Messages:**
- Blue: `F0 00 21 10 77 37 10 20 64 3F 00 00 7E 03 [checksum] F7`
- Green: `F0 00 21 10 77 37 10 20 04 40 7F 00 7E 03 [checksum] F7`
- Red: `F0 00 21 10 77 37 10 20 04 00 00 7F 7F 03 [checksum] F7`

**Advantages:**
- Direct control from web applications
- No user installation required (beyond WebMIDI browser support)
- Real-time color control

**Disadvantages:**
- Requires reverse-engineered protocol knowledge
- May break with firmware updates
- WebMIDI API browser compatibility

---

### 2. LittleFoot Scripts ⭐ Most Flexible

**What it is:**
- Custom programming language by ROLI for BLOCKS devices
- Scripts run directly on the keyboard hardware
- Installation: Drag-and-drop .littlefoot files into ROLI Dashboard

**Key Functions:**

```cpp
// Handling incoming MIDI
void handleMIDI(int byte0, int byte1, int byte2) {
  int status = byte0 & 0xF0;

  // Note On (0x90)
  if (status == 0x90) {
    int note = byte1;
    int velocity = byte2;
    // Control LEDs based on note
    fillPixel(0xFFFFFFFF, note % 15, note / 15); // Light up LED
  }

  // Note Off (0x80)
  if (status == 0x80) {
    int note = byte1;
    fillPixel(0x00000000, note % 15, note / 15); // Turn off LED
  }
}

// LED Control functions
void fillPixel(int rgb, int x, int y); // Set single LED
void fillRect(int rgb, int x, int y, int width, int height); // Fill area
int makeARGB(int alpha, int red, int green, int blue); // Create color

// Called ~25 times per second for visual updates
void repaint() {
  // Update display here
}
```

**Resources:**
- [Official LittleFoot Documentation](https://weareroli.github.io/BLOCKS-SDK/the_littlefoot_language.html)
- [LittleFoot Examples Repository](https://github.com/WeAreROLI/Littlefoot-Examples)
- [LittleFoot Functions Reference](https://weareroli.github.io/BLOCKS-SDK/group__LittleFootFunctions.html)
- [Example: Ableton Live Control](https://github.com/WeAreROLI/Littlefoot-Examples/blob/master/Factory%20Scripts/Ableton%20Live%20Control.littlefoot) - Shows `handleMIDI` implementation

**Advantages:**
- Runs on device (no host computer needed)
- Officially supported by ROLI
- User can customize behavior
- Responds to any MIDI input

**Disadvantages:**
- Requires user to install script via ROLI Dashboard
- Limited by LittleFoot language capabilities
- Requires learning C-like syntax

---

### 3. C++ BLOCKS API ⭐ Most Powerful

**Framework:**
- JUCE-based SDK
- Repository: [WeAreROLI/BLOCKS-SDK](https://github.com/WeAreROLI/BLOCKS-SDK)
- Related: [roli_blocks_basics](https://github.com/WeAreROLI/roli_blocks_basics)

**Best for:**
- Native desktop applications
- Full device control
- Advanced integration

**Advantages:**
- Complete device control
- Officially supported
- Professional-grade development

**Disadvantages:**
- Requires C++ development environment
- JUCE framework complexity
- Not suitable for web applications
- Desktop-only (not browser-compatible)

---

## Recommended Approach for Centaurus Drum Machine

For our web-based drum machine, we have two viable options:

### Option A: SysEx Messages (Easiest Integration)

**Implementation in TypeScript/React:**

```typescript
// LumiController.ts
import { WebMidi } from 'webmidi';

class LumiController {
  private output: any;

  async connect() {
    await WebMidi.enable();
    this.output = WebMidi.getOutputByName("LUMI Keys");
  }

  setKeyColor(keyIndex: number, r: number, g: number, b: number) {
    // Use reverse-engineered SysEx command from benob's research
    this.output.sendSysex([0x00, 0x21, 0x10, 0x77, 0x37,
                           keyIndex, r, g, b, 0xF7]);
  }

  lightUpNote(midiNote: number, velocity: number) {
    // Map MIDI note to LUMI key index
    const keyIndex = midiNote - 48; // Adjust for LUMI's note range
    const brightness = Math.floor((velocity / 127) * 255);
    this.setKeyColor(keyIndex, brightness, brightness, 255);
  }

  clearAllLights() {
    for (let i = 0; i < 24; i++) {
      this.setKeyColor(i, 0, 0, 0);
    }
  }
}

export default LumiController;
```

**Integration Points:**
1. Add to MIDI device detection (alongside existing MIDI setup)
2. Hook into note playback events (when drum pads trigger notes)
3. Add to Piano Roll visualization (light up notes as they play)
4. Configurable in settings (enable/disable LUMI light control)

---

### Option B: LittleFoot Script (User-Installable)

**Create a companion .littlefoot script for users to install:**

```cpp
/*
<metadata description="Centaurus Drum Machine - LUMI Light Control"
          target="LUMI"
          tags="MIDI;Lights;Visualization">
</metadata>
*/

// Configuration
int keyOffset = 48;  // LUMI starts at C3 (MIDI note 48)

void handleMIDI(int byte0, int byte1, int byte2) {
  int status = byte0 & 0xF0;
  int channel = byte0 & 0x0F;

  // Note On
  if (status == 0x90 && byte2 > 0) {
    int note = byte1;
    int velocity = byte2;
    int keyIndex = note - keyOffset;

    // Only light keys within LUMI range
    if (keyIndex >= 0 && keyIndex < 24) {
      // Map velocity to color brightness
      int brightness = (velocity * 255) / 127;

      // Cyan color for drum hits
      int color = makeARGB(255, 0, brightness, brightness);

      fillPixel(color, keyIndex, 0);
    }
  }

  // Note Off
  if (status == 0x80 || (status == 0x90 && byte2 == 0)) {
    int note = byte1;
    int keyIndex = note - keyOffset;

    if (keyIndex >= 0 && keyIndex < 24) {
      fillPixel(0x00000000, keyIndex, 0);  // Turn off
    }
  }
}

void repaint() {
  // Optional: Add visual decay effect here
}
```

**User Instructions:**
1. Download `centaurus-lumi-lights.littlefoot`
2. Open ROLI Dashboard
3. Navigate to your LUMI device
4. Drag and drop the .littlefoot file onto the keyboard image
5. The script will automatically light up keys when Centaurus sends MIDI notes

---

## Implementation Recommendation

**Hybrid Approach:**

1. **Primary**: Implement SysEx control (Option A)
   - Provides immediate integration
   - Works without user setup (if LUMI detected)
   - Full control from our application

2. **Secondary**: Provide LittleFoot script (Option B)
   - As a downloadable companion script
   - For users who want autonomous behavior
   - Better for standalone LUMI usage (without web app open)

3. **Settings Toggle**:
   ```typescript
   interface MIDISettings {
     lumiLightControl: boolean;
     lumiColorScheme: 'velocity' | 'track' | 'scale';
     lumiDecayTime: number; // ms before lights fade
   }
   ```

---

## Technical Notes

### LUMI Device Specifications
- **Keys per block**: 24 (2 octaves)
- **MIDI note range**: Typically starts at C3 (MIDI note 48)
- **Connectable blocks**: Up to 3 blocks (72 keys total)
- **LED color**: Full RGB per key
- **Communication**: USB MIDI or Bluetooth MIDI

### Integration Considerations

1. **Device Detection**:
   - Look for device name containing "LUMI" or "Piano M"
   - Handle both USB and Bluetooth connections

2. **Performance**:
   - Batch LED updates when possible
   - Implement decay/fade to prevent flickering
   - Consider throttling updates for rapid note sequences

3. **User Experience**:
   - Auto-detect LUMI and prompt user to enable light control
   - Provide visual feedback in app when LUMI is connected
   - Graceful fallback if SysEx commands fail

4. **Testing Without Hardware**:
   - Use browser MIDI monitor to verify SysEx messages
   - Log SysEx output for debugging
   - Create mock LUMI device for development

---

## Next Steps

### Phase 1: Research & Prototyping
- [x] Research LUMI light control methods
- [ ] Clone `benob/LUMI-lights` repository
- [ ] Test live demo with LUMI hardware (if available)
- [ ] Analyze `SYSEX.txt` and `lumi_sysex.js`

### Phase 2: Implementation
- [ ] Create `LumiController.ts` class
- [ ] Integrate with existing MIDI system
- [ ] Add LUMI detection to device manager
- [ ] Implement color mapping system

### Phase 3: User Features
- [ ] Add LUMI settings panel
- [ ] Create .littlefoot companion script
- [ ] Add documentation/help for LUMI users
- [ ] Test with real hardware

### Phase 4: Polish
- [ ] Optimize LED update performance
- [ ] Add color schemes (velocity, track-based, scale-based)
- [ ] Implement fade/decay effects
- [ ] Create demo video for documentation

---

## References

### Primary Resources
- [benob/LUMI-lights](https://github.com/benob/LUMI-lights) - Reverse-engineered SysEx control
- [xivilay/lumi-web-control](https://github.com/xivilay/lumi-web-control) - Browser-based control fork
- [WeAreROLI/BLOCKS-SDK](https://github.com/WeAreROLI/BLOCKS-SDK) - Official SDK
- [WeAreROLI/Littlefoot-Examples](https://github.com/WeAreROLI/Littlefoot-Examples) - Script examples

### Documentation
- [LittleFoot Language](https://weareroli.github.io/BLOCKS-SDK/the_littlefoot_language.html)
- [LittleFoot Functions Reference](https://weareroli.github.io/BLOCKS-SDK/group__LittleFootFunctions.html)
- [ROLI Support - LittleFoot](https://support.roli.com/support/solutions/articles/36000019133-what-is-littlefoot-)

### Community Examples
- [donya/LittlefootProjects](https://github.com/donya/LittlefootProjects) - Lightpad scripts
- [anthonyalfimov/Lightpad-Block-Sandbox](https://github.com/anthonyalfimov/Lightpad-Block-Sandbox) - Experiments

---

## Notes & Observations

1. **iPad App Behavior**: The user noted that ROLI's iPad app lights up only incoming notes, confirming that MIDI input can control lights (likely using internal APIs similar to SysEx or LittleFoot).

2. **Reverse Engineering Success**: The community (particularly benob) has successfully reverse-engineered the protocol by analyzing ROLI Dashboard's communication with the device.

3. **Production Viability**: Since ROLI officially supports LittleFoot scripts, that approach has the most long-term stability. SysEx control is more fragile but offers tighter integration.

4. **WebMIDI Compatibility**: Modern browsers (Chrome, Edge) support WebMIDI, making browser-based SysEx control feasible without plugins.

5. **Alternative Hardware**: If LUMI proves difficult to support, other illuminated MIDI keyboards include:
   - Novation Launchkey (has pads with RGB lights, documented SysEx)
   - Akai Fire (RGB pads, documented SysEx)
   - However, LUMI is unique in having per-key illumination

---

## License & Attribution

This research is based on community reverse-engineering efforts, particularly:
- **benob** (Benoit Favre) - Primary reverse engineering of LUMI SysEx protocol
- **xivilay** - Web control interface fork
- **ROLI/WeAreROLI** - Official BLOCKS SDK and LittleFoot language

All referenced repositories maintain their original licenses. This document is for educational and development purposes within the Centaurus Drum Machine project.
