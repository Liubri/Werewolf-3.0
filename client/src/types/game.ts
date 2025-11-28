export enum GamePhase {
  LOBBY = 'LOBBY',
  NIGHT = 'NIGHT',
  DAY = 'DAY',
  VOTING = 'VOTING',
  GAME_OVER = 'GAME_OVER'
}

export enum Team {
  VILLAGER = 'VILLAGER',
  WEREWOLF = 'WEREWOLF'
}

export enum RoleType {
  WEREWOLF = 'WEREWOLF',
  VILLAGER = 'VILLAGER',
  SEER = 'SEER',
  WITCH = 'WITCH',
  DREAMKEEPER = 'DREAMKEEPER',
  HUNTER = 'HUNTER'
}

export interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  isReady: boolean;
  socketId: string;
  role: {
    type: RoleType;
    team: Team;
    name: string;
    description: string;
  } | null;
}

export interface GameState {
  id: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  nightKillTarget?: string | null;
  werewolfTargets?: Record<string, string> | null; // werewolfId -> targetId
  winner?: Team;
}
