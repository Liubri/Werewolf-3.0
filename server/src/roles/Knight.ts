import { Role } from "./Role";
import { RoleType, Team } from "../game/types";
import type { Game } from "../game/Game";
import { Player } from "../game/Player";

export class Knight extends Role {
  type = RoleType.KNIGHT;
  team = Team.VILLAGER;
  name = "Knight";
  description = "Reveal identity to eliminate a player";
  wakeOrder = -1;

  handleNightAction(game: Game, player: Player, targetId?: string): void {
    if (targetId) {
      player.knightRevealed = true;
      game.knightAction(targetId);
    }
  }
}
