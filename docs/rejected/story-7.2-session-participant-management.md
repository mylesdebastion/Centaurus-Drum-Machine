# Story 7.2: Session & Participant Management

**Epic:** 7 - Real-Time Jam Session Backend
**Status:** Ready for Development
**Priority:** High
**Complexity:** Medium
**Dependencies:** Story 7.1 (Session Server Foundation)

## Brief Description

This story implements the core session management functionality that allows users to create and join collaborative jam sessions. It builds on the Socket.IO foundation from Story 7.1 and enables multiple users to connect to shared "rooms" where they can see each other's presence and collaborate in real-time.

---

## Story

**As a** user,
**I want** to be able to create or join a jam session using a simple room code,
**so that** I can collaborate and play music with others in real-time, regardless of their physical location.

---

## Background / Context

### Current State
- Story 7.1 has established the basic Socket.IO server infrastructure
- The server can accept client connections and log connection/disconnection events
- No session management or room functionality exists yet

### User Journey
1. **Host creates a session:**
   - User clicks "Create Session" in the `/jam` view
   - Provides their display name
   - Server generates a unique, shareable room code (e.g., "MUSIC-42")
   - Host receives the room code to share with others

2. **Participants join a session:**
   - User clicks "Join Session" in the `/jam` view
   - Enters the room code they received from the host
   - Provides their display name
   - If valid, they join the session and see the list of current participants
   - All existing participants are notified of the new arrival

3. **Participants leave:**
   - User closes their browser or clicks "Leave Session"
   - All remaining participants are notified of their departure
   - If the host leaves, the session can either transfer to another participant or close (MVP: session continues)

### Design Philosophy Alignment
- **Low barrier to entry:** No authentication required for MVP - just name + room code
- **Clear feedback:** Users always know who's in their session
- **Graceful degradation:** Disconnections are handled cleanly with proper notifications

---

## Acceptance Criteria

### AC 1: Session Creation
**Given** the Socket.IO server is running,
**When** a client emits a `session:create` event with payload `{ name: "Alice" }`,
**Then** the server:
- Generates a unique, human-readable room code (e.g., format: `XXXX-YY` or similar)
- Creates a new session with the user as the host
- Adds the user's socket to the Socket.IO room
- Responds with a `session:created` event containing `{ roomCode: "MUSIC-42", userId: "socket-id-123" }`
- Logs the session creation to the console

### AC 2: Session Joining (Success)
**Given** a session with room code "MUSIC-42" exists,
**When** a client emits a `session:join` event with payload `{ roomCode: "MUSIC-42", name: "Bob" }`,
**Then** the server:
- Validates that the room code exists
- Adds the user's socket to the Socket.IO room
- Retrieves the current list of participants (including the new user)
- Responds to the joining client with `session:joined` event containing `{ roomCode: "MUSIC-42", participants: [{ id, name, instrument }...], userId: "socket-id-456" }`
- Broadcasts `session:user-joined` event to all **other** participants in the room with `{ user: { id: "socket-id-456", name: "Bob", instrument: "drums" } }`

### AC 3: Session Joining (Failure - Room Not Found)
**Given** no session exists with room code "INVALID-99",
**When** a client emits a `session:join` event with `{ roomCode: "INVALID-99", name: "Charlie" }`,
**Then** the server:
- Responds with an `error` event containing `{ message: "Session not found" }`
- Does NOT add the user to any room
- Logs the failed join attempt to the console

### AC 4: Session Leaving (Explicit)
**Given** a user "Bob" is in session "MUSIC-42",
**When** the client emits a `session:leave` event with `{ roomCode: "MUSIC-42" }`,
**Then** the server:
- Removes the user's socket from the Socket.IO room
- Removes the user from the session's participant list
- Broadcasts `session:user-left` event to all **remaining** participants with `{ userId: "socket-id-456" }`
- Logs the leave event to the console

### AC 5: Session Leaving (Disconnection)
**Given** a user "Bob" is in session "MUSIC-42",
**When** the user's socket disconnects (e.g., closes browser, loses network),
**Then** the server:
- Automatically detects the disconnection via Socket.IO's `disconnect` event
- Removes the user from the session's participant list
- Broadcasts `session:user-left` event to all **remaining** participants with `{ userId: "socket-id-456" }`
- Logs the disconnection to the console

### AC 6: Participant Data Structure
**Given** any session operation,
**Then** participant data follows this structure:
```typescript
{
  id: string;        // Derived from socket.id
  name: string;      // User-provided display name
  instrument: string; // e.g., 'drums', 'piano', 'unknown' (default for MVP)
}
```

### AC 7: Room Code Generation
**Given** multiple sessions are being created,
**Then** room codes:
- Are unique across all active sessions
- Are human-readable (e.g., dictionary words + numbers, or simple alphanumeric)
- Are case-insensitive (e.g., "music-42" == "MUSIC-42")
- Are easily shareable (max 10 characters recommended)

---

## Technical Specifications

### Server-Side Data Management

The server will maintain an in-memory Map of active sessions:

```typescript
// server/src/types.ts
interface Participant {
  id: string;       // socket.id
  name: string;     // User-provided display name
  instrument: string; // Default to 'unknown' for MVP
}

interface Session {
  id: string;       // The room code
  hostId: string;   // socket.id of the creator
  participants: Map<string, Participant>;
  createdAt: Date;
}

// server/src/sessionManager.ts (new file)
class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(hostSocketId: string, hostName: string): string {
    // Generate unique room code
    // Create session
    // Return room code
  }

  joinSession(roomCode: string, socketId: string, userName: string): Session | null {
    // Validate room exists
    // Add participant
    // Return session or null
  }

  leaveSession(roomCode: string, socketId: string): void {
    // Remove participant
    // Clean up empty sessions
  }

  getSession(roomCode: string): Session | null {
    // Return session or null
  }
}
```

### Socket.IO Event Handlers

Update `server/src/index.ts` to handle the new events:

```typescript
import { SessionManager } from './sessionManager';

const sessionManager = new SessionManager();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('session:create', ({ name }) => {
    const roomCode = sessionManager.createSession(socket.id, name);
    socket.join(roomCode);
    socket.emit('session:created', { roomCode, userId: socket.id });
    console.log(`Session created: ${roomCode} by ${name}`);
  });

  socket.on('session:join', ({ roomCode, name }) => {
    const session = sessionManager.joinSession(roomCode, socket.id, name);
    if (session) {
      socket.join(roomCode);
      const participants = Array.from(session.participants.values());
      socket.emit('session:joined', { roomCode, participants, userId: socket.id });
      socket.to(roomCode).emit('session:user-joined', {
        user: session.participants.get(socket.id)
      });
      console.log(`${name} joined session: ${roomCode}`);
    } else {
      socket.emit('error', { message: 'Session not found' });
      console.log(`Failed join attempt: ${roomCode}`);
    }
  });

  socket.on('session:leave', ({ roomCode }) => {
    sessionManager.leaveSession(roomCode, socket.id);
    socket.leave(roomCode);
    socket.to(roomCode).emit('session:user-left', { userId: socket.id });
    console.log(`User left session: ${roomCode}`);
  });

  socket.on('disconnect', () => {
    // Find and remove user from all sessions (user should only be in one)
    // Broadcast user-left event
    console.log(`Client disconnected: ${socket.id}`);
  });
});
```

### Room Code Generation Strategy

**Simple approach for MVP:**
```typescript
function generateRoomCode(): string {
  const adjectives = ['HAPPY', 'FUNKY', 'JAZZY', 'ROCKY', 'SMOOTH'];
  const numbers = Math.floor(Math.random() * 100);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adj}-${numbers}`;
}
```

**Alternative (more robust):**
Use a library like `shortid` or `nanoid` for collision-resistant codes.

---

## Manual Verification Plan

### Test 1: Create Session
1. Start the server: `npm run dev:server`
2. Open browser console at `http://localhost:5173`
3. Connect to server: `const socket = io("http://localhost:3001");`
4. Listen for response: `socket.on('session:created', (data) => console.log('Created:', data));`
5. Create session: `socket.emit('session:create', { name: 'Alice' });`
6. **Verify**: Console shows `session:created` with a room code and userId

### Test 2: Join Session
1. In a second browser tab/window, connect: `const socket2 = io("http://localhost:3001");`
2. Listen for join confirmation: `socket2.on('session:joined', (data) => console.log('Joined:', data));`
3. Listen for new users (in first tab): `socket.on('session:user-joined', (data) => console.log('User joined:', data));`
4. Join using room code from Test 1: `socket2.emit('session:join', { roomCode: 'HAPPY-42', name: 'Bob' });`
5. **Verify**: Second tab shows `session:joined` with participant list, first tab shows `session:user-joined` notification

### Test 3: Join Invalid Session
1. In a third tab, connect: `const socket3 = io("http://localhost:3001");`
2. Listen for errors: `socket3.on('error', (data) => console.log('Error:', data));`
3. Attempt to join: `socket3.emit('session:join', { roomCode: 'INVALID-99', name: 'Charlie' });`
4. **Verify**: Console shows `error` event with "Session not found" message

### Test 4: Leave Session
1. In second tab (Bob's connection), leave: `socket2.emit('session:leave', { roomCode: 'HAPPY-42' });`
2. **Verify**: First tab (Alice) receives `session:user-left` event with Bob's userId

### Test 5: Disconnection Handling
1. In second tab, disconnect: `socket2.disconnect();` or close the tab
2. **Verify**: First tab (Alice) receives `session:user-left` event
3. **Verify**: Server console logs the disconnection

---

## Edge Cases & Error Handling

### Edge Case: Duplicate Names
**MVP Decision:** Allow duplicate names (no validation)
**Future Enhancement:** Enforce unique names per session or append numbers (Alice, Alice-2, etc.)

### Edge Case: Host Disconnection
**MVP Decision:** Session continues without host (other participants remain connected)
**Future Enhancement:** Transfer host role to another participant or close session after timeout

### Edge Case: Empty Sessions
**Implementation:** When last participant leaves, delete the session from memory to prevent memory leaks

### Edge Case: Concurrent Join Attempts
**Implementation:** Use synchronous Map operations to prevent race conditions in participant list updates

### Edge Case: Room Code Collision
**Implementation:** Check if generated room code already exists; regenerate if collision detected

---

## Risks and Considerations

### Risk: In-Memory Session Storage
**Impact:** Sessions lost if server restarts
**Mitigation (MVP):** Document this limitation; acceptable for MVP
**Future:** Add Redis or database persistence

### Risk: No Session Size Limits
**Impact:** Could allow hundreds of users in one session (performance issues)
**Mitigation (MVP):** Document recommended limit (e.g., 2-10 users)
**Future:** Enforce max participants per session

### Risk: No Authentication
**Impact:** Anyone with room code can join
**Mitigation (MVP):** Document that sessions are public; don't share codes publicly
**Future:** Add password protection or JWT-based auth

### Consideration: Deployment
- Ensure WebSocket connections work through the deployment platform (some require special configuration)
- Test reconnection behavior in production environment (network interruptions, etc.)

---

## Definition of Done

- [ ] All acceptance criteria implemented and verified via manual testing
- [ ] SessionManager class created and handles all CRUD operations for sessions
- [ ] Socket.IO event handlers properly emit and broadcast all required events
- [ ] Room code generation is unique and user-friendly
- [ ] Disconnection handling works correctly (explicit leave + network disconnects)
- [ ] Console logging provides clear visibility into session operations
- [ ] Code follows existing TypeScript and Node.js patterns from Story 7.1
- [ ] No memory leaks (empty sessions are cleaned up)
- [ ] Server README.md updated with session management documentation

---

## Related Files

- `server/src/index.ts` - Main Socket.IO event handlers
- `server/src/sessionManager.ts` (NEW) - Session management logic
- `server/src/types.ts` (NEW) - TypeScript interfaces for Participant and Session

---

## Notes for Developers

- Use Socket.IO's built-in room functionality (`socket.join()`, `socket.to()`) for efficient message broadcasting
- The `socket.id` is automatically unique per connection - perfect for participant IDs
- Consider using TypeScript's strict mode to catch type errors early
- Test disconnection scenarios thoroughly - they're easy to miss during development
