/**
 * Browser Compatibility Detection Tests
 * Tests browser detection and compatibility checking functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserCompatibilityDetector } from '../../utils/browserCompatibility';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('BrowserCompatibilityDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset global objects to default state
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        requestMIDIAccess: vi.fn()
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(global, 'window', {
      value: { isSecureContext: true },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    BrowserCompatibilityDetector.clearCache();
  });

  describe('detect', () => {
    it('should detect Chrome with full Web MIDI support', () => {
      // Mock Chrome browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          requestMIDIAccess: vi.fn()
        },
        writable: true
      });

      Object.defineProperty(global, 'window', {
        value: { isSecureContext: true },
        writable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.browserName).toBe('chrome');
      expect(compatibility.browserVersion).toBe('91.0.4472.124');
      expect(compatibility.webMidiSupported).toBe(true);
      expect(compatibility.supportLevel).toBe('full');
      expect(compatibility.hasSecureContext).toBe(true);
      expect(compatibility.requiresHttps).toBe(false);
      expect(compatibility.limitations).toHaveLength(0);
    });

    it('should detect Edge with full Web MIDI support', () => {
      // Mock Edge browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
          requestMIDIAccess: vi.fn()
        },
        writable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.browserName).toBe('edge');
      expect(compatibility.browserVersion).toBe('91.0.864.59');
      expect(compatibility.supportLevel).toBe('full');
    });

    it('should detect Firefox with partial Web MIDI support', () => {
      // Mock Firefox browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
          requestMIDIAccess: vi.fn()
        },
        writable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.browserName).toBe('firefox');
      expect(compatibility.browserVersion).toBe('89.0');
      expect(compatibility.supportLevel).toBe('partial');
      expect(compatibility.limitations).toContain('Limited SysEx support');
    });

    it('should detect Safari with no Web MIDI support', () => {
      // Mock Safari browser - completely remove requestMIDIAccess
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
        configurable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.browserName).toBe('safari');
      expect(compatibility.browserVersion).toBe('14.1.1');
      expect(compatibility.webMidiSupported).toBe(false);
      expect(compatibility.supportLevel).toBe('none');
      expect(compatibility.limitations).toContain('Web MIDI API not supported');
    });

    it('should detect HTTPS requirement in insecure context', () => {
      // Mock Chrome in insecure context
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          requestMIDIAccess: vi.fn()
        },
        writable: true
      });

      Object.defineProperty(global, 'window', {
        value: { isSecureContext: false },
        writable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.requiresHttps).toBe(true);
      expect(compatibility.hasSecureContext).toBe(false);
      expect(compatibility.limitations).toContain('HTTPS required for Web MIDI access');
    });

    it('should handle unknown browser', () => {
      // Mock unknown browser
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Unknown Browser 1.0',
          requestMIDIAccess: undefined
        },
        writable: true
      });

      const compatibility = BrowserCompatibilityDetector.detect(false);

      expect(compatibility.browserName).toBe('unknown');
      expect(compatibility.browserVersion).toBe('');
      expect(compatibility.supportLevel).toBe('none');
    });
  });

  describe('caching', () => {
    it('should save compatibility results to localStorage', () => {
      // Mock Chrome browser with proper user agent
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          requestMIDIAccess: vi.fn()
        },
        writable: true,
        configurable: true
      });

      BrowserCompatibilityDetector.detect();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'centaurus_browser_compatibility',
        expect.stringContaining('"browserName":"chrome"')
      );
    });

    it('should load compatibility results from localStorage', () => {
      const cachedData = {
        browserName: 'chrome',
        browserVersion: '91.0',
        webMidiSupported: true,
        requiresHttps: false,
        hasSecureContext: true,
        supportLevel: 'full',
        limitations: [],
        recommendations: [],
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const compatibility = BrowserCompatibilityDetector.detect();

      expect(compatibility.browserName).toBe('chrome');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('centaurus_browser_compatibility');
    });

    it('should invalidate old cache data', () => {
      const oldCachedData = {
        browserName: 'chrome',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        userAgent: navigator.userAgent
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldCachedData));

      // Should perform fresh detection
      BrowserCompatibilityDetector.detect();

      // Should have called setItem for new data
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should invalidate cache with different user agent', () => {
      const cachedData = {
        browserName: 'chrome',
        timestamp: Date.now(),
        userAgent: 'Different User Agent'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Should perform fresh detection
      BrowserCompatibilityDetector.detect();

      // Should have called setItem for new data
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should clear cache properly', () => {
      BrowserCompatibilityDetector.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('centaurus_browser_compatibility');
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      // Mock Chrome browser for utility tests
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          requestMIDIAccess: vi.fn()
        },
        writable: true
      });

      Object.defineProperty(global, 'window', {
        value: { isSecureContext: true },
        writable: true
      });
    });

    it('should get browser profile', () => {
      const profile = BrowserCompatibilityDetector.getBrowserProfile('chrome');

      expect(profile.name).toBe('Google Chrome');
      expect(profile.supportLevel).toBe('full');
      expect(profile.downloadUrl).toContain('chrome');
    });

    it('should get supported browsers', () => {
      const supportedBrowsers = BrowserCompatibilityDetector.getSupportedBrowsers();

      expect(supportedBrowsers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Google Chrome', supportLevel: 'full' }),
          expect.objectContaining({ name: 'Microsoft Edge', supportLevel: 'full' }),
          expect.objectContaining({ name: 'Mozilla Firefox', supportLevel: 'partial' })
        ])
      );

      // Should not include Safari (no support)
      expect(supportedBrowsers.find(browser => browser.name === 'Safari')).toBeUndefined();
    });

    it('should determine if browser can use MIDI', () => {
      const canUse = BrowserCompatibilityDetector.canUseMIDI();

      expect(canUse).toBe(true);
    });

    it('should determine browser cannot use MIDI in Safari', () => {
      // Mock Safari browser - remove requestMIDIAccess completely
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
        configurable: true
      });

      BrowserCompatibilityDetector.clearCache(); // Clear cache to force fresh detection

      const canUse = BrowserCompatibilityDetector.canUseMIDI();

      expect(canUse).toBe(false);
    });

    it('should determine browser cannot use MIDI without HTTPS', () => {
      // Mock insecure context
      Object.defineProperty(global, 'window', {
        value: { isSecureContext: false },
        writable: true
      });

      BrowserCompatibilityDetector.clearCache(); // Clear cache to force fresh detection

      const canUse = BrowserCompatibilityDetector.canUseMIDI();

      expect(canUse).toBe(false);
    });

    it('should generate compatibility messages', () => {
      const message = BrowserCompatibilityDetector.getCompatibilityMessage();

      expect(message).toContain('Google Chrome');
      expect(message).toContain('supports hardware controllers');
    });

    it('should generate HTTPS required message', () => {
      // Mock Chrome in insecure context
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          requestMIDIAccess: vi.fn()
        },
        writable: true,
        configurable: true
      });

      Object.defineProperty(global, 'window', {
        value: { isSecureContext: false },
        writable: true,
        configurable: true
      });

      BrowserCompatibilityDetector.clearCache();

      const message = BrowserCompatibilityDetector.getCompatibilityMessage();

      expect(message).toContain('HTTPS required for hardware features');
    });

    it('should generate unsupported browser message', () => {
      // Mock Safari browser - remove requestMIDIAccess completely
      const mockNavigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      };

      Object.defineProperty(global, 'navigator', {
        value: mockNavigator,
        writable: true,
        configurable: true
      });

      BrowserCompatibilityDetector.clearCache();

      const message = BrowserCompatibilityDetector.getCompatibilityMessage();

      expect(message).toContain("doesn't support Web MIDI API");
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => BrowserCompatibilityDetector.detect()).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json data');

      // Should perform fresh detection without error
      expect(() => BrowserCompatibilityDetector.detect()).not.toThrow();
    });

    it('should handle localStorage clear errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Cannot clear storage');
      });

      // Should not throw error
      expect(() => BrowserCompatibilityDetector.clearCache()).not.toThrow();
    });
  });
});