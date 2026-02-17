/**
 * melodySynth.ts
 * 
 * Melody synthesizer with 6 presets ported from iOS AudioKit implementation
 * Presets: Gliss Lead, Bell, Flute, Square Lead, PWM, Sync Lead
 * 
 * Port of pixelboop/Audio/MelodySynth.swift
 */

export enum MelodyPreset {
  GlissLead = 0,
  Bell = 1,
  Flute = 2,
  SquareLead = 3,
  PWM = 4,
  SyncLead = 5,
}

interface PresetConfig {
  displayName: string;
  shortName: string;
  waveform: OscillatorType | 'fm';
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  fmParams?: {
    modRatio: number;
    modIndex: number;
  };
}

const PRESET_CONFIGS: Record<MelodyPreset, PresetConfig> = {
  [MelodyPreset.GlissLead]: {
    displayName: 'Gliss Lead',
    shortName: 'GLISS',
    waveform: 'sine',
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.2 },
  },
  [MelodyPreset.Bell]: {
    displayName: 'Bell',
    shortName: 'BELL',
    waveform: 'fm',
    envelope: { attack: 0.001, decay: 1.5, sustain: 0.0, release: 0.8 },
    fmParams: { modRatio: 7.0, modIndex: 3.5 },
  },
  [MelodyPreset.Flute]: {
    displayName: 'Flute',
    shortName: 'FLUTE',
    waveform: 'sine',
    envelope: { attack: 0.15, decay: 0.2, sustain: 0.8, release: 0.25 },
  },
  [MelodyPreset.SquareLead]: {
    displayName: 'Square Lead',
    shortName: 'SQUARE',
    waveform: 'square',
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.85, release: 0.15 },
  },
  [MelodyPreset.PWM]: {
    displayName: 'PWM',
    shortName: 'PWM',
    waveform: 'sawtooth',
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.75, release: 0.2 },
  },
  [MelodyPreset.SyncLead]: {
    displayName: 'Sync Lead',
    shortName: 'SYNC',
    waveform: 'fm',
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.9, release: 0.12 },
    fmParams: { modRatio: 3.0, modIndex: 2.0 },
  },
};

interface Voice {
  oscillator: OscillatorNode | null;
  modulator: OscillatorNode | null;
  modulatorGain: GainNode | null;
  gainNode: GainNode;
  noteNumber: number | null;
  releaseTimeout: number | null;
}

export class MelodySynth {
  private audioContext: AudioContext;
  private voices: Voice[] = [];
  private readonly voiceCount = 6;
  private currentPreset: MelodyPreset = MelodyPreset.GlissLead;
  private masterGain: GainNode;
  private volume = 0.5;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.volume;

    // Initialize voice pool
    for (let i = 0; i < this.voiceCount; i++) {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(this.masterGain);

      this.voices.push({
        oscillator: null,
        modulator: null,
        modulatorGain: null,
        gainNode,
        noteNumber: null,
        releaseTimeout: null,
      });
    }
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setPreset(preset: MelodyPreset): void {
    this.currentPreset = preset;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = this.volume;
  }

  play(noteNumber: number, velocity: number): void {
    const voice = this.findFreeVoice();
    if (!voice) return;

    const config = PRESET_CONFIGS[this.currentPreset];
    const frequency = this.midiToFrequency(noteNumber);
    const amplitude = (velocity / 127) * 0.5;

    // Clear any pending release
    if (voice.releaseTimeout !== null) {
      clearTimeout(voice.releaseTimeout);
      voice.releaseTimeout = null;
    }

    // Stop previous oscillators if any
    this.cleanupVoice(voice);

    voice.noteNumber = noteNumber;

    const now = this.audioContext.currentTime;
    const { attack, decay, sustain } = config.envelope;

    if (config.waveform === 'fm' && config.fmParams) {
      // FM synthesis for Bell and Sync Lead
      const carrier = this.audioContext.createOscillator();
      const modulator = this.audioContext.createOscillator();
      const modulatorGain = this.audioContext.createGain();

      carrier.type = 'sine';
      carrier.frequency.value = frequency;

      modulator.type = 'sine';
      modulator.frequency.value = frequency * config.fmParams.modRatio;
      
      // Modulation index scaled by velocity
      const modIndex = config.fmParams.modIndex * (velocity / 127);
      modulatorGain.gain.value = frequency * modIndex;

      modulator.connect(modulatorGain);
      modulatorGain.connect(carrier.frequency);
      carrier.connect(voice.gainNode);

      voice.oscillator = carrier;
      voice.modulator = modulator;
      voice.modulatorGain = modulatorGain;

      carrier.start(now);
      modulator.start(now);
    } else {
      // Standard oscillator synthesis
      const osc = this.audioContext.createOscillator();
      osc.type = config.waveform as OscillatorType;
      osc.frequency.value = frequency;
      osc.connect(voice.gainNode);

      voice.oscillator = osc;
      osc.start(now);
    }

    // ADSR envelope using exponential approximation
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(0, now);
    voice.gainNode.gain.linearRampToValueAtTime(amplitude, now + attack);
    voice.gainNode.gain.setTargetAtTime(
      sustain * amplitude,
      now + attack,
      decay / 3
    );
  }

  stop(noteNumber: number): void {
    const voice = this.voices.find((v) => v.noteNumber === noteNumber);
    if (!voice || !voice.oscillator) return;

    const config = PRESET_CONFIGS[this.currentPreset];
    const releaseTime = config.envelope.release;
    const now = this.audioContext.currentTime;

    // Release envelope
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.setTargetAtTime(0, now, releaseTime / 3);

    // Schedule cleanup after release
    voice.releaseTimeout = window.setTimeout(() => {
      this.cleanupVoice(voice);
    }, releaseTime * 1000 * 5); // 5x release time for full decay
  }

  stopAll(): void {
    this.voices.forEach((voice) => {
      if (voice.noteNumber !== null) {
        this.cleanupVoice(voice);
      }
    });
  }

  private findFreeVoice(): Voice | null {
    // First, find a completely free voice
    const free = this.voices.find((v) => v.noteNumber === null);
    if (free) return free;

    // Otherwise, steal the first voice
    return this.voices[0];
  }

  private cleanupVoice(voice: Voice): void {
    if (voice.oscillator) {
      try {
        voice.oscillator.stop();
        voice.oscillator.disconnect();
      } catch (e) {
        // Already stopped
      }
      voice.oscillator = null;
    }

    if (voice.modulator) {
      try {
        voice.modulator.stop();
        voice.modulator.disconnect();
      } catch (e) {
        // Already stopped
      }
      voice.modulator = null;
    }

    if (voice.modulatorGain) {
      voice.modulatorGain.disconnect();
      voice.modulatorGain = null;
    }

    voice.noteNumber = null;
    voice.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    if (voice.releaseTimeout !== null) {
      clearTimeout(voice.releaseTimeout);
      voice.releaseTimeout = null;
    }
  }

  private midiToFrequency(noteNumber: number): number {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }
}
