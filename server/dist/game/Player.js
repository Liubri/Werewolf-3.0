"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, name, socketId) {
        this.id = id;
        this.name = name;
        this.socketId = socketId;
        this.role = null;
        this.isAlive = true;
        this.isReady = false;
        this.protected = false;
        this.poisoned = false;
    }
    resetNightStatus() {
        this.protected = false;
        // Poison persists if set, but usually handled by death logic
    }
    die() {
        this.isAlive = false;
    }
}
exports.Player = Player;
