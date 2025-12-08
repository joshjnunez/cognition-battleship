import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInitialAiState,
  getAiMoveForDifficulty,
  updateAiStateAfterShot,
} from './ai';
import { AiState, Board, Cell, Coordinates, GameState, Ship } from './types';

const createEmptyBoard = (size: number = 10): Board => {
  const cells: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({
        coordinates: { x, y },
        status: 'empty',
      });
    }
    cells.push(row);
  }
  return { size, cells, ships: [] };
};

const createTestShip = (
  id: string,
  length: number,
  coordinates: Coordinates[],
  hits: number = 0
): Ship => ({
  id,
  name: `Ship-${id}`,
  length,
  coordinates,
  hits,
});

const createTestGameState = (
  board: Board,
  difficulty: 'easy' | 'medium' | 'hard',
  aiState: AiState
): GameState => ({
  playerBoard: board,
  aiBoard: createEmptyBoard(),
  currentTurn: 'ai',
  phase: 'playing',
  winner: null,
  turnCount: 1,
  difficulty,
  aiState,
  scores: { player1: 0, player2: 0 },
});

const isAdjacent = (a: Coordinates, b: Coordinates): boolean => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

describe('AI Difficulty Behavior', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('Easy AI - Random behavior', () => {
    it('should select a random cell without preferring adjacent cells after a hit', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState = updateAiStateAfterShot(
        createInitialAiState(),
        hitCoord,
        true,
        board
      );

      expect(aiState.huntQueue.length).toBeGreaterThan(0);

      randomSpy.mockReturnValue(0.99);

      const gameState = createTestGameState(board, 'easy', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
      if (move) {
        const adjacentToHit = isAdjacent(move, hitCoord);
        expect(adjacentToHit).toBe(false);
      }
    });

    it('should be able to select any valid cell based on Math.random', () => {
      const board = createEmptyBoard(3);
      const aiState = createInitialAiState();

      randomSpy.mockReturnValue(0);
      const gameState1 = createTestGameState(board, 'easy', aiState);
      const move1 = getAiMoveForDifficulty(gameState1);

      randomSpy.mockReturnValue(0.5);
      const move2 = getAiMoveForDifficulty(gameState1);

      randomSpy.mockReturnValue(0.99);
      const move3 = getAiMoveForDifficulty(gameState1);

      expect(move1).not.toBeNull();
      expect(move2).not.toBeNull();
      expect(move3).not.toBeNull();

      const moves = [move1, move2, move3].filter(Boolean) as Coordinates[];
      const uniqueMoves = new Set(moves.map((m) => `${m.x},${m.y}`));
      expect(uniqueMoves.size).toBeGreaterThan(1);
    });

    it('should ignore huntQueue even when it has valid targets', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState = updateAiStateAfterShot(
        createInitialAiState(),
        hitCoord,
        true,
        board
      );

      const adjacentCells = aiState.huntQueue;
      expect(adjacentCells.length).toBeGreaterThan(0);

      randomSpy.mockReturnValue(0);

      const gameState = createTestGameState(board, 'easy', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
      const isFromHuntQueue = adjacentCells.some(
        (c) => move && c.x === move.x && c.y === move.y
      );
      expect(isFromHuntQueue).toBe(false);
    });
  });

  describe('Medium AI - Hunt and Target behavior', () => {
    it('should prefer adjacent cells after a hit', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState = updateAiStateAfterShot(
        createInitialAiState(),
        hitCoord,
        true,
        board
      );

      const gameState = createTestGameState(board, 'medium', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
      if (move) {
        expect(isAdjacent(move, hitCoord)).toBe(true);
      }
    });

    it('should use huntQueue targets before falling back to random', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState = updateAiStateAfterShot(
        createInitialAiState(),
        hitCoord,
        true,
        board
      );

      const gameState = createTestGameState(board, 'medium', aiState);

      for (let i = 0; i < 4; i++) {
        const move = getAiMoveForDifficulty(gameState);
        if (move && aiState.huntQueue.length > 0) {
          expect(isAdjacent(move, hitCoord)).toBe(true);
        }
      }
    });

    it('should fall back to random when huntQueue is empty', () => {
      const board = createEmptyBoard(5);
      const aiState = createInitialAiState();

      randomSpy.mockReturnValue(0.5);

      const gameState = createTestGameState(board, 'medium', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
    });

    it('should keep firing near a cluster of hits over multiple turns', () => {
      const board = createEmptyBoard(7);
      const firstHit: Coordinates = { x: 3, y: 3 };
      const secondHit: Coordinates = { x: 4, y: 3 };

      // Mark hits on the board and a partial ship so it is not yet sunk.
      board.cells[firstHit.y][firstHit.x].status = 'hit';
      board.cells[firstHit.y][firstHit.x].shipId = 'ship1';
      board.cells[secondHit.y][secondHit.x].status = 'hit';
      board.cells[secondHit.y][secondHit.x].shipId = 'ship1';

      const ship = createTestShip(
        'ship1',
        3,
        [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 5, y: 3 },
        ],
        2,
      );
      board.ships = [ship];

      // Build up AI state as if it has just scored two hits in a row.
      let aiState = createInitialAiState();
      aiState = updateAiStateAfterShot(aiState, firstHit, true, board);
      aiState = updateAiStateAfterShot(aiState, secondHit, true, board);

      // Over several turns, the AI should keep choosing cells adjacent
      // to at least one of the known hits, instead of wandering far away.
      const gameStateBase = createTestGameState(board, 'medium', aiState);
      const cluster = [firstHit, secondHit];

      for (let i = 0; i < 4; i++) {
        const move = getAiMoveForDifficulty(gameStateBase);
        expect(move).not.toBeNull();
        if (move) {
          const nearAnyHit = cluster.some((hit) => isAdjacent(move, hit));
          expect(nearAnyHit).toBe(true);
        }
      }
    });
  });

  describe('Hard AI - Probability-based behavior', () => {
    it('should prefer adjacent cells after a hit due to 3x probability boost', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState: AiState = {
        shotHistory: [hitCoord],
        huntQueue: [],
        lastHit: hitCoord,
        currentDirection: null,
        hitStreak: [hitCoord],
      };

      const gameState = createTestGameState(board, 'hard', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
      if (move) {
        expect(isAdjacent(move, hitCoord)).toBe(true);
      }
    });

    it('should consistently choose adjacent cells over non-adjacent cells after hits', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiState: AiState = {
        shotHistory: [hitCoord],
        huntQueue: [],
        lastHit: hitCoord,
        currentDirection: null,
        hitStreak: [hitCoord],
      };

      const gameState = createTestGameState(board, 'hard', aiState);

      for (let i = 0; i < 5; i++) {
        randomSpy.mockReturnValue(i * 0.2);
        const move = getAiMoveForDifficulty(gameState);
        expect(move).not.toBeNull();
        if (move) {
          expect(isAdjacent(move, hitCoord)).toBe(true);
        }
      }
    });

    it('should use probability calculation when no hits exist', () => {
      const board = createEmptyBoard(5);

      const ship = createTestShip('ship1', 3, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ], 0);
      board.ships = [ship];

      const aiState = createInitialAiState();

      randomSpy.mockReturnValue(0.5);

      const gameState = createTestGameState(board, 'hard', aiState);
      const move = getAiMoveForDifficulty(gameState);

      expect(move).not.toBeNull();
    });
  });

  describe('updateAiStateAfterShot', () => {
    it('should populate huntQueue with adjacent cells after a hit', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const initialState = createInitialAiState();
      const newState = updateAiStateAfterShot(initialState, hitCoord, true, board);

      expect(newState.huntQueue.length).toBe(4);

      const expectedAdjacent = [
        { x: 2, y: 1 },
        { x: 2, y: 3 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
      ];

      for (const expected of expectedAdjacent) {
        const found = newState.huntQueue.some(
          (c) => c.x === expected.x && c.y === expected.y
        );
        expect(found).toBe(true);
      }
    });

    it('should clear huntQueue and reset state when ship is sunk', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 1, [{ x: 2, y: 2 }], 1);
      board.ships = [ship];

      const stateWithHunts: AiState = {
        shotHistory: [],
        huntQueue: [
          { x: 2, y: 1 },
          { x: 2, y: 3 },
        ],
        lastHit: { x: 2, y: 2 },
        currentDirection: 'right',
        hitStreak: [{ x: 2, y: 2 }],
      };

      const newState = updateAiStateAfterShot(
        stateWithHunts,
        hitCoord,
        true,
        board,
        ship
      );

      expect(newState.hitStreak).toEqual([]);
      expect(newState.lastHit).toBeNull();
      expect(newState.currentDirection).toBeNull();
    });

    it('should add target to shotHistory', () => {
      const board = createEmptyBoard(5);
      const target: Coordinates = { x: 1, y: 1 };

      const initialState = createInitialAiState();
      const newState = updateAiStateAfterShot(initialState, target, false, board);

      expect(newState.shotHistory).toContainEqual(target);
    });
  });

  describe('Comparison: Easy vs Medium vs Hard after hit', () => {
    it('Medium and Hard should prefer adjacent cells while Easy does not', () => {
      const board = createEmptyBoard(5);
      const hitCoord: Coordinates = { x: 2, y: 2 };

      board.cells[hitCoord.y][hitCoord.x].status = 'hit';
      board.cells[hitCoord.y][hitCoord.x].shipId = 'ship1';

      const ship = createTestShip('ship1', 3, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ], 1);
      board.ships = [ship];

      const aiStateAfterHit = updateAiStateAfterShot(
        createInitialAiState(),
        hitCoord,
        true,
        board
      );

      randomSpy.mockReturnValue(0.99);
      const easyState = createTestGameState(board, 'easy', aiStateAfterHit);
      const easyMove = getAiMoveForDifficulty(easyState);

      const mediumState = createTestGameState(board, 'medium', aiStateAfterHit);
      const mediumMove = getAiMoveForDifficulty(mediumState);

      const hardAiState: AiState = {
        shotHistory: [hitCoord],
        huntQueue: [],
        lastHit: hitCoord,
        currentDirection: null,
        hitStreak: [hitCoord],
      };
      const hardState = createTestGameState(board, 'hard', hardAiState);
      const hardMove = getAiMoveForDifficulty(hardState);

      expect(easyMove).not.toBeNull();
      expect(mediumMove).not.toBeNull();
      expect(hardMove).not.toBeNull();

      if (easyMove) {
        expect(isAdjacent(easyMove, hitCoord)).toBe(false);
      }

      if (mediumMove) {
        expect(isAdjacent(mediumMove, hitCoord)).toBe(true);
      }

      if (hardMove) {
        expect(isAdjacent(hardMove, hitCoord)).toBe(true);
      }
    });
  });
});
