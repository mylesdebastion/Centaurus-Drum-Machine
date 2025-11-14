/**
 * WLED Device Management Type Definitions
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 */

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
export type DataFlowStatus = 'idle' | 'receiving' | 'sending';
export type DeviceType = 'strip' | 'matrix';
export type TestPattern = 'rainbow' | 'solid' | 'off';

export interface MatrixConfig {
  width: number;
  height: number;
  serpentine: boolean;
  orientation: 'horizontal' | 'vertical';
}

export interface WLEDDevice {
  // Identification
  id: string;
  name: string;

  // Connection
  ip: string;
  port?: number;
  connectionStatus: ConnectionStatus;
  lastError?: string;
  autoReconnect: boolean;

  // Hardware configuration
  deviceType: DeviceType;
  ledCount: number;
  matrixConfig?: MatrixConfig;

  // State
  enabled: boolean;
  dataFlowStatus: DataFlowStatus;
  lastDataSent?: number;
  fps: number;

  // Visualization settings
  brightness: number;
  reverseDirection: boolean;
  testPattern?: TestPattern;

  // Optional features (experiment-specific)
  laneAssignment?: number[];
  solo: boolean;
  mute: boolean;
}

export interface WLEDDeviceManagerProps {
  // Data (props-down pattern)
  ledData?: string[];

  // Layout (Story 5.1 pattern)
  layout?: 'mobile' | 'desktop';

  // Persistence (required)
  storageKey: string;

  // Optional configuration
  deviceType?: 'strip' | 'matrix' | 'auto';
  maxDevices?: number;
  showVirtualPreview?: boolean;
  compactMode?: boolean;
}

export interface WLEDDeviceCardProps {
  device: WLEDDevice;
  onToggleEnabled: (deviceId: string) => void;
  onTest: (deviceId: string) => void;
  onDelete: (deviceId: string) => void;
  onUpdateDevice: (deviceId: string, updates: Partial<WLEDDevice>) => void;
  compactMode?: boolean;
}

export interface WLEDVirtualPreviewProps {
  device: WLEDDevice;
  ledColors?: string[];
  matrixColors?: { r: number; g: number; b: number }[][]; // 2D matrix support (DJ Visualizer)
  showLivePreview?: boolean;
}
