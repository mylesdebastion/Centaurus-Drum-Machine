/**
 * SpectrumVisualization - Classic frequency analyzer with FFT bars
 *
 * Features:
 * - Frequency bins displayed as vertical bars
 * - Color mapped to frequency (low=red, high=cyan)
 * - Amplitude controls brightness and opacity
 * - Bin grouping and averaging for cleaner display
 */

import { getFrequencyColor } from '../../../utils/colorMapping';

export interface SpectrumConfig {
  numBars: number; // Number of frequency bars to display
  peakHold: boolean; // Enable peak hold with fade
  peakFallSpeed: number; // Speed of peak fall (0.01 - 0.1)
  minOpacity: number; // Minimum opacity for quiet sounds (0.0 - 1.0)
  minBrightness: number; // Minimum brightness multiplier (0.0 - 1.0)
  scaleType: 'log' | 'linear' | 'quadratic'; // Frequency scaling type
}

export const DEFAULT_SPECTRUM_CONFIG: SpectrumConfig = {
  numBars: 128,
  peakHold: true,
  peakFallSpeed: 0.05,
  minOpacity: 0.3,
  minBrightness: 0.5,
  scaleType: 'log',
};

export class SpectrumVisualization {
  private config: SpectrumConfig;
  private peakValues: number[] = [];
  private peakTimestamps: number[] = [];

  constructor(config: SpectrumConfig = DEFAULT_SPECTRUM_CONFIG) {
    this.config = config;
    this.peakValues = new Array(config.numBars).fill(0);
    this.peakTimestamps = new Array(config.numBars).fill(0);
  }

  /**
   * Render spectrum bars to canvas
   */
  render(
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    width: number,
    height: number
  ): void {
    const { numBars, peakHold, peakFallSpeed, minOpacity, minBrightness } = this.config;
    const bufferLength = frequencyData.length;
    const barWidth = width / numBars;

    // Logarithmic frequency scaling for musical range
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    const minFreq = 50;   // 50 Hz (bass)
    const maxFreq = 8000; // 8 kHz (high treble)

    // Clear canvas (pure black for LED output)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();

    for (let i = 0; i < numBars; i++) {
      let binIndex: number;

      if (this.config.scaleType === 'log') {
        // Logarithmic frequency distribution
        // Each bar represents a log-spaced frequency band
        const logPosition = i / (numBars - 1); // 0 to 1
        const freqHz = minFreq * Math.pow(maxFreq / minFreq, logPosition);
        // Convert frequency to FFT bin index
        binIndex = Math.floor((freqHz / nyquist) * bufferLength);
      } else if (this.config.scaleType === 'quadratic') {
        // Quadratic frequency distribution (between linear and log)
        const position = i / (numBars - 1); // 0 to 1
        const quadPosition = position * position; // Square the position
        const freqHz = minFreq + (maxFreq - minFreq) * quadPosition;
        binIndex = Math.floor((freqHz / nyquist) * bufferLength);
      } else {
        // Linear frequency distribution
        binIndex = Math.floor((i / numBars) * bufferLength);
      }

      // Get amplitude from this bin (and nearby bins for smoothing)
      const smoothRange = Math.max(1, Math.floor(bufferLength / numBars / 4));
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, binIndex - smoothRange); j <= Math.min(bufferLength - 1, binIndex + smoothRange); j++) {
        sum += frequencyData[j];
        count++;
      }

      const avgAmplitude = sum / count;
      const normalizedAmplitude = avgAmplitude / 255; // 0.0 - 1.0
      const barHeight = normalizedAmplitude * height;

      // Update peak hold
      if (peakHold) {
        if (normalizedAmplitude > this.peakValues[i]) {
          this.peakValues[i] = normalizedAmplitude;
          this.peakTimestamps[i] = now;
        } else {
          // Decay peak over time
          const timeSincePeak = now - this.peakTimestamps[i];
          const decayAmount = (timeSincePeak / 1000) * peakFallSpeed;
          this.peakValues[i] = Math.max(normalizedAmplitude, this.peakValues[i] - decayAmount);
        }
      }

      // Use position for color mapping (matches frequency distribution)
      const normalizedFrequency = i / (numBars - 1);

      // Get color based on frequency (using existing colorMapping.ts)
      const color = getFrequencyColor(normalizedFrequency, 'spectrum');

      // Apply amplitude to opacity AND brightness (quiet sounds are dimmer/more transparent)
      const opacity = Math.max(minOpacity, normalizedAmplitude);
      const brightness = Math.max(minBrightness, normalizedAmplitude);

      // Draw main bar (solid blocks, no gaps)
      ctx.fillStyle = `rgba(${Math.floor(color.r * brightness)}, ${Math.floor(color.g * brightness)}, ${Math.floor(color.b * brightness)}, ${opacity})`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);

      // Draw peak hold indicator
      if (peakHold && this.peakValues[i] > 0) {
        const peakHeight = this.peakValues[i] * height;
        const peakY = height - peakHeight;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
        ctx.fillRect(i * barWidth, peakY - 2, barWidth, 2);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SpectrumConfig>): void {
    this.config = { ...this.config, ...config };

    // Resize peak arrays if numBars changed
    if (config.numBars && config.numBars !== this.peakValues.length) {
      this.peakValues = new Array(config.numBars).fill(0);
      this.peakTimestamps = new Array(config.numBars).fill(0);
    }
  }

  /**
   * Reset peak hold values
   */
  resetPeaks(): void {
    this.peakValues.fill(0);
    this.peakTimestamps.fill(0);
  }
}
