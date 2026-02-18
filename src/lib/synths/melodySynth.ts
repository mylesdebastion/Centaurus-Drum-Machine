/**
 * melodySynth.ts
 * 
 * Melody synthesizer with 6 presets using Tone.js
 * Presets: Gliss Lead, Bell, Flute, Square Lead, PWM, Sync Lead
 * 
 * Ported from iOS AudioKit implementation, now using Tone.js for better sound quality
 */

import * as Tone from 'tone';

export enum MelodyPreset {
  GlissLead = 0,
  Bell = 1,
  Flute = 2,
  SquareLead = 3,
  PWM = 4,
  SyncLead = 5,
}

export class MelodySynth {
  // Use PolySynth for polyphonic presets
  private glissLead: Tone.PolySynth<Tone.Synth>;
  private bell: Tone.PolySynth<Tone.FMSynth>;
  private flute: Tone.PolySynth<Tone.Synth>;
  private squareLead: Tone.PolySynth<Tone.Synth>;
  private pwm: Tone.PolySynth<Tone.Synth>;
  private syncLead: Tone.PolySynth<Tone.FMSynth>;

  // Effects chain for musical depth
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private masterGain: Tone.Gain;

  private currentPreset: MelodyPreset = MelodyPreset.GlissLead;
  private volume = 0.5;
  private activeNotes: Map<number, string> = new Map(); // noteNumber -> synth type

  constructor() {
    // Master gain for overall volume
    this.masterGain = new Tone.Gain(this.volume);

    // Effects chain: reverb for space
    this.reverb = new Tone.Reverb({
      decay: 1.5,
      preDelay: 0.01,
      wet: 0.25,
    });
    this.reverb.connect(this.masterGain);

    // Subtle delay for depth
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.2,
      wet: 0.15,
    });
    this.delay.connect(this.reverb);

    // === GLISS LEAD: Smooth sine with portamento feel ===
    this.glissLead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.7,
        release: 0.2,
      },
    });
    this.glissLead.maxPolyphony = 6;
    this.glissLead.volume.value = -8;
    this.glissLead.connect(this.delay);

    // === BELL: FM synthesis with metallic harmonics ===
    this.bell = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 7,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0.0,
        release: 0.8,
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.8,
        sustain: 0.1,
        release: 0.5,
      },
    });
    this.bell.maxPolyphony = 6;
    this.bell.volume.value = -10;
    this.bell.connect(this.reverb); // More reverb for bell

    // === FLUTE: Breathy sine with slow attack ===
    this.flute = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.15,
        decay: 0.2,
        sustain: 0.8,
        release: 0.25,
      },
    });
    this.flute.maxPolyphony = 6;
    this.flute.volume.value = -8;
    this.flute.connect(this.delay);

    // === SQUARE LEAD: Classic 8-bit style ===
    this.squareLead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.85,
        release: 0.15,
      },
    });
    this.squareLead.maxPolyphony = 6;
    this.squareLead.volume.value = -12; // Squares are loud
    this.squareLead.connect(this.delay);

    // === PWM: Fat detuned sawtooth (simulating PWM) ===
    this.pwm = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', spread: 30, count: 3 },
      envelope: {
        attack: 0.03,
        decay: 0.2,
        sustain: 0.75,
        release: 0.2,
      },
    });
    this.pwm.maxPolyphony = 6;
    this.pwm.volume.value = -10;
    this.pwm.connect(this.delay);

    // === SYNC LEAD: Aggressive FM with fast attack ===
    this.syncLead = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'square' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.9,
        release: 0.12,
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.1,
        sustain: 0.5,
        release: 0.1,
      },
    });
    this.syncLead.maxPolyphony = 6;
    this.syncLead.volume.value = -8;
    this.syncLead.connect(this.delay);
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setPreset(preset: MelodyPreset): void {
    // Stop all notes before switching preset to avoid stuck notes (iOS parity)
    this.stopAll();
    this.currentPreset = preset;
  }

  getPreset(): MelodyPreset {
    return this.currentPreset;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = volume;
  }

  play(noteNumber: number, velocity: number): void {
    const freq = Tone.Frequency(noteNumber, 'midi').toFrequency();
    const velNorm = velocity / 127;
    const now = Tone.now();

    // Stop any existing note at this pitch (for re-trigger)
    this.stop(noteNumber);

    // Track which synth is playing this note
    const presetNames = ['gliss', 'bell', 'flute', 'square', 'pwm', 'sync'];
    this.activeNotes.set(noteNumber, presetNames[this.currentPreset]);

    switch (this.currentPreset) {
      case MelodyPreset.GlissLead:
        this.glissLead.triggerAttack(freq, now, velNorm);
        break;

      case MelodyPreset.Bell:
        this.bell.triggerAttack(freq, now, velNorm);
        break;

      case MelodyPreset.Flute:
        this.flute.triggerAttack(freq, now, velNorm);
        break;

      case MelodyPreset.SquareLead:
        this.squareLead.triggerAttack(freq, now, velNorm);
        break;

      case MelodyPreset.PWM:
        this.pwm.triggerAttack(freq, now, velNorm);
        break;

      case MelodyPreset.SyncLead:
        this.syncLead.triggerAttack(freq, now, velNorm);
        break;
    }
  }

  stop(noteNumber: number): void {
    const synthType = this.activeNotes.get(noteNumber);
    if (!synthType) return;

    const freq = Tone.Frequency(noteNumber, 'midi').toFrequency();
    const now = Tone.now();

    switch (synthType) {
      case 'gliss':
        this.glissLead.triggerRelease(freq, now);
        break;
      case 'bell':
        this.bell.triggerRelease(freq, now);
        break;
      case 'flute':
        this.flute.triggerRelease(freq, now);
        break;
      case 'square':
        this.squareLead.triggerRelease(freq, now);
        break;
      case 'pwm':
        this.pwm.triggerRelease(freq, now);
        break;
      case 'sync':
        this.syncLead.triggerRelease(freq, now);
        break;
    }

    this.activeNotes.delete(noteNumber);
  }

  stopAll(): void {
    const now = Tone.now();
    this.glissLead.releaseAll(now);
    this.bell.releaseAll(now);
    this.flute.releaseAll(now);
    this.squareLead.releaseAll(now);
    this.pwm.releaseAll(now);
    this.syncLead.releaseAll(now);
    this.activeNotes.clear();
  }

  dispose(): void {
    this.glissLead.dispose();
    this.bell.dispose();
    this.flute.dispose();
    this.squareLead.dispose();
    this.pwm.dispose();
    this.syncLead.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.masterGain.dispose();
  }
}
