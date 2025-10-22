/**
 * UsernameModal Component
 * Prompts user for display name before creating/joining a jam session
 * Story 7.3 - JamSession UI Integration
 */

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface UsernameModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Callback when user saves username */
  onSave: (username: string) => void;
  /** Optional callback when user cancels (ESC key) */
  onCancel?: () => void;
}

const USERNAME_STORAGE_KEY = 'jam-username';

/**
 * Generate default username: "User" + random 4-digit number
 * @example "User1234", "User5678"
 */
function generateDefaultUsername(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `User${randomNum}`;
}

/**
 * Username prompt modal for jam sessions
 * Stores username in localStorage for future sessions
 */
export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  onSave,
  onCancel,
}) => {
  const [username, setUsername] = useState('');

  // Load saved username from localStorage on mount
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

  const handleSave = () => {
    const finalUsername = username.trim() || generateDefaultUsername();

    // Store in localStorage for future sessions
    localStorage.setItem(USERNAME_STORAGE_KEY, finalUsername);

    onSave(finalUsername);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                What's your name?
              </h2>
              <p className="text-sm text-gray-400">
                Others will see this in the session
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="mb-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              autoFocus
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-2">
              Leave blank for random name (e.g., "User1234")
            </p>
          </div>

          {/* Actions */}
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
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Helper function to get stored username from localStorage
 * @returns Stored username or null if not set
 */
export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_STORAGE_KEY);
}

/**
 * Helper function to clear stored username
 * Useful for testing or logout scenarios
 */
export function clearStoredUsername(): void {
  localStorage.removeItem(USERNAME_STORAGE_KEY);
}
