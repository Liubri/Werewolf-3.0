"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Villager = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Villager extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.VILLAGER;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Villager';
        this.description = 'A simple villager. Sleep at night, vote during the day.';
        this.wakeOrder = -1;
    }
    handleNightAction(game, player, targetId) {
        // Villagers do nothing at night
    }
}
exports.Villager = Villager;
