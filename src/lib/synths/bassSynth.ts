/**
 * bassSynth.ts
 * 
 * Bass synthesizer with 4 presets ported from iOS AudioKit implementation
 * Presets: Acid Bass, FM Bass, Saw Bass, Sub Bass
 * 
 * Port of pixelboop/Audio/BassSynth.swift
 */

export enum BassPreset {
  AcidBass = 0,
  FMBass = 1,
  SawBass = 2,
  SubBass = 3,
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
  filterCutoff: number;
  volumeMultiplier: number;
  fmParams?: {
    modRatio: number;
    modIndex: number;
  };
}

const PRESET_CONFIGS: Record<BassPreset, PresetConfig> = {
  [BassPreset.AcidBass]: {
    displayName: 'Acid Bass',
    shortName: 'ACID',
    waveform: 'sawtooth',
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.08 },
    filterCutoff: 400, // Base cutoff, will add velocity sweep
    volumeMultiplier: 0.85,
  },
  [BassPreset.FMBass]: {
    displayName: 'FM Bass',
    shortName: 'FM',
    waveform: 'fm',
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.5, release: 0.15 },
    filterCutoff: 2000,
    volumeMultiplier: 1.15,
    fmParams: { modRatio: 2.0, modIndex: 4.0 },
  },
  [BassPreset.SawBass]: {
    displayName: 'Saw Bass',
    shortName: 'SAW',
    waveform: 'sawtooth',
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.7, release: 0.12 },
    filterCutoff: 800,
    volumeMultiplier: 1.0,
  },
  [BassPreset.SubBass]: {
    displayName: 'Sub Bass',
    shortName: 'SUB',
    waveform: 'sine',
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.15 },
    filterCutoff: 350,
    volumeMultiplier: 1.2,
  },
};

interface Voice {
  oscillator: OscillatorNode | null;
  modulator: OscillatorNode | null;
  modulatorGain: GainNode | null;
  filter: BiquadFilterNode;
  gainNode: GainNode;
  noteNumber: number | null;
  releaseTimeout: number | null;
}

export class BassSynth {
  private audioContext: AudioContext;
  private voices: Voice[] = [];
  private readonly voiceCount = 4;
  private currentPreset: BassPreset = BassPreset.AcidBass;
  private masterGain: GainNode;
  private volume = 0.6;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.volume;

    // Initialize voice pool
    for (let i = 0; i < this.voiceCount; i++) {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;

      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      this.voices.push({
        oscillator: null,
        modulator: null,
        modulatorGain: null,
        filter,
        gainNode,
        noteNumber: null,
        releaseTimeout: null,
      });
    }
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setPreset(preset: BassPreset): void {
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
    const baseAmp = (velocity / 127) * 0.6;
    const amplitude = baseAmp * config.volumeMultiplier;

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

    // Set filter cutoff (velocity-controlled for Acid Bass)
    let filterCutoff = config.filterCutoff;
    if (this.currentPreset === BassPreset.AcidBass) {
      filterCutoff = config.filterCutoff + (velocity / 127) * 1500;
    }
    voice.filter.frequency.setValueAtTime(filterCutoff, now);

    if (config.waveform === 'fm' && config.fmParams) {
      // FM synthesis for FM Bass
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
      carrier.connect(voice.filter);

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
      osc.connect(voice.filter);

      voice.oscillator = osc;
      osc.start(now);
    }

    // ADSR envelope
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
