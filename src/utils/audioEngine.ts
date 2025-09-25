import * as Tone from 'tone';

// Audio engine for handling drum playback
export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private drumSamples: { [key: string]: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth } = {};
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
    if (this.isInitialized) return;

    try {
      // Start the audio context (required for Web Audio)
      await Tone.start();
      
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

      this.isInitialized = true;
      console.log('Audio engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  public playDrum(instrumentName: string, velocity: number = 0.8, time?: number): void {
    if (!this.isInitialized) {
      console.warn('Audio engine not initialized');
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

  public async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Dispose of all samples
      Object.values(this.drumSamples).forEach(sample => {
        sample.dispose();
      });
      
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