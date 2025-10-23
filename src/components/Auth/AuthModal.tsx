/**
 * AuthModal Component
 * Story 18.0: Low-Friction User Authentication
 * Epic 18 - Intelligent WLED Visualization Routing
 *
 * Follows EXACT pattern from UsernameModal.tsx:
 * - Backdrop + card structure
 * - Icon + header layout
 * - Input styling
 * - Button classes (.btn-primary, .btn-secondary)
 *
 * Features:
 * - Magic Link tab (primary, default) - passwordless auth
 * - Email/Password tab (secondary) - traditional auth
 * - Username migration from localStorage
 */

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const USERNAME_STORAGE_KEY = 'jam-username';

type AuthMode = 'magic-link' | 'email-password';
type AuthAction = 'sign-in' | 'sign-up';

export interface AuthModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Callback when authentication succeeds */
  onSuccess?: () => void;
  /** Callback when user cancels (ESC key or Cancel button) */
  onCancel?: () => void;
  /** Feature name for contextual messaging (e.g., "Save WLED Devices") */
  feature?: string;
}

/**
 * Authentication modal with magic link and email/password options
 * Matches UsernameModal.tsx pattern exactly
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  feature,
}) => {
  const [mode, setMode] = useState<AuthMode>('magic-link'); // Magic Link is PRIMARY
  const [action, setAction] = useState<AuthAction>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const { signIn, signUp, signInWithMagicLink } = useAuth();

  // Load saved username from localStorage on mount (for migration)
  useEffect(() => {
    const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Handle ESC key to cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  /**
   * Handle magic link authentication
   */
  const handleMagicLink = async () => {
    setLoading(true);
    setError('');

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMagicLinkSent(true);
      setLoading(false);
    }
  };

  /**
   * Handle email/password sign in
   */
  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (onSuccess) onSuccess();
    }
  };

  /**
   * Handle email/password sign up
   * Migrates localStorage username if available
   */
  const handleSignUp = async () => {
    setLoading(true);
    setError('');

    // Migrate localStorage username if available
    const localUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    const finalUsername = username || localUsername || email.split('@')[0];

    const { error } = await signUp(email, password, finalUsername);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (onSuccess) onSuccess();
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (mode === 'magic-link') {
        handleMagicLink();
      } else {
        action === 'sign-in' ? handleSignIn() : handleSignUp();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - EXACT PATTERN FROM UsernameModal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />

      {/* Modal Container - EXACT PATTERN FROM UsernameModal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full p-6">

          {/* Header - MATCH UsernameModal PATTERN */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {feature ? `Sign in to ${feature}` : 'Sign in to your account'}
              </h2>
              <p className="text-sm text-gray-400">
                {mode === 'magic-link'
                  ? 'We\'ll send you a magic link'
                  : action === 'sign-up'
                  ? 'Create your free account'
                  : 'Welcome back'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-4 p-1 bg-gray-900 rounded-lg">
            <button
              onClick={() => {
                setMode('magic-link');
                setError('');
                setMagicLinkSent(false);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'magic-link'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => {
                setMode('email-password');
                setError('');
                setMagicLinkSent(false);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'email-password'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Email/Password
            </button>
          </div>

          {/* ============================================================ */}
          {/* MAGIC LINK MODE (PRIMARY) */}
          {/* ============================================================ */}
          {mode === 'magic-link' && (
            <>
              {magicLinkSent ? (
                // Success state - magic link sent
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">Check your email!</p>
                  <p className="text-sm text-gray-400">
                    We sent a magic link to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    Click the link in the email to sign in
                  </p>
                </div>
              ) : (
                // Magic link form
                <>
                  {/* Email Input - MATCH UsernameModal INPUT PATTERN */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-4"
                    autoFocus
                  />

                  {/* Error Message */}
                  {error && (
                    <p className="text-sm text-red-400 mb-4">{error}</p>
                  )}

                  {/* Buttons - MATCH UsernameModal BUTTON PATTERN */}
                  <div className="flex gap-3">
                    {onCancel && (
                      <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleMagicLink}
                      disabled={loading || !email}
                      className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send Magic Link'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* EMAIL/PASSWORD MODE (SECONDARY) */}
          {/* ============================================================ */}
          {mode === 'email-password' && (
            <>
              {/* Sign In / Sign Up Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setAction('sign-in');
                    setError('');
                  }}
                  className={`flex-1 text-sm font-medium pb-2 border-b-2 transition-colors ${
                    action === 'sign-in'
                      ? 'border-primary-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAction('sign-up');
                    setError('');
                  }}
                  className={`flex-1 text-sm font-medium pb-2 border-b-2 transition-colors ${
                    action === 'sign-up'
                      ? 'border-primary-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Username Input (ONLY for Sign Up) */}
              {action === 'sign-up' && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Username (optional)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Leave blank to use email prefix
                  </p>
                </div>
              )}

              {/* Email Input */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-3"
                autoFocus={action === 'sign-in'}
              />

              {/* Password Input */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-4"
              />

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={action === 'sign-in' ? handleSignIn : handleSignUp}
                  disabled={loading || !email || !password}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? action === 'sign-in'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : action === 'sign-in'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </div>

              {/* Helper Text */}
              {action === 'sign-up' && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  By signing up, you'll receive a confirmation email
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
