import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Gravedigger extends Role {
  type = RoleType.GRAVEDIGGER;
  team = Team.VILLAGER;
  name = 'Gravedigger';
  description = 'Learn the alignment of players voted out during the day.';
  wakeOrder = -1; // Does not wake at night (passive role)

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    // Gravedigger has no night action; ability is passive
  }
}
