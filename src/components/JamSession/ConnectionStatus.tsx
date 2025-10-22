/**
 * ConnectionStatus Component
 * Visual indicator for real-time session connection status
 * Story 7.3 - JamSession UI Integration
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { ConnectionStatus as StatusType } from '@/types/session';

interface ConnectionStatusProps {
  /** Current connection status */
  status: StatusType;
  /** Optional compact mode for mobile */
  compact?: boolean;
}

/**
 * Connection status indicator with visual state feedback
 * Shows: connected (green), connecting (yellow), disconnected (red)
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  compact = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          dotColor: 'bg-green-500',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-700/50',
          textColor: 'text-green-200',
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Reconnecting...',
          dotColor: 'bg-yellow-500',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-700/50',
          textColor: 'text-yellow-200',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          dotColor: 'bg-red-500',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700/50',
          textColor: 'text-red-200',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2" title={config.text}>
        <div className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
        <IconComponent className={`w-4 h-4 ${config.textColor} ${status === 'connecting' ? 'animate-spin' : ''}`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <IconComponent className={`w-4 h-4 ${config.textColor} ${status === 'connecting' ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.textColor} hidden sm:inline`}>
        {config.text}
      </span>
    </div>
  );
};
