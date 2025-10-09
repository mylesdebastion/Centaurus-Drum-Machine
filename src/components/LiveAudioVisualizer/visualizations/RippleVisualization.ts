/**
 * RippleVisualization - AudioLux-inspired frequency ripple effect
 *
 * Based on Cymaspace AudioLux ripple.cpp algorithm:
 * - Frequency mode: hue = 192 * freq (low=red, high=cyan)
 * - Amplitude mode: brightness = 255 * amp
 * - PushQueue mechanism: New colors ripple outward from origin
 * - Smoothing: Running average reduces flickering
 *
 * Enhanced with directional control:
 * - Interactive origin point (click/touch to set)
 * - Preset directions (center, bottom-up, left-right, etc.)
 * - Distance-based propagation from origin
 */

export interface RippleOrigin {
  x: number; // 0-1 normalized (0=left, 1=right)
  y: number; // 0-1 normalized (0=top, 1=bottom)
}

export type RippleDirection = 'radial' | 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top';

export interface RippleConfig {
  direction: RippleDirection;
  origin: RippleOrigin;
  colorHistoryLength: number; // Number of past colors to store
  smoothingLength: number; // Number of frames to average for smoothing
  showOriginIndicator: boolean;
  originIndicatorDuration: number; // ms to show indicator after setting
  scaleType: 'log' | 'linear' | 'quadratic'; // Frequency scaling type
}

export const DEFAULT_RIPPLE_CONFIG: RippleConfig = {
  direction: 'radial',
  origin: { x: 0.5, y: 0.5 }, // Center
  colorHistoryLength: 100,
  smoothingLength: 5,
  showOriginIndicator: true,
  originIndicatorDuration: 1000,
  scaleType: 'log',
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

export class RippleVisualization {
  private config: RippleConfig;
  private colorHistory: RGB[] = [];
  private smoothingAmp: number[] = [];
  private smoothingFreq: number[] = [];
  private lastOriginChangeTime: number = 0;

  constructor(config: RippleConfig = DEFAULT_RIPPLE_CONFIG) {
    this.config = config;
  }

  /**
   * Update ripple with new audio data and render to canvas
   */
  render(
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    width: number,
    height: number
  ): void {
    // Extract dominant frequency and amplitude
    const { frequency, amplitude } = this.extractDominantFreqAndAmp(frequencyData);

    // Smooth inputs (running average)
    const smoothedAmp = this.smooth(this.smoothingAmp, amplitude, this.config.smoothingLength);
    const smoothedFreq = this.smooth(this.smoothingFreq, frequency, this.config.smoothingLength);

    // Frequency to hue mapping - quadratic for quadratic scale, linear otherwise
    let hue;
    if (this.config.scaleType === 'quadratic') {
      // Quadratic color mapping - emphasizes bass frequencies with smooth transitions
      hue = Math.pow(smoothedFreq, 2) * 192; // Quadratic curve (0 = red, 192 = cyan)
    } else {
      // Linear color mapping for log and linear scales (AudioLux original)
      hue = 192 * smoothedFreq; // 0 (red) to 192 (cyan)
    }

    const val = 255 * smoothedAmp; // brightness
    const sat = 255; // full saturation

    // Convert HSV to RGB
    const newColor = this.hsvToRgb(hue, sat, val);

    // PushQueue: Add new color to history (creates ripple effect)
    this.colorHistory.unshift(newColor);
    if (this.colorHistory.length > this.config.colorHistoryLength) {
      this.colorHistory.pop();
    }

    // Render ripple effect
    this.renderRipple(ctx, width, height);

    // Draw origin indicator if recently changed
    if (this.config.showOriginIndicator) {
      const timeSinceChange = Date.now() - this.lastOriginChangeTime;
      if (timeSinceChange < this.config.originIndicatorDuration) {
        this.drawOriginIndicator(ctx, width, height, timeSinceChange);
      }
    }
  }

  /**
   * Render ripple effect to canvas
   */
  private renderRipple(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate distance from origin (0-1)
        const distance = this.calculateDistance(x, y, width, height);

        // Map distance to color history index
        // Closer to origin = newer colors, further = older colors
        const historyIndex = Math.floor(distance * this.colorHistory.length);
        const colorIndex = Math.min(historyIndex, this.colorHistory.length - 1);

        const color = this.colorHistory[colorIndex] || { r: 0, g: 0, b: 0 };

        // Set pixel color
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = color.r; // R
        data[pixelIndex + 1] = color.g; // G
        data[pixelIndex + 2] = color.b; // B
        data[pixelIndex + 3] = 255; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Calculate distance from origin based on current direction mode
   */
  private calculateDistance(
    pixelX: number,
    pixelY: number,
    gridWidth: number,
    gridHeight: number
  ): number {
    const { direction, origin } = this.config;

    const normalizedX = pixelX / gridWidth; // 0-1
    const normalizedY = pixelY / gridHeight; // 0-1

    switch (direction) {
      case 'radial': {
        // Radial distance from origin
        const dx = normalizedX - origin.x;
        const dy = normalizedY - origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Normalize to 0-1 (diagonal is max distance ≈ 1.414)
        return Math.min(distance / 1.414, 1);
      }
      case 'left-right':
        return normalizedX; // 0 at left edge, 1 at right edge
      case 'right-left':
        return 1 - normalizedX;
      case 'top-bottom':
        return normalizedY; // 0 at top edge, 1 at bottom edge
      case 'bottom-top':
        return 1 - normalizedY;
      default:
        return 0;
    }
  }

  /**
   * Extract dominant frequency and amplitude from FFT data
   */
  private extractDominantFreqAndAmp(frequencyData: Uint8Array): {
    frequency: number;
    amplitude: number;
  } {
    let maxAmplitude = 0;
    let maxIndex = 0;

    // Find peak amplitude bin
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxAmplitude) {
        maxAmplitude = frequencyData[i];
        maxIndex = i;
      }
    }

    // Convert bin index to actual frequency (assuming 44.1kHz sample rate)
    // Nyquist frequency = sampleRate / 2
    const sampleRate = 44100; // Default sample rate
    const nyquist = sampleRate / 2;
    const freqHz = (maxIndex / frequencyData.length) * nyquist;

    let normalizedFreq: number;

    if (this.config.scaleType === 'log') {
      // Apply logarithmic scaling for better color distribution
      // Musical range: 50Hz (bass) to 8kHz (high treble)
      // This spreads out the frequencies where most music happens
      const minFreq = 50;
      const maxFreq = 8000;
      const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freqHz));

      // Logarithmic mapping: log(freq/minFreq) / log(maxFreq/minFreq)
      normalizedFreq = Math.log(clampedFreq / minFreq) / Math.log(maxFreq / minFreq);
    } else if (this.config.scaleType === 'quadratic') {
      // Quadratic scaling (between linear and log)
      const minFreq = 50;
      const maxFreq = 8000;
      const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freqHz));

      // Quadratic mapping: sqrt((freq - min) / (max - min))
      normalizedFreq = Math.sqrt((clampedFreq - minFreq) / (maxFreq - minFreq));
    } else {
      // Linear scaling: just normalize to 0-1 based on Nyquist frequency
      normalizedFreq = freqHz / nyquist;
    }

    const normalizedAmp = maxAmplitude / 255;

    return { frequency: normalizedFreq, amplitude: normalizedAmp };
  }

  /**
   * Smoothing function (from ripple.cpp lines 1945-1956)
   */
  private smooth(buffer: number[], value: number, smoothingLength: number): number {
    buffer.push(value);
    if (buffer.length > smoothingLength) {
      buffer.shift();
    }

    const sum = buffer.reduce((acc, v) => acc + v, 0);
    return sum / buffer.length;
  }

  /**
   * Convert HSV to RGB (0-255 range for all channels)
   * Based on AudioLux HSV implementation
   */
  private hsvToRgb(h: number, s: number, v: number): RGB {
    // Normalize inputs
    h = h % 256; // Hue wraps around
    s = Math.max(0, Math.min(255, s));
    v = Math.max(0, Math.min(255, v));

    if (s === 0) {
      // Grayscale
      return { r: v, g: v, b: v };
    }

    const region = Math.floor(h / 43);
    const remainder = (h - region * 43) * 6;

    const p = (v * (255 - s)) / 255;
    const q = (v * (255 - (s * remainder) / 255)) / 255;
    const t = (v * (255 - (s * (255 - remainder)) / 255)) / 255;

    switch (region) {
      case 0:
        return { r: v, g: t, b: p };
      case 1:
        return { r: q, g: v, b: p };
      case 2:
        return { r: p, g: v, b: t };
      case 3:
        return { r: p, g: q, b: v };
      case 4:
        return { r: t, g: p, b: v };
      default:
        return { r: v, g: p, b: q };
    }
  }

  /**
   * Draw origin indicator (semi-transparent circle)
   */
  private drawOriginIndicator(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeSinceChange: number
  ): void {
    const { origin, originIndicatorDuration } = this.config;
    const x = origin.x * width;
    const y = origin.y * height;

    // Fade out over time
    const fadeProgress = timeSinceChange / originIndicatorDuration;
    const opacity = Math.max(0, 1 - fadeProgress);

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
    ctx.lineWidth = 2;

    // Draw crosshair
    const size = 20;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Set origin point (normalized 0-1 coordinates)
   */
  setOrigin(x: number, y: number): void {
    this.config.origin = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
    this.lastOriginChangeTime = Date.now();
    this.config.direction = 'radial'; // Switch to radial when manually setting origin
  }

  /**
   * Set direction with preset origins
   */
  setDirection(direction: RippleDirection): void {
    this.config.direction = direction;

    // Set appropriate origin for directional modes
    switch (direction) {
      case 'radial':
        this.config.origin = { x: 0.5, y: 0.5 }; // Center
        break;
      case 'bottom-top':
        this.config.origin = { x: 0.5, y: 1.0 }; // Bottom
        break;
      case 'left-right':
        this.config.origin = { x: 0.0, y: 0.5 }; // Left
        break;
      case 'top-bottom':
        this.config.origin = { x: 0.5, y: 0.0 }; // Top
        break;
      case 'right-left':
        this.config.origin = { x: 1.0, y: 0.5 }; // Right
        break;
    }

    this.lastOriginChangeTime = Date.now();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RippleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current origin
   */
  getOrigin(): RippleOrigin {
    return { ...this.config.origin };
  }
}
