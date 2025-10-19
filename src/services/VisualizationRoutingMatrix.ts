/**
 * Visualization Routing Matrix Service
 * Story 18.3: Visualization Routing Matrix
 * Story 18.4: Context-Aware Routing Rules Engine
 *
 * Intelligent routing algorithm that matches module visualizations to WLED devices
 * based on capabilities, context, and pluggable routing rules.
 *
 * **Usage Example:**
 * ```typescript
 * import { routingMatrix } from '@/services/VisualizationRoutingMatrix';
 *
 * // Set active module
 * routingMatrix.setActiveModule('drum-machine');
 *
 * // Get current routing assignments
 * const assignments = routingMatrix.getCurrentAssignments();
 *
 * // Subscribe to routing changes
 * const unsubscribe = routingMatrix.onRoutingChange((event) => {
 *   console.log('Routing changed:', event.assignments);
 * });
 * ```
 */

import { ledCompositor } from './LEDCompositor';
import { wledDeviceRegistry } from './WLEDDeviceRegistry';
import type {
  ModuleId,
  ModuleVisualizationCapability,
  VisualizationProducer,
  DeviceAssignment,
  RoutingChangeEvent,
} from '@/types/visualization';
import type { WLEDDevice } from '@/types/wled';
import type { RoutingRule, RoutingContext } from '@/types/routing-rules';
import * as BuiltInRules from './routing-rules';

/**
 * Compatibility score calculation result
 */
interface CompatibilityScore {
  producer: VisualizationProducer;
  score: number; // 0-100
}

/**
 * Visualization Routing Matrix Service
 * Implements intelligent routing algorithm
 */
class VisualizationRoutingMatrix {
  private activeModule: ModuleId | null = null;
  private currentAssignments: DeviceAssignment[] = [];
  private routingChangeCallbacks: ((event: RoutingChangeEvent) => void)[] = [];
  private routingRules: RoutingRule[] = [];

  constructor() {
    console.log('[RoutingMatrix] Service initialized');

    // Register built-in routing rules (Story 18.4)
    this.registerBuiltInRules();

    // Subscribe to module registration/unregistration
    ledCompositor.onModuleRegistered(() => {
      this.recalculateRouting('module-registered');
    });

    ledCompositor.onModuleUnregistered(() => {
      this.recalculateRouting('module-unregistered');
    });

    // Subscribe to device changes
    wledDeviceRegistry.subscribeToDevices(() => {
      this.recalculateRouting('device-added');
    });
  }

  /**
   * Set the currently active module (user-facing module)
   * Active modules get priority in routing decisions
   *
   * @param moduleId - Module to set as active (null = no active module)
   */
  setActiveModule(moduleId: ModuleId | null): void {
    if (this.activeModule === moduleId) return;

    this.activeModule = moduleId;
    console.log(`[RoutingMatrix] Active module changed: ${moduleId || 'none'}`);

    this.recalculateRouting('active-module-changed');
  }

  /**
   * Get currently active module
   */
  getActiveModule(): ModuleId | null {
    return this.activeModule;
  }

  /**
   * Get current routing assignments
   * @returns {DeviceAssignment[]} Current device assignments
   */
  getCurrentAssignments(): DeviceAssignment[] {
    return this.currentAssignments;
  }

  /**
   * Recalculate routing assignments
   * Called when modules/devices change or active module changes
   *
   * @param reason - Reason for recalculation
   */
  async recalculateRouting(
    reason: RoutingChangeEvent['reason'] = 'manual-recalculation'
  ): Promise<void> {
    console.log(`[RoutingMatrix] Recalculating routing (reason: ${reason})...`);

    const startTime = performance.now();

    // Get all registered modules
    const modules = ledCompositor.getAllModuleCapabilities();

    // Get all enabled devices
    const devices = await wledDeviceRegistry.getEnabledDevices();

    if (modules.length === 0) {
      console.log('[RoutingMatrix] No modules registered');
      this.updateAssignments([], reason);
      return;
    }

    if (devices.length === 0) {
      console.log('[RoutingMatrix] No devices available');
      this.updateAssignments([], reason);
      return;
    }

    // Calculate assignments
    const assignments = this.calculateAssignments(modules, devices);

    const duration = performance.now() - startTime;
    console.log(`[RoutingMatrix] Routing calculated in ${duration.toFixed(2)}ms`);
    console.log(`[RoutingMatrix] Assigned ${assignments.length} device(s)`);

    this.updateAssignments(assignments, reason);
  }

  /**
   * Calculate device assignments for all modules
   * Main routing algorithm
   */
  private calculateAssignments(
    modules: ModuleVisualizationCapability[],
    devices: WLEDDevice[]
  ): DeviceAssignment[] {
    let assignments: DeviceAssignment[] = [];

    // Step 1: For each device, find best primary module
    for (const device of devices) {
      const assignment = this.assignPrimaryModule(device, modules);
      if (assignment) {
        assignments.push(assignment);
      }
    }

    // Step 2: Add overlays to assignments
    this.assignOverlays(assignments, modules);

    // Step 3: Apply routing rules (Story 18.4)
    assignments = this.applyRoutingRules(modules, devices, assignments);

    return assignments;
  }

  /**
   * Assign primary module to a device
   * Uses compatibility scoring and priority system
   */
  private assignPrimaryModule(
    device: WLEDDevice,
    modules: ModuleVisualizationCapability[]
  ): DeviceAssignment | null {
    let bestMatch: {
      module: ModuleVisualizationCapability;
      producer: VisualizationProducer;
      score: number;
    } | null = null;

    // Calculate compatibility scores for all modules
    for (const module of modules) {
      const compatibility = this.calculateCompatibility(device, module);

      if (!compatibility) continue;

      const score = compatibility.score;

      // Active module bonus (20% boost)
      const finalScore =
        module.moduleId === this.activeModule ? score * 1.2 : score;

      if (!bestMatch || finalScore > bestMatch.score) {
        bestMatch = {
          module,
          producer: compatibility.producer,
          score: finalScore,
        };
      }
    }

    if (!bestMatch) {
      console.warn(
        `[RoutingMatrix] No compatible module found for device: ${device.name}`
      );
      return null;
    }

    console.log(
      `[RoutingMatrix] Assigned ${bestMatch.module.moduleId} → ${device.name} (score: ${bestMatch.score.toFixed(1)})`
    );

    return {
      device,
      primary: {
        moduleId: bestMatch.module.moduleId,
        visualizationType: bestMatch.producer.type,
        producer: bestMatch.producer,
        compatibilityScore: bestMatch.score,
      },
      overlays: [],
      totalPriority: bestMatch.producer.priority,
    };
  }

  /**
   * Calculate compatibility score between device and module
   * Returns best matching producer and score (0-100)
   */
  private calculateCompatibility(
    device: WLEDDevice,
    module: ModuleVisualizationCapability
  ): CompatibilityScore | null {
    let bestProducer: VisualizationProducer | null = null;
    let bestScore = 0;

    for (const producer of module.produces) {
      // Skip overlay-only producers for primary assignment
      if (producer.overlayCompatible && producer.priority < 50) {
        continue;
      }

      const score = this.scoreProducer(device, producer);

      if (score > bestScore) {
        bestScore = score;
        bestProducer = producer;
      }
    }

    if (!bestProducer) return null;

    return { producer: bestProducer, score: bestScore };
  }

  /**
   * Score a visualization producer for a device
   * Returns score 0-100 based on compatibility
   */
  private scoreProducer(
    device: WLEDDevice,
    producer: VisualizationProducer
  ): number {
    let score = 0;

    // Dimension compatibility (0-50 points)
    const deviceDimension = device.capabilities.dimensions;
    const preferredDimension = producer.dimensionPreference;

    if (preferredDimension === 'either') {
      score += 40; // Compatible but not ideal
    } else if (preferredDimension === deviceDimension) {
      score += 50; // Perfect match
    } else {
      return 0; // Incompatible
    }

    // Priority bonus (0-30 points)
    // Normalize priority (1-100) to 0-30 range
    score += (producer.priority / 100) * 30;

    // Supported visualizations check (0-20 points)
    if (
      device.capabilities.supportedVisualizations.includes(producer.type) ||
      device.capabilities.supportedVisualizations.includes('generic-color-array')
    ) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Assign overlay modules to existing assignments
   * Overlays are modules that can composite on top of primary visualization
   */
  private assignOverlays(
    assignments: DeviceAssignment[],
    modules: ModuleVisualizationCapability[]
  ): void {
    // Find overlay-capable modules
    const overlayModules = modules.filter((module) =>
      module.produces.some((p) => p.overlayCompatible)
    );

    for (const assignment of assignments) {
      for (const module of overlayModules) {
        // Skip if this module is already the primary
        if (module.moduleId === assignment.primary.moduleId) continue;

        // Find compatible overlay producer
        const overlayProducer = module.produces.find((p) => {
          if (!p.overlayCompatible) return false;

          // Check dimension compatibility
          const deviceDimension = assignment.device.capabilities.dimensions;
          return (
            p.dimensionPreference === 'either' ||
            p.dimensionPreference === deviceDimension
          );
        });

        if (overlayProducer) {
          assignment.overlays.push({
            moduleId: module.moduleId,
            visualizationType: overlayProducer.type,
            producer: overlayProducer,
          });

          assignment.totalPriority += overlayProducer.priority;

          console.log(
            `[RoutingMatrix] Added overlay: ${module.moduleId} → ${assignment.device.name}`
          );
        }
      }
    }
  }

  /**
   * Update current assignments and notify listeners
   */
  private updateAssignments(
    assignments: DeviceAssignment[],
    reason: RoutingChangeEvent['reason']
  ): void {
    this.currentAssignments = assignments;

    const event: RoutingChangeEvent = {
      assignments,
      timestamp: Date.now(),
      reason,
    };

    this.routingChangeCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[RoutingMatrix] Error in routing change callback:', error);
      }
    });
  }

  /**
   * Subscribe to routing change events
   * @param callback - Function called when routing changes
   * @returns {Function} Unsubscribe function
   */
  onRoutingChange(callback: (event: RoutingChangeEvent) => void): () => void {
    this.routingChangeCallbacks.push(callback);

    // Immediately call with current assignments
    if (this.currentAssignments.length > 0) {
      callback({
        assignments: this.currentAssignments,
        timestamp: Date.now(),
        reason: 'manual-recalculation',
      });
    }

    return () => {
      this.routingChangeCallbacks = this.routingChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // ===== Routing Rules System (Story 18.4) =====

  /**
   * Register built-in routing rules
   * @private
   */
  private registerBuiltInRules(): void {
    const rules = Object.values(BuiltInRules) as RoutingRule[];

    rules.forEach((rule) => this.registerRule(rule));

    console.log(`[RoutingMatrix] Registered ${rules.length} built-in routing rules`);
  }

  /**
   * Register a routing rule
   * @param rule - Rule to register
   */
  registerRule(rule: RoutingRule): void {
    // Check for duplicate rule names
    const existingRule = this.routingRules.find((r) => r.name === rule.name);
    if (existingRule) {
      console.warn(
        `[RoutingMatrix] Rule ${rule.name} already registered, replacing`
      );
      this.routingRules = this.routingRules.filter((r) => r.name !== rule.name);
    }

    this.routingRules.push(rule);

    // Sort rules by priority (highest first)
    this.routingRules.sort((a, b) => b.priority - a.priority);

    console.log(
      `[RoutingMatrix] Registered rule: ${rule.name} (priority: ${rule.priority})`
    );
  }

  /**
   * Unregister a routing rule
   * @param ruleName - Name of rule to unregister
   */
  unregisterRule(ruleName: string): void {
    const initialLength = this.routingRules.length;
    this.routingRules = this.routingRules.filter((r) => r.name !== ruleName);

    if (this.routingRules.length < initialLength) {
      console.log(`[RoutingMatrix] Unregistered rule: ${ruleName}`);
    } else {
      console.warn(`[RoutingMatrix] Rule not found: ${ruleName}`);
    }
  }

  /**
   * Apply routing rules to assignments
   * Rules are applied in priority order (highest first)
   *
   * @param modules - All registered modules
   * @param devices - All available devices
   * @param assignments - Current assignments (before rules)
   * @returns Modified assignments (after rules)
   */
  private applyRoutingRules(
    modules: ModuleVisualizationCapability[],
    devices: WLEDDevice[],
    assignments: DeviceAssignment[]
  ): DeviceAssignment[] {
    let currentAssignments = assignments;

    // Build context
    const context: RoutingContext = {
      activeModule: this.activeModule,
      registeredModules: new Map(modules.map((m) => [m.moduleId, m])),
      availableDevices: devices,
      currentAssignments: currentAssignments,
    };

    // Apply rules in priority order
    for (const rule of this.routingRules) {
      try {
        // Check if rule condition is met
        if (rule.condition(context)) {
          console.log(`[RoutingMatrix] Applying rule: ${rule.name}`);

          // Apply rule action
          const modifiedAssignments = rule.action(context, currentAssignments);

          // Update assignments and context
          currentAssignments = modifiedAssignments;
          context.currentAssignments = modifiedAssignments;
        }
      } catch (error) {
        console.error(`[RoutingMatrix] Error applying rule ${rule.name}:`, error);
      }
    }

    return currentAssignments;
  }

  /**
   * Get all registered routing rules
   */
  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  /**
   * Debug: Print registered rules
   */
  debugPrintRules(): void {
    console.log('[RoutingMatrix] Registered Rules:');
    console.log('='.repeat(80));

    if (this.routingRules.length === 0) {
      console.log('  No rules registered');
      return;
    }

    this.routingRules.forEach((rule, index) => {
      console.log(`\n  ${index + 1}. ${rule.name}`);
      console.log(`     Priority: ${rule.priority}`);
      console.log(`     Description: ${rule.description}`);
    });

    console.log('\n' + '='.repeat(80));
  }

  // ===== End Routing Rules System =====

  /**
   * Debug: Print routing table
   */
  debugPrintRouting(): void {
    console.log('[RoutingMatrix] Current Routing:');
    console.log('='.repeat(80));

    console.log(`Active Module: ${this.activeModule || 'none'}`);
    console.log(`Total Assignments: ${this.currentAssignments.length}`);
    console.log('');

    if (this.currentAssignments.length === 0) {
      console.log('  No assignments');
      return;
    }

    this.currentAssignments.forEach((assignment, index) => {
      console.log(`\n  ${index + 1}. Device: ${assignment.device.name}`);
      console.log(`     Primary: ${assignment.primary.moduleId}`);
      console.log(`       └─ Visualization: ${assignment.primary.visualizationType}`);
      console.log(
        `       └─ Score: ${assignment.primary.compatibilityScore.toFixed(1)}`
      );

      if (assignment.overlays.length > 0) {
        console.log(`     Overlays:`);
        assignment.overlays.forEach((overlay) => {
          console.log(`       └─ ${overlay.moduleId}: ${overlay.visualizationType}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
  }
}

/**
 * Singleton instance of VisualizationRoutingMatrix
 * Use this exported instance throughout the application
 */
export const routingMatrix = new VisualizationRoutingMatrix();
