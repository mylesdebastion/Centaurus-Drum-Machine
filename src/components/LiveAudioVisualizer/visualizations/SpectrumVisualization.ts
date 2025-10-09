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
}

export const DEFAULT_SPECTRUM_CONFIG: SpectrumConfig = {
  numBars: 128,
  peakHold: true,
  peakFallSpeed: 0.05,
  minOpacity: 0.3,
  minBrightness: 0.5,
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
    const binSize = Math.floor(bufferLength / numBars);

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const now = Date.now();

    for (let i = 0; i < numBars; i++) {
      // Average multiple frequency bins for each bar
      let sum = 0;
      const startBin = i * binSize;
      const endBin = Math.min(startBin + binSize, bufferLength);

      for (let j = startBin; j < endBin; j++) {
        sum += frequencyData[j];
      }

      const avgAmplitude = sum / binSize;
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

      // Calculate normalized frequency (0-1) for color mapping
      const normalizedFrequency = i / numBars;

      // Get color based on frequency (using existing colorMapping.ts)
      const color = getFrequencyColor(normalizedFrequency, 'spectrum');

      // Apply amplitude to opacity AND brightness (quiet sounds are dimmer/more transparent)
      const opacity = Math.max(minOpacity, normalizedAmplitude);
      const brightness = Math.max(minBrightness, normalizedAmplitude);

      // Draw main bar
      ctx.fillStyle = `rgba(${Math.floor(color.r * brightness)}, ${Math.floor(color.g * brightness)}, ${Math.floor(color.b * brightness)}, ${opacity})`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);

      // Draw peak hold indicator
      if (peakHold && this.peakValues[i] > 0) {
        const peakHeight = this.peakValues[i] * height;
        const peakY = height - peakHeight;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
        ctx.fillRect(i * barWidth, peakY - 2, barWidth - 2, 2);
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
