import { Role } from '../roles/Role';

export class Player {
  id: string;
  name: string;
  socketId: string;
  role: Role | null;
  isAlive: boolean;
  isReady: boolean;
  
  // Night status
  protected: boolean;
  poisoned: boolean;
  
  // Sleep status (Dreamkeeper ability)
  asleep: boolean;
  consecutiveSleepNights: number;
  lastSleptNight: number;

  constructor(id: string, name: string, socketId: string) {
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

  putToSleep(nightNumber: number) {
    this.asleep = true;
    
    // Check if this is consecutive
    if (this.lastSleptNight === nightNumber - 1) {
      this.consecutiveSleepNights++;
    } else {
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
