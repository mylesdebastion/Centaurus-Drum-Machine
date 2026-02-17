/**
 * bassSynth.ts
 * 
 * Bass synthesizer with 4 presets using Tone.js
 * Presets: Acid Bass, FM Bass, Saw Bass, Sub Bass
 * 
 * Ported from iOS AudioKit implementation, now using Tone.js for better sound quality
 */

import * as Tone from 'tone';

export enum BassPreset {
  AcidBass = 0,
  FMBass = 1,
  SawBass = 2,
  SubBass = 3,
}

export class BassSynth {
  private acidBass: Tone.MonoSynth;
  private fmBass: Tone.FMSynth;
  private sawBass: Tone.MonoSynth;
  private subBass: Tone.MonoSynth;

  private acidFilter: Tone.Filter;
  private masterGain: Tone.Gain;

  private currentPreset: BassPreset = BassPreset.AcidBass;
  private volume = 0.6;
  private activeNotes: Map<number, string> = new Map(); // noteNumber -> synth type

  constructor() {
    // Master gain for overall volume
    this.masterGain = new Tone.Gain(this.volume);

    // Acid Bass filter for velocity-controlled cutoff sweep
    this.acidFilter = new Tone.Filter({
      frequency: 400,
      type: 'lowpass',
      rolloff: -24,
      Q: 4, // Higher Q for acid character
    });
    this.acidFilter.connect(this.masterGain);

    // === ACID BASS: Resonant sawtooth with filter envelope ===
    this.acidBass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0.0,
        release: 0.08,
      },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.2,
        release: 0.2,
        baseFrequency: 200,
        octaves: 3,
      },
    });
    this.acidBass.volume.value = -6;
    this.acidBass.connect(this.acidFilter);

    // === FM BASS: Rich FM synthesis with sub harmonics ===
    this.fmBass = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.5,
        release: 0.15,
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.3,
        release: 0.2,
      },
    });
    this.fmBass.volume.value = -4;
    this.fmBass.connect(this.masterGain);

    // === SAW BASS: Warm detuned sawtooth ===
    this.sawBass = new Tone.MonoSynth({
      oscillator: { type: 'fatsawtooth', spread: 20, count: 3 },
      envelope: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0.7,
        release: 0.12,
      },
      filter: {
        type: 'lowpass',
        frequency: 800,
        Q: 1,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.5,
        release: 0.2,
        baseFrequency: 300,
        octaves: 2,
      },
    });
    this.sawBass.volume.value = -6;
    this.sawBass.connect(this.masterGain);

    // === SUB BASS: Pure sine with subtle harmonics ===
    this.subBass = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.9,
        release: 0.15,
      },
      filter: {
        type: 'lowpass',
        frequency: 350,
        Q: 0.5,
      },
    });
    this.subBass.volume.value = -2;
    this.subBass.connect(this.masterGain);
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setPreset(preset: BassPreset): void {
    this.currentPreset = preset;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = volume;
  }

  play(noteNumber: number, velocity: number): void {
    const freq = Tone.Frequency(noteNumber, 'midi').toFrequency();
    const velNorm = velocity / 127;
    const now = Tone.now();

    // Stop any existing note at this pitch
    this.stop(noteNumber);

    // Track which synth is playing this note
    const presetNames = ['acid', 'fm', 'saw', 'sub'];
    this.activeNotes.set(noteNumber, presetNames[this.currentPreset]);

    switch (this.currentPreset) {
      case BassPreset.AcidBass:
        // Velocity controls filter cutoff for acid character
        const filterFreq = 400 + velNorm * 1500;
        this.acidFilter.frequency.setValueAtTime(filterFreq, now);
        this.acidBass.triggerAttack(freq, now, velNorm);
        break;

      case BassPreset.FMBass:
        // Velocity affects modulation index for brighter attack
        this.fmBass.modulationIndex.value = 2 + velNorm * 3;
        this.fmBass.triggerAttack(freq, now, velNorm);
        break;

      case BassPreset.SawBass:
        this.sawBass.triggerAttack(freq, now, velNorm);
        break;

      case BassPreset.SubBass:
        this.subBass.triggerAttack(freq, now, velNorm);
        break;
    }
  }

  stop(noteNumber: number): void {
    const synthType = this.activeNotes.get(noteNumber);
    if (!synthType) return;

    const now = Tone.now();

    switch (synthType) {
      case 'acid':
        this.acidBass.triggerRelease(now);
        break;
      case 'fm':
        this.fmBass.triggerRelease(now);
        break;
      case 'saw':
        this.sawBass.triggerRelease(now);
        break;
      case 'sub':
        this.subBass.triggerRelease(now);
        break;
    }

    this.activeNotes.delete(noteNumber);
  }

  stopAll(): void {
    const now = Tone.now();
    this.acidBass.triggerRelease(now);
    this.fmBass.triggerRelease(now);
    this.sawBass.triggerRelease(now);
    this.subBass.triggerRelease(now);
    this.activeNotes.clear();
  }

  dispose(): void {
    this.acidBass.dispose();
    this.fmBass.dispose();
    this.sawBass.dispose();
    this.subBass.dispose();
    this.acidFilter.dispose();
    this.masterGain.dispose();
  }
}
