/**
 * WLED Device Types
 * Story 18.1: WLED Device Registry
 *
 * Type definitions for WLED LED controller devices and their capabilities.
 */

/**
 * Visualization type identifier
 * These represent different LED visualization patterns that can be rendered
 */
export type VisualizationType =
  | 'step-sequencer-grid' // Drum machine step sequencer on 2D grid
  | 'step-sequencer-1d' // Drum machine step sequencer on 1D strip
  | 'piano-keys' // Piano keyboard on 1D strip
  | 'piano-roll-grid' // Piano roll on 2D grid
  | 'fretboard-grid' // Guitar fretboard on 2D grid
  | 'midi-trigger-ripple' // Audio-reactive ripple effect (1D or 2D)
  | 'audio-spectrum' // Audio frequency spectrum (1D)
  | 'generic-color-array'; // Generic fallback (any dimension)

/**
 * Device dimension type
 */
export type DeviceDimension = '1D' | '2D';

/**
 * Grid configuration for 2D LED devices
 */
export interface GridConfig {
  /** Number of columns */
  width: number;

  /** Number of rows */
  height: number;

  /** Serpentine wiring (every other row reversed) */
  serpentine: boolean;

  /** Grid orientation */
  orientation: 'horizontal' | 'vertical';
}

/**
 * Device capability metadata
 * Describes what the device can display and its physical characteristics
 */
export interface DeviceCapabilities {
  /** Device dimension (1D strip or 2D grid) */
  dimensions: DeviceDimension;

  /** Total number of LEDs */
  ledCount: number;

  /** Grid configuration (required if dimensions === '2D') */
  gridConfig?: GridConfig;

  /** List of visualization types this device can display */
  supportedVisualizations: VisualizationType[];
}

/**
 * WLED device (database row)
 */
export interface WLEDDevice {
  /** Device UUID */
  id: string;

  /** Owner user ID */
  user_id: string;

  /** Device name (user-friendly) */
  name: string;

  /** Device IP address (IPv4) */
  ip: string;

  /** Physical location (optional) */
  location?: string;

  /** Device capabilities */
  capabilities: DeviceCapabilities;

  /** Device priority (0-100, higher = preferred) */
  priority: number;

  /** Global brightness (0-255) */
  brightness: number;

  /** Reverse LED strip direction */
  reverse_direction: boolean;

  /** Device enabled/disabled */
  enabled: boolean;

  /** Assigned identification color (hex string, e.g., "#FF0000") */
  assigned_color?: string;

  /** Created timestamp */
  created_at: string;

  /** Last updated timestamp */
  updated_at: string;

  /** Last successful connection timestamp */
  last_seen_at?: string;
}

/**
 * Input type for creating/updating WLED devices
 * Omits database-managed fields (id, user_id, timestamps)
 */
export interface WLEDDeviceInput {
  name: string;
  ip: string;
  location?: string;
  capabilities: DeviceCapabilities;
  priority?: number;
  brightness?: number;
  reverse_direction?: boolean;
  enabled?: boolean;
  assigned_color?: string;
}

/**
 * WLED device info response (from WLED HTTP API /json/info)
 */
export interface WLEDInfoResponse {
  ver: string; // Firmware version
  leds: {
    count: number; // Total LED count
    rgbw: boolean; // RGBW vs RGB
    wv: boolean; // White channel
    cct: boolean; // CCT support
  };
  name: string; // Device name
  udpport: number;
  live: boolean;
  // ... many other fields (not all used)
}

/**
 * WLED state update payload (POST to /json/state)
 */
export interface WLEDStatePayload {
  /** Power on/off */
  on: boolean;

  /** Brightness (0-255) */
  bri: number;

  /** Segment configurations */
  seg: Array<{
    /** Individual LED colors (hex strings, e.g., ["FF0000", "00FF00"]) */
    i?: string[];

    /** Segment ID */
    id?: number;

    /** Start LED index */
    start?: number;

    /** Stop LED index */
    stop?: number;
  }>;
}
