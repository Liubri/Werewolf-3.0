"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hunter = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Hunter extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.HUNTER;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Hunter';
        this.description = 'When eliminated, can kill one player as a final act.';
        this.wakeOrder = 5;
        this.canUseRevengeAbility = true;
    }
    handleNightAction(game, player, targetId) {
        // Hunter's ability is passive - triggers on death, not during night
    }
}
exports.Hunter = Hunter;
