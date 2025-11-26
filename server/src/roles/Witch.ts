import { Role } from './Role';
import { RoleType, Team } from '../game/types';
import type { Game } from '../game/Game';
import { Player } from '../game/Player';

export class Witch extends Role {
  type = RoleType.WITCH;
  team = Team.VILLAGER;
  name = 'Witch';
  description = 'Has a potion to save and a poison to kill.';
  wakeOrder = 30;

  hasSavePotion = true;
  hasPoisonPotion = true;

  handleNightAction(game: Game, player: Player, targetId?: string, secondaryTargetId?: string): void {
    // targetId is for save (usually the victim), secondaryTargetId is for poison
    // In this simplified version, we might receive specific action types.
    // But let's assume the game passes the intent.
    
    // Actually, it's better if the Game class calls specific methods or we parse the action.
    // For now, let's assume the Game handles the logic of "what did the witch do" based on input
    // and calls this to update state?
    // Or better: The Game receives "WITCH_ACTION" with { save: boolean, poisonTarget: string }
    
    // Let's rely on the Game to manage the complex Witch logic and just use this class for state.
  }

  useSave() {
    this.hasSavePotion = false;
  }

  usePoison() {
    this.hasPoisonPotion = false;
  }
}
