/**
 * Supabase Session Service
 * Client-side service for managing real-time jam sessions
 * Story 7.2 - Supabase Realtime Service Layer
 *
 * **Usage Example:**
 * ```typescript
 * import { supabaseSessionService } from '@/services/supabaseSession';
 *
 * // Host creates session
 * const roomCode = await supabaseSessionService.createSession('Alice');
 * console.log('Session created:', roomCode);
 *
 * // Guest joins session
 * await supabaseSessionService.joinSession('ABC123', 'Bob');
 *
 * // Listen for participants
 * supabaseSessionService.onPresenceSync((participants) => {
 *   console.log('Participants:', participants);
 * });
 *
 * // Broadcast tempo change
 * await supabaseSessionService.broadcastTempo(140);
 *
 * // Listen for tempo changes
 * supabaseSessionService.onTempoChange((tempo) => {
 *   console.log('New tempo:', tempo);
 * });
 *
 * // Leave session
 * await supabaseSessionService.leaveSession();
 * ```
 */

import { supabase } from '@/lib/supabase';
import { generateRoomCode } from '@/utils/roomCodeGenerator';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  Participant,
  ConnectionStatus,
  BroadcastPayload,
  DrumStepEvent,
} from '@/types/session';

/**
 * Supabase Session Service Class
 * Manages Realtime channels for jam sessions
 */
class SupabaseSessionService {
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient;
  private _connectionStatus: ConnectionStatus = 'disconnected';
  private _roomCode: string | null = null;
  private _isHost: boolean = false;
  private _myPeerId: string | null = null;

  // Callbacks for presence and broadcast events
  private presenceSyncCallbacks: ((participants: Participant[]) => void)[] = [];
  private tempoChangeCallbacks: ((tempo: number) => void)[] = [];
  private playbackChangeCallbacks: ((isPlaying: boolean) => void)[] = [];
  private keyScaleChangeCallbacks: ((key: string, scale: string) => void)[] = [];
  private drumStepCallbacks: ((data: DrumStepEvent) => void)[] = [];
  private colorModeChangeCallbacks: ((mode: string) => void)[] = [];
  private connectionStatusCallbacks: ((status: ConnectionStatus) => void)[] = [];

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Current connection status
   */
  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  /**
   * Current room code (null if not in session)
   */
  get roomCode(): string | null {
    return this._roomCode;
  }

  /**
   * Whether current user is host
   */
  get isHost(): boolean {
    return this._isHost;
  }

  /**
   * Current user's peer ID (presence key)
   */
  get myPeerId(): string | null {
    return this._myPeerId;
  }

  /**
   * Check if currently in a session
   */
  isInSession(): boolean {
    return this.channel !== null && this._roomCode !== null;
  }

  /**
   * Create a new jam session
   *
   * @param userName - Display name for the host
   * @returns {Promise<string>} Generated room code
   * @throws {Error} If session creation fails
   *
   * @example
   * ```typescript
   * const roomCode = await service.createSession('Alice');
   * console.log('Session created:', roomCode); // "ABC123"
   * ```
   */
  async createSession(userName: string): Promise<string> {
    // Leave existing session if any
    if (this.channel) {
      await this.leaveSession();
    }

    // Generate unique room code
    const roomCode = generateRoomCode();
    this._roomCode = roomCode;
    this._isHost = true;

    // Subscribe to channel
    const channelName = `jam-session:${roomCode}`;
    this.channel = this.supabase.channel(channelName);

    // Set up event listeners
    this.setupPresenceListener();
    this.setupBroadcastListeners();
    this.setupConnectionListener();

    // Subscribe to channel
    await new Promise<void>((resolve, reject) => {
      this.channel!
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[SupabaseSessionService] Subscribed to channel: ${channelName}`);

            // Track presence as host
            const presenceState = await this.channel!.track({
              name: userName,
              isHost: true,
              joinedAt: new Date().toISOString(),
            });

            if (presenceState === 'ok') {
              console.log('[SupabaseSessionService] Presence tracked successfully');
              this.updateConnectionStatus('connected');
              resolve();
            } else {
              reject(new Error('Failed to track presence'));
            }
          } else if (status === 'CHANNEL_ERROR') {
            this.updateConnectionStatus('disconnected');
            reject(new Error('Channel subscription failed'));
          } else if (status === 'TIMED_OUT') {
            this.updateConnectionStatus('disconnected');
            reject(new Error('Channel subscription timed out'));
          }
        });
    });

    return roomCode;
  }

  /**
   * Join an existing jam session
   *
   * @param roomCode - 6-character room code
   * @param userName - Display name for the guest
   * @throws {Error} If join fails or room code is invalid
   *
   * @example
   * ```typescript
   * await service.joinSession('ABC123', 'Bob');
   * console.log('Joined session successfully');
   * ```
   */
  async joinSession(roomCode: string, userName: string): Promise<void> {
    // Validate room code format (6 alphanumeric characters)
    if (!roomCode || !/^[A-Z0-9]{6}$/.test(roomCode)) {
      throw new Error('Invalid room code format. Must be 6 alphanumeric characters.');
    }

    // Leave existing session if any
    if (this.channel) {
      await this.leaveSession();
    }

    this._roomCode = roomCode;
    this._isHost = false;

    // Subscribe to channel
    const channelName = `jam-session:${roomCode}`;
    this.channel = this.supabase.channel(channelName);

    // Set up event listeners
    this.setupPresenceListener();
    this.setupBroadcastListeners();
    this.setupConnectionListener();

    // Subscribe to channel
    await new Promise<void>((resolve, reject) => {
      this.channel!
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[SupabaseSessionService] Subscribed to channel: ${channelName}`);

            // Track presence as guest
            const presenceState = await this.channel!.track({
              name: userName,
              isHost: false,
              joinedAt: new Date().toISOString(),
            });

            if (presenceState === 'ok') {
              console.log('[SupabaseSessionService] Presence tracked successfully');
              this.updateConnectionStatus('connected');
              resolve();
            } else {
              reject(new Error('Failed to track presence'));
            }
          } else if (status === 'CHANNEL_ERROR') {
            this.updateConnectionStatus('disconnected');
            reject(new Error('Channel subscription failed - invalid room code?'));
          } else if (status === 'TIMED_OUT') {
            this.updateConnectionStatus('disconnected');
            reject(new Error('Channel subscription timed out'));
          }
        });
    });
  }

  /**
   * Leave the current jam session
   * Unsubscribes from channel and cleans up presence
   *
   * @example
   * ```typescript
   * await service.leaveSession();
   * console.log('Left session successfully');
   * ```
   */
  async leaveSession(): Promise<void> {
    if (this.channel) {
      console.log('[SupabaseSessionService] Leaving session...');

      // Unsubscribe from channel (automatically removes presence)
      await this.supabase.removeChannel(this.channel);

      this.channel = null;
      this._roomCode = null;
      this._isHost = false;
      this._myPeerId = null;
      this.updateConnectionStatus('disconnected');

      console.log('[SupabaseSessionService] Left session successfully');
    }
  }

  /**
   * Subscribe to presence sync events (participant list updates)
   *
   * @param callback - Function called when participants join/leave
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onPresenceSync((participants) => {
   *   console.log('Participants:', participants);
   * });
   *
   * // Later: unsubscribe()
   * ```
   */
  onPresenceSync(callback: (participants: Participant[]) => void): () => void {
    this.presenceSyncCallbacks.push(callback);

    // Immediately call with current presence state if in session
    if (this.channel) {
      const currentParticipants = this.getCurrentParticipants();
      callback(currentParticipants);
    }

    return () => {
      this.presenceSyncCallbacks = this.presenceSyncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get current participants from presence state
   * @returns {Participant[]} Current participant list
   */
  private getCurrentParticipants(): Participant[] {
    if (!this.channel) return [];

    const presenceState = this.channel.presenceState<{
      name: string;
      isHost: boolean;
      joinedAt: string;
    }>();

    const participants: Participant[] = [];

    Object.entries(presenceState).forEach(([presenceKey, presences]) => {
      // Each presenceKey can have multiple entries (if user reconnects)
      // We take the most recent one
      const mostRecent = presences[presences.length - 1];

      participants.push({
        id: presenceKey,
        name: mostRecent.name,
        isHost: mostRecent.isHost,
        joinedAt: mostRecent.joinedAt,
      });
    });

    return participants;
  }

  /**
   * Subscribe to tempo change events
   *
   * @param callback - Function called when tempo changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onTempoChange((tempo) => {
   *   console.log('New tempo:', tempo);
   * });
   * ```
   */
  onTempoChange(callback: (tempo: number) => void): () => void {
    this.tempoChangeCallbacks.push(callback);
    return () => {
      this.tempoChangeCallbacks = this.tempoChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to playback control events
   *
   * @param callback - Function called when playback state changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onPlaybackChange((isPlaying) => {
   *   console.log('Playback:', isPlaying ? 'playing' : 'paused');
   * });
   * ```
   */
  onPlaybackChange(callback: (isPlaying: boolean) => void): () => void {
    this.playbackChangeCallbacks.push(callback);
    return () => {
      this.playbackChangeCallbacks = this.playbackChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to key/scale change events
   *
   * @param callback - Function called when key or scale changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onKeyScaleChange((key, scale) => {
   *   console.log('Key/Scale changed:', key, scale);
   * });
   * ```
   */
  onKeyScaleChange(callback: (key: string, scale: string) => void): () => void {
    this.keyScaleChangeCallbacks.push(callback);
    return () => {
      this.keyScaleChangeCallbacks = this.keyScaleChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to connection status changes
   *
   * @param callback - Function called when connection status changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onConnectionStatusChange((status) => {
   *   console.log('Connection status:', status);
   * });
   * ```
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionStatusCallbacks.push(callback);
    return () => {
      this.connectionStatusCallbacks = this.connectionStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast tempo change to all participants
   *
   * @param tempo - New tempo in BPM
   *
   * @example
   * ```typescript
   * await service.broadcastTempo(140);
   * console.log('Tempo broadcast successfully');
   * ```
   */
  async broadcastTempo(tempo: number): Promise<void> {
    if (!this.channel) {
      console.warn('[SupabaseSessionService] Cannot broadcast tempo - not in session');
      return;
    }

    const payload: BroadcastPayload = { tempo };

    await this.channel.send({
      type: 'broadcast',
      event: 'tempo-change',
      payload,
    });

    console.log('[SupabaseSessionService] Broadcast tempo:', tempo);
  }

  /**
   * Broadcast playback control to all participants
   *
   * @param isPlaying - Whether playback is active
   *
   * @example
   * ```typescript
   * await service.broadcastPlayback(true);
   * console.log('Playback broadcast successfully');
   * ```
   */
  async broadcastPlayback(isPlaying: boolean): Promise<void> {
    if (!this.channel) {
      console.warn('[SupabaseSessionService] Cannot broadcast playback - not in session');
      return;
    }

    const payload: BroadcastPayload = { isPlaying };

    await this.channel.send({
      type: 'broadcast',
      event: 'playback-control',
      payload,
    });

    console.log('[SupabaseSessionService] Broadcast playback:', isPlaying);
  }

  /**
   * Broadcast key/scale change to all participants
   *
   * @param key - Musical key (e.g., "C", "D", "Eb")
   * @param scale - Scale type (e.g., "major", "minor", "dorian")
   *
   * @example
   * ```typescript
   * await service.broadcastKeyScale('C', 'major');
   * console.log('Key/Scale broadcast successfully');
   * ```
   */
  async broadcastKeyScale(key: string, scale: string): Promise<void> {
    if (!this.channel) {
      console.warn('[SupabaseSessionService] Cannot broadcast key/scale - not in session');
      return;
    }

    const payload: BroadcastPayload = { key, scale };

    await this.channel.send({
      type: 'broadcast',
      event: 'key-change',
      payload,
    });

    console.log('[SupabaseSessionService] Broadcast key/scale:', key, scale);
  }

  /**
   * Broadcast drum step change to all participants (Story 17.1)
   * Delta-based state sync for efficient pattern editing
   *
   * @param data - Drum step event data
   *
   * @example
   * ```typescript
   * await service.broadcastDrumStep({
   *   track: 0,
   *   step: 7,
   *   enabled: true,
   *   velocity: 80
   * });
   * ```
   */
  async broadcastDrumStep(data: DrumStepEvent): Promise<void> {
    if (!this.channel) {
      console.warn('[SupabaseSessionService] Cannot broadcast drum step - not in session');
      return;
    }

    const payload: BroadcastPayload = { drumStep: data };

    await this.channel.send({
      type: 'broadcast',
      event: 'drum-step',
      payload,
    });

    console.log('[SupabaseSessionService] Broadcast drum step:', data);
  }

  /**
   * Subscribe to drum step change events (Story 17.1)
   *
   * @param callback - Function called when drum step changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onDrumStep((data) => {
   *   console.log('Drum step changed:', data);
   * });
   * ```
   */
  onDrumStep(callback: (data: DrumStepEvent) => void): () => void {
    this.drumStepCallbacks.push(callback);
    return () => {
      this.drumStepCallbacks = this.drumStepCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast color mode change to all participants (Story 17.2)
   * Enables client-side color derivation across devices
   *
   * @param mode - Color mode ('chromatic' | 'harmonic' | 'spectrum')
   *
   * @example
   * ```typescript
   * await service.broadcastColorMode('harmonic');
   * ```
   */
  async broadcastColorMode(mode: string): Promise<void> {
    if (!this.channel) {
      console.warn('[SupabaseSessionService] Cannot broadcast color mode - not in session');
      return;
    }

    const payload: BroadcastPayload = { mode };

    await this.channel.send({
      type: 'broadcast',
      event: 'color-mode',
      payload,
    });

    console.log('[SupabaseSessionService] Broadcast color mode:', mode);
  }

  /**
   * Subscribe to color mode change events (Story 17.2)
   *
   * @param callback - Function called when color mode changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onColorModeChange((mode) => {
   *   console.log('Color mode changed:', mode);
   * });
   * ```
   */
  onColorModeChange(callback: (mode: string) => void): () => void {
    this.colorModeChangeCallbacks.push(callback);
    return () => {
      this.colorModeChangeCallbacks = this.colorModeChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Set up presence listener for participant tracking
   * @private
   */
  private setupPresenceListener(): void {
    if (!this.channel) return;

    this.channel.on('presence', { event: 'sync' }, () => {
      const presenceState = this.channel!.presenceState<{
        name: string;
        isHost: boolean;
        joinedAt: string;
      }>();

      // Parse presence state into Participant array
      const participants: Participant[] = [];

      Object.entries(presenceState).forEach(([presenceKey, presences]) => {
        // Each presenceKey can have multiple entries (if user reconnects)
        // We take the most recent one
        const mostRecent = presences[presences.length - 1];

        participants.push({
          id: presenceKey,
          name: mostRecent.name,
          isHost: mostRecent.isHost,
          joinedAt: mostRecent.joinedAt,
        });
      });

      console.log('[SupabaseSessionService] Presence sync:', participants);
      console.log('[SupabaseSessionService] My peer ID:', this._myPeerId);

      // Invoke all presence sync callbacks
      this.presenceSyncCallbacks.forEach(callback => callback(participants));
    });

    // Listen for join events to capture our own peer ID
    this.channel.on('presence', { event: 'join' }, ({ key, currentPresences }) => {
      console.log('[SupabaseSessionService] Presence join event:', key);

      // If this is our first join, store our peer ID
      if (!this._myPeerId && currentPresences.length > 0) {
        this._myPeerId = key;
        console.log('[SupabaseSessionService] Set myPeerId:', this._myPeerId);
      }
    });
  }

  /**
   * Set up broadcast listeners for state synchronization
   * @private
   */
  private setupBroadcastListeners(): void {
    if (!this.channel) return;

    // Tempo change listener
    this.channel.on('broadcast', { event: 'tempo-change' }, ({ payload }) => {
      const { tempo } = payload as BroadcastPayload;
      if (tempo !== undefined) {
        console.log('[SupabaseSessionService] Received tempo change:', tempo);
        this.tempoChangeCallbacks.forEach(callback => callback(tempo));
      }
    });

    // Playback control listener
    this.channel.on('broadcast', { event: 'playback-control' }, ({ payload }) => {
      const { isPlaying } = payload as BroadcastPayload;
      if (isPlaying !== undefined) {
        console.log('[SupabaseSessionService] Received playback change:', isPlaying);
        this.playbackChangeCallbacks.forEach(callback => callback(isPlaying));
      }
    });

    // Key/scale change listener
    this.channel.on('broadcast', { event: 'key-change' }, ({ payload }) => {
      const { key, scale } = payload as BroadcastPayload;
      if (key !== undefined && scale !== undefined) {
        console.log('[SupabaseSessionService] Received key/scale change:', key, scale);
        this.keyScaleChangeCallbacks.forEach(callback => callback(key, scale));
      }
    });

    // Drum step change listener (Story 17.1)
    this.channel.on('broadcast', { event: 'drum-step' }, ({ payload }) => {
      const { drumStep } = payload as BroadcastPayload;
      if (drumStep !== undefined) {
        console.log('[SupabaseSessionService] Received drum step change:', drumStep);
        this.drumStepCallbacks.forEach(callback => callback(drumStep));
      }
    });

    // Color mode change listener (Story 17.2)
    this.channel.on('broadcast', { event: 'color-mode' }, ({ payload }) => {
      const { mode } = payload as BroadcastPayload;
      if (mode !== undefined) {
        console.log('[SupabaseSessionService] Received color mode change:', mode);
        this.colorModeChangeCallbacks.forEach(callback => callback(mode));
      }
    });
  }

  /**
   * Set up connection status listener
   * @private
   */
  private setupConnectionListener(): void {
    if (!this.channel) return;

    // Connection status is handled via the subscription callback in createSession/joinSession
    // This method exists for future enhancements (e.g., monitoring network state directly)

    // Note: We could monitor Supabase client connection state here if needed:
    // this.supabase.channel('system').subscribe((status) => { ... })
  }

  /**
   * Update connection status and notify listeners
   * @private
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this._connectionStatus === status) return;

    this._connectionStatus = status;
    console.log('[SupabaseSessionService] Connection status changed:', status);

    this.connectionStatusCallbacks.forEach(callback => callback(status));
  }
}

/**
 * Singleton instance of SupabaseSessionService
 * Use this exported instance throughout the application
 */
export const supabaseSessionService = new SupabaseSessionService(supabase);
