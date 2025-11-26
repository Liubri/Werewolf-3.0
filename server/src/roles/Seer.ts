import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Seer extends Role {
  type = RoleType.SEER;
  team = Team.VILLAGER;
  name = 'Seer';
  description = 'Wake up at night to check the identity of a player.';
  wakeOrder = 20;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    console.log('Seer handleNightAction called:', player.name, 'checking', targetId);
    if (targetId) {
      const target = game.getPlayer(targetId);
      if (target && target.role) {
        const isWerewolf = target.role.team === Team.WEREWOLF;
        console.log('Seer result:', target.name, 'is werewolf?', isWerewolf);
        game.sendSeerResult(player.id, target.name, isWerewolf);
      }
    }
  }
}
