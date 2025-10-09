/**
 * VisualizationEngine - Unified visualization coordinator
 *
 * Manages multiple visualization modes and provides a consistent interface
 * for rendering audio data to canvas.
 */

import { SpectrumVisualization, SpectrumConfig, DEFAULT_SPECTRUM_CONFIG } from './visualizations/SpectrumVisualization';
import { WaveformVisualization, WaveformConfig, DEFAULT_WAVEFORM_CONFIG } from './visualizations/WaveformVisualization';
import { RippleVisualization, RippleConfig, DEFAULT_RIPPLE_CONFIG, RippleDirection } from './visualizations/RippleVisualization';
import { AudioInputManager } from './AudioInputManager';

export type VisualizationMode = 'spectrum' | 'waveform' | 'ripple';

export interface VisualizationEngineConfig {
  mode: VisualizationMode;
  stereo: boolean; // Use stereo channels for waveform
  spectrumConfig: SpectrumConfig;
  waveformConfig: WaveformConfig;
  rippleConfig: RippleConfig;
}

export const DEFAULT_VIZ_ENGINE_CONFIG: VisualizationEngineConfig = {
  mode: 'spectrum',
  stereo: false,
  spectrumConfig: DEFAULT_SPECTRUM_CONFIG,
  waveformConfig: DEFAULT_WAVEFORM_CONFIG,
  rippleConfig: DEFAULT_RIPPLE_CONFIG,
};

export class VisualizationEngine {
  private config: VisualizationEngineConfig;
  private spectrumViz: SpectrumVisualization;
  private waveformViz: WaveformVisualization;
  private rippleViz: RippleVisualization;

  constructor(config: VisualizationEngineConfig = DEFAULT_VIZ_ENGINE_CONFIG) {
    this.config = config;
    this.spectrumViz = new SpectrumVisualization(config.spectrumConfig);
    this.waveformViz = new WaveformVisualization(config.waveformConfig);
    this.rippleViz = new RippleVisualization(config.rippleConfig);
  }

  /**
   * Render current visualization mode to canvas
   */
  render(
    ctx: CanvasRenderingContext2D,
    audioManager: AudioInputManager,
    width: number,
    height: number
  ): void {
    const { mode, stereo } = this.config;

    switch (mode) {
      case 'spectrum': {
        const frequencyData = audioManager.getFrequencyData();
        this.spectrumViz.render(ctx, frequencyData, width, height);
        break;
      }

      case 'waveform': {
        if (stereo) {
          const { left, right } = audioManager.getStereoWaveformData();
          this.waveformViz.renderStereo(ctx, left, right, width, height);
        } else {
          const timeData = audioManager.getWaveformData();
          this.waveformViz.render(ctx, timeData, width, height);
        }
        break;
      }

      case 'ripple': {
        const frequencyData = audioManager.getFrequencyData();
        this.rippleViz.render(ctx, frequencyData, width, height);
        break;
      }
    }
  }

  /**
   * Set visualization mode
   */
  setMode(mode: VisualizationMode): void {
    this.config.mode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): VisualizationMode {
    return this.config.mode;
  }

  /**
   * Enable/disable stereo mode (for waveform)
   */
  setStereo(stereo: boolean): void {
    this.config.stereo = stereo;
  }

  /**
   * Update spectrum configuration
   */
  updateSpectrumConfig(config: Partial<SpectrumConfig>): void {
    this.config.spectrumConfig = { ...this.config.spectrumConfig, ...config };
    this.spectrumViz.updateConfig(config);
  }

  /**
   * Update waveform configuration
   */
  updateWaveformConfig(config: Partial<WaveformConfig>): void {
    this.config.waveformConfig = { ...this.config.waveformConfig, ...config };
    this.waveformViz.updateConfig(config);
  }

  /**
   * Update ripple configuration
   */
  updateRippleConfig(config: Partial<RippleConfig>): void {
    this.config.rippleConfig = { ...this.config.rippleConfig, ...config };
    this.rippleViz.updateConfig(config);
  }

  /**
   * Set ripple origin (for interactive mode)
   */
  setRippleOrigin(x: number, y: number): void {
    this.rippleViz.setOrigin(x, y);
  }

  /**
   * Set ripple direction preset
   */
  setRippleDirection(direction: RippleDirection): void {
    this.rippleViz.setDirection(direction);
  }

  /**
   * Get ripple origin
   */
  getRippleOrigin(): { x: number; y: number } {
    return this.rippleViz.getOrigin();
  }

  /**
   * Reset spectrum peaks
   */
  resetSpectrumPeaks(): void {
    this.spectrumViz.resetPeaks();
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualizationEngineConfig {
    return { ...this.config };
  }
}
