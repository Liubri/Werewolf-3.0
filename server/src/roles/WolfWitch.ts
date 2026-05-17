import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class WolfWitch extends Role {
  type = RoleType.WOLFWITCH;
  team = Team.WEREWOLF;
  name = 'Wolf Witch';
  description = 'From night 2, check one non-werewolf player\'s exact role. If they are the White Maiden, she is eliminated — Guard and Witch cannot block this.';
  wakeOrder = 28;

  handleNightAction(game: Game, player: Player, targetId?: string, data?: any): void {
    if (targetId) {
      if (data.actionType === 'REVEAL') {
        game.wolfWitchAction(player.id, targetId);
      } else {
        game.registerWerewolfVote(player.id, targetId);
      }
    }
  }
}
