"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Magician = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Magician extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.MAGICIAN;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Magician';
        this.description = 'Switch the identities of two players each night. Actions targeting one will affect the other.';
        this.wakeOrder = 8; // Before werewolves (10), after dreamkeeper (5)
    }
    handleNightAction(game, player, targetId, secondaryTargetId) {
        console.log('Magician handleNightAction called:', player.name, 'swapping', targetId, 'with', secondaryTargetId);
        if (targetId && secondaryTargetId) {
            game.swapPlayerIds(targetId, secondaryTargetId);
        }
    }
}
exports.Magician = Magician;
