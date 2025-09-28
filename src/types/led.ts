// LED Strip Types and Interfaces

export interface LEDColor {
  r: number;
  g: number;
  b: number;
}

export interface LEDStripConfig {
  id: string;              // Unique identifier
  laneIndex: number;       // Which chromatic lane (0-11)
  ipAddress: string;       // WLED device IP
  studentName?: string;    // Optional student identifier
  enabled: boolean;        // Active/inactive
  lastSeen?: Date;        // Last successful communication
  status: 'connected' | 'disconnected' | 'error';
  ledCount: number;        // Number of LEDs in this specific strip
}

export interface WLEDMessage {
  seg: Array<{
    id: number;
    start: number;
    stop: number;
    col: number[][];
  }>;
}

export interface WLEDState {
  on: boolean;
  bri: number;      // Brightness 0-255
  seg: Array<{
    id: number;
    start: number;
    stop: number;
    col: number[][];
    fx?: number;    // Effect ID
    sx?: number;    // Speed
    ix?: number;    // Intensity
  }>;
}

export interface ClassroomControls {
  muteAllStrips: boolean;
  soloStripId: string | null;
  highlightDownbeats: boolean;
  showBeatNumbers: boolean;
  tempoVisualization: boolean;
  recordMode: boolean;
  playbackMode: boolean;
}

export interface LEDVisualizationSettings {
  updateRate: number;       // FPS for updates
  brightness: number;       // Global brightness 0-1
  activeIntensity: number;  // Brightness multiplier for active notes
  baseIntensity: number;    // Brightness for inactive steps
  playheadColor: LEDColor;  // Color for playhead indicator
  beatMarkerColor: LEDColor; // Color for beat emphasis
  protocol: 'udp' | 'http'; // Communication protocol
  udpPort: number;          // UDP port for WARLS protocol
}