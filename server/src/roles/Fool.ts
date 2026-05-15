import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Fool extends Role {
  type = RoleType.FOOL;
  team = Team.VILLAGER;
  name = 'Fool';
  description = 'If voted out, survive but lose voting rights.';
  wakeOrder = -1;
  canUseAbility = true;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    // Fool has no night action
  }
}
