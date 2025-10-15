
# Epic 7: Real-Time Jam Session Backend

**Status:** In Development
**Priority:** High
**Validated:** 2025-10-13 (PM - YOLO Mode)

---

## 1. Epic Overview

This epic covers the creation of a new, real-time backend service to enable collaborative music "jam sessions" within the application. This service will manage session creation, user participation, and the real-time broadcasting of musical events between connected clients, transforming the application from a solo experience into a collaborative one.

This is a foundational step towards building a more interactive and community-oriented platform.

### 1.1. Business & User Value

- **Value:** Enables users to create and play music together in real-time, regardless of their physical location.
- **User Problem:** The current application is a solitary experience. Users want to collaborate and share their musical ideas with others live.
- **Benefit:** This will significantly increase user engagement, session duration, and create a strong network effect, making the application more valuable as more people use it.

### 1.2. Scope

**In Scope:**
- A Node.js-based WebSocket server using Socket.IO.
- Session management (create, join, leave rooms).
- User presence tracking within a session.
- Real-time broadcasting of musical events (e.g., MIDI note data).

**Out of Scope (for this epic):**
- Video or audio chat between participants.
- Saving or recording of jam sessions.
- Advanced permission systems within a session (e.g., moderator roles).
- Integration with WLED hardware (this is separate from Epic 6).

---

## 2. Technical Architecture & Decisions

- **Technology:** Node.js with Socket.IO. This was chosen for its built-in reliability features (auto-reconnect, rooms), and ability to handle different data channels (e.g., for chat), which supports a better user experience and future extensibility.
- **Data Format:** All communication will be JSON-based.
- **Location:** The new backend code will reside in a dedicated `/server` directory to keep it decoupled from the frontend application.
- **Authentication:** The initial implementation will not have authentication, but the architecture should allow for JWT-based token authentication to be added in a future iteration.

### 2.1. Data Models

The following data structures will be used to manage the state of the jam sessions on the server.

```typescript
interface Participant {
  id: string;      // Unique ID, derived from socket.id
  name: string;    // User-provided display name
  instrument: string; // e.g., 'drums', 'piano'
}

interface Session {
  id: string;      // The unique room code
  participants: Map<string, Participant>;
  hostId: string;
  // Add other session-specific data, e.g., host, settings
}
```

### 2.2. Communication Protocol (Socket.IO Events)

The interaction between the client (React app) and the server will be managed through the following events:

#### **Client-to-Server Events:**

*   `session:create`: Client requests to create a new session.
    *   **Payload:** `{ name: string }`
    *   **Description:** A user requests to create a new jam session. The `name` is their display name.
*   `session:join`
    *   **Payload:** `{ roomCode: string, name: string }`
    *   **Description:** A user attempts to join an existing session using a room code.
*   `session:leave`
    *   **Payload:** `{ roomCode: string }`
    *   **Description:** A user notifies the server they are leaving the session.
*   `event:broadcast`
    *   **Payload:** `{ roomCode: string, eventName: string, payload: any }`
    - **Description:** A client sends a musical event (e.g., a drum hit, a note played) to be broadcast to all other participants in the room.

#### **Server-to-Client Events:**

*   `session:created`
    *   **Payload:** `{ roomCode: string, userId: string }`
    *   **Description:** Confirms to the creator that the session is ready and provides their unique ID.
*   `session:joined`
    *   **Payload:** `{ roomCode: string, participants: Participant[], userId: string }`
    *   **Description:** Confirms to the joining user that they are in the session and provides the list of current participants.
*   `session:user-joined`
    *   **Payload:** `{ user: Participant }`
    *   **Description:** Notifies all clients in a room that a new user has joined.
*   `session:user-left`
    *   **Payload:** `{ userId: string }`
    *   **Description:** Notifies all clients in a room that a user has disconnected.
*   `event:broadcast`
    *   **Payload:** `{ eventName: string, payload: any, senderId: string }`
    *   **Description:** Relays a musical event from one user to all other users in the session.
*   `error`
    *   **Payload:** `{ message: string }`
    *   **Description:** Informs a client of an error (e.g., "Session not found", "Name already taken").

---

## 3. Stories

### Story 7.1: Session Server Foundation

*As a developer, I want to set up a basic Node.js server with Socket.IO so that a foundation for real-time communication is established.*

**Acceptance Criteria:**
1. A new `server` directory is created in the project root with a basic `package.json` and `tsconfig.json`.
2. The server, when started, initializes Socket.IO and listens on a configurable port (e.g., 3001).
3. The server logs a confirmation message to the console when a client successfully connects.
4. A new script is added to the root `package.json` (e.g., `npm run dev:server`) to run the server in development mode.

### Story 7.2: Session & Participant Management

*As a user, I want to be able to create or join a jam session so that I can collaborate with others.*

**Acceptance Criteria:**
1. A client can emit a `session:create` event to the server.
2. The server responds with a `session:created` event containing a unique, shareable room code.
3. A client can emit a `session:join` event with a room code.
4. If the room exists, the server adds the user to the room and broadcasts a `session:user-joined` event to all other clients in that room.
5. If the room does not exist, the server emits an `error` event back to the requesting client.
6. When a client disconnects, the server broadcasts a `session:user-left` event to all remaining clients in that room.

### Story 7.3: Real-time Event Broadcasting

*As a user, I want my musical actions to be seen and heard by everyone else in my jam session in real-time.*

**Acceptance Criteria:**
1. A client can send a `event:broadcast` message containing a payload (e.g., `{ type: 'drum_hit', note: 'C4' }`).
2. The server receives this message and relays it to all other clients in the same session/room.
3. The originating client does *not* receive their own broadcasted event back from the server.
4. The frontend `JamSession.tsx` component is updated to connect to the WebSocket server and can send and receive these events.

---

## 4. Definition of Done

- All stories are implemented and have passed their acceptance criteria.
- The `/jam` frontend view can successfully connect to the new backend, create/join a session, and send/receive basic musical events with another client.
- The new backend service is documented with a basic `README.md` within the `/server` directory.
- The solution is approved by the Product Owner (Sarah) and Architect (Winston).

## 5. Stakeholder Validation Notes (2025-10-13)

**Validated by:** PM (YOLO Mode - Pragmatic Assumptions)

**Technical Decisions:**
- ✅ Node.js + Socket.IO approved (no alternatives needed)
- ✅ Deployment: Separate backend service (Railway/Fly.io/similar)
- ✅ Architecture: Decoupled from Vercel frontend

**Scope Validation:**
- ✅ 3 stories sufficient for MVP
- ✅ High priority confirmed
- ✅ No blocking dependencies identified

**Implementation Status:**
- ⚠️ Story 7.1: Documentation complete, implementation pending
- 📋 `/server` directory does not exist yet - needs creation
