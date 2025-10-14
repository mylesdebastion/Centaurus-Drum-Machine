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
    return () => {
      this.presenceSyncCallbacks = this.presenceSyncCallbacks.filter(cb => cb !== callback);
    };
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

        // Store our own peer ID
        if (!this._myPeerId) {
          this._myPeerId = presenceKey;
        }
      });

      console.log('[SupabaseSessionService] Presence sync:', participants);

      // Invoke all presence sync callbacks
      this.presenceSyncCallbacks.forEach(callback => callback(participants));
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
  }

  /**
   * Set up connection status listener
   * @private
   */
  private setupConnectionListener(): void {
    if (!this.channel) return;

    // Note: Supabase handles automatic reconnection internally
    // Connection status is primarily managed via subscription callback
    // This is a placeholder for future connection monitoring
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
