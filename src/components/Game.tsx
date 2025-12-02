import { useState } from 'react';
import {
  allShipsSunk,
  canPlaceShipAt,
  createEmptyBoard,
  placeFleetRandomly,
  placeShipAt,
  receiveAttack,
} from '../game/board';
import { AiState, Board, Difficulty, GameState, Ship } from '../game/types';
import { createInitialAiState, getAiMoveForDifficulty, updateAiStateAfterShot } from '../game/ai';
import BoardView from './BoardView';

const DEFAULT_SIZE = 10;

const FLEET: Ship[] = [
  { id: 'carrier', name: 'Carrier', length: 5, coordinates: [], hits: 0 },
  { id: 'battleship', name: 'Battleship', length: 4, coordinates: [], hits: 0 },
  { id: 'cruiser', name: 'Cruiser', length: 3, coordinates: [], hits: 0 },
  { id: 'submarine', name: 'Submarine', length: 3, coordinates: [], hits: 0 },
  { id: 'destroyer', name: 'Destroyer', length: 2, coordinates: [], hits: 0 },
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Random shots',
  medium: 'Hunt & Target',
  hard: 'Monte Carlo',
};

const createInitialGameState = (difficulty: Difficulty): GameState => {
  const baseBoard = createEmptyBoard(DEFAULT_SIZE);
  const playerBoard = placeFleetRandomly(baseBoard, FLEET);
  const aiBoard = placeFleetRandomly(createEmptyBoard(DEFAULT_SIZE), FLEET);

  return {
    playerBoard,
    aiBoard,
    currentTurn: 'human',
    phase: 'playing',
    winner: null,
    turnCount: 0,
    difficulty,
    aiState: createInitialAiState(),
  };
};

export default function Game() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [state, setState] = useState<GameState>(() => createInitialGameState(selectedDifficulty));
  const [placementIndex, setPlacementIndex] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const gameOver = state.phase === 'finished';

  const startAutoGame = () => {
    setPlacementIndex(null);
    setState(createInitialGameState(selectedDifficulty));
  };

  const startManualPlacement = () => {
    setPlacementIndex(0);
    setOrientation('horizontal');

    const empty = createEmptyBoard(DEFAULT_SIZE);

    setState({
      playerBoard: empty,
      aiBoard: empty,
      currentTurn: 'human',
      phase: 'placing',
      winner: null,
      turnCount: 0,
      difficulty: selectedDifficulty,
      aiState: createInitialAiState(),
    });
  };

  const takeAiTurn = (
    board: Board,
    currentState: GameState
  ): { nextBoard: Board; aiWon: boolean; newAiState: AiState } => {
    const target = getAiMoveForDifficulty(currentState);
    if (!target) {
      const aiWon = allShipsSunk(board);
      return { nextBoard: board, aiWon, newAiState: currentState.aiState };
    }

    const { board: nextBoard, hit, sunkShip } = receiveAttack(board, target);
    const newAiState = updateAiStateAfterShot(currentState.aiState, target, hit, nextBoard, sunkShip);
    const aiWon = allShipsSunk(nextBoard);
    return { nextBoard, aiWon, newAiState };
  };

  const handleOpponentCellClick = (x: number, y: number) => {
    if (gameOver || state.currentTurn !== 'human') return;

    const { board: nextAiBoard } = receiveAttack(state.aiBoard, { x, y });

    if (nextAiBoard === state.aiBoard) return;

    const humanWon = allShipsSunk(nextAiBoard);

    if (humanWon) {
      setState((prev) => ({
        ...prev,
        aiBoard: nextAiBoard,
        winner: 'human',
        phase: 'finished',
        turnCount: prev.turnCount + 1,
      }));
      return;
    }

    const stateForAi: GameState = {
      ...state,
      aiBoard: nextAiBoard,
    };

    const { nextBoard: nextPlayerBoard, aiWon, newAiState } = takeAiTurn(state.playerBoard, stateForAi);

    setState((prev) => ({
      ...prev,
      aiBoard: nextAiBoard,
      playerBoard: nextPlayerBoard,
      winner: aiWon ? 'ai' : null,
      phase: aiWon ? 'finished' : 'playing',
      currentTurn: 'human',
      turnCount: prev.turnCount + 1,
      aiState: newAiState,
    }));
  };

  const handlePlayerPlacementClick = (x: number, y: number) => {
    if (state.phase !== 'placing' || placementIndex === null) return;

    const ship = FLEET[placementIndex];
    if (!ship) return;

    const coords = Array.from({ length: ship.length }, (_, i) =>
      orientation === 'horizontal'
        ? { x: x + i, y }
        : { x, y: y + i },
    );

    if (!canPlaceShipAt(state.playerBoard, coords)) {
      return;
    }

    const nextPlayerBoard = placeShipAt(state.playerBoard, ship, coords);

    const nextIndex = placementIndex + 1;
    if (nextIndex >= FLEET.length) {
      const aiBoard = placeFleetRandomly(createEmptyBoard(DEFAULT_SIZE), FLEET);
      setPlacementIndex(null);
      setState({
        playerBoard: nextPlayerBoard,
        aiBoard,
        currentTurn: 'human',
        phase: 'playing',
        winner: null,
        turnCount: 0,
        difficulty: selectedDifficulty,
        aiState: createInitialAiState(),
      });
    } else {
      setPlacementIndex(nextIndex);
      setState((prev) => ({
        ...prev,
        playerBoard: nextPlayerBoard,
      }));
    }
  };

  const statusText = (() => {
    if (state.phase === 'finished') {
      if (state.winner === 'human') return 'You Win!';
      if (state.winner === 'ai') return 'You Lost. AI won.';
      return 'Game over';
    }

    if (state.phase === 'placing') {
      if (placementIndex == null) return 'Placing ships...';
      const ship = FLEET[placementIndex];
      return `Place your ${ship.name} (${ship.length}) - ${orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}`;
    }

    return state.currentTurn === 'human'
      ? 'Your turn: click a cell on Opponent\'s Waters to fire.'
      : "AI's turn";
  })();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Cognition Battleship</h2>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">Sink all of your opponent's ships before they sink yours.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="text-xs text-slate-400">Turn: {state.turnCount}</div>
          <div className="text-sm font-medium text-slate-100">{statusText}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-1 text-[11px] text-slate-300 mr-2">
              <span>AI Difficulty:</span>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  title={DIFFICULTY_DESCRIPTIONS[diff]}
                  className={`px-2 py-0.5 rounded border text-xs ${
                    selectedDifficulty === diff
                      ? 'bg-sky-600 border-sky-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {DIFFICULTY_LABELS[diff]}
                </button>
              ))}
            </div>
            {state.phase === 'placing' && (
              <div className="flex items-center gap-1 text-[11px] text-slate-300 mr-2">
                <span>Orientation:</span>
                <button
                  type="button"
                  onClick={() => setOrientation('horizontal')}
                  className={`px-2 py-0.5 rounded border text-xs ${
                    orientation === 'horizontal'
                      ? 'bg-slate-600 border-slate-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('vertical')}
                  className={`px-2 py-0.5 rounded border text-xs ${
                    orientation === 'vertical'
                      ? 'bg-slate-600 border-slate-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  V
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={startAutoGame}
              className="inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              New Game (Auto)
            </button>
            <button
              type="button"
              onClick={startManualPlacement}
              className="inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              New Game (Manual)
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <BoardView
          title="Your Fleet"
          board={state.playerBoard}
          onCellClick={handlePlayerPlacementClick}
          isInteractive={state.phase === 'placing'}
          hideShips={false}
          gameOver={gameOver}
        />

        <BoardView
          title="Opponent's Waters"
          board={state.aiBoard}
          onCellClick={handleOpponentCellClick}
          isInteractive={state.phase === 'playing' && !gameOver}
          hideShips
          gameOver={gameOver}
        />
      </div>
    </div>
  );
}
