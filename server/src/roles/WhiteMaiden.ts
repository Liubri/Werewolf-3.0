import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class WhiteMaiden extends Role {
  type = RoleType.WHITEMAIDEN;
  team = Team.VILLAGER;
  name = 'White Maiden';
  description = 'From night 2, check one player\'s exact role. If they are a werewolf, they are immediately eliminated — Guard and Witch cannot block this.';
  wakeOrder = 22;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    if (!targetId) return;
    game.whiteMaidenAction(player.id, targetId);
  }
}
