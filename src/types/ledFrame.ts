/**
 * LED Frame Data Structure
 *
 * Epic 14, Story 14.7 - LED Compositor Implementation
 * Design document: docs/architecture/led-compositor-design.md (Section A.3)
 *
 * Standard data structure for modules to submit visualization frames to the compositor
 */

import { VisualizationMode } from './visualizationMode';

/**
 * LED visualization frame submitted by modules to compositor
 *
 * Modules create LEDFrame objects and submit them to the LEDCompositor service.
 * The compositor blends multiple frames targeting the same device before sending to hardware.
 *
 * @example
 * ```typescript
 * const frame: LEDFrame = {
 *   moduleId: 'piano-roll',
 *   deviceId: 'wled-strip-1',
 *   timestamp: performance.now(),
 *   pixelData: new Uint8ClampedArray([255, 0, 0, 0, 255, 0]), // Red, Green pixels
 *   visualizationMode: 'note-per-led'
 * };
 *
 * ledCompositor.submitFrame(frame);
 * ```
 */
export interface LEDFrame {
  /**
   * Unique identifier for the module submitting this frame
   * Examples: 'piano-roll', 'guitar-fretboard', 'drum-machine', 'live-audio-visualizer'
   */
  moduleId: string;

  /**
   * Target WLED device ID (from GlobalMusicContext hardware.wled.devices)
   * Example: 'wled-192-168-1-100'
   */
  deviceId: string;

  /**
   * Frame submission timestamp (performance.now()) for ordering and debugging
   * Used to determine which frame is most recent when toggle mode is active
   */
  timestamp: number;

  /**
   * Pixel data as RGB triplets [R,G,B, R,G,B, R,G,B, ...]
   * Each pixel is 3 consecutive bytes (Red 0-255, Green 0-255, Blue 0-255)
   * Array length must be divisible by 3 (length = numPixels * 3)
   */
  pixelData: Uint8ClampedArray;

  /**
   * Visualization addressing mode for compatibility checking
   * Used by compositor to determine if frames can be blended
   */
  visualizationMode: VisualizationMode;
}
