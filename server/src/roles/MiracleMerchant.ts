import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class MiracleMerchant extends Role {
  type = RoleType.MIRACLEMERCHANT;
  team = Team.VILLAGER;
  name = 'Miracle Merchant';
  description = 'Give witch poison, seer ability, or guard ability to a player. If they are a werewolf, you die instead.';
  wakeOrder = 4;

  handleNightAction(game: Game, player: Player, targetId?: string, data?: any): void {
    if (targetId && data?.abilityType) {
      game.merchantAction(targetId, data.abilityType);
    }
  }
}
