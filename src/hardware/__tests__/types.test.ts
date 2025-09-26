/**
 * Hardware Types Test Suite - Vitest
 * 
 * Tests TypeScript interfaces and type definitions for the hardware
 * abstraction layer. These tests verify interface compliance and
 * type safety using Vitest framework.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ConnectionStatus,
  HardwareEventType,
  ControllerCapabilities,
  HardwareEvent,
  HardwareController,
  SequencerState,
  ControllerState,
} from '../core/types';

/**
 * Mock implementation for testing HardwareController interface compliance
 */
class MockHardwareController implements HardwareController {
  readonly id: string = 'mock-controller-1';
  readonly name: string = 'Mock Controller';
  connectionStatus: ConnectionStatus = 'disconnected';
  readonly capabilities: ControllerCapabilities = {
    hasLEDs: true,
    hasVelocityPads: true,
    hasKnobs: false,
    hasTransportControls: true,
    stepButtonCount: 16,
    trackButtonCount: 8,
  };

  private eventListeners = new Map<HardwareEventType, Set<(event: HardwareEvent) => void>>();

  async connect(): Promise<void> {
    this.connectionStatus = 'connected';
    this.sendEvent({
      type: 'connection_change',
      data: { connected: true },
    });
  }

  async disconnect(): Promise<void> {
    this.connectionStatus = 'disconnected';
    this.sendEvent({
      type: 'connection_change',
      data: { connected: false },
    });
  }

  handleError(error: Error): void {
    this.connectionStatus = 'error';
    console.error(`Mock controller error: ${error.message}`);
  }

  addEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
  }

  removeEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  sendEvent(event: Omit<HardwareEvent, 'controllerId' | 'timestamp'>): void {
    const fullEvent: HardwareEvent = {
      ...event,
      controllerId: this.id,
      timestamp: performance.now(),
    };

    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(fullEvent));
    }
  }

  updateSequencerState(state: SequencerState): void {
    // Mock implementation - would update hardware LEDs/display
    console.log(`Mock controller updating state:`, {
      step: state.currentStep,
      playing: state.isPlaying,
      tempo: state.tempo,
    });
  }

  getState(): ControllerState {
    return {
      connected: this.connectionStatus === 'connected',
      lastUpdate: performance.now(),
      data: {
        mockValue: true,
        connectionAttempts: 1,
      },
    };
  }
}

describe('Hardware Types and Interfaces', () => {
  describe('ConnectionStatus Type', () => {
    it('should accept valid connection statuses', () => {
      const validStatuses: ConnectionStatus[] = ['connected', 'disconnected', 'error'];
      
      validStatuses.forEach(status => {
        const statusCheck: ConnectionStatus = status;
        expect(typeof statusCheck).toBe('string');
        expect(['connected', 'disconnected', 'error']).toContain(statusCheck);
      });
    });
  });

  describe('HardwareEventType Type', () => {
    it('should accept valid hardware event types', () => {
      const validTypes: HardwareEventType[] = ['step_toggle', 'connection_change', 'hardware_input'];
      
      validTypes.forEach(type => {
        const typeCheck: HardwareEventType = type;
        expect(typeof typeCheck).toBe('string');
        expect(['step_toggle', 'connection_change', 'hardware_input']).toContain(typeCheck);
      });
    });
  });

  describe('ControllerCapabilities Interface', () => {
    it('should validate controller capabilities structure', () => {
      const capabilities: ControllerCapabilities = {
        hasLEDs: true,
        hasVelocityPads: false,
        hasKnobs: true,
        hasTransportControls: false,
        stepButtonCount: 16,
        trackButtonCount: 8,
      };

      expect(typeof capabilities.hasLEDs).toBe('boolean');
      expect(typeof capabilities.hasVelocityPads).toBe('boolean');
      expect(typeof capabilities.hasKnobs).toBe('boolean');
      expect(typeof capabilities.hasTransportControls).toBe('boolean');
      expect(typeof capabilities.stepButtonCount).toBe('number');
      expect(typeof capabilities.trackButtonCount).toBe('number');
      expect(capabilities.stepButtonCount).toBeGreaterThan(0);
      expect(capabilities.trackButtonCount).toBeGreaterThan(0);
    });
  });

  describe('HardwareEvent Interface', () => {
    it('should validate hardware event structure', () => {
      const event: HardwareEvent = {
        type: 'step_toggle',
        controllerId: 'test-controller',
        data: { step: 0, active: true },
        timestamp: performance.now(),
      };

      expect(typeof event.type).toBe('string');
      expect(['step_toggle', 'connection_change', 'hardware_input']).toContain(event.type);
      expect(typeof event.controllerId).toBe('string');
      expect(event.controllerId).toBeTruthy();
      expect(typeof event.data).toBe('object');
      expect(event.data).not.toBeNull();
      expect(typeof event.timestamp).toBe('number');
      expect(event.timestamp).toBeGreaterThan(0);
    });
  });

  describe('SequencerState Interface', () => {
    it('should validate sequencer state structure', () => {
      const state: SequencerState = {
        currentStep: 0,
        isPlaying: false,
        tempo: 120,
        pattern: [
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        ],
        trackCount: 2,
      };

      expect(typeof state.currentStep).toBe('number');
      expect(state.currentStep).toBeGreaterThanOrEqual(0);
      expect(typeof state.isPlaying).toBe('boolean');
      expect(typeof state.tempo).toBe('number');
      expect(state.tempo).toBeGreaterThan(0);
      expect(Array.isArray(state.pattern)).toBe(true);
      expect(state.pattern.length).toBeGreaterThan(0);
      expect(Array.isArray(state.pattern[0])).toBe(true);
      expect(typeof state.trackCount).toBe('number');
      expect(state.trackCount).toBe(state.pattern.length);
    });
  });

  describe('ControllerState Interface', () => {
    it('should validate controller state structure', () => {
      const state: ControllerState = {
        connected: true,
        lastUpdate: performance.now(),
        data: { customProperty: 'test' },
      };

      expect(typeof state.connected).toBe('boolean');
      expect(typeof state.lastUpdate).toBe('number');
      expect(state.lastUpdate).toBeGreaterThan(0);
      expect(typeof state.data).toBe('object');
      expect(state.data).not.toBeNull();
    });
  });
});

describe('MockHardwareController Implementation', () => {
  let controller: MockHardwareController;

  beforeEach(() => {
    controller = new MockHardwareController();
  });

  describe('HardwareController Interface Compliance', () => {
    it('should implement all required properties', () => {
      expect(typeof controller.id).toBe('string');
      expect(controller.id).toBeTruthy();
      expect(typeof controller.name).toBe('string');
      expect(controller.name).toBeTruthy();
      expect(typeof controller.capabilities).toBe('object');
      expect(['connected', 'disconnected', 'error']).toContain(controller.connectionStatus);
    });

    it('should implement all required methods', () => {
      expect(typeof controller.connect).toBe('function');
      expect(typeof controller.disconnect).toBe('function');
      expect(typeof controller.handleError).toBe('function');
      expect(typeof controller.addEventListener).toBe('function');
      expect(typeof controller.removeEventListener).toBe('function');
      expect(typeof controller.sendEvent).toBe('function');
      expect(typeof controller.updateSequencerState).toBe('function');
      expect(typeof controller.getState).toBe('function');
    });
  });

  describe('Controller Lifecycle', () => {
    it('should start in disconnected state', () => {
      expect(controller.connectionStatus).toBe('disconnected');
    });

    it('should connect and change status', async () => {
      await controller.connect();
      expect(controller.connectionStatus).toBe('connected');
    });

    it('should disconnect and change status', async () => {
      await controller.connect();
      await controller.disconnect();
      expect(controller.connectionStatus).toBe('disconnected');
    });

    it('should handle errors and change status', () => {
      const testError = new Error('Test error');
      controller.handleError(testError);
      expect(controller.connectionStatus).toBe('error');
    });
  });

  describe('Event System', () => {
    it('should add and remove event listeners', () => {
      const mockCallback = vi.fn();
      
      controller.addEventListener('step_toggle', mockCallback);
      controller.sendEvent({ type: 'step_toggle', data: { step: 0 } });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: 'step_toggle',
        controllerId: controller.id,
        data: { step: 0 },
        timestamp: expect.any(Number),
      }));

      controller.removeEventListener('step_toggle', mockCallback);
      controller.sendEvent({ type: 'step_toggle', data: { step: 1 } });
      
      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  describe('State Management', () => {
    it('should return valid controller state', () => {
      const state = controller.getState();
      
      expect(typeof state.connected).toBe('boolean');
      expect(typeof state.lastUpdate).toBe('number');
      expect(typeof state.data).toBe('object');
      expect(state.data).not.toBeNull();
    });

    it('should update sequencer state', () => {
      const mockState: SequencerState = {
        currentStep: 4,
        isPlaying: true,
        tempo: 128,
        pattern: [[true, false, true, false]],
        trackCount: 1,
      };

      // Should not throw
      expect(() => controller.updateSequencerState(mockState)).not.toThrow();
    });
  });
});

// Export mock for use in other tests
export { MockHardwareController };