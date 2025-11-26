"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dreamkeeper = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Dreamkeeper extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.DREAMKEEPER;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Dreamkeeper';
        this.description = 'Protect one player from being killed at night.';
        this.wakeOrder = 5; // Wakes up very early, or before werewolves? Usually before.
    }
    handleNightAction(game, player, targetId) {
        console.log('Dreamkeeper handleNightAction called:', player.name, 'protecting', targetId);
        if (targetId) {
            game.protectPlayer(targetId);
        }
    }
}
exports.Dreamkeeper = Dreamkeeper;
