"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seer = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Seer extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.SEER;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Seer';
        this.description = 'Wake up at night to check the identity of a player.';
        this.wakeOrder = 20;
    }
    handleNightAction(game, player, targetId) {
        console.log('Seer handleNightAction called:', player.name, 'checking', targetId);
        if (targetId) {
            const target = game.getPlayer(targetId);
            if (target && target.role) {
                const isWerewolf = target.role.team === types_1.Team.WEREWOLF;
                console.log('Seer result:', target.name, 'is werewolf?', isWerewolf);
                game.sendSeerResult(player.id, target.name, isWerewolf);
            }
        }
    }
}
exports.Seer = Seer;
