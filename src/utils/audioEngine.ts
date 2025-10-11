import * as Tone from 'tone';

// Audio engine for handling drum and melodic instrument playback
export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private isInitializing = false;
  private drumSamples: { [key: string]: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth } = {};
  private pianoSynth: Tone.PolySynth | null = null;
  private guitarSynth: Tone.PolySynth | null = null;
  private masterVolume: Tone.Volume;

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
      console.error('[AudioEngine] ❌ Audio engine not initialized - cannot play', instrumentName);
      console.error('[AudioEngine] Current state:', {
        isInitialized: this.isInitialized,
        isInitializing: this.isInitializing,
        hasDrumSamples: Object.keys(this.drumSamples).length > 0,
        drumSampleKeys: Object.keys(this.drumSamples)
      });
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
      console.error('[AudioEngine] Piano synth not initialized');
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
      console.error('[AudioEngine] Piano synth not initialized');
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
      console.error('[AudioEngine] Guitar synth not initialized');
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
      console.error('[AudioEngine] Guitar synth not initialized');
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