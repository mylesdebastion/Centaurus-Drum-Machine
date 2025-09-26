/**
 * Web MIDI API Wrapper Tests
 * Tests the Web MIDI API abstraction with comprehensive mocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebMIDIApiWrapper } from '../../utils/webMidiApi';

// Mock Web MIDI API
const mockMIDIAccess: Partial<WebMidi.MIDIAccess> = {
  inputs: new Map(),
  outputs: new Map(),
  onstatechange: null,
  sysexEnabled: false
};

const mockMIDIInput: Partial<WebMidi.MIDIInput> = {
  id: 'input-1',
  name: 'Test MIDI Input',
  manufacturer: 'Test Manufacturer',
  state: 'connected',
  type: 'input',
  onmidimessage: null,
  close: vi.fn(),
  open: vi.fn()
};

const mockMIDIOutput: Partial<WebMidi.MIDIOutput> = {
  id: 'output-1',
  name: 'Test MIDI Output',
  manufacturer: 'Test Manufacturer',
  state: 'connected',
  type: 'output',
  send: vi.fn(),
  clear: vi.fn(),
  close: vi.fn(),
  open: vi.fn()
};

// Mock navigator.requestMIDIAccess
const mockRequestMIDIAccess = vi.fn();

// Mock global objects in beforeEach

describe('WebMIDIApiWrapper', () => {
  let wrapper: WebMIDIApiWrapper;

  beforeEach(() => {
    // Mock global objects before each test
    Object.defineProperty(global, 'navigator', {
      value: {
        requestMIDIAccess: mockRequestMIDIAccess,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        isSecureContext: true,
        location: {
          href: 'https://localhost:3000'
        },
        setTimeout: vi.fn((fn, delay) => global.setTimeout(fn, delay)),
        clearTimeout: vi.fn((id) => global.clearTimeout(id))
      },
      writable: true,
      configurable: true
    });

    wrapper = new WebMIDIApiWrapper();
    vi.clearAllMocks();

    // Setup default mocks
    mockMIDIAccess.inputs = new Map([['input-1', mockMIDIInput as WebMidi.MIDIInput]]);
    mockMIDIAccess.outputs = new Map([['output-1', mockMIDIOutput as WebMidi.MIDIOutput]]);
    mockRequestMIDIAccess.mockResolvedValue(mockMIDIAccess);
  });

  afterEach(() => {
    wrapper.dispose();
  });

  describe('checkBrowserCompatibility', () => {
    it('should detect Chrome browser with Web MIDI support', () => {
      const compatibility = WebMIDIApiWrapper.checkBrowserCompatibility();

      expect(compatibility.browserName).toBe('chrome');
      expect(compatibility.webMidiSupported).toBe(true);
      expect(compatibility.hasSecureContext).toBe(true);
      expect(compatibility.requiresHttps).toBe(false);
    });

    it('should detect Safari browser without Web MIDI support', () => {
      // Mock Safari user agent - remove requestMIDIAccess completely
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
        configurable: true
      });

      const compatibility = WebMIDIApiWrapper.checkBrowserCompatibility();

      expect(compatibility.browserName).toBe('safari');
      expect(compatibility.webMidiSupported).toBe(false);
    });

    it('should detect HTTPS requirement in insecure context', () => {
      // Mock insecure context
      Object.defineProperty(global, 'window', {
        value: { isSecureContext: false },
        writable: true
      });

      const compatibility = WebMIDIApiWrapper.checkBrowserCompatibility();

      expect(compatibility.requiresHttps).toBe(true);
      expect(compatibility.hasSecureContext).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should successfully initialize Web MIDI API', async () => {
      const initializeSpy = vi.fn();
      wrapper.addEventListener('initialized', initializeSpy);

      await wrapper.initialize();

      expect(mockRequestMIDIAccess).toHaveBeenCalledWith({ sysex: false });
      expect(initializeSpy).toHaveBeenCalled();
    });

    it('should throw error when Web MIDI API is not supported', async () => {
      // Mock unsupported browser - remove requestMIDIAccess completely
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
        configurable: true
      });

      // Create new wrapper instance to get fresh compatibility check
      const unsupportedWrapper = new WebMIDIApiWrapper();
      await expect(unsupportedWrapper.initialize()).rejects.toThrow('Web MIDI API not supported in safari');
    });

    it('should throw error when HTTPS is required', async () => {
      // Mock insecure context
      Object.defineProperty(global, 'window', {
        value: { isSecureContext: false },
        writable: true
      });

      await expect(wrapper.initialize()).rejects.toThrow('Web MIDI API requires HTTPS or localhost');
    });

    it('should handle MIDI access request failure', async () => {
      mockRequestMIDIAccess.mockRejectedValue(new Error('Permission denied'));

      await expect(wrapper.initialize()).rejects.toThrow('Failed to initialize MIDI access');
    });
  });

  describe('device management', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should enumerate MIDI devices', () => {
      const devices = wrapper.getDevices();

      expect(devices).toHaveLength(2);
      expect(devices[0]).toMatchObject({
        id: 'input-1',
        name: 'Test MIDI Input',
        type: 'input',
        state: 'connected'
      });
      expect(devices[1]).toMatchObject({
        id: 'output-1',
        name: 'Test MIDI Output',
        type: 'output',
        state: 'connected'
      });
    });

    it('should get specific device by ID', () => {
      const device = wrapper.getDevice('input-1');

      expect(device).toMatchObject({
        id: 'input-1',
        name: 'Test MIDI Input',
        type: 'input'
      });
    });

    it('should return undefined for non-existent device', () => {
      const device = wrapper.getDevice('non-existent');

      expect(device).toBeUndefined();
    });
  });

  describe('device connection', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should successfully connect to input device', () => {
      const deviceConnectedSpy = vi.fn();
      wrapper.addEventListener('deviceConnected', deviceConnectedSpy);

      const connected = wrapper.connectToDevice('input-1');

      expect(connected).toBe(true);
      expect(deviceConnectedSpy).toHaveBeenCalled();
      expect(mockMIDIInput.onmidimessage).toBeDefined();
    });

    it('should throw error when connecting to non-existent device', () => {
      expect(() => wrapper.connectToDevice('non-existent')).toThrow('Device non-existent not found');
    });

    it('should throw error when MIDI access not initialized', () => {
      const uninitializedWrapper = new WebMIDIApiWrapper();

      expect(() => uninitializedWrapper.connectToDevice('input-1')).toThrow('MIDI access not initialized');
    });

    it('should disconnect from device', () => {
      const deviceDisconnectedSpy = vi.fn();
      wrapper.addEventListener('deviceDisconnected', deviceDisconnectedSpy);

      wrapper.connectToDevice('input-1');
      wrapper.disconnectFromDevice('input-1');

      expect(mockMIDIInput.onmidimessage).toBeNull();
      expect(deviceDisconnectedSpy).toHaveBeenCalled();
    });
  });

  describe('MIDI message handling', () => {
    beforeEach(async () => {
      await wrapper.initialize();
      wrapper.connectToDevice('input-1');
    });

    it('should parse note on message', () => {
      const messageSpy = vi.fn();
      wrapper.addEventListener('message', messageSpy);

      // Simulate note on message (C4, velocity 100)
      const mockEvent = {
        data: new Uint8Array([0x90, 60, 100]),
        timeStamp: performance.now()
      };

      // Trigger MIDI message handler
      if (mockMIDIInput.onmidimessage) {
        (mockMIDIInput.onmidimessage as any)(mockEvent);
      }

      expect(messageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'noteon',
          channel: 1,
          note: 60,
          velocity: 100
        })
      );
    });

    it('should parse note off message', () => {
      const messageSpy = vi.fn();
      wrapper.addEventListener('message', messageSpy);

      // Simulate note off message (C4, velocity 0)
      const mockEvent = {
        data: new Uint8Array([0x80, 60, 0]),
        timeStamp: performance.now()
      };

      if (mockMIDIInput.onmidimessage) {
        (mockMIDIInput.onmidimessage as any)(mockEvent);
      }

      expect(messageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'noteoff',
          channel: 1,
          note: 60,
          velocity: 0
        })
      );
    });

    it('should parse control change message', () => {
      const messageSpy = vi.fn();
      wrapper.addEventListener('message', messageSpy);

      // Simulate control change message (CC 7, value 127)
      const mockEvent = {
        data: new Uint8Array([0xB0, 7, 127]),
        timeStamp: performance.now()
      };

      if (mockMIDIInput.onmidimessage) {
        (mockMIDIInput.onmidimessage as any)(mockEvent);
      }

      expect(messageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'controlchange',
          channel: 1,
          controller: 7,
          value: 127
        })
      );
    });

    it('should handle velocity 0 as note off', () => {
      const messageSpy = vi.fn();
      wrapper.addEventListener('message', messageSpy);

      // Simulate note on with velocity 0 (should be treated as note off)
      const mockEvent = {
        data: new Uint8Array([0x90, 60, 0]),
        timeStamp: performance.now()
      };

      if (mockMIDIInput.onmidimessage) {
        (mockMIDIInput.onmidimessage as any)(mockEvent);
      }

      expect(messageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'noteoff',
          channel: 1,
          note: 60,
          velocity: 0
        })
      );
    });
  });

  describe('MIDI output', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should send MIDI message to output device', () => {
      const data = [0x90, 60, 100]; // Note on C4 velocity 100

      wrapper.sendMessage('output-1', data);

      expect(mockMIDIOutput.send).toHaveBeenCalledWith(data);
    });

    it('should throw error when sending to non-existent device', () => {
      expect(() => wrapper.sendMessage('non-existent', [0x90, 60, 100]))
        .toThrow('Output device non-existent not found');
    });

    it('should throw error when MIDI access not initialized', () => {
      const uninitializedWrapper = new WebMIDIApiWrapper();

      expect(() => uninitializedWrapper.sendMessage('output-1', [0x90, 60, 100]))
        .toThrow('MIDI access not initialized');
    });
  });

  describe('device state changes', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should handle device connection events', () => {
      const deviceAddedSpy = vi.fn();
      wrapper.addEventListener('deviceAdded', deviceAddedSpy);

      // Simulate device connection
      const newDevice = {
        ...mockMIDIInput,
        id: 'new-input',
        state: 'connected'
      };

      // Update mock access with new device
      if (mockMIDIAccess.inputs) {
        mockMIDIAccess.inputs.set('new-input', newDevice as WebMidi.MIDIInput);
      }

      // Trigger state change
      if (mockMIDIAccess.onstatechange) {
        mockMIDIAccess.onstatechange({
          port: newDevice
        } as WebMidi.MIDIConnectionEvent);
      }

      expect(deviceAddedSpy).toHaveBeenCalled();
    });

    it('should handle device disconnection events', () => {
      const deviceRemovedSpy = vi.fn();
      wrapper.addEventListener('deviceRemoved', deviceRemovedSpy);

      // Simulate device disconnection
      const disconnectedDevice = {
        ...mockMIDIInput,
        state: 'disconnected'
      };

      // Trigger state change
      if (mockMIDIAccess.onstatechange) {
        mockMIDIAccess.onstatechange({
          port: disconnectedDevice
        } as WebMidi.MIDIConnectionEvent);
      }

      expect(deviceRemovedSpy).toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('should add and remove event listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      wrapper.addEventListener('initialized', callback1);
      wrapper.addEventListener('initialized', callback2);

      // Should not call removed listener
      wrapper.removeEventListener('initialized', callback1);

      // Trigger event
      (wrapper as any).emit('initialized');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should dispose resources properly', async () => {
      await wrapper.initialize();

      wrapper.dispose();

      // Should clear all internal state
      expect(wrapper.getDevices()).toHaveLength(0);
    });
  });
});