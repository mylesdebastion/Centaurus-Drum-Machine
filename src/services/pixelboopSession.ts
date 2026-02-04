/**
 * PixelBoop Supabase Session Service
 * Client-side service for managing real-time PixelBoop jam sessions
 * Adapted from Centaurus session service for PixelBoop use case
 *
 * **Usage Example:**
 * ```typescript
 * import { pixelboopSessionService } from '@/services/pixelboopSession';
 *
 * // Host creates session
 * const roomCode = await pixelboopSessionService.createSession('Alice', 'ios');
 * console.log('Session created:', roomCode);
 *
 * // Guest joins session
 * await pixelboopSessionService.joinSession('ABC123', 'Bob', 'web');
 *
 * // Listen for participants
 * pixelboopSessionService.onPresenceSync((participants) => {
 *   console.log('Participants:', participants);
 * });
 *
 * // Broadcast pattern edit
 * await pixelboopSessionService.broadcastPatternEdit({
 *   track: 0,
 *   step: 7,
 *   note: 60,
 *   velocity: 80,
 *   duration: 0.5,
 *   timestamp: Date.now()
 * });
 *
 * // Listen for pattern edits
 * pixelboopSessionService.onPatternEdit((delta) => {
 *   console.log('Pattern edit:', delta);
 * });
 *
 * // Leave session
 * await pixelboopSessionService.leaveSession();
 * ```
 */

import { supabase } from '@/lib/supabase';
import { generateRoomCode } from '@/utils/roomCodeGenerator';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  PixelBoopParticipant,
  PixelBoopConnectionStatus,
  PixelBoopBroadcastPayload,
  PatternEditDelta,
  PlaybackState,
  TempoChange,
  TrackState,
} from '@/types/pixelboopSession';

/**
 * PixelBoop Supabase Session Service Class
 * Manages Realtime channels for PixelBoop jam sessions
 */
class PixelBoopSessionService {
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient;
  private _connectionStatus: PixelBoopConnectionStatus = 'disconnected';
  private _roomCode: string | null = null;
  private _isHost: boolean = false;
  private _myPeerId: string | null = null;

  // Callbacks for presence and broadcast events
  private presenceSyncCallbacks: ((participants: PixelBoopParticipant[]) => void)[] = [];
  private patternEditCallbacks: ((delta: PatternEditDelta) => void)[] = [];
  private playbackStateCallbacks: ((state: PlaybackState) => void)[] = [];
  private tempoChangeCallbacks: ((tempo: TempoChange) => void)[] = [];
  private trackStateCallbacks: ((state: TrackState) => void)[] = [];
  private connectionStatusCallbacks: ((status: PixelBoopConnectionStatus) => void)[] = [];

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Current connection status
   */
  get connectionStatus(): PixelBoopConnectionStatus {
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
   * Create a new PixelBoop jam session
   *
   * @param userName - Display name for the host
   * @param deviceType - Device type ('ios', 'web', 'android')
   * @returns {Promise<string>} Generated room code
   * @throws {Error} If session creation fails
   *
   * @example
   * ```typescript
   * const roomCode = await service.createSession('Alice', 'ios');
   * console.log('Session created:', roomCode); // "ABC123"
   * ```
   */
  async createSession(userName: string, deviceType: 'ios' | 'web' | 'android'): Promise<string> {
    // Leave existing session if any
    if (this.channel) {
      await this.leaveSession();
    }

    // Generate unique room code
    const roomCode = generateRoomCode();
    this._roomCode = roomCode;
    this._isHost = true;

    // Subscribe to channel (note: pixelboop-jam prefix instead of jam-session)
    const channelName = `pixelboop-jam:${roomCode}`;
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
            console.log(`[PixelBoopSessionService] Subscribed to channel: ${channelName}`);

            // Track presence as host
            const presenceState = await this.channel!.track({
              name: userName,
              isHost: true,
              deviceType,
              joinedAt: new Date().toISOString(),
            });

            if (presenceState === 'ok') {
              console.log('[PixelBoopSessionService] Presence tracked successfully');
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
   * Join an existing PixelBoop jam session
   *
   * @param roomCode - 6-character room code
   * @param userName - Display name for the guest
   * @param deviceType - Device type ('ios', 'web', 'android')
   * @throws {Error} If join fails or room code is invalid
   *
   * @example
   * ```typescript
   * await service.joinSession('ABC123', 'Bob', 'web');
   * console.log('Joined session successfully');
   * ```
   */
  async joinSession(roomCode: string, userName: string, deviceType: 'ios' | 'web' | 'android'): Promise<void> {
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
    const channelName = `pixelboop-jam:${roomCode}`;
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
            console.log(`[PixelBoopSessionService] Subscribed to channel: ${channelName}`);

            // Track presence as guest
            const presenceState = await this.channel!.track({
              name: userName,
              isHost: false,
              deviceType,
              joinedAt: new Date().toISOString(),
            });

            if (presenceState === 'ok') {
              console.log('[PixelBoopSessionService] Presence tracked successfully');
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
   * Leave the current PixelBoop jam session
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
      console.log('[PixelBoopSessionService] Leaving session...');

      // Unsubscribe from channel (automatically removes presence)
      await this.supabase.removeChannel(this.channel);

      this.channel = null;
      this._roomCode = null;
      this._isHost = false;
      this._myPeerId = null;
      this.updateConnectionStatus('disconnected');

      console.log('[PixelBoopSessionService] Left session successfully');
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
  onPresenceSync(callback: (participants: PixelBoopParticipant[]) => void): () => void {
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
   * @returns {PixelBoopParticipant[]} Current participant list
   */
  private getCurrentParticipants(): PixelBoopParticipant[] {
    if (!this.channel) return [];

    const presenceState = this.channel.presenceState<{
      name: string;
      isHost: boolean;
      deviceType: 'ios' | 'web' | 'android';
      joinedAt: string;
    }>();

    const participants: PixelBoopParticipant[] = [];

    Object.entries(presenceState).forEach(([presenceKey, presences]) => {
      // Each presenceKey can have multiple entries (if user reconnects)
      // We take the most recent one
      const mostRecent = presences[presences.length - 1];

      participants.push({
        id: presenceKey,
        name: mostRecent.name,
        isHost: mostRecent.isHost,
        deviceType: mostRecent.deviceType,
        joinedAt: mostRecent.joinedAt,
      });
    });

    return participants;
  }

  /**
   * Subscribe to pattern edit events
   *
   * @param callback - Function called when pattern is edited
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onPatternEdit((delta) => {
   *   console.log('Pattern edit:', delta);
   * });
   * ```
   */
  onPatternEdit(callback: (delta: PatternEditDelta) => void): () => void {
    this.patternEditCallbacks.push(callback);
    return () => {
      this.patternEditCallbacks = this.patternEditCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to playback state events
   *
   * @param callback - Function called when playback state changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onPlaybackState((state) => {
   *   console.log('Playback:', state.isPlaying, 'Step:', state.currentStep);
   * });
   * ```
   */
  onPlaybackState(callback: (state: PlaybackState) => void): () => void {
    this.playbackStateCallbacks.push(callback);
    return () => {
      this.playbackStateCallbacks = this.playbackStateCallbacks.filter(cb => cb !== callback);
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
   *   console.log('New tempo:', tempo.bpm);
   * });
   * ```
   */
  onTempoChange(callback: (tempo: TempoChange) => void): () => void {
    this.tempoChangeCallbacks.push(callback);
    return () => {
      this.tempoChangeCallbacks = this.tempoChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to track state events
   *
   * @param callback - Function called when track state changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = service.onTrackState((state) => {
   *   console.log('Track', state.track, 'muted:', state.muted, 'solo:', state.solo);
   * });
   * ```
   */
  onTrackState(callback: (state: TrackState) => void): () => void {
    this.trackStateCallbacks.push(callback);
    return () => {
      this.trackStateCallbacks = this.trackStateCallbacks.filter(cb => cb !== callback);
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
  onConnectionStatusChange(callback: (status: PixelBoopConnectionStatus) => void): () => void {
    this.connectionStatusCallbacks.push(callback);
    return () => {
      this.connectionStatusCallbacks = this.connectionStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Broadcast pattern edit to all participants
   *
   * @param delta - Pattern edit delta
   *
   * @example
   * ```typescript
   * await service.broadcastPatternEdit({
   *   track: 0,
   *   step: 7,
   *   note: 60,
   *   velocity: 80,
   *   duration: 0.5,
   *   timestamp: Date.now()
   * });
   * console.log('Pattern edit broadcast successfully');
   * ```
   */
  async broadcastPatternEdit(delta: PatternEditDelta): Promise<void> {
    if (!this.channel) {
      console.warn('[PixelBoopSessionService] Cannot broadcast pattern edit - not in session');
      return;
    }

    const payload: PixelBoopBroadcastPayload = { patternEdit: delta };

    await this.channel.send({
      type: 'broadcast',
      event: 'pattern-edit',
      payload,
    });

    console.log('[PixelBoopSessionService] Broadcast pattern edit:', delta);
  }

  /**
   * Broadcast playback state to all participants
   *
   * @param state - Playback state
   *
   * @example
   * ```typescript
   * await service.broadcastPlaybackState({
   *   isPlaying: true,
   *   currentStep: 4
   * });
   * console.log('Playback state broadcast successfully');
   * ```
   */
  async broadcastPlaybackState(state: PlaybackState): Promise<void> {
    if (!this.channel) {
      console.warn('[PixelBoopSessionService] Cannot broadcast playback state - not in session');
      return;
    }

    const payload: PixelBoopBroadcastPayload = { playbackState: state };

    await this.channel.send({
      type: 'broadcast',
      event: 'playback-state',
      payload,
    });

    console.log('[PixelBoopSessionService] Broadcast playback state:', state);
  }

  /**
   * Broadcast tempo change to all participants
   *
   * @param tempo - Tempo change
   *
   * @example
   * ```typescript
   * await service.broadcastTempo({ bpm: 140 });
   * console.log('Tempo broadcast successfully');
   * ```
   */
  async broadcastTempo(tempo: TempoChange): Promise<void> {
    if (!this.channel) {
      console.warn('[PixelBoopSessionService] Cannot broadcast tempo - not in session');
      return;
    }

    const payload: PixelBoopBroadcastPayload = { tempoChange: tempo };

    await this.channel.send({
      type: 'broadcast',
      event: 'tempo-change',
      payload,
    });

    console.log('[PixelBoopSessionService] Broadcast tempo:', tempo);
  }

  /**
   * Broadcast track state to all participants
   *
   * @param state - Track state
   *
   * @example
   * ```typescript
   * await service.broadcastTrackState({
   *   track: 0,
   *   muted: true,
   *   solo: false
   * });
   * console.log('Track state broadcast successfully');
   * ```
   */
  async broadcastTrackState(state: TrackState): Promise<void> {
    if (!this.channel) {
      console.warn('[PixelBoopSessionService] Cannot broadcast track state - not in session');
      return;
    }

    const payload: PixelBoopBroadcastPayload = { trackState: state };

    await this.channel.send({
      type: 'broadcast',
      event: 'track-state',
      payload,
    });

    console.log('[PixelBoopSessionService] Broadcast track state:', state);
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
        deviceType: 'ios' | 'web' | 'android';
        joinedAt: string;
      }>();

      // Parse presence state into Participant array
      const participants: PixelBoopParticipant[] = [];

      Object.entries(presenceState).forEach(([presenceKey, presences]) => {
        // Each presenceKey can have multiple entries (if user reconnects)
        // We take the most recent one
        const mostRecent = presences[presences.length - 1];

        participants.push({
          id: presenceKey,
          name: mostRecent.name,
          isHost: mostRecent.isHost,
          deviceType: mostRecent.deviceType,
          joinedAt: mostRecent.joinedAt,
        });
      });

      console.log('[PixelBoopSessionService] Presence sync:', participants);
      console.log('[PixelBoopSessionService] My peer ID:', this._myPeerId);

      // Invoke all presence sync callbacks
      this.presenceSyncCallbacks.forEach(callback => callback(participants));
    });

    // Listen for join events to capture our own peer ID
    this.channel.on('presence', { event: 'join' }, ({ key, currentPresences }) => {
      console.log('[PixelBoopSessionService] Presence join event:', key);

      // If this is our first join, store our peer ID
      if (!this._myPeerId && currentPresences.length > 0) {
        this._myPeerId = key;
        console.log('[PixelBoopSessionService] Set myPeerId:', this._myPeerId);
      }
    });
  }

  /**
   * Set up broadcast listeners for state synchronization
   * @private
   */
  private setupBroadcastListeners(): void {
    if (!this.channel) return;

    // Pattern edit listener
    this.channel.on('broadcast', { event: 'pattern-edit' }, ({ payload }) => {
      const { patternEdit } = payload as PixelBoopBroadcastPayload;
      if (patternEdit !== undefined) {
        console.log('[PixelBoopSessionService] Received pattern edit:', patternEdit);
        this.patternEditCallbacks.forEach(callback => callback(patternEdit));
      }
    });

    // Playback state listener
    this.channel.on('broadcast', { event: 'playback-state' }, ({ payload }) => {
      const { playbackState } = payload as PixelBoopBroadcastPayload;
      if (playbackState !== undefined) {
        console.log('[PixelBoopSessionService] Received playback state:', playbackState);
        this.playbackStateCallbacks.forEach(callback => callback(playbackState));
      }
    });

    // Tempo change listener
    this.channel.on('broadcast', { event: 'tempo-change' }, ({ payload }) => {
      const { tempoChange } = payload as PixelBoopBroadcastPayload;
      if (tempoChange !== undefined) {
        console.log('[PixelBoopSessionService] Received tempo change:', tempoChange);
        this.tempoChangeCallbacks.forEach(callback => callback(tempoChange));
      }
    });

    // Track state listener
    this.channel.on('broadcast', { event: 'track-state' }, ({ payload }) => {
      const { trackState } = payload as PixelBoopBroadcastPayload;
      if (trackState !== undefined) {
        console.log('[PixelBoopSessionService] Received track state:', trackState);
        this.trackStateCallbacks.forEach(callback => callback(trackState));
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
  }

  /**
   * Update connection status and notify listeners
   * @private
   */
  private updateConnectionStatus(status: PixelBoopConnectionStatus): void {
    if (this._connectionStatus === status) return;

    this._connectionStatus = status;
    console.log('[PixelBoopSessionService] Connection status changed:', status);

    this.connectionStatusCallbacks.forEach(callback => callback(status));
  }
}

/**
 * Singleton instance of PixelBoopSessionService
 * Use this exported instance throughout the application
 */
export const pixelboopSessionService = new PixelBoopSessionService(supabase);
