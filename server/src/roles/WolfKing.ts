import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class WolfKing extends Role {
  type = RoleType.WOLFKING;
  team = Team.WEREWOLF;
  name = 'Wolf King';
  description = 'Votes with werewolves each night. When eliminated, can take another player down with you. Cannot use if killed by poison.';
  wakeOrder = 10;
  canUseRevengeAbility = true;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    if (targetId) {
      game.registerWerewolfVote(player.id, targetId);
    }
  }
}
