/**
 * Auth Test Component
 * Quick demo to test authentication system
 * Navigate to this component to test auth flows
 */

import React, { useState } from 'react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { AuthModal, RequireAuth } from '@/components/Auth';
import { User, LogOut, CheckCircle, XCircle } from 'lucide-react';

export const AuthTest: React.FC = () => {
  const { auth } = useGlobalMusic();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Auth System Test Page
          </h1>
          <p className="text-gray-400">
            Story 18.0: Low-Friction User Authentication
          </p>
        </div>

        {/* Auth Status Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Authentication Status
          </h2>

          <div className="space-y-3">
            {/* Loading State */}
            {auth.loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading auth state...</span>
              </div>
            )}

            {/* Authenticated State */}
            {!auth.loading && auth.isAuthenticated && (
              <>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Authenticated</span>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{auth.user?.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white ml-2">{auth.profile?.username || 'Loading...'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white ml-2 font-mono text-xs">{auth.user?.id}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white ml-2">
                      {auth.profile?.created_at
                        ? new Date(auth.profile.created_at).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Anonymous State */}
            {!auth.loading && !auth.isAuthenticated && (
              <div className="flex items-center gap-2 text-yellow-400">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Anonymous (Not signed in)</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Test Actions
          </h2>

          <div className="space-y-3">
            {/* Show Auth Modal Button */}
            {!auth.isAuthenticated && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium"
              >
                Open Auth Modal (Sign In / Sign Up)
              </button>
            )}

            {/* Sign Out Button */}
            {auth.isAuthenticated && (
              <button
                onClick={() => {
                  // Clear Supabase session
                  import('@/lib/supabase').then(({ supabase }) => {
                    supabase.auth.signOut().then(() => {
                      window.location.reload();
                    });
                  });
                }}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}

            {/* Open DevTools Console */}
            <button
              onClick={() => {
                console.log('=== AUTH STATE DEBUG ===');
                console.log('User:', auth.user);
                console.log('Profile:', auth.profile);
                console.log('Is Authenticated:', auth.isAuthenticated);
                console.log('Loading:', auth.loading);
                console.log('=========================');
                alert('Auth state logged to console. Press F12 to view.');
              }}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Log Auth State to Console
            </button>
          </div>
        </div>

        {/* RequireAuth Demo */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            RequireAuth Component Demo
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            This component is wrapped with RequireAuth. Anonymous users see a blurred preview + gate.
          </p>

          <RequireAuth
            feature="Test Protected Feature"
            featureDescription="This is a demo of the RequireAuth wrapper with blurred preview pattern"
          >
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
              <h3 className="text-green-400 font-semibold mb-2">
                ✅ Success! You're authenticated!
              </h3>
              <p className="text-gray-300 text-sm">
                This content is only visible to authenticated users. The RequireAuth wrapper
                showed a blurred preview + gate to anonymous users.
              </p>
              <div className="mt-4 bg-gray-900 rounded p-4">
                <p className="text-xs text-gray-400 mb-2">Sample protected data:</p>
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify({
                    userId: auth.user?.id?.substring(0, 8) + '...',
                    username: auth.profile?.username,
                    accessLevel: 'authenticated'
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </RequireAuth>
        </div>

        {/* Testing Instructions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Testing Instructions
          </h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-2">Test 1: Sign Up Flow</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Click "Open Auth Modal" button above</li>
                <li>Switch to "Email/Password" tab → "Sign Up"</li>
                <li>Enter email, password, and username</li>
                <li>Submit form</li>
                <li>Check your email for Supabase confirmation link</li>
                <li>Click confirmation link</li>
                <li>Return to this page and see your authenticated state</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Test 2: Magic Link (PRIMARY)</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Sign out (reload page in incognito mode)</li>
                <li>Click "Open Auth Modal" button</li>
                <li>Default "Magic Link" tab should be selected</li>
                <li>Enter your email</li>
                <li>Check email for magic link</li>
                <li>Click magic link → automatically signed in</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Test 3: Sign In Flow</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Sign out (reload page in incognito mode)</li>
                <li>Click "Open Auth Modal" button</li>
                <li>Switch to "Email/Password" tab → "Sign In"</li>
                <li>Enter email and password from Test 1</li>
                <li>See authenticated state appear</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Test 4: RequireAuth Gate</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Sign out (reload in incognito mode)</li>
                <li>Scroll to "RequireAuth Component Demo" section</li>
                <li>See blurred preview of protected content</li>
                <li>See "Create Free Account" button over blurred content</li>
                <li>Click button → AuthModal opens</li>
                <li>Sign in → gate disappears, content accessible</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Database Verification */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Database Verification (Supabase Dashboard)
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>After signing up, verify in Supabase Dashboard:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400 ml-4">
              <li>Open Supabase Dashboard → Table Editor → user_profiles</li>
              <li>See your profile row with username</li>
              <li>Run SQL query:
                <pre className="bg-gray-900 p-2 rounded mt-2 text-xs text-green-400 font-mono">
SELECT * FROM user_profiles WHERE username = 'YourUsername';
                </pre>
              </li>
              <li>Verify RLS: Try querying another user's profile (should fail)</li>
            </ol>
          </div>
        </div>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          console.log('Auth successful!');
        }}
        onCancel={() => setShowAuthModal(false)}
        feature="Test Feature"
      />
    </div>
  );
};
