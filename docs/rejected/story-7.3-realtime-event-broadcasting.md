# Story 7.3: Real-time Event Broadcasting

**Epic:** 7 - Real-Time Jam Session Backend
**Status:** Ready for Development
**Priority:** High
**Complexity:** Medium
**Dependencies:** Story 7.1 (Session Server Foundation), Story 7.2 (Session & Participant Management)

## Brief Description

This story implements the real-time broadcasting of musical events between participants in a jam session. When one user plays a drum beat or piano note, all other participants in the same session see and hear it immediately. This is the core functionality that transforms the application from a solo tool into a collaborative musical experience.

---

## Story

**As a** user in a jam session,
**I want** my musical actions (drum hits, notes played, pattern changes) to be broadcast to all other participants in real-time,
**so that** we can play music together synchronously and create a shared, collaborative musical experience.

---

## Background / Context

### Current State
- Story 7.1: Socket.IO server is running and accepts connections
- Story 7.2: Users can create/join sessions and see each other's presence
- **Missing:** No musical event data is being transmitted between clients

### User Journey
1. **Alice creates a session** and starts playing drums
2. **Bob joins the session** and starts playing piano
3. **When Alice hits a drum pad:**
   - Her local app plays the drum sound immediately (no delay)
   - The event is sent to the server via WebSocket
   - The server broadcasts it to Bob (and any other participants)
   - Bob's app receives the event and triggers the same drum sound
   - Result: Bob hears Alice's drum in near real-time (~50-200ms latency)

4. **When Bob plays a piano key:**
   - Same process in reverse: Bob → Server → Alice (and others)

5. **Local echo is NOT duplicated:**
   - Alice should NOT receive her own drum hit back from the server
   - The server only broadcasts to OTHER participants, not the sender

### Design Philosophy Alignment
- **Low latency:** WebSocket ensures minimal delay for real-time musical interaction
- **Event-driven architecture:** Generic `event:broadcast` message supports any musical event type (drums, piano, MIDI, etc.)
- **Client-side sound generation:** Server only relays data, clients handle audio playback (keeps server lightweight)

---

## Acceptance Criteria

### AC 1: Client Sends Musical Event
**Given** a user "Alice" is in session "MUSIC-42",
**When** Alice's frontend emits an `event:broadcast` event with payload:
```javascript
{
  roomCode: "MUSIC-42",
  eventName: "drum_hit",
  payload: { note: "C4", velocity: 80, timestamp: 1634567890123 }
}
```
**Then** the server receives the event and processes it for broadcasting (logged to console).

### AC 2: Server Broadcasts Event to Other Participants
**Given** Alice emits a musical event in session "MUSIC-42" with participants Alice and Bob,
**When** the server receives the `event:broadcast` event,
**Then** the server:
- Validates that Alice is in the specified room
- Broadcasts an `event:broadcast` event to all **OTHER** participants in the room (NOT back to Alice)
- The broadcasted event includes:
  ```javascript
  {
    eventName: "drum_hit",
    payload: { note: "C4", velocity: 80, timestamp: 1634567890123 },
    senderId: "alice-socket-id"
  }
  ```
- Logs the broadcast to the console: `Event broadcasted in MUSIC-42: drum_hit from alice-socket-id`

### AC 3: Originating Client Does NOT Receive Own Event
**Given** Alice emits a `drum_hit` event in session "MUSIC-42",
**When** the server broadcasts the event,
**Then** Alice's client does NOT receive the `event:broadcast` event back from the server.
**And** only Bob (and any other participants) receive it.

### AC 4: Multiple Event Types Supported
**Given** a session with multiple participants,
**When** clients send different event types (e.g., `drum_hit`, `piano_note`, `pattern_change`),
**Then** the server broadcasts all event types without modification or filtering.
**And** event payloads are passed through as-is (server is event-agnostic).

### AC 5: Event Broadcasting in Empty Session
**Given** Alice is the only participant in session "MUSIC-42",
**When** Alice emits a musical event,
**Then** the server receives it and logs it, but does NOT crash or throw errors.
**And** no broadcast occurs (no other participants to send to).

### AC 6: Frontend Integration - JamSession Component
**Given** the `/jam` view (`src/components/JamSession/JamSession.tsx`),
**When** the component is rendered,
**Then**:
- The component connects to the WebSocket server (`http://localhost:3001` or configured URL)
- The component can emit `event:broadcast` messages when users interact with musical elements
- The component listens for incoming `event:broadcast` messages
- The component triggers appropriate audio/visual responses when receiving events from other participants

### AC 7: Frontend Connection Lifecycle
**Given** a user is on the `/jam` view,
**When** they leave the view (navigate away or close browser),
**Then** the WebSocket connection is properly cleaned up (disconnected) to avoid memory leaks.

---

## Technical Specifications

### Server-Side Implementation

Update `server/src/index.ts` to handle event broadcasting:

```typescript
io.on('connection', (socket) => {
  // ... existing connection handlers from Story 7.2 ...

  socket.on('event:broadcast', ({ roomCode, eventName, payload }) => {
    // Validate user is in the room
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(roomCode)) {
      console.log(`User ${socket.id} tried to broadcast to ${roomCode} but is not a member`);
      return;
    }

    // Broadcast to all OTHER clients in the room
    socket.to(roomCode).emit('event:broadcast', {
      eventName,
      payload,
      senderId: socket.id
    });

    console.log(`Event broadcasted in ${roomCode}: ${eventName} from ${socket.id}`);
  });
});
```

### Frontend Integration - JamSession Component

Update `src/components/JamSession/JamSession.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface JamSessionProps {
  onBack: () => void;
}

export const JamSession: React.FC<JamSessionProps> = ({ onBack }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  // Connect to WebSocket server on component mount
  useEffect(() => {
    const newSocket = io('http://localhost:3001'); // TODO: Use environment variable
    setSocket(newSocket);

    // Listen for session events
    newSocket.on('session:created', ({ roomCode, userId }) => {
      setSessionCode(roomCode);
      console.log('Session created:', roomCode);
    });

    newSocket.on('session:joined', ({ roomCode, participants, userId }) => {
      setSessionCode(roomCode);
      setParticipants(participants);
      console.log('Joined session:', roomCode);
    });

    newSocket.on('session:user-joined', ({ user }) => {
      setParticipants(prev => [...prev, user]);
      console.log('User joined:', user);
    });

    newSocket.on('session:user-left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
      console.log('User left:', userId);
    });

    // Listen for musical events from other participants
    newSocket.on('event:broadcast', ({ eventName, payload, senderId }) => {
      console.log(`Received event from ${senderId}:`, eventName, payload);
      handleRemoteEvent(eventName, payload, senderId);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      alert(`Error: ${message}`);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Handle musical events from remote participants
  const handleRemoteEvent = (eventName: string, payload: any, senderId: string) => {
    switch (eventName) {
      case 'drum_hit':
        // Trigger drum sound playback
        playDrumSound(payload.note, payload.velocity);
        // Update visual feedback (e.g., highlight drum pad)
        break;
      case 'piano_note':
        // Trigger piano note playback
        playPianoNote(payload.note, payload.velocity);
        break;
      default:
        console.log('Unknown event type:', eventName);
    }
  };

  // Send musical event to other participants
  const broadcastEvent = (eventName: string, payload: any) => {
    if (socket && sessionCode) {
      socket.emit('event:broadcast', {
        roomCode: sessionCode,
        eventName,
        payload
      });
    }
  };

  // Example: When user hits a drum pad
  const handleDrumHit = (note: string, velocity: number) => {
    // Play sound locally IMMEDIATELY (no network delay)
    playDrumSound(note, velocity);

    // Broadcast to other participants
    broadcastEvent('drum_hit', {
      note,
      velocity,
      timestamp: Date.now()
    });
  };

  // Placeholder functions (implement based on existing audio modules)
  const playDrumSound = (note: string, velocity: number) => {
    console.log('Playing drum:', note, velocity);
    // TODO: Integrate with DrumMachine component
  };

  const playPianoNote = (note: string, velocity: number) => {
    console.log('Playing piano:', note, velocity);
    // TODO: Integrate with Piano/MIDI components
  };

  return (
    <div className="jam-session-container">
      {/* Existing UI from JamSession component */}
      {/* Add socket connection status indicator */}
      {/* Add participant list */}
      {/* Add musical interface (drums, piano, etc.) */}
    </div>
  );
};
```

### Event Payload Standards

To ensure consistency, define standard event payloads:

```typescript
// Musical event types
type DrumHitEvent = {
  eventName: 'drum_hit';
  payload: {
    note: string;       // e.g., 'C4', 'snare', 'kick'
    velocity: number;   // 0-127 (MIDI standard)
    timestamp: number;  // Unix timestamp in ms
  };
};

type PianoNoteEvent = {
  eventName: 'piano_note';
  payload: {
    note: string;       // e.g., 'C4', 'D#5'
    velocity: number;   // 0-127
    timestamp: number;
    duration?: number;  // Optional: note duration in ms
  };
};

type PatternChangeEvent = {
  eventName: 'pattern_change';
  payload: {
    patternId: string;
    bpm?: number;
    timestamp: number;
  };
};

// Union type for all musical events
type MusicalEvent = DrumHitEvent | PianoNoteEvent | PatternChangeEvent;
```

---

## Manual Verification Plan

### Test 1: Basic Event Broadcasting
1. Start the server: `npm run dev:server`
2. Open two browser tabs at `http://localhost:5173/jam`
3. **Tab 1 (Alice):** Create a session
4. **Tab 2 (Bob):** Join using the room code from Tab 1
5. **Tab 1:** Open browser console and emit an event:
   ```javascript
   socket.emit('event:broadcast', {
     roomCode: 'MUSIC-42',
     eventName: 'drum_hit',
     payload: { note: 'C4', velocity: 80, timestamp: Date.now() }
   });
   ```
6. **Verify:** Tab 2 receives the `event:broadcast` event in its console
7. **Verify:** Tab 1 does NOT receive its own event back

### Test 2: Frontend Integration
1. Implement `handleDrumHit` in `JamSession.tsx` (connect to existing drum UI)
2. Open two browser tabs in the `/jam` view
3. Create/join a session
4. **Tab 1:** Click a drum pad
5. **Verify:** Tab 2's drum pad lights up or plays sound
6. **Verify:** Tab 1 hears the sound immediately (local playback)

### Test 3: Multiple Event Types
1. In Tab 1, emit different event types: `drum_hit`, `piano_note`, `pattern_change`
2. **Verify:** All events are received correctly in Tab 2
3. **Verify:** Payloads are intact and unmodified

### Test 4: Solo Session (No Other Participants)
1. Create a session but don't have anyone join
2. Emit musical events
3. **Verify:** Server logs events but doesn't crash
4. **Verify:** No errors in client console

### Test 5: Latency Check
1. Use browser DevTools Network tab to monitor WebSocket messages
2. Send an event and measure time until received in other tab
3. **Target:** <200ms latency for local network
4. **Document:** Observed latency in test notes

---

## Edge Cases & Error Handling

### Edge Case: User Not in Room
**Scenario:** User tries to broadcast to a room they're not a member of
**Implementation:** Server validates `socket.rooms` includes the `roomCode` before broadcasting
**Result:** Event is ignored and logged to console (no error sent to client)

### Edge Case: Malformed Event Payload
**Scenario:** Client sends invalid JSON or missing required fields
**MVP Decision:** Pass through as-is (server is event-agnostic)
**Future Enhancement:** Add payload validation with error responses

### Edge Case: Rapid Event Flooding
**Scenario:** User sends hundreds of events per second (intentional or bug)
**MVP Decision:** No rate limiting (acceptable for trusted users)
**Future Enhancement:** Implement rate limiting (e.g., max 100 events/second per user)

### Edge Case: Large Payload Sizes
**Scenario:** Client sends very large event payloads (e.g., audio buffers)
**MVP Decision:** Socket.IO default limits apply (1MB message size)
**Future Enhancement:** Reject payloads over a certain size (e.g., 10KB)

### Edge Case: Network Disconnection During Event
**Scenario:** User's connection drops while event is being sent
**Implementation:** Socket.IO handles reconnection automatically
**Client Behavior:** Events sent during disconnection are lost (acceptable for real-time music)

---

## Performance Considerations

### Latency Optimization
- **Target:** <200ms round-trip latency for acceptable musical synchronization
- **Factors:**
  - Network distance between users
  - Server processing time (should be <10ms)
  - WebSocket frame overhead (minimal with Socket.IO)

### Bandwidth Estimation
- **Typical event size:** ~100-200 bytes per musical event
- **High-activity scenario:** 10 events/second per user × 5 users = 50 events/second
- **Bandwidth:** ~10 KB/second (negligible for modern connections)

### Server Scalability
- **MVP:** Single Node.js process can handle hundreds of concurrent users
- **Future:** Use Socket.IO Redis adapter for multi-server scaling

---

## Risks and Considerations

### Risk: Clock Synchronization
**Impact:** Events include client-side timestamps, but clocks may be out of sync
**Mitigation (MVP):** Timestamps are for debugging only, not used for synchronization
**Future Enhancement:** Server-side timestamp injection or clock sync protocol

### Risk: Event Ordering
**Impact:** Events sent rapidly may arrive out of order due to network conditions
**Mitigation (MVP):** Acceptable for MVP (users expect some jitter in real-time music)
**Future Enhancement:** Add sequence numbers to events for client-side reordering

### Risk: Audio Playback Conflicts
**Impact:** Multiple events arriving simultaneously may cause audio clipping or glitches
**Mitigation:** Client-side audio mixing/scheduling (outside scope of this story)

### Consideration: Event Payload Standards
- Document recommended event types and payload structures
- Create shared TypeScript types for consistency between frontend and backend
- Consider creating an `events.ts` file that both client and server import

---

## Definition of Done

- [ ] All acceptance criteria implemented and verified via manual testing
- [ ] Server broadcasts musical events to all room participants except sender
- [ ] `JamSession.tsx` component connects to WebSocket server
- [ ] `JamSession.tsx` can send and receive `event:broadcast` messages
- [ ] WebSocket connection is properly cleaned up on component unmount
- [ ] Event payload standards documented (in code comments or separate doc)
- [ ] Latency measured and documented (under 200ms for local network)
- [ ] No memory leaks or connection issues after extended use
- [ ] Server and client logs provide clear visibility into event flow
- [ ] Server README.md updated with event broadcasting documentation

---

## Future Enhancements (Out of Scope)

- **Event Playback Recording:** Save and replay entire jam sessions
- **Rate Limiting:** Prevent event flooding by malicious or buggy clients
- **Payload Validation:** Server-side validation of event types and payloads
- **Event Compression:** Reduce bandwidth for high-frequency events
- **Sequence Numbers:** Ensure event ordering and detect missing events
- **Clock Synchronization:** NTP-like protocol for synchronized timestamps
- **Adaptive Latency Compensation:** Adjust playback timing based on measured latency

---

## Related Files

- `server/src/index.ts` - Add `event:broadcast` handler
- `src/components/JamSession/JamSession.tsx` - Frontend WebSocket integration
- `src/types/events.ts` (NEW) - Shared event type definitions (optional)

---

## Notes for Developers

### Testing Tips
- Use browser DevTools to monitor WebSocket frames (Network tab → WS filter)
- Add timestamp logging to measure latency: `console.log('Sent:', Date.now())` and `console.log('Received:', Date.now())`
- Test with three or more participants to verify multi-user broadcasting

### Integration Points
- **DrumMachine Component:** Connect drum pad clicks to `broadcastEvent('drum_hit', ...)`
- **Piano/MIDI Components:** Connect note on/off events to `broadcastEvent('piano_note', ...)`
- **Pattern Sequencer:** Broadcast pattern changes or sync transport controls

### Debugging
- Add a "Debug Mode" toggle in the UI that shows all incoming/outgoing events
- Log `senderId` to distinguish between local and remote events
- Use different visual indicators for local vs. remote events (e.g., color-coded highlights)

### Performance Monitoring
- Track event frequency (events/second) and display in UI
- Add a latency indicator (measure time from send to receive)
- Monitor CPU/memory usage during high-activity sessions
