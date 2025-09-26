/**
 * Connection Manager Tests
 * Tests connection lifecycle, retry logic, and error recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionManager } from '../../utils/connectionManager';
import type { MIDIDevice, BrowserCompatibility } from '../../utils/webMidiApi';

// Mock the webMidiApi module
vi.mock('../../utils/webMidiApi', () => ({
  WebMIDIApiWrapper: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    getDevices: vi.fn(),
    getDevice: vi.fn(),
    connectToDevice: vi.fn(),
    disconnectFromDevice: vi.fn(),
    addEventListener: vi.fn(),
    dispose: vi.fn()
  })),
  webMidiApi: {
    initialize: vi.fn(),
    getDevices: vi.fn().mockReturnValue([]),
    getDevice: vi.fn(),
    connectToDevice: vi.fn(),
    disconnectFromDevice: vi.fn(),
    addEventListener: vi.fn(),
    dispose: vi.fn(),
    constructor: {
      checkBrowserCompatibility: vi.fn().mockReturnValue({
        webMidiSupported: true,
        browserName: 'chrome',
        requiresHttps: false,
        hasSecureContext: true
      })
    }
  }
}));

// Mock the error handler
vi.mock('../../utils/errorHandler', () => ({
  hardwareErrorHandler: {
    handleConnectionError: vi.fn(),
    handleCompatibilityError: vi.fn()
  }
}));

// Import after mocking
import { webMidiApi } from '../../utils/webMidiApi';
import { hardwareErrorHandler } from '../../utils/errorHandler';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;

  const mockDevice: MIDIDevice = {
    id: 'test-device-1',
    name: 'Test MIDI Device',
    manufacturer: 'Test Manufacturer',
    type: 'input',
    state: 'connected'
  };

  const mockCompatibility: BrowserCompatibility = {
    webMidiSupported: true,
    browserName: 'chrome',
    requiresHttps: false,
    hasSecureContext: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connectionManager = new ConnectionManager({
      maxReconnectAttempts: 3,
      reconnectBaseDelay: 100,
      reconnectMaxDelay: 1000
    });

    // Setup default mock returns
    vi.mocked(webMidiApi.constructor.checkBrowserCompatibility).mockReturnValue(mockCompatibility);
    vi.mocked(webMidiApi.getDevices).mockReturnValue([mockDevice]);
    vi.mocked(webMidiApi.getDevice).mockReturnValue(mockDevice);
    vi.mocked(webMidiApi.connectToDevice).mockReturnValue(true);
    vi.mocked(webMidiApi.initialize).mockResolvedValue(undefined);
  });

  afterEach(() => {
    connectionManager.dispose();
  });

  describe('initialization', () => {
    it('should start with disconnected state', () => {
      const state = connectionManager.getState();

      expect(state.status).toBe('disconnected');
      expect(state.device).toBeNull();
      expect(state.lastError).toBeNull();
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should check browser compatibility on initialization', () => {
      expect(webMidiApi.constructor.checkBrowserCompatibility).toHaveBeenCalled();
    });

    it('should set unsupported status for incompatible browsers', () => {
      const incompatibleBrowser: BrowserCompatibility = {
        ...mockCompatibility,
        webMidiSupported: false,
        browserName: 'safari'
      };

      vi.mocked(webMidiApi.constructor.checkBrowserCompatibility).mockReturnValue(incompatibleBrowser);

      const newManager = new ConnectionManager();
      const state = newManager.getState();

      expect(state.status).toBe('unsupported');
      expect(state.lastError).toContain('Web MIDI not supported in safari');
    });

    it('should set requires_https status for insecure context', () => {
      const insecureContext: BrowserCompatibility = {
        ...mockCompatibility,
        requiresHttps: true,
        hasSecureContext: false
      };

      vi.mocked(webMidiApi.constructor.checkBrowserCompatibility).mockReturnValue(insecureContext);

      const newManager = new ConnectionManager();
      const state = newManager.getState();

      expect(state.status).toBe('requires_https');
      expect(state.lastError).toContain('Web MIDI requires HTTPS or localhost');
    });
  });

  describe('connection', () => {
    it('should successfully connect to first available device', async () => {
      const stateChangeSpy = vi.fn();
      connectionManager.addEventListener('stateChange', stateChangeSpy);

      await connectionManager.connect();

      const state = connectionManager.getState();
      expect(state.status).toBe('connected');
      expect(state.device).toEqual(mockDevice);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.lastError).toBeNull();

      expect(webMidiApi.initialize).toHaveBeenCalled();
      expect(webMidiApi.connectToDevice).toHaveBeenCalledWith('test-device-1');
      expect(stateChangeSpy).toHaveBeenCalled();
    });

    it('should connect to specific device by ID', async () => {
      const specificDevice: MIDIDevice = {
        id: 'specific-device-id',
        name: 'Specific MIDI Device',
        manufacturer: 'Test Manufacturer',
        type: 'input',
        state: 'connected'
      };

      vi.mocked(webMidiApi.getDevice).mockReturnValue(specificDevice);

      await connectionManager.connect('specific-device-id');

      expect(webMidiApi.getDevice).toHaveBeenCalledWith('specific-device-id');
      expect(webMidiApi.connectToDevice).toHaveBeenCalledWith('specific-device-id');
    });

    it('should handle no available devices', async () => {
      vi.mocked(webMidiApi.getDevices).mockReturnValue([]);

      await connectionManager.connect();

      const state = connectionManager.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toBe('No MIDI devices available');
      expect(hardwareErrorHandler.handleConnectionError).toHaveBeenCalledWith(
        'No MIDI devices available',
        expect.objectContaining({
          operation: 'Device enumeration',
          reconnectAttempt: 0
        })
      );
    });

    it('should handle connection failure', async () => {
      vi.mocked(webMidiApi.connectToDevice).mockReturnValue(false);

      await connectionManager.connect();

      const state = connectionManager.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toContain('Failed to connect to device');
    });

    it('should handle MIDI initialization error', async () => {
      vi.mocked(webMidiApi.initialize).mockRejectedValue(new Error('Permission denied'));

      await connectionManager.connect();

      const state = connectionManager.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toContain('Permission denied');
    });

    it('should not connect if browser is unsupported', async () => {
      const incompatibleBrowser: BrowserCompatibility = {
        ...mockCompatibility,
        webMidiSupported: false
      };

      vi.mocked(webMidiApi.constructor.checkBrowserCompatibility).mockReturnValue(incompatibleBrowser);

      const newManager = new ConnectionManager();
      await newManager.connect();

      const state = newManager.getState();
      expect(state.status).toBe('unsupported');
      expect(webMidiApi.initialize).not.toHaveBeenCalled();
    });
  });

  describe('disconnection', () => {
    it('should disconnect from current device', async () => {
      // First connect
      await connectionManager.connect();

      // Then disconnect
      connectionManager.disconnect();

      const state = connectionManager.getState();
      expect(state.status).toBe('disconnected');
      expect(state.device).toBeNull();
      expect(state.lastError).toBeNull();
      expect(state.reconnectAttempts).toBe(0);

      expect(webMidiApi.disconnectFromDevice).toHaveBeenCalledWith('test-device-1');
    });

    it('should handle disconnection when no device connected', () => {
      expect(() => connectionManager.disconnect()).not.toThrow();

      const state = connectionManager.getState();
      expect(state.status).toBe('disconnected');
    });
  });

  describe('retry logic', () => {
    it('should retry connection with exponential backoff', async () => {
      vi.useFakeTimers();

      // Mock connection to fail initially
      vi.mocked(webMidiApi.connectToDevice).mockReturnValue(false);

      // Initial connection attempt (should fail and schedule retry)
      const connectPromise = connectionManager.connect();
      await connectPromise;

      // Should be in error state with first retry attempt recorded
      let state = connectionManager.getState();
      expect(state.status).toBe('error');
      expect(state.reconnectAttempts).toBe(1);

      // Advance to trigger the first retry (using the correct base delay from options)
      await vi.advanceTimersByTimeAsync(100); // Base delay from test options

      // The retry should have executed, incrementing attempts
      state = connectionManager.getState();
      expect(state.reconnectAttempts).toBe(2);

      vi.useRealTimers();
    });

    it('should stop retrying after max attempts', async () => {
      vi.useFakeTimers();

      vi.mocked(webMidiApi.connectToDevice).mockReturnValue(false);

      // Initial connection attempt
      await connectionManager.connect();

      // Advance through all retry attempts
      for (let i = 0; i < 3; i++) {
        const delay = Math.min(100 * Math.pow(2, i), 1000);
        vi.advanceTimersByTime(delay);
        await vi.runAllTimersAsync();
      }

      const state = connectionManager.getState();
      expect(state.reconnectAttempts).toBe(3);

      // Should not schedule more retries
      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(state.reconnectAttempts).toBe(3); // Should not increase further

      vi.useRealTimers();
    });

    it('should reset retry count on successful connection', async () => {
      // First attempt fails
      vi.mocked(webMidiApi.connectToDevice).mockReturnValueOnce(false);
      await connectionManager.connect();

      let state = connectionManager.getState();
      expect(state.reconnectAttempts).toBe(1);

      // Manual retry succeeds
      vi.mocked(webMidiApi.connectToDevice).mockReturnValue(true);
      await connectionManager.retry();

      state = connectionManager.getState();
      expect(state.status).toBe('connected');
      expect(state.reconnectAttempts).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should handle device addition events', () => {
      // Set initial state to disconnected to trigger auto-connection
      const currentState = connectionManager.getState();
      (currentState as any).status = 'disconnected';

      // Get the callback that was registered with webMidiApi for deviceAdded
      const addEventListenerCalls = vi.mocked(webMidiApi.addEventListener).mock.calls;
      const deviceAddedCall = addEventListenerCalls.find(call => call[0] === 'deviceAdded');

      expect(deviceAddedCall).toBeDefined();

      if (deviceAddedCall) {
        const callback = deviceAddedCall[1];
        // Trigger the device added event
        callback(mockDevice);
      }

      // Should attempt auto-connection for new devices when disconnected
      expect(webMidiApi.initialize).toHaveBeenCalled();
    });

    it('should handle device removal events', () => {
      // Directly modify the internal state to simulate connected device
      const internalState = (connectionManager as any).state;
      internalState.device = mockDevice;
      internalState.status = 'connected';

      // Get the callback that was registered with webMidiApi for deviceRemoved
      const addEventListenerCalls = vi.mocked(webMidiApi.addEventListener).mock.calls;
      const deviceRemovedCall = addEventListenerCalls.find(call => call[0] === 'deviceRemoved');

      expect(deviceRemovedCall).toBeDefined();

      if (deviceRemovedCall) {
        const callback = deviceRemovedCall[1];
        // Trigger the device removed event with the same device ID
        callback(mockDevice);
      }

      // Should transition to error state and clear device
      const newState = connectionManager.getState();
      expect(newState.status).toBe('error');
      expect(newState.device).toBeNull();
      expect(newState.lastError).toContain('Device Test MIDI Device was disconnected');
    });

    it('should notify state change listeners', async () => {
      const stateChangeListener = vi.fn();
      connectionManager.addEventListener('stateChange', stateChangeListener);

      await connectionManager.connect();

      expect(stateChangeListener).toHaveBeenCalled();
      expect(stateChangeListener).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'connected',
          device: mockDevice
        })
      );
    });

    it('should remove event listeners', () => {
      const callback = vi.fn();

      connectionManager.addEventListener('stateChange', callback);
      connectionManager.removeEventListener('stateChange', callback);

      // Trigger state change
      connectionManager.disconnect();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('error handling integration', () => {
    it('should log compatibility errors', async () => {
      const incompatibleBrowser: BrowserCompatibility = {
        ...mockCompatibility,
        webMidiSupported: false,
        browserName: 'safari'
      };

      vi.mocked(webMidiApi.constructor.checkBrowserCompatibility).mockReturnValue(incompatibleBrowser);

      const newManager = new ConnectionManager();
      await newManager.connect();

      expect(hardwareErrorHandler.handleCompatibilityError).toHaveBeenCalledWith(
        expect.stringContaining('Web MIDI not supported in safari'),
        expect.objectContaining({
          browserName: 'safari',
          feature: 'Web MIDI API'
        })
      );
    });

    it('should log connection errors', async () => {
      vi.mocked(webMidiApi.initialize).mockRejectedValue(new Error('Connection failed'));

      await connectionManager.connect();

      expect(hardwareErrorHandler.handleConnectionError).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed'),
        expect.objectContaining({
          operation: 'Connection attempt'
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should dispose resources properly', () => {
      connectionManager.dispose();

      expect(webMidiApi.dispose).toHaveBeenCalled();
    });

    it('should clear reconnection timeouts on dispose', async () => {
      vi.useFakeTimers();

      // Start a connection that will fail and schedule retry
      vi.mocked(webMidiApi.connectToDevice).mockReturnValue(false);
      await connectionManager.connect();

      // Dispose should clear pending timeouts
      connectionManager.dispose();

      // Fast forward - should not trigger any more connection attempts
      vi.advanceTimersByTime(10000);

      // Connection attempts should remain at 1 (from initial attempt)
      const state = connectionManager.getState();
      expect(state.reconnectAttempts).toBe(1);

      vi.useRealTimers();
    });
  });
});