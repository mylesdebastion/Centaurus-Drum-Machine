/**
 * LED Compositor Blending Modes
 *
 * Epic 14, Story 14.7 - LED Compositor Implementation
 * Design document: docs/architecture/led-compositor-design.md (Section A.3)
 *
 * Pixel blending algorithms for compositing multiple LED visualization frames
 */

/**
 * Available blending modes for LED compositor
 * - multiply: Darkens overlaps (base * overlay) / 255
 * - screen: Lightens overlaps 255 - ((255-base) * (255-overlay)) / 255
 * - additive: Adds RGB values min(255, base + overlay)
 * - max: Brightest pixel wins max(base, overlay) per channel
 */
export type BlendMode = 'multiply' | 'screen' | 'additive' | 'max';

/**
 * RGB color triplet [R, G, B] where each value is 0-255
 */
export type RGB = [number, number, number];

/**
 * Blend two RGB pixels using specified blending mode
 *
 * @param base - Base pixel color [R, G, B]
 * @param overlay - Overlay pixel color [R, G, B]
 * @param mode - Blending algorithm to apply
 * @returns Composited pixel color [R, G, B]
 *
 * @example
 * ```typescript
 * // Multiply mode (darkens)
 * blendPixels([255, 0, 0], [0, 255, 0], 'multiply'); // [0, 0, 0] (dark)
 *
 * // Screen mode (lightens)
 * blendPixels([128, 128, 128], [128, 128, 128], 'screen'); // [192, 192, 192] (brighter)
 *
 * // Additive mode
 * blendPixels([100, 0, 0], [0, 100, 0], 'additive'); // [100, 100, 0] (yellow)
 * ```
 */
export function blendPixels(base: RGB, overlay: RGB, mode: BlendMode): RGB {
  switch (mode) {
    case 'multiply':
      // Formula: (base * overlay) / 255 [darkens overlaps]
      // Stakeholder: "most helpful" mode
      return [
        Math.round((base[0] * overlay[0]) / 255),
        Math.round((base[1] * overlay[1]) / 255),
        Math.round((base[2] * overlay[2]) / 255),
      ];

    case 'screen':
      // Formula: 255 - ((255-base) * (255-overlay)) / 255 [lightens overlaps]
      // Stakeholder: "most helpful" mode
      return [
        Math.round(255 - ((255 - base[0]) * (255 - overlay[0])) / 255),
        Math.round(255 - ((255 - base[1]) * (255 - overlay[1])) / 255),
        Math.round(255 - ((255 - base[2]) * (255 - overlay[2])) / 255),
      ];

    case 'additive':
      // Formula: min(255, base + overlay) [adds RGB values]
      // Good for bright, energetic visualizations
      return [
        Math.min(255, base[0] + overlay[0]),
        Math.min(255, base[1] + overlay[1]),
        Math.min(255, base[2] + overlay[2]),
      ];

    case 'max':
      // Formula: max(base, overlay) per channel [brightest wins]
      // Good for triggers + ambient visualizations
      return [
        Math.max(base[0], overlay[0]),
        Math.max(base[1], overlay[1]),
        Math.max(base[2], overlay[2]),
      ];
  }
}
