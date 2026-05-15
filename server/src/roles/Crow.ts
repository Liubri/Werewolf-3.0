import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Crow extends Role {
  type = RoleType.CROW;
  team = Team.VILLAGER;
  name = 'Crow';
  description = 'Each night, curse a player to receive 1 extra vote during exile.';
  wakeOrder = 3;
  lastCursedId: string | null = null;
  lastCursedNight: number = -1;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    if (targetId) {
      game.crowAction(targetId, this);
    }
  }
}
