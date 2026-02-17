/**
 * audioEngine.ts
 * 
 * Main audio engine managing all synthesizers using Tone.js
 * 
 * Provides API for:
 * - Note triggering and release for melody/bass tracks
 * - Drum triggering
 * - Preset management
 * - Track volume control
 */

import * as Tone from 'tone';
import { MelodySynth, MelodyPreset } from './synths/melodySynth';
import { BassSynth, BassPreset } from './synths/bassSynth';
import { DrumSynth, DrumType } from './synths/drums';

class AudioEngine {
  private melodySynth: MelodySynth | null = null;
  private bassSynth: BassSynth | null = null;
  private drumSynth: DrumSynth | null = null;
  private masterGain: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private isInitialized = false;

  /**
   * Initialize the audio engine
   * Must be called from a user gesture (click/touch) due to Web Audio autoplay policy
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AudioEngine: Already initialized');
      return;
    }

    try {
      // Start Tone.js audio context (required on user gesture)
      await Tone.start();
      console.log('AudioEngine: Tone.js started, context state:', Tone.context.state);

      // Create master limiter to prevent clipping
      this.limiter = new Tone.Limiter(-1).toDestination();

      // Create master gain
      this.masterGain = new Tone.Gain(0.8);
      this.masterGain.connect(this.limiter);

      // Initialize synths
      this.melodySynth = new MelodySynth();
      this.bassSynth = new BassSynth();
      this.drumSynth = new DrumSynth();

      // Connect synths to master
      this.melodySynth.connect(this.masterGain.input as unknown as AudioNode);
      this.bassSynth.connect(this.masterGain.input as unknown as AudioNode);
      this.drumSynth.connect(this.masterGain.input as unknown as AudioNode);

      this.isInitialized = true;
      console.log('AudioEngine: Initialized successfully with Tone.js');
    } catch (error) {
      console.error('AudioEngine: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Trigger a note on a specific track
   * @param pitch - MIDI note number (0-127)
   * @param velocity - Note velocity (0-127)
   * @param track - Track number (0=melody, 1=chords, 2=bass)
   */
  triggerNote(pitch: number, velocity: number, track: number): void {
    if (!this.isInitialized) {
      console.warn('AudioEngine: Not initialized');
      return;
    }

    // Resume context if needed (handles browser autoplay restrictions)
    if (Tone.context.state === 'suspended') {
      Tone.start();
    }

    switch (track) {
      case 0: // Melody
        this.melodySynth?.play(pitch, velocity);
        break;
      case 1: // Chords (currently using melody synth)
        this.melodySynth?.play(pitch, velocity);
        break;
      case 2: // Bass
        this.bassSynth?.play(pitch, velocity);
        break;
      default:
        console.warn(`AudioEngine: Invalid track ${track}`);
    }
  }

  /**
   * Release a note on a specific track
   * @param pitch - MIDI note number (0-127)
   * @param track - Track number (0=melody, 1=chords, 2=bass)
   */
  releaseNote(pitch: number, track: number): void {
    if (!this.isInitialized) {
      return;
    }

    switch (track) {
      case 0: // Melody
        this.melodySynth?.stop(pitch);
        break;
      case 1: // Chords
        this.melodySynth?.stop(pitch);
        break;
      case 2: // Bass
        this.bassSynth?.stop(pitch);
        break;
    }
  }

  /**
   * Trigger a drum sound
   * @param drumType - Drum type (0-11, see DrumType enum)
   * @param velocity - Velocity (0-127)
   */
  triggerDrum(drumType: number, velocity: number): void {
    if (!this.isInitialized) {
      console.warn('AudioEngine: Not initialized');
      return;
    }

    // Resume context if needed
    if (Tone.context.state === 'suspended') {
      Tone.start();
    }

    this.drumSynth?.trigger(drumType as DrumType, velocity);
  }

  /**
   * Set the melody track preset
   * @param preset - Preset index (0-5)
   */
  setMelodyPreset(preset: number): void {
    if (!this.isInitialized) {
      return;
    }

    const presetEnum = preset as MelodyPreset;
    if (presetEnum >= MelodyPreset.GlissLead && presetEnum <= MelodyPreset.SyncLead) {
      this.melodySynth?.setPreset(presetEnum);
    } else {
      console.warn(`AudioEngine: Invalid melody preset ${preset}`);
    }
  }

  /**
   * Set the bass track preset
   * @param preset - Preset index (0-3)
   */
  setBassPreset(preset: number): void {
    if (!this.isInitialized) {
      return;
    }

    const presetEnum = preset as BassPreset;
    if (presetEnum >= BassPreset.AcidBass && presetEnum <= BassPreset.SubBass) {
      this.bassSynth?.setPreset(presetEnum);
    } else {
      console.warn(`AudioEngine: Invalid bass preset ${preset}`);
    }
  }

  /**
   * Set track volume
   * @param track - Track number (0=melody, 1=chords, 2=bass, 3=drums)
   * @param volume - Volume multiplier (0.0-1.5)
   */
  setTrackVolume(track: number, volume: number): void {
    if (!this.isInitialized) {
      return;
    }

    switch (track) {
      case 0: // Melody
        this.melodySynth?.setVolume(volume);
        break;
      case 1: // Chords
        // Using same synth as melody for now
        break;
      case 2: // Bass
        this.bassSynth?.setVolume(volume);
        break;
      case 3: // Drums
        this.drumSynth?.setVolume(volume);
        break;
      default:
        console.warn(`AudioEngine: Invalid track ${track}`);
    }
  }

  /**
   * Stop all notes on a specific track
   * @param track - Track number (0=melody, 1=chords, 2=bass)
   */
  stopAllNotes(track: number): void {
    if (!this.isInitialized) {
      return;
    }

    switch (track) {
      case 0: // Melody
        this.melodySynth?.stopAll();
        break;
      case 1: // Chords
        this.melodySynth?.stopAll();
        break;
      case 2: // Bass
        this.bassSynth?.stopAll();
        break;
    }
  }

  /**
   * Get the current AudioContext state
   */
  getState(): AudioContextState | 'uninitialized' {
    if (!this.isInitialized) {
      return 'uninitialized';
    }
    return Tone.context.state as AudioContextState;
  }

  /**
   * Resume the AudioContext (useful for handling autoplay restrictions)
   */
  async resume(): Promise<void> {
    if (Tone.context.state === 'suspended') {
      await Tone.start();
      console.log('AudioEngine: Resumed Tone.js context');
    }
  }

  /**
   * Dispose of all synths and clean up resources
   */
  dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    this.melodySynth?.dispose();
    this.bassSynth?.dispose();
    this.drumSynth?.dispose();
    this.masterGain?.dispose();
    this.limiter?.dispose();

    this.melodySynth = null;
    this.bassSynth = null;
    this.drumSynth = null;
    this.masterGain = null;
    this.limiter = null;
    this.isInitialized = false;

    console.log('AudioEngine: Disposed');
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();

// Export enums for external use
export { MelodyPreset, BassPreset, DrumType };
