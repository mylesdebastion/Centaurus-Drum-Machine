import React from 'react';
import { Crown, Mic, MicOff, Volume2, UserX } from 'lucide-react';
import { User } from '../../types';

interface UserListProps {
  users: User[];
  currentUserId: string;
  onUserKick?: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUserId,
  onUserKick
}) => {
  const currentUser = users.find(user => user.id === currentUserId);
  const isHost = currentUser?.isHost || false;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>Participants</span>
        <span className="text-sm text-gray-400">({users.length})</span>
      </h3>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {user.name}
                    {user.id === currentUserId && ' (You)'}
                  </span>
                  {user.isHost && (
                    <Crown className="w-4 h-4 text-yellow-400" title="Host" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Volume2 className="w-3 h-3" />
                  <span>Playing drums</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mic Status */}
              <button className="p-1 text-gray-400 hover:text-white transition-colors">
                <Mic className="w-4 h-4" />
              </button>

              {/* Kick User (Host only) */}
              {isHost && user.id !== currentUserId && onUserKick && (
                <button
                  onClick={() => onUserKick(user.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Remove user"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Link */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-2">Invite others:</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={`${window.location.origin}/join/${users[0]?.id || 'ABC123'}`}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${users[0]?.id || 'ABC123'}`);
            }}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};