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
  HUNTER = 'HUNTER',
  WOLFBEAUTY = 'WOLFBEAUTY',
  MAGICIAN = 'MAGICIAN',
  GUARD = 'GUARD'
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
    // Role-specific properties
    lastProtectedId?: string; // Guard: last player they protected
    lastProtectedNight?: number; // Guard: which night the protection happened
    hasSavePotion?: boolean; // Witch: whether they still have save potion
    hasPoisonPotion?: boolean; // Witch: whether they still have poison potion
    sleepingTarget?: string; // Dreamkeeper: current sleeping target
  } | null;
  // Night status
  protected?: boolean;
  poisoned?: boolean;
  asleep?: boolean;
}

export interface GameState {
  id: string;
  hostId: string;
  phase: GamePhase;
  nightNumber: number;
  players: Player[];
  nightKillTarget?: string | null;
  werewolfTargets?: Record<string, string> | null; // werewolfId -> targetId
  winner?: Team;
}
