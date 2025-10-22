/**
 * LED Compositor Service
 *
 * Epic 14, Story 14.7 - LED Compositor Implementation
 * Epic 18, Story 18.2 - Module Capability Declaration System
 * Epic 18, Story 18.6 - LEDCompositor Integration & Module Migration
 * Design document: docs/architecture/led-compositor-design.md
 *
 * Blends multiple module LED outputs onto limited hardware using visual compositing
 * Extended with module registration system for intelligent routing
 * Extended with automatic frame routing to WLED devices based on routing matrix
 */

import {
  LEDFrame,
  BlendMode,
  RGB,
  blendPixels,
  checkModeCompatibility,
  checkNotePerLedCompatibility,
} from '../types';
import type {
  ModuleVisualizationCapability,
  ModuleId,
  ModuleRegistrationEvent,
  ModuleUnregistrationEvent,
  DeviceAssignment as _DeviceAssignment, // Used via routingMatrix.getCurrentAssignments()
} from '../types/visualization';
import type { WLEDDevice, VisualizationType } from '../types/wled';

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
 * Module frame input for automatic routing (Story 18.6)
 * Modules submit frames in generic format, LEDCompositor routes to appropriate devices
 */
export interface ModuleFrameInput {
  /** Module identifier */
  moduleId: ModuleId;

  /** Generic RGB pixel data (not device-specific) */
  pixelData: Uint8ClampedArray;

  /** Frame timestamp (optional, defaults to now) */
  timestamp?: number;
}

/**
 * Internal overlay frame storage
 */
interface OverlayFrame {
  moduleId: ModuleId;
  pixelData: Uint8ClampedArray;
}


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

  /**
   * Module capability registry (Story 18.2)
   * Stores visualization capabilities for registered modules
   */
  private moduleCapabilities: Map<ModuleId, ModuleVisualizationCapability> = new Map();

  /**
   * Module registration event callbacks
   */
  private registrationCallbacks: ((event: ModuleRegistrationEvent) => void)[] = [];
  private unregistrationCallbacks: ((event: ModuleUnregistrationEvent) => void)[] = [];

  /**
   * Frame cache for overlay blending (Story 18.6)
   * Stores latest frame from each module for use in overlays
   */
  private frameCache: Map<ModuleId, Uint8ClampedArray> = new Map();

  /**
   * Routing matrix reference (set after initialization to avoid circular dependency)
   */
  private routingMatrix: any = null;

  private constructor() {
    console.log('[LEDCompositor] Service initialized');
  }

  /**
   * Set routing matrix reference (called after both services are initialized)
   */
  public setRoutingMatrix(matrix: any): void {
    this.routingMatrix = matrix;
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

  // ===== Module Registration API (Story 18.2) =====

  /**
   * Register a module's visualization capabilities
   * Modules call this on mount to declare what visualizations they can produce
   *
   * @param capability - Module capability declaration
   *
   * @example
   * ```typescript
   * const drumMachineCapability: ModuleVisualizationCapability = {
   *   moduleId: 'drum-machine',
   *   produces: [
   *     {
   *       type: 'step-sequencer-grid',
   *       dimensionPreference: '2D',
   *       overlayCompatible: false,
   *       priority: 10,
   *     },
   *   ],
   * };
   *
   * ledCompositor.registerModule(drumMachineCapability);
   * ```
   */
  public registerModule(capability: ModuleVisualizationCapability): void {
    this.moduleCapabilities.set(capability.moduleId, capability);

    console.log(`[LEDCompositor] Module registered: ${capability.moduleId}`);
    console.log(`[LEDCompositor] Produces ${capability.produces.length} visualization(s):`, capability.produces.map(p => p.type).join(', '));

    // Notify registration callbacks
    const event: ModuleRegistrationEvent = {
      capability,
      timestamp: Date.now(),
    };

    this.registrationCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[LEDCompositor] Error in registration callback:', error);
      }
    });
  }

  /**
   * Unregister a module's visualization capabilities
   * Modules call this on unmount to clean up
   *
   * @param moduleId - Module identifier
   *
   * @example
   * ```typescript
   * ledCompositor.unregisterModule('drum-machine');
   * ```
   */
  public unregisterModule(moduleId: ModuleId): void {
    const existed = this.moduleCapabilities.delete(moduleId);

    if (existed) {
      console.log(`[LEDCompositor] Module unregistered: ${moduleId}`);

      // Notify unregistration callbacks
      const event: ModuleUnregistrationEvent = {
        moduleId,
        timestamp: Date.now(),
      };

      this.unregistrationCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[LEDCompositor] Error in unregistration callback:', error);
        }
      });
    } else {
      console.warn(`[LEDCompositor] Attempted to unregister unknown module: ${moduleId}`);
    }
  }

  /**
   * Check if a module is currently registered
   * @param moduleId - Module identifier
   * @returns {boolean} True if module is registered
   */
  public isModuleRegistered(moduleId: ModuleId): boolean {
    return this.moduleCapabilities.has(moduleId);
  }

  /**
   * Get all registered module capabilities
   * @returns {ModuleVisualizationCapability[]} Array of module capabilities
   */
  public getAllModuleCapabilities(): ModuleVisualizationCapability[] {
    return Array.from(this.moduleCapabilities.values());
  }

  /**
   * Get a specific module's capability
   * @param moduleId - Module identifier
   * @returns {ModuleVisualizationCapability | undefined} Module capability or undefined
   */
  public getModuleCapability(moduleId: ModuleId): ModuleVisualizationCapability | undefined {
    return this.moduleCapabilities.get(moduleId);
  }

  /**
   * Subscribe to module registration events
   * @param callback - Function called when modules register
   * @returns {Function} Unsubscribe function
   */
  public onModuleRegistered(callback: (event: ModuleRegistrationEvent) => void): () => void {
    this.registrationCallbacks.push(callback);
    return () => {
      this.registrationCallbacks = this.registrationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to module unregistration events
   * @param callback - Function called when modules unregister
   * @returns {Function} Unsubscribe function
   */
  public onModuleUnregistered(callback: (event: ModuleUnregistrationEvent) => void): () => void {
    this.unregistrationCallbacks.push(callback);
    return () => {
      this.unregistrationCallbacks = this.unregistrationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Debug: Print all registered modules and their capabilities
   */
  public debugPrintCapabilities(): void {
    console.log('[LEDCompositor] Registered Modules:');
    console.log('='.repeat(80));

    if (this.moduleCapabilities.size === 0) {
      console.log('  No modules registered');
      return;
    }

    this.moduleCapabilities.forEach((capability, moduleId) => {
      console.log(`\n  Module: ${moduleId}`);
      console.log(`  Produces:`);

      capability.produces.forEach((producer, index) => {
        console.log(`    ${index + 1}. ${producer.type}`);
        console.log(`       - Dimension: ${producer.dimensionPreference}`);
        console.log(`       - Overlay: ${producer.overlayCompatible ? 'Yes' : 'No'}`);
        console.log(`       - Priority: ${producer.priority}`);
      });
    });

    console.log('\n' + '='.repeat(80));
  }

  // ===== End Module Registration API =====

  // ===== Automatic Frame Routing (Story 18.6) =====

  /**
   * Submit LED frame for automatic routing
   * Frame will be routed to appropriate devices based on current routing assignments
   *
   * @param frame - Module frame input (generic format)
   *
   * @example
   * ```typescript
   * const frame: ModuleFrameInput = {
   *   moduleId: 'drum-machine',
   *   pixelData: generateDrumMachineFrame(pattern, activeStep),
   *   timestamp: Date.now(),
   * };
   * await ledCompositor.submitFrameWithRouting(frame);
   * ```
   */
  public async submitFrameWithRouting(frame: ModuleFrameInput): Promise<void> {
    // Validation
    if (!frame.pixelData || frame.pixelData.length === 0) {
      console.warn(`[LEDCompositor] Empty frame from ${frame.moduleId}`);
      return;
    }

    // Cache frame for this module (used for overlays)
    this.frameCache.set(frame.moduleId, frame.pixelData);

    // Route frame to devices
    await this.routeFrame(frame);
  }

  /**
   * Route frame to appropriate devices based on current routing assignments
   */
  private async routeFrame(frame: ModuleFrameInput): Promise<void> {
    const startTime = performance.now();

    // Get current routing assignments (check if routing matrix is set)
    if (!this.routingMatrix) {
      console.warn('[LEDCompositor] Routing matrix not initialized yet');
      return;
    }

    const assignments = this.routingMatrix.getCurrentAssignments();

    if (assignments.length === 0) {
      // No routing assignments - log once and skip
      console.log(`[LEDCompositor] No routing assignments for ${frame.moduleId}`);
      return;
    }

    // Find assignments where this module is primary
    const primaryAssignments = assignments.filter(
      (a: any) => a.primary.moduleId === frame.moduleId
    );

    if (primaryAssignments.length === 0) {
      // Module not assigned as primary - check if it's an overlay
      const overlayAssignments = assignments.filter((a: any) =>
        a.overlays.some((o: any) => o.moduleId === frame.moduleId)
      );

      if (overlayAssignments.length === 0) {
        // Module not assigned at all - skip
        return;
      }

      // Module is overlay only - frame cached for blending, no direct send
      return;
    }

    // Process each assignment
    for (const assignment of primaryAssignments) {
      try {
        // Convert frame to device-specific format
        const deviceFrame = this.convertFrameToDevice(
          frame.pixelData,
          assignment.device,
          assignment.primary.visualizationType
        );

        // Collect overlay frames
        const overlayFrames: OverlayFrame[] = [];
        for (const overlay of assignment.overlays) {
          const cachedFrame = this.frameCache.get(overlay.moduleId);
          if (cachedFrame) {
            const overlayDeviceFrame = this.convertFrameToDevice(
              cachedFrame,
              assignment.device,
              overlay.visualizationType
            );
            overlayFrames.push({
              moduleId: overlay.moduleId,
              pixelData: overlayDeviceFrame,
            });
          }
        }

        // Blend overlays onto primary frame
        const blendedFrame = this.blendOverlays(deviceFrame, overlayFrames);

        // Send to WLED device
        await this.sendToWLED(assignment.device, blendedFrame);
      } catch (error) {
        console.error(
          `[LEDCompositor] Error routing frame to ${assignment.device.name}:`,
          error
        );
      }
    }

    const duration = performance.now() - startTime;
    if (duration > 2) {
      console.warn(
        `[LEDCompositor] Frame routing took ${duration.toFixed(2)}ms (target: <2ms)`
      );
    }
  }

  /**
   * Convert generic frame to device-specific format
   */
  private convertFrameToDevice(
    genericFrame: Uint8ClampedArray,
    device: WLEDDevice,
    visualizationType: VisualizationType
  ): Uint8ClampedArray {
    const deviceLedCount =
      device.capabilities.dimensions === '1D'
        ? device.capabilities.ledCount
        : (device.capabilities.gridConfig?.width || 0) *
          (device.capabilities.gridConfig?.height || 0);

    const deviceFrame = new Uint8ClampedArray(deviceLedCount * 3);

    // Different conversion logic based on visualization type
    switch (visualizationType) {
      case 'step-sequencer-grid':
        // Map generic frame to 2D grid
        this.convertToGrid(genericFrame, deviceFrame, device);
        break;

      case 'step-sequencer-1d':
        // Map generic frame to 1D strip
        this.convertTo1DStrip(genericFrame, deviceFrame, device);
        break;

      case 'piano-keys':
        // Map piano keys to 1D strip
        this.convertPianoKeysTo1D(genericFrame, deviceFrame, device);
        break;

      case 'fretboard-grid':
        // Map fretboard to 2D grid
        this.convertFretboardToGrid(genericFrame, deviceFrame, device);
        break;

      case 'midi-trigger-ripple':
        // Generic ripple effect (works on 1D or 2D)
        this.convertRipple(genericFrame, deviceFrame, device);
        break;

      case 'generic-color-array':
      default:
        // Direct copy (or scale if size mismatch)
        this.convertGeneric(genericFrame, deviceFrame);
        break;
    }

    // Apply device settings (brightness, reverse direction)
    this.applyDeviceSettings(deviceFrame, device);

    return deviceFrame;
  }

  /**
   * Convert step sequencer pattern to 2D grid
   * Generic frame: 6 tracks × 16 steps
   * Device: Variable grid (e.g., 6 rows × 25 columns)
   */
  private convertToGrid(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray,
    device: WLEDDevice
  ): void {
    const gridConfig = device.capabilities.gridConfig;
    if (!gridConfig) return;

    const genericWidth = 16; // Assume 16 steps
    const genericHeight = 6; // Assume 6 tracks
    const deviceWidth = gridConfig.width;
    const deviceHeight = gridConfig.height;

    // Center align pattern on grid
    const offsetX = Math.floor((deviceWidth - genericWidth) / 2);
    const offsetY = Math.floor((deviceHeight - genericHeight) / 2);

    for (let y = 0; y < genericHeight; y++) {
      for (let x = 0; x < genericWidth; x++) {
        const genericIndex = (y * genericWidth + x) * 3;
        const deviceX = offsetX + x;
        const deviceY = offsetY + y;

        if (
          deviceX >= 0 &&
          deviceX < deviceWidth &&
          deviceY >= 0 &&
          deviceY < deviceHeight
        ) {
          const deviceIndex = (deviceY * deviceWidth + deviceX) * 3;
          deviceFrame[deviceIndex] = genericFrame[genericIndex]; // R
          deviceFrame[deviceIndex + 1] = genericFrame[genericIndex + 1]; // G
          deviceFrame[deviceIndex + 2] = genericFrame[genericIndex + 2]; // B
        }
      }
    }

    // Apply serpentine wiring if needed
    if (gridConfig.serpentine) {
      this.applySerpentine(deviceFrame, gridConfig);
    }
  }

  /**
   * Convert step sequencer pattern to 1D strip
   * Generic frame: 6 tracks × 16 steps
   * Device: Variable LED count (e.g., 90 LEDs)
   */
  private convertTo1DStrip(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray,
    device: WLEDDevice
  ): void {
    const ledCount = device.capabilities.ledCount;
    const tracks = 6;
    const ledsPerTrack = Math.floor(ledCount / tracks);

    for (let track = 0; track < tracks; track++) {
      const trackStartGeneric = track * 16 * 3; // 16 steps per track
      const trackStartDevice = track * ledsPerTrack * 3;

      // Copy first N steps to device LEDs
      for (let i = 0; i < Math.min(16, ledsPerTrack); i++) {
        const srcIndex = trackStartGeneric + i * 3;
        const dstIndex = trackStartDevice + i * 3;

        if (dstIndex + 2 < deviceFrame.length) {
          deviceFrame[dstIndex] = genericFrame[srcIndex]; // R
          deviceFrame[dstIndex + 1] = genericFrame[srcIndex + 1]; // G
          deviceFrame[dstIndex + 2] = genericFrame[srcIndex + 2]; // B
        }
      }
    }
  }

  /**
   * Apply serpentine wiring (every other row reversed)
   */
  private applySerpentine(
    frame: Uint8ClampedArray,
    gridConfig: { width: number; height: number }
  ): void {
    const { width, height } = gridConfig;

    for (let y = 1; y < height; y += 2) {
      // Reverse odd rows
      const rowStart = y * width * 3;
      const rowEnd = rowStart + width * 3;
      const rowData = frame.slice(rowStart, rowEnd);

      for (let x = 0; x < width; x++) {
        const srcIndex = (width - 1 - x) * 3;
        const dstIndex = rowStart + x * 3;
        frame[dstIndex] = rowData[srcIndex];
        frame[dstIndex + 1] = rowData[srcIndex + 1];
        frame[dstIndex + 2] = rowData[srcIndex + 2];
      }
    }
  }

  /**
   * Apply device settings (brightness, reverse direction)
   */
  private applyDeviceSettings(
    frame: Uint8ClampedArray,
    device: WLEDDevice
  ): void {
    const brightnessScale = device.brightness / 255;

    for (let i = 0; i < frame.length; i++) {
      frame[i] = Math.floor(frame[i] * brightnessScale);
    }

    if (device.reverse_direction) {
      const reversed = new Uint8ClampedArray(frame.length);
      const pixelCount = frame.length / 3;

      for (let i = 0; i < pixelCount; i++) {
        const srcIndex = (pixelCount - 1 - i) * 3;
        const dstIndex = i * 3;
        reversed[dstIndex] = frame[srcIndex];
        reversed[dstIndex + 1] = frame[srcIndex + 1];
        reversed[dstIndex + 2] = frame[srcIndex + 2];
      }

      frame.set(reversed);
    }
  }

  /**
   * Blend overlay frames onto primary frame (additive composition)
   */
  private blendOverlays(
    primaryFrame: Uint8ClampedArray,
    overlays: OverlayFrame[]
  ): Uint8ClampedArray {
    if (overlays.length === 0) return primaryFrame;

    const blended = new Uint8ClampedArray(primaryFrame);

    for (const overlay of overlays) {
      for (let i = 0; i < blended.length; i++) {
        // Additive blending (clamped to 255)
        blended[i] = Math.min(255, blended[i] + overlay.pixelData[i]);
      }
    }

    return blended;
  }

  /**
   * Send frame to WLED device via HTTP
   */
  private async sendToWLED(
    device: WLEDDevice,
    frame: Uint8ClampedArray
  ): Promise<void> {
    if (!device.enabled) {
      return; // Skip disabled devices
    }

    // Convert RGB array to hex color array
    const hexColors: string[] = [];
    for (let i = 0; i < frame.length; i += 3) {
      const r = frame[i].toString(16).padStart(2, '0');
      const g = frame[i + 1].toString(16).padStart(2, '0');
      const b = frame[i + 2].toString(16).padStart(2, '0');
      hexColors.push(r + g + b);
    }

    // WLED JSON API endpoint
    const url = `http://${device.ip}/json/state`;
    const payload = {
      on: true,
      bri: device.brightness,
      seg: [
        {
          i: hexColors, // Individual LED colors
        },
      ],
    };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(1000), // 1 second timeout
      });
    } catch (error) {
      console.error(
        `[LEDCompositor] Failed to send frame to ${device.name}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Placeholder converters (implement as needed)
   */
  private convertPianoKeysTo1D(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray,
    _device: WLEDDevice
  ): void {
    // TODO: Map 88 piano keys to device LED count
    this.convertGeneric(genericFrame, deviceFrame);
  }

  private convertFretboardToGrid(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray,
    device: WLEDDevice
  ): void {
    // TODO: Map 6 strings × N frets to grid
    this.convertToGrid(genericFrame, deviceFrame, device);
  }

  private convertRipple(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray,
    _device: WLEDDevice
  ): void {
    // TODO: Implement ripple effect
    this.convertGeneric(genericFrame, deviceFrame);
  }

  private convertGeneric(
    genericFrame: Uint8ClampedArray,
    deviceFrame: Uint8ClampedArray
  ): void {
    // Direct copy or scale if size mismatch
    const scale = deviceFrame.length / genericFrame.length;

    if (scale === 1) {
      deviceFrame.set(genericFrame);
    } else {
      // Simple scaling (nearest neighbor)
      for (let i = 0; i < deviceFrame.length; i += 3) {
        const srcIndex =
          Math.floor((i / deviceFrame.length) * genericFrame.length / 3) * 3;
        deviceFrame[i] = genericFrame[srcIndex] || 0;
        deviceFrame[i + 1] = genericFrame[srcIndex + 1] || 0;
        deviceFrame[i + 2] = genericFrame[srcIndex + 2] || 0;
      }
    }
  }

  /**
   * Debug: Print frame routing table
   */
  public debugPrintFrameRouting(): void {
    if (!this.routingMatrix) {
      console.warn('[LEDCompositor] Routing matrix not initialized yet');
      return;
    }

    const assignments = this.routingMatrix.getCurrentAssignments();

    console.log('[LEDCompositor] Frame Routing Table:');
    console.log('='.repeat(80));

    if (assignments.length === 0) {
      console.log('  No routing assignments');
      console.log('='.repeat(80));
      return;
    }

    assignments.forEach((assignment: any, index: number) => {
      console.log(`\n  Device ${index + 1}: ${assignment.device.name}`);
      console.log(`  └─ Primary: ${assignment.primary.moduleId}`);
      console.log(
        `     └─ Visualization: ${assignment.primary.visualizationType}`
      );

      if (assignment.overlays.length > 0) {
        console.log(`     └─ Overlays:`);
        assignment.overlays.forEach((overlay: any) => {
          console.log(
            `        └─ ${overlay.moduleId}: ${overlay.visualizationType}`
          );
        });
      }
    });

    console.log('\n' + '='.repeat(80));
  }

  // ===== End Automatic Frame Routing =====

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
