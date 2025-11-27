import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Hunter extends Role {
  type = RoleType.HUNTER;
  team = Team.VILLAGER;
  name = 'Hunter';
  description = 'When eliminated, can kill one player as a final act.';
  wakeOrder = 5;
  canUseRevengeAbility = true;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    // Hunter's ability is passive - triggers on death, not during night
  }
}