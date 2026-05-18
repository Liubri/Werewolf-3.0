import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from './Game';
import { Player } from './Player';
import { GamePhase, RoleType, Team } from './types';
import { Witch } from '../roles/Witch';

describe('Game', () => {
  let game: Game;

  const mockCallback = () => {};
  const mockPrivateMessage = () => {};

  beforeEach(() => {
    game = new Game('test-game-1', 'host-1', mockCallback, mockPrivateMessage);
  });

  describe('Player Management', () => {
    it('should add players to the game', () => {
      const player = new Player('p1', 'Alice', 'socket-1');
      game.addPlayer(player);

      expect(game.players.size).toBe(1);
      expect(game.getPlayer('p1')).toBe(player);
    });

    it('should remove players from the game', () => {
      const player = new Player('p1', 'Alice', 'socket-1');
      game.addPlayer(player);
      game.removePlayer('p1');

      expect(game.players.size).toBe(0);
    });
  });

  describe('Game Start', () => {
    it('should not start with fewer than 4 players', () => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));

      game.start();

      expect(game.phase).toBe(GamePhase.LOBBY);
    });

    it('should start with 4 or more players', () => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();

      expect(game.phase).toBe(GamePhase.NIGHT);
      expect(game.nightNumber).toBe(1);
    });

    it('should assign roles to all players', () => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();

      let rolesAssigned = 0;
      game.players.forEach(player => {
        if (player.role) rolesAssigned++;
      });

      expect(rolesAssigned).toBe(4);
    });
  });

  describe('Night Actions - Werewolf Kill', () => {
    beforeEach(() => {
      // Setup: 4 players
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('should register werewolf vote', () => {
      game.registerWerewolfVote('p1', 'p2');

      expect(game.werewolfVotes.get('p1')).toBe('p2');
    });

    it('should kill target when werewolves agree on same target', () => {
      // Both p1 and p3 vote to kill p4
      game.registerWerewolfVote('p1', 'p4');
      game.registerWerewolfVote('p3', 'p4');

      // Simulate end of night
      game.nightKillTarget = 'p4';
      game.endNight();

      const target = game.getPlayer('p4');
      expect(target?.isAlive).toBe(false);
    });
  });

  describe('Night Actions - Guard Protection', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('should protect a player from werewolf kill', () => {
      const guard = game.getPlayer('p1');
      const target = game.getPlayer('p4');

      // Guard protects p4
      game.protectPlayer('p4', guard?.role, 'p1');

      // Werewolves vote to kill p4
      game.nightKillTarget = 'p4';
      game.endNight();

      // p4 should still be alive due to protection
      expect(target?.isAlive).toBe(true);
    });
  });

  describe('Swapped Target Resolution', () => {
    it('should resolve swapped targets correctly', () => {
      game.swappedIds = ['p1', 'p2'];

      const resolved1 = game.swappedTargetId('p1');
      const resolved2 = game.swappedTargetId('p2');
      const notSwapped = game.swappedTargetId('p3');

      expect(resolved1).toBe('p2');
      expect(resolved2).toBe('p1');
      expect(notSwapped).toBe('p3');
    });

    it('should return original target if no swap', () => {
      game.swappedIds = null;

      const resolved = game.swappedTargetId('p1');

      expect(resolved).toBe('p1');
    });
  });

  describe('Night State Reset', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('should reset night state when starting new night', () => {
      game.nightKillTarget = 'p1';
      game.protectedTarget = 'p2';
      game.werewolfVotes.set('p3', 'p4');

      game.startNightPhase();

      expect(game.nightKillTarget).toBeNull();
      expect(game.protectedTarget).toBeNull();
      expect(game.werewolfVotes.size).toBe(0);
    });
  });

  describe('Guard and Witch Same Target', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('should protect target when both guard and witch choose same target', () => {
      const guard = game.getPlayer('p1');
      const witch = game.getPlayer('p2');
      const target = game.getPlayer('p4');

      witch!.role = new Witch();
      guard!.role = { type: RoleType.GUARD, team: Team.VILLAGER } as any;

      // Guard protects p4
      game.protectPlayer('p4', guard?.role, 'p1');

      // Witch saves p4
      game.witchAction('p2', 'SAVE', 'p4');

      game.endNight();

      // p4 should not be alive (protected by both guard and witch)
      expect(target?.isAlive).toBe(false);
    });
  });

  describe('Witch targets Demon hunter', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('poison Demon hunter', () => {
      const witch = game.getPlayer('p1');
      const target = game.getPlayer('p4');

      witch!.role = { type: RoleType.WITCH, team: Team.VILLAGER } as any;
      target!.role = { type: RoleType.DEMONHUNTER, team: Team.VILLAGER } as any;
      
      game.witchAction('p1', 'POISON', 'p4');

      game.endNight();

      // p4 should be alive (poisoned by witch)
      expect(target?.isAlive).toBe(true);
    });
  });

  describe('White Maiden and Wolf Witch', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
      game.nightNumber = 2; // Enable Night 2+ abilities
    });

    it('handle Wolf Witch and White Maiden checking each other', () => {
      const whiteMaiden = game.getPlayer('p1');
      const wolfWitch = game.getPlayer('p2');

      // Manually assign roles for testing
      whiteMaiden!.role = { type: RoleType.WHITEMAIDEN, team: Team.VILLAGER } as any;
      wolfWitch!.role = { type: RoleType.WOLFWITCH, team: Team.WEREWOLF } as any;

      game.wolfWitchAction('p2', 'p1');

      // Wolf Witch checks White Maiden and learns she is one
      expect(game.wolfWitchTarget).toBe('p1');

      game.endNight();

      // White Maiden should be dead
      expect(whiteMaiden?.isAlive).toBe(false);
    });
  });

  describe('Dreamkeeper Sleep Status', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));

      game.start();
    });

    it('should mark player as asleep and prevent werewolf targeting', () => {
      const sleeper = game.getPlayer('p2');

      // Dreamkeeper puts p2 to sleep
      game.putPlayerToSleep('p2', 'p1');

      // Werewolves try to kill p2
      game.nightKillTarget = 'p2';
      game.endNight();

      // p2 should be alive and asleep (sleep protects from werewolf kill)
      expect(sleeper?.asleepId).toBe('p1'); // asleepId is the dreamkeeper's ID
      expect(sleeper?.isAlive).toBe(true);
    });

    it('same person is slept twice in a row', () => {
      // Night 1: Dreamkeeper targets p2
      game.putPlayerToSleep('p2', 'p1');

      // Start next night
      game.startNightPhase();

      const p2 = game.getPlayer('p2');

      // Try to sleep p2 again on Night 2
      game.putPlayerToSleep('p2', 'p1');

      game.endNight();

      expect(p2?.isAlive).toBe(false);
    });
  });

  describe('Werewolf Self Destruct', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));
      game.addPlayer(new Player('p5', 'Eve', 'socket-5'));
      game.addPlayer(new Player('p6', 'Frank', 'socket-6'));

      game.start();
    });

    it('change from day to night', () => {
      // Move to day phase (game starts at NIGHT)
      game.phase = GamePhase.DAY;
      const player = game.getPlayer('p1');

      // Player self-destructs
      game.selfDestructAbility('p1');

      // Check that player died
      expect(player?.isAlive).toBe(false);

      // Check that phase changed back to NIGHT
      expect(game.phase).toBe(GamePhase.NIGHT);
    });
  });

  describe('Knight kills Wolf Beauty', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));
      game.addPlayer(new Player('p5', 'Eve', 'socket-5'));
      game.addPlayer(new Player('p6', 'Frank', 'socket-6'));

      game.start();
    });

    it('charmed target survives when knight kills wolf beauty', () => {
      const knight = game.getPlayer('p1');
      const wolfBeauty = game.getPlayer('p2');
      const charmedTarget = game.getPlayer('p4');

      // Assign roles
      knight!.role = { type: RoleType.KNIGHT, team: Team.VILLAGER } as any;
      wolfBeauty!.role = { type: RoleType.WOLFBEAUTY, team: Team.WEREWOLF } as any;

      // Wolf Beauty charms p4
      game.charmPlayer('p4');
      expect(game.charmedTarget).toBe('p4');

      // Knight targets Wolf Beauty
      game.knightAction('p2');

      game.endNight();

      // Wolf Beauty should be dead
      expect(wolfBeauty?.isAlive).toBe(false);

      // Charmed target should be alive
      expect(charmedTarget?.isAlive).toBe(true);
    });
  });

  describe('Wolf Beauty dies', () => {
    beforeEach(() => {
      game.addPlayer(new Player('p1', 'Alice', 'socket-1'));
      game.addPlayer(new Player('p2', 'Bob', 'socket-2'));
      game.addPlayer(new Player('p3', 'Charlie', 'socket-3'));
      game.addPlayer(new Player('p4', 'Diana', 'socket-4'));
      game.addPlayer(new Player('p5', 'Eve', 'socket-5'));
      game.addPlayer(new Player('p6', 'Frank', 'socket-6'));

      game.start();
    });

    it('charmed target also dies when wolf beauty dies', () => {
      const wolfBeauty = game.getPlayer('p2');
      const charmedTarget = game.getPlayer('p4');
      const werewolf = game.getPlayer('p1');

      // Assign roles
      werewolf!.role = { type: RoleType.WEREWOLF, team: Team.WEREWOLF } as any;
      wolfBeauty!.role = { type: RoleType.WOLFBEAUTY, team: Team.WEREWOLF } as any;

      // Track Wolf Beauty ID for the endNight logic
      game.wolfBeautyId = 'p2';

      // Wolf Beauty charms p4
      game.charmPlayer('p4');
      expect(game.charmedTarget).toBe('p4');

      // Werewolves vote to kill Wolf Beauty
      game.registerWerewolfVote('p1', 'p2');
      game.nightKillTarget = 'p2';

      game.endNight();

      // Wolf Beauty should be dead
      expect(wolfBeauty?.isAlive).toBe(false);

      // Charmed target should also be dead
      expect(charmedTarget?.isAlive).toBe(false);
    });
  });
});