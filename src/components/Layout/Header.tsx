import React from 'react';
import { Music, Settings, Users, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  sessionCode?: string;
  userCount?: number;
  isConnected: boolean;
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessionCode,
  userCount = 0,
  isConnected,
  onSettingsClick
}) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary-500" />
            <h1 className="text-xl font-bold">ESP32 Jam Session</h1>
          </div>
          
          {sessionCode && (
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-sm text-gray-300">Room:</span>
              <span className="font-mono text-primary-400 font-semibold">{sessionCode}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-300">{userCount}</span>
          </div>

          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
};