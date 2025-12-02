export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export interface Coordinates {
  x: number;
  y: number;
}

export interface Cell {
  coordinates: Coordinates;
  status: CellStatus;
  shipId?: string;
}

export interface Ship {
  id: string;
  name: string;
  length: number;
  coordinates: Coordinates[];
  hits: number;
}

export interface Board {
  size: number;
  cells: Cell[][];
  ships: Ship[];
}

export type PlayerType = 'human' | 'ai';

export type GamePhase = 'placing' | 'playing' | 'finished';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AiState {
  shotHistory: Coordinates[];
  huntQueue: Coordinates[];
  lastHit: Coordinates | null;
  currentDirection: 'up' | 'down' | 'left' | 'right' | null;
  hitStreak: Coordinates[];
}

export interface GameState {
  playerBoard: Board;
  aiBoard: Board;
  currentTurn: PlayerType;
  phase: GamePhase;
  winner: PlayerType | null;
  turnCount: number;
  difficulty: Difficulty;
  aiState: AiState;
}
