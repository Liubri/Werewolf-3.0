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

  constructor(id: string, name: string, socketId: string) {
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
