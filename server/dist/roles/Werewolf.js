"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Werewolf = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Werewolf extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.WEREWOLF;
        this.team = types_1.Team.WEREWOLF;
        this.name = 'Werewolf';
        this.description = 'Wake up at night to kill a villager.';
        this.wakeOrder = 10; // Wakes up early
    }
    handleNightAction(game, player, targetId) {
        console.log('Werewolf handleNightAction called:', player.name, 'targeting', targetId);
        if (targetId) {
            game.registerWerewolfVote(player.id, targetId);
        }
    }
}
exports.Werewolf = Werewolf;
