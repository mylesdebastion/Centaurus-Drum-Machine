/**
 * LED Compositor Service
 *
 * Epic 14, Story 14.7 - LED Compositor Implementation
 * Design document: docs/architecture/led-compositor-design.md
 *
 * Blends multiple module LED outputs onto limited hardware using visual compositing
 */

import {
  LEDFrame,
  BlendMode,
  RGB,
  blendPixels,
  checkModeCompatibility,
  checkNotePerLedCompatibility,
} from '../types';

/**
 * Compositor event types for UI integration
 */
export type CompositorEvent =
  | { type: 'incompatibility-detected'; modules: string[]; reason: string }
  | { type: 'blend-mode-changed'; mode: BlendMode }
  | { type: 'frame-submitted'; moduleId: string; deviceId: string }
  | { type: 'composited-frame'; deviceId: string; pixelData: Uint8ClampedArray };

/**
 * Event callback type
 */
export type CompositorEventCallback = (event: CompositorEvent) => void;

/**
 * LED Compositor Service - Singleton
 *
 * Receives LED frames from multiple modules, blends them using visual compositing,
 * and outputs composited frames to hardware devices.
 */
class LEDCompositorService {
  private static instance: LEDCompositorService;

  /**
   * Frame buffer: deviceId → moduleId → LEDFrame
   * Stores latest frame from each module per device
   */
  private frameBuffer: Map<string, Map<string, LEDFrame>> = new Map();

  /**
   * Current blending mode (user-configurable)
   */
  private currentBlendMode: BlendMode = 'multiply'; // Default: multiply (stakeholder preference)

  /**
   * Rate limiting: last send timestamp per device (30 FPS = 33.3ms minimum)
   */
  private lastSendTime: Map<string, number> = new Map();
  private readonly MIN_SEND_INTERVAL_MS = 33.3; // 30 FPS

  /**
   * Event listeners for UI integration
   */
  private eventListeners: CompositorEventCallback[] = [];

  private constructor() {
    console.log('[LEDCompositor] Service initialized');
  }

  public static getInstance(): LEDCompositorService {
    if (!LEDCompositorService.instance) {
      LEDCompositorService.instance = new LEDCompositorService();
    }
    return LEDCompositorService.instance;
  }

  /**
   * Submit LED frame from module
   * Modules call this method to send visualization frames to the compositor
   *
   * @param frame - LED frame data from module
   *
   * @example
   * ```typescript
   * const frame: LEDFrame = {
   *   moduleId: 'piano-roll',
   *   deviceId: 'wled-strip-1',
   *   timestamp: performance.now(),
   *   pixelData: new Uint8ClampedArray([255, 0, 0]), // Red pixel
   *   visualizationMode: 'note-per-led'
   * };
   * ledCompositor.submitFrame(frame);
   * ```
   */
  public submitFrame(frame: LEDFrame): void {
    // Validation
    if (!frame.moduleId || !frame.deviceId || !frame.pixelData || frame.pixelData.length === 0) {
      console.warn('[LEDCompositor] Invalid frame submitted:', frame);
      return;
    }

    if (frame.pixelData.length % 3 !== 0) {
      console.warn('[LEDCompositor] Invalid pixel data length (must be multiple of 3):', frame.pixelData.length);
      return;
    }

    // Store frame in buffer
    if (!this.frameBuffer.has(frame.deviceId)) {
      this.frameBuffer.set(frame.deviceId, new Map());
    }

    this.frameBuffer.get(frame.deviceId)!.set(frame.moduleId, frame);

    // console.log(`[LEDCompositor] Frame received: ${frame.moduleId} → ${frame.deviceId} (${frame.pixelData.length / 3} pixels)`);

    // Emit event
    this.emitEvent({ type: 'frame-submitted', moduleId: frame.moduleId, deviceId: frame.deviceId });

    // Process and send composited frame (rate limited)
    this.processDevice(frame.deviceId);
  }

  /**
   * Clear module's frame from buffer
   * Modules call this on unmount/cleanup
   *
   * @param moduleId - Module identifier
   * @param deviceId - Device identifier
   */
  public clearModuleFrame(moduleId: string, deviceId: string): void {
    const deviceFrames = this.frameBuffer.get(deviceId);
    if (deviceFrames) {
      deviceFrames.delete(moduleId);
      console.log(`[LEDCompositor] Cleared frame: ${moduleId} → ${deviceId}`);

      // If no more frames for this device, remove device entry
      if (deviceFrames.size === 0) {
        this.frameBuffer.delete(deviceId);
      }
    }
  }

  /**
   * Set blending mode (user-configurable)
   *
   * @param mode - Blending algorithm to use
   */
  public setBlendMode(mode: BlendMode): void {
    this.currentBlendMode = mode;
    console.log(`[LEDCompositor] Blend mode changed: ${mode}`);

    // Emit event
    this.emitEvent({ type: 'blend-mode-changed', mode });

    // Re-composite all devices with new blend mode
    for (const deviceId of this.frameBuffer.keys()) {
      this.processDevice(deviceId);
    }
  }

  /**
   * Get current blend mode
   */
  public getBlendMode(): BlendMode {
    return this.currentBlendMode;
  }

  /**
   * Add event listener
   */
  public addEventListener(callback: CompositorEventCallback): void {
    this.eventListeners.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(callback: CompositorEventCallback): void {
    this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
  }

  /**
   * Process device: check compatibility, composite frames, send to hardware
   */
  private processDevice(deviceId: string): void {
    const deviceFrames = this.frameBuffer.get(deviceId);
    if (!deviceFrames || deviceFrames.size === 0) return;

    // Rate limiting (30 FPS)
    const now = performance.now();
    const lastSend = this.lastSendTime.get(deviceId) || 0;
    if (now - lastSend < this.MIN_SEND_INTERVAL_MS) {
      // console.log(`[LEDCompositor] Rate limited: ${deviceId}`);
      return; // Too soon, skip this frame
    }

    const frames = Array.from(deviceFrames.values());

    // Single frame: send directly (no blending needed)
    if (frames.length === 1) {
      this.sendToDevice(deviceId, frames[0].pixelData);
      this.lastSendTime.set(deviceId, now);
      return;
    }

    // Multiple frames: check compatibility
    const compatible = this.checkCompatibility(frames);

    if (!compatible) {
      // Incompatible: use toggle mode (most recent frame only)
      const mostRecent = frames.reduce((latest, frame) =>
        frame.timestamp > latest.timestamp ? frame : latest
      );

      console.warn(`[LEDCompositor] Incompatible frames detected for ${deviceId}, using toggle mode (latest: ${mostRecent.moduleId})`);

      this.sendToDevice(deviceId, mostRecent.pixelData);
      this.lastSendTime.set(deviceId, now);

      // Emit incompatibility event
      this.emitEvent({
        type: 'incompatibility-detected',
        modules: frames.map(f => f.moduleId),
        reason: 'Incompatible visualization modes (different LED addressing)'
      });

      return;
    }

    // Compatible: blend frames
    const compositedPixelData = this.compositeFrames(frames, this.currentBlendMode);
    this.sendToDevice(deviceId, compositedPixelData);
    this.lastSendTime.set(deviceId, now);
  }

  /**
   * Check if frames are compatible for blending
   */
  private checkCompatibility(frames: LEDFrame[]): boolean {
    if (frames.length < 2) return true;

    // All frames must have same pixel count
    const pixelCount = frames[0].pixelData.length;
    if (!frames.every(f => f.pixelData.length === pixelCount)) {
      console.warn('[LEDCompositor] Incompatible: Pixel counts do not match');
      return false;
    }

    // Check visualization mode compatibility
    for (let i = 0; i < frames.length - 1; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        const frame1 = frames[i];
        const frame2 = frames[j];

        // Special case: note-per-led requires additional check
        if (frame1.visualizationMode === 'note-per-led' && frame2.visualizationMode === 'note-per-led') {
          if (!checkNotePerLedCompatibility(frame1, frame2)) {
            console.warn(`[LEDCompositor] Incompatible: note-per-led modes with different pixel counts`);
            return false;
          }
        } else {
          // General compatibility check
          if (!checkModeCompatibility(frame1.visualizationMode, frame2.visualizationMode)) {
            console.warn(`[LEDCompositor] Incompatible: ${frame1.visualizationMode} + ${frame2.visualizationMode}`);
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Composite multiple frames using blending mode
   */
  private compositeFrames(frames: LEDFrame[], mode: BlendMode): Uint8ClampedArray {
    if (frames.length === 0) return new Uint8ClampedArray(0);
    if (frames.length === 1) return frames[0].pixelData;

    const pixelCount = frames[0].pixelData.length / 3;
    const result = new Uint8ClampedArray(frames[0].pixelData.length);

    // Initialize result with first frame
    result.set(frames[0].pixelData);

    // Blend remaining frames pixel-by-pixel
    for (let i = 1; i < frames.length; i++) {
      const frame = frames[i];

      for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
        const offset = pixelIndex * 3;

        const basePixel: RGB = [
          result[offset],
          result[offset + 1],
          result[offset + 2]
        ];

        const overlayPixel: RGB = [
          frame.pixelData[offset],
          frame.pixelData[offset + 1],
          frame.pixelData[offset + 2]
        ];

        const blended = blendPixels(basePixel, overlayPixel, mode);

        result[offset] = blended[0];
        result[offset + 1] = blended[1];
        result[offset + 2] = blended[2];
      }
    }

    // console.log(`[LEDCompositor] Composited ${frames.length} frames using ${mode} mode (${pixelCount} pixels)`);

    return result;
  }

  /**
   * Send composited frame to hardware device and emit to virtual displays
   */
  private sendToDevice(deviceId: string, pixelData: Uint8ClampedArray): void {
    // Emit composited frame event for virtual displays
    this.emitEvent({
      type: 'composited-frame',
      deviceId,
      pixelData
    });

    // TODO: Integrate with WLED service for physical hardware
    // wledService.sendPixelData(deviceId, pixelData);
  }

  /**
   * Get latest composited frame for a device (for polling approach)
   * Returns null if only one module is active (no compositing needed)
   */
  public getCompositedFrame(deviceId: string): Uint8ClampedArray | null {
    const deviceFrames = this.frameBuffer.get(deviceId);
    if (!deviceFrames || deviceFrames.size <= 1) return null;

    const frames = Array.from(deviceFrames.values());
    const compatible = this.checkCompatibility(frames);

    if (!compatible) {
      const mostRecent = frames.reduce((latest, frame) =>
        frame.timestamp > latest.timestamp ? frame : latest
      );
      return mostRecent.pixelData;
    }

    return this.compositeFrames(frames, this.currentBlendMode);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: CompositorEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[LEDCompositor] Error in event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const ledCompositor = LEDCompositorService.getInstance();
