import { Player } from './Player';
import { GamePhase, RoleType, Team, GameSettings } from './types';
import { Role } from '../roles/Role';
import { Werewolf } from '../roles/Werewolf';
import { Villager } from '../roles/Villager';
import { Seer } from '../roles/Seer';
import { Witch } from '../roles/Witch';
import { Dreamkeeper } from '../roles/Dreamkeeper';
import { Hunter } from '../roles/Hunter';
import { WolfBeauty } from '../roles/WolfBeauty';

export class Game {
  id: string;
  hostId: string; // ID of the player who created the game
  players: Map<string, Player> = new Map();
  phase: GamePhase = GamePhase.LOBBY;
  settings: GameSettings;

  // Callbacks
  onStateChange: (gameId: string, state: any) => void;
  onPrivateMessage: (playerId: string, event: string, data: any) => void;

  // Night State
  nightKillTarget: string | null = null;
  werewolfVotes: Map<string, string> = new Map(); // voterId -> targetId
  werewolfTargets: Map<string, string> = new Map(); // werewolfId -> currentTargetId (for real-time sharing)
  protectedTarget: string | null = null;
  savedTarget: string | null = null;
  witchSaveUsedThisTurn: boolean = false;
  witchPoisonTarget: string | null = null;

  // Dreamkeeper State
  sleepingTarget: string | null = null;
  dreamkeeperId: string | null = null;
  nightNumber: number = 0;

  // Voting State
  dayVotes: Map<string, string> = new Map(); // voterId -> targetId

  // Hunter Revenge State
  hunterRevengeActive: boolean = false;
  hunterRevengePlayerId: string | null = null;
  hunterRevengeTimeout: NodeJS.Timeout | null = null;

  // Wolf Beauty State
  wolfBeautyId: string | null = null;
  charmedTarget: string | null = null;

  constructor(id: string, hostId: string, onStateChange: any, onPrivateMessage: any) {
    this.id = id;
    this.hostId = hostId;
    this.onStateChange = onStateChange;
    this.onPrivateMessage = onPrivateMessage;
    this.settings = {
      roleCounts: {
        [RoleType.WEREWOLF]: 1,
        [RoleType.VILLAGER]: 2,
        [RoleType.SEER]: 0,
        [RoleType.WITCH]: 0,
        [RoleType.DREAMKEEPER]: 0,
        [RoleType.HUNTER]: 1,
        [RoleType.WOLFBEAUTY]: 1
      }
    };
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.broadcastState();
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.broadcastState();
  }

  getPlayer(playerId: string) {
    return this.players.get(playerId);
  }

  start() {
    if (this.phase !== GamePhase.LOBBY) return;
    if (this.players.size < 4) return; // Min players constraint

    this.assignRoles();
    this.phase = GamePhase.NIGHT;
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
    const roleStack: Role[] = [];
    const addRole = (RoleClass: any, count: number) => {
      for(let i=0; i<count; i++) roleStack.push(new RoleClass());
    };

    // Adjust counts based on player size if needed, but for now trust settings
    // Or just fill with Villagers if not enough
    addRole(Werewolf, this.settings.roleCounts[RoleType.WEREWOLF]);
    addRole(Seer, this.settings.roleCounts[RoleType.SEER]);
    addRole(Witch, this.settings.roleCounts[RoleType.WITCH]);
    addRole(Dreamkeeper, this.settings.roleCounts[RoleType.DREAMKEEPER]);
    addRole(Hunter, this.settings.roleCounts[RoleType.HUNTER]);
    addRole(WolfBeauty, this.settings.roleCounts[RoleType.WOLFBEAUTY]);

    // Fill rest with Villagers
    while (roleStack.length < playerIds.length) {
      roleStack.push(new Villager());
    }

    playerIds.forEach((pid, index) => {
      const player = this.players.get(pid);
      if (player) {
        player.role = roleStack[index];
        // Track Dreamkeeper player ID
        if (player.role.type === RoleType.DREAMKEEPER) {
          this.dreamkeeperId = pid;
        } else if (player.role.type === RoleType.WOLFBEAUTY) {
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

  registerWerewolfVote(voterId: string, targetId: string) {
    console.log('Registering werewolf vote:', voterId, '->', targetId);
    this.werewolfVotes.set(voterId, targetId);
    this.werewolfTargets.set(voterId, targetId); // Track individual targets for sharing
    this.resolveWerewolfKill();
    this.broadcastState();
  }

  resolveWerewolfKill() {
    // Simple majority or first
    const votes: Record<string, number> = {};
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

  updateWerewolfTarget(werewolfId: string, targetId: string | null) {
    // console.log('Updating werewolf target:', werewolfId, '->', targetId);
    if (targetId) {
      this.werewolfTargets.set(werewolfId, targetId);
    } else {
      // Remove target if deselected
      this.werewolfTargets.delete(werewolfId);
    }
    this.broadcastState();
  }

  protectPlayer(targetId: string) {
    console.log('Protecting player:', targetId);
    this.protectedTarget = targetId;
  }

  putPlayerToSleep(targetId: string, dreamkeeperId: string) {
    console.log('Putting player to sleep:', targetId);
    this.sleepingTarget = targetId;
    const player = this.players.get(targetId);
    if (player) {
      player.putToSleep(this.nightNumber);
    }
  }

  charmPlayer(targetId: string) {
    console.log('Charming player:', targetId);
    this.charmedTarget = targetId;
  }

  handleDreamkeeperAutoTarget(dreamkeeperId: string) {
    // If Dreamkeeper didn't choose, randomly select a target (not self)
    const dreamkeeper = this.players.get(dreamkeeperId);
    if (!dreamkeeper) return;

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

  witchAction(playerId: string, action: 'SAVE' | 'POISON', targetId: string) {
    const player = this.players.get(playerId);
    if (!player || !(player.role instanceof Witch)) return;
    console.log("Has save potion", player.role.hasSavePotion);
    console.log("Has poison potion", player.role.hasPoisonPotion);
    if (action === 'SAVE' && player.role.hasSavePotion) {
      this.witchSaveUsedThisTurn = true;
      this.savedTarget = targetId;
      player.role.useSave();
    } else if (action === 'POISON' && player.role.hasPoisonPotion && targetId) {
      this.witchPoisonTarget = targetId;
      player.role.usePoison();
    }
    this.broadcastState();
  }

  sendSeerResult(seerId: string, targetName: string, isWerewolf: boolean) {
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
    const deadPlayers: Set<string> = new Set();

    // Werewolf kill
    if (this.nightKillTarget) {
      if (this.nightKillTarget !== this.protectedTarget) {
        // Check if target is asleep (immune to death)
        const target = this.players.get(this.nightKillTarget);
        if (!target?.asleep) {
          deadPlayers.add(this.nightKillTarget);
        } else {
          console.log('Player is asleep and immune to werewolf kill:', this.nightKillTarget);
        }
      }
    }

    // Witch poison
    if (this.witchPoisonTarget) {
      deadPlayers.add(this.witchPoisonTarget);
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
      if (p) p.die();
    });

    // Check if Hunter died and trigger revenge
    const hunterDied = Array.from(deadPlayers).find(pid => {
      const player = this.players.get(pid);
      return player?.role?.type === RoleType.HUNTER && player.role instanceof Hunter && player.role.canUseRevengeAbility;
    });
    console.log("HungerID: ", hunterDied);
    console.log("WolfBeautyID: ", this.charmedTarget);
    if (hunterDied && hunterDied !== this.charmedTarget) {
      this.triggerHunterRevenge(hunterDied);
      return; // Don't transition to day yet, wait for Hunter revenge
    }

    this.phase = GamePhase.DAY;
    this.broadcastState();

    // Check win
    this.checkWinCondition();
  }

  handleDayVote(voterId: string, targetId: string) {
    this.dayVotes.set(voterId, targetId);
    this.broadcastState();
  }

  endDay() {
    // Handle deaths from 2 consecutive nights of sleep
    const sleepDeaths: string[] = [];
    this.players.forEach(player => {
      if (player.isAlive && player.consecutiveSleepNights >= 2) {
        console.log('Player died from sleeping 2 consecutive nights:', player.name);
        sleepDeaths.push(player.id);
        player.die();
        player.resetSleepTracking();
      }
    });

    // Resolve voting
    const votes: Record<string, number> = {};
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
        if (p.role?.type === RoleType.HUNTER && p.role instanceof Hunter && p.role.canUseRevengeAbility) {
          this.dayVotes.clear();
          this.triggerHunterRevenge(target);
          return; // Don't transition to night yet, wait for Hunter revenge
        }
      }
    }

    this.dayVotes.clear();
    this.phase = GamePhase.NIGHT;
    this.startNightPhase();
    this.broadcastState();
    this.checkWinCondition();
  }

  checkWinCondition() {
    const alive = Array.from(this.players.values()).filter(p => p.isAlive);
    const wolves = alive.filter(p => p.role?.team === Team.WEREWOLF);
    const villagers = alive.filter(p => p.role?.team === Team.VILLAGER);

    if (wolves.length === 0) {
      this.phase = GamePhase.GAME_OVER;
      this.broadcastState({ winner: Team.VILLAGER });
    } else if (wolves.length >= villagers.length) {
      this.phase = GamePhase.GAME_OVER;
      this.broadcastState({ winner: Team.WEREWOLF });
    }
  }

  // Helper to send full state to clients
  broadcastState(extraData: any = {}) {
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
        role: (this.phase === GamePhase.GAME_OVER || p.id === player.id) ? p.role : null
      }));

      // Convert werewolfTargets Map to object for JSON serialization
      const werewolfTargetsObj: Record<string, string> = {};
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
        nightKillTarget: (player.role?.team === Team.WEREWOLF || player.role?.type === RoleType.WITCH) ? this.nightKillTarget : null,
        // Werewolves see all werewolf targets
        werewolfTargets: player.role?.team === Team.WEREWOLF ? werewolfTargetsObj : null,
        ...extraData
      };

      this.onStateChange(player.socketId, state);
    });
  }

  // Hunter Revenge Methods
  triggerHunterRevenge(hunterId: string) {
    const hunter = this.players.get(hunterId);
    if (!hunter || !(hunter.role instanceof Hunter)) return;

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

  handleHunterRevenge(hunterId: string, targetId: string) {
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

  completeHunterRevenge(hunterId: string, targetId: string | null) {
    const hunter = this.players.get(hunterId);
    if (!hunter || !(hunter.role instanceof Hunter)) return;

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
    if (this.phase === GamePhase.NIGHT) {
      this.phase = GamePhase.DAY;
    } else if (this.phase === GamePhase.DAY) {
      this.phase = GamePhase.NIGHT;
      this.startNightPhase();
    }

    this.broadcastState();
    this.checkWinCondition();
  }
}
