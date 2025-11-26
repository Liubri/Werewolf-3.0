# Real-Time Werewolf Game

A full-stack Werewolf (狼人杀) web game built with React, Vite, Tailwind CSS, Node.js, Express, and Socket.io.

## Project Structure

```
/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI Components (Lobby, GameRoom, etc.)
│   │   ├── context/        # Socket Context
│   │   ├── hooks/          # Custom Hooks
│   │   ├── types/          # Shared Types
│   │   └── App.tsx         # Main Entry
│   └── ...
├── server/                 # Backend (Node + Express)
│   ├── src/
│   │   ├── game/           # Core Game Logic (Game, Player, GameManager)
│   │   ├── roles/          # Role Definitions (Werewolf, Seer, etc.)
│   │   └── server.ts       # Entry Point & Socket Handlers
│   └── ...
└── README.md
```

## How to Run Locally

1.  **Backend**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
    Server runs on `http://localhost:3001`.

2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    Client runs on `http://localhost:5173`.

## Deployment

### Backend
1.  Build the TypeScript code: `npm run build`.
2.  Deploy the `dist` folder and `package.json` to a Node.js host (Heroku, Railway, AWS, etc.).
3.  Set `PORT` environment variable.
4.  Start with `npm start` (ensure it runs `node dist/server.js`).

### Frontend
1.  Update the socket URL in `client/src/context/SocketContext.tsx` to point to your production backend URL.
2.  Build the project: `npm run build`.
3.  Deploy the `dist` folder to a static host (Vercel, Netlify, S3, etc.).

## How to Add New Roles

1.  **Define Role Type**:
    Add the new role to `RoleType` enum in `server/src/game/types.ts` and `client/src/types/game.ts`.

2.  **Create Role Class**:
    Create a new file in `server/src/roles/` (e.g., `Bodyguard.ts`).
    Extend the `Role` class and implement:
    - `type`, `team`, `name`, `description`
    - `wakeOrder` (when do they wake up?)
    - `handleNightAction(game, player, targetId)`

3.  **Register Role**:
    In `server/src/game/Game.ts`:
    - Import the new role class.
    - Update `assignRoles` to include it in the distribution logic.
    - Update `startNightPhase` if it needs special handling (though `wakeOrder` should handle most).
    - Update `handleNightAction` in `server.ts` to dispatch actions for this role type.

4.  **Frontend Support**:
    - Update `RoleCard.tsx` to add a color/icon for the new role.
    - Update `ActionPanel.tsx` to show appropriate buttons/actions when it's night and the player has this role.

## Socket Events

- **Client -> Server**:
    - `createGame({ playerName })`
    - `joinGame({ gameId, playerName })`
    - `startGame()`
    - `nightAction({ action, targetId })`
    - `vote({ targetId })`

- **Server -> Client**:
    - `gameCreated({ gameId })`
    - `gameJoined({ gameId })`
    - `gameState(state)` - Full state update
    - `SEER_RESULT({ targetName, isWerewolf })` - Private message
