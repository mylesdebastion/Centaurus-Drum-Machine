/**
 * Routing Rules Types
 * Story 18.4: Context-Aware Routing Rules Engine
 *
 * Type definitions for pluggable routing rules that modify device assignments
 * based on context (active module, device types, etc.)
 */

import type {
  ModuleId,
  ModuleVisualizationCapability,
  DeviceAssignment,
} from './visualization';
import type { WLEDDevice } from './wled';

/**
 * Context available to routing rules
 * Provides read-only access to current routing state
 */
export interface RoutingContext {
  /** Currently active module (user-facing) */
  activeModule: ModuleId | null;

  /** All registered modules and their capabilities */
  registeredModules: Map<ModuleId, ModuleVisualizationCapability>;

  /** All available devices (enabled only) */
  availableDevices: WLEDDevice[];

  /** Current routing assignments (before rule modifications) */
  currentAssignments: DeviceAssignment[];
}

/**
 * Pluggable routing rule
 * Rules can modify assignments based on context
 */
export interface RoutingRule {
  /** Unique rule name */
  name: string;

  /** Human-readable description */
  description: string;

  /** Priority (higher = evaluated first) */
  priority: number;

  /**
   * Check if rule should be applied
   * Return true to execute action, false to skip
   */
  condition: (context: RoutingContext) => boolean;

  /**
   * Modify routing assignments
   * Return new assignments (immutable - don't mutate input)
   */
  action: (
    context: RoutingContext,
    currentAssignments: DeviceAssignment[]
  ) => DeviceAssignment[];
}
