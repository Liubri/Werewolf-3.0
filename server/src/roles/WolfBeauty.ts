import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class WolfBeauty extends Role {
  type = RoleType.WOLFBEAUTY;
  team = Team.WEREWOLF;
  name = 'Wolf Beauty';
  description = 'Charm one person at night. If you die, they die too and lose all skills.';
  wakeOrder = -1;

  handleNightAction(game: Game, player: Player, targetId?: string, data?: any): void {
    if (targetId) {
      if (data.charmType === "CHARM") {
        game.charmPlayer(targetId);
      } else {
        game.registerWerewolfVote(player.id, targetId);
      }
    }
  }
}