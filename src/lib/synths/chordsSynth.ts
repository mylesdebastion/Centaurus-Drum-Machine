/**
 * chordsSynth.ts
 * 
 * Chord synthesizer with 6 presets using Tone.js
 * Presets: Pad, Piano, Rhodes EP, Wurlitzer, Pluck, Organ
 * 
 * Ported from iOS RhodesSynth.swift ChordPreset enum
 * Rhodes uses FM synthesis for authentic electric piano tone
 */

import * as Tone from 'tone';

export enum ChordPreset {
  Pad = 0,       // Favorite - soft pad
  Piano = 1,    // Acoustic piano style
  RhodesEP = 2, // Rhodes electric piano - thicker tone
  Wurlitzer = 3, // Wurlitzer with chorus character
  Pluck = 4,    // Plucky synth
  Organ = 5,    // Drawbar organ
}

// Preset display names (matching iOS)
export const CHORD_PRESET_NAMES: Record<ChordPreset, string> = {
  [ChordPreset.Pad]: 'Pad',
  [ChordPreset.Piano]: 'Piano',
  [ChordPreset.RhodesEP]: 'Rhodes EP',
  [ChordPreset.Wurlitzer]: 'Wurlitzer',
  [ChordPreset.Pluck]: 'Pluck',
  [ChordPreset.Organ]: 'Organ',
};

// Short names for tooltips
export const CHORD_PRESET_SHORT_NAMES: Record<ChordPreset, string> = {
  [ChordPreset.Pad]: 'PAD',
  [ChordPreset.Piano]: 'PIANO',
  [ChordPreset.RhodesEP]: 'RHODES',
  [ChordPreset.Wurlitzer]: 'WURLI',
  [ChordPreset.Pluck]: 'PLUCK',
  [ChordPreset.Organ]: 'ORGAN',
};

export class ChordsSynth {
  // === PAD: Slow attack, long sustain - favorite preset ===
  private pad: Tone.PolySynth<Tone.FMSynth>;
  
  // === PIANO: Acoustic piano style with fast attack ===
  private piano: Tone.PolySynth<Tone.FMSynth>;
  
  // === RHODES EP: Classic FM electric piano ===
  private rhodes: Tone.PolySynth<Tone.FMSynth>;
  
  // === WURLITZER: Reedy character with chorus-like spread ===
  private wurlitzer: Tone.PolySynth<Tone.FMSynth>;
  
  // === PLUCK: Short plucky synth ===
  private pluck: Tone.PolySynth<Tone.FMSynth>;
  
  // === ORGAN: Sustained drawbar organ ===
  private organ: Tone.PolySynth<Tone.Synth>;

  // Effects chain
  private reverb: Tone.Reverb;
  private chorus: Tone.Chorus;
  private masterGain: Tone.Gain;

  private currentPreset: ChordPreset = ChordPreset.Pad;
  private volume = 0.5;
  private activeNotes: Map<number, string> = new Map(); // noteNumber -> synth type

  constructor() {
    // Master gain for overall volume
    this.masterGain = new Tone.Gain(this.volume);

    // Effects chain: reverb for space
    this.reverb = new Tone.Reverb({
      decay: 2.0,
      preDelay: 0.01,
      wet: 0.3,
    });
    this.reverb.connect(this.masterGain);

    // Chorus for Wurlitzer-style stereo spread
    this.chorus = new Tone.Chorus({
      frequency: 2.5,
      delayTime: 3.5,
      depth: 0.5,
      wet: 0.4,
    });
    this.chorus.connect(this.reverb);
    this.chorus.start();

    // === PAD: Soft, warm FM pad ===
    // iOS: attack: 0.3, decay: 0.5, sustain: 0.8, release: 0.8
    // FM: modRatio: 2.0, modIndex: 0.5, brightness: 0.3
    this.pad = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.0,
      modulationIndex: 0.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.3,
        decay: 0.5,
        sustain: 0.8,
        release: 0.8,
      },
      modulationEnvelope: {
        attack: 0.3,
        decay: 0.4,
        sustain: 0.5,
        release: 0.8,
      },
    });
    this.pad.maxPolyphony = 8;
    this.pad.volume.value = -8;
    this.pad.connect(this.reverb);

    // === PIANO: Acoustic piano style ===
    // iOS: attack: 0.002, decay: 1.5, sustain: 0.25, release: 0.6
    // FM: modRatio: 1.0, modIndex: 1.8, brightness: 0.55
    this.piano = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 1.8,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.002,
        decay: 1.5,
        sustain: 0.25,
        release: 0.6,
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.8,
        sustain: 0.2,
        release: 0.5,
      },
    });
    this.piano.maxPolyphony = 8;
    this.piano.volume.value = -6;
    this.piano.connect(this.reverb); // Subtle reverb for space

    // === RHODES EP: Classic FM electric piano ===
    // iOS: attack: 0.003, decay: 1.0, sustain: 0.5, release: 0.4
    // FM: modRatio: 1.0, modIndex: 3.5, brightness: 0.7, bellAmount: 0.7
    this.rhodes = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.003,
        decay: 1.0,
        sustain: 0.5,
        release: 0.4,
      },
      modulationEnvelope: {
        attack: 0.003,
        decay: 0.6,
        sustain: 0.3,
        release: 0.3,
      },
    });
    this.rhodes.maxPolyphony = 8;
    this.rhodes.volume.value = -6;
    this.rhodes.connect(this.reverb);

    // === WURLITZER: Reedy character with chorus ===
    // iOS: attack: 0.002, decay: 0.6, sustain: 0.35, release: 0.25
    // FM: modRatio: 3.0, modIndex: 2.5, brightness: 0.75
    // stereoWidth: 0.6 (chorus effect)
    this.wurlitzer = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.0,
      modulationIndex: 2.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'square' },
      envelope: {
        attack: 0.002,
        decay: 0.6,
        sustain: 0.35,
        release: 0.25,
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.4,
        sustain: 0.3,
        release: 0.2,
      },
    });
    this.wurlitzer.maxPolyphony = 8;
    this.wurlitzer.volume.value = -8;
    this.wurlitzer.connect(this.chorus); // Through chorus for stereo spread

    // === PLUCK: Short plucky synth ===
    // iOS: attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.1
    // FM: modRatio: 11.0, modIndex: 4.0, brightness: 0.9
    this.pluck = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 11.0,
      modulationIndex: 4.0,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.0,
        release: 0.1,
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0.0,
        release: 0.1,
      },
    });
    this.pluck.maxPolyphony = 8;
    this.pluck.volume.value = -8;
    this.pluck.connect(this.reverb);

    // === ORGAN: Sustained drawbar organ ===
    // iOS: attack: 0.01, decay: 0.0, sustain: 1.0, release: 0.05
    // FM: modRatio: 1.0, modIndex: 0.1, brightness: 0.5
    // Using basic Synth for cleaner organ tone
    this.organ = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsine', spread: 20, count: 3 },
      envelope: {
        attack: 0.01,
        decay: 0.0,
        sustain: 1.0,
        release: 0.05,
      },
    });
    this.organ.maxPolyphony = 8;
    this.organ.volume.value = -8;
    this.organ.connect(this.reverb);
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setPreset(preset: ChordPreset): void {
    // Stop all notes before switching preset to avoid stuck notes
    this.stopAll();
    this.currentPreset = preset;
  }

  getPreset(): ChordPreset {
    return this.currentPreset;
  }

  setVolume(volume: number): void {
    // iOS uses 0.0-1.5 range (0%-150%)
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = this.volume;
  }

  play(noteNumber: number, velocity: number): void {
    // Defensive checks
    if (!this.masterGain || !Number.isFinite(noteNumber) || noteNumber < 0 || noteNumber > 127) {
      console.warn('ChordsSynth.play: Invalid state or note', { noteNumber, velocity });
      return;
    }

    try {
      const freq = Tone.Frequency(noteNumber, 'midi').toFrequency();
      const velNorm = velocity / 127;
      const now = Tone.now();

      // Stop any existing note at this pitch (for re-trigger)
      this.stop(noteNumber);

      // Track which synth is playing this note
      const presetNames = ['pad', 'piano', 'rhodes', 'wurli', 'pluck', 'organ'];
      this.activeNotes.set(noteNumber, presetNames[this.currentPreset]);

      switch (this.currentPreset) {
        case ChordPreset.Pad:
          this.pad.triggerAttack(freq, now, velNorm);
          break;

        case ChordPreset.Piano:
          this.piano.triggerAttack(freq, now, velNorm);
          break;

        case ChordPreset.RhodesEP:
          // Rhodes: velocity affects modulation index for bell/bark character
          // This mimics iOS behavior where velocity affects FM modulation
          this.rhodes.triggerAttack(freq, now, velNorm);
          break;

        case ChordPreset.Wurlitzer:
          this.wurlitzer.triggerAttack(freq, now, velNorm);
          break;

        case ChordPreset.Pluck:
          this.pluck.triggerAttack(freq, now, velNorm);
          break;

        case ChordPreset.Organ:
          this.organ.triggerAttack(freq, now, velNorm);
          break;
      }
    } catch (e) {
      console.warn('ChordsSynth.play: Audio trigger failed:', e);
    }
  }

  stop(noteNumber: number): void {
    const synthType = this.activeNotes.get(noteNumber);
    if (!synthType) return;

    try {
      const freq = Tone.Frequency(noteNumber, 'midi').toFrequency();
      const now = Tone.now();

      switch (synthType) {
        case 'pad':
          this.pad.triggerRelease(freq, now);
          break;
        case 'piano':
          this.piano.triggerRelease(freq, now);
          break;
        case 'rhodes':
          this.rhodes.triggerRelease(freq, now);
          break;
        case 'wurli':
          this.wurlitzer.triggerRelease(freq, now);
          break;
        case 'pluck':
          this.pluck.triggerRelease(freq, now);
          break;
        case 'organ':
          this.organ.triggerRelease(freq, now);
          break;
      }
    } catch (e) {
      console.warn('ChordsSynth.stop: Audio release failed:', e);
    }

    this.activeNotes.delete(noteNumber);
  }

  stopAll(): void {
    try {
      const now = Tone.now();
      this.pad.releaseAll(now);
      this.piano.releaseAll(now);
      this.rhodes.releaseAll(now);
      this.wurlitzer.releaseAll(now);
      this.pluck.releaseAll(now);
      this.organ.releaseAll(now);
    } catch (e) {
      console.warn('ChordsSynth.stopAll: Audio release failed:', e);
    }
    this.activeNotes.clear();
  }

  dispose(): void {
    this.pad.dispose();
    this.piano.dispose();
    this.rhodes.dispose();
    this.wurlitzer.dispose();
    this.pluck.dispose();
    this.organ.dispose();
    this.reverb.dispose();
    this.chorus.dispose();
    this.masterGain.dispose();
  }
}
