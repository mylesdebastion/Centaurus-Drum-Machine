/**
 * PixelBoop Viewer
 * Web viewer for remote PixelBoop jam sessions
 * Read-only mode that syncs with iOS host via Supabase Realtime
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PixelBoopSequencer } from './PixelBoopSequencer';
import { ArrowLeft, Wifi, WifiOff, Users } from 'lucide-react';

export function PixelBoopViewer() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount] = useState(0);

  // Validate room code format
  if (!roomCode || !/^[A-Z0-9]{6}$/.test(roomCode)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Room Code</h1>
          <p className="text-gray-400 mb-6">
            Room code must be 6 alphanumeric characters (e.g., ABC123)
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Exit</span>
          </button>

          {/* Room Info */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-yellow-400 font-medium">Connecting...</span>
                </>
              )}
            </div>

            {/* Participant Count */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">
                  {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
                </span>
              </div>
            )}

            {/* Room Code */}
            <div className="bg-gray-700 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Room</span>
              <span className="ml-2 text-sm font-mono text-white font-bold">{roomCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PixelBoop Sequencer (Viewer Mode) */}
      <PixelBoopSequencer
        onBack={() => navigate('/')}
        viewerMode={true}
        roomCode={roomCode}
        onSessionReady={() => {
          console.log('[PixelBoopViewer] Session ready');
          setIsConnected(true);
        }}
      />
    </div>
  );
}
