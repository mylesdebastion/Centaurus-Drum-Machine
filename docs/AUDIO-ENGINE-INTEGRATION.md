# Audio Engine Integration Guide

## Overview
This guide shows how to integrate the new AudioKit-ported audio engine into the PixelBoop sequencer.

## Files Created
- `src/lib/audioEngine.ts` - Main audio engine singleton
- `src/lib/synths/melodySynth.ts` - 6-preset melody synthesizer
- `src/lib/synths/bassSynth.ts` - 4-preset bass synthesizer
- `src/lib/synths/drums.ts` - Drum synthesizer

## Quick Start

### 1. Initialize the Audio Engine

In `PixelBoopSequencer.tsx`, replace the current `initAudio()` function:

```typescript
import { audioEngine } from '@/lib/audioEngine';

// Replace initAudio function
const initAudio = useCallback(async () => {
  try {
    await audioEngine.init();
    console.log('[PixelBoop] Audio engine initialized');
  } catch (e) {
    console.warn('[PixelBoop] Failed to initialize audio engine:', e);
  }
}, []);
```

### 2. Replace playNote Function

Replace the existing `playNote` callback:

```typescript
const playNote = useCallback((pitch: number, duration: number, trackType: TrackType, velocity = 1) => {
  // Convert frequency to MIDI note number (if needed)
  // Or pass pitch directly if it's already MIDI note number
  const midiVelocity = Math.floor(velocity * 127);
  
  const trackMap: Record<TrackType, number> = {
    melody: 0,
    chords: 1,
    bass: 2,
    rhythm: 3
  };
  
  const trackId = trackMap[trackType];
  
  // Trigger the note
  audioEngine.triggerNote(pitch, midiVelocity, trackId);
  
  // Schedule release after duration
  setTimeout(() => {
    audioEngine.releaseNote(pitch, trackId);
  }, duration * 1000);
}, []);
```

### 3. Update playDrum Function

```typescript
const playDrum = useCallback((drumName: string, velocity: number) => {
  const drumMap: Record<string, number> = {
    kick: 0,
    snare: 3,
    hihat: 7,
    // Add other drum mappings as needed
  };
  
  const drumType = drumMap[drumName] ?? 0;
  const midiVelocity = Math.floor(velocity * 127);
  
  audioEngine.triggerDrum(drumType, midiVelocity);
}, []);
```

### 4. Add Preset Controls (Optional)

Add UI controls to switch between presets:

```typescript
const handleMelodyPresetChange = (preset: number) => {
  audioEngine.setMelodyPreset(preset);
};

const handleBassPresetChange = (preset: number) => {
  audioEngine.setBassPreset(preset);
};

// Example button:
<button onClick={() => handleMelodyPresetChange(1)}>
  Bell Preset
</button>
```

### 5. Track Volume Control

```typescript
const handleVolumeChange = (track: number, volume: number) => {
  audioEngine.setTrackVolume(track, volume);
};
```

## API Reference

### audioEngine.init()
Initialize the audio engine. Must be called from a user gesture.

**Returns:** `Promise<void>`

### audioEngine.triggerNote(pitch, velocity, track)
Trigger a note.

**Parameters:**
- `pitch: number` - MIDI note number (0-127)
- `velocity: number` - Note velocity (0-127)
- `track: number` - Track ID (0=melody, 1=chords, 2=bass)

### audioEngine.releaseNote(pitch, track)
Release a note.

**Parameters:**
- `pitch: number` - MIDI note number (0-127)
- `track: number` - Track ID (0=melody, 1=chords, 2=bass)

### audioEngine.triggerDrum(drumType, velocity)
Trigger a drum sound.

**Parameters:**
- `drumType: number` - Drum type (0-11, see DrumType enum)
- `velocity: number` - Velocity (0-127)

### audioEngine.setMelodyPreset(preset)
Set melody track preset.

**Parameters:**
- `preset: number` - Preset index (0-5)
  - 0: Gliss Lead
  - 1: Bell
  - 2: Flute
  - 3: Square Lead
  - 4: PWM
  - 5: Sync Lead

### audioEngine.setBassPreset(preset)
Set bass track preset.

**Parameters:**
- `preset: number` - Preset index (0-3)
  - 0: Acid Bass
  - 1: FM Bass
  - 2: Saw Bass
  - 3: Sub Bass

### audioEngine.setTrackVolume(track, volume)
Set track volume.

**Parameters:**
- `track: number` - Track ID (0-3)
- `volume: number` - Volume multiplier (0.0-1.5)

## Presets

### Melody Presets (6 total)

1. **Gliss Lead** - Smooth portamento sine lead
   - ADSR: A=0.02, D=0.3, S=0.7, R=0.2
   
2. **Bell** - FM bell-like metallic tone
   - ADSR: A=0.001, D=1.5, S=0.0, R=0.8
   - FM ratio: 7.0, modulation: 3.5
   
3. **Flute** - Soft sine with breath-like attack
   - ADSR: A=0.15, D=0.2, S=0.8, R=0.25
   
4. **Square Lead** - Classic square wave lead
   - ADSR: A=0.01, D=0.15, S=0.85, R=0.15
   
5. **PWM** - Sawtooth approximation of PWM
   - ADSR: A=0.03, D=0.2, S=0.75, R=0.2
   
6. **Sync Lead** - Hard sync style lead (FM)
   - ADSR: A=0.005, D=0.1, S=0.9, R=0.12
   - FM ratio: 3.0, modulation: 2.0

### Bass Presets (4 total)

1. **Acid Bass** - TB-303 style with velocity-controlled filter
   - ADSR: A=0.001, D=0.15, S=0.0, R=0.08
   - Filter: 400Hz + velocity × 1500Hz
   
2. **FM Bass** - Metallic FM bass
   - ADSR: A=0.001, D=0.3, S=0.5, R=0.15
   - Filter: 2000Hz
   - FM ratio: 2.0, modulation: 4.0
   
3. **Saw Bass** - Classic sawtooth bass
   - ADSR: A=0.005, D=0.2, S=0.7, R=0.12
   - Filter: 800Hz
   
4. **Sub Bass** - Deep sine sub bass
   - ADSR: A=0.01, D=0.1, S=0.9, R=0.15
   - Filter: 350Hz

### Drums

- **Kick**: Sine pitch sweep (150Hz→55Hz) + triangle click
- **Snare**: Triangle tone (200Hz) + bandpass noise (4500Hz)
- **Hihat**: Highpass noise (7000Hz)

## Testing

To test the audio engine without full integration:

```typescript
import { audioEngine } from '@/lib/audioEngine';

// Initialize (must be from user gesture)
await audioEngine.init();

// Test melody preset
audioEngine.setMelodyPreset(1); // Bell
audioEngine.triggerNote(60, 100, 0); // Middle C
setTimeout(() => audioEngine.releaseNote(60, 0), 1000);

// Test bass preset
audioEngine.setBassPreset(0); // Acid Bass
audioEngine.triggerNote(36, 120, 2); // Low C
setTimeout(() => audioEngine.releaseNote(36, 2), 500);

// Test drum
audioEngine.triggerDrum(0, 100); // Kick
```

## Migration Checklist

- [ ] Import audioEngine in PixelBoopSequencer.tsx
- [ ] Replace initAudio() function
- [ ] Replace playNote() function
- [ ] Replace playDrum() function
- [ ] Test all 6 melody presets
- [ ] Test all 4 bass presets
- [ ] Test drum sounds (kick, snare, hihat)
- [ ] Verify no clicks/pops on note start/end
- [ ] Test filter sweep on Acid Bass preset
- [ ] Add preset UI controls (optional)
- [ ] Add track volume controls (optional)
- [ ] Run `npm run build` to verify compilation
