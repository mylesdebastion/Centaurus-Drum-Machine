/**
 * AudioInputManager - Web Audio API integration for live audio input
 *
 * Responsibilities:
 * - Request microphone/line-in access
 * - Initialize AnalyserNode for FFT frequency analysis
 * - Provide frequency and time-domain data for visualizations
 * - Support stereo channel separation
 *
 * Based on Web Audio API best practices and existing audioEngine patterns
 */

export interface AudioInputConfig {
  fftSize: 2048 | 4096 | 8192;
  smoothingTimeConstant: number; // 0.0 - 1.0
  minDecibels: number;
  maxDecibels: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioInputConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
};

export class AudioInputManager {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private leftAnalyser: AnalyserNode | null = null;
  private rightAnalyser: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;

  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private leftFrequencyData: Uint8Array | null = null;
  private rightFrequencyData: Uint8Array | null = null;
  private leftTimeData: Uint8Array | null = null;
  private rightTimeData: Uint8Array | null = null;

  private isRunning = false;
  private config: AudioInputConfig;
  private currentDeviceId: string | null = null;

  constructor(config: AudioInputConfig = DEFAULT_AUDIO_CONFIG) {
    this.config = config;
  }

  /**
   * Enumerate available audio input devices
   */
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  /**
   * Request microphone access and initialize audio pipeline
   */
  async initialize(deviceId?: string): Promise<void> {
    try {
      // Detect iOS devices (iPad, iPhone, iPod)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Request microphone access with flexible configuration
      // Note: iOS Safari has much lower raw mic levels than desktop browsers
      // when AGC is disabled. Enable AGC on iOS for consistent audio levels.
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? {
              deviceId: { ideal: deviceId }, // Use ideal instead of exact
              channelCount: { ideal: 2 }, // Prefer stereo but allow mono
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: isIOS, // Enable AGC on iOS, disable on desktop
            }
          : {
              channelCount: { ideal: 2 },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: isIOS, // Enable AGC on iOS, disable on desktop
            },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentDeviceId = deviceId || null;

      // Create AudioContext (same pattern as audioEngine.ts)
      this.audioContext = new AudioContext();

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Detect number of channels
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      const channelCount = settings.channelCount || 1;
      console.log(`🎤 Audio input: ${channelCount} channel(s), AGC: ${isIOS ? 'enabled (iOS)' : 'disabled'}`);

      // Create gain node for volume control (default gain = 1.0)
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Create mono analyser for combined visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.config.fftSize;
      this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant;
      this.analyserNode.minDecibels = this.config.minDecibels;
      this.analyserNode.maxDecibels = this.config.maxDecibels;

      // Connect audio graph:
      // Source -> Gain -> Mono Analyser (for combined visualization)
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);

      // Create stereo channel splitter for L/R separation (if stereo available)
      if (channelCount >= 2) {
        this.splitter = this.audioContext.createChannelSplitter(2);

        // Create separate analysers for left and right channels
        this.leftAnalyser = this.audioContext.createAnalyser();
        this.leftAnalyser.fftSize = this.config.fftSize;
        this.leftAnalyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

        this.rightAnalyser = this.audioContext.createAnalyser();
        this.rightAnalyser.fftSize = this.config.fftSize;
        this.rightAnalyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

        // Gain -> Splitter -> L/R Analysers (for stereo visualization)
        this.gainNode.connect(this.splitter);
        this.splitter.connect(this.leftAnalyser, 0);
        this.splitter.connect(this.rightAnalyser, 1);
      } else {
        // Mono source: just duplicate the mono signal for left/right
        this.leftAnalyser = this.audioContext.createAnalyser();
        this.leftAnalyser.fftSize = this.config.fftSize;
        this.leftAnalyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

        this.rightAnalyser = this.audioContext.createAnalyser();
        this.rightAnalyser.fftSize = this.config.fftSize;
        this.rightAnalyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

        // Connect mono signal to both analysers
        this.gainNode.connect(this.leftAnalyser);
        this.gainNode.connect(this.rightAnalyser);
      }

      // Initialize data arrays
      const bufferLength = this.analyserNode.frequencyBinCount;
      this.frequencyData = new Uint8Array(bufferLength);
      this.timeData = new Uint8Array(bufferLength);
      this.leftFrequencyData = new Uint8Array(bufferLength);
      this.rightFrequencyData = new Uint8Array(bufferLength);
      this.leftTimeData = new Uint8Array(bufferLength);
      this.rightTimeData = new Uint8Array(bufferLength);

      this.isRunning = true;
      console.log('🎤 AudioInputManager initialized successfully');
      console.log(`📊 FFT size: ${this.config.fftSize}, Buffer length: ${bufferLength}`);
    } catch (error) {
      console.error('❌ Failed to initialize audio input:', error);
      throw new Error(`Audio input initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get frequency data (FFT) for combined mono signal
   * Returns array where index = frequency bin, value = amplitude (0-255)
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyserNode || !this.frequencyData) {
      throw new Error('AudioInputManager not initialized');
    }
    this.analyserNode.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    return this.frequencyData;
  }

  /**
   * Get time-domain data (waveform) for combined mono signal
   * Returns array where index = time sample, value = amplitude (0-255, 128=center)
   */
  getWaveformData(): Uint8Array {
    if (!this.analyserNode || !this.timeData) {
      throw new Error('AudioInputManager not initialized');
    }
    this.analyserNode.getByteTimeDomainData(this.timeData as Uint8Array<ArrayBuffer>);
    return this.timeData;
  }

  /**
   * Get stereo frequency data
   */
  getStereoFrequencyData(): { left: Uint8Array; right: Uint8Array } {
    if (!this.leftAnalyser || !this.rightAnalyser || !this.leftFrequencyData || !this.rightFrequencyData) {
      throw new Error('AudioInputManager not initialized');
    }
    this.leftAnalyser.getByteFrequencyData(this.leftFrequencyData as Uint8Array<ArrayBuffer>);
    this.rightAnalyser.getByteFrequencyData(this.rightFrequencyData as Uint8Array<ArrayBuffer>);
    return {
      left: this.leftFrequencyData,
      right: this.rightFrequencyData,
    };
  }

  /**
   * Get stereo time-domain data (waveform)
   */
  getStereoWaveformData(): { left: Uint8Array; right: Uint8Array } {
    if (!this.leftAnalyser || !this.rightAnalyser || !this.leftTimeData || !this.rightTimeData) {
      throw new Error('AudioInputManager not initialized');
    }
    this.leftAnalyser.getByteTimeDomainData(this.leftTimeData as Uint8Array<ArrayBuffer>);
    this.rightAnalyser.getByteTimeDomainData(this.rightTimeData as Uint8Array<ArrayBuffer>);
    return {
      left: this.leftTimeData,
      right: this.rightTimeData,
    };
  }

  /**
   * Get peak frequency bin (simple FFT-based pitch detection)
   * Returns: { frequency: number (Hz), amplitude: number (0-255) }
   */
  getPeakFrequency(): { frequency: number; amplitude: number } {
    const frequencyData = this.getFrequencyData();
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;

    let maxAmplitude = 0;
    let maxIndex = 0;

    // Find peak amplitude bin
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxAmplitude) {
        maxAmplitude = frequencyData[i];
        maxIndex = i;
      }
    }

    // Convert bin index to frequency
    const frequency = (maxIndex * nyquist) / frequencyData.length;

    return { frequency, amplitude: maxAmplitude };
  }

  /**
   * Calculate RMS (Root Mean Square) amplitude
   * Returns normalized value 0.0 - 1.0
   */
  getRMS(): number {
    const timeData = this.getWaveformData();
    let sum = 0;

    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128; // Convert to -1.0 to 1.0
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / timeData.length);
  }

  /**
   * Set gain/sensitivity (0.0 - 2.0, where 1.0 = 100%)
   * 0-1.0 = quieter, 1.0-2.0 = louder/more sensitive
   */
  setGain(gain: number): void {
    if (!this.gainNode) {
      console.warn('Gain node not initialized');
      return;
    }
    // Clamp gain between 0 and 2 (0% to 200%)
    const clampedGain = Math.max(0, Math.min(2, gain));
    this.gainNode.gain.value = clampedGain;
    console.log(`🎚️ Gain set to ${(clampedGain * 100).toFixed(0)}%`);
  }

  /**
   * Get current gain value
   */
  getGain(): number {
    return this.gainNode?.gain.value || 1.0;
  }

  /**
   * Get current audio input device ID
   */
  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * Get audio context sample rate
   */
  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  /**
   * Get FFT buffer length
   */
  getBufferLength(): number {
    return this.analyserNode?.frequencyBinCount || 0;
  }

  /**
   * Check if audio input is running
   */
  isInitialized(): boolean {
    return this.isRunning && this.analyserNode !== null;
  }

  /**
   * Update configuration (requires re-initialization)
   */
  updateConfig(config: Partial<AudioInputConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.analyserNode) {
      if (config.fftSize) this.analyserNode.fftSize = config.fftSize;
      if (config.smoothingTimeConstant !== undefined) {
        this.analyserNode.smoothingTimeConstant = config.smoothingTimeConstant;
      }
      if (config.minDecibels !== undefined) {
        this.analyserNode.minDecibels = config.minDecibels;
      }
      if (config.maxDecibels !== undefined) {
        this.analyserNode.maxDecibels = config.maxDecibels;
      }
    }
  }

  /**
   * Clean up resources (same pattern as audioEngine.ts)
   */
  dispose(): void {
    console.log('🛑 Disposing AudioInputManager...');

    this.isRunning = false;

    // Disconnect nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.leftAnalyser) {
      this.leftAnalyser.disconnect();
      this.leftAnalyser = null;
    }

    if (this.rightAnalyser) {
      this.rightAnalyser.disconnect();
      this.rightAnalyser = null;
    }

    if (this.splitter) {
      this.splitter.disconnect();
      this.splitter = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear data arrays
    this.frequencyData = null;
    this.timeData = null;
    this.leftFrequencyData = null;
    this.rightFrequencyData = null;
    this.leftTimeData = null;
    this.rightTimeData = null;

    console.log('✅ AudioInputManager disposed');
  }
}
