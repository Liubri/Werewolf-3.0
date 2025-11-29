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
        this.description = 'Put a player to sleep each night. Sleeping players are immune to death, but if you die at night, they die too. If a player sleeps 2 consecutive nights, they die during the next day.';
        this.wakeOrder = 5; // Wakes up very early, before werewolves
    }
    handleNightAction(game, player, targetId) {
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
exports.Dreamkeeper = Dreamkeeper;
