"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Witch = void 0;
const Role_1 = require("./Role");
const types_1 = require("../game/types");
class Witch extends Role_1.Role {
    constructor() {
        super(...arguments);
        this.type = types_1.RoleType.WITCH;
        this.team = types_1.Team.VILLAGER;
        this.name = 'Witch';
        this.description = 'Has a potion to save and a poison to kill.';
        this.wakeOrder = 30;
        this.hasSavePotion = true;
        this.hasPoisonPotion = true;
    }
    handleNightAction(game, player, targetId, secondaryTargetId) {
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
exports.Witch = Witch;
