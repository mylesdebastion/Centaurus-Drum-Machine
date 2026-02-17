/**
 * drums.ts
 * 
 * Drum synthesizer ported from iOS AudioKit SimpleDrums implementation
 * Kick: Sine pitch sweep 150Hz→55Hz + triangle click
 * Snare: Triangle 200Hz + bandpass noise 4500Hz
 * Hihat: Highpass noise 7000Hz
 * 
 * Port of pixelboop/Services/AudioKitService.swift (SimpleDrums class)
 */

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
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private volume = 1.0;

  // Shared noise buffer for snare and hihats
  private noiseBuffer: AudioBuffer;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.volume;

    // Create white noise buffer
    this.noiseBuffer = this.createNoiseBuffer();
  }

  connect(destination: AudioNode): void {
    this.masterGain.connect(destination);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1.5, volume));
    this.masterGain.gain.value = this.volume;
  }

  trigger(drumType: DrumType, velocity: number): void {
    const now = this.audioContext.currentTime;

    // Map drum types to synthesis methods
    if (drumType <= DrumType.LowTom) {
      this.triggerKick(now, velocity);
    } else if (drumType >= DrumType.Snare && drumType <= DrumType.Clap) {
      this.triggerSnare(now, velocity);
    } else {
      // Hihats, crash, ride, cowbell
      const isOpen = drumType === DrumType.OpenHat;
      this.triggerHihat(now, velocity, isOpen);
    }
  }

  private triggerKick(time: number, velocity: number): void {
    const velAmp = velocity / 127;

    // === KICK BODY: Sine oscillator with pitch sweep ===
    const kickOsc = this.audioContext.createOscillator();
    const kickGain = this.audioContext.createGain();

    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, time); // Start high
    kickOsc.frequency.exponentialRampToValueAtTime(80, time + 0.01);
    kickOsc.frequency.exponentialRampToValueAtTime(55, time + 0.03); // End low

    kickOsc.connect(kickGain);
    kickGain.connect(this.masterGain);

    // Kick envelope: attack=0.001, decay=0.25
    kickGain.gain.setValueAtTime(0, time);
    kickGain.gain.linearRampToValueAtTime(0.7 * velAmp, time + 0.001);
    kickGain.gain.setTargetAtTime(0, time + 0.001, 0.25 / 3);

    kickOsc.start(time);
    kickOsc.stop(time + 0.3);

    // === KICK CLICK: Triangle oscillator for transient ===
    const clickOsc = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();

    clickOsc.type = 'triangle';
    clickOsc.frequency.value = 160;

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);

    // Click envelope: attack=0.001, decay=0.03
    clickGain.gain.setValueAtTime(0, time);
    clickGain.gain.linearRampToValueAtTime(0.35 * velAmp, time + 0.001);
    clickGain.gain.setTargetAtTime(0, time + 0.001, 0.03 / 3);

    clickOsc.start(time);
    clickOsc.stop(time + 0.05);
  }

  private triggerSnare(time: number, velocity: number): void {
    const velAmp = velocity / 127;

    // === SNARE BODY: Triangle oscillator at 200Hz ===
    const snareOsc = this.audioContext.createOscillator();
    const snareGain = this.audioContext.createGain();

    snareOsc.type = 'triangle';
    snareOsc.frequency.value = 200;

    snareOsc.connect(snareGain);
    snareGain.connect(this.masterGain);

    // Snare tone envelope: attack=0.001, decay=0.1
    snareGain.gain.setValueAtTime(0, time);
    snareGain.gain.linearRampToValueAtTime(0.55 * velAmp, time + 0.001);
    snareGain.gain.setTargetAtTime(0, time + 0.001, 0.1 / 3);

    snareOsc.start(time);
    snareOsc.stop(time + 0.15);

    // === SNARE WIRES: Bandpass filtered noise at 4500Hz ===
    const noiseSource = this.audioContext.createBufferSource();
    const noiseFilter = this.audioContext.createBiquadFilter();
    const noiseGain = this.audioContext.createGain();

    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 4500;
    noiseFilter.Q.value = 1;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Noise envelope: attack=0.001, decay=0.07
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.2 * velAmp, time + 0.001);
    noiseGain.gain.setTargetAtTime(0, time + 0.001, 0.07 / 3);

    noiseSource.start(time);
    noiseSource.stop(time + 0.12);
  }

  private triggerHihat(time: number, velocity: number, isOpen: boolean): void {
    const velAmp = velocity / 127;
    const duration = isOpen ? 0.2 : 0.06;

    // === HIHAT: Highpass filtered noise at 7000Hz ===
    const noiseSource = this.audioContext.createBufferSource();
    const noiseFilter = this.audioContext.createBiquadFilter();
    const noiseGain = this.audioContext.createGain();

    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 7000;
    noiseFilter.Q.value = 1;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Hihat envelope: attack=0.001, decay=0.06 (closed) or 0.2 (open)
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.4 * velAmp, time + 0.001);
    noiseGain.gain.setTargetAtTime(0, time + 0.001, duration / 3);

    noiseSource.start(time);
    noiseSource.stop(time + duration + 0.05);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}
