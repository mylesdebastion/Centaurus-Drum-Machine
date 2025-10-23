// Global window extensions
declare global {
  interface Window {
    wledBridge: WebSocket | null;
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export {};