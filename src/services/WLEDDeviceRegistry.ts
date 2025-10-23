/**
 * WLED Device Registry Service
 * Story 18.1: WLED Device Registry
 *
 * Client-side service for managing WLED LED controller devices.
 * Provides CRUD operations, real-time sync, and connection testing.
 *
 * **Storage Strategy:**
 * - **Anonymous Users**: Devices stored in localStorage (local only)
 * - **Authenticated Users**: Devices stored in Supabase (synced across devices)
 * - **Sign-in Sync**: localStorage devices migrated to Supabase on authentication
 *
 * **Usage Example:**
 * ```typescript
 * import { wledDeviceRegistry } from '@/services/WLEDDeviceRegistry';
 *
 * // Create device (works with or without auth)
 * const device = await wledDeviceRegistry.createDevice({
 *   name: 'Fretboard Grid',
 *   ip: '192.168.1.100',
 *   capabilities: {
 *     dimensions: '2D',
 *     ledCount: 150,
 *     gridConfig: { width: 6, height: 25, serpentine: true, orientation: 'horizontal' },
 *     supportedVisualizations: ['step-sequencer-grid'],
 *   },
 * });
 *
 * // Get all devices
 * const devices = await wledDeviceRegistry.getDevices();
 *
 * // Subscribe to device changes
 * const unsubscribe = wledDeviceRegistry.subscribeToDevices((devices) => {
 *   console.log('Devices updated:', devices);
 * });
 *
 * // Test connection
 * const info = await wledDeviceRegistry.testConnection('192.168.1.100');
 * console.log('Device info:', info);
 *
 * // Sync localStorage devices to Supabase after sign-in
 * await wledDeviceRegistry.syncLocalStorageToSupabase();
 * ```
 */

import { supabase } from '@/lib/supabase';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  WLEDDevice,
  WLEDDeviceInput,
  WLEDInfoResponse,
} from '@/types/wled';

const LOCALSTORAGE_KEY = 'wled-devices';

/**
 * WLED Device Registry Service Class
 * Manages CRUD operations and real-time sync for WLED devices
 */
class WLEDDeviceRegistry {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private deviceChangeCallbacks: ((devices: WLEDDevice[]) => void)[] = [];
  private localStoragePollingInterval: number | null = null;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // ============================================================================
  // LocalStorage Helper Methods (for anonymous users)
  // ============================================================================

  /**
   * Generate a UUID v4
   * @private
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get devices from localStorage
   * @private
   */
  private getLocalStorageDevices(): WLEDDevice[] {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!stored) return [];

      const devices = JSON.parse(stored) as WLEDDevice[];
      console.log(`[WLEDDeviceRegistry] Loaded ${devices.length} devices from localStorage`);
      return devices;
    } catch (error) {
      console.error('[WLEDDeviceRegistry] Error reading localStorage:', error);
      return [];
    }
  }

  /**
   * Save devices to localStorage
   * @private
   */
  private saveLocalStorageDevices(devices: WLEDDevice[]): void {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(devices));
      console.log(`[WLEDDeviceRegistry] Saved ${devices.length} devices to localStorage`);

      // Notify subscribers
      this.deviceChangeCallbacks.forEach(callback => callback(devices));
    } catch (error) {
      console.error('[WLEDDeviceRegistry] Error saving to localStorage:', error);
      throw new Error('Failed to save devices to localStorage');
    }
  }

  /**
   * Create a device in localStorage
   * @private
   */
  private createLocalStorageDevice(deviceInput: WLEDDeviceInput): WLEDDevice {
    const devices = this.getLocalStorageDevices();

    const newDevice: WLEDDevice = {
      id: this.generateUUID(),
      user_id: 'anonymous', // Placeholder for anonymous users
      name: deviceInput.name,
      ip: deviceInput.ip,
      location: deviceInput.location,
      capabilities: deviceInput.capabilities,
      priority: deviceInput.priority ?? 50,
      brightness: deviceInput.brightness ?? 204,
      reverse_direction: deviceInput.reverse_direction ?? false,
      enabled: deviceInput.enabled ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen_at: undefined,
    };

    devices.push(newDevice);
    this.saveLocalStorageDevices(devices);

    console.log('[WLEDDeviceRegistry] Device created in localStorage:', newDevice.name);
    return newDevice;
  }

  /**
   * Update a device in localStorage
   * @private
   */
  private updateLocalStorageDevice(
    deviceId: string,
    updates: Partial<WLEDDeviceInput>
  ): WLEDDevice {
    const devices = this.getLocalStorageDevices();
    const index = devices.findIndex(d => d.id === deviceId);

    if (index === -1) {
      throw new Error('Device not found');
    }

    devices[index] = {
      ...devices[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveLocalStorageDevices(devices);

    console.log('[WLEDDeviceRegistry] Device updated in localStorage:', devices[index].name);
    return devices[index];
  }

  /**
   * Delete a device from localStorage
   * @private
   */
  private deleteLocalStorageDevice(deviceId: string): void {
    const devices = this.getLocalStorageDevices();
    const filtered = devices.filter(d => d.id !== deviceId);

    if (filtered.length === devices.length) {
      throw new Error('Device not found');
    }

    this.saveLocalStorageDevices(filtered);
    console.log('[WLEDDeviceRegistry] Device deleted from localStorage:', deviceId);
  }

  // ============================================================================
  // Public CRUD Methods (auto-route to localStorage or Supabase)
  // ============================================================================

  /**
   * Get all WLED devices for the current user
   * Anonymous users: devices from localStorage
   * Authenticated users: devices from Supabase
   * @returns {Promise<WLEDDevice[]>} Array of devices
   */
  async getDevices(): Promise<WLEDDevice[]> {
    // Check authentication
    const { data: { user } } = await this.supabase.auth.getUser();

    // Anonymous: use localStorage
    if (!user) {
      console.log('[WLEDDeviceRegistry] Anonymous user - using localStorage');
      return this.getLocalStorageDevices();
    }

    // Authenticated: use Supabase
    const { data, error } = await this.supabase
      .from('wled_devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[WLEDDeviceRegistry] Error fetching devices:', error);
      throw new Error(`Failed to fetch devices: ${error.message}`);
    }

    console.log(`[WLEDDeviceRegistry] Fetched ${data?.length || 0} devices from Supabase`);
    return data || [];
  }

  /**
   * Get a single WLED device by ID
   * @param deviceId - Device UUID
   * @returns {Promise<WLEDDevice | null>} Device or null if not found
   */
  async getDevice(deviceId: string): Promise<WLEDDevice | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Anonymous: use localStorage
    if (!user) {
      const devices = this.getLocalStorageDevices();
      return devices.find(d => d.id === deviceId) || null;
    }

    // Authenticated: use Supabase
    const { data, error } = await this.supabase
      .from('wled_devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[WLEDDeviceRegistry] Error fetching device:', error);
      throw new Error(`Failed to fetch device: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new WLED device
   * Anonymous users: saved to localStorage
   * Authenticated users: saved to Supabase
   * @param deviceInput - Device configuration
   * @returns {Promise<WLEDDevice>} Created device
   * @throws {Error} If creation fails
   */
  async createDevice(deviceInput: WLEDDeviceInput): Promise<WLEDDevice> {
    // Check authentication
    const { data: { user } } = await this.supabase.auth.getUser();

    // Anonymous: use localStorage
    if (!user) {
      console.log('[WLEDDeviceRegistry] Anonymous user - saving to localStorage');
      return this.createLocalStorageDevice(deviceInput);
    }

    // Authenticated: use Supabase
    const deviceData = {
      user_id: user.id,
      name: deviceInput.name,
      ip: deviceInput.ip,
      location: deviceInput.location,
      capabilities: deviceInput.capabilities,
      priority: deviceInput.priority ?? 50,
      brightness: deviceInput.brightness ?? 204,
      reverse_direction: deviceInput.reverse_direction ?? false,
      enabled: deviceInput.enabled ?? true,
    };

    const { data, error } = await this.supabase
      .from('wled_devices')
      .insert(deviceData)
      .select()
      .single();

    if (error) {
      console.error('[WLEDDeviceRegistry] Error creating device:', error);
      throw new Error(`Failed to create device: ${error.message}`);
    }

    console.log('[WLEDDeviceRegistry] Device created in Supabase:', data.name);
    return data;
  }

  /**
   * Update an existing WLED device
   * @param deviceId - Device UUID
   * @param updates - Partial device updates
   * @returns {Promise<WLEDDevice>} Updated device
   * @throws {Error} If update fails or device not found
   */
  async updateDevice(
    deviceId: string,
    updates: Partial<WLEDDeviceInput>
  ): Promise<WLEDDevice> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Anonymous: use localStorage
    if (!user) {
      return this.updateLocalStorageDevice(deviceId, updates);
    }

    // Authenticated: use Supabase
    const { data, error } = await this.supabase
      .from('wled_devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single();

    if (error) {
      console.error('[WLEDDeviceRegistry] Error updating device:', error);
      throw new Error(`Failed to update device: ${error.message}`);
    }

    console.log('[WLEDDeviceRegistry] Device updated in Supabase:', data.name);
    return data;
  }

  /**
   * Delete a WLED device
   * @param deviceId - Device UUID
   * @throws {Error} If deletion fails
   */
  async deleteDevice(deviceId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Anonymous: use localStorage
    if (!user) {
      this.deleteLocalStorageDevice(deviceId);
      return;
    }

    // Authenticated: use Supabase
    const { error } = await this.supabase
      .from('wled_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('[WLEDDeviceRegistry] Error deleting device:', error);
      throw new Error(`Failed to delete device: ${error.message}`);
    }

    console.log('[WLEDDeviceRegistry] Device deleted from Supabase:', deviceId);
  }

  /**
   * Test connection to a WLED device
   * Fetches device info from WLED HTTP API
   *
   * @param ip - Device IP address
   * @returns {Promise<WLEDInfoResponse>} Device information
   * @throws {Error} If connection fails or timeout
   */
  async testConnection(ip: string): Promise<WLEDInfoResponse> {
    const url = `http://${ip}/json/info`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const info: WLEDInfoResponse = await response.json();

      console.log('[WLEDDeviceRegistry] Connection test successful:', ip);
      console.log('[WLEDDeviceRegistry] Device info:', {
        name: info.name,
        version: info.ver,
        ledCount: info.leds.count,
      });

      return info;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WLEDDeviceRegistry] Connection test failed:', ip, errorMessage);
      throw new Error(`Connection test failed: ${errorMessage}`);
    }
  }

  /**
   * Turn off a WLED device
   * Powers off the device and closes any active websocket connections
   *
   * @param ip - Device IP address
   * @returns {Promise<void>}
   * @throws {Error} If turning off fails
   */
  async turnOffDevice(ip: string): Promise<void> {
    console.log(`[WLEDDeviceRegistry] Turning off device ${ip}`);

    try {
      const response = await fetch(`http://${ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: false }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[WLEDDeviceRegistry] Device ${ip} turned off`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WLEDDeviceRegistry] Failed to turn off device:', ip, errorMessage);
      throw new Error(`Failed to turn off device: ${errorMessage}`);
    }
  }

  /**
   * Send solid color to a WLED device
   * Sends a single solid color to all LEDs
   *
   * @param ip - Device IP address
   * @param color - RGB color object
   * @returns {Promise<void>}
   * @throws {Error} If sending color fails
   */
  async sendSolidColor(ip: string, color: { r: number; g: number; b: number }): Promise<void> {
    console.log(`[WLEDDeviceRegistry] Sending solid color to ${ip}: RGB(${color.r}, ${color.g}, ${color.b})`);

    try {
      const response = await fetch(`http://${ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          bri: 204,
          seg: [
            {
              id: 0,
              col: [[color.r, color.g, color.b]],
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[WLEDDeviceRegistry] Solid color sent to ${ip}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WLEDDeviceRegistry] Failed to send solid color:', ip, errorMessage);
      throw new Error(`Failed to send solid color: ${errorMessage}`);
    }
  }

  /**
   * Send rainbow test pattern to a WLED device
   * Sends a flowing rainbow pattern to verify connectivity and LED count
   *
   * @param ip - Device IP address
   * @param ledCount - Number of LEDs in the device
   * @returns {Promise<void>}
   * @throws {Error} If sending pattern fails
   */
  async sendRainbowTestPattern(ip: string, ledCount: number): Promise<void> {
    console.log(`[WLEDDeviceRegistry] Sending rainbow test pattern to ${ip} (${ledCount} LEDs)`);

    // Generate rainbow colors
    const colors: string[] = [];
    const time = Date.now() / 1000;

    for (let i = 0; i < ledCount; i++) {
      // Create rainbow that flows along the strip
      const hue = ((i / ledCount) + (time * 0.2)) % 1.0;
      const rgb = this.hsvToRgb(hue, 1.0, 1.0);
      // Convert to hex string
      const hex = `${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
      colors.push(hex);
    }

    try {
      const response = await fetch(`http://${ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          bri: 204,
          seg: [
            {
              id: 0,
              i: colors,
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[WLEDDeviceRegistry] Rainbow test pattern sent to ${ip}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WLEDDeviceRegistry] Failed to send rainbow pattern:', ip, errorMessage);
      throw new Error(`Failed to send rainbow pattern: ${errorMessage}`);
    }
  }

  /**
   * Convert HSV to RGB color
   * @private
   */
  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = 0;
        g = 0;
        b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Update device last_seen_at timestamp
   * @param deviceId - Device UUID
   */
  async updateLastSeen(deviceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('wled_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', deviceId);

    if (error) {
      console.error('[WLEDDeviceRegistry] Error updating last_seen_at:', error);
    }
  }

  /**
   * Subscribe to real-time device changes
   * Anonymous users: localStorage polling (every 1 second)
   * Authenticated users: Supabase Realtime subscription
   *
   * @param callback - Function called when devices change
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = wledDeviceRegistry.subscribeToDevices((devices) => {
   *   console.log('Devices updated:', devices);
   * });
   *
   * // Later: unsubscribe()
   * ```
   */
  subscribeToDevices(callback: (devices: WLEDDevice[]) => void): () => void {
    this.deviceChangeCallbacks.push(callback);

    // Check authentication and set up appropriate subscription
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Anonymous: set up localStorage polling if not already set up
        if (this.localStoragePollingInterval === null) {
          this.setupLocalStoragePolling();
        }
      } else {
        // Authenticated: set up real-time subscription if not already set up
        if (!this.channel) {
          this.setupRealtimeSubscription();
        }
      }
    });

    // Immediately call with current devices
    this.getDevices().then(callback).catch((error) => {
      console.error('[WLEDDeviceRegistry] Error fetching initial devices:', error);
    });

    return () => {
      this.deviceChangeCallbacks = this.deviceChangeCallbacks.filter(cb => cb !== callback);

      // Clean up subscriptions if no more callbacks
      if (this.deviceChangeCallbacks.length === 0) {
        // Clean up localStorage polling
        if (this.localStoragePollingInterval !== null) {
          clearInterval(this.localStoragePollingInterval);
          this.localStoragePollingInterval = null;
          console.log('[WLEDDeviceRegistry] localStorage polling cleaned up');
        }

        // Clean up Supabase channel
        if (this.channel) {
          this.supabase.removeChannel(this.channel);
          this.channel = null;
          console.log('[WLEDDeviceRegistry] Realtime subscription cleaned up');
        }
      }
    };
  }

  /**
   * Set up localStorage polling for anonymous users
   * Polls localStorage every 1 second and notifies callbacks on changes
   * @private
   */
  private setupLocalStoragePolling(): void {
    console.log('[WLEDDeviceRegistry] Setting up localStorage polling for anonymous user');

    let lastDevicesJson = JSON.stringify(this.getLocalStorageDevices());

    this.localStoragePollingInterval = window.setInterval(() => {
      const currentDevicesJson = localStorage.getItem(LOCALSTORAGE_KEY) || '[]';

      // Check if devices have changed
      if (currentDevicesJson !== lastDevicesJson) {
        console.log('[WLEDDeviceRegistry] localStorage changed - notifying callbacks');
        lastDevicesJson = currentDevicesJson;

        const devices = this.getLocalStorageDevices();
        this.deviceChangeCallbacks.forEach(callback => callback(devices));
      }
    }, 1000); // Poll every 1 second
  }

  /**
   * Set up Supabase Realtime subscription for wled_devices table
   * @private
   */
  private setupRealtimeSubscription(): void {
    // Check authentication
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        console.log('[WLEDDeviceRegistry] User not authenticated - skipping realtime subscription');
        return;
      }

      console.log('[WLEDDeviceRegistry] Setting up realtime subscription');

      this.channel = this.supabase
        .channel('wled-devices-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'wled_devices',
            filter: `user_id=eq.${user.id}`, // Only user's devices
          },
          (payload) => {
            console.log('[WLEDDeviceRegistry] Realtime event:', payload.eventType);

            // Refetch all devices and notify callbacks
            this.getDevices().then((devices) => {
              this.deviceChangeCallbacks.forEach(callback => callback(devices));
            }).catch((error) => {
              console.error('[WLEDDeviceRegistry] Error fetching devices after realtime event:', error);
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[WLEDDeviceRegistry] Realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[WLEDDeviceRegistry] Realtime subscription error');
          } else if (status === 'TIMED_OUT') {
            console.error('[WLEDDeviceRegistry] Realtime subscription timed out');
          }
        });
    });
  }

  /**
   * Get all enabled devices (convenience method)
   * @returns {Promise<WLEDDevice[]>} Array of enabled devices
   */
  async getEnabledDevices(): Promise<WLEDDevice[]> {
    const devices = await this.getDevices();
    return devices.filter(device => device.enabled);
  }

  /**
   * Get devices by dimension (1D or 2D)
   * @param dimension - Device dimension
   * @returns {Promise<WLEDDevice[]>} Array of matching devices
   */
  async getDevicesByDimension(dimension: '1D' | '2D'): Promise<WLEDDevice[]> {
    const devices = await this.getDevices();
    return devices.filter(device => device.capabilities.dimensions === dimension);
  }

  /**
   * Sync localStorage devices to Supabase after user signs in
   * Migrates all anonymous devices to the authenticated user's account
   * Clears localStorage after successful migration
   *
   * **Usage:** Call this after user authentication to migrate anonymous devices
   *
   * @returns {Promise<number>} Number of devices synced
   * @throws {Error} If user not authenticated or sync fails
   *
   * @example
   * ```typescript
   * // After user signs in:
   * const syncedCount = await wledDeviceRegistry.syncLocalStorageToSupabase();
   * console.log(`Synced ${syncedCount} devices to Supabase`);
   * ```
   */
  async syncLocalStorageToSupabase(): Promise<number> {
    // Check authentication
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Must be authenticated to sync devices');
    }

    // Get devices from localStorage
    const localDevices = this.getLocalStorageDevices();

    if (localDevices.length === 0) {
      console.log('[WLEDDeviceRegistry] No localStorage devices to sync');
      return 0;
    }

    console.log(`[WLEDDeviceRegistry] Syncing ${localDevices.length} devices from localStorage to Supabase`);

    // Prepare device data for Supabase (remove id, user_id, timestamps)
    const deviceData = localDevices.map(device => ({
      user_id: user.id,
      name: device.name,
      ip: device.ip,
      location: device.location,
      capabilities: device.capabilities,
      priority: device.priority,
      brightness: device.brightness,
      reverse_direction: device.reverse_direction,
      enabled: device.enabled,
    }));

    // Insert devices to Supabase
    const { data, error } = await this.supabase
      .from('wled_devices')
      .insert(deviceData)
      .select();

    if (error) {
      console.error('[WLEDDeviceRegistry] Error syncing devices:', error);
      throw new Error(`Failed to sync devices: ${error.message}`);
    }

    const syncedCount = data?.length || 0;
    console.log(`[WLEDDeviceRegistry] Synced ${syncedCount} devices to Supabase`);

    // Clear localStorage after successful sync
    try {
      localStorage.removeItem(LOCALSTORAGE_KEY);
      console.log('[WLEDDeviceRegistry] Cleared localStorage after sync');
    } catch (error) {
      console.error('[WLEDDeviceRegistry] Error clearing localStorage:', error);
    }

    // Switch from localStorage polling to Supabase realtime
    if (this.localStoragePollingInterval !== null) {
      clearInterval(this.localStoragePollingInterval);
      this.localStoragePollingInterval = null;
      console.log('[WLEDDeviceRegistry] Stopped localStorage polling');
    }

    if (!this.channel && this.deviceChangeCallbacks.length > 0) {
      this.setupRealtimeSubscription();
    }

    // Notify all subscribers with new devices
    this.getDevices().then((devices) => {
      this.deviceChangeCallbacks.forEach(callback => callback(devices));
    });

    return syncedCount;
  }
}

/**
 * Singleton instance of WLEDDeviceRegistry
 * Use this exported instance throughout the application
 */
export const wledDeviceRegistry = new WLEDDeviceRegistry(supabase);
