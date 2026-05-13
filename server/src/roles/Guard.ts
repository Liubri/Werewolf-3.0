import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Guard extends Role {
  type = RoleType.GUARD;
  team = Team.VILLAGER;
  name = 'Guard';
  description = 'Protect one player each night, but cannot protect same player for two consecutive nights.';
  wakeOrder = 5; // Wakes up very early, before werewolves
  lastProtectedId?: string; // Track the last player protected
  lastProtectedNight?: number; // Track which night the protection happened

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    if (targetId) {
      game.protectPlayer(targetId, this, player.id);
    }
  }
}