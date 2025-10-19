/**
 * Authentication Type Definitions
 * Story 18.0: Low-Friction User Authentication
 * Epic 18 - Intelligent WLED Visualization Routing
 */

import { User } from '@supabase/supabase-js';

/**
 * User profile data from user_profiles table
 */
export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

/**
 * Auth error types
 */
export type AuthErrorType =
  | 'email-already-exists'
  | 'invalid-credentials'
  | 'network-error'
  | 'session-expired'
  | 'email-not-confirmed'
  | 'unknown';

/**
 * Auth error with user-friendly message
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: any;
}

/**
 * Auth state returned by useAuth hook
 */
export interface AuthState {
  /** Current authenticated user (null if anonymous) */
  user: User | null;
  /** User profile from database (null if anonymous or not yet loaded) */
  profile: UserProfile | null;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** True if user is anonymous (not authenticated) */
  isAnonymous: boolean;
  /** True while checking auth state on mount */
  loading: boolean;
}

/**
 * Auth actions returned by useAuth hook
 */
export interface AuthActions {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  /** Sign up with email, password, and optional username */
  signUp: (email: string, password: string, username?: string) => Promise<{ data: any; error: AuthError | null }>;
  /** Send magic link to email (passwordless) */
  signInWithMagicLink: (email: string) => Promise<{ data: any; error: AuthError | null }>;
  /** Sign out current user */
  signOut: () => Promise<{ error: AuthError | null }>;
  /** Refresh user profile from database */
  refreshProfile: () => Promise<void>;
  /** Update user profile (username, etc.) */
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AuthError | null }>;
}

/**
 * Complete useAuth hook return type
 */
export type UseAuthReturn = AuthState & AuthActions;

/**
 * Feature names that require authentication
 */
export type AuthRequiredFeature =
  | 'wled-registry'
  | 'presets'
  | 'apc40-hardware'
  | 'cloud-sync';

/**
 * Feature gate metadata
 */
export interface FeatureGate {
  feature: AuthRequiredFeature;
  displayName: string;
  description: string;
  requiresAuth: boolean;
}

/**
 * Feature gates configuration
 */
export const FEATURE_GATES: Record<AuthRequiredFeature, FeatureGate> = {
  'wled-registry': {
    feature: 'wled-registry',
    displayName: 'Save WLED Devices',
    description: 'Access your LED devices from any browser',
    requiresAuth: true,
  },
  'presets': {
    feature: 'presets',
    displayName: 'Save Presets',
    description: 'Store your patterns and configurations in the cloud',
    requiresAuth: true,
  },
  'apc40-hardware': {
    feature: 'apc40-hardware',
    displayName: 'APC40 Hardware Access',
    description: 'Connect professional MIDI controllers',
    requiresAuth: true,
  },
  'cloud-sync': {
    feature: 'cloud-sync',
    displayName: 'Cloud Sync',
    description: 'Sync your settings across all devices',
    requiresAuth: true,
  },
};

/**
 * Check if a feature requires authentication
 */
export function requiresAuth(feature: AuthRequiredFeature): boolean {
  return FEATURE_GATES[feature].requiresAuth;
}

/**
 * Get feature gate metadata
 */
export function getFeatureGate(feature: AuthRequiredFeature): FeatureGate {
  return FEATURE_GATES[feature];
}
