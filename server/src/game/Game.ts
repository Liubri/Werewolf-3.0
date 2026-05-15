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
import { Magician } from '../roles/Magician';
import { Guard } from '../roles/Guard';
import { Demonhunter } from '../roles/Demonhunter';
import { Knight } from '../roles/Knight';
import { Gravedigger } from '../roles/Gravedigger';
import { Fool } from '../roles/Fool';
import { Crow } from '../roles/Crow';

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
  savedTarget: string | null = null;
  witchSaveUsedThisTurn: boolean = false;
  witchPoisonTarget: string | null = null;

  // Guard State
  protectedTarget: string | null = null;

  // Dreamkeeper State
  sleepingTarget: string | null = null;
  dreamKeeperId: string | null = null;
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

  // Magician State
  swappedIds: [string, string] | null = null;
  swappedPlayersHistory: Set<string> = new Set(); // Track players who have been swapped

  // Demonhunter State
  demonHunterId: string | null = null;
  huntedTarget: string | null = null;
  demonHunterDies: string | null = null;
  
  // Knight State
  knightId: string | null = null;
  knightTarget: string | null = null;

  // Crow State
  crowTargetId: string | null = null;

  constructor(id: string, hostId: string, onStateChange: any, onPrivateMessage: any) {
    this.id = id;
    this.hostId = hostId;
    this.onStateChange = onStateChange;
    this.onPrivateMessage = onPrivateMessage;
    this.settings = {
      roleCounts: {
        [RoleType.WEREWOLF]: 1,
        [RoleType.VILLAGER]: 1,
        [RoleType.SEER]: 0,
        [RoleType.WITCH]: 1,
        [RoleType.DREAMKEEPER]: 0,
        [RoleType.HUNTER]: 1,
        [RoleType.WOLFBEAUTY]: 0,
        [RoleType.MAGICIAN]: 0,
        [RoleType.GUARD]: 0,
        [RoleType.DEMONHUNTER]: 0,
        [RoleType.KNIGHT]: 0,
        [RoleType.GRAVEDIGGER]: 1,
        [RoleType.FOOL]: 0,
        [RoleType.CROW]: 0
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
      for (let i = 0; i < count; i++) roleStack.push(new RoleClass());
    };

    // Adjust counts based on player size if needed, but for now trust settings
    // Or just fill with Villagers if not enough
    addRole(Werewolf, this.settings.roleCounts[RoleType.WEREWOLF]);
    addRole(Seer, this.settings.roleCounts[RoleType.SEER]);
    addRole(Witch, this.settings.roleCounts[RoleType.WITCH]);
    addRole(Dreamkeeper, this.settings.roleCounts[RoleType.DREAMKEEPER]);
    addRole(Hunter, this.settings.roleCounts[RoleType.HUNTER]);
    addRole(WolfBeauty, this.settings.roleCounts[RoleType.WOLFBEAUTY]);
    addRole(Magician, this.settings.roleCounts[RoleType.MAGICIAN]);
    addRole(Guard, this.settings.roleCounts[RoleType.GUARD]);
    addRole(Demonhunter, this.settings.roleCounts[RoleType.DEMONHUNTER]);
    addRole(Knight, this.settings.roleCounts[RoleType.KNIGHT]);
    addRole(Gravedigger, this.settings.roleCounts[RoleType.GRAVEDIGGER]);
    addRole(Fool, this.settings.roleCounts[RoleType.FOOL]);
    addRole(Crow, this.settings.roleCounts[RoleType.CROW]);

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
          this.dreamKeeperId = pid;
        } else if (player.role.type === RoleType.WOLFBEAUTY) {
          this.wolfBeautyId = pid;
        } else if (player.role.type === RoleType.DEMONHUNTER) {
          this.demonHunterId = pid;
        } else if (player.role.type === RoleType.KNIGHT) {
          this.knightId = pid;
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
    this.huntedTarget = null;
    this.knightTarget = null;
    this.crowTargetId = null;
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
    // Resolve the target through Magician's ID swap if applicable
    this.nightKillTarget = target ? this.swappedTargetId(target) : null;
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

  protectPlayer(targetId: string, guardRole: any, guardId: string) {
    console.log('Protecting player:', targetId);
    const resolvedTarget = this.swappedTargetId(targetId);
    const player = this.players.get(resolvedTarget);
    if (player) {
      player.protectedId = guardId;
    }
    this.protectedTarget = resolvedTarget;

    // Update Guard role tracking
    if (guardRole) {
      guardRole.lastProtectedId = resolvedTarget;
      guardRole.lastProtectedNight = this.nightNumber;
    }
  }

  putPlayerToSleep(targetId: string, dreamkeeperId: string) {
    const resolvedTarget = this.swappedTargetId(targetId);
    console.log('Putting player to sleep:', resolvedTarget);
    this.sleepingTarget = resolvedTarget;
    const player = this.players.get(resolvedTarget);
    if (player) {
      player.putToSleep(this.nightNumber);
      player.asleepId = dreamkeeperId;
    }
  }

  charmPlayer(targetId: string) {
    const resolvedTarget = this.swappedTargetId(targetId);
    console.log('Charming player:', resolvedTarget);
    this.charmedTarget = resolvedTarget;
  }

  crowAction(targetId: string, crowRole: any) {
    // Cannot curse the same player two nights in a row
    if (crowRole.lastCursedId === targetId && crowRole.lastCursedNight === this.nightNumber - 1) {
      return;
    }
    crowRole.lastCursedId = targetId;
    crowRole.lastCursedNight = this.nightNumber;
    this.crowTargetId = targetId;
  }

  swapPlayerIds(playerId1: string, playerId2: string) {
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

  getEligibleSwapTargets(): string[] {
    return Array.from(this.players.values())
      .filter(p => p.isAlive && !this.swappedPlayersHistory.has(p.id))
      .map(p => p.id);
  }

  swappedTargetId(targetId: string): string {
    if (!this.swappedIds) return targetId;

    const [id1, id2] = this.swappedIds;
    if (targetId === id1) {
      console.log('Resolving target:', targetId, '->', id2);
      return id2;
    } else if (targetId === id2) {
      console.log('Resolving target:', targetId, '->', id1);
      return id1;
    }

    return targetId;
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
      const resolvedTarget = this.swappedTargetId(targetId);
      this.putPlayerToSleep(resolvedTarget, dreamkeeperId);
    }
  }

  witchAction(playerId: string, action: 'SAVE' | 'POISON', targetId: string) {
    const player = this.players.get(playerId);
    if (!player || !(player.role instanceof Witch)) return;
    // console.log("Has save potion", player.role.hasSavePotion);
    // console.log("Has poison potion", player.role.hasPoisonPotion);
    const resolvedTarget = this.swappedTargetId(targetId);
    const targetPlayer = this.players.get(resolvedTarget);
    if (action === 'SAVE' && player.role.hasSavePotion) {
      this.witchSaveUsedThisTurn = true;
      this.savedTarget = targetId;
      player.role.useSave();
    } else if (action === 'POISON' && player.role.hasPoisonPotion && targetPlayer) {
      this.witchPoisonTarget = resolvedTarget;
      player.role.usePoison();
      targetPlayer.poisonedId = playerId;
    }
    this.broadcastState();
  }

  sendSeerResult(seerId: string, targetId: string, targetName: string, isWerewolf: boolean) {
    const seer = this.players.get(seerId);
    if (seer) {
      this.onPrivateMessage(seer.socketId, 'SEER_RESULT', { targetId, targetName, isWerewolf });
    }
  }

  demonHunterAction(targetId: string) {
    const resolvedTarget = this.swappedTargetId(targetId);
    const player = this.players.get(resolvedTarget)
    if (player?.isBadTeam()) {
      this.huntedTarget = resolvedTarget;
    } else {
      this.demonHunterDies = this.demonHunterId;
    }
  }
  
  knightAction(targetId: string) {
    const resolvedTarget = this.swappedTargetId(targetId);
    const player = this.players.get(resolvedTarget);
    this.knightTarget = resolvedTarget;

    if (this.wolfBeautyId === resolvedTarget) {
      // Remove charm if Knight targets Wolf Beauty
      this.charmedTarget = null; 
      const wolfBeauty = this.players.get(this.wolfBeautyId);
      wolfBeauty?.die();
    } else if (player?.isBadTeam()) {
      player.die();
    } else {
      const knight = this.players.get(this.knightId!);
      knight?.die();
    }
    this.broadcastState();
  }
  

  endNight() {
    this.werewolfTargets.clear();
    // Handle Dreamkeeper auto-targeting if no choice was made
    if (this.dreamKeeperId && !this.sleepingTarget) {
      const dreamkeeper = this.players.get(this.dreamKeeperId);
      if (dreamkeeper && dreamkeeper.isAlive) {
        this.handleDreamkeeperAutoTarget(this.dreamKeeperId);
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

    // Demon Hunter kill
    if (this.huntedTarget) {
      deadPlayers.add(this.huntedTarget);
    } else if (this.demonHunterDies) {
      deadPlayers.add(this.demonHunterDies);
    }

    // Witch poison
    if (this.witchPoisonTarget) {
      if (this.demonHunterId === this.witchPoisonTarget) {
        console.log("Demon hunter immune to witch poison");
      } else {
        deadPlayers.add(this.witchPoisonTarget);
      }
    }

    // Witch save target
    if (this.witchSaveUsedThisTurn && this.savedTarget) {
      deadPlayers.delete(this.savedTarget);
    }

    //If witch saved and guard protected save target
    if (this.protectedTarget && this.savedTarget === this.protectedTarget) {
      deadPlayers.add(this.protectedTarget)
    }

    // Check if Dreamkeeper died - if so, sleeping player also dies
    const dreamkeeperDied = this.dreamKeeperId && deadPlayers.has(this.dreamKeeperId);
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

    // Knight action
    if (this.knightTarget && this.knightTarget === this.wolfBeautyId) {
      deadPlayers.delete(this.charmedTarget!);
    }

    // Apply deaths
    deadPlayers.forEach(pid => {
      const p = this.players.get(pid);
      if (p) p.die();
    });

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

    // Check if Hunter died and trigger revenge
    const hunterDied = Array.from(deadPlayers).find(pid => {
      const player = this.players.get(pid);
      return player?.role?.type === RoleType.HUNTER && player.role instanceof Hunter && player.role.canUseRevengeAbility;
    });

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
    const voter = this.players.get(voterId);
    if (voter && !voter.canVote) {
      // Fool cannot vote after being revealed
      return;
    }
    this.dayVotes.set(voterId, targetId);
    this.broadcastState();
  }

  endDay() {
    // Resolve voting
    const votes: Record<string, number> = {};
    this.dayVotes.forEach(target => {
      votes[target] = (votes[target] || 0) + 1;
    });

    // Apply Crow curse: +1 vote to cursed target
    if (this.crowTargetId) {
      votes[this.crowTargetId] = (votes[this.crowTargetId] || 0) + 1;
    }

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
        // Check if Fool is voted out
        if (p.role?.type === RoleType.FOOL) {
          p.foolRevealed = true;
          p.canVote = false;
          // Fool survives, so don't die
        } else {
          p.die();

          // Set graveDiggerId when player is voted out
          const gravediggers = Array.from(this.players.values()).filter(player => player.role && player.role.type === RoleType.GRAVEDIGGER);
          if (gravediggers.length > 0) {
            p.graveDiggerId = gravediggers[0].id;
          }

          // Check if Hunter died and trigger revenge
          if (p.role?.type === RoleType.HUNTER && p.role instanceof Hunter && p.role.canUseRevengeAbility) {
            this.dayVotes.clear();
            this.triggerHunterRevenge(target);
            return; // Don't transition to night yet, wait for Hunter revenge
          }
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
    const goodPeople = alive.filter(p => p.role?.team === Team.VILLAGER);
    const villagers = alive.filter(p => p.role?.type === RoleType.VILLAGER);

    if (wolves.length === 0) {
      this.phase = GamePhase.GAME_OVER;
      this.broadcastState({ winner: Team.VILLAGER });
    } else if (wolves.length >= goodPeople.length || villagers.length === 0) {
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
        role: (this.phase === GamePhase.GAME_OVER || p.id === player.id) ? p.role : null,
        // Night status
        protected: p.protectedId,
        poisoned: p.poisonedId,
        asleep: p.asleepId,
        knightRevealed: p.knightRevealed,
        foolRevealed: p.foolRevealed,
        graveDiggerId: p.graveDiggerId
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
        nightNumber: this.nightNumber,
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
