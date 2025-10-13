# Epic 11: ROLI LUMI Integration

**Status:** 🚧 **IN PROGRESS** (Phase 2.1 Complete)
**Priority:** High
**Target Completion:** Q1 2025 (v2.0 for Tier 1, v2.1 for Tier 2)

---

## Epic Overview

Enable seamless integration with ROLI Piano M (formerly LUMI Keys) to provide visual feedback for music education, showing scales, intervals, chord tones, and next notes through intelligent per-key LED control. This epic implements a two-tier approach: Tier 1 (SysEx protocol for global scale/key control) and Tier 2 (LittleFoot script for per-key color control).

**Vision:** Create the first drum machine with smart LUMI integration, where the keyboard becomes a visual learning aid that shows harmonic relationships, scale degrees, and chord progressions in real-time through coordinated LED colors.

**Business Requirements:**
- **Market Differentiation**: First drum machine with smart LUMI integration
- **Educational Value**: Visual learning aid for music theory and harmony
- **User Experience**: Haptic + visual feedback creates immersive learning
- **Hardware Ecosystem**: Opens door for other illuminated keyboard integrations
- **Progressive Enhancement**: Works great without LUMI, exceptional with LUMI

**Technical Requirements:**
- Web MIDI API for MIDI device communication (Chrome/Edge only)
- Two-tier architecture: SysEx (simple, immediate) + LittleFoot (advanced, optional)
- Real-time scale/key synchronization with < 100ms latency
- Backwards compatibility with existing Piano Roll/MIDI features
- Graceful degradation if LUMI not connected
- User-owned LUMI device (no cloud dependencies)

---

## Core Philosophy

### Two-Tier Approach

Rather than requiring complex setup, we provide two tiers of LUMI integration:

**Tier 1: SysEx Control (Immediate - v2.0)** ✅ Phase 2.1 Complete
- Uses reverse-engineered ROLI SysEx protocol (benob/LUMI-lights, xivilay/lumi-web-control)
- Sets global scale (Major, Minor, Chromatic, Dorian, etc.)
- Sets root key (C, D, E, F, G, A, B)
- Sets 2 color slots: Primary (scale notes) + Root (root note only)
- No user setup required beyond enabling in settings
- **Limitation**: Only 2 colors, physical key presses override colors

**Tier 2: LittleFoot Script (Advanced - v2.1+)** 📝 Planned
- Requires one-time LittleFoot script installation via ROLI Dashboard
- Full per-key color control (all 88 keys individually addressable)
- Matches web app's chromatic/harmonic color schemes exactly
- Physical key presses maintain color scheme (no white override)
- Supports velocity-based color mapping
- Enables advanced features: progressive note reveal, chord highlighting, interval training

### User Ownership Model

Each musician owns their LUMI device. No multi-user coordination or server infrastructure needed. The web app simply sends MIDI messages to the user's locally connected LUMI.

```
Browser App → Web MIDI API → LUMI Keys (Local USB/Bluetooth)
```

### Progressive Disclosure

**Essential (visible):** Enable LUMI toggle, auto-detect device, connection status
**Advanced (collapsible):** Color scheme selector, brightness controls, test patterns
**Power User (optional):** Download LittleFoot script, advanced color customization

---

## Reference Implementations

### Research & Protocol Documentation
- **Location:** `docs/research/roli-lumi-light-control.md`
- **Proven features:**
  - Complete SysEx protocol reverse-engineering
  - MIDI Note On/Off color control documentation
  - LittleFoot script architecture and examples
  - Two-tier approach discovery and rationale

### Prototype Component
- **Location:** `src/components/LumiTest/LumiTest.tsx`
- **Proven features:**
  - SysEx command testing interface
  - Scale/key/color mode controls
  - MIDI note color testing
  - Connection status verification
  - All concepts validated before production integration

### LittleFoot Script
- **Location:** `littlefoot/centaurus-lumi-colors.littlefoot`
- **Proven features:**
  - Custom color mapping (chromatic wheel)
  - Per-key color control via MIDI velocity
  - Physical key press handling
  - All 88 keys supported

### External References
- **benob/LUMI-lights** (GitHub): Original SysEx protocol reverse-engineering
- **xivilay/lumi-web-control** (GitHub): Working web implementation
- **ROLI BLOCKS SDK** (docs): Official LittleFoot documentation

---

## Stories

### **Story 11.1: ROLI Piano M / LUMI Keys Integration** 🚧 **HIGH**
**Status:** IN PROGRESS (Phase 2.1 Complete)
**Complexity:** Medium-High
**Prerequisites:** Story 9.1 (Web MIDI Input Engine)

**Goal:** Enable LUMI Keys to display scales, intervals, and harmonic relationships synchronized with Piano Roll state using a two-tier approach (SysEx + optional LittleFoot script).

**Key Features:**

**Phase 1 - Research & Foundation** ✅ COMPLETE
- Research ROLI BLOCKS SDK and LUMI control methods
- Reverse-engineer SysEx protocol (via benob/LUMI-lights)
- Document MIDI Note On/Off color control
- Create LumiTest component for protocol testing
- Create LittleFoot script for advanced control

**Phase 2.1 - SysEx Scale/Key Syncing** ✅ COMPLETE (Commit d3a3d5f)
- Enhanced lumiController.ts with setScale(), setRootKey(), setColorMode() methods
- Added BitArray class for proper SysEx encoding
- Piano Roll auto-syncs scale/key changes to LUMI in real-time
- Maps all 12 Piano Roll scales to LUMI SysEx commands (with fallbacks)
- Auto-initializes LUMI with Mode 1, current scale, and root key
- Scale dropdown change → LUMI updates instantly
- Root key dropdown change → LUMI updates instantly
- Works alongside existing MIDI Note On/Off color control

**Phase 2.2 - Settings Integration** 📝 PLANNED
- LUMI settings panel in Settings view
- Auto-detect device on connection
- Connection status indicator (connected/disconnected/error)
- Color scheme selector (chromatic/harmonic)
- Brightness controls
- Test connection button
- Settings persist to localStorage

**Phase 2.3 - Piano Roll Integration** 📝 PLANNED
- Hook into Piano Roll scale changes (✅ Done in Phase 2.1)
- Update LUMI when key changes (✅ Done in Phase 2.1)
- Update LUMI when color scheme changes
- Add "Highlight Next Notes" feature
- Brightness based on note timing (dim future, bright current)

**Phase 3 - LittleFoot Script Distribution** 📝 PLANNED
- Downloadable centaurus-lumi-colors.littlefoot script
- "Download LUMI Script" button in settings
- Step-by-step installation guide with screenshots
- Script version detection via MIDI SysEx query
- Verification test confirms script is loaded

**Phase 4 - Advanced Features** 📝 PLANNED
- Velocity-based color control (chromatic and harmonic modes)
- Progressive note reveal (sequential highlighting)
- Chord progression preview (light up upcoming chords)
- Interactive learning mode (Simon Says, ear training)
- Error handling and edge cases
- Performance optimization (throttling, batching)

**Deliverables (Phase 2.1 - Complete):**
- `src/utils/lumiController.ts` - LUMI SysEx control with scale/key sync (183 lines added)
- Modified: `src/components/PianoRoll/PianoRoll.tsx` - Auto-sync scale/key to LUMI (+28 lines)
- Modified: `docs/stories/11.1.roli-lumi-integration.story.md` - Phase 2.1 completion notes (+43 lines)

**Deliverables (Planned):**
- `src/services/midi/LumiDeviceManager.ts` - Device detection and management
- `src/components/Settings/LumiSettings.tsx` - LUMI settings panel
- `src/utils/LumiColorMapper.ts` - Velocity-based color mapping
- `docs/user-guides/lumi-setup.md` - User documentation
- `littlefoot/centaurus-lumi-colors.littlefoot` - Custom LittleFoot script (exists, needs distribution)

**Total (Phase 2.1):** 333 insertions, 65 deletions across 5 files

**Reuse:**
- ✅ midiInputManager (Story 9.1) - MIDI device enumeration
- ✅ PianoRoll scale/key state - Auto-sync source
- ✅ colorMapping.ts - Color scheme utilities
- ✅ benob/xivilay SysEx protocol - Proven implementation patterns

---

## Technical Architecture

### Tier 1: SysEx Control (Phase 2.1 - Complete)

```typescript
// src/utils/lumiController.ts
class LumiController {
  private midiOutput: MIDIOutput | null = null;

  // Phase 2.1 - Complete
  async initialize(): Promise<void>
  setScale(scale: string): void        // Maps Piano Roll scales to LUMI bytes
  setRootKey(rootKey: string): void    // Sets root key (C, D, E, ...)
  setColorMode(mode: number): void     // Sets LUMI color mode (0-3)

  // Existing (pre-Phase 2.1)
  sendNoteOn(note: number, color: number): void
  sendNoteOff(note: number): void

  // Internal (Phase 2.1 - Complete)
  private BitArray class                // SysEx bit encoding helper
  private sendSysEx(bytes: number[]): void
}
```

**Scale Mapping Implementation:**
```typescript
const SCALE_MAP: { [key: string]: number } = {
  'major': 0,              // Ionian
  'minor': 1,              // Aeolian
  'chromatic': 12,         // All 12 notes
  'dorian': 0,             // Fallback to major
  'phrygian': 0,           // Fallback to major
  'lydian': 0,             // Fallback to major
  'mixolydian': 0,         // Fallback to major
  'locrian': 1,            // Fallback to minor
  'harmonicMinor': 1,      // Fallback to minor
  'melodicMinor': 1,       // Fallback to minor
  'pentatonicMajor': 2,    // Pentatonic Major
  'pentatonicMinor': 3,    // Pentatonic Minor
  'blues': 3               // Fallback to Pentatonic Minor
};
```

**Piano Roll Integration (Phase 2.1 - Complete):**
```typescript
// In PianoRoll.tsx - Auto-sync with LUMI
useEffect(() => {
  if (lumiEnabled && lumiController) {
    lumiController.setRootKey(selectedKey);
  }
}, [lumiEnabled, selectedKey]);

useEffect(() => {
  if (lumiEnabled && lumiController) {
    lumiController.setScale(selectedScale);
  }
}, [lumiEnabled, selectedScale]);

// Initialize on mount
useEffect(() => {
  if (lumiEnabled && lumiController) {
    lumiController.setColorMode(1);        // Mode 1 for SysEx + MIDI colors
    lumiController.setScale(selectedScale);
    lumiController.setRootKey(selectedKey);
  }
}, [lumiEnabled]);
```

### Tier 2: LittleFoot Script (Planned)

```typescript
// src/utils/LumiColorMapper.ts (Planned)
class LumiColorMapper {
  // LUMI velocity → color mapping (from LittleFoot colourLookup)
  private readonly VELOCITIES = {
    black: 0, red: 20, yellow: 42, green: 65,
    cyan: 85, blue: 105, purple: 115, white: 127
  };

  getVelocityForNote(
    note: number,
    scheme: 'chromatic' | 'harmonic',
    rootNote: number
  ): number {
    // Returns MIDI velocity that produces desired color
    if (scheme === 'chromatic') {
      return this.chromaticColor(note);
    } else {
      return this.harmonicColor(note, rootNote);
    }
  }

  private chromaticColor(note: number): number {
    const colors = [
      this.VELOCITIES.red,    // C
      this.VELOCITIES.yellow, // C#
      this.VELOCITIES.green,  // D
      this.VELOCITIES.cyan,   // D#
      this.VELOCITIES.blue,   // E
      this.VELOCITIES.purple, // F
      // ... etc (12 colors)
    ];
    return colors[note % 12];
  }

  private harmonicColor(note: number, root: number): number {
    const interval = (note - root) % 12;
    const intervalColors = {
      0: this.VELOCITIES.white,  // Root
      4: this.VELOCITIES.green,  // Major 3rd
      7: this.VELOCITIES.blue,   // Perfect 5th
      // ... etc
    };
    return intervalColors[interval] || this.VELOCITIES.black;
  }
}
```

### Data Flow

```
Piano Roll State
   ↓
   ├─ selectedScale → lumiController.setScale(scale)
   ├─ selectedKey → lumiController.setRootKey(key)
   └─ colorMode → lumiController.setColorMode(mode)
         ↓
   SysEx Commands
         ↓
   Web MIDI API (USB/Bluetooth)
         ↓
   ROLI Piano M / LUMI Keys
         ↓
   Per-Key LED Colors
```

**Tier 2 Enhancement (Planned):**
```
Active Notes
   ↓
   LumiColorMapper.getVelocityForNote()
   ↓
   MIDI Note On with Color Velocity
   ↓
   LittleFoot Script
   ↓
   Per-Key Color (matches web app exactly)
```

---

## Integration Strategy

**Phase 1 - Research & Foundation** ✅ (Complete):
- Researched ROLI BLOCKS SDK and LUMI control methods
- Reverse-engineered SysEx protocol from benob/LUMI-lights
- Documented MIDI Note On/Off color control
- Created LumiTest component for testing
- Discovered two-tier approach (SysEx + LittleFoot)

**Phase 2.1 - SysEx Scale/Key Syncing** ✅ (Commit d3a3d5f):
- Enhanced lumiController.ts with scale/key sync methods
- Integrated with Piano Roll for real-time synchronization
- Mapped all 12 Piano Roll scales to LUMI SysEx commands
- Auto-initialization with Mode 1 for SysEx + MIDI color coexistence

**Phase 2.2 - Settings Integration** 📝 (Planned):
- Create LUMI settings panel in Settings view
- Auto-detect device on connection
- Connection status indicators
- Color scheme selector
- Test connection button

**Phase 2.3 - Piano Roll Integration Enhancements** 📝 (Planned):
- Color scheme changes sync to LUMI
- "Highlight Next Notes" feature
- Brightness based on note timing

**Phase 3 - LittleFoot Script Distribution** 📝 (Planned):
- "Download LUMI Script" button in settings
- Step-by-step installation guide
- Script verification test
- Unlock advanced features when script detected

**Phase 4 - Advanced Features** 📝 (Planned):
- Velocity-based color control
- Progressive note reveal
- Chord progression preview
- Interactive learning modes
- Error handling and optimization

---

## Success Metrics

### Phase 2.1 (SysEx Scale/Key Syncing) ✅
- [x] lumiController.ts extended with scale/key sync methods
- [x] BitArray class added for SysEx encoding
- [x] Piano Roll integration (auto-sync on scale/key changes)
- [x] All 12 scales mapped to LUMI SysEx commands
- [x] Auto-initialization with Mode 1
- [x] Real-time sync (scale/key dropdown → LUMI updates)
- [x] Works alongside MIDI Note On/Off color control
- [ ] **Pending:** Testing with physical LUMI hardware

### Phase 2.2 (Settings Integration) - Planned
- [ ] LUMI settings panel created
- [ ] Auto-detect device on connection (< 1 second)
- [ ] Connection status indicators accurate
- [ ] Settings persist to localStorage
- [ ] Test connection lights up all keys

### Phase 2.3 (Piano Roll Integration) - Planned
- [ ] Color scheme changes sync to LUMI
- [ ] "Highlight Next Notes" feature working
- [ ] Brightness based on note timing
- [ ] < 50ms latency for all updates

### Phase 3-4 (LittleFoot & Advanced) - Planned
- [ ] LittleFoot script downloadable
- [ ] Installation guide clear (5-star UX rating)
- [ ] Script verification test works
- [ ] Velocity-based colors match web app exactly
- [ ] Progressive note reveal smooth (60fps)
- [ ] Chord progression preview functional

### Overall Epic Success (Future)
- [ ] Story 11.1 all phases COMPLETE
- [ ] 95% success rate on LUMI auto-detection
- [ ] < 100ms latency for scale changes
- [ ] Zero crashes from LUMI disconnect
- [ ] Adoption: >50% of LUMI users enable integration
- [ ] Educational value validated through user feedback

---

## Future Enhancements (Post-MVP)

### Multi-Device Support
- Support 2-3 chained LUMI blocks (up to 72 keys total)
- Span multiple octaves across devices
- Coordinate colors across all blocks

### Interactive Learning Modes
- "Simon Says" style note games
- Ear training exercises (identify intervals)
- Interval recognition drills
- Scale practice modes with scoring

### Advanced Color Customization
- Custom user-defined color schemes
- Import/export color schemes (JSON)
- Community color scheme library
- Per-interval color customization

### Chord Progression Features
- Light up upcoming chord tones 1 measure ahead
- Fade in/out as chords approach
- Different colors for chord types (major, minor, diminished)
- Chord symbol display in app synced with LUMI

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-09 | 1.0 | Initial epic creation - ROLI LUMI Integration | Dev Team |
| 2025-10-11 | 1.1 | Phase 2.1 COMPLETE - SysEx Scale/Key Syncing | Dev Agent (claude-sonnet-4-5-20250929) |
| 2025-01-13 | 1.2 | Epic creation from Story 11.1 Phase 2.1 completion | Sarah (PO) |

---

## Next Steps

1. ✅ **Phase 2.1** - COMPLETE (SysEx Scale/Key Syncing, commit d3a3d5f)
2. **Testing:** Test Phase 2.1 with physical LUMI hardware
   - Verify scale sync behavior across all 12 scales
   - Verify Mode 1 compatibility with MIDI Note On/Off colors
   - Confirm no conflicts between SysEx and MIDI color commands
3. **Phase 2.2:** Create LUMI settings panel
   - Auto-detect device UI
   - Connection status indicators
   - Color scheme selector
   - Persistence layer
4. **Phase 3:** Distribute LittleFoot script
   - Download button + installation guide
   - Script verification test
5. **Phase 4:** Advanced features
   - Velocity-based color control
   - Progressive note reveal
   - Chord progression preview

---

## Git Commit Reference

**Primary Implementation:** Commit `d3a3d5f`
```
feat: add LUMI scale/key sync to Piano Roll

Implements automatic scale and root key synchronization between Piano Roll and ROLI LUMI Keys via SysEx protocol.

Changes:
- Enhanced lumiController with setScale(), setRootKey(), setColorMode() methods
- Added BitArray class for proper SysEx encoding (from benob/LUMI-lights)
- Piano Roll auto-syncs scale/key changes to LUMI in real-time
- Maps all 12 Piano Roll scales to LUMI SysEx commands (with fallbacks)
- Auto-initializes LUMI with Mode 1, current scale, and root key

Features:
- Change scale dropdown → LUMI updates instantly
- Change root key dropdown → LUMI updates instantly
- LUMI displays scale notes in primary color, root in accent color
- Works alongside existing MIDI Note On/Off color control

Also updates:
- Story 4.1 status to Ready for Review (GlobalMusicContext complete)
- GlobalMusicContext test fix for localStorage version mismatch

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Files Changed:** 5 files, 333 insertions(+), 65 deletions(-)

**Testing Status:**
- ✅ TypeScript compilation successful
- ✅ Integration complete (Piano Roll → LUMI auto-sync)
- ⏳ Awaiting physical LUMI hardware testing
