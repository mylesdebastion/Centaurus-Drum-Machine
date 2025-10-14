# Epic 7: Jam Session Backend Infrastructure (Hybrid: Supabase + WebRTC P2P)

**Status:** 📝 **PLANNING**
**Priority:** High
**Target Completion:** Q1 2025

**Epic Goal**: Build real-time collaborative backend infrastructure to enable session creation, participant management, room joining, and state synchronization for the `/jam` route using Supabase Realtime for session management and WebRTC P2P for low-latency audio streaming (<50ms) to enable synchronized musical jamming.

**Business Requirements**:
- Enable true multi-user collaboration for remote/hybrid jam sessions
- Provide reliable session management with room codes (shareable links)
- Real-time state synchronization for participants, tempo, patterns, and playback
- Foundation for future collaborative features (Epic 6 WLED sync, multi-instrument coordination, user accounts, license management)
- Professional-grade reliability (session persistence, reconnection handling)
- **Cost-effective MVP** - Stay on Supabase free tier until product-market fit proven ($0/month for 200 connections, 2M messages/month)

**Technical Requirements**:
- **Supabase Realtime** for session management (Broadcast + Presence features)
- **WebRTC P2P audio streaming** for real-time musical collaboration (<50ms latency)
- **Full-mesh topology** for 2-4 simultaneous users
- **STUN/TURN servers** for NAT traversal (Google STUN free, TURN fallback)
- **Supabase Database** (Postgres) for session persistence and future user accounts/licenses
- Session/participant data models with TypeScript type safety
- Client-side service layers for both Supabase and WebRTC
- Integration with existing GlobalMusicContext and JamSession UI
- **No separate backend server needed** - serverless architecture with P2P audio

---

## Problem Statement

The current `/jam` route has a **complete front-end UI** for collaborative sessions (session code display, user list tab, leave session button, tab navigation) but **no functional backend**. Users cannot:
- Create or join real sessions (session code is hardcoded/fake)
- See other participants or their status
- Share state changes (tempo, patterns, playback control)
- Experience real-time collaboration

**Strategic Decision**: This epic uses a **hybrid architecture** combining Supabase Realtime with WebRTC P2P:

**Supabase Realtime for Session Management:**
- **$0/month for MVP** (free tier: 200 concurrent connections, 2M messages/month)
- **Database included** for future license keys, user accounts
- **Auth included** for future user management
- **~75% less code** than custom backend (no server management)
- **Production-ready** from day one (no deployment infrastructure needed)
- **Already familiar** - team has Supabase experience from other projects

**WebRTC P2P for Audio Streaming:**
- **Critical for real-time jamming**: Initial planning assumed 50-150ms latency (Supabase-only) was acceptable, but **real-time musical jamming requires <50ms latency** for users to play synchronously without feeling delay
- **20-50ms audio latency**: Direct peer-to-peer connections achieve sub-50ms latency
- **Supabase as signaling channel**: Uses Broadcast for WebRTC offer/answer exchange (no separate signaling server needed)
- **STUN/TURN for NAT traversal**: Google STUN free, TURN fallback ~$2/month
- **Full-mesh topology**: Optimized for 2-4 users (each user connects directly to all others)

---

## Story Breakdown

### **Story 7.1: Supabase Project Setup & Database Schema** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 1-2 hours
**Prerequisites:** None

**Goal:** Set up Supabase project, configure Realtime, and create database schema for sessions.

**Acceptance Criteria**:
1. Create new Supabase project (free tier) or use existing project
2. Enable Realtime in Supabase dashboard (Settings → API → Realtime)
3. Add environment variables to `.env.development` and `.env.production`:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxx...
   ```
4. Install Supabase client: `npm install @supabase/supabase-js`
5. Create `src/lib/supabase.ts` with client initialization:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```
6. Create database tables (optional for MVP - can use channels without DB):
   ```sql
   -- sessions table (for persistence and history)
   CREATE TABLE sessions (
     id TEXT PRIMARY KEY,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     state JSONB DEFAULT '{}'::jsonb
   );

   -- Future: user_accounts, license_keys tables
   ```
7. Test Supabase connection from frontend (simple ping test)

**Integration Verification**:
- **IV1**: Environment variables loaded correctly in dev and production
- **IV2**: Supabase client connects successfully
- **IV3**: Database accessible (run simple query)
- **IV4**: Realtime enabled (check dashboard)

**Deliverables**:
- `.env.development` and `.env.production` - Supabase credentials (gitignored)
- `.env.example` - Template for other developers
- `src/lib/supabase.ts` - Supabase client initialization (~10 lines)
- Database migration file (optional): `supabase/migrations/001_sessions.sql`

**Documentation**:
- Supabase dashboard URL and credentials (team-internal doc)
- Setup guide for other developers

---

### **Story 7.2: Supabase Realtime Service Layer** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 4-6 hours
**Prerequisites:** Story 7.1

**Goal:** Create client-side service layer for Supabase Realtime Channels with Presence and Broadcast.

**Acceptance Criteria**:
1. Create `src/services/supabaseSession.ts` with class:
   ```typescript
   class SupabaseSessionService {
     private channel: RealtimeChannel | null;
     private supabase: SupabaseClient;

     async createSession(userName: string): Promise<string>
     async joinSession(roomCode: string, userName: string): Promise<void>
     async leaveSession(): Promise<void>

     // Presence (participant list)
     onPresenceSync(callback: (participants: Participant[]) => void): void

     // Broadcast (state sync)
     onTempoChange(callback: (tempo: number) => void): void
     onPlaybackChange(callback: (isPlaying: boolean) => void): void
     broadcastTempo(tempo: number): Promise<void>
     broadcastPlayback(isPlaying: boolean): Promise<void>
   }
   ```
2. Implement room code generator (6-digit alphanumeric, client-side):
   ```typescript
   // src/utils/roomCodeGenerator.ts
   export function generateRoomCode(): string {
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
     return Array.from({ length: 6 }, () =>
       chars[Math.floor(Math.random() * chars.length)]
     ).join('');
   }
   ```
3. Use Supabase Presence API for participant tracking:
   ```typescript
   await channel.track({
     name: userName,
     isHost: true,
     joinedAt: new Date().toISOString()
   });
   ```
4. Use Supabase Broadcast API for state sync:
   ```typescript
   await channel.send({
     type: 'broadcast',
     event: 'tempo-change',
     payload: { tempo: 120 }
   });
   ```
5. Handle channel subscription lifecycle (SUBSCRIBED, CLOSED, error)
6. Add automatic reconnection handling (Supabase handles this, expose status)
7. TypeScript interfaces for Participant, SessionState:
   ```typescript
   interface Participant {
     id: string;        // Presence user key
     name: string;
     isHost: boolean;
     joinedAt: string;  // ISO timestamp
   }

   interface SessionState {
     tempo: number;
     isPlaying: boolean;
   }
   ```

**Integration Verification**:
- **IV1**: Creating session generates unique room code and subscribes to channel
- **IV2**: Joining session with room code subscribes to same channel
- **IV3**: Presence state tracks all connected participants
- **IV4**: Broadcast messages received by all channel subscribers
- **IV5**: Leaving session unsubscribes and removes from presence

**Deliverables**:
- `src/services/supabaseSession.ts` - Session service (~200 lines)
- `src/types/session.ts` - TypeScript interfaces
- `src/utils/roomCodeGenerator.ts` - Room code utility (~20 lines)

---

### **Story 7.3: JamSession UI Integration** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 4-6 hours
**Prerequisites:** Story 7.2

**Goal:** Connect existing JamSession UI to Supabase backend, enable real session creation/joining.

**Acceptance Criteria**:
1. Update `JamSession.tsx` to use `SupabaseSessionService`:
   ```typescript
   const [sessionCode, setSessionCode] = useState<string | null>(null);
   const [participants, setParticipants] = useState<Participant[]>([]);

   useEffect(() => {
     if (!roomCode) {
       // Create new session (host mode)
       const code = await sessionService.createSession(userName);
       setSessionCode(code);
     } else {
       // Join existing session
       await sessionService.joinSession(roomCode, userName);
       setSessionCode(roomCode);
     }
   }, []);
   ```
2. Replace hardcoded session code with real room code from service
3. Add username prompt modal (show before creating/joining session):
   - Simple text input: "Enter your name"
   - Store in localStorage for future sessions
   - Default to "User" + random number if empty
4. Update "Users" tab to display real participants from Presence:
   - Map Presence state to participant list
   - Show host badge (isHost=true)
   - Show join timestamps
   - Real-time add/remove updates
5. Implement "Leave Session" button:
   - Call `sessionService.leaveSession()`
   - Trigger `onLeaveSession()` callback
6. Add connection status indicator (connected/disconnected/reconnecting)

**Integration Verification**:
- **IV1**: Creating session generates 6-digit code and shows in UI
- **IV2**: Opening new tab with `/jam/ABC123` joins that session
- **IV3**: Participant list updates when users join/leave
- **IV4**: Host badge displays correctly
- **IV5**: Leave session removes user from all other participants' lists
- **IV6**: Connection status indicator reflects actual state

**Deliverables**:
- Updated `src/components/JamSession/JamSession.tsx` - Backend integration
- Updated `src/components/JamSession/UserList.tsx` - Real participant display
- `src/components/JamSession/UsernameModal.tsx` - Name prompt modal
- Connection status indicator component

---

### **Story 7.4: Shareable Session URLs** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 7.3

**Goal:** Enable shareable session URLs for easy joining.

**Acceptance Criteria**:
1. Update routing in `App.tsx`:
   ```typescript
   <Route path="/jam/:roomCode?" element={<JamSession />} />
   ```
2. Parse room code from URL params in `JamSession.tsx`:
   ```typescript
   const { roomCode } = useParams();
   ```
3. Add "Share Session" button in session header:
   - Copy full URL to clipboard: `https://jam-dev.audiolux.app/jam/ABC123`
   - Show toast notification on copy success
   - Icon: Link or Share icon from Lucide
4. Display shareable URL in session header (read-only input with copy button)
5. Handle invalid room codes:
   - Show error message if channel subscription fails
   - Redirect to `/jam` (create new session) after 3 seconds
6. URL state persistence:
   - Preserve room code in browser history
   - Handle browser back/forward correctly

**Integration Verification**:
- **IV1**: Sharing URL allows new user to join session
- **IV2**: Invalid room code shows error message
- **IV3**: Copy button works on all browsers (Clipboard API + fallback)
- **IV4**: Browser back button doesn't break session state

**Deliverables**:
- Updated `src/App.tsx` - Dynamic routing
- Updated `src/components/JamSession/JamSession.tsx` - URL param handling
- `src/components/JamSession/ShareButton.tsx` - Share UI component

---

### **Story 7.5: WebRTC P2P Audio Streaming** 🔴 **CRITICAL**
**Status:** PLANNING
**Complexity:** High
**Time Estimate:** 8-12 hours
**Prerequisites:** Story 7.3

**Goal:** Enable real-time peer-to-peer audio streaming between participants for synchronized musical jamming (<50ms latency).

**Why This is Critical:**
Real-time musical jamming requires <50ms latency. Supabase Realtime (50-150ms) is too slow for users to play music together synchronously. WebRTC provides direct P2P connections with 20-50ms latency.

**Acceptance Criteria**:
1. Implement WebRTC audio service:
   ```typescript
   // src/services/webrtcAudio.ts
   class WebRTCAudioService {
     private peerConnections: Map<string, RTCPeerConnection>;
     private localStream: MediaStream | null;

     async initializeLocalAudio(): Promise<MediaStream>
     async createPeerConnection(peerId: string): RTCPeerConnection
     async createOffer(peerId: string): Promise<RTCSessionDescription>
     async handleOffer(peerId: string, offer: RTCSessionDescription): Promise<RTCSessionDescription>
     async handleAnswer(peerId: string, answer: RTCSessionDescription): Promise<void>
     async handleIceCandidate(peerId: string, candidate: RTCIceCandidate): Promise<void>

     onRemoteStream(callback: (peerId: string, stream: MediaStream) => void): void
     onConnectionStateChange(callback: (peerId: string, state: string) => void): void
   }
   ```

2. Use Supabase Broadcast as **WebRTC signaling channel**:
   ```typescript
   // Exchange WebRTC offers/answers/ICE candidates via Supabase
   channel.send({
     type: 'broadcast',
     event: 'webrtc-signal',
     payload: {
       type: 'offer', // or 'answer', 'ice-candidate'
       targetPeerId: 'user-123',
       data: offer
     }
   });

   channel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
     if (payload.targetPeerId === myPeerId) {
       handleWebRTCSignal(payload);
     }
   });
   ```

3. Capture local audio (microphone or line-in for instruments):
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     audio: {
       echoCancellation: false, // Important for music
       noiseSuppression: false,  // Important for music
       autoGainControl: false,   // Important for music
       sampleRate: 48000,        // CD quality
       channelCount: 2           // Stereo
     }
   });
   ```

4. Establish full-mesh P2P topology for 2-4 users:
   ```
   User A ←→ User B
     ↑  ×      ↑
   User C ←→ User D

   Each user maintains direct connection to every other user
   2 users = 1 connection
   3 users = 3 connections
   4 users = 6 connections
   ```

5. Mix remote audio streams for local playback:
   ```typescript
   const audioContext = new AudioContext();
   const mixNode = audioContext.createGain();

   remoteStreams.forEach(stream => {
     const source = audioContext.createMediaStreamSource(stream);
     source.connect(mixNode);
   });

   mixNode.connect(audioContext.destination);
   ```

6. **STUN/TURN configuration** for NAT traversal:
   ```typescript
   const config: RTCConfiguration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
       // TURN server (add if P2P fails):
       // { urls: 'turn:turn.example.com', username: 'user', credential: 'pass' }
     ]
   };
   ```

7. Handle WebRTC connection failures with graceful degradation:
   - Show warning: "Direct audio connection failed, using relay mode"
   - Fall back to audio-only (no video)
   - Monitor connection quality (ICE connection state)

8. Audio quality settings with user control:
   - **Low latency mode** (default): 48kHz, 128kbps stereo
   - **High quality mode**: 48kHz, 256kbps stereo
   - Show audio input level meters

**Integration Verification**:
- **IV1**: Audio latency <50ms between two users on same WiFi network
- **IV2**: Audio latency <100ms between users on different networks (acceptable)
- **IV3**: Audio remains synchronized with tempo changes from GlobalMusicContext
- **IV4**: P2P connection succeeds for 80%+ of user pairs (rest use TURN)
- **IV5**: Microphone permission prompt appears and works correctly
- **IV6**: Audio input levels display correctly for local user

**Deliverables**:
- `src/services/webrtcAudio.ts` - WebRTC audio streaming service (~350 lines)
- Updated `src/services/supabaseSession.ts` - Add WebRTC signaling via Broadcast (~50 lines added)
- Updated `src/components/JamSession/JamSession.tsx` - Audio stream integration (~100 lines added)
- `src/components/JamSession/AudioPermissionModal.tsx` - Microphone permission prompt (~50 lines)
- `src/components/JamSession/AudioLevelMeter.tsx` - Visual audio input levels (~80 lines)

**Testing Strategy**:
- Test with 2 users on same network (lowest latency baseline)
- Test with 2 users on different networks (realistic latency)
- Test with 3-4 users (mesh complexity)
- Test on mobile hotspot (NAT traversal, TURN fallback)
- Measure actual latency with loopback test (play sound, measure when received)

---

### **Story 7.6: LED Visualization Sync via Audio Analysis** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 6-8 hours
**Prerequisites:** Story 7.5

**Goal:** Synchronize LED visualizations across all participants based on received audio streams with minimal latency.

**Two Approaches (Test Both)**:

#### Approach A: Local Audio Analysis (Lowest Latency - Recommended)
Each user analyzes audio locally and drives their own LEDs:
- **Latency**: 20-50ms (matches WebRTC audio latency)
- **Sync accuracy**: Within 50-100ms across all users
- **Complexity**: Medium

#### Approach B: Broadcast LED Data via Supabase (Simpler but Higher Latency)
One user generates LED data and broadcasts to others:
- **Latency**: 70-200ms (WebRTC audio 20-50ms + Supabase 50-150ms)
- **Sync accuracy**: Within 150-200ms across all users
- **Complexity**: Low

**Acceptance Criteria**:

1. **Implement Approach A (Local Audio Analysis)**:
   ```typescript
   // src/utils/audioToLED.ts
   class AudioToLEDService {
     private audioContext: AudioContext;
     private analysers: Map<string, AnalyserNode>; // One per peer + local

     analyzeAudio(stream: MediaStream): AnalyserNode
     detectNotes(analyser: AnalyserNode): DetectedNote[]
     mergeVisualizations(notes: DetectedNote[][]): LEDColor[]
     mapNotesToLEDColors(notes: DetectedNote[], colorMode: string): LEDColor[]
   }

   interface DetectedNote {
     frequency: number;
     note: string;        // e.g., "C4", "D#5"
     velocity: number;    // 0-1 (volume)
     timestamp: number;   // Performance.now()
   }

   interface LEDColor {
     r: number; // 0-255
     g: number;
     b: number;
   }
   ```

2. Analyze all audio streams (local + all remote peers):
   ```typescript
   // For local audio
   const localAnalyser = audioContext.createAnalyser();
   localAnalyser.fftSize = 2048;
   localStream.connect(localAnalyser);

   // For each remote peer
   remotePeers.forEach(peer => {
     const remoteAnalyser = audioContext.createAnalyser();
     peer.audioStream.connect(remoteAnalyser);
     analysers.set(peer.id, remoteAnalyser);
   });
   ```

3. Extract frequency data and detect musical notes:
   ```typescript
   function detectNotes(analyser: AnalyserNode): DetectedNote[] {
     const dataArray = new Uint8Array(analyser.frequencyBinCount);
     analyser.getByteFrequencyData(dataArray);

     // Peak detection algorithm (find dominant frequencies)
     const peaks = findPeaks(dataArray);

     // Convert frequencies to musical notes
     return peaks.map(peak => ({
       frequency: binToFrequency(peak.bin),
       note: frequencyToNote(binToFrequency(peak.bin)),
       velocity: peak.amplitude / 255,
       timestamp: performance.now()
     }));
   }
   ```

4. Merge visualizations from all participants:
   ```typescript
   function mergeVisualizations(allNotes: DetectedNote[][]): LEDColor[] {
     const combinedNotes = allNotes.flat();

     // Sort by velocity (loudest notes first)
     combinedNotes.sort((a, b) => b.velocity - a.velocity);

     // Map to LED colors based on note
     return combinedNotes.map(note => noteToColor(note, colorMode));
   }
   ```

5. Send LED data to WLED devices (reuse Epic 6 `WLEDDeviceManager`):
   ```typescript
   // In JamSession.tsx
   const ledColors = useMemo(() => {
     const localNotes = audioToLED.detectNotes(localAnalyser);
     const remoteNotes = peers.map(peer =>
       audioToLED.detectNotes(analysers.get(peer.id))
     );

     return audioToLED.mergeVisualizations([localNotes, ...remoteNotes]);
   }, [localAnalyser, analysers, peers]);

   return (
     <WLEDDeviceManager
       ledData={ledColors.map(c => rgbToHex(c))}
       layout={isMobile ? 'mobile' : 'desktop'}
       storageKey="wled-jam-session"
     />
   );
   ```

6. **Implement Approach B (Broadcast LED Data)** as fallback:
   ```typescript
   // Host sends LED data via Supabase Broadcast
   if (isHost) {
     const ledColors = generateLEDColors(combinedAudio);
     channel.send({
       type: 'broadcast',
       event: 'led-update',
       payload: { colors: ledColors }
     });
   }

   // Participants receive and display
   channel.on('broadcast', { event: 'led-update' }, ({ payload }) => {
     updateLEDs(payload.colors);
   });
   ```

7. Performance optimization for 60fps LED updates:
   ```typescript
   // Use requestAnimationFrame for smooth updates
   function updateLEDVisualization() {
     const ledColors = generateColors();
     sendToWLED(ledColors);
     requestAnimationFrame(updateLEDVisualization);
   }

   requestAnimationFrame(updateLEDVisualization);
   ```

8. Add LED sync mode selector in UI:
   - **Auto**: Try Approach A, fall back to B if performance issues
   - **Local Analysis** (Approach A): Each user drives their LEDs
   - **Broadcast** (Approach B): Host broadcasts LED data

**Integration Verification**:
- **IV1**: LEDs update within 50ms of note being played (Approach A)
- **IV2**: LEDs update within 150ms of note being played (Approach B)
- **IV3**: All participants see synchronized LED patterns (within 100ms of each other)
- **IV4**: LED visualization reflects combined audio from all participants
- **IV5**: Works with Epic 6 WLEDDeviceManager component (no conflicts)
- **IV6**: 60fps LED refresh rate maintained (no dropped frames)
- **IV7**: LED sync works with 2-4 users simultaneously

**Deliverables**:
- `src/services/audioToLED.ts` - Audio analysis → LED mapping (~250 lines)
- `src/utils/frequencyToNote.ts` - Frequency → musical note conversion (~100 lines)
- Updated `src/components/JamSession/JamSession.tsx` - Audio analysis + WLED integration (~150 lines added)
- `src/components/JamSession/LEDSyncModeSelector.tsx` - Sync mode UI (~80 lines)
- Performance profiling document (measure actual latency, frame rates)

**Testing Strategy**:
- **Latency test**: Play note, measure time until LED lights up (use slow-motion video)
- **Sync test**: Multiple users play simultaneously, verify LEDs sync within 100ms
- **Performance test**: Monitor frame rate with browser DevTools (maintain 60fps)
- **Approach comparison**: Test both approaches, document latency differences

---

### **Story 7.7: State Synchronization (Non-Audio)** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 7.5
**Note:** Renamed from old Story 7.5 - focuses on non-audio state only

**Goal:** Synchronize non-audio session state (tempo, key, scale, playback control) via Supabase Broadcast.

**Acceptance Criteria**:
1. Add Broadcast event handlers to `SupabaseSessionService`:
   ```typescript
   // Listen for state changes
   channel
     .on('broadcast', { event: 'tempo-change' }, ({ payload }) => {
       // Update GlobalMusicContext
     })
     .on('broadcast', { event: 'playback-control' }, ({ payload }) => {
       // Update playback state
     });
   ```
2. Integrate with GlobalMusicContext:
   - When user changes tempo in header → broadcast to channel
   - When receiving tempo change → update GlobalMusicContext
   - Debounce rapid changes (100ms) to avoid message spam
3. Add playback synchronization:
   - When user clicks play/stop → broadcast to channel
   - All participants receive playback state
   - Update local playback state
4. Optional: Host-only controls
   - Add `isHost` check before broadcasting (can skip for MVP)
   - All users can change tempo/playback for now (democratic)
5. State reconciliation on join:
   - New joiner requests current state via broadcast
   - Host (or any participant) responds with current state
   - Fallback: Use default values (tempo=120, isPlaying=false)

**Integration Verification**:
- **IV1**: Host changing tempo updates all participants' UI within 200ms
- **IV2**: Any participant changing tempo syncs to everyone
- **IV3**: Play/stop commands synchronize across all participants
- **IV4**: New joiner receives current session state
- **IV5**: Rapid tempo changes don't spam messages (debounced)

**Deliverables**:
- Updated `src/services/supabaseSession.ts` - State sync methods
- Updated `src/contexts/GlobalMusicContext.tsx` - Session awareness
- Updated `src/components/JamSession/JamSession.tsx` - State integration
- Debounce utility for state updates

---

### **Story 7.8: Error Handling & Connection Resilience** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 3-4 hours
**Prerequisites:** Story 7.6
**Note:** Renamed from old Story 7.6 - updated for WebRTC error handling

**Goal:** Add comprehensive error handling for both Supabase and WebRTC connections with user-friendly messages and graceful degradation.

**Acceptance Criteria**:
1. Handle Supabase channel errors:
   - Subscription failed → Show "Could not connect to session" message
   - Channel timeout → Show "Connection lost, reconnecting..." indicator
   - Invalid room code → Show "Session not found" message
2. **NEW: Handle WebRTC errors**:
   - ICE connection failed → Show "Direct audio connection failed, retrying..."
   - No TURN server available → Show "Limited connectivity, audio may be delayed"
   - Microphone permission denied → Show "Microphone access required for jamming"
   - Audio device not found → Show "No audio input detected, check microphone"
3. **NEW: Connection quality monitoring**:
   ```typescript
   peerConnection.oniceconnectionstatechange = () => {
     const state = peerConnection.iceConnectionState;
     if (state === 'failed' || state === 'disconnected') {
       // Attempt ICE restart
       restartIceConnection();
     }
   };
   ```
4. **NEW: Graceful degradation**:
   - If WebRTC fails → Continue with Supabase (no audio, show warning)
   - If WLED fails → Continue with audio-only jamming
   - If Supabase unavailable → Show offline message, allow local-only mode
5. User-friendly error messages:
   - Create `src/utils/errorMessages.ts` with error mapping
   - Replace technical errors with user-friendly text (including WebRTC errors)
6. Connection status indicator (update to show both Supabase + WebRTC states):
   - Show "Connected" (green), "Reconnecting..." (yellow), "Disconnected" (red)
   - Separate indicators for Supabase session and WebRTC audio
   - Icon in session header or top-right corner

**Integration Verification**:
- **IV1**: Connection errors show user-friendly messages
- **IV2**: Network interruption triggers reconnection automatically
- **IV3**: Status indicator updates correctly
- **IV4**: No crashes or unhandled errors in console
- **IV5**: WebRTC connection errors show user-friendly messages
- **IV6**: Failed WebRTC connection falls back to Supabase gracefully
- **IV7**: Microphone permission errors show clear instructions
- **IV8**: Connection quality warnings appear when latency >100ms

**Deliverables**:
- `src/utils/errorMessages.ts` - User-friendly error mapping (including WebRTC)
- Updated `src/services/supabaseSession.ts` - Error handling
- Updated `src/services/webrtcAudio.ts` - Error handling and recovery
- Updated Connection status indicator - Show both Supabase and WebRTC states
- Error boundary component (optional)
- Error recovery flow documentation

---

### **Story 7.9: Session Persistence (Optional)** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 7.1 (database schema)
**Note:** Renamed from old Story 7.7 - Optional for MVP - channels work without database persistence

**Goal:** Save sessions to Supabase database for history and analytics.

**Acceptance Criteria**:
1. Save session to `sessions` table on creation:
   ```typescript
   await supabase.from('sessions').insert({
     id: roomCode,
     state: { tempo: 120, isPlaying: false }
   });
   ```
2. Update session state periodically:
   - Every 30 seconds, save current state to database
   - Debounce rapid updates
3. Query active sessions (optional feature):
   - Show "Recent Sessions" list on lobby page
   - Allow host to rejoin previous session
4. Auto-cleanup old sessions:
   - Supabase Edge Function or cron job
   - Delete sessions older than 24 hours
5. Optional: Session analytics
   - Track session duration
   - Track participant count over time
   - Store for future monetization insights

**Integration Verification**:
- **IV1**: Sessions saved to database on creation
- **IV2**: Session state updates persist
- **IV3**: Old sessions auto-deleted after 24 hours
- **IV4**: No performance impact on real-time features

**Deliverables**:
- Updated `src/services/supabaseSession.ts` - Database persistence
- Database queries for session CRUD
- Cleanup script or Edge Function (optional)

---

## Technical Architecture

### System Architecture Diagram (Hybrid: Supabase + WebRTC)

```
┌────────────────────────────────────────────────┐
│   React Frontend (Vercel)                      │
│                                                │
│   ┌──────────────────────────────────────┐    │
│   │  JamSession Component                │    │
│   │  - UI: Participant list, controls    │    │
│   │  - Audio: Mic input, remote mixing   │    │
│   │  - LEDs: Audio analysis → WLED       │    │
│   └──────────────────────────────────────┘    │
│          ↕                       ↕             │
│   ┌────────────┐        ┌─────────────────┐   │
│   │ Supabase   │        │  WebRTCAudio    │   │
│   │ Session    │        │  (P2P Streams)  │   │
│   │ (Signaling)│        │                 │   │
│   └────────────┘        └─────────────────┘   │
└────────────────────────────────────────────────┘
      ↕ WSS                    ↕ WebRTC/UDP
┌──────────────┐         ┌──────────────────┐
│  Supabase    │         │  User B Direct   │
│  - Signaling │         │  P2P Connection  │
│  - State sync│         │  (20-50ms audio) │
│  (50-150ms)  │         └──────────────────┘
└──────────────┘
      ↕
┌──────────────┐
│  Postgres DB │
│  (optional)  │
│  - sessions  │
└──────────────┘
```

**Key Architecture Points:**
- **Supabase Realtime**: Handles session management (Presence + Broadcast), WebRTC signaling, and non-audio state sync (tempo, playback)
- **WebRTC P2P**: Direct peer-to-peer audio connections for <50ms latency (critical for musical jamming)
- **Full-mesh topology**: Each user connects directly to all other users (optimized for 2-4 participants)
- **STUN/TURN**: Google STUN (free) for NAT traversal, TURN fallback ($0-2/month) for corporate networks
- **LED Sync**: Local audio analysis from all streams (20-50ms latency) or Supabase Broadcast fallback (70-200ms)

### Data Models (TypeScript)

```typescript
// Shared types (client-side)
interface Participant {
  id: string;              // Presence user key (unique per connection)
  name: string;            // Display name
  isHost: boolean;         // First user = host
  joinedAt: string;        // ISO timestamp
}

interface SessionState {
  tempo: number;           // BPM (synced from GlobalMusicContext)
  isPlaying: boolean;      // Master playback control
}

// Database schema (optional)
interface Session {
  id: string;              // Room code (6-digit alphanumeric)
  created_at: string;      // ISO timestamp
  state: SessionState;     // JSON field
}
```

### Supabase Realtime API Usage

**Presence (Participant Tracking):**
```typescript
// Track user in session
await channel.track({ name: 'Alice', isHost: true, joinedAt: new Date().toISOString() });

// Listen for presence changes
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // state = { 'user-1': [{ name: 'Alice', ... }], 'user-2': [{ ... }] }
});
```

**Broadcast (State Synchronization):**
```typescript
// Send tempo change
await channel.send({
  type: 'broadcast',
  event: 'tempo-change',
  payload: { tempo: 140 }
});

// Listen for tempo changes
channel.on('broadcast', { event: 'tempo-change' }, ({ payload }) => {
  console.log('New tempo:', payload.tempo);
});
```

### Environment Configuration

**Development:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Supabase: `https://xxxxx.supabase.co` (managed service)
- WebSocket: `wss://xxxxx.supabase.co/realtime/v1` (automatic)

**Production:**
- Frontend: `https://jam-dev.audiolux.app` (Vercel)
- Supabase: Same URL (managed service)
- WebSocket: Same URL (managed service)

---

## Integration Strategy

**Phase 1 - Supabase Foundation** (Story 7.1):
- Set up Supabase project and configure Realtime
- No code changes yet

**Phase 2 - Service Layer** (Story 7.2):
- Implement SupabaseSessionService
- Test with simple HTML client (console logging)

**Phase 3 - UI Integration** (Stories 7.3, 7.4):
- Connect JamSession component to Supabase
- Enable real session creation/joining
- Shareable URLs

**Phase 4 - WebRTC P2P Audio** (Stories 7.5, 7.6):
- WebRTC P2P audio streaming for real-time jamming
- LED visualization sync via audio analysis

**Phase 5 - State Sync & Error Handling** (Stories 7.7, 7.8):
- Synchronize non-audio state (tempo/playback)
- Add error handling and connection resilience

**Phase 6 - Optional Enhancements** (Story 7.9):
- Add database persistence for session history

---

## Success Metrics

**Technical Performance:**
- Session creation completes in <500ms
- Participant join/leave updates propagate in <200ms
- State changes (tempo) sync in <100ms via Supabase
- **Audio latency <50ms** between users on same network (WebRTC P2P)
- **Audio latency <100ms** between users on different networks (acceptable)
- **LED sync within 50-100ms** across all participants (Approach A)
- **P2P connection success rate 80%+** (remaining 20% use TURN relay)
- Handles 40+ concurrent sessions on free tier (200 connections ÷ 5 users)
- WebSocket reconnection succeeds automatically

**User Experience:**
- Users can create/join sessions with <3 clicks
- Shareable URLs work reliably across devices
- Participant list updates feel instant
- **Real-time musical jamming feels natural** (no noticeable audio delay)
- **LED visualizations sync with music** from all participants
- No data loss during network interruptions (graceful reconnection)
- Microphone permission prompts are clear and non-intrusive

**Cost Efficiency:**
- Stay on Supabase free tier for MVP (6-12 months estimate)
- **TURN server costs <$2/month** (20% of users need relay)
- Upgrade to Pro ($25/mo) only when hitting 200 connection limit
- Database + Auth included (no additional costs)
- **Total MVP cost: $0-2/month**

---

## Supabase Free Tier Limits & Monitoring

### Free Tier Quotas
- **200 concurrent connections** (~40 sessions with 5 users each)
- **2 million messages/month** (~66K messages/day)
- **100 messages/second** (burst capacity)
- **500MB database storage**
- **Projects pause after 1 week inactivity** (easy to unpause)

### When to Upgrade to Pro ($25/month)
- Approaching 200 concurrent connections
- Need more than 2M messages/month
- Want to avoid inactivity pausing
- Ready to add user accounts and auth

### Monitoring
- **Supabase Dashboard** - Real-time connection count, message rate
- **Browser DevTools** - Network tab for WebSocket traffic
- **Manual tracking** - Session count, participant count

---

## Risk Assessment & Mitigation

### Risk 1: Supabase Free Tier Limits
**Severity:** Medium
**Mitigation:**
- **Monitor usage** via Supabase dashboard
- **200 connections** = 40 concurrent sessions (plenty for MVP)
- **2M messages/month** = ~30K tempo changes/day (unlikely to hit)
- **Upgrade path** clear: Pro tier at $25/mo includes 500 connections
- **Set alerts** when approaching 150 connections (75% capacity)

### Risk 2: WebSocket Connection Instability (Mobile Networks)
**Severity:** Medium
**Mitigation:**
- Supabase Realtime has **built-in reconnection logic**
- Show **connection status indicator** to user
- **Store session state** on client for recovery after reconnect
- Test on mobile hotspots and flaky WiFi

### Risk 3: Vendor Lock-in (Supabase)
**Severity:** Low
**Mitigation:**
- **Supabase is open-source** (can self-host if needed)
- **Standard Postgres database** (easy to export)
- **WebSocket protocol** is standard (can migrate to Socket.IO later)
- **Service layer abstraction** makes switching backends easier

### Risk 4: Project Inactivity Pausing (Free Tier)
**Severity:** Low
**Mitigation:**
- **Easy to unpause** (one click in dashboard)
- **Set up weekly cron job** to ping project (keeps it alive)
- **Upgrade to Pro** removes pausing ($25/mo when needed)

### Risk 5: WebRTC P2P Connection Failures (15-20% of users)
**Severity:** Medium
**Mitigation:**
- **Use TURN server as fallback relay** (Twilio, Metered.ca, or self-hosted)
- **Monitor ICE connection state** and auto-retry on failure
- **Show clear error messages** when P2P fails ("Direct audio connection failed, using relay mode")
- **Fall back to Supabase-only mode** (no audio) if TURN also fails - session continues without audio
- **Test on challenging networks** (mobile hotspots, corporate networks with restrictive firewalls)
- **Expected success rate: 80-85%** with TURN relay (acceptable for MVP)

---

## Future Enhancements (Post-MVP)

### Phase 2 - Advanced Collaboration
- **Pattern Sharing**: Broadcast drum patterns between users
- **Per-User Instruments**: Each user controls specific tracks (drummer, bassist, keys)
- **Chat/Messaging**: Text chat within session
- **Session Recording**: Save session history for replay

### Phase 3 - User Accounts & Licensing
- **Supabase Auth Integration**: Email/password, OAuth (Google, GitHub)
- **License Key System**: Store in Postgres, validate on session join
- **User Profiles**: Avatar, display name, session history
- **Private Sessions**: Password-protected rooms, invite-only

### Phase 4 - Advanced Features
- **Session Templates**: Pre-configured musical modes (jazz, EDM, acoustic)
- **Spectator Mode**: Watch sessions without participating (audio-only, no microphone)
- **Audio Effects**: Add reverb, delay, EQ to jam session audio
- **Recording**: Save jam session audio for later playback

### Phase 5 - Scaling & Monetization
- **Upgrade to Supabase Pro**: 500 connections, 5M messages/month
- **Custom Domain**: `wss://realtime.audiolux.app`
- **Premium Features**: Longer session history, priority support
- **Analytics Dashboard**: Session metrics, user engagement

---

## Dependencies & Prerequisites

### External Dependencies
- **Epic 4 (Complete)**: GlobalMusicContext provides tempo/key/scale state
- **Existing JamSession UI**: Front-end components already built
- **Supabase Account**: Free tier account (already familiar from other projects)
- **STUN Server**: Google STUN (free) - `stun:stun.l.google.com:19302`
- **TURN Server (optional)**: Twilio, Metered.ca, or self-hosted for NAT traversal fallback

### New Dependencies
- **Frontend**: `@supabase/supabase-js` (2.x)
- **Frontend**: WebRTC (native browser API - no npm package needed)
- **Optional**: `simple-peer` library (simplifies WebRTC, but not required)
- **No backend dependencies** - serverless architecture with P2P audio

### Comparison to Original Architecture Document

**Note**: The original `docs/architecture/jam-session-backend.md` describes a Socket.IO-based approach. This epic **supersedes** that architecture with Supabase Realtime + WebRTC for the following reasons:
- **$0-2/month cost for MVP** vs $32-62/mo for Socket.IO + Railway + TURN
- **No server management** vs maintaining Node.js backend
- **Database + Auth included** vs separate services
- **Comparable implementation time** (35-51 hrs hybrid vs 32-44 hrs Socket.IO-only)
- **Team familiarity** with Supabase
- **Real-time audio with <50ms latency** via WebRTC P2P

The original document remains valuable as a reference for event protocols and data models, which translate cleanly to Supabase Realtime (Socket.IO events → Broadcast events, Rooms → Channels).

---

## Testing Strategy

### Manual Testing (Per CLAUDE.md Guidelines)
- **Story 7.1**: Supabase dashboard, test connection from frontend
- **Story 7.2**: Browser DevTools Console, test service methods
- **Story 7.3**: Multiple browser tabs, mobile device + desktop
- **Story 7.4**: Copy URL, test on different devices (email/SMS)
- **Story 7.5**: WebRTC audio latency test (loopback, measure actual latency)
- **Story 7.6**: LED sync test (play note, measure LED response time)
- **Story 7.7**: Two devices, tempo/playback sync verification
- **Story 7.8**: DevTools network throttling, airplane mode test, WebRTC connection failures

### Browser Testing
- Chrome/Edge (primary)
- Firefox (secondary)
- Safari iOS (mobile)
- Chrome Android (mobile)

### WebRTC-Specific Testing
- **Same network**: Test 2 users on same WiFi (baseline <50ms latency)
- **Different networks**: Test users on different ISPs (target <100ms latency)
- **Mobile hotspot**: Test NAT traversal and TURN fallback
- **Corporate network**: Test restrictive firewall scenarios
- **Multi-user mesh**: Test with 3-4 users simultaneously

### Network Conditions
- Fast WiFi (baseline)
- Slow 3G (mobile simulation via DevTools)
- Airplane mode → reconnect (recovery testing)
- Rapid connect/disconnect (resilience testing)
- **High packet loss**: Simulate unstable connection for WebRTC

### Verification Checklist
For each story, manually verify:
- ✅ Functionality works as expected
- ✅ No errors in browser console
- ✅ Supabase dashboard shows expected activity (connections, messages)
- ✅ Responsive design works on mobile
- ✅ Connection recovery works after network interruption
- ✅ **WebRTC audio latency <50ms on same network** (Story 7.5)
- ✅ **LED sync within 100ms of audio** (Story 7.6)
- ✅ **P2P connection success rate 80%+** (Story 7.5)

---

## Cost Projection

### MVP Phase (Months 1-6)
- **Supabase Free Tier**: $0/month
- **STUN (Google)**: $0/month (free)
- **TURN Server (fallback)**: $0-2/month (20% of users need relay, ~5 GB/month @ $0.40/GB)
- **Vercel (Frontend)**: $0/month (Hobby) or current plan
- **Total**: $0-2/month additional costs

### Growth Phase (Months 7-12)
- **Supabase Pro** (if needed at 200+ connections): $0-25/month
- **TURN Server**: $2-10/month (increased usage)
- **Vercel**: $0/month (Hobby) or current plan
- **Total**: $2-35/month (only if hitting Supabase limits)

### Scale Phase (Year 2+)
- **Supabase Pro**: $25/month base + overages
  - $2.50 per 1M messages (beyond 5M)
  - $10 per 1K connections (beyond 500)
- **TURN Server**: $10-25/month (enterprise relay service)
- **Vercel Pro** (if needed): $20/month
- **Total**: $55-125/month depending on usage

### Comparison to Socket.IO + WebRTC Approach
| Month | Socket.IO (Railway) + TURN | Supabase + WebRTC | Savings |
|-------|----------------------------|-------------------|---------|
| 1-6   | $32-62                     | $0-2              | $180-360 |
| 7-12  | $62-110                    | $2-35             | $360-900 |
| Year 2 | $110-225                  | $55-125           | $660-1200 |

**Total 2-year savings: ~$1100-2260**

**Note**: WebRTC P2P adds minimal cost ($0-2/month MVP) while enabling true real-time jamming (<50ms latency). The hybrid approach provides best-in-class performance at lowest cost.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-13 | 1.0 | Initial epic creation (Socket.IO approach) | Sarah (PO) |
| 2025-01-13 | 2.0 | **UPDATED to Supabase Realtime approach** | Sarah (PO) |
| 2025-01-13 | 3.0 | **ADD WebRTC P2P audio for real-time jamming (<50ms latency)** | Sarah (PO) |

---

## Next Steps

1. **Get stakeholder approval** on Supabase approach (vs original Socket.IO plan)
2. **Create Supabase project** or identify existing project to use
3. **Prioritize stories** for sprint planning (recommend Stories 7.1-7.5 for MVP)
4. **Create Story 7.1 detailed document** and hand off to dev agent
5. **Set up monitoring** for Supabase usage (dashboard alerts)

---

## Git Commit Strategy

**Per Story Commits:**
- Story 7.1: `feat: add Supabase project setup and database schema (Story 7.1)`
- Story 7.2: `feat: implement Supabase Realtime service layer (Story 7.2)`
- Story 7.3: `feat: integrate JamSession UI with Supabase backend (Story 7.3)`
- Story 7.4: `feat: add shareable session URLs (Story 7.4)`
- Story 7.5: `feat: add WebRTC P2P audio streaming (Story 7.5)`
- Story 7.6: `feat: add LED visualization sync via audio analysis (Story 7.6)`
- Story 7.7: `feat: add session state synchronization via Broadcast (Story 7.7)`
- Story 7.8: `feat: add error handling and connection resilience (Story 7.8)`
- Story 7.9: `feat: add optional session persistence to database (Story 7.9)`

**Branch Strategy:**
- `epic-7-jam-session-backend` (main epic branch)
- `story-7.1-supabase-setup` (per-story feature branches)
- `story-7.2-realtime-service`
- `story-7.3-ui-integration`
- `story-7.4-shareable-urls`
- `story-7.5-webrtc-audio`
- `story-7.6-led-sync`
- `story-7.7-state-sync`
- `story-7.8-error-handling`
- `story-7.9-session-persistence`

---

## Additional Resources

**Supabase Documentation:**
- [Realtime Concepts](https://supabase.com/docs/guides/realtime/concepts)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Realtime Quotas](https://supabase.com/docs/guides/realtime/quotas)
- [Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing)

**Project References:**
- Epic 4 (Global Music Controls) - GlobalMusicContext integration
- Epic 6 (Multi-Client Sessions) - WLED sync architecture
- `/src/components/JamSession/JamSession.tsx` - Existing UI
- `/docs/architecture/jam-session-backend.md` - Original Socket.IO design (reference)
