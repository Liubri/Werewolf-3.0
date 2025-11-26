import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Dreamkeeper extends Role {
  type = RoleType.DREAMKEEPER;
  team = Team.VILLAGER;
  name = 'Dreamkeeper';
  description = 'Protect one player from being killed at night.';
  wakeOrder = 5; // Wakes up very early, or before werewolves? Usually before.

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    console.log('Dreamkeeper handleNightAction called:', player.name, 'protecting', targetId);
    if (targetId) {
      game.protectPlayer(targetId);
    }
  }
}
