/**
 * useHardware Hook Test Suite - Vitest
 * 
 * Tests for the useHardware custom hook including utilities,
 * statistics tracking, and hardware operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  HardwareController, 
  SequencerState,
  UseHardwareReturn,
  HardwareStats 
} from '../core/useHardware';
import { MockHardwareController } from './types.test';

/**
 * Mock useHardware hook for testing without React
 */
function createMockUseHardware(controllers: HardwareController[] = []): UseHardwareReturn {
  return {
    // Core context functionality
    controllers,
    registerController: vi.fn((controller: HardwareController) => {
      controllers.push(controller);
    }),
    unregisterController: vi.fn((controllerId: string) => {
      const index = controllers.findIndex(c => c.id === controllerId);
      if (index !== -1) {
        controllers.splice(index, 1);
      }
    }),
    getController: vi.fn((id: string) => controllers.find(c => c.id === id)),
    broadcastSequencerState: vi.fn((state: SequencerState) => {
      controllers
        .filter(c => c.connectionStatus === 'connected')
        .forEach(c => c.updateSequencerState(state));
    }),

    // Event handling
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),

    // Utility functions
    getConnectedControllers: vi.fn(() => controllers.filter(c => c.connectionStatus === 'connected')),
    getControllersByCapability: vi.fn((capability) => 
      controllers.filter(c => c.capabilities[capability] === true)
    ),
    connectAllControllers: vi.fn(async () => {
      const promises = controllers
        .filter(c => c.connectionStatus === 'disconnected')
        .map(c => c.connect());
      await Promise.allSettled(promises);
    }),
    disconnectAllControllers: vi.fn(async () => {
      const promises = controllers
        .filter(c => c.connectionStatus === 'connected')
        .map(c => c.disconnect());
      await Promise.allSettled(promises);
    }),

    // Statistics
    get stats(): HardwareStats {
      return {
        connectedCount: controllers.filter(c => c.connectionStatus === 'connected').length,
        disconnectedCount: controllers.filter(c => c.connectionStatus === 'disconnected').length,
        errorCount: controllers.filter(c => c.connectionStatus === 'error').length,
        totalControllers: controllers.length,
        lastEventTimestamp: performance.now(),
      };
    },
    get isAnyControllerConnected(): boolean {
      return controllers.some(c => c.connectionStatus === 'connected');
    },
  };
}

describe('useHardware Hook Interface', () => {
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    hookResult = createMockUseHardware();
  });

  it('should provide expected interface properties', () => {
    const expectedProperties = [
      'controllers', 'registerController', 'unregisterController', 'getController',
      'broadcastSequencerState', 'addEventListener', 'removeEventListener',
      'getConnectedControllers', 'getControllersByCapability',
      'connectAllControllers', 'disconnectAllControllers',
      'stats', 'isAnyControllerConnected'
    ];

    expectedProperties.forEach(prop => {
      expect(hookResult).toHaveProperty(prop);
    });
  });

  it('should provide function properties with correct types', () => {
    expect(typeof hookResult.registerController).toBe('function');
    expect(typeof hookResult.unregisterController).toBe('function');
    expect(typeof hookResult.getController).toBe('function');
    expect(typeof hookResult.broadcastSequencerState).toBe('function');
    expect(typeof hookResult.getConnectedControllers).toBe('function');
    expect(typeof hookResult.connectAllControllers).toBe('function');
    expect(typeof hookResult.disconnectAllControllers).toBe('function');
  });

  it('should provide stats object with correct structure', () => {
    const stats = hookResult.stats;
    expect(typeof stats).toBe('object');
    expect(typeof stats.connectedCount).toBe('number');
    expect(typeof stats.disconnectedCount).toBe('number');
    expect(typeof stats.errorCount).toBe('number');
    expect(typeof stats.totalControllers).toBe('number');
    expect(typeof stats.lastEventTimestamp).toBe('number');
  });

  it('should provide boolean isAnyControllerConnected', () => {
    expect(typeof hookResult.isAnyControllerConnected).toBe('boolean');
  });
});

describe('Controller Management', () => {
  let controllers: HardwareController[];
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    controllers = [];
    hookResult = createMockUseHardware(controllers);
  });

  it('should start with empty controllers array', () => {
    expect(hookResult.controllers).toHaveLength(0);
    expect(hookResult.stats.totalControllers).toBe(0);
  });

  it('should register controllers', () => {
    const controller1 = new MockHardwareController();
    const controller2 = new MockHardwareController();
    controller2.id = 'mock-controller-2';

    hookResult.registerController(controller1);
    hookResult.registerController(controller2);

    expect(controllers).toHaveLength(2);
    expect(hookResult.stats.totalControllers).toBe(2);
  });

  it('should unregister controllers', () => {
    const controller = new MockHardwareController();
    hookResult.registerController(controller);
    
    expect(controllers).toHaveLength(1);
    
    hookResult.unregisterController(controller.id);
    
    expect(controllers).toHaveLength(0);
  });

  it('should get controller by ID', () => {
    const controller = new MockHardwareController();
    hookResult.registerController(controller);

    const found = hookResult.getController(controller.id);
    expect(found).toBe(controller);

    const notFound = hookResult.getController('non-existent');
    expect(notFound).toBeUndefined();
  });
});

describe('Controller Filtering and Utilities', () => {
  let controllers: HardwareController[];
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    controllers = [];
    hookResult = createMockUseHardware(controllers);

    // Create test controllers with different states
    const controller1 = new MockHardwareController();
    controller1.connectionStatus = 'connected';
    
    const controller2 = new MockHardwareController();
    controller2.id = 'mock-controller-2';
    controller2.connectionStatus = 'disconnected';
    
    const controller3 = new MockHardwareController();
    controller3.id = 'mock-controller-3';
    controller3.connectionStatus = 'connected';
    // Modify capabilities for testing
    (controller3 as any).capabilities = {
      ...controller3.capabilities,
      hasKnobs: true,
    };

    hookResult.registerController(controller1);
    hookResult.registerController(controller2);
    hookResult.registerController(controller3);
  });

  it('should filter connected controllers', () => {
    const connectedControllers = hookResult.getConnectedControllers();
    expect(connectedControllers).toHaveLength(2);
    expect(connectedControllers.every(c => c.connectionStatus === 'connected')).toBe(true);
  });

  it('should filter controllers by capability', () => {
    const controllersWithLEDs = hookResult.getControllersByCapability('hasLEDs');
    expect(controllersWithLEDs).toHaveLength(3); // All test controllers have LEDs

    const controllersWithKnobs = hookResult.getControllersByCapability('hasKnobs');
    expect(controllersWithKnobs.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect connected controllers', () => {
    expect(hookResult.isAnyControllerConnected).toBe(true);
  });

  it('should detect no connected controllers', () => {
    // Disconnect all controllers
    controllers.forEach(c => c.connectionStatus = 'disconnected');
    
    const newHookResult = createMockUseHardware(controllers);
    expect(newHookResult.isAnyControllerConnected).toBe(false);
  });
});

describe('Bulk Operations', () => {
  let controllers: HardwareController[];
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    controllers = [];
    hookResult = createMockUseHardware(controllers);

    const controller1 = new MockHardwareController();
    const controller2 = new MockHardwareController();
    controller2.id = 'mock-controller-2';

    hookResult.registerController(controller1);
    hookResult.registerController(controller2);
  });

  it('should connect all disconnected controllers', async () => {
    expect(controllers.every(c => c.connectionStatus === 'disconnected')).toBe(true);

    await hookResult.connectAllControllers();

    expect(controllers.every(c => c.connectionStatus === 'connected')).toBe(true);
  });

  it('should disconnect all connected controllers', async () => {
    // First connect them
    await Promise.all(controllers.map(c => c.connect()));
    expect(controllers.every(c => c.connectionStatus === 'connected')).toBe(true);

    await hookResult.disconnectAllControllers();

    expect(controllers.every(c => c.connectionStatus === 'disconnected')).toBe(true);
  });
});

describe('Statistics Calculation', () => {
  let controllers: HardwareController[];
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    controllers = [];
    hookResult = createMockUseHardware(controllers);

    // Create controllers with different states
    const controller1 = new MockHardwareController();
    controller1.connectionStatus = 'connected';
    
    const controller2 = new MockHardwareController();
    controller2.id = 'mock-controller-2';
    controller2.connectionStatus = 'disconnected';
    
    const controller3 = new MockHardwareController();
    controller3.id = 'mock-controller-3';
    controller3.connectionStatus = 'error';

    hookResult.registerController(controller1);
    hookResult.registerController(controller2);
    hookResult.registerController(controller3);
  });

  it('should calculate statistics correctly', () => {
    const stats = hookResult.stats;

    expect(stats.connectedCount).toBe(1);
    expect(stats.disconnectedCount).toBe(1);
    expect(stats.errorCount).toBe(1);
    expect(stats.totalControllers).toBe(3);
    expect(typeof stats.lastEventTimestamp).toBe('number');
    expect(stats.lastEventTimestamp).toBeGreaterThan(0);
  });

  it('should update isAnyControllerConnected based on connection states', () => {
    expect(hookResult.isAnyControllerConnected).toBe(true);

    // Disconnect the connected controller
    controllers[0].connectionStatus = 'disconnected';
    const newHookResult = createMockUseHardware(controllers);
    expect(newHookResult.isAnyControllerConnected).toBe(false);
  });
});

describe('State Broadcasting', () => {
  let controllers: HardwareController[];
  let hookResult: UseHardwareReturn;

  beforeEach(() => {
    controllers = [];
    hookResult = createMockUseHardware(controllers);

    const controller1 = new MockHardwareController();
    const controller2 = new MockHardwareController();
    const controller3 = new MockHardwareController();
    
    controller2.id = 'mock-controller-2';
    controller3.id = 'mock-controller-3';
    
    // Set different connection states
    controller1.connectionStatus = 'connected';
    controller2.connectionStatus = 'disconnected';
    controller3.connectionStatus = 'connected';

    hookResult.registerController(controller1);
    hookResult.registerController(controller2);
    hookResult.registerController(controller3);
  });

  it('should broadcast state only to connected controllers', () => {
    const testState: SequencerState = {
      currentStep: 8,
      isPlaying: true,
      tempo: 140,
      pattern: [[true, false, true, false]],
      trackCount: 1,
    };

    // Spy on updateSequencerState method
    const updateSpy1 = vi.spyOn(controllers[0], 'updateSequencerState');
    const updateSpy2 = vi.spyOn(controllers[1], 'updateSequencerState');
    const updateSpy3 = vi.spyOn(controllers[2], 'updateSequencerState');

    hookResult.broadcastSequencerState(testState);

    // Only connected controllers should receive updates
    expect(updateSpy1).toHaveBeenCalledWith(testState);
    expect(updateSpy2).not.toHaveBeenCalled(); // Disconnected
    expect(updateSpy3).toHaveBeenCalledWith(testState);
  });
});