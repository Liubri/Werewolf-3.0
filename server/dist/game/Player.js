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
        this.asleep = false;
        this.consecutiveSleepNights = 0;
        this.lastSleptNight = -1;
    }
    resetNightStatus() {
        this.protected = false;
        this.asleep = false;
        // Poison persists if set, but usually handled by death logic
    }
    putToSleep(nightNumber) {
        this.asleep = true;
        // Check if this is consecutive
        if (this.lastSleptNight === nightNumber - 1) {
            this.consecutiveSleepNights++;
        }
        else {
            this.consecutiveSleepNights = 1;
        }
        this.lastSleptNight = nightNumber;
    }
    wakeUp() {
        this.asleep = false;
    }
    resetSleepTracking() {
        this.consecutiveSleepNights = 0;
        this.lastSleptNight = -1;
    }
    die() {
        this.isAlive = false;
    }
}
exports.Player = Player;
