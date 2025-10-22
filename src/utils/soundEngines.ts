import * as Tone from 'tone';

/**
 * Sound engine types available for the IsometricSequencer
 */
export type SoundEngineType = 'keys' | 'sine' | 'drums' | 'pluck' | 'pad' | 'fm-bell' | 'bass' | 'guitar';

/**
 * Interface for sound engine implementations
 */
export interface SoundEngine {
  playNote(frequency: number, velocity?: number, duration?: number): void;
  triggerAttack?(frequency: number, velocity?: number): void;  // For sustaining notes
  triggerRelease?(frequency: number): void;  // For releasing sustained notes
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
 * Drum machine sound engine matching original jam mode drums
 * Maps frequencies to different drum sounds from audioEngine.ts
 */
class DrumSoundEngine implements SoundEngine {
  private drumSamples: { [key: string]: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth };
  private masterVolume: Tone.Volume;

  constructor() {
    this.masterVolume = new Tone.Volume(-6).toDestination();

    // Create drum samples matching original audioEngine.ts configuration
    this.drumSamples = {
      'kick': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).connect(this.masterVolume),

      'snare': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
      }).connect(this.masterVolume),

      'rimshot': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 8,
        modulationIndex: 10,
        resonance: 3000,
        octaves: 0.5
      }).connect(this.masterVolume),

      'hihat': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).connect(this.masterVolume),

      'openhat': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).connect(this.masterVolume),

      'clap': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
      }).connect(this.masterVolume),

      'crash': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 64,
        resonance: 4000,
        octaves: 1.5
      }).connect(this.masterVolume),

      'ride': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 16,
        resonance: 4000,
        octaves: 1.5
      }).connect(this.masterVolume),

      'lowtom': new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.006, decay: 0.5, sustain: 0.0 }
      }).connect(this.masterVolume),

      'hightom': new Tone.MembraneSynth({
        pitchDecay: 0.006,
        octaves: 1.5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.004, decay: 0.4, sustain: 0.0 }
      }).connect(this.masterVolume)
    };
  }

  /**
   * Convert velocity (0-1) to decibels (-40 to 0)
   * Matches audioEngine.ts velocityToDb() for proper dynamics
   */
  private velocityToDb(velocity: number): number {
    return Math.max(-40, Math.log10(Math.max(0.01, velocity)) * 20);
  }

  playNote(frequency: number, velocity: number = 0.8): void {
    // Map frequency ranges to different drum sounds based on boomwhacker colors:
    // Red=C, Orange=D, Yellow=E, Yellow-Green=F, Green=G, Blue-Green=G#, Blue=A, Purple=B
    let sample: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;
    let drumType: string;

    if (frequency < 270) {
      // C-C# (Red-Orange-Red): Kick drum
      sample = this.drumSamples['kick'] as Tone.MembraneSynth;
      drumType = 'kick';
    } else if (frequency < 305) {
      // D (Orange): Low tom
      sample = this.drumSamples['lowtom'] as Tone.MembraneSynth;
      drumType = 'lowtom';
    } else if (frequency < 340) {
      // D#-E (Yellow-Orange to Yellow): High tom
      sample = this.drumSamples['hightom'] as Tone.MembraneSynth;
      drumType = 'hightom';
    } else if (frequency < 370) {
      // F (Yellow-Green): Snare
      sample = this.drumSamples['snare'] as Tone.NoiseSynth;
      drumType = 'snare';
    } else if (frequency < 405) {
      // F#-G (Green-Yellow to Green): Rimshot / side stick
      sample = this.drumSamples['rimshot'] as Tone.MetalSynth;
      drumType = 'rimshot';
    } else if (frequency < 430) {
      // G# (Blue-Green): Clap
      sample = this.drumSamples['clap'] as Tone.NoiseSynth;
      drumType = 'clap';
    } else if (frequency < 455) {
      // A (Blue): Closed hi-hat
      sample = this.drumSamples['hihat'] as Tone.MetalSynth;
      drumType = 'hihat';
    } else if (frequency < 480) {
      // A# (Blue-Purple): Open hi-hat
      sample = this.drumSamples['openhat'] as Tone.MetalSynth;
      drumType = 'openhat';
    } else if (frequency < 520) {
      // B (Purple): Ride
      sample = this.drumSamples['ride'] as Tone.MetalSynth;
      drumType = 'ride';
    } else {
      // Higher: Crash
      sample = this.drumSamples['crash'] as Tone.MetalSynth;
      drumType = 'crash';
    }

    try {
      const now = Tone.now();
      const volumeDb = this.velocityToDb(velocity);

      if (sample instanceof Tone.MembraneSynth) {
        // For kick and tom drums - use pitch variation
        let note: string;
        if (drumType === 'kick') {
          note = 'C1';
        } else if (drumType === 'lowtom') {
          note = 'F2';  // Lower tom pitch
        } else if (drumType === 'hightom') {
          note = 'A2';  // Higher tom pitch
        } else {
          note = 'C3';
        }
        sample.volume.value = volumeDb;
        sample.triggerAttackRelease(note, '8n', now);
      } else if (sample instanceof Tone.NoiseSynth) {
        // For snare and clap
        sample.volume.value = volumeDb;
        sample.triggerAttackRelease('8n', now);
      } else if (sample instanceof Tone.MetalSynth) {
        // For hi-hats, crash, ride, rimshot
        sample.volume.value = volumeDb;
        sample.triggerAttackRelease('8n', now);
      }
    } catch (error) {
      console.error(`Error playing drum sound:`, error);
    }
  }

  dispose(): void {
    Object.values(this.drumSamples).forEach(sample => {
      sample.dispose();
    });
    this.masterVolume.dispose();
  }
}

/**
 * Pluck/mallet sound engine using Tone.js PluckSynth
 * Softer pluck sound with less percussive attack
 */
class PluckSoundEngine implements SoundEngine {
  private synth: Tone.PluckSynth;

  constructor() {
    this.synth = new Tone.PluckSynth({
      attackNoise: 0.5,    // Reduced from 1 for softer attack
      dampening: 3000,     // Reduced from 4000 for longer sustain
      resonance: 0.85      // Increased from 0.7 for more resonance
    }).toDestination();

    this.synth.volume.value = -3; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.8, duration: number = 0.5): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Pad/ambient sound engine using Tone.js Synth with soft envelope
 * Smooth, rounded tone with extended release for ambient atmosphere
 */
class PadSoundEngine implements SoundEngine {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },  // Changed from triangle to sine for rounder sound
      envelope: {
        attack: 0.2,          // Slightly longer attack for smoother onset
        decay: 0.4,           // Slightly longer decay
        sustain: 0.7,         // Higher sustain for fuller body and held notes
        release: 1.5          // Extended release from 1.0 to 1.5 for longer tail
      }
    }).toDestination();

    this.synth.volume.value = -8; // Normalize volume (pads can be loud)
  }

  playNote(frequency: number, velocity: number = 0.6, duration: number = 1.0): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  triggerAttack(frequency: number, velocity: number = 0.6): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttack(note, undefined, velocity);
  }

  triggerRelease(frequency: number): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerRelease(note);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * FM Bell sound engine using Tone.js FMSynth
 * Bright, metallic, crystalline tone with complex harmonics
 */
class FMBellSoundEngine implements SoundEngine {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 8,        // Higher ratio for more metallic, bell-like quality
      modulationIndex: 25,   // Increased modulation for brighter, more complex harmonics
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,       // Very fast attack for bell strike
        decay: 1.2,          // Longer decay for sustained shimmer
        sustain: 0.2,        // Higher sustain for held notes
        release: 1.5         // Extended release for lingering resonance
      },
      modulation: { type: 'sine' },  // Sine modulation for smoother harmonics
      modulationEnvelope: {
        attack: 0.0005,      // Instant modulation attack
        decay: 0.6,          // Longer decay for evolving timbre
        sustain: 0.2,
        release: 0.8         // Extended release for complex harmonics
      }
    }).toDestination();

    this.synth.volume.value = -8; // Slightly quieter due to bright harmonics
  }

  playNote(frequency: number, velocity: number = 0.7, duration: number = 1.0): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  triggerAttack(frequency: number, velocity: number = 0.7): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttack(note, undefined, velocity);
  }

  triggerRelease(frequency: number): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerRelease(note);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Fender Rhodes electric piano sound engine
 * Warm, bell-like tone with characteristic FM texture
 */
class RhodesSoundEngine implements SoundEngine {
  private synth: Tone.PolySynth;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,     // Slightly detuned for classic Rhodes character
      modulationIndex: 14,   // Moderate modulation for warm, bell-like tone
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.005,       // Quick attack like struck tine
        decay: 0.8,          // Medium decay
        sustain: 0.4,        // Higher sustain for held notes
        release: 1.2         // Natural release
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.4,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();

    // Add subtle chorus effect for authentic Rhodes sound
    const chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      spread: 180
    }).toDestination();

    this.synth.connect(chorus);
    this.synth.volume.value = -8; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.7, duration: number = 1.2): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  triggerAttack(frequency: number, velocity: number = 0.7): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttack(note, undefined, velocity);
  }

  triggerRelease(frequency: number): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerRelease(note);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Bass sound engine using Tone.js MonoSynth
 * Deep, warm bass sound pitched two octaves lower
 */
class BassSoundEngine implements SoundEngine {
  private synth: Tone.MonoSynth;

  constructor() {
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'     // Rich harmonics for bass
      },
      filter: {
        Q: 2,
        type: 'lowpass',
        frequency: 800       // Low-pass filter for warm bass
      },
      envelope: {
        attack: 0.01,        // Quick attack
        decay: 0.3,
        sustain: 0.4,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.5,
        baseFrequency: 200,  // Bass frequency range
        octaves: 2.5
      }
    }).toDestination();

    this.synth.volume.value = -3; // Normalize volume
  }

  playNote(frequency: number, velocity: number = 0.8, duration: number = 0.4): void {
    // Pitch down by two octaves (divide frequency by 4)
    const bassFrequency = frequency / 4;
    const note = Tone.Frequency(bassFrequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  dispose(): void {
    this.synth.dispose();
  }
}

/**
 * Acoustic guitar sound engine using Tone.js Sampler
 * Uses real acoustic guitar samples with reverb for spatial depth
 */
class GuitarSoundEngine implements SoundEngine {
  private sampler: Tone.Sampler;
  private reverb: Tone.Reverb;

  constructor() {
    // Create reverb for spatial depth
    this.reverb = new Tone.Reverb({
      decay: 1.8,
      wet: 0.25
    }).toDestination();

    // Use Tone.Sampler with real acoustic guitar samples
    // From Tonejs-Instruments library - verified available samples
    this.sampler = new Tone.Sampler({
      urls: {
        A2: "A2.mp3",
        A3: "A3.mp3",
        A4: "A4.mp3",
        C3: "C3.mp3",
        C4: "C4.mp3",
        C5: "C5.mp3",
        "D#3": "Ds3.mp3",
        "D#4": "Ds4.mp3",
        "F#2": "Fs2.mp3",
        "F#3": "Fs3.mp3",
        "F#4": "Fs4.mp3",
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
      onload: () => {
        console.log('🎸 Acoustic guitar samples loaded successfully');
      },
      volume: -4,
      release: 1
    }).connect(this.reverb);
  }

  playNote(frequency: number, velocity: number = 0.8, duration: number = 1.0): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.sampler.triggerAttackRelease(note, duration, undefined, velocity);
  }

  triggerAttack(frequency: number, velocity: number = 0.8): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.sampler.triggerAttack(note, undefined, velocity);
  }

  triggerRelease(frequency: number): void {
    const note = Tone.Frequency(frequency, 'hz').toNote();
    this.sampler.triggerRelease(note);
  }

  dispose(): void {
    this.sampler.dispose();
    this.reverb.dispose();
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
    case 'keys':
      return new RhodesSoundEngine();
    case 'sine':
      return new OscillatorSoundEngine(audioContext, masterGain);
    case 'drums':
      return new DrumSoundEngine();
    case 'pluck':
      return new PluckSoundEngine();
    case 'pad':
      return new PadSoundEngine();
    case 'fm-bell':
      return new FMBellSoundEngine();
    case 'bass':
      return new BassSoundEngine();
    case 'guitar':
      return new GuitarSoundEngine();
    default:
      return new RhodesSoundEngine();
  }
}

/**
 * Display names for sound engine types
 */
export const soundEngineNames: Record<SoundEngineType, string> = {
  'keys': 'Keys',
  'sine': 'Sine Wave',
  'drums': 'Drums',
  'pluck': 'Pluck',
  'pad': 'Pad',
  'fm-bell': 'FM Bell',
  'bass': 'Bass',
  'guitar': 'Guitar'
};
