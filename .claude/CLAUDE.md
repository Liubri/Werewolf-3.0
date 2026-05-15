# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time Werewolf (狼人杀) game built with a full-stack TypeScript architecture:
- **Backend**: Node.js + Express + Socket.io + TypeScript (port 3001)
- **Frontend**: Next.js 9+ with React 19 + Socket.io client + Tailwind CSS (port 3173)
- **Communication**: Socket.io for real-time game state synchronization

The game implements a turn-based social deduction game with multiple role types, each with unique abilities and win conditions.

## Key Commands

### Backend (Server)
```bash
cd server
npm install              # Install dependencies
npm run dev             # Start dev server (tsx watches files)
npm run build           # Build TypeScript to dist/
npm start               # Run compiled dist/server.js (for production)
```

### Frontend (Client)
```bash
cd client
npm install             # Install dependencies
npm run dev            # Start Next.js dev server
npm run build          # Build for production
npm start              # Run production build locally
npm run lint           # Run ESLint
```

### Common Workflows
- **Full stack dev**: Run `npm run dev` in both `server/` and `client/` directories in separate terminals
- **Testing changes**: Frontend hot-reloads; server needs restart after code changes

## Core Architecture

### Backend Structure
```
server/src/
├── server.ts           # Express app, Socket.io initialization, event handlers
├── game/
│   ├── Game.ts        # Core game logic: phase management, player handling, night/day cycles
│   ├── GameManager.ts # Maps games and players to socket IDs
│   ├── Player.ts      # Player entity with role and status
│   └── types.ts       # GamePhase, Team, RoleType enums
└── roles/
    ├── Role.ts        # Abstract base class for all roles
    └── [RoleType].ts  # Concrete role implementations (Werewolf, Seer, Witch, etc.)
```

### Frontend Structure
```
client/src/
├── app/
│   ├── page.tsx       # Root page (shows Lobby or GameRoom based on game state)
│   ├── layout.tsx     # App layout
│   └── providers.tsx  # Socket context provider
├── components/
│   ├── Lobby.tsx      # Game creation/joining UI
│   ├── GameRoom.tsx   # Main game UI (coordinates all game phases)
│   ├── ActionPanel.tsx # Night action selection for active roles
│   ├── RoleCard.tsx   # Role display with icons/colors
│   ├── PlayerGrid.tsx # Grid showing all players and their states
│   └── HunterRevengeModal.tsx # Revenge action modal for Hunter role
├── context/
│   └── SocketContext.tsx # Socket.io setup, gameState management, event subscriptions
└── types/
    └── game.ts        # GameState interface and type definitions
```

### Game Flow & State Machine

**Phases** (defined in `types.ts: GamePhase`):
1. **LOBBY**: Waiting for players, host can start game
2. **NIGHT**: Roles with night actions wake up in order (sorted by `wakeOrder`)
3. **DAY**: Discussion phase (no voting actions)
4. **VOTING**: Day vote to eliminate one player
5. **GAME_OVER**: One team has won

**Night Phase Mechanics**:
- Roles wake sequentially by `wakeOrder` value
- Each role can perform one action (target another player, use power, etc.)
- `handleNightAction()` in each Role class processes the night action
- State changes broadcast to all players (but sensitive data only to relevant roles via `onPrivateMessage`)

**Game State Broadcast**:
- `broadcastState()` sends full public game state to all players
- `onPrivateMessage()` sends role-specific info only to that player (e.g., Seer results, Witch poisons)

### Role System (Extensible)

Each role extends `Role` abstract class and implements:
- **type**: RoleType enum value
- **team**: VILLAGER or WEREWOLF team
- **name** / **description**: Display strings
- **wakeOrder**: Order during night phase (higher = later; -1 = doesn't wake)
- **handleNightAction(game, player, targetId?, data?)**: Executes role's night action

Current roles: Werewolf, Villager, Seer, Witch, Dreamkeeper, Hunter, WolfBeauty, Magician, Guard, Demonhunter, Knight, Gravedigger, Fool, Crow, Miracle Merchant

**Adding a new role**:
1. Create `server/src/roles/NewRole.ts` extending `Role`
2. Add `NEWROLE = 'NEWROLE'` to `RoleType` enum in `server/src/game/types.ts` and `client/src/types/game.ts`
3. Import and register in `Game.ts: assignRoles()`
4. Update `handleNightAction` dispatcher in `server.ts` if special handling needed
5. Add UI styling in `client/components/RoleCard.tsx`
6. Add action buttons in `client/components/ActionPanel.tsx` (if role has night actions)

### Socket Event Flow

**Client → Server**:
- `createGame({ playerName })` → receives `gameCreated` with gameId
- `joinGame({ gameId, playerName })` → receives `gameJoined`
- `startGame()` → triggers role assignment, broadcasts state
- `nightAction({ action, targetId })` → submit night action
- `vote({ targetId })` → submit day vote

**Server → Client**:
- `gameState` → full game state (players, phase, roles, player statuses)
- `SEER_RESULT` / role-specific events → private messages for sensitive role info
- `error` → error messages

All clients in a game room receive state updates; private role data sent only to relevant players.

## Important Patterns

### Managing Game State
- `Game.ts` is the single source of truth; all logic flows through it
- `GameManager.ts` maintains socket-to-game/player mappings for event routing
- Frontend `SocketContext.tsx` subscribes to `gameState` events and manages local React state
- Avoid client-side game logic; server validates and applies all actions

### Night Action Handling
- `handleNightAction()` in roles must validate targets and check kill/protect constraints
- Multi-step role powers (e.g., Hunter revenge, Magician swap) store intermediate state in `Game` class
- Use `nightKillTarget`, `protectedTarget`, `charmedTarget`, etc. to track pending night actions before commit

### Frontend Event Subscription
- `useSocket()` hook in `SocketContext.tsx` provides `gameState`, socket reference, and event emitters
- Event listeners registered in `useEffect` (watch for cleanup)
- Always check `gameState` exists before rendering (can be null during init)

## TypeScript Configuration

- **Server**: ES2020 target, CommonJS modules, strict mode enabled
- **Client**: Next.js defaults (ES2020+, ESM), TypeScript strict mode
- Type definitions shared between client and server via `types/game.ts`

## Known Constraints & Notes

- **Minimum 4 players** to start a game (enforced in `Game.start()`)
- **Socket.io CORS** currently allows all origins in dev (`"*"`) — change for production
- **Next.js version 16** with React 19 — latest stable versions
- **Role assignment** is random per game (in `Game.assignRoles()`) with counts from `GameSettings.roleCounts`
- **Hunter revenge** has a 3-second timeout before auto-terminating
