import { AiState, Board, Coordinates, GameState, Ship } from './types';

export const createInitialAiState = (): AiState => ({
  shotHistory: [],
  huntQueue: [],
  lastHit: null,
  currentDirection: null,
  hitStreak: [],
});

const coordsEqual = (a: Coordinates, b: Coordinates): boolean =>
  a.x === b.x && a.y === b.y;

const isValidTarget = (board: Board, coord: Coordinates, shotHistory: Coordinates[]): boolean => {
  if (coord.x < 0 || coord.y < 0 || coord.x >= board.size || coord.y >= board.size) {
    return false;
  }
  const cell = board.cells[coord.y][coord.x];
  if (cell.status === 'hit' || cell.status === 'miss') {
    return false;
  }
  return !shotHistory.some((shot) => coordsEqual(shot, coord));
};

const getAvailableCells = (board: Board, shotHistory: Coordinates[]): Coordinates[] => {
  const available: Coordinates[] = [];
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const coord = { x, y };
      if (isValidTarget(board, coord, shotHistory)) {
        available.push(coord);
      }
    }
  }
  return available;
};

const getAdjacentCells = (coord: Coordinates): Coordinates[] => [
  { x: coord.x, y: coord.y - 1 },
  { x: coord.x, y: coord.y + 1 },
  { x: coord.x - 1, y: coord.y },
  { x: coord.x + 1, y: coord.y },
];

const getEasyMove = (board: Board, aiState: AiState): Coordinates | null => {
  const available = getAvailableCells(board, aiState.shotHistory);
  if (available.length === 0) return null;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
};

const getMediumMove = (board: Board, aiState: AiState): Coordinates | null => {
  const validTargets = aiState.huntQueue.filter((coord) =>
    isValidTarget(board, coord, aiState.shotHistory)
  );

  if (validTargets.length > 0) {
    return validTargets[0];
  }

  return getEasyMove(board, aiState);
};

const getRemainingShips = (board: Board): Ship[] => {
  return board.ships.filter((ship) => ship.hits < ship.length);
};

const canShipFitAt = (
  board: Board,
  startX: number,
  startY: number,
  length: number,
  horizontal: boolean
): boolean => {
  for (let i = 0; i < length; i++) {
    const x = horizontal ? startX + i : startX;
    const y = horizontal ? startY : startY + i;

    if (x < 0 || y < 0 || x >= board.size || y >= board.size) {
      return false;
    }

    const cell = board.cells[y][x];
    if (cell.status === 'miss') {
      return false;
    }
  }
  return true;
};

const getHardMove = (board: Board, aiState: AiState): Coordinates | null => {
  const remainingShips = getRemainingShips(board);
  if (remainingShips.length === 0) {
    return getEasyMove(board, aiState);
  }

  const probabilityMap: number[][] = Array.from({ length: board.size }, () =>
    Array(board.size).fill(0)
  );

  const shipLengths = remainingShips.map((ship) => ship.length);

  for (const length of shipLengths) {
    for (let y = 0; y < board.size; y++) {
      for (let x = 0; x < board.size; x++) {
        if (canShipFitAt(board, x, y, length, true)) {
          for (let i = 0; i < length; i++) {
            const cell = board.cells[y][x + i];
            if (cell.status !== 'hit' && cell.status !== 'miss') {
              probabilityMap[y][x + i]++;
            }
          }
        }

        if (canShipFitAt(board, x, y, length, false)) {
          for (let i = 0; i < length; i++) {
            const cell = board.cells[y + i][x];
            if (cell.status !== 'hit' && cell.status !== 'miss') {
              probabilityMap[y + i][x]++;
            }
          }
        }
      }
    }
  }

  const unfinishedHits: Coordinates[] = [];
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = board.cells[y][x];
      if (cell.status === 'hit') {
        const ship = board.ships.find((s) => s.id === cell.shipId);
        if (ship && ship.hits < ship.length) {
          unfinishedHits.push({ x, y });
        }
      }
    }
  }

  if (unfinishedHits.length > 0) {
    for (const hit of unfinishedHits) {
      const adjacent = getAdjacentCells(hit);
      for (const adj of adjacent) {
        if (isValidTarget(board, adj, aiState.shotHistory)) {
          probabilityMap[adj.y][adj.x] *= 3;
        }
      }
    }
  }

  let maxProb = 0;
  const candidates: Coordinates[] = [];

  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = board.cells[y][x];
      if (cell.status === 'hit' || cell.status === 'miss') {
        continue;
      }
      if (aiState.shotHistory.some((shot) => coordsEqual(shot, { x, y }))) {
        continue;
      }

      const prob = probabilityMap[y][x];
      if (prob > maxProb) {
        maxProb = prob;
        candidates.length = 0;
        candidates.push({ x, y });
      } else if (prob === maxProb && prob > 0) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) {
    return getEasyMove(board, aiState);
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
};

export const getAiMoveForDifficulty = (gameState: GameState): Coordinates | null => {
  const { playerBoard, difficulty, aiState } = gameState;

  switch (difficulty) {
    case 'easy':
      return getEasyMove(playerBoard, aiState);
    case 'medium':
      return getMediumMove(playerBoard, aiState);
    case 'hard':
      return getHardMove(playerBoard, aiState);
    default:
      return getEasyMove(playerBoard, aiState);
  }
};

export const updateAiStateAfterShot = (
  aiState: AiState,
  target: Coordinates,
  wasHit: boolean,
  board: Board,
  sunkShip?: Ship
): AiState => {
  const newState: AiState = {
    ...aiState,
    shotHistory: [...aiState.shotHistory, target],
  };

  if (sunkShip) {
    newState.huntQueue = newState.huntQueue.filter((coord) => {
      const cell = board.cells[coord.y][coord.x];
      return cell.shipId !== sunkShip.id;
    });
    newState.hitStreak = [];
    newState.lastHit = null;
    newState.currentDirection = null;
    return newState;
  }

  if (wasHit) {
    newState.hitStreak = [...newState.hitStreak, target];
    newState.lastHit = target;

    const adjacent = getAdjacentCells(target);
    const validAdjacent = adjacent.filter((coord) =>
      isValidTarget(board, coord, newState.shotHistory) &&
      !newState.huntQueue.some((q) => coordsEqual(q, coord))
    );

    newState.huntQueue = [...validAdjacent, ...newState.huntQueue];
  } else {
    newState.huntQueue = newState.huntQueue.filter(
      (coord) => !coordsEqual(coord, target)
    );
  }

  return newState;
};
