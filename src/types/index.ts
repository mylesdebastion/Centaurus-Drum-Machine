export interface User {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

export interface JamSession {
  id: string;
  name: string;
  code: string;
  users: User[];
  tempo: number;
  isPlaying: boolean;
  currentStep: number;
  createdAt: Date;
}

export interface DrumTrack {
  id: string;
  name: string;
  instrument: string;
  steps: boolean[];
  velocities: number[];
  muted: boolean;
  solo: boolean;
  volume: number;
  color: string;
}

export interface DrumPattern {
  id: string;
  name: string;
  tracks: DrumTrack[];
  tempo: number;
}

export type ColorMode = 'spectrum' | 'chromatic' | 'harmonic';

export interface VisualizerSettings {
  colorMode: ColorMode;
  brightness: number;
  ledMatrixEnabled: boolean;
  ledMatrixIP: string;
}

export interface MIDINote {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
  userId: string;
}

export interface EducationLesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LessonStep[];
}

export interface LessonStep {
  id: string;
  instruction: string;
  expectedPattern?: boolean[];
  hint?: string;
  completed: boolean;
}