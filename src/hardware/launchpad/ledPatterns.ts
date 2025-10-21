/**
 * Launchpad Pro LED Color Utilities
 *
 * RGB conversion and color mapping for Launchpad Pro LED control.
 * Reference: research/launchpad-pro-integration-findings.md#210-347
 */

import { RGB_RANGE, COLOR_PALETTE } from './constants';

/**
 * RGB color interface (Launchpad range: 0-63)
 */
export interface LaunchpadRGB {
  r: number; // 0-63
  g: number; // 0-63
  b: number; // 0-63
}

/**
 * Convert standard RGB (0-255) to Launchpad RGB (0-63)
 *
 * Launchpad Pro uses 6-bit RGB (0-63 per channel), NOT 8-bit (0-255)!
 * Conversion formula: launchpadRGB = floor(standardRGB / 4)
 *
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Launchpad RGB object {r, g, b} (0-63 per channel)
 */
export const toLaunchpadRGB = (r: number, g: number, b: number): LaunchpadRGB => {
  const clamp = (value: number): number => {
    const converted = Math.floor(value / 4);
    return Math.max(RGB_RANGE.MIN, Math.min(RGB_RANGE.MAX, converted));
  };

  return {
    r: clamp(r),
    g: clamp(g),
    b: clamp(b),
  };
};

/**
 * Convert RGB to closest velocity palette color (0-127)
 * Used for fast LED updates via Note On messages instead of RGB SysEx
 *
 * Maps to predefined velocity values from COLOR_PALETTE
 *
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Velocity color value (0-127)
 */
export const toVelocityColor = (r: number, g: number, b: number): number => {
  // Calculate color intensity
  const max = Math.max(r, g, b);

  // Off
  if (max < 32) {
    return COLOR_PALETTE.OFF;
  }

  // Determine dominant color channel
  const isRed = r > g && r > b;
  const isGreen = g > r && g > b;
  const isBlue = b > r && b > g;

  // Determine intensity (low vs full)
  const isFull = max > 200;

  // White (all channels roughly equal)
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
    return COLOR_PALETTE.WHITE;
  }

  // Red dominant
  if (isRed) {
    return isFull ? COLOR_PALETTE.RED_FULL : COLOR_PALETTE.RED_LOW;
  }

  // Green dominant
  if (isGreen) {
    return isFull ? COLOR_PALETTE.GREEN_FULL : COLOR_PALETTE.GREEN_LOW;
  }

  // Blue dominant
  if (isBlue) {
    return isFull ? COLOR_PALETTE.BLUE_FULL : COLOR_PALETTE.BLUE_LOW;
  }

  // Orange (red + green)
  if (r > 128 && g > 64 && b < 64) {
    return COLOR_PALETTE.ORANGE;
  }

  // Yellow (red + green, equal intensity)
  if (r > 128 && g > 128 && b < 64) {
    return COLOR_PALETTE.YELLOW;
  }

  // Default: white
  return COLOR_PALETTE.WHITE;
};

/**
 * Spectrum-based color mapping for drum tracks
 * Maps track index to frequency-based colors (red = low freq, blue = high freq)
 *
 * Reference: research/launchpad-pro-integration-findings.md#278-347
 *
 * @param trackIndex Track number (0-7)
 * @returns RGB color for track
 */
export const getTrackColorSpectrum = (trackIndex: number): LaunchpadRGB => {
  const colors: LaunchpadRGB[] = [
    { r: 63, g: 0, b: 0 },   // Track 0 (Kick): Red
    { r: 63, g: 22, b: 0 },  // Track 1 (Snare): Orange
    { r: 63, g: 63, b: 0 },  // Track 2 (Clap): Yellow
    { r: 0, g: 63, b: 0 },   // Track 3 (Hi-hat): Green
    { r: 0, g: 22, b: 63 },  // Track 4 (Open hat): Blue
    { r: 0, g: 0, b: 63 },   // Track 5: Blue
    { r: 32, g: 0, b: 63 },  // Track 6: Purple
    { r: 63, g: 0, b: 32 },  // Track 7: Magenta
  ];

  return colors[trackIndex % colors.length];
};

/**
 * Get playback position indicator color
 * Uses bright white or yellow for current step visualization
 *
 * @returns RGB color for playback indicator
 */
export const getPlaybackColor = (): LaunchpadRGB => {
  return { r: 63, g: 63, b: 63 }; // Bright white
};
