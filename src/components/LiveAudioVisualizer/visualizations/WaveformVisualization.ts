/**
 * WaveformVisualization - Scientific oscilloscope-style time-domain display
 *
 * Features:
 * - Scrolling or triggered waveform display
 * - Stereo L/R channel overlay
 * - Technical overlays (RMS, peak, frequency estimate)
 * - Grid with time/amplitude divisions
 * - Frequency-based color mapping
 */

import { getFrequencyColor, ColorMode } from '../../../utils/colorMapping';

export type WaveformMode = 'scrolling' | 'triggered';
export type StereoLayout = 'overlay' | 'split' | 'xy';

export interface WaveformConfig {
  mode: WaveformMode;
  stereoLayout: StereoLayout;
  triggerLevel: number; // 0-255 (128 = zero crossing)
  showGrid: boolean;
  showTechnicalReadout: boolean;
  lineColor: string; // CSS color (fallback if no frequency data)
  lineWidth: number;
  gridColor: string;
  stereoLeftColor: string; // For stereo overlay
  stereoRightColor: string;
  colorMode: ColorMode; // Frequency-based color mode
  useFrequencyColors: boolean; // Enable frequency-based coloring
}

export const DEFAULT_WAVEFORM_CONFIG: WaveformConfig = {
  mode: 'scrolling',
  stereoLayout: 'overlay',
  triggerLevel: 128, // Zero crossing
  showGrid: true,
  showTechnicalReadout: false, // Disabled - readings shown in main UI
  lineColor: '#00FF00', // Oscilloscope green (fallback)
  lineWidth: 2,
  gridColor: 'rgba(0, 255, 0, 0.02)', // Extremely dim grid
  stereoLeftColor: '#00FF00', // Green
  stereoRightColor: '#00FFFF', // Cyan
  colorMode: 'spectrum',
  useFrequencyColors: true, // Enable frequency-based coloring by default
};

export class WaveformVisualization {
  private config: WaveformConfig;

  constructor(config: WaveformConfig = DEFAULT_WAVEFORM_CONFIG) {
    this.config = config;
  }

  /**
   * Render mono waveform
   */
  render(
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    width: number,
    height: number,
    peakFrequency?: number // Optional peak frequency for color mapping
  ): void {
    const { mode, showGrid, lineWidth, useFrequencyColors, colorMode, lineColor } = this.config;

    // Clear canvas (pure black for LED output)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      this.drawGrid(ctx, width, height);
    }

    // Determine line color based on peak frequency
    let color = lineColor; // Fallback
    if (useFrequencyColors && peakFrequency !== undefined) {
      color = this.getFrequencyBasedColor(peakFrequency, colorMode);
    }

    // Draw waveform
    if (mode === 'scrolling') {
      this.renderScrolling(ctx, timeData, width, height, color, lineWidth);
    } else {
      this.renderTriggered(ctx, timeData, width, height, color, lineWidth);
    }

    // Draw technical readout
    if (this.config.showTechnicalReadout) {
      const metrics = this.calculateMetrics(timeData);
      this.drawTechnicalReadout(ctx, metrics);
    }
  }

  /**
   * Render stereo waveform
   */
  renderStereo(
    ctx: CanvasRenderingContext2D,
    leftData: Uint8Array,
    rightData: Uint8Array,
    width: number,
    height: number,
    peakFrequency?: number // Optional peak frequency for color mapping
  ): void {
    const { stereoLayout, showGrid, useFrequencyColors, colorMode, stereoLeftColor, stereoRightColor } = this.config;

    // Clear canvas (pure black for LED output)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      this.drawGrid(ctx, width, height);
    }

    // Determine colors based on peak frequency
    let leftColor = stereoLeftColor;
    let rightColor = stereoRightColor;
    if (useFrequencyColors && peakFrequency !== undefined) {
      const baseColor = this.getFrequencyBasedColor(peakFrequency, colorMode);
      leftColor = baseColor;
      rightColor = this.adjustColorBrightness(baseColor, 0.8); // Slightly dimmer for right channel
    }

    if (stereoLayout === 'overlay') {
      // Draw both channels overlaid
      this.renderScrolling(ctx, leftData, width, height, leftColor, 1.5, 0.8);
      this.renderScrolling(ctx, rightData, width, height, rightColor, 1.5, 0.8);
    } else if (stereoLayout === 'split') {
      // Draw L on top half, R on bottom half
      const halfHeight = height / 2;
      this.renderScrolling(ctx, leftData, width, halfHeight, leftColor, 1.5);
      ctx.save();
      ctx.translate(0, halfHeight);
      this.renderScrolling(ctx, rightData, width, halfHeight, rightColor, 1.5);
      ctx.restore();
    }

    // Draw technical readout for both channels
    if (this.config.showTechnicalReadout) {
      const leftMetrics = this.calculateMetrics(leftData);
      const rightMetrics = this.calculateMetrics(rightData);
      this.drawStereoTechnicalReadout(ctx, leftMetrics, rightMetrics);
    }
  }

  /**
   * Scrolling waveform mode
   */
  private renderScrolling(
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    width: number,
    height: number,
    color: string,
    lineWidth: number,
    opacity: number = 1.0
  ): void {
    const sliceWidth = width / timeData.length;
    let x = 0;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = opacity;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0; // Normalize to 0-2
      const y = (v * height) / 2; // Scale to canvas height

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  /**
   * Triggered waveform mode (zero-crossing detection)
   */
  private renderTriggered(
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    width: number,
    height: number,
    color: string,
    lineWidth: number
  ): void {
    const { triggerLevel } = this.config;

    // Find trigger point (zero-crossing with positive slope)
    let triggerIndex = -1;
    for (let i = 1; i < timeData.length - 1; i++) {
      if (timeData[i - 1] < triggerLevel && timeData[i] >= triggerLevel) {
        triggerIndex = i;
        break;
      }
    }

    if (triggerIndex === -1) triggerIndex = 0; // Fallback

    // Draw from trigger point
    const sliceWidth = width / timeData.length;
    let x = 0;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (let i = 0; i < timeData.length; i++) {
      const dataIndex = (triggerIndex + i) % timeData.length;
      const v = timeData[dataIndex] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }

  /**
   * Draw grid overlay
   */
  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const { gridColor } = this.config;
    const divisions = 8;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = (i * height) / divisions;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = (i * width) / divisions;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center line (slightly brighter)
    ctx.strokeStyle = gridColor.replace('0.02', '0.05'); // Increase alpha slightly
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  /**
   * Calculate technical metrics from waveform data
   */
  private calculateMetrics(timeData: Uint8Array): {
    rms: number;
    peak: number;
    frequency: number;
  } {
    let sum = 0;
    let peak = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128; // Convert to -1.0 to 1.0
      sum += normalized * normalized;
      peak = Math.max(peak, Math.abs(normalized));

      // Count zero crossings
      if (i > 0 && timeData[i - 1] < 128 && timeData[i] >= 128) {
        zeroCrossings++;
      }
    }

    const rms = Math.sqrt(sum / timeData.length);

    // Estimate frequency from zero-crossing rate
    // Assuming 44100 Hz sample rate and 2048 samples
    const sampleRate = 44100;
    const frequency = (zeroCrossings / 2) * (sampleRate / timeData.length);

    return { rms, peak, frequency };
  }

  /**
   * Draw technical readout overlay
   */
  private drawTechnicalReadout(
    ctx: CanvasRenderingContext2D,
    metrics: { rms: number; peak: number; frequency: number }
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);

    ctx.fillStyle = '#00FF00';
    ctx.font = '12px monospace';
    ctx.fillText(`RMS: ${(metrics.rms * 100).toFixed(1)}%`, 20, 30);
    ctx.fillText(`Peak: ${(metrics.peak * 100).toFixed(1)}%`, 20, 50);
    ctx.fillText(`Freq: ${metrics.frequency.toFixed(0)} Hz`, 20, 70);
  }

  /**
   * Draw stereo technical readout
   */
  private drawStereoTechnicalReadout(
    ctx: CanvasRenderingContext2D,
    leftMetrics: { rms: number; peak: number; frequency: number },
    rightMetrics: { rms: number; peak: number; frequency: number }
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 100);

    ctx.fillStyle = this.config.stereoLeftColor;
    ctx.font = '12px monospace';
    ctx.fillText('L:', 20, 30);
    ctx.fillText(`RMS: ${(leftMetrics.rms * 100).toFixed(1)}%`, 45, 30);
    ctx.fillText(`Peak: ${(leftMetrics.peak * 100).toFixed(1)}%`, 45, 50);

    ctx.fillStyle = this.config.stereoRightColor;
    ctx.fillText('R:', 20, 70);
    ctx.fillText(`RMS: ${(rightMetrics.rms * 100).toFixed(1)}%`, 45, 70);
    ctx.fillText(`Peak: ${(rightMetrics.peak * 100).toFixed(1)}%`, 45, 90);
  }

  /**
   * Get frequency-based color from Hz value
   */
  private getFrequencyBasedColor(frequencyHz: number, colorMode: ColorMode): string {
    // Map frequency to normalized 0-1 range using log scale (50-8000 Hz)
    const minFreq = 50;
    const maxFreq = 8000;
    const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequencyHz));
    const normalizedFreq = Math.log(clampedFreq / minFreq) / Math.log(maxFreq / minFreq);

    // Get RGB color
    const rgb = getFrequencyColor(normalizedFreq, colorMode, 'quadratic');

    // Convert to CSS color string
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  /**
   * Adjust color brightness
   */
  private adjustColorBrightness(color: string, factor: number): string {
    // Parse RGB color
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return color;

    const r = Math.round(parseInt(match[1]) * factor);
    const g = Math.round(parseInt(match[2]) * factor);
    const b = Math.round(parseInt(match[3]) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WaveformConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
