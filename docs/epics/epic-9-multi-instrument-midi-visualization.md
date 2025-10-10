# Epic 9: Multi-Instrument MIDI Visualization Suite

**Status:** 📝 **PLANNING**
**Priority:** High
**Target Completion:** Q1 2025

---

## Epic Overview

Enable musicians to visualize and perform with MIDI instruments (piano, guitar) in both standalone experiments and collaborative `/jam` sessions, with live WLED hardware output.

**Vision:** Transform `/jam` from a drum-only sequencer into a **full band collaboration platform** where musicians can bring their own instruments (piano keyboard, guitar MIDI pickup, electronic drums) and visualize their performance together with synchronized LED hardware.

---

## Core Philosophy

### Modular Instrument Architecture
- Each instrument (drums, piano, guitar) is a **separate loadable module**
- Modules can be enabled/disabled per user in `/jam`
- Each module has:
  - **Standalone route** (e.g., `/piano`, `/guitar-fretboard`) for testing
  - **Compact embedded mode** for `/jam` multi-instrument view
  - **WLED hardware output** (strips or matrices)
  - **Live MIDI input** and/or **preprogrammed sequences**

### Performance Optimization
- **Minimize rendering** when modules not visible (audio + LEDs still active)
- **Single Tone.js engine** shared across all instruments
- **Efficient LED data pipelines** (no redundant calculations)
- **60fps on desktop, 30fps acceptable on mobile**

---

## Reference Implementations

### Python Proof-of-Concepts
- **`research/wled-piano-roll-pygame.py`** - Piano keyboard with MIDI input
- **`research/wled-guitar-fretboard-pygame.0.4.py`** - Guitar fretboard with chords
- **Proven features:**
  - MIDI device selection and live input
  - Chromatic and Harmonic color mappings
  - WLED UDP output (WARLS protocol)
  - Click-to-play interactive notes

---

## Stories

### **Story 9.1: Web MIDI Input Engine** 🔥 **PRIORITY**
**Status:** Planning
**Complexity:** Medium
**Prerequisites:** None (foundation story)

**Goal:** Create robust Web MIDI API integration that all instruments share.

**Key Features:**
- Web MIDI API device enumeration and selection
- MIDI message parsing (note on/off, velocity, CC)
- Device hot-plug detection (connect/disconnect)
- MIDI message event system (publish/subscribe)
- Keyboard fallback mode (for testing without MIDI hardware)
- Integration with FrequencySourceManager (Story 4.1)

**Deliverables:**
- `src/utils/midiInputManager.ts` - Core MIDI engine (~250 lines)
- `src/components/MIDIDeviceSelector.tsx` - UI component (~100 lines)
- `src/hooks/useMIDIInput.ts` - React hook (~80 lines)

**Reuse:**
- ✅ FrequencySourceManager - Add MIDI notes to visualizer
- ✅ audioEngine - Trigger Tone.js instruments from MIDI

---

### **Story 9.2: Piano Roll Visualizer + LED Strip**
**Status:** Blocked by 9.1
**Complexity:** Medium
**Prerequisites:** Story 9.1 (Web MIDI)

**Goal:** Interactive piano keyboard with live MIDI input and LED strip output.

**Key Features:**
- 88-key piano keyboard (A0-C8)
- Visual: 4 octaves on screen, scrollable
- Live MIDI input highlights playing keys
- Chromatic/Harmonic color modes (reuse colorMapping.ts)
- WLED LED strip output (144 LEDs, one per key)
- Click-to-play mode (mouse/touch)
- Standalone route: `/piano`

**LED Hardware:**
- **Strip layout:** Linear 144 LEDs (88 piano keys + spacing)
- **Mapping:** LED index = MIDI note - 21 (A0 = LED 0, C8 = LED 87)
- **Placement:** Physical LED strip mounted along piano keyboard edge

**Deliverables:**
- `src/components/PianoRoll/PianoRoll.tsx` (~250 lines)
- `src/components/PianoRoll/PianoCanvas.tsx` (~150 lines)
- WLED strip integration (reuse WLEDDeviceManager)

---

### **Story 9.3: Guitar Fretboard Visualizer + LED Matrix**
**Status:** Blocked by 9.1
**Complexity:** Medium
**Prerequisites:** Story 9.1 (Web MIDI), Story 9.2 (Piano - learn from implementation)

**Goal:** Interactive guitar fretboard with chord progressions and WLED matrix.

**Key Features:**
- 6 strings × 25 frets visualization
- Chord progressions (Jazz, Blues, Pop)
- Live MIDI input (guitar MIDI pickup)
- Chromatic/Harmonic color modes
- WLED matrix output (6×25 = 150 LEDs)
- Click-to-play frets
- Standalone route: `/guitar-fretboard`

**LED Hardware:**
- **Matrix layout:** 6 rows (strings) × 25 columns (frets)
- **Serpentine wiring:** Alternating row directions
- **Placement:** Physical matrix behind guitar neck or stage backdrop

**Deliverables:**
- `src/components/GuitarFretboard/GuitarFretboard.tsx` (~250 lines)
- `src/components/GuitarFretboard/FretboardCanvas.tsx` (~150 lines)
- `src/components/GuitarFretboard/chordProgressions.ts` (~120 lines)
- WLED matrix integration (reuse WLEDDeviceManager)

---

### **Story 9.4: Modular Instrument Loader for /jam**
**Status:** Blocked by 9.2, 9.3
**Complexity:** High
**Prerequisites:** Story 9.2 (Piano), Story 9.3 (Guitar)

**Goal:** Enable users to load piano/guitar modules in `/jam` sessions.

**Key Features:**
- User role selection: Drums / Piano / Guitar / Spectator
- Modular UI: Show only active instrument modules
- Compact embedded versions of piano/guitar
- WebSocket sync: MIDI notes broadcast to all users
- Multi-device WLED: Separate LED streams per instrument
- Performance mode: Minimize rendering, keep audio/LEDs active

**Deliverables:**
- `src/components/PianoRoll/CompactPianoRoll.tsx` (~150 lines)
- `src/components/GuitarFretboard/CompactGuitarFretboard.tsx` (~150 lines)
- `src/components/JamSession/InstrumentLoader.tsx` (~200 lines)
- WebSocket message types: `PianoNoteMessage`, `GuitarNoteMessage`
- Mobile: 4-tab navigation (Drums, Piano, Guitar, Users)

---

## Component Reuse Strategy

### Shared Infrastructure (Maximize Reuse)
- ✅ **MIDIInputManager** (Story 9.1) → Used by Piano, Guitar, and future instruments
- ✅ **colorMapping.ts** → Consistent colors across Piano, Guitar, Drums
- ✅ **WLEDDeviceManager** → Handles Piano strips, Guitar matrices, Drum visualizers
- ✅ **Tone.js / audioEngine** → Unified audio playback
- ✅ **FrequencySourceManager** → MIDI notes feed into visualizers
- ✅ **ResponsiveContainer / useResponsive** → All modules use same responsive patterns

### Module-Specific Code (Minimal Duplication)
- 🆕 **PianoRoll** components (piano keyboard rendering)
- 🆕 **GuitarFretboard** components (fretboard rendering)
- 🆕 **chordProgressions.ts** (guitar-specific data)

---

## MIDI Input Architecture (Story 9.1 Detail)

### Web MIDI API Integration

```typescript
// src/utils/midiInputManager.ts

export class MIDIInputManager {
  private static instance: MIDIInputManager;
  private midiAccess: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private listeners: Set<MIDINoteListener> = new Set();
  private keyboardFallback: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('[MIDI] Access granted');

      // Listen for device changes
      this.midiAccess.onstatechange = this.handleDeviceChange;
    } catch (error) {
      console.warn('[MIDI] Web MIDI not available, using keyboard fallback');
      this.keyboardFallback = true;
    }
  }

  getDevices(): MIDIDevice[] {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values()).map(input => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state
    }));
  }

  selectDevice(deviceId: string): void {
    if (!this.midiAccess) return;

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) return;

    // Disconnect previous
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }

    // Connect new
    this.activeInput = input;
    this.activeInput.onmidimessage = this.handleMIDIMessage;
  }

  private handleMIDIMessage = (event: MIDIMessageEvent) => {
    const [status, note, velocity] = event.data;
    const messageType = status & 0xF0;

    if (messageType === 0x90 && velocity > 0) {
      // Note On
      this.notifyListeners({ type: 'noteOn', note, velocity });
    } else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
      // Note Off
      this.notifyListeners({ type: 'noteOff', note, velocity: 0 });
    }
  };

  addListener(listener: MIDINoteListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: MIDINoteListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(message: MIDINoteMessage): void {
    this.listeners.forEach(listener => listener(message));

    // Also integrate with FrequencySourceManager (Story 4.1)
    if ((window as any).frequencySourceManager) {
      (window as any).frequencySourceManager.addMidiNote(
        message.note,
        message.velocity / 127
      );
    }
  }

  // Keyboard fallback for testing without MIDI hardware
  enableKeyboardFallback(): void {
    this.keyboardFallback = true;
    window.addEventListener('keydown', this.handleKeyboardDown);
    window.addEventListener('keyup', this.handleKeyboardUp);
  }

  private handleKeyboardDown = (e: KeyboardEvent) => {
    if (!this.keyboardFallback) return;
    const note = this.keyToMIDINote(e.key);
    if (note !== null) {
      this.notifyListeners({ type: 'noteOn', note, velocity: 100 });
    }
  };

  private keyToMIDINote(key: string): number | null {
    // Map QWERTY keyboard to piano keys
    const keyMap: { [key: string]: number } = {
      'a': 60, // C4 (middle C)
      'w': 61, // C#4
      's': 62, // D4
      'e': 63, // D#4
      'd': 64, // E4
      'f': 65, // F4
      't': 66, // F#4
      'g': 67, // G4
      'y': 68, // G#4
      'h': 69, // A4
      'u': 70, // A#4
      'j': 71, // B4
      'k': 72, // C5
    };
    return keyMap[key.toLowerCase()] ?? null;
  }
}

export const midiInputManager = MIDIInputManager.getInstance();
```

---

## MIDI Device Selector UI

```tsx
// src/components/MIDI/MIDIDeviceSelector.tsx

interface MIDIDeviceSelectorProps {
  onDeviceChange?: (deviceId: string) => void;
}

export const MIDIDeviceSelector: React.FC<MIDIDeviceSelectorProps> = ({
  onDeviceChange
}) => {
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [keyboardMode, setKeyboardMode] = useState(false);

  useEffect(() => {
    midiInputManager.initialize().then(() => {
      setDevices(midiInputManager.getDevices());
    });
  }, []);

  const handleDeviceSelect = (deviceId: string) => {
    midiInputManager.selectDevice(deviceId);
    setSelectedDevice(deviceId);
    onDeviceChange?.(deviceId);
  };

  const handleKeyboardToggle = () => {
    if (!keyboardMode) {
      midiInputManager.enableKeyboardFallback();
    }
    setKeyboardMode(!keyboardMode);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          MIDI Input Device
        </label>
        {devices.length > 0 ? (
          <select
            value={selectedDevice ?? ''}
            onChange={(e) => handleDeviceSelect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a device...</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.manufacturer})
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-400">
            No MIDI devices detected. Connect a MIDI keyboard or controller.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="keyboard-fallback"
          checked={keyboardMode}
          onChange={handleKeyboardToggle}
          className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
        />
        <label htmlFor="keyboard-fallback" className="text-sm text-gray-300">
          Use QWERTY keyboard as fallback (for testing)
        </label>
      </div>

      {keyboardMode && (
        <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded-lg">
          <strong>Keyboard Map:</strong> A=C4, W=C#4, S=D4, E=D#4, D=E4, F=F4, T=F#4, G=G4, Y=G#4, H=A4, U=A#4, J=B4, K=C5
        </div>
      )}
    </div>
  );
};
```

---

## Module Loading in /jam (Story 9.4 Vision)

### User Flow: Join Session with Instrument

```
1. User visits /jam
2. See role selection UI:
   ┌────────────────────────────────┐
   │ Join Jam Session               │
   ├────────────────────────────────┤
   │ Your Name: [John Doe______]    │
   │                                │
   │ Select Instrument:             │
   │ ○ 🥁 Drums                     │
   │ ● 🎹 Piano (MIDI keyboard)     │
   │ ○ 🎸 Guitar (MIDI pickup)      │
   │ ○ 👁 Spectator                 │
   │                                │
   │ MIDI Device: [Yamaha P-125 ▾]  │
   │                                │
   │ [Join Session]                 │
   └────────────────────────────────┘

3. User selects Piano + MIDI device
4. Enters session with Piano module loaded
5. Other users see: "John (Piano) joined"
6. Piano visualizer appears in John's UI
7. John's MIDI notes broadcast to all users
8. Everyone sees John's piano LEDs update
```

### Desktop Layout (Multi-Instrument)

```
┌─────────────────────────────────────────────────────┐
│ /jam - Full Band Session           [Tempo: 120 BPM] │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Drums (You)  │ │ Piano (John) │ │ Guitar (Amy) │ │
│ │ 16-step grid │ │ Piano keys   │ │ Fretboard    │ │
│ │ ●─○─●─○─●─○  │ │ Playing: C E │ │ Playing: G   │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                     │
│ [▶ Play] [⏹ Stop] [👥 Users (3)]                   │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (Tabbed)

```
┌─────────────────────────────────────────────┐
│ 🥁 Drums │ 🎹 Piano │ 👥 Users │ ⚙️ Settings │
├─────────────────────────────────────────────┤
│ [Active instrument tab]                     │
│                                             │
│ Piano Tab:                                  │
│ ┌─────────────────────────────────────────┐│
│ │ Piano Keyboard (4 octaves visible)      ││
│ │ [Interactive keys with colors]          ││
│ │                                         ││
│ │ MIDI: Yamaha P-125 ✓                    ││
│ │ Playing: C4, E4, G4 (C major)           ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## WLED Hardware Configurations

### Piano LED Strip (Story 9.2)
```
Physical Setup:
┌────────────────────────────────────────────┐
│ Piano Keyboard (88 keys)                   │
├────────────────────────────────────────────┤
│ LED Strip (144 LEDs, 1 per key + spacing)  │
│ ●─●─●─●─●─●─●─●─●─●─●─●─●─...             │
│ A0 C D E F G A B C D E F G ...             │
└────────────────────────────────────────────┘

WLED Configuration:
- Device type: Strip (linear)
- LED count: 144
- Mapping: LED[i] = MIDI note (i + 21)
- Update rate: 30 FPS
- Color mode: Chromatic or Harmonic
```

### Guitar LED Matrix (Story 9.3)
```
Physical Setup:
┌────────────────────────────────────────────┐
│ Guitar Fretboard (6 strings × 25 frets)    │
├────────────────────────────────────────────┤
│ LED Matrix (6×25 = 150 LEDs)               │
│ ● ● ● ● ● ● ● ... (String 1: High E)       │
│ ● ● ● ● ● ● ● ... (String 2: B)            │
│ ● ● ● ● ● ● ● ... (String 3: G)            │
│ ● ● ● ● ● ● ● ... (String 4: D)            │
│ ● ● ● ● ● ● ● ... (String 5: A)            │
│ ● ● ● ● ● ● ● ... (String 6: Low E)        │
└────────────────────────────────────────────┘

WLED Configuration:
- Device type: Matrix
- Dimensions: 6 rows × 25 columns
- Wiring: Serpentine (alternating row directions)
- LED count: 150
- Update rate: 30 FPS
```

---

## Preprogrammed Sequences (Future)

### Vision
- Users can load MIDI files or create sequences in-app
- Sequences can be:
  - **Looped patterns** (bass lines, chord progressions)
  - **Full songs** (pre-recorded performances)
  - **Practice tracks** (scale exercises, chord drills)

### Implementation (Post-9.4)
```typescript
interface MIDISequence {
  id: string;
  name: string;
  instrument: 'piano' | 'guitar' | 'drums';
  tracks: MIDITrack[];
  tempo: number;
  loop: boolean;
}

interface MIDITrack {
  notes: MIDIEvent[];
  instrument: string;
}

interface MIDIEvent {
  time: number;      // Milliseconds from start
  note: number;      // MIDI note number
  velocity: number;  // 0-127
  duration: number;  // Milliseconds
}
```

---

## Success Metrics

### Story 9.1 (MIDI Engine)
- [ ] Successfully connects to 3+ different MIDI devices
- [ ] Zero dropped MIDI messages at 120 BPM
- [ ] Keyboard fallback mode works for testing
- [ ] Hot-plug device detection (<1 second to recognize)
- [ ] Works on Chrome, Firefox, Edge (Web MIDI support)

### Story 9.2 (Piano)
- [ ] Renders 88-key keyboard smoothly (60fps desktop, 30fps mobile)
- [ ] MIDI input latency <20ms (note on → visual update)
- [ ] LED strip updates at 30 FPS
- [ ] All 88 keys playable via click/touch
- [ ] Color modes match Python reference

### Story 9.3 (Guitar)
- [ ] Renders 6×25 fretboard smoothly
- [ ] MIDI guitar pickup input works correctly
- [ ] LED matrix updates at 30 FPS
- [ ] Chord progressions auto-advance every 5 seconds
- [ ] Serpentine wiring correctly mapped

### Story 9.4 (/jam Integration)
- [ ] Users can select Piano or Guitar role
- [ ] MIDI notes sync to all users (<100ms latency)
- [ ] Multiple WLED devices work simultaneously
- [ ] Performance mode minimizes rendering overhead
- [ ] Mobile 4-tab navigation works smoothly

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-10 | 1.0 | Initial epic creation - Multi-Instrument MIDI Visualization | Claude Code |
| 2025-10-10 | 1.1 | Restructured: Story 9.1 = MIDI Engine (priority), Piano before Guitar, parked bass sequencer | Claude Code |

---

## Next Steps

1. **Story 9.1** - Implement Web MIDI Input Engine (foundation)
2. **Test MIDI Engine** - Verify with multiple MIDI devices
3. **Story 9.2** - Build Piano Roll Visualizer (simpler than guitar)
4. **Story 9.3** - Build Guitar Fretboard Visualizer (learn from piano)
5. **Story 9.4** - Integrate into /jam with modular loading
