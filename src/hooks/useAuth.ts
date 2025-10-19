/**
 * useAuth Hook
 * Story 18.0: Low-Friction User Authentication
 * Epic 18 - Intelligent WLED Visualization Routing
 *
 * Provides authentication state and methods for sign in/sign up/sign out
 * Integrates with Supabase Auth and user_profiles table
 */

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UseAuthReturn, UserProfile, AuthError } from '@/types/auth';

const USERNAME_STORAGE_KEY = 'jam-username';

/**
 * Convert Supabase error to AuthError
 */
function toAuthError(error: any): AuthError {
  if (!error) return null as any;

  const message = error.message || 'An unknown error occurred';

  // Detect error type based on message
  let type: AuthError['type'] = 'unknown';
  if (message.includes('already registered')) {
    type = 'email-already-exists';
  } else if (message.includes('Invalid login credentials')) {
    type = 'invalid-credentials';
  } else if (message.includes('network')) {
    type = 'network-error';
  } else if (message.includes('Email not confirmed')) {
    type = 'email-not-confirmed';
  }

  return {
    type,
    message,
    originalError: error,
  };
}

/**
 * Authentication hook
 *
 * @returns Auth state and actions
 *
 * @example
 * ```typescript
 * const { user, isAuthenticated, signIn, signUp, signOut } = useAuth();
 *
 * // Sign up
 * const { error } = await signUp('user@example.com', 'password123', 'MyUsername');
 *
 * // Sign in
 * const { error } = await signIn('user@example.com', 'password123');
 *
 * // Sign out
 * await signOut();
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile from database
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useAuth] Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('[useAuth] Error loading profile:', error);
    }
  }, []);

  /**
   * Refresh user profile from database
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id);
  }, [user, loadProfile]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      // Load profile if authenticated
      if (session?.user) {
        loadProfile(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      // Load profile when user signs in
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: toAuthError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: toAuthError(error) };
    }
  }, []);

  /**
   * Sign up with email, password, and optional username
   * Migrates username from localStorage if not provided
   */
  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    try {
      // Migrate localStorage username if available
      const localUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
      const finalUsername = username || localUsername || email.split('@')[0];

      // Create auth user with username in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: finalUsername,
          },
        },
      });

      if (error) {
        return { data: null, error: toAuthError(error) };
      }

      // Profile will be auto-created by database trigger
      // If username was provided, update profile
      if (data.user && username && username !== localUsername) {
        await supabase
          .from('user_profiles')
          .update({ username })
          .eq('id', data.user.id);
      }

      console.log('[useAuth] User created:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: toAuthError(error) };
    }
  }, []);

  /**
   * Sign in with magic link (passwordless)
   */
  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { data: null, error: toAuthError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: toAuthError(error) };
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: toAuthError(error) };
      }

      setProfile(null);
      return { error: null };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) {
        return { error: { type: 'unknown', message: 'No user signed in' } as AuthError };
      }

      try {
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) {
          return { error: toAuthError(error) };
        }

        // Refresh profile
        await refreshProfile();

        return { error: null };
      } catch (error) {
        return { error: toAuthError(error) };
      }
    },
    [user, refreshProfile]
  );

  return {
    user,
    profile,
    isAuthenticated: !!user,
    isAnonymous: !user,
    loading,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    refreshProfile,
    updateProfile,
  };
}
