// Global window extensions
declare global {
  interface Window {
    wledBridge: WebSocket | null;
  }
}

export {};