/**
 * Browser Compatibility Detection
 * Detects Web MIDI API support and provides browser-specific guidance
 */

export interface CompatibilityInfo {
  webMidiSupported: boolean;
  browserName: string;
  browserVersion: string;
  requiresHttps: boolean;
  hasSecureContext: boolean;
  supportLevel: 'full' | 'partial' | 'none';
  limitations: string[];
  recommendations: string[];
}

export interface BrowserProfile {
  name: string;
  supportLevel: 'full' | 'partial' | 'none';
  limitations: string[];
  recommendations: string[];
  downloadUrl?: string;
}

const BROWSER_PROFILES: Record<string, BrowserProfile> = {
  chrome: {
    name: 'Google Chrome',
    supportLevel: 'full',
    limitations: [],
    recommendations: ['Recommended browser for hardware integration'],
    downloadUrl: 'https://www.google.com/chrome/'
  },
  edge: {
    name: 'Microsoft Edge',
    supportLevel: 'full',
    limitations: [],
    recommendations: ['Full Web MIDI API support available'],
    downloadUrl: 'https://www.microsoft.com/edge'
  },
  firefox: {
    name: 'Mozilla Firefox',
    supportLevel: 'partial',
    limitations: [
      'Limited SysEx support',
      'Some advanced MIDI features may not work'
    ],
    recommendations: [
      'Basic MIDI functionality available',
      'Consider Chrome/Edge for full hardware features'
    ],
    downloadUrl: 'https://www.mozilla.org/firefox/'
  },
  safari: {
    name: 'Safari',
    supportLevel: 'none',
    limitations: [
      'Web MIDI API not supported',
      'Hardware controllers cannot connect'
    ],
    recommendations: [
      'Use Chrome, Firefox, or Edge for hardware support',
      'Safari users can still use software features'
    ],
    downloadUrl: 'https://www.google.com/chrome/'
  },
  unknown: {
    name: 'Unknown Browser',
    supportLevel: 'none',
    limitations: ['Browser compatibility unknown'],
    recommendations: ['Use Chrome or Edge for guaranteed hardware support']
  }
};

const STORAGE_KEY = 'centaurus_browser_compatibility';

export class BrowserCompatibilityDetector {
  private static cachedResult: CompatibilityInfo | null = null;

  /**
   * Detect current browser compatibility with caching
   */
  static detect(useCache = true): CompatibilityInfo {
    if (useCache && this.cachedResult) {
      return this.cachedResult;
    }

    // Try to load from localStorage first
    if (useCache) {
      const stored = this.loadFromStorage();
      if (stored) {
        this.cachedResult = stored;
        return stored;
      }
    }

    const result = this.performDetection();

    if (useCache) {
      this.cachedResult = result;
      this.saveToStorage(result);
    }

    return result;
  }

  /**
   * Force fresh detection (bypass cache)
   */
  static detectFresh(): CompatibilityInfo {
    return this.detect(false);
  }

  /**
   * Get browser-specific profile information
   */
  static getBrowserProfile(browserName: string): BrowserProfile {
    return BROWSER_PROFILES[browserName] || BROWSER_PROFILES.unknown;
  }

  /**
   * Get all supported browser profiles
   */
  static getSupportedBrowsers(): BrowserProfile[] {
    return Object.values(BROWSER_PROFILES).filter(profile =>
      profile.supportLevel !== 'none'
    );
  }

  /**
   * Check if current environment can use Web MIDI
   */
  static canUseMIDI(): boolean {
    const compatibility = this.detect();
    return compatibility.webMidiSupported &&
           compatibility.hasSecureContext &&
           compatibility.supportLevel !== 'none';
  }

  /**
   * Get user-friendly compatibility message
   */
  static getCompatibilityMessage(): string {
    const compatibility = this.detect();
    const profile = this.getBrowserProfile(compatibility.browserName);

    if (compatibility.supportLevel === 'full') {
      return `✅ ${profile.name} fully supports hardware controllers`;
    } else if (compatibility.supportLevel === 'partial') {
      return `⚠️ ${profile.name} has limited hardware support`;
    } else if (!compatibility.webMidiSupported) {
      return `❌ ${profile.name} doesn't support Web MIDI API`;
    } else if (compatibility.requiresHttps) {
      return `🔒 HTTPS required for hardware features`;
    } else {
      return `❓ Hardware support unknown in current browser`;
    }
  }

  /**
   * Perform actual browser detection
   */
  private static performDetection(): CompatibilityInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasSecureContext = window.isSecureContext;
    const webMidiSupported = 'requestMIDIAccess' in navigator;

    // Browser detection with version extraction
    let browserName = 'unknown';
    let browserVersion = '';

    const chromeMatch = userAgent.match(/chrome\/([0-9.]+)/);
    const firefoxMatch = userAgent.match(/firefox\/([0-9.]+)/);
    const safariMatch = userAgent.match(/version\/([0-9.]+).*safari/);
    const edgeMatch = userAgent.match(/edg\/([0-9.]+)/);

    if (edgeMatch) {
      browserName = 'edge';
      browserVersion = edgeMatch[1];
    } else if (chromeMatch) {
      browserName = 'chrome';
      browserVersion = chromeMatch[1];
    } else if (firefoxMatch) {
      browserName = 'firefox';
      browserVersion = firefoxMatch[1];
    } else if (safariMatch && !userAgent.includes('chrome')) {
      browserName = 'safari';
      browserVersion = safariMatch[1];
    }

    const profile = this.getBrowserProfile(browserName);
    const requiresHttps = webMidiSupported && !hasSecureContext;

    return {
      webMidiSupported,
      browserName,
      browserVersion,
      requiresHttps,
      hasSecureContext,
      supportLevel: requiresHttps ? 'none' : (webMidiSupported ? profile.supportLevel : 'none'),
      limitations: requiresHttps
        ? [...profile.limitations, 'HTTPS required for Web MIDI access']
        : profile.limitations,
      recommendations: profile.recommendations
    };
  }

  /**
   * Save compatibility info to localStorage
   */
  private static saveToStorage(compatibility: CompatibilityInfo): void {
    try {
      const data = {
        ...compatibility,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[BrowserCompatibility] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load compatibility info from localStorage
   */
  private static loadFromStorage(): CompatibilityInfo | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Check if cached data is still valid (same user agent, not too old)
      const isValid = data.userAgent === navigator.userAgent &&
                     data.timestamp &&
                     (Date.now() - data.timestamp < 24 * 60 * 60 * 1000); // 24 hours

      if (!isValid) return null;

      // Remove metadata fields
      const { timestamp, userAgent, ...compatibility } = data;
      return compatibility as CompatibilityInfo;

    } catch (error) {
      console.warn('[BrowserCompatibility] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear cached compatibility data
   */
  static clearCache(): void {
    this.cachedResult = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[BrowserCompatibility] Failed to clear localStorage:', error);
    }
  }
}

// Convenience exports
export const detectBrowserCompatibility = BrowserCompatibilityDetector.detect;
export const canUseMIDI = BrowserCompatibilityDetector.canUseMIDI;
export const getCompatibilityMessage = BrowserCompatibilityDetector.getCompatibilityMessage;