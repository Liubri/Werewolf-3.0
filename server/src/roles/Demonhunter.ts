import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Demonhunter extends Role {
  type = RoleType.DEMONHUNTER;
  team = Team.VILLAGER;
  name = 'Demonhunter';
  description = 'Staring from the second night, choose a player to hunt. If the target is a werewolf, they are eliminated the next day, if the target is a villager you are eliminated the next day.';
  wakeOrder = 5; // Wakes up very early, before werewolves

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    // Validate target is not self
    if (targetId === player.id) {
      console.log('Dreamkeeper cannot target themselves');
      return;
    }

    if (targetId && game.nightNumber >= 2) {
      game.demonHunterAction(targetId);
    }
  }
}