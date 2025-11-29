"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WolfBeauty = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class WolfBeauty extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.WOLFBEAUTY;
        this.team = types_1.Team.WEREWOLF;
        this.name = 'Wolf Beauty';
        this.description = 'Charm one person at night. If you die, they die too and lose all skills.';
        this.wakeOrder = -1;
    }
    handleNightAction(game, player, targetId, data) {
        if (targetId) {
            if (data.charmType === "CHARM") {
                game.charmPlayer(targetId);
            }
            else {
                game.registerWerewolfVote(player.id, targetId);
            }
        }
    }
}
exports.WolfBeauty = WolfBeauty;
