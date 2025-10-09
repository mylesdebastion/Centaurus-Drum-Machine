import { DrumTrack } from '../types';

// Available drum instruments with their GM MIDI mappings
export const DRUM_INSTRUMENTS = [
  { id: 'kick', name: 'Kick', instrument: 'Bass Drum', midiNote: 36 },
  { id: 'snare', name: 'Snare', instrument: 'Snare Drum', midiNote: 38 },
  { id: 'hihat-closed', name: 'Hi-Hat', instrument: 'Closed Hi-Hat', midiNote: 42 },
  { id: 'hihat-open', name: 'Open Hat', instrument: 'Open Hi-Hat', midiNote: 46 },
  { id: 'clap', name: 'Clap', instrument: 'Hand Clap', midiNote: 39 },
  { id: 'crash', name: 'Crash', instrument: 'Crash Cymbal', midiNote: 49 },
  { id: 'ride', name: 'Ride', instrument: 'Ride Cymbal', midiNote: 51 },
  { id: 'tom-high', name: 'Hi Tom', instrument: 'High Tom', midiNote: 50 },
  { id: 'tom-mid', name: 'Mid Tom', instrument: 'Mid Tom', midiNote: 47 },
  { id: 'tom-low', name: 'Lo Tom', instrument: 'Low Tom', midiNote: 45 },
  { id: 'cowbell', name: 'Cowbell', instrument: 'Cowbell', midiNote: 56 },
  { id: 'shaker', name: 'Shaker', instrument: 'Shaker', midiNote: 70 }
];

// Create a new empty track
export const createEmptyTrack = (instrumentId: string): DrumTrack => {
  const instrument = DRUM_INSTRUMENTS.find(inst => inst.id === instrumentId);
  if (!instrument) {
    throw new Error(`Unknown instrument: ${instrumentId}`);
  }

  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: instrument.name,
    instrument: instrument.instrument,
    steps: new Array(16).fill(false),
    velocities: new Array(16).fill(0.8),
    muted: false,
    solo: false,
    volume: 0.8,
    color: '#ffffff' // Will be set dynamically based on color mode
  };
};

// Create default drum pattern (basic 4/4 beat)
export const createDefaultPattern = (): DrumTrack[] => {
  const kickTrack = createEmptyTrack('kick');
  kickTrack.steps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
  kickTrack.velocities = [0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8];

  const snareTrack = createEmptyTrack('snare');
  snareTrack.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
  snareTrack.velocities = [0.8, 0.8, 0.8, 0.8, 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.9, 0.8, 0.8, 0.8];

  const hihatTrack = createEmptyTrack('hihat-closed');
  hihatTrack.steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
  hihatTrack.velocities = [0.6, 0.8, 0.4, 0.8, 0.6, 0.8, 0.4, 0.8, 0.6, 0.8, 0.4, 0.8, 0.6, 0.8, 0.4, 0.8];

  const clapTrack = createEmptyTrack('clap');
  // Empty by default - user can add their own pattern

  return [kickTrack, snareTrack, clapTrack, hihatTrack];
};

// Get available instruments that aren't already in use
export const getAvailableInstruments = (currentTracks: DrumTrack[]) => {
  const usedInstruments = currentTracks.map(track => 
    DRUM_INSTRUMENTS.find(inst => inst.name === track.name)?.id
  ).filter(Boolean);
  
  return DRUM_INSTRUMENTS.filter(inst => !usedInstruments.includes(inst.id));
};