/**
 * drums.ts
 * 
 * Drum synthesizer using Tone.js for high-quality drum sounds
 * - Kick: MembraneSynth with pitch sweep
 * - Snare: NoiseSynth + MembraneSynth layered
 * - Hihats: NoiseSynth with highpass filter
 * 
 * Ported from iOS AudioKit SimpleDrums implementation
 */

import * as Tone from 'tone';

export enum DrumType {
  Kick = 0,
  Kick2 = 1,
  LowTom = 2,
  Snare = 3,
  Snare2 = 4,
  Rimshot = 5,
  Clap = 6,
  ClosedHat = 7,
  OpenHat = 8,
  Crash = 9,
  Ride = 10,
  Cowbell = 11,
}

export class DrumSynth {
  // Kick drum - deep membrane synth
  private kick: Tone.MembraneSynth;
  
  // Snare components - noise + tone layered
  private snareNoise: Tone.NoiseSynth;
  private snareTone: Tone.MembraneSynth;
  
  // Hihat - filtered noise
  private closedHat: Tone.NoiseSynth;
  private openHat: Tone.NoiseSynth;
  
  // Clap - layered noise bursts
  private clap: Tone.NoiseSynth;
  
  // Cowbell - metallic FM
  private cowbell: Tone.MetalSynth;
  
  // Cymbal for crash/ride
  private cymbal: Tone.NoiseSynth;

  private masterGain: Tone.Gain;
  private volume = 1.0;

  constructor() {
    // Master gain for overall volume
    this.masterGain = new Tone.Gain(this.volume);

    // === KICK: Deep, punchy membrane synth ===
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0,
        release: 0.4,
      },
    });
    this.kick.volume.value = -4;
    this.kick.connect(this.masterGain);

    // === SNARE NOISE: Crispy top end ===
    const snareFilter = new Tone.Filter({
      frequency: 4500,
      type: 'bandpass',
      Q: 1,
    });
    snareFilter.connect(this.masterGain);

    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.12,
        sustain: 0,
        release: 0.05,
      },
    });
    this.snareNoise.volume.value = -8;
    this.snareNoise.connect(snareFilter);

    // === SNARE TONE: Body/punch ===
    this.snareTone = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
    });
    this.snareTone.volume.value = -10;
    this.snareTone.connect(this.masterGain);

    // === CLOSED HIHAT: Tight filtered noise ===
    const closedHatFilter = new Tone.Filter({
      frequency: 7000,
      type: 'highpass',
      Q: 1,
    });
    closedHatFilter.connect(this.masterGain);

    this.closedHat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.06,
        sustain: 0,
        release: 0.02,
      },
    });
    this.closedHat.volume.value = -10;
    this.closedHat.connect(closedHatFilter);

    // === OPEN HIHAT: Longer decay ===
    const openHatFilter = new Tone.Filter({
      frequency: 6000,
      type: 'highpass',
      Q: 0.5,
    });
    openHatFilter.connect(this.masterGain);

    this.openHat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.05,
        release: 0.15,
      },
    });
    this.openHat.volume.value = -12;
    this.openHat.connect(openHatFilter);

    // === CLAP: Burst of filtered noise ===
    const clapFilter = new Tone.Filter({
      frequency: 1500,
      type: 'bandpass',
      Q: 0.5,
    });
    clapFilter.connect(this.masterGain);

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
      },
    });
    this.clap.volume.value = -8;
    this.clap.connect(clapFilter);

    // === COWBELL: Metallic FM synth ===
    this.cowbell = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.05,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1,
    });
    this.cowbell.volume.value = -16;
    this.cowbell.connect(this.masterGain);

    // === CYMBAL: Long noise for crash/ride ===
    const cymbalFilter = new Tone.Filter({
      frequency: 5000,
      type: 'highpass',
      Q: 0.3,
    });
    cymbalFilter.connect(this.masterGain);

    this.cymbal = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0.1,
        release: 0.5,
      },
    });
    this.cymbal.volume.value = -14;
    this.cymbal.connect(cymbalFilter);
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = volume;
  }

  trigger(drumType: DrumType, velocity: number): void {
    // Defensive checks
    if (!this.masterGain) {
      console.warn('DrumSynth.trigger: Not initialized');
      return;
    }

    try {
      const now = Tone.now();
      const velNorm = velocity / 127;

      switch (drumType) {
        case DrumType.Kick:
        case DrumType.Kick2:
          this.triggerKick(now, velNorm, drumType === DrumType.Kick2);
          break;

        case DrumType.LowTom:
          this.triggerTom(now, velNorm);
          break;

        case DrumType.Snare:
        case DrumType.Snare2:
          this.triggerSnare(now, velNorm);
          break;

        case DrumType.Rimshot:
          this.triggerRimshot(now, velNorm);
          break;

        case DrumType.Clap:
          this.triggerClap(now, velNorm);
          break;

        case DrumType.ClosedHat:
          this.triggerClosedHat(now, velNorm);
          break;

        case DrumType.OpenHat:
          this.triggerOpenHat(now, velNorm);
          break;

        case DrumType.Crash:
          this.triggerCrash(now, velNorm);
          break;

        case DrumType.Ride:
          this.triggerRide(now, velNorm);
          break;

        case DrumType.Cowbell:
          this.triggerCowbell(now, velNorm);
          break;
      }
    } catch (e) {
      console.warn('DrumSynth.trigger: Audio trigger failed:', e);
    }
  }

  private triggerKick(time: number, velocity: number, alt: boolean = false): void {
    try {
      // Alt kick is slightly higher pitched
      const note = alt ? 'C2' : 'C1';
      this.kick.triggerAttackRelease(note, '8n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerKick failed:', e);
    }
  }

  private triggerTom(time: number, velocity: number): void {
    try {
      // Reuse kick with higher pitch for tom
      this.kick.triggerAttackRelease('G2', '8n', time, velocity * 0.8);
    } catch (e) {
      console.warn('DrumSynth.triggerTom failed:', e);
    }
  }

  private triggerSnare(time: number, velocity: number): void {
    try {
      // Layer noise + tone for full snare
      this.snareNoise.triggerAttackRelease('16n', time, velocity);
      this.snareTone.triggerAttackRelease('E3', '16n', time, velocity * 0.7);
    } catch (e) {
      console.warn('DrumSynth.triggerSnare failed:', e);
    }
  }

  private triggerRimshot(time: number, velocity: number): void {
    try {
      // High pitched short tone
      this.snareTone.triggerAttackRelease('A4', '32n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerRimshot failed:', e);
    }
  }

  private triggerClap(time: number, velocity: number): void {
    try {
      // Multiple short bursts for clap character
      this.clap.triggerAttackRelease('16n', time, velocity * 0.8);
      this.clap.triggerAttackRelease('32n', time + 0.01, velocity * 0.6);
      this.clap.triggerAttackRelease('32n', time + 0.02, velocity * 0.9);
    } catch (e) {
      console.warn('DrumSynth.triggerClap failed:', e);
    }
  }

  private triggerClosedHat(time: number, velocity: number): void {
    try {
      this.closedHat.triggerAttackRelease('32n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerClosedHat failed:', e);
    }
  }

  private triggerOpenHat(time: number, velocity: number): void {
    try {
      this.openHat.triggerAttackRelease('8n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerOpenHat failed:', e);
    }
  }

  private triggerCrash(time: number, velocity: number): void {
    try {
      this.cymbal.triggerAttackRelease('2n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerCrash failed:', e);
    }
  }

  private triggerRide(time: number, velocity: number): void {
    try {
      // Shorter cymbal for ride
      this.cymbal.triggerAttackRelease('8n', time, velocity * 0.7);
    } catch (e) {
      console.warn('DrumSynth.triggerRide failed:', e);
    }
  }

  private triggerCowbell(time: number, velocity: number): void {
    try {
      this.cowbell.triggerAttackRelease('16n', time, velocity);
    } catch (e) {
      console.warn('DrumSynth.triggerCowbell failed:', e);
    }
  }

  dispose(): void {
    this.kick.dispose();
    this.snareNoise.dispose();
    this.snareTone.dispose();
    this.closedHat.dispose();
    this.openHat.dispose();
    this.clap.dispose();
    this.cowbell.dispose();
    this.cymbal.dispose();
    this.masterGain.dispose();
  }
}
