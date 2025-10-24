/**
 * Feature Flags System
 *
 * Provides runtime feature toggles for experimental features, gradual rollouts,
 * and A/B testing. Feature flags allow isolating experimental code without
 * creating feature branches.
 *
 * **Usage**:
 * ```typescript
 * import { useFeatureFlags } from '@/utils/featureFlags';
 *
 * function MyComponent() {
 *   const { monetization, aiAssistant } = useFeatureFlags();
 *
 *   return (
 *     <>
 *       {monetization.enabled && <PaywallBanner />}
 *       {aiAssistant.enabled && <AIChat />}
 *     </>
 *   );
 * }
 * ```
 *
 * **Configuration**:
 * - Development: Set flags in `.env.local`
 * - Production: Set via Vercel environment variables
 *
 * **Related**: docs/architecture/breaking-change-policy.md (Feature Flag Strategy)
 */

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  /** Is feature enabled? */
  enabled: boolean;

  /** Feature name (for logging) */
  name: string;

  /** Feature description */
  description: string;

  /** Optional: Rollout percentage (0-100) */
  rollout?: number;
}

/**
 * All available feature flags
 */
export interface FeatureFlags {
  /** Monetization features (paywalls, subscriptions) */
  monetization: FeatureFlag;

  /** AI assistant integration */
  aiAssistant: FeatureFlag;

  /** Advanced MIDI routing (Epic 15+) */
  advancedMidiRouting: FeatureFlag;

  /** Experimental visualization modes */
  experimentalVisualizations: FeatureFlag;

  /** Real-time collaboration v2 (enhanced Jam Sessions) */
  collaborationV2: FeatureFlag;

  /** Cloud save/sync features */
  cloudSync: FeatureFlag;

  /** Analytics and telemetry */
  analytics: FeatureFlag;

  /** Beta features preview */
  betaFeatures: FeatureFlag;
}

/**
 * Environment variable to boolean
 */
function envToBool(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Environment variable to number
 */
function envToNumber(value: string | undefined, defaultValue: number = 0): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get feature flags from environment variables
 *
 * Environment variables are prefixed with VITE_ to be exposed to the client
 * Example: VITE_FEATURE_MONETIZATION=true
 */
function getFeatureFlags(): FeatureFlags {
  return {
    monetization: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_MONETIZATION),
      name: 'Monetization',
      description: 'Premium features, paywalls, and subscription system',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_MONETIZATION_ROLLOUT, 0),
    },

    aiAssistant: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_AI_ASSISTANT),
      name: 'AI Assistant',
      description: 'AI-powered composition and music theory assistance',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_AI_ASSISTANT_ROLLOUT, 0),
    },

    advancedMidiRouting: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_ADVANCED_MIDI_ROUTING, true), // Default ON
      name: 'Advanced MIDI Routing',
      description: 'Inter-module MIDI communication and routing matrix',
      rollout: 100, // Fully rolled out
    },

    experimentalVisualizations: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_EXPERIMENTAL_VIZ),
      name: 'Experimental Visualizations',
      description: 'New LED visualization modes and effects',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_EXPERIMENTAL_VIZ_ROLLOUT, 0),
    },

    collaborationV2: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_COLLABORATION_V2),
      name: 'Collaboration V2',
      description: 'Enhanced real-time collaboration with voice chat',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_COLLABORATION_V2_ROLLOUT, 0),
    },

    cloudSync: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_CLOUD_SYNC),
      name: 'Cloud Sync',
      description: 'Save patterns and settings to cloud storage',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_CLOUD_SYNC_ROLLOUT, 0),
    },

    analytics: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_ANALYTICS, true), // Default ON
      name: 'Analytics',
      description: 'Usage analytics and performance monitoring',
      rollout: 100, // Fully rolled out (Vercel Analytics)
    },

    betaFeatures: {
      enabled: envToBool(import.meta.env.VITE_FEATURE_BETA),
      name: 'Beta Features',
      description: 'Early access to upcoming features',
      rollout: envToNumber(import.meta.env.VITE_FEATURE_BETA_ROLLOUT, 0),
    },
  };
}

/**
 * Cached feature flags (evaluated once at startup)
 */
let cachedFlags: FeatureFlags | null = null;

/**
 * Get feature flags (singleton)
 */
export function useFeatureFlags(): FeatureFlags {
  if (cachedFlags === null) {
    cachedFlags = getFeatureFlags();

    // Log enabled features in development
    if (import.meta.env.DEV) {
      const enabled = Object.entries(cachedFlags)
        .filter(([_, flag]) => flag.enabled)
        .map(([key, flag]) => `${flag.name} (${key})`);

      if (enabled.length > 0) {
        console.log(
          '%c[Feature Flags] Enabled:',
          'color: #10b981; font-weight: bold',
          enabled.join(', ')
        );
      }
    }
  }

  return cachedFlags;
}

/**
 * Check if specific feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('monetization')) {
 *   showPaywall();
 * }
 * ```
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[feature].enabled;
}

/**
 * Check if user is in feature rollout
 *
 * Uses deterministic hash of user ID to ensure consistent experience
 * Returns true if user should see the feature based on rollout percentage
 *
 * @param feature - Feature key
 * @param userId - User ID (for consistent assignment)
 * @returns true if user is in rollout percentage
 *
 * @example
 * ```typescript
 * if (isInFeatureRollout('betaFeatures', currentUser.id)) {
 *   showBetaFeatures();
 * }
 * ```
 */
export function isInFeatureRollout(feature: keyof FeatureFlags, userId: string): boolean {
  const flags = useFeatureFlags();
  const flag = flags[feature];

  // If not enabled at all, return false
  if (!flag.enabled) return false;

  // If no rollout percentage, default to enabled
  if (flag.rollout === undefined || flag.rollout >= 100) return true;

  // If rollout is 0, return false
  if (flag.rollout <= 0) return false;

  // Deterministic hash: use simple string hash
  let hash = 0;
  const str = `${feature}-${userId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to 0-99 range
  const bucket = Math.abs(hash) % 100;

  // User is in rollout if their bucket is less than rollout percentage
  return bucket < flag.rollout;
}

/**
 * Feature flag debugging utility
 *
 * Call in browser console: window.__FEATURE_FLAGS__
 */
if (typeof window !== 'undefined') {
  (window as { __FEATURE_FLAGS__?: FeatureFlags }).__FEATURE_FLAGS__ = getFeatureFlags();
}
