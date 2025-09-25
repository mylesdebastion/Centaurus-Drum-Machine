import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { DrumTrack } from '../../types';
import { createEmptyTrack, getAvailableInstruments } from '../../utils/drumPatterns';

interface TrackManagerProps {
  tracks: DrumTrack[];
  onAddTrack: (track: DrumTrack) => void;
  maxTracks?: number;
}

export const TrackManager: React.FC<TrackManagerProps> = ({
  tracks,
  onAddTrack,
  maxTracks = 8
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const availableInstruments = getAvailableInstruments(tracks);
  const canAddMore = tracks.length < maxTracks;

  const handleAddTrack = (instrumentId: string) => {
    try {
      const newTrack = createEmptyTrack(instrumentId);
      onAddTrack(newTrack);
      setShowAddMenu(false);
    } catch (error) {
      console.error('Failed to add track:', error);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">
          Tracks: {tracks.length}/{maxTracks}
        </span>
        
        {canAddMore && availableInstruments.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Track
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAddMenu && (
              <div className="absolute top-full mt-1 left-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 px-2">Add Instrument:</div>
                  {availableInstruments.map((instrument) => (
                    <button
                      key={instrument.id}
                      onClick={() => handleAddTrack(instrument.id)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-600 rounded transition-colors"
                    >
                      <div className="font-medium">{instrument.name}</div>
                      <div className="text-xs text-gray-400">{instrument.instrument}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {tracks.length > 1 && (
        <div className="text-xs text-gray-500">
          Click the trash icon on any track to remove it
        </div>
      )}

      {/* Click outside to close menu */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
};