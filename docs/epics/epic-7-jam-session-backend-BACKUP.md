# Epic 7: Jam Session Backend Infrastructure (Supabase Realtime)

**Status:** 📝 **PLANNING**
**Priority:** High
**Target Completion:** Q1 2025

**Epic Goal**: Build real-time collaborative backend infrastructure to enable session creation, participant management, room joining, and state synchronization for the `/jam` route using Supabase Realtime.

**Business Requirements**:
- Enable true multi-user collaboration for remote/hybrid jam sessions
- Provide reliable session management with room codes (shareable links)
- Real-time state synchronization for participants, tempo, patterns, and playback
- Foundation for future collaborative features (Epic 6 WLED sync, multi-instrument coordination, user accounts, license management)
- Professional-grade reliability (session persistence, reconnection handling)
- **Cost-effective MVP** - Stay on Supabase free tier until product-market fit proven

**Technical Requirements**:
- **Supabase Realtime** for WebSocket communication (Broadcast + Presence features)
- **Supabase Database** (Postgres) for session persistence and future user accounts/licenses
- Session/participant data models with TypeScript type safety
- Client-side service layer for Supabase Realtime abstraction
- Integration with existing GlobalMusicContext and JamSession UI
- **No separate backend server needed** - serverless architecture

---

## Problem Statement

The current `/jam` route has a **complete front-end UI** for collaborative sessions (session code display, user list tab, leave session button, tab navigation) but **no functional backend**. Users cannot:
- Create or join real sessions (session code is hardcoded/fake)
- See other participants or their status
- Share state changes (tempo, patterns, playback control)
- Experience real-time collaboration

**Strategic Decision**: This epic uses **Supabase Realtime** instead of a custom Socket.IO server for several reasons:
- **$0/month for MVP** (free tier: 200 concurrent connections, 2M messages/month)
- **Database included** for future license keys, user accounts
- **Auth included** for future user management
- **~75% less code** than custom backend (no server management)
- **Production-ready** from day one (no deployment infrastructure needed)
- **Already familiar** - team has Supabase experience from other projects

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
5. Create `src/lib/supabase.ts` with client initialization
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
1. Implement `SessionManager` class with methods:
   - `createSession(hostSocketId: string): Session` - Create new session with unique room code
   - `joinSession(roomCode: string, socketId: string, userName: string): Participant | Error`
   - `leaveSession(roomCode: string, socketId: string): void`
   - `getSession(roomCode: string): Session | null`
   - `deleteSession(roomCode: string): void`
2. Define TypeScript interfaces (align with `docs/architecture/jam-session-backend.md`):
   ```typescript
   interface Participant {
     id: string;            // socket.id
     name: string;          // User display name
     isHost: boolean;       // First user is host
     joinedAt: Date;
   }

   interface Session {
     id: string;            // Room code (6 digits)
     participants: Map<string, Participant>;
     createdAt: Date;
     hostId: string;        // socket.id of host
   }
   ```
3. Implement Socket.IO event handlers:
   - `session:create` → `session:created { roomCode }`
   - `session:join { roomCode, userName }` → `session:joined { roomCode, participants }` + broadcast `session:user-joined { user }`
   - `session:leave { roomCode }` → broadcast `session:user-left { userId }`
   - `disconnect` → auto-leave session, broadcast to room
4. Add session cleanup:
   - Delete empty sessions (no participants)
   - Optional: Session expiration after 24 hours of inactivity
5. Add error handling:
   - Room not found → `error { message: "Room not found" }`
   - Room full (future enhancement: max 10 participants)
   - Invalid room code format

**Integration Verification**:
- **IV1**: User A creates session, receives unique room code
- **IV2**: User B joins session with room code, both see each other in participant list
- **IV3**: User leaves session, other users notified immediately
- **IV4**: Browser close (disconnect) triggers automatic leave
- **IV5**: Empty sessions are deleted automatically

**Deliverables**:
- `server/src/sessions/SessionManager.ts` - Session lifecycle logic
- `server/src/types/session.ts` - TypeScript interfaces
- Updated `server/src/index.ts` - Socket.IO event handlers

---

### **Story 7.3: Client-Side Socket Service Integration** 🔴 **HIGH**
**Status:** PLANNING
**Complexity:** Medium
**Prerequisites:** Story 7.2

**Goal:** Create client-side TypeScript service to abstract WebSocket communication.

**Acceptance Criteria**:
1. Create `src/services/sessionSocket.ts` with Socket.IO client:
   ```typescript
   class SessionSocketService {
     private socket: Socket | null;

     connect(serverUrl: string): Promise<void>
     disconnect(): void

     // Session methods
     createSession(): Promise<{ roomCode: string }>
     joinSession(roomCode: string, userName: string): Promise<{ participants: Participant[] }>
     leaveSession(): Promise<void>

     // Event listeners
     onUserJoined(callback: (user: Participant) => void): void
     onUserLeft(callback: (userId: string) => void): void
     onError(callback: (error: string) => void): void
   }
   ```
2. Add environment variable for WebSocket server URL:
   - Development: `ws://localhost:3001`
   - Production: `wss://jam-session-server.railway.app` (or Render URL)
3. Implement automatic reconnection with exponential backoff
4. Add connection status tracking (disconnected, connecting, connected, error)
5. Export singleton instance: `export const sessionSocket = new SessionSocketService()`

**Integration Verification**:
- **IV1**: Service connects to backend server successfully
- **IV2**: TypeScript types match server-side interfaces
- **IV3**: Connection status updates reflect actual server state
- **IV4**: Reconnection logic works after server restart

**Deliverables**:
- `src/services/sessionSocket.ts` - Client-side Socket.IO service
- `src/types/session.ts` - Shared TypeScript types (aligned with server)
- `.env.development` and `.env.production` - WebSocket server URLs

---

### **Story 7.4: JamSession UI Integration & Participant Management** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** Medium
**Prerequisites:** Story 7.3

**Goal:** Connect existing JamSession UI to functional backend, enable real session creation/joining.

**Acceptance Criteria**:
1. Update `src/components/JamSession/JamSession.tsx`:
   - Replace hardcoded session code with real room code from backend
   - Call `sessionSocket.createSession()` on component mount (host mode)
   - Display connection status indicator
2. Create session join flow:
   - Add optional `roomCode` prop to `<JamSession roomCode={code} />`
   - If `roomCode` provided, call `sessionSocket.joinSession(roomCode, userName)`
   - Prompt user for display name before joining (modal or inline form)
3. Update "Users" tab to display real participants:
   - Show all participants from `session.participants`
   - Indicate host with badge/icon
   - Show connection status (connected/disconnected)
   - Display join timestamps
4. Implement "Leave Session" button functionality:
   - Call `sessionSocket.leaveSession()`
   - Trigger `onLeaveSession()` callback
5. Add real-time participant updates:
   - Listen to `sessionSocket.onUserJoined()` → update participant list
   - Listen to `sessionSocket.onUserLeft()` → remove participant from list
6. Add user presence indicators (connected/disconnected states)

**Integration Verification**:
- **IV1**: Creating session generates real room code (6 digits)
- **IV2**: Copying room code and joining in new browser tab works
- **IV3**: Participant list updates in real-time when users join/leave
- **IV4**: Host designation is clear and accurate
- **IV5**: Leave session functionality works from both client and server side
- **IV6**: Connection lost/reconnected scenarios handled gracefully

**Deliverables**:
- Updated `src/components/JamSession/JamSession.tsx` - Backend integration
- Updated `src/components/JamSession/UserList.tsx` - Real participant display
- `src/components/JamSession/JoinSessionModal.tsx` - Username prompt modal
- Manual verification checklist document

---

### **Story 7.5: Session State Synchronization (MVP)** 🟡 **MEDIUM**
**Status:** PLANNING
**Complexity:** High
**Prerequisites:** Story 7.4

**Goal:** Synchronize basic session state (tempo, playback control) between participants.

**Acceptance Criteria**:
1. Extend `Session` data model to include shared state:
   ```typescript
   interface SessionState {
     tempo: number;         // Global tempo for session
     isPlaying: boolean;    // Master playback state
     currentStep: number;   // Shared sequencer position (optional)
   }

   interface Session {
     // ... existing fields
     state: SessionState;
   }
   ```
2. Add Socket.IO events for state sync:
   - `state:tempo-change { tempo }` → broadcast to all participants
   - `state:playback-control { isPlaying }` → broadcast to all
   - `state:request-sync` → server sends full session state
3. Update client-side service:
   ```typescript
   // In sessionSocket.ts
   onTempoChange(callback: (tempo: number) => void): void
   onPlaybackChange(callback: (isPlaying: boolean) => void): void
   updateTempo(tempo: number): Promise<void>
   updatePlayback(isPlaying: boolean): Promise<void>
   ```
4. Integrate with GlobalMusicContext:
   - When user changes tempo in header, broadcast to session
   - When receiving tempo change, update GlobalMusicContext (if in session)
5. Add host-only controls (future enhancement: democratize later):
   - Only host can trigger global play/stop
   - All users can adjust their local volume
6. Implement state reconciliation on reconnection:
   - Request full session state on reconnect
   - Update local state to match server

**Integration Verification**:
- **IV1**: Host adjusting tempo updates all connected participants' UI
- **IV2**: Participant adjusting tempo updates everyone (or shows error if host-only)
- **IV3**: Play/stop commands synchronize across all participants
- **IV4**: Reconnecting participant receives current session state
- **IV5**: No race conditions or state conflicts during rapid changes

**Deliverables**:
- Updated `server/src/sessions/SessionManager.ts` - State management
- Updated `server/src/index.ts` - State sync event handlers
- Updated `src/services/sessionSocket.ts` - State sync methods
- Updated `src/components/JamSession/JamSession.tsx` - State integration
- Updated `src/contexts/GlobalMusicContext.tsx` - Session awareness

---

### **Story 7.6: Session URL Routing & Shareable Links** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Low
**Prerequisites:** Story 7.4

**Goal:** Enable shareable session URLs for easy joining.

**Acceptance Criteria**:
1. Update routing in `App.tsx`:
   - Add dynamic route: `/jam/:roomCode?`
   - Parse `roomCode` from URL params
   - Pass to `<JamSession roomCode={roomCode} />`
2. Implement "Share Session" feature:
   - Copy button for full URL (e.g., `https://jam-dev.audiolux.app/jam/A3B7K9`)
   - Show shareable URL in session header
   - Optional: Generate QR code for mobile scanning
3. Handle invalid room codes:
   - Show error message if room not found
   - Redirect to lobby or home page
4. Add URL state persistence:
   - Preserve room code in browser history
   - Handle browser back/forward navigation

**Integration Verification**:
- **IV1**: Sharing URL allows new user to join session directly
- **IV2**: Invalid room code shows appropriate error message
- **IV3**: Browser back button doesn't break session state
- **IV4**: Copy button works on all browsers (clipboard API)

**Deliverables**:
- Updated `src/App.tsx` - Dynamic routing for room codes
- Updated `src/components/JamSession/JamSession.tsx` - Room code from URL
- `src/components/JamSession/ShareSessionButton.tsx` - Share UI component

---

### **Story 7.7: Monitoring, Logging & Error Recovery** 🟢 **LOW**
**Status:** PLANNING
**Complexity:** Low
**Prerequisites:** Story 7.5

**Goal:** Add production-grade monitoring and error handling.

**Acceptance Criteria**:
1. Server-side structured logging:
   - Log session lifecycle events (created, joined, left)
   - Log WebSocket connections/disconnections
   - Log errors with stack traces
   - Include session metadata (room code, participant count)
2. Client-side error handling:
   - Graceful degradation when server unavailable
   - User-friendly error messages (not raw WebSocket errors)
   - Retry logic with exponential backoff
3. Add metrics tracking:
   - Active session count
   - Total participant count
   - Average session duration
   - Connection error rate
4. Optional: Integrate error tracking service (Sentry)
5. Add admin endpoint for session statistics (secured):
   - `GET /api/stats` → JSON with active sessions, participants

**Integration Verification**:
- **IV1**: Logs provide clear audit trail of session activity
- **IV2**: Server errors don't crash the entire server
- **IV3**: Client shows helpful error messages, not technical details
- **IV4**: Admin endpoint requires authentication (basic auth or API key)

**Deliverables**:
- Updated `server/src/index.ts` - Structured logging, error handling
- `server/src/middleware/auth.ts` - Admin endpoint authentication (optional)
- `src/utils/errorMessages.ts` - User-friendly error message mapping
- Monitoring dashboard setup guide (optional)

---

## Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         React Frontend (Vite)               │
│  ┌──────────────────────────────────┐       │
│  │   JamSession Component           │       │
│  │  - Session UI                    │       │
│  │  - Participant List              │       │
│  │  - State Controls                │       │
│  └──────────────────────────────────┘       │
│              ↕ (Socket.IO Client)           │
│  ┌──────────────────────────────────┐       │
│  │   sessionSocket.ts               │       │
│  │  - WebSocket abstraction         │       │
│  │  - Event listeners               │       │
│  │  - Reconnection logic            │       │
│  └──────────────────────────────────┘       │
└─────────────────────────────────────────────┘
                    ↕ WSS
┌─────────────────────────────────────────────┐
│      Node.js Backend (Railway/Render)       │
│  ┌──────────────────────────────────┐       │
│  │   Socket.IO Server               │       │
│  │  - Event routing                 │       │
│  │  - CORS config                   │       │
│  │  - Connection handling           │       │
│  └──────────────────────────────────┘       │
│              ↕                              │
│  ┌──────────────────────────────────┐       │
│  │   SessionManager                 │       │
│  │  - Room lifecycle                │       │
│  │  - Participant management        │       │
│  │  - State synchronization         │       │
│  │  - In-memory storage (Map)       │       │
│  └──────────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

### Data Models (TypeScript)

```typescript
// Shared types (client + server)
interface Participant {
  id: string;              // socket.id
  name: string;            // Display name
  isHost: boolean;         // First user = host
  joinedAt: Date;
}

interface SessionState {
  tempo: number;           // BPM (synced from GlobalMusicContext)
  isPlaying: boolean;      // Master playback control
  currentStep: number;     // Optional: shared sequencer position
}

interface Session {
  id: string;              // Room code (6-digit alphanumeric)
  participants: Map<string, Participant>;
  state: SessionState;
  createdAt: Date;
  hostId: string;          // socket.id of host
}
```

### Socket.IO Event Protocol

**Client → Server:**
- `session:create` → Server creates session, returns `{ roomCode }`
- `session:join { roomCode, userName }` → Join existing session
- `session:leave { roomCode }` → Leave session
- `state:tempo-change { tempo }` → Update tempo
- `state:playback-control { isPlaying }` → Update playback state

**Server → Client:**
- `session:created { roomCode }` → Confirmation with room code
- `session:joined { roomCode, participants }` → Joined successfully
- `session:user-joined { user }` → Broadcast new participant
- `session:user-left { userId }` → Broadcast departed participant
- `state:tempo-change { tempo }` → Broadcast tempo update
- `state:playback-control { isPlaying }` → Broadcast playback update
- `error { message }` → Error notification

### Deployment Configuration

**Development:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:3001` (Node.js)
- WebSocket: `ws://localhost:3001`

**Production:**
- Frontend: `https://jam-dev.audiolux.app` (Vercel)
- Backend: `https://jam-session-server.railway.app` (or Render)
- WebSocket: `wss://jam-session-server.railway.app`

---

## Integration Strategy

**Phase 1 - Server Foundation** (Story 7.1):
- Set up backend server and deployment
- No frontend changes yet

**Phase 2 - Session Lifecycle** (Stories 7.2-7.3):
- Implement session management backend
- Create client-side Socket service
- Integration tests with simple HTML client (not full JamSession yet)

**Phase 3 - UI Integration** (Stories 7.4, 7.6):
- Connect JamSession component to backend
- Enable real session creation/joining
- Shareable URLs

**Phase 4 - State Sync & Polish** (Stories 7.5, 7.7):
- Synchronize tempo/playback
- Add monitoring and error handling

---

## Success Metrics

**Technical Performance:**
- Session creation completes in <500ms
- Participant join/leave updates propagate in <200ms
- State changes (tempo) sync in <100ms
- Server handles 50+ concurrent sessions (scalability test)
- WebSocket reconnection succeeds within 3 attempts

**User Experience:**
- Users can create/join sessions with <3 clicks
- Shareable URLs work reliably across devices
- Participant list updates feel instant
- No data loss during network interruptions (graceful reconnection)

---

## Risk Assessment & Mitigation

### Risk 1: WebSocket Connection Instability (Mobile Networks)
**Severity:** High
**Mitigation:**
- Implement robust reconnection logic with exponential backoff
- Store session state on client for recovery after reconnect
- Show connection status indicator to user
- Test on mobile hotspots and flaky WiFi

### Risk 2: State Synchronization Race Conditions
**Severity:** Medium
**Mitigation:**
- Use server as single source of truth (no peer-to-peer state)
- Implement last-write-wins strategy with timestamps (future enhancement)
- Limit state update frequency (debounce rapid changes)
- Add server-side validation for state changes

### Risk 3: Server Scaling Limitations (In-Memory Storage)
**Severity:** Medium
**Mitigation:**
- **MVP**: In-memory Map storage (acceptable for <100 sessions)
- **Future**: Migrate to Redis for session persistence and horizontal scaling
- Document migration path in architecture document
- Monitor session count and set alerts for capacity

### Risk 4: CORS & WebSocket Security
**Severity:** Low
**Mitigation:**
- Strict CORS configuration (whitelist specific origins)
- Rate limiting on session creation (prevent abuse)
- Optional: Basic authentication for session creation (future enhancement)
- Validate room codes server-side (prevent injection attacks)

---

## Future Enhancements (Post-MVP)

### Phase 2 - Advanced Collaboration
- **Pattern Sharing**: Broadcast drum patterns between users
- **Per-User Instruments**: Each user controls specific tracks (drummer, bassist, keys)
- **Chat/Messaging**: Text chat within session
- **Session Recording**: Save session history for replay

### Phase 3 - Persistent Sessions
- **Database Integration**: PostgreSQL or MongoDB for session persistence
- **User Accounts**: Authentication, profile pictures, saved sessions
- **Session History**: Browse past sessions, re-join previous rooms
- **Private Sessions**: Password-protected rooms

### Phase 4 - Advanced Features
- **Audio Streaming**: WebRTC peer-to-peer audio (Epic 6 Story 6.5)
- **WLED Sync**: Synchronized LED visualizations (Epic 6)
- **Session Templates**: Pre-configured musical modes (jazz, EDM, acoustic)
- **Spectator Mode**: Watch sessions without participating

---

## Dependencies & Prerequisites

### External Dependencies
- **Epic 4 (Complete)**: GlobalMusicContext provides tempo/key/scale state
- **Existing JamSession UI**: Front-end components already built
- **Architecture Document**: `docs/architecture/jam-session-backend.md` defines protocol

### New Dependencies
- **Backend**: `socket.io` (4.7.5), `express` (4.x), `dotenv`, `winston`
- **Frontend**: `socket.io-client` (4.7.5)
- **Deployment**: Railway or Render account, domain configuration

---

## Testing Strategy

### Manual Testing (Per CLAUDE.md Guidelines)
- **Story 7.1-7.2**: Postman or websocat for WebSocket testing
- **Story 7.3-7.4**: Browser DevTools Network tab, multiple browser tabs
- **Story 7.5**: Two devices (desktop + mobile), tempo/playback sync verification
- **Story 7.6**: Share URL via email/SMS, test on different devices
- **Story 7.7**: Simulate network failures (DevTools throttling), check logs

### Browser Testing
- Chrome/Edge (primary)
- Firefox (secondary)
- Safari iOS (mobile)
- Chrome Android (mobile)

### Network Conditions
- Fast WiFi (baseline)
- Slow 3G (mobile simulation)
- Airplane mode → reconnect (recovery testing)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-13 | 1.0 | Initial epic creation for Jam Session Backend | Sarah (PO) |

---

## Next Steps

1. **Get stakeholder approval** on this epic structure and story breakdown
2. **Prioritize stories** for sprint planning (recommend Stories 7.1-7.4 for MVP)
3. **Review architecture document** (`docs/architecture/jam-session-backend.md`) and update if needed
4. **Set up development environment** (Node.js version, Railway/Render account)
5. **Create Story 7.1 detailed document** and hand off to dev agent

---

## Git Commit Strategy

**Per Story Commits:**
- Story 7.1: `feat: implement session server foundation and deployment (Story 7.1)`
- Story 7.2: `feat: implement session lifecycle and participant management (Story 7.2)`
- Story 7.3: `feat: add client-side socket service integration (Story 7.3)`
- Story 7.4: `feat: integrate JamSession UI with backend (Story 7.4)`
- Story 7.5: `feat: add session state synchronization (Story 7.5)`
- Story 7.6: `feat: add shareable session URLs (Story 7.6)`
- Story 7.7: `feat: add monitoring and error recovery (Story 7.7)`

**Branch Strategy:**
- `epic-7-jam-session-backend` (main epic branch)
- `story-7.1-session-server` (per-story feature branches)
- `story-7.2-session-management`
- etc.
