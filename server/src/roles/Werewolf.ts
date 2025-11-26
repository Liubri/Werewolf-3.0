import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Werewolf extends Role {
  type = RoleType.WEREWOLF;
  team = Team.WEREWOLF;
  name = 'Werewolf';
  description = 'Wake up at night to kill a villager.';
  wakeOrder = 10; // Wakes up early

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    console.log('Werewolf handleNightAction called:', player.name, 'targeting', targetId);
    if (targetId) {
      game.registerWerewolfVote(player.id, targetId);
    }
  }
}
