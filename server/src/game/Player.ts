import { Role } from '../roles/Role';
import { Team } from './types';

export class Player {
  id: string;
  name: string;
  socketId: string;
  role: Role | null;
  isAlive: boolean;
  isReady: boolean;
  
  // Night status
  protectedId: string | null;
  poisonedId: string | null;
  
  // Sleep status (Dreamkeeper ability)
  asleepId: string | null;
  consecutiveSleepNights: number;
  lastSleptNight: number;

  // Track if Knight has revealed themselves
  knightRevealed: boolean;

  // Track if Fool has been voted out (survives but loses voting rights)
  foolRevealed: boolean;
  canVote: boolean;

  // ID of the gravedigger who can see this player's alignment (set when voted out)
  graveDiggerId?: string;

  constructor(id: string, name: string, socketId: string) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.role = null;
    this.isAlive = true;
    this.isReady = false;
    this.protectedId = null;
    this.poisonedId = null;
    this.asleepId = null;
    this.knightRevealed = false;
    this.foolRevealed = false;
    this.canVote = true;
    this.consecutiveSleepNights = 0;
    this.lastSleptNight = -1;
  }

  isGoodTeam() {
    return this.role?.team === Team.VILLAGER;
  }

  isBadTeam() {
    return this.role?.team === Team.WEREWOLF;
  }

  resetNightStatus() {
    this.protectedId = null;
    this.poisonedId = null;
    this.asleepId = null;
  }

  putToSleep(nightNumber: number) {
    // Check if this is consecutive
    if (this.lastSleptNight === nightNumber - 1) {
      this.consecutiveSleepNights++;
    } else {
      this.consecutiveSleepNights = 1;
    }
    
    this.lastSleptNight = nightNumber;
  }

  wakeUp() {
    this.asleepId = null;
  }

  resetSleepTracking() {
    this.consecutiveSleepNights = 0;
    this.lastSleptNight = -1;
  }

  die() {
    this.isAlive = false;
  }
}
