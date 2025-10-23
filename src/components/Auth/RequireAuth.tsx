/**
 * RequireAuth Component
 * Story 18.0: Low-Friction User Authentication
 * Epic 18 - Intelligent WLED Visualization Routing
 *
 * Feature gating wrapper with "Invisible Until Needed" pattern:
 * - Shows blurred preview of feature BEFORE asking for account
 * - Value-first messaging (show what's behind the gate)
 * - Seamless integration with AuthModal
 *
 * Usage:
 * ```tsx
 * <RequireAuth
 *   feature="Save WLED Devices"
 *   featureDescription="Access your devices from any browser"
 * >
 *   <WLEDDeviceManager />
 * </RequireAuth>
 * ```
 */

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { AuthModal } from './AuthModal';

export interface RequireAuthProps {
  /** Child components to gate behind auth */
  children: React.ReactNode;
  /** Feature display name (e.g., "Save WLED Devices") */
  feature: string;
  /** Feature value proposition (e.g., "Access your devices from any browser") */
  featureDescription: string;
  /** Optional callback when user successfully authenticates */
  onAuthenticated?: () => void;
}

/**
 * Feature gate component - requires authentication to access child components
 * Shows blurred preview and value proposition before prompting for account creation
 *
 * Follows "Invisible Until Needed" UX philosophy from Story 18.0
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  feature,
  featureDescription,
  onAuthenticated,
}) => {
  const { auth } = useGlobalMusic();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If authenticated, show feature without gate
  if (auth.isAuthenticated) {
    return <>{children}</>;
  }

  // If still loading auth state, show nothing (prevents flash of gate UI)
  if (auth.loading) {
    return null;
  }

  // Anonymous user - show blurred preview + gate
  return (
    <div className="relative min-h-[400px]">
      {/* Blurred Preview - Show value BEFORE friction */}
      <div className="filter blur-md pointer-events-none opacity-30 select-none">
        {children}
      </div>

      {/* Overlay with Value Proposition */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full p-8 m-4">

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary-400" />
          </div>

          {/* Heading */}
          <h3 className="text-2xl font-semibold text-white text-center mb-2">
            {feature}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-center mb-6">
            {featureDescription}
          </p>

          {/* Call-to-Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium"
            >
              Create Free Account
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full text-sm text-primary-400 hover:text-primary-300 transition-colors py-2"
            >
              Already have an account? Sign In
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-gray-500 text-center mt-6">
            No credit card required. Free forever.
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          if (onAuthenticated) {
            onAuthenticated();
          }
        }}
        onCancel={() => setShowAuthModal(false)}
        feature={feature}
      />
    </div>
  );
};
