# Epic 7 - WebRTC P2P Audio Stories (to be inserted after Story 7.4)

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
**Note:** This is the old Story 7.5, reordered after WebRTC stories

**Goal:** Synchronize non-audio session state (tempo, key, scale, playback control) via Supabase Broadcast.

**Acceptance Criteria**:
(Keep existing Story 7.5 acceptance criteria unchanged - tempo/playback sync via Supabase)

---

### **Story 7.8: Error Handling & Connection Resilience** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Medium
**Time Estimate:** 3-4 hours
**Prerequisites:** Story 7.6
**Note:** This is the old Story 7.6, updated for WebRTC

**Goal:** Add comprehensive error handling for both Supabase and WebRTC connections.

**Acceptance Criteria**:
1. Handle Supabase errors (keep existing from old Story 7.6)
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
5. User-friendly error messages (keep existing + add WebRTC messages)
6. Connection status indicator (update to show Supabase + WebRTC states)

**Integration Verification**:
- **IV1**: WebRTC connection errors show user-friendly messages
- **IV2**: Failed WebRTC connection falls back to Supabase gracefully
- **IV3**: Microphone permission errors show clear instructions
- **IV4**: Connection quality warnings appear when latency >100ms

**Deliverables**:
- Updated `src/utils/errorMessages.ts` - Add WebRTC error mappings
- Updated `src/services/webrtcAudio.ts` - Error handling and recovery
- Updated Connection status indicator - Show both Supabase and WebRTC states
- Error recovery flow documentation

---

### **Story 7.9: Session Persistence (Optional)** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Low
**Time Estimate:** 2-3 hours
**Prerequisites:** Story 7.1
**Note:** This is the old Story 7.7, unchanged

(Keep old Story 7.7 content unchanged)
