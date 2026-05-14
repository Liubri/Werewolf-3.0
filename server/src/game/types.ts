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
  GUARD = 'GUARD',
  DEMONHUNTER = 'DEMONHUNTER',
  KNIGHT = 'KNIGHT',
  GRAVEDIGGER = 'GRAVEDIGGER'
}

export interface GameSettings {
  roleCounts: Record<RoleType, number>;
}
