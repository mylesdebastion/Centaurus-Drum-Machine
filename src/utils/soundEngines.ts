import * as Tone from 'tone';

/**
 * Sound engine types available for the IsometricSequencer
 */
export type SoundEngineType = 'sine' | '808' | 'pluck' | 'pad' | 'fm-bell';

/**
 * Interface for sound engine implementations
 */
export interface SoundEngine {
  playNote(frequency: number, velocity?: number, duration?: number): void;
  dispose(): void;
}

/**
 * Web Audio API oscillator-based sound engine (default sine wave)
 */
class OscillatorSoundEngine implements SoundEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;

  constructor(audioContext: AudioContext, masterGain: GainNode) {
    this.audioContext = audioContext;
    this.masterGain = masterGain;
  }

  playNote(frequency: number, velocity: number = 0.5, duration: number = 0.3): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(velocity, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  dispose(): void {
    // No cleanup needed for oscillators (they're one-shot)
  }
}

/**
 * 808-style drum machine sound engine using Tone.js MembraneSynth
 */
class Drum808SoundEngine implements SoundEngine {
  private synth: Tone.MembraneSynth;

  constructor() {
    this.synth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    }).toDestination();

    this.synth.volume.value = -6; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.8, duration: number = 0.3): void {
    // Convert frequency to note name for Tone.js
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Pluck/mallet sound engine using Tone.js PluckSynth
 */
class PluckSoundEngine implements SoundEngine {
  private synth: Tone.PluckSynth;

  constructor() {
    this.synth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.7
    }).toDestination();

    this.synth.volume.value = -3; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.8, duration: number = 0.3): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Pad/ambient sound engine using Tone.js Synth with soft envelope
 */
class PadSoundEngine implements SoundEngine {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.5,
        release: 1.0
      }
    }).toDestination();

    this.synth.volume.value = -8; // Normalize volume (pads can be loud)
  }

  playNote(frequency: number, velocity: number = 0.6, duration: number = 0.8): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * FM Bell sound engine using Tone.js FMSynth
 */
class FMBellSoundEngine implements SoundEngine {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.5,
      modulationIndex: 15,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.1,
        release: 0.8
      },
      modulation: { type: 'square' },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0,
        release: 0.2
      }
    }).toDestination();

    this.synth.volume.value = -6; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.7, duration: number = 0.5): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Factory function to create sound engines
 */
export function createSoundEngine(
  type: SoundEngineType,
  audioContext: AudioContext,
  masterGain: GainNode
): SoundEngine {
  switch (type) {
    case 'sine':
      return new OscillatorSoundEngine(audioContext, masterGain);
    case '808':
      return new Drum808SoundEngine();
    case 'pluck':
      return new PluckSoundEngine();
    case 'pad':
      return new PadSoundEngine();
    case 'fm-bell':
      return new FMBellSoundEngine();
    default:
      return new OscillatorSoundEngine(audioContext, masterGain);
  }
}

/**
 * Display names for sound engine types
 */
export const soundEngineNames: Record<SoundEngineType, string> = {
  'sine': 'Sine Wave',
  '808': '808 Drums',
  'pluck': 'Pluck',
  'pad': 'Pad',
  'fm-bell': 'FM Bell'
};
