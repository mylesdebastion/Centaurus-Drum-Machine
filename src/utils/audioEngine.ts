import * as Tone from 'tone';

/**
 * Transport state for persistence across navigation
 */
export interface TransportState {
  state: 'started' | 'stopped' | 'paused';
  position: string; // "bars:beats:sixteenths"
  bpm: number;
  timestamp: number; // performance.now() for debugging
}

// Audio engine for handling drum and melodic instrument playback
export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private isInitializing = false;
  private drumSamples: { [key: string]: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth } = {};
  private pianoSynth: Tone.PolySynth | null = null;
  private guitarSynth: Tone.PolySynth | null = null;
  private masterVolume: Tone.Volume;
  private hasWarnedNotInitialized = false; // Prevent console spam

  private constructor() {
    this.masterVolume = new Tone.Volume(-6).toDestination();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize(): Promise<void> {
    console.log('[AudioEngine] initialize() called, isInitialized:', this.isInitialized, 'isInitializing:', this.isInitializing);

    if (this.isInitialized) {
      console.log('[AudioEngine] Already initialized, returning early');
      return;
    }

    if (this.isInitializing) {
      console.log('[AudioEngine] Already initializing, waiting...');
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    this.isInitializing = true;

    try {
      console.log('[AudioEngine] Starting Tone.js audio context...');
      // Start the audio context (required for Web Audio)
      await Tone.start();
      console.log('[AudioEngine] Tone.js started successfully');

      console.log('[AudioEngine] Creating drum samples...');
      // Create drum samples using Tone.js built-in sounds
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
        
        'tom': new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 2,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.006, decay: 0.5, sustain: 0.0 }
        }).connect(this.masterVolume)
      };

      console.log('[AudioEngine] Creating melodic instruments...');
      // Create Piano PolySynth (bright, clear tone)
      this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: 0.4,
          release: 1.2
        }
      }).connect(this.masterVolume);
      this.pianoSynth.volume.value = -8; // Slightly quieter than drums

      // Create Guitar PolySynth (warmer, softer tone)
      this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth'
        },
        envelope: {
          attack: 0.008,
          decay: 0.5,
          sustain: 0.5,
          release: 2.0
        }
      }).connect(this.masterVolume);
      this.guitarSynth.volume.value = -10; // Quieter, more mellow

      this.isInitialized = true;
      this.isInitializing = false;
      this.hasWarnedNotInitialized = false; // Reset warning flag on successful init
      console.log('[AudioEngine] ✅ Audio engine initialized successfully, isInitialized:', this.isInitialized);
      console.log('[AudioEngine] Drum samples created:', Object.keys(this.drumSamples));
      console.log('[AudioEngine] Piano and Guitar synths created');
    } catch (error) {
      console.error('[AudioEngine] ❌ Failed to initialize audio engine:', error);
      this.isInitialized = false;
      this.isInitializing = false;
    }
  }

  public playDrum(instrumentName: string, velocity: number = 0.8, time?: number): void {
    if (!this.isInitialized) {
      // Only warn once to prevent console spam (100+ messages during playback)
      if (!this.hasWarnedNotInitialized) {
        console.warn('[AudioEngine] Audio engine not yet initialized. Call audioEngine.initialize() first.');
        this.hasWarnedNotInitialized = true;
      }
      return;
    }

    const normalizedName = this.normalizeInstrumentName(instrumentName);
    const sample = this.drumSamples[normalizedName];
    
    if (!sample) {
      console.warn(`No sample found for instrument: ${instrumentName} (normalized: ${normalizedName})`);
      return;
    }

    try {
      const playTime = time || Tone.now();
      const volume = this.velocityToDb(velocity);

      if (sample instanceof Tone.MembraneSynth) {
        // For kick and tom drums
        const note = normalizedName === 'kick' ? 'C1' : 'C3';
        sample.volume.value = volume;
        sample.triggerAttackRelease(note, '8n', playTime);
      } else if (sample instanceof Tone.NoiseSynth) {
        // For snare and clap
        sample.volume.value = volume;
        sample.triggerAttackRelease('8n', playTime);
      } else if (sample instanceof Tone.MetalSynth) {
        // For hi-hats, crash, ride
        sample.volume.value = volume;
        sample.triggerAttackRelease('8n', playTime);
      }
    } catch (error) {
      console.error(`Error playing drum ${instrumentName}:`, error);
    }
  }

  private normalizeInstrumentName(name: string): string {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    
    // Map various drum names to our sample keys
    const mapping: { [key: string]: string } = {
      'kick': 'kick',
      'bassdrum': 'kick',
      'bd': 'kick',
      'snare': 'snare',
      'sn': 'snare',
      'snaredrum': 'snare',
      'hihat': 'hihat',
      'hh': 'hihat',
      'closedhihat': 'hihat',
      'openhat': 'openhat',
      'openhihat': 'openhat',
      'oh': 'openhat',
      'clap': 'clap',
      'handclap': 'clap',
      'crash': 'crash',
      'crashcymbal': 'crash',
      'ride': 'ride',
      'ridecymbal': 'ride',
      'tom': 'tom',
      'hitom': 'tom',
      'midtom': 'tom',
      'lotom': 'tom',
      'perc': 'clap',
      'percussion': 'clap'
    };

    return mapping[normalized] || 'kick';
  }

  private velocityToDb(velocity: number): number {
    // Convert velocity (0-1) to decibels (-40 to 0)
    return Math.max(-40, Math.log10(Math.max(0.01, velocity)) * 20);
  }

  public setMasterVolume(volume: number): void {
    if (this.masterVolume) {
      this.masterVolume.volume.value = this.velocityToDb(volume);
    }
  }

  /**
   * Play a MIDI note on piano synth
   * @param note - MIDI note number (0-127)
   * @param velocity - Note velocity (0-1)
   * @param duration - Note duration (default: '8n')
   */
  public playPianoNote(note: number, velocity: number = 0.8, duration: string = '8n'): void {
    if (!this.isInitialized || !this.pianoSynth) {
      if (!this.hasWarnedNotInitialized) {
        console.warn('[AudioEngine] Piano synth not yet initialized. Call audioEngine.initialize() first.');
        this.hasWarnedNotInitialized = true;
      }
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      const volume = this.velocityToDb(velocity);

      this.pianoSynth.volume.value = volume - 8; // Apply velocity + base volume
      this.pianoSynth.triggerAttackRelease(noteName, duration);

      console.log(`[AudioEngine] Piano note: ${noteName} (MIDI ${note}), velocity: ${velocity}`);
    } catch (error) {
      console.error(`Error playing piano note ${note}:`, error);
    }
  }

  /**
   * Trigger piano note on (for sustained notes)
   */
  public triggerPianoNoteOn(note: number, velocity: number = 0.8): void {
    if (!this.isInitialized || !this.pianoSynth) {
      if (!this.hasWarnedNotInitialized) {
        console.warn('[AudioEngine] Piano synth not yet initialized. Call audioEngine.initialize() first.');
        this.hasWarnedNotInitialized = true;
      }
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      const volume = this.velocityToDb(velocity);

      this.pianoSynth.volume.value = volume - 8;
      this.pianoSynth.triggerAttack(noteName);
    } catch (error) {
      console.error(`Error triggering piano note on ${note}:`, error);
    }
  }

  /**
   * Trigger piano note off (for sustained notes)
   */
  public triggerPianoNoteOff(note: number): void {
    if (!this.isInitialized || !this.pianoSynth) {
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      this.pianoSynth.triggerRelease(noteName);
    } catch (error) {
      console.error(`Error triggering piano note off ${note}:`, error);
    }
  }

  /**
   * Play a MIDI note on guitar synth
   */
  public playGuitarNote(note: number, velocity: number = 0.8, duration: string = '4n'): void {
    if (!this.isInitialized || !this.guitarSynth) {
      if (!this.hasWarnedNotInitialized) {
        console.warn('[AudioEngine] Guitar synth not yet initialized. Call audioEngine.initialize() first.');
        this.hasWarnedNotInitialized = true;
      }
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      const volume = this.velocityToDb(velocity);

      this.guitarSynth.volume.value = volume - 10;
      this.guitarSynth.triggerAttackRelease(noteName, duration);

      console.log(`[AudioEngine] Guitar note: ${noteName} (MIDI ${note}), velocity: ${velocity}`);
    } catch (error) {
      console.error(`Error playing guitar note ${note}:`, error);
    }
  }

  /**
   * Trigger guitar note on (for sustained notes)
   */
  public triggerGuitarNoteOn(note: number, velocity: number = 0.8): void {
    if (!this.isInitialized || !this.guitarSynth) {
      if (!this.hasWarnedNotInitialized) {
        console.warn('[AudioEngine] Guitar synth not yet initialized. Call audioEngine.initialize() first.');
        this.hasWarnedNotInitialized = true;
      }
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      const volume = this.velocityToDb(velocity);

      this.guitarSynth.volume.value = volume - 10;
      this.guitarSynth.triggerAttack(noteName);
    } catch (error) {
      console.error(`Error triggering guitar note on ${note}:`, error);
    }
  }

  /**
   * Trigger guitar note off (for sustained notes)
   */
  public triggerGuitarNoteOff(note: number): void {
    if (!this.isInitialized || !this.guitarSynth) {
      return;
    }

    try {
      const noteName = Tone.Frequency(note, 'midi').toNote();
      this.guitarSynth.triggerRelease(noteName);
    } catch (error) {
      console.error(`Error triggering guitar note off ${note}:`, error);
    }
  }

  /**
   * Get current Tone.js Transport state for persistence
   * Captures playback state, position, and tempo
   */
  public getTransportState(): TransportState {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, returning default transport state');
      return {
        state: 'stopped',
        position: '0:0:0',
        bpm: 120,
        timestamp: performance.now(),
      };
    }

    try {
      const state: TransportState = {
        state: Tone.Transport.state as 'started' | 'stopped' | 'paused',
        position: Tone.Transport.position as string,
        bpm: Tone.Transport.bpm.value,
        timestamp: performance.now(),
      };

      console.log('[AudioEngine] Transport state captured:', state);
      return state;
    } catch (error) {
      console.error('[AudioEngine] Error capturing transport state:', error);
      return {
        state: 'stopped',
        position: '0:0:0',
        bpm: 120,
        timestamp: performance.now(),
      };
    }
  }

  /**
   * Restore Tone.js Transport state after navigation
   * Preserves playback position, tempo, and play/pause state
   */
  public restoreTransportState(state: TransportState): void {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, cannot restore transport state');
      return;
    }

    try {
      console.log('[AudioEngine] Restoring transport state:', state);

      // Set BPM first
      Tone.Transport.bpm.value = state.bpm;

      // Set position
      Tone.Transport.position = state.position;

      // Resume playback if it was playing
      if (state.state === 'started' && Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      } else if (state.state === 'stopped' && Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
      } else if (state.state === 'paused' && Tone.Transport.state !== 'paused') {
        Tone.Transport.pause();
      }

      console.log('[AudioEngine] Transport state restored successfully');
    } catch (error) {
      console.error('[AudioEngine] Failed to restore transport state:', error);
    }
  }

  /**
   * Get current audio context state
   * Useful for detecting suspended contexts (browser autoplay policy)
   */
  public getAudioContextState(): AudioContextState {
    try {
      return Tone.context.state;
    } catch (error) {
      console.error('[AudioEngine] Error getting audio context state:', error);
      return 'suspended';
    }
  }

  /**
   * Ensure audio context is running
   * Resumes suspended contexts (required for browser autoplay policies)
   */
  public async ensureAudioContext(): Promise<void> {
    try {
      if (Tone.context.state === 'suspended') {
        console.log('[AudioEngine] Audio context suspended, resuming...');
        await Tone.context.resume();
        console.log('[AudioEngine] Audio context resumed successfully');
      }
    } catch (error) {
      console.error('[AudioEngine] Failed to resume audio context:', error);
    }
  }

  /**
   * Sync Tone.js Transport BPM with global tempo
   * Should be called when global tempo changes
   */
  public syncTransportBPM(bpm: number): void {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, cannot sync transport BPM');
      return;
    }

    try {
      Tone.Transport.bpm.value = bpm;
      console.log(`[AudioEngine] Transport BPM synced to ${bpm}`);
    } catch (error) {
      console.error('[AudioEngine] Error syncing transport BPM:', error);
    }
  }

  /**
   * Start global transport (play)
   * Epic 14, Story 14.2 - Transport control integration
   * Idempotent - safe to call multiple times
   */
  public startTransport(): void {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, cannot start transport');
      return;
    }

    try {
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        console.log('[AudioEngine] Transport started');
      } else {
        console.log('[AudioEngine] Transport already started');
      }
    } catch (error) {
      console.error('[AudioEngine] Error starting transport:', error);
    }
  }

  /**
   * Stop global transport (pause)
   * Epic 14, Story 14.2 - Transport control integration
   * Uses pause() instead of stop() to maintain Transport position
   * Idempotent - safe to call multiple times
   */
  public stopTransport(): void {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, cannot stop transport');
      return;
    }

    try {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        console.log('[AudioEngine] Transport paused');
      } else {
        console.log('[AudioEngine] Transport already stopped');
      }
    } catch (error) {
      console.error('[AudioEngine] Error stopping transport:', error);
    }
  }

  /**
   * Get current transport playing state
   * Epic 14, Story 14.2 - Transport control integration
   * @returns true if transport is playing, false otherwise
   */
  public isTransportPlaying(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return Tone.Transport.state === 'started';
    } catch (error) {
      console.error('[AudioEngine] Error checking transport state:', error);
      return false;
    }
  }

  public async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Dispose of all drum samples
      Object.values(this.drumSamples).forEach(sample => {
        sample.dispose();
      });

      // Dispose of melodic synths
      if (this.pianoSynth) {
        this.pianoSynth.dispose();
        this.pianoSynth = null;
      }

      if (this.guitarSynth) {
        this.guitarSynth.dispose();
        this.guitarSynth = null;
      }

      this.drumSamples = {};
      this.isInitialized = false;

      console.log('Audio engine disposed');
    } catch (error) {
      console.error('Error disposing audio engine:', error);
    }
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();