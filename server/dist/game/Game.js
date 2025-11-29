"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const types_1 = require("./types");
const Werewolf_1 = require("../roles/Werewolf");
const Villager_1 = require("../roles/Villager");
const Seer_1 = require("../roles/Seer");
const Witch_1 = require("../roles/Witch");
const Dreamkeeper_1 = require("../roles/Dreamkeeper");
const Hunter_1 = require("../roles/Hunter");
const WolfBeauty_1 = require("../roles/WolfBeauty");
const Magician_1 = require("../roles/Magician");
class Game {
    constructor(id, hostId, onStateChange, onPrivateMessage) {
        this.players = new Map();
        this.phase = types_1.GamePhase.LOBBY;
        // Night State
        this.nightKillTarget = null;
        this.werewolfVotes = new Map(); // voterId -> targetId
        this.werewolfTargets = new Map(); // werewolfId -> currentTargetId (for real-time sharing)
        this.protectedTarget = null;
        this.savedTarget = null;
        this.witchSaveUsedThisTurn = false;
        this.witchPoisonTarget = null;
        // Dreamkeeper State
        this.sleepingTarget = null;
        this.dreamkeeperId = null;
        this.nightNumber = 0;
        // Voting State
        this.dayVotes = new Map(); // voterId -> targetId
        // Hunter Revenge State
        this.hunterRevengeActive = false;
        this.hunterRevengePlayerId = null;
        this.hunterRevengeTimeout = null;
        // Wolf Beauty State
        this.wolfBeautyId = null;
        this.charmedTarget = null;
        // Magician State
        this.swappedIds = null;
        this.swappedPlayersHistory = new Set(); // Track players who have been swapped
        this.id = id;
        this.hostId = hostId;
        this.onStateChange = onStateChange;
        this.onPrivateMessage = onPrivateMessage;
        this.settings = {
            roleCounts: {
                [types_1.RoleType.WEREWOLF]: 1,
                [types_1.RoleType.VILLAGER]: 2,
                [types_1.RoleType.SEER]: 0,
                [types_1.RoleType.WITCH]: 0,
                [types_1.RoleType.DREAMKEEPER]: 0,
                [types_1.RoleType.HUNTER]: 0,
                [types_1.RoleType.WOLFBEAUTY]: 1,
                [types_1.RoleType.MAGICIAN]: 1
            }
        };
    }
    addPlayer(player) {
        this.players.set(player.id, player);
        this.broadcastState();
    }
    removePlayer(playerId) {
        this.players.delete(playerId);
        this.broadcastState();
    }
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    start() {
        if (this.phase !== types_1.GamePhase.LOBBY)
            return;
        if (this.players.size < 4)
            return; // Min players constraint
        this.assignRoles();
        this.phase = types_1.GamePhase.NIGHT;
        this.startNightPhase();
        this.broadcastState();
    }
    assignRoles() {
        const playerIds = Array.from(this.players.keys());
        // Shuffle
        for (let i = playerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }
        // Simple distribution logic based on settings
        // For MVP, just hardcode a distribution or use the settings
        // Let's use a simple stack based on settings
        const roleStack = [];
        const addRole = (RoleClass, count) => {
            for (let i = 0; i < count; i++)
                roleStack.push(new RoleClass());
        };
        // Adjust counts based on player size if needed, but for now trust settings
        // Or just fill with Villagers if not enough
        addRole(Werewolf_1.Werewolf, this.settings.roleCounts[types_1.RoleType.WEREWOLF]);
        addRole(Seer_1.Seer, this.settings.roleCounts[types_1.RoleType.SEER]);
        addRole(Witch_1.Witch, this.settings.roleCounts[types_1.RoleType.WITCH]);
        addRole(Dreamkeeper_1.Dreamkeeper, this.settings.roleCounts[types_1.RoleType.DREAMKEEPER]);
        addRole(Hunter_1.Hunter, this.settings.roleCounts[types_1.RoleType.HUNTER]);
        addRole(WolfBeauty_1.WolfBeauty, this.settings.roleCounts[types_1.RoleType.WOLFBEAUTY]);
        addRole(Magician_1.Magician, this.settings.roleCounts[types_1.RoleType.MAGICIAN]);
        // Fill rest with Villagers
        while (roleStack.length < playerIds.length) {
            roleStack.push(new Villager_1.Villager());
        }
        playerIds.forEach((pid, index) => {
            const player = this.players.get(pid);
            if (player) {
                player.role = roleStack[index];
                // Track Dreamkeeper player ID
                if (player.role.type === types_1.RoleType.DREAMKEEPER) {
                    this.dreamkeeperId = pid;
                }
                else if (player.role.type === types_1.RoleType.WOLFBEAUTY) {
                    this.wolfBeautyId = pid;
                }
            }
        });
    }
    startNightPhase() {
        // Increment night number
        this.nightNumber++;
        // Reset night state
        this.nightKillTarget = null;
        this.werewolfVotes.clear();
        this.werewolfTargets.clear();
        this.protectedTarget = null;
        this.witchSaveUsedThisTurn = false;
        this.witchPoisonTarget = null;
        this.savedTarget = null;
        this.sleepingTarget = null;
        this.charmedTarget = null;
        this.swappedIds = null; // Reset swap for new night (but keep history)
        this.players.forEach(p => p.resetNightStatus());
        // Handle Dreamkeeper auto-targeting at the end of night if no choice made
        // This will be checked in endNight() before resolving deaths
        // Notify players it's night
        // In a real implementation, we would sequence the waking up.
        // For this MVP, we will let everyone with an action act, and resolve at the end of a timer?
        // OR, better, we implement a 'sub-phase' system.
        // Let's try a simplified "All Night Actions Open" approach for speed, 
        // BUT Witch needs to know the kill target.
        // So: 
        // 1. Dreamkeeper & Werewolves act.
        // 2. Once Werewolves decide (or timer ends), Witch acts.
        // 3. Seer acts (independent).
        // To keep it simple but functional:
        // We will have a "NightStep" state.
        // Step 1: Werewolves & Dreamkeeper & Seer (Seer can act anytime)
        // Step 2: Witch (needs to see kill)
        // Actually, let's just expose the state. If Werewolves vote, the Witch sees it update in real-time?
        // That's a bit broken.
        // Let's stick to: All act. Witch sees "Potential Victim" if Werewolves have majority.
    }
    registerWerewolfVote(voterId, targetId) {
        console.log('Registering werewolf vote:', voterId, '->', targetId);
        this.werewolfVotes.set(voterId, targetId);
        this.werewolfTargets.set(voterId, targetId); // Track individual targets for sharing
        this.resolveWerewolfKill();
        this.broadcastState();
    }
    resolveWerewolfKill() {
        // Simple majority or first
        const votes = {};
        this.werewolfVotes.forEach(target => {
            votes[target] = (votes[target] || 0) + 1;
        });
        // Find max
        let maxVotes = 0;
        let target = null;
        for (const [t, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                target = t;
            }
        }
        this.nightKillTarget = target;
    }
    updateWerewolfTarget(werewolfId, targetId) {
        // console.log('Updating werewolf target:', werewolfId, '->', targetId);
        if (targetId) {
            this.werewolfTargets.set(werewolfId, targetId);
        }
        else {
            // Remove target if deselected
            this.werewolfTargets.delete(werewolfId);
        }
        this.broadcastState();
    }
    protectPlayer(targetId) {
        console.log('Protecting player:', targetId);
        this.protectedTarget = targetId;
    }
    putPlayerToSleep(targetId, dreamkeeperId) {
        const resolvedTarget = this.resolveTargetId(targetId);
        console.log('Putting player to sleep:', targetId, '->', resolvedTarget);
        this.sleepingTarget = resolvedTarget;
        const player = this.players.get(resolvedTarget);
        if (player) {
            player.putToSleep(this.nightNumber);
        }
    }
    charmPlayer(targetId) {
        const resolvedTarget = this.resolveTargetId(targetId);
        console.log('Charming player:', targetId, '->', resolvedTarget);
        this.charmedTarget = resolvedTarget;
    }
    swapPlayerIds(playerId1, playerId2) {
        console.log('Magician attempting to swap:', playerId1, '<->', playerId2);
        // Validate both players exist and are alive
        const player1 = this.players.get(playerId1);
        const player2 = this.players.get(playerId2);
        if (!player1 || !player2 || !player1.isAlive || !player2.isAlive) {
            console.log('Invalid swap: one or both players not found or dead');
            return;
        }
        // Check if either player has already been swapped
        if (this.swappedPlayersHistory.has(playerId1) || this.swappedPlayersHistory.has(playerId2)) {
            console.log('Invalid swap: one or both players have already been swapped this game');
            return;
        }
        // Store the swap
        this.swappedIds = [playerId1, playerId2];
        this.swappedPlayersHistory.add(playerId1);
        this.swappedPlayersHistory.add(playerId2);
        console.log('Successfully swapped:', playerId1, '<->', playerId2);
    }
    getEligibleSwapTargets() {
        return Array.from(this.players.values())
            .filter(p => p.isAlive && !this.swappedPlayersHistory.has(p.id))
            .map(p => p.id);
    }
    resolveTargetId(targetId) {
        if (!this.swappedIds)
            return targetId;
        const [id1, id2] = this.swappedIds;
        if (targetId === id1) {
            console.log('Resolving target:', targetId, '->', id2);
            return id2;
        }
        else if (targetId === id2) {
            console.log('Resolving target:', targetId, '->', id1);
            return id1;
        }
        return targetId;
    }
    handleDreamkeeperAutoTarget(dreamkeeperId) {
        // If Dreamkeeper didn't choose, randomly select a target (not self)
        const dreamkeeper = this.players.get(dreamkeeperId);
        if (!dreamkeeper)
            return;
        const eligibleTargets = Array.from(this.players.values())
            .filter(p => p.isAlive && p.id !== dreamkeeperId)
            .map(p => p.id);
        if (eligibleTargets.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleTargets.length);
            const targetId = eligibleTargets[randomIndex];
            console.log('Dreamkeeper auto-targeting:', targetId);
            this.putPlayerToSleep(targetId, dreamkeeperId);
        }
    }
    witchAction(playerId, action, targetId) {
        const player = this.players.get(playerId);
        if (!player || !(player.role instanceof Witch_1.Witch))
            return;
        console.log("Has save potion", player.role.hasSavePotion);
        console.log("Has poison potion", player.role.hasPoisonPotion);
        if (action === 'SAVE' && player.role.hasSavePotion) {
            this.witchSaveUsedThisTurn = true;
            this.savedTarget = targetId;
            player.role.useSave();
        }
        else if (action === 'POISON' && player.role.hasPoisonPotion && targetId) {
            this.witchPoisonTarget = targetId;
            player.role.usePoison();
        }
        this.broadcastState();
    }
    sendSeerResult(seerId, targetName, isWerewolf) {
        const seer = this.players.get(seerId);
        if (seer) {
            this.onPrivateMessage(seer.socketId, 'SEER_RESULT', { targetName, isWerewolf });
        }
    }
    endNight() {
        this.werewolfTargets.clear();
        // Handle Dreamkeeper auto-targeting if no choice was made
        if (this.dreamkeeperId && !this.sleepingTarget) {
            const dreamkeeper = this.players.get(this.dreamkeeperId);
            if (dreamkeeper && dreamkeeper.isAlive) {
                this.handleDreamkeeperAutoTarget(this.dreamkeeperId);
            }
        }
        // Resolve everything
        const deadPlayers = new Set();
        // Werewolf kill (resolve ID swap)
        if (this.nightKillTarget) {
            const resolvedTarget = this.resolveTargetId(this.nightKillTarget);
            if (resolvedTarget !== this.protectedTarget) {
                // Check if target is asleep (immune to death)
                const target = this.players.get(resolvedTarget);
                if (!target?.asleep) {
                    deadPlayers.add(resolvedTarget);
                    console.log('Werewolf kill resolved:', this.nightKillTarget, '->', resolvedTarget);
                }
                else {
                    console.log('Player is asleep and immune to werewolf kill:', resolvedTarget);
                }
            }
        }
        // Witch poison (resolve ID swap)
        if (this.witchPoisonTarget) {
            const resolvedPoison = this.resolveTargetId(this.witchPoisonTarget);
            deadPlayers.add(resolvedPoison);
            console.log('Witch poison resolved:', this.witchPoisonTarget, '->', resolvedPoison);
        }
        if (this.witchSaveUsedThisTurn && this.savedTarget) {
            deadPlayers.delete(this.savedTarget);
        }
        // Check if Dreamkeeper died - if so, sleeping player also dies
        const dreamkeeperDied = this.dreamkeeperId && deadPlayers.has(this.dreamkeeperId);
        if (dreamkeeperDied && this.sleepingTarget) {
            console.log('Dreamkeeper died, sleeping player also dies:', this.sleepingTarget);
            deadPlayers.add(this.sleepingTarget);
        }
        // Check if Wolf Beauty died - if so, charmed player also dies
        const wolfBeautyDied = this.wolfBeautyId && deadPlayers.has(this.wolfBeautyId);
        if (wolfBeautyDied && this.charmedTarget) {
            console.log('Wolf Beauty died, charmed player also dies:', this.charmedTarget);
            deadPlayers.add(this.charmedTarget);
        }
        // Apply deaths
        deadPlayers.forEach(pid => {
            const p = this.players.get(pid);
            if (p)
                p.die();
        });
        // Check if Hunter died and trigger revenge
        const hunterDied = Array.from(deadPlayers).find(pid => {
            const player = this.players.get(pid);
            return player?.role?.type === types_1.RoleType.HUNTER && player.role instanceof Hunter_1.Hunter && player.role.canUseRevengeAbility;
        });
        console.log("HungerID: ", hunterDied);
        console.log("WolfBeautyID: ", this.charmedTarget);
        if (hunterDied && hunterDied !== this.charmedTarget) {
            this.triggerHunterRevenge(hunterDied);
            return; // Don't transition to day yet, wait for Hunter revenge
        }
        this.phase = types_1.GamePhase.DAY;
        this.broadcastState();
        // Check win
        this.checkWinCondition();
    }
    handleDayVote(voterId, targetId) {
        this.dayVotes.set(voterId, targetId);
        this.broadcastState();
    }
    endDay() {
        // Handle deaths from 2 consecutive nights of sleep
        const sleepDeaths = [];
        this.players.forEach(player => {
            if (player.isAlive && player.consecutiveSleepNights >= 2) {
                console.log('Player died from sleeping 2 consecutive nights:', player.name);
                sleepDeaths.push(player.id);
                player.die();
                player.resetSleepTracking();
            }
        });
        // Resolve voting
        const votes = {};
        this.dayVotes.forEach(target => {
            votes[target] = (votes[target] || 0) + 1;
        });
        let maxVotes = 0;
        let target = null;
        for (const [t, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                target = t;
            }
        }
        if (target) {
            const p = this.players.get(target);
            if (p) {
                p.die();
                // Check if Hunter died and trigger revenge
                if (p.role?.type === types_1.RoleType.HUNTER && p.role instanceof Hunter_1.Hunter && p.role.canUseRevengeAbility) {
                    this.dayVotes.clear();
                    this.triggerHunterRevenge(target);
                    return; // Don't transition to night yet, wait for Hunter revenge
                }
            }
        }
        this.dayVotes.clear();
        this.phase = types_1.GamePhase.NIGHT;
        this.startNightPhase();
        this.broadcastState();
        this.checkWinCondition();
    }
    checkWinCondition() {
        const alive = Array.from(this.players.values()).filter(p => p.isAlive);
        const wolves = alive.filter(p => p.role?.team === types_1.Team.WEREWOLF);
        const villagers = alive.filter(p => p.role?.team === types_1.Team.VILLAGER);
        if (wolves.length === 0) {
            this.phase = types_1.GamePhase.GAME_OVER;
            this.broadcastState({ winner: types_1.Team.VILLAGER });
        }
        else if (wolves.length >= villagers.length) {
            this.phase = types_1.GamePhase.GAME_OVER;
            this.broadcastState({ winner: types_1.Team.WEREWOLF });
        }
    }
    // Helper to send full state to clients
    broadcastState(extraData = {}) {
        // Sanitize state for clients (hide roles of others)
        // We will send a "public state" and individual "private states"
        // But for simplicity, let's just send the raw state to the manager 
        // and let the manager filter it, or we filter it here.
        // Actually, we should filter here.
        this.players.forEach(player => {
            const publicPlayers = Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                isAlive: p.isAlive,
                isReady: p.isReady,
                socketId: p.socketId,
                // Show role ONLY if game over or if it's the player themselves
                role: (this.phase === types_1.GamePhase.GAME_OVER || p.id === player.id) ? p.role : null
            }));
            // Convert werewolfTargets Map to object for JSON serialization
            const werewolfTargetsObj = {};
            this.werewolfTargets.forEach((targetId, werewolfId) => {
                werewolfTargetsObj[werewolfId] = targetId;
            });
            const state = {
                id: this.id,
                hostId: this.hostId,
                phase: this.phase,
                players: publicPlayers,
                // Add other phase info
                // Wolves see their target, Witch sees it too (to save)
                nightKillTarget: (player.role?.team === types_1.Team.WEREWOLF || player.role?.type === types_1.RoleType.WITCH) ? this.nightKillTarget : null,
                // Werewolves see all werewolf targets
                werewolfTargets: player.role?.team === types_1.Team.WEREWOLF ? werewolfTargetsObj : null,
                ...extraData
            };
            this.onStateChange(player.socketId, state);
        });
    }
    // Hunter Revenge Methods
    triggerHunterRevenge(hunterId) {
        const hunter = this.players.get(hunterId);
        if (!hunter || !(hunter.role instanceof Hunter_1.Hunter))
            return;
        this.hunterRevengeActive = true;
        this.hunterRevengePlayerId = hunterId;
        // Get alive players as eligible targets
        const eligibleTargets = Array.from(this.players.values())
            .filter(p => p.isAlive)
            .map(p => ({ id: p.id, name: p.name }));
        // Notify the Hunter player
        this.onPrivateMessage(hunter.socketId, 'HUNTER_REVENGE_TRIGGER', {
            eligibleTargets,
            timeLimit: 30000 // 30 seconds in milliseconds
        });
        // Notify all other players
        this.players.forEach(player => {
            if (player.id !== hunterId) {
                this.onPrivateMessage(player.socketId, 'HUNTER_REVENGE_ACTIVE', {
                    hunterName: hunter.name
                });
            }
        });
        // Set timeout for 30 seconds
        this.hunterRevengeTimeout = setTimeout(() => {
            this.completeHunterRevenge(hunterId, null);
        }, 30000);
        this.broadcastState();
    }
    handleHunterRevenge(hunterId, targetId) {
        if (!this.hunterRevengeActive || this.hunterRevengePlayerId !== hunterId) {
            return;
        }
        // Clear the timeout
        if (this.hunterRevengeTimeout) {
            clearTimeout(this.hunterRevengeTimeout);
            this.hunterRevengeTimeout = null;
        }
        this.completeHunterRevenge(hunterId, targetId);
    }
    completeHunterRevenge(hunterId, targetId) {
        const hunter = this.players.get(hunterId);
        if (!hunter || !(hunter.role instanceof Hunter_1.Hunter))
            return;
        // Mark ability as used
        hunter.role.canUseRevengeAbility = false;
        // Kill the target if one was selected
        if (targetId) {
            const target = this.players.get(targetId);
            if (target && target.isAlive) {
                target.die();
            }
        }
        // Reset revenge state
        this.hunterRevengeActive = false;
        this.hunterRevengePlayerId = null;
        // Continue to the next phase based on what phase we were transitioning from
        // If we came from night (nightKillTarget might be set), go to day
        // If we came from day (dayVotes was just cleared), go to night
        if (this.phase === types_1.GamePhase.NIGHT) {
            this.phase = types_1.GamePhase.DAY;
        }
        else if (this.phase === types_1.GamePhase.DAY) {
            this.phase = types_1.GamePhase.NIGHT;
            this.startNightPhase();
        }
        this.broadcastState();
        this.checkWinCondition();
    }
}
exports.Game = Game;
