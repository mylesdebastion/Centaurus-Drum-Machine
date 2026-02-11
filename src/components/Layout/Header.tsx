import React from 'react';
import { Music, Settings, Users, Wifi, WifiOff } from 'lucide-react';
// Temporarily disabled to fix flash cards error
// import { HardwareStatusIndicator } from '../../hardware/ui/HardwareStatusIndicator';

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
    <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
            <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Audiolux Jam Session</h1>
            <h1 className="text-lg font-bold sm:hidden">Audiolux Jam</h1>
          </div>
          
          {sessionCode && (
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 px-2 sm:px-3 py-1 rounded-lg">
              <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">Room:</span>
              <span className="font-mono text-primary-400 font-semibold text-sm">{sessionCode}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Network Connection Status */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            )}
            <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Hardware Status */}
          {/* Temporarily disabled to fix flash cards error */}
          {/* <div className="relative">
            <HardwareStatusIndicator
              showDeviceInfo={true}
              showCompatibilityInfo={true}
              className="hidden sm:block"
            />
          </div> */}

          <div className="flex items-center gap-1 sm:gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-300">{userCount}</span>
          </div>

          <button
            onClick={onSettingsClick}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors touch-target"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
};