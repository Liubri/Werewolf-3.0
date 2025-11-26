import { Player } from './Player';
import { GamePhase, RoleType, Team, GameSettings } from './types';
import { Role } from '../roles/Role';
import { Werewolf } from '../roles/Werewolf';
import { Villager } from '../roles/Villager';
import { Seer } from '../roles/Seer';
import { Witch } from '../roles/Witch';
import { Dreamkeeper } from '../roles/Dreamkeeper';

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
  protectedTarget: string | null = null;
  witchSaveUsedThisTurn: boolean = false;
  witchPoisonTarget: string | null = null;
  
  // Voting State
  dayVotes: Map<string, string> = new Map(); // voterId -> targetId

  constructor(id: string, hostId: string, onStateChange: any, onPrivateMessage: any) {
    this.id = id;
    this.hostId = hostId;
    this.onStateChange = onStateChange;
    this.onPrivateMessage = onPrivateMessage;
    this.settings = {
      roleCounts: {
        [RoleType.WEREWOLF]: 1,
        [RoleType.VILLAGER]: 2,
        [RoleType.SEER]: 1,
        [RoleType.WITCH]: 1,
        [RoleType.DREAMKEEPER]: 0
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
    
    // Fill rest with Villagers
    while (roleStack.length < playerIds.length) {
      roleStack.push(new Villager());
    }

    playerIds.forEach((pid, index) => {
      const player = this.players.get(pid);
      if (player) {
        player.role = roleStack[index];
      }
    });
  }

  startNightPhase() {
    // Reset night state
    this.nightKillTarget = null;
    this.werewolfVotes.clear();
    this.protectedTarget = null;
    this.witchSaveUsedThisTurn = false;
    this.witchPoisonTarget = null;
    
    this.players.forEach(p => p.resetNightStatus());
    
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

  protectPlayer(targetId: string) {
    console.log('Protecting player:', targetId);
    this.protectedTarget = targetId;
  }

  witchAction(playerId: string, action: 'SAVE' | 'POISON', targetId?: string) {
    const player = this.players.get(playerId);
    if (!player || !(player.role instanceof Witch)) return;
    
    if (action === 'SAVE' && player.role.hasSavePotion) {
       this.witchSaveUsedThisTurn = true;
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
    // Resolve everything
    const deadPlayers: string[] = [];

    // Werewolf kill
    if (this.nightKillTarget) {
      if (this.nightKillTarget !== this.protectedTarget && !this.witchSaveUsedThisTurn) {
        deadPlayers.push(this.nightKillTarget);
      }
    }

    // Witch poison
    if (this.witchPoisonTarget) {
      deadPlayers.push(this.witchPoisonTarget);
    }

    // Apply deaths
    deadPlayers.forEach(pid => {
      const p = this.players.get(pid);
      if (p) p.die();
    });

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
      if (p) p.die();
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

      const state = {
        id: this.id,
        hostId: this.hostId,
        phase: this.phase,
        players: publicPlayers,
        // Add other phase info
        // Wolves see their target, Witch sees it too (to save)
        nightKillTarget: (player.role?.team === Team.WEREWOLF || player.role?.type === RoleType.WITCH) ? this.nightKillTarget : null,
        ...extraData
      };
      
      this.onStateChange(player.socketId, state);
    });
  }
}
