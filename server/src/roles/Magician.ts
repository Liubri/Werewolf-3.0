import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Magician extends Role {
  type = RoleType.MAGICIAN;
  team = Team.VILLAGER;
  name = 'Magician';
  description = 'Switch the identities of two players each night. Actions targeting one will affect the other.';
  wakeOrder = 8; // Before werewolves (10), after dreamkeeper (5)

  handleNightAction(game: Game, player: Player, targetId?: string, data?: any): void {
    console.log('Magician handleNightAction called:', player.name, 'swapping', targetId, 'with', data.secondaryTargetId);

    if (targetId && data.secondaryTargetId) {
      game.swapPlayerIds(targetId, data.secondaryTargetId);
    }
  }
}
