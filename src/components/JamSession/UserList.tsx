/**
 * UserList Component
 * Real-time participant list for jam sessions
 * Story 7.3 - JamSession UI Integration
 */

import React from 'react';
import { Crown, User } from 'lucide-react';
import type { Participant } from '@/types/session';

interface UserListProps {
  /** Array of current participants */
  participants: Participant[];
  /** Current user's peer ID */
  myPeerId: string | null;
}

/**
 * Format relative time for join timestamps
 * @param joinedAt - ISO timestamp string
 * @returns Relative time string (e.g., "2m ago", "just now")
 */
function formatRelativeTime(joinedAt: string): string {
  const now = new Date();
  const joined = new Date(joinedAt);
  const diffMs = now.getTime() - joined.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Generate avatar color based on participant ID
 * Consistent color per user across sessions
 */
function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];

  // Hash participant ID to pick consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get first letter of name for avatar
 */
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Display real-time participant list with presence updates
 * Shows host badge, join times, and avatar initials
 */
export const UserList: React.FC<UserListProps> = ({
  participants,
  myPeerId,
}) => {
  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => {
        const isMe = participant.id === myPeerId;
        const avatarColor = getAvatarColor(participant.id);

        return (
          <div
            key={participant.id}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
              isMe
                ? 'bg-primary-900/30 border-primary-700/50'
                : 'bg-gray-800/50 border-gray-700/50'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
            >
              {getInitial(participant.name)}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isMe ? 'text-primary-200' : 'text-white'} truncate`}>
                  {participant.name}
                  {isMe && ' (You)'}
                </span>
                {participant.isHost && (
                  <div
                    className="flex items-center gap-1 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded-full"
                    title="Host"
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-200 font-medium">Host</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-0.5">
                Joined {formatRelativeTime(participant.joinedAt)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
