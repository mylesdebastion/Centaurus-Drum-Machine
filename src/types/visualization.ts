/**
 * Visualization Types
 * Story 18.2: Module Capability Declaration
 *
 * Type definitions for module visualization capabilities and routing.
 */

import type { VisualizationType, WLEDDevice } from './wled';

/**
 * Module identifier
 */
export type ModuleId =
  | 'drum-machine'
  | 'guitar-fretboard'
  | 'piano-roll'
  | 'audio-reactive'
  | 'isometric-sequencer';

/**
 * Dimension preference for visualization producers
 */
export type DimensionPreference = '1D' | '2D' | 'either';

/**
 * Visualization producer declaration
 * Describes a specific visualization that a module can produce
 */
export interface VisualizationProducer {
  /** Visualization type identifier */
  type: VisualizationType;

  /** Preferred device dimension (1D strip, 2D grid, or either) */
  dimensionPreference: DimensionPreference;

  /** Can this visualization be overlaid on top of another? */
  overlayCompatible: boolean;

  /**
   * Priority level (higher = takes precedence in routing decisions)
   * Range: 1-100
   * - 100: Exclusive (e.g., DrumMachine step sequencer)
   * - 50-99: High priority (e.g., Guitar fretboard)
   * - 10-49: Medium priority (e.g., Piano roll)
   * - 1-9: Low priority (e.g., generic fallbacks)
   */
  priority: number;
}

/**
 * Module visualization capability declaration
 * Describes what visualizations a module can produce
 */
export interface ModuleVisualizationCapability {
  /** Module identifier */
  moduleId: ModuleId;

  /** Visualizations this module can produce */
  produces: VisualizationProducer[];
}

/**
 * Device assignment for a specific module
 * Result of routing matrix calculation
 */
export interface DeviceAssignment {
  /** Assigned device */
  device: WLEDDevice;

  /** Primary visualization (main content) */
  primary: {
    moduleId: ModuleId;
    visualizationType: VisualizationType;
    producer: VisualizationProducer;
    compatibilityScore: number; // 0-100 (from routing algorithm)
  };

  /** Overlay visualizations (stacked on top of primary) */
  overlays: Array<{
    moduleId: ModuleId;
    visualizationType: VisualizationType;
    producer: VisualizationProducer;
  }>;

  /** Total priority (primary + overlays, for sorting) */
  totalPriority: number;
}

/**
 * Routing change event
 * Emitted when routing assignments change
 */
export interface RoutingChangeEvent {
  /** Current routing assignments */
  assignments: DeviceAssignment[];

  /** Timestamp of routing change */
  timestamp: number;

  /** Reason for routing change */
  reason: 'module-registered' | 'module-unregistered' | 'device-added' | 'device-removed' | 'active-module-changed' | 'manual-recalculation';
}

/**
 * Module registration event
 * Emitted when a module registers its capabilities
 */
export interface ModuleRegistrationEvent {
  capability: ModuleVisualizationCapability;
  timestamp: number;
}

/**
 * Module unregistration event
 * Emitted when a module unregisters
 */
export interface ModuleUnregistrationEvent {
  moduleId: ModuleId;
  timestamp: number;
}
