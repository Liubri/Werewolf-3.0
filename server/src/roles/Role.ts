import { RoleType, Team } from '../game/types';
import { Player } from '../game/Player';
import type { Game } from '../game/Game';

export abstract class Role {
  abstract type: RoleType;
  abstract team: Team;
  abstract name: string;
  abstract description: string;

  // Defines if this role wakes up at night
  abstract wakeOrder: number; // -1 if doesn't wake

  constructor() {}

  abstract handleNightAction(game: Game, player: Player, targetId?: string, secondaryTargetId?: string, data?: any): void;
}
