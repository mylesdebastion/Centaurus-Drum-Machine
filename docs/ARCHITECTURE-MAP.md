# iOS → Web Architecture Mapping

**Generated:** 2026-02-17 by Opus  
**Purpose:** One-shot refactor from iOS PixelBoop to Web Centaurus

---

## File Mapping

| iOS File | Web File | Status | Subagent |
|----------|----------|--------|----------|
| `IntervalMode.swift` | `src/lib/intervalMode.ts` | ✅ Ported | - |
| `IntervalModeSelectionController.swift` | `src/hooks/useIntervalModeSelection.ts` | 🟡 30% | #2 Gestures |
| `SetToggleManager.swift` | `src/lib/setToggleManager.ts` | ❌ Missing | #3 Data |
| `AudioKitService.swift` | `src/lib/audioEngine.ts` | ❌ Terrible | #1 Audio |
| `MelodySynth.swift` | `src/lib/synths/melodySynth.ts` | ❌ Missing | #1 Audio |
| `BassSynth.swift` | `src/lib/synths/bassSynth.ts` | ❌ Missing | #1 Audio |
| `SimpleDrums` (in AudioKitService) | `src/lib/synths/drums.ts` | ❌ Missing | #1 Audio |
| `GestureInterpreter.swift` | `src/lib/gestureInterpreter.ts` | 🟡 Partial | #2 Gestures |
| `PixelGridUIView.swift` | `PixelBoopSequencer.tsx` | 🟡 Basic | #4 Visual |
| `PresetSelectionController.swift` | `src/hooks/usePresetSelection.ts` | ❌ Missing | #5 Advanced |
| `TeachingModeController.swift` | `src/hooks/useTeachingMode.ts` | ❌ Missing | #5 Advanced |
| `SequencerViewModel.swift` | `PixelBoopSequencer.tsx` (state) | 🟡 Basic | #3 Data |

---

## Type Mapping

### Swift → TypeScript

```swift
// Swift enum
enum IntervalMode: Int, CaseIterable {
    case thirds = 0
    case fourths = 1
    // ...
}
```

```typescript
// TypeScript
export type IntervalModeType = 'thirds' | 'fourths' | 'fifths' | 'sevenths' | 'ninths' | 'chromatic';
export const INTERVAL_MODES: IntervalModeType[] = ['thirds', 'fourths', 'fifths', 'sevenths', 'ninths', 'chromatic'];
```

### Swift class → React hook

```swift
// Swift
class IntervalModeSelectionController: ObservableObject {
    @Published private(set) var highlightedMode: Int? = nil
    @Published private(set) var isConfirmed: Bool = false
    // ...
}
```

```typescript
// React hook
export function useIntervalModeSelection() {
  const [highlightedMode, setHighlightedMode] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // ...
  return { highlightedMode, isConfirmed, beginHold, endHold, cancelHold };
}
```

---

## Audio Mapping: AudioKit → Web Audio

### Synth Architecture

**iOS (AudioKit):**
```swift
let oscillator = Oscillator(waveform: Table(.sine))
let envelope = AmplitudeEnvelope(oscillator)
envelope.attackDuration = 0.01
envelope.decayDuration = 0.1
envelope.sustainLevel = 0.8
envelope.releaseDuration = 0.15
```

**Web (Web Audio):**
```typescript
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
const filter = audioContext.createBiquadFilter();

// ADSR via gain automation
gainNode.gain.setValueAtTime(0, now);
gainNode.gain.linearRampToValueAtTime(1, now + attack);
gainNode.gain.setValueAtTime(sustain, now + attack + decay);
// Release on note-off: linearRampToValueAtTime(0, releaseEnd)
```

### Preset Parameters to Port

**Melody Presets (MelodySynth.swift):**
| Preset | Attack | Decay | Sustain | Release | Waveform | FM? |
|--------|--------|-------|---------|---------|----------|-----|
| Gliss Lead | 0.02 | 0.3 | 0.7 | 0.2 | sine | no |
| Bell | 0.001 | 1.5 | 0.0 | 0.8 | FM | yes (7:3.5) |
| Flute | 0.15 | 0.2 | 0.8 | 0.25 | sine | no |
| Square Lead | 0.01 | 0.15 | 0.85 | 0.15 | square | no |
| PWM | 0.03 | 0.2 | 0.75 | 0.2 | sawtooth | no |
| Sync Lead | 0.005 | 0.1 | 0.9 | 0.12 | FM | yes (3:2) |

**Bass Presets (BassSynth.swift):**
| Preset | Attack | Decay | Sustain | Release | Waveform | Filter Hz |
|--------|--------|-------|---------|---------|----------|-----------|
| Acid Bass | 0.001 | 0.15 | 0.0 | 0.08 | sawtooth | 400+vel |
| FM Bass | 0.001 | 0.3 | 0.5 | 0.15 | FM (2:4) | 2000 |
| Saw Bass | 0.005 | 0.2 | 0.7 | 0.12 | sawtooth | 800 |
| Sub Bass | 0.01 | 0.1 | 0.9 | 0.15 | sine | 350 |

**Drum Synthesis (SimpleDrums):**
- **Kick:** Sine 150Hz→55Hz sweep + triangle click at 160Hz
- **Snare:** Triangle 200Hz + bandpass noise 4500Hz
- **Hihat:** Highpass noise 7000Hz

---

## Gesture System

### Column 3 Hold (Interval Mode Cycling)

**iOS Flow:**
1. User holds column 3 (within track area)
2. After 0.5s: Highlight current mode (bright pixel)
3. Every 0.7s: Cycle to next mode (climbing animation)
4. On release: Confirm selected mode OR cancel if released early

**Web Implementation:**
```typescript
// In useIntervalModeSelection.ts
const ACTIVATION_DELAY = 500; // ms
const STEP_INTERVAL = 700; // ms

function beginHold(track: TrackType, currentMode: IntervalModeType) {
  holdStartTime.current = Date.now();
  // Start interval timer...
}
```

### Column 4 Tap (Set Toggling)

**iOS Flow:**
1. User taps column 4 (within track area)
2. Cycle to next set (1→2 for melodic, 1→2→3 for bass)
3. Grid re-renders showing new set's slots
4. Pattern data persists (slot-based storage)

**Web Implementation:**
```typescript
// In useSetToggle.ts
function toggleSet(track: TrackType) {
  setCurrentSet(prev => ({
    ...prev,
    [track]: SetToggleManager.nextSet(prev[track], track)
  }));
}
```

---

## Version Structure for Dropdown

The refactored code will be **v5: Full iOS Port** in the version selector.

```typescript
interface AppVersion {
  id: string;
  label: string;
  date: string;
  features: string[];
  enabled: boolean;
}

const versions: AppVersion[] = [
  {
    id: 'v1',
    label: 'v1: Baseline',
    date: '2026-02-17',
    features: ['Chromatic grid', 'Basic sequencing'],
    enabled: true
  },
  {
    id: 'v2',
    label: 'v2: Interval Modes',
    date: '2026-02-17',
    features: ['Diatonic intervals', 'Column 3 indicator'],
    enabled: true
  },
  // ... v3, v4 ...
  {
    id: 'v5',
    label: 'v5: Full iOS Port',
    date: '2026-02-17',
    features: [
      'AudioKit-quality synths',
      'Column 3 hold gesture (climbing pixel)',
      'Column 4 set toggling (6→12 notes)',
      'Walking bass gestures',
      'Preset selection',
      'Teaching mode'
    ],
    enabled: true  // ← New refactored version
  }
];
```

---

## Subagent Scopes

### Subagent #1: Audio Engine
**Task:** Port AudioKit synthesis to Web Audio with proper ADSR + filtering  
**Input:** `MelodySynth.swift`, `BassSynth.swift`, `AudioKitService.swift`  
**Output:** `src/lib/audioEngine.ts`, `src/lib/synths/*.ts`  
**Test:** A/B compare with iOS recordings  
**Hours:** 3-4

### Subagent #2: Gesture System
**Task:** Complete column 3 hold + add column 4 tap + walking bass  
**Input:** `IntervalModeSelectionController.swift`, `GestureInterpreter.swift`  
**Output:** `src/hooks/useIntervalModeSelection.ts`, `src/hooks/useSetToggle.ts`, gesture handlers  
**Test:** Touch sequences produce expected state changes  
**Hours:** 2-3

### Subagent #3: Data Model
**Task:** Slot-based pattern storage + set toggling logic  
**Input:** `SetToggleManager.swift`, `SequencerViewModel.swift`  
**Output:** `src/lib/setToggleManager.ts`, updated sequencer state  
**Test:** Pattern persists across set switches  
**Hours:** 2-3

### Subagent #4: Visual Feedback
**Task:** Climbing pixel animation, column 3/4 indicators, tooltips  
**Input:** `PixelGridUIView.swift` rendering sections  
**Output:** Updated `PixelBoopSequencer.tsx` rendering  
**Test:** Visual parity with iOS screenshots  
**Hours:** 2-3

### Subagent #5: Advanced Features
**Task:** Preset selection, teaching mode, row 22 automation  
**Input:** `PresetSelectionController.swift`, `TeachingModeController.swift`  
**Output:** New hooks + integration  
**Test:** Can cycle presets, teaching mode auto-tooltips work  
**Hours:** 2-3

---

## Integration Order

1. **Audio first** - Need good sounds before anything else
2. **Data model** - Slot-based storage enables set toggling
3. **Gestures** - Build on data model
4. **Visual** - Render the new state
5. **Advanced** - Polish features

Total estimated: 11-16 hours parallel work → ~4-6 hours wall clock with subagents.
