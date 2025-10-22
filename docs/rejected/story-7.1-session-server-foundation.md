# Story 7.1: Session Server Foundation

**Epic:** 7 - Real-Time Jam Session Backend
**Status:** Ready for Development
**Priority:** High
**Complexity:** Low
**Note:** Documentation complete, implementation pending (server/ directory does not exist)

## Brief Description

This story establishes the foundational Node.js server using Socket.IO. It involves creating the basic project structure, installing dependencies, and setting up a simple, runnable server that can accept connections. This is the first step in building the real-time backend for the collaborative jam session feature.

---

## Story

**As a** developer,
**I want** to set up a basic Node.js server with Socket.IO,
**so that** a stable and scalable foundation for real-time communication is established for the jam session feature.

---

## Background / Context

### Current State
The project currently has a frontend-only implementation of the `/jam` view (`src/components/JamSession/JamSession.tsx`). All state is managed locally. There is no backend service to synchronize state between different users, making real-time collaboration impossible.

### Design Philosophy Alignment
This story initiates the creation of a decoupled backend service. By creating a separate Node.js application in a `/server` directory, we keep the frontend and backend concerns separate, which aligns with modern web architecture principles and simplifies development, testing, and deployment for each part of the application.

### User Pain Points
- Users cannot collaborate or play music with others in real-time.
- The current application is a single-player experience, limiting its potential for community engagement and creative interaction.

---

## Acceptance Criteria

### AC 1: Dedicated Server Directory ✅
**Given** I am in the project's root directory,
**When** I look at the directory structure,
**Then** I see a new top-level directory named `server`.

### AC 2: Independent Node.js Project ✅
**Given** the `server` directory exists,
**When** I inspect its contents,
**Then** I find a `package.json` file, making it a self-contained Node.js project.

### AC 3: Correct Dependencies Installed ✅
**Given** the `server` project is set up,
**When** I inspect its `package.json`,
**Then** I see `socket.io` as a dependency and `typescript`, `ts-node`, `nodemon`, `@types/node` as dev dependencies.

### AC 4: TypeScript Configuration ✅
**Given** the `server` project is set up,
**When** I inspect its contents,
**Then** I find a `tsconfig.json` file configured for a Node.js/CommonJS environment.

### AC 5: Server Listens for Connections ✅
**Given** the server is started,
**When** I check the console output,
**Then** I see a message confirming "Socket.IO server running on port 3001".

### AC 6: Connection Logging ✅
**Given** the server is running,
**When** a client connects to the WebSocket server,
**Then** a "Client connected: [socket.id]" message is logged to the console.
**And** when that client disconnects, a "Client disconnected: [socket.id]" message is logged.

### AC 7: Easy-to-Use Dev Scripts ✅
**Given** I am in the project's root directory,
**When** I run `npm run dev:server`,
**Then** the backend server starts using `nodemon` for automatic restarts on file changes.

---

## Technical Specifications

### New Directory Structure
A new `server` directory will be created at the root of the repository.

```
/
├── server/
│   ├── src/
│   │   └── index.ts       # Main server entry point
│   ├── package.json       # Server-specific dependencies
│   └── tsconfig.json      # TypeScript config for the server
└── ... (existing project files)
```

### `package.json` Scripts
The following scripts will be added:

1.  **In `server/package.json`:**
    ```json
    "scripts": {
      "build": "tsc",
      "start": "node dist/index.js",
      "dev": "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/index.ts"
    }
    ```
2.  **In the root `package.json`:**
    ```json
    "scripts": {
      "dev:server": "npm run dev --prefix server",
      // ... other scripts
    }
    ```

### `tsconfig.json` for Server
This configuration ensures Node.js compatibility and proper module resolution.
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### Core Server Logic (`server/src/index.ts`)
A basic HTTP server is created to host the Socket.IO server, which allows for future flexibility. CORS is configured to allow connections from any origin during development.

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // For development purposes. Will be restricted later.
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
```

---

## Manual Verification Plan

To confirm this story is complete, follow these steps:

1.  **Verify File Structure**: Check that the `server` directory and its initial files (`package.json`, `tsconfig.json`, `src/index.ts`) have been created.
2.  **Install Dependencies**: Run `npm install` inside the `server` directory.
3.  **Run the Server**: From the **root** of the project, run `npm run dev:server`.
4.  **Check Console Output**: Confirm that the terminal shows "Socket.IO server running on port 3001".
5.  **Test Connection**:
    *   Open the web application in your browser (`http://localhost:5173`).
    *   Open the browser's developer console.
    *   Execute the following JavaScript snippet: `const socket = io("http://localhost:3001");`
    *   Check the **Node.js server terminal**. It should log a "Client connected: ..." message.
    *   In the browser console, execute `socket.disconnect()`.
    *   Check the **Node.js server terminal** again. It should log a "Client disconnected: ..." message.

---

## Risks and Considerations

- **Port Conflict**: The server defaults to port `3001` to avoid conflict with the frontend dev server (typically `5173`). This should be documented for other developers.
- **CORS**: The current configuration `origin: "*"` is permissive for development. This **must** be tightened to the specific frontend domain before any production deployment. This will be addressed in a future story.