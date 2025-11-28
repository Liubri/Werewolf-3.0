import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Dreamkeeper extends Role {
  type = RoleType.DREAMKEEPER;
  team = Team.VILLAGER;
  name = 'Dreamkeeper';
  description = 'Put a player to sleep each night. Sleeping players are immune to death, but if you die at night, they die too. If a player sleeps 2 consecutive nights, they die during the next day.';
  wakeOrder = 5; // Wakes up very early, before werewolves

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    console.log('Dreamkeeper handleNightAction called:', player.name, 'putting to sleep', targetId);
    
    // Validate target is not self
    if (targetId === player.id) {
      console.log('Dreamkeeper cannot target themselves');
      return;
    }
    
    if (targetId) {
      game.putPlayerToSleep(targetId, player.id);
    }
  }
}
