import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Villager extends Role {
  type = RoleType.VILLAGER;
  team = Team.VILLAGER;
  name = 'Villager';
  description = 'A simple villager. Sleep at night, vote during the day.';
  wakeOrder = -1;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    // Villagers do nothing at night
  }
}
