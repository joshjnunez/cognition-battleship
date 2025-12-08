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
import { createInitialAiState, getAiMoveForDifficulty, getHardProbabilityMap, updateAiStateAfterShot } from '../game/ai';
import BoardView from './BoardView';
import HelpModal from './HelpModal';
import FleetOverview from './FleetOverview';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [state, setState] = useState<GameState>(() => createInitialGameState(selectedDifficulty));
  const [placementIndex, setPlacementIndex] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showHardInsight, setShowHardInsight] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const gameOver = state.phase === 'finished';

  const startAutoGame = () => {
    setPlacementIndex(null);
    setState(createInitialGameState(selectedDifficulty));
  };

  const handleDifficultyClick = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    if (state.phase === 'placing') {
      // While manually placing ships, changing difficulty should *not*
      // reset placement. Just update the difficulty that will be used
      // once play begins.
      setState((prev) => ({
        ...prev,
        difficulty,
      }));
      return;
    }

    // In playing/finished phases, changing difficulty starts a fresh
    // auto-generated game at the chosen difficulty.
    setPlacementIndex(null);
    setOrientation('horizontal');
    setState(createInitialGameState(difficulty));
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
  ): { nextBoard: Board; aiWon: boolean; newAiState: AiState; hardDebug?: GameState['hardDebug'] } => {
    const target = getAiMoveForDifficulty(currentState);
    if (!target) {
      const aiWon = allShipsSunk(board);
      // No valid target; just return current board and AI state.
      return { nextBoard: board, aiWon, newAiState: currentState.aiState };
    }

    // Apply the AI shot to the player's board.
    const { board: nextBoard, hit, sunkShip } = receiveAttack(board, target);
    const newAiState = updateAiStateAfterShot(currentState.aiState, target, hit, nextBoard, sunkShip);
    const aiWon = allShipsSunk(nextBoard);

    // Build probability map for Hard mode AFTER updating the board and AI state,
    // so the heatmap always reflects the latest information.
    let hardDebug: GameState['hardDebug'] | undefined;
    if (currentState.difficulty === 'hard') {
      const { probabilityMap, max } = getHardProbabilityMap(nextBoard, newAiState);
      hardDebug = { probabilityMap, max };
    }

    return { nextBoard, aiWon, newAiState, hardDebug };
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

    const { nextBoard: nextPlayerBoard, aiWon, newAiState, hardDebug } = takeAiTurn(state.playerBoard, stateForAi);

    setState((prev) => ({
      ...prev,
      aiBoard: nextAiBoard,
      playerBoard: nextPlayerBoard,
      winner: aiWon ? 'ai' : null,
      phase: aiWon ? 'finished' : 'playing',
      currentTurn: 'human',
      turnCount: prev.turnCount + 1,
      aiState: newAiState,
      hardDebug: hardDebug ?? prev.hardDebug,
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

    return '';
  })();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center sm:items-start gap-1 sm:gap-1.5">
          <div className="flex gap-4 text-xs sm:text-sm text-slate-400 mb-1">
            <a 
              href="https://github.com/joshjnunez/cognition-battleship" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              Github Repo
            </a>
            <span className="text-slate-600">|</span>
            <a 
              href="https://docs.google.com/document/d/1OUE1O0BIzXnr7lq219p8EaZRWBZmLM-qE0mnc4GJuPE/edit?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              Bugs Documentation
            </a>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">Cognition Battleship</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto sm:mx-0">
            Sink all of your opponent&apos;s ships before they sink yours. Choose a difficulty and challenge the AI.
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-1.5 sm:gap-2 text-center sm:text-right text-xs sm:text-sm">
          {statusText && (
            <div className="text-sm font-medium text-slate-100 max-w-xs sm:max-w-none">{statusText}</div>
          )}
          <div className="mt-1 flex flex-col gap-1.5 sm:gap-2 items-center sm:items-end w-full">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-300 justify-center sm:justify-end">
                <span>AI Difficulty:</span>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => handleDifficultyClick(diff)}
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
              {state.difficulty === 'hard' && (
                <p className="text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-right leading-snug">
                  Heatmap on Your Fleet shows where Hard AI thinks your ships are most likely.
                </p>
              )}
              {state.phase === 'placing' && (
                <div className="flex items-center gap-1 text-[11px] text-slate-300 justify-center sm:justify-end">
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
              {state.difficulty === 'hard' && (
                <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                  <div className="flex justify-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowHardInsight((v) => !v)}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
                        showHardInsight
                          ? 'border-sky-400 bg-sky-600 text-white hover:bg-sky-500'
                          : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                      aria-pressed={showHardInsight}
                    >
                      {showHardInsight ? 'Hide Heatmap' : 'Show Heatmap'}
                    </button>
                  </div>
                  {showHardInsight && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-right leading-snug">
                      Hard AI builds a probability map of <span className="font-semibold">Your Fleet</span> each turn and shoots the
                      lightest (most likely) cells. The blue overlay is that map: brighter squares are where the AI is
                      most likely to fire next.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
              <button
                type="button"
                onClick={startAutoGame}
                className="inline-flex items-center rounded-md bg-slate-700 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-100 shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                New Game (Auto)
              </button>
              <button
                type="button"
                onClick={startManualPlacement}
                className="inline-flex items-center rounded-md bg-slate-700 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-100 shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                New Game (Manual)
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full max-w-4xl mx-auto bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold text-slate-100">How to Play &amp; Fleet Overview</span>
            <span className="text-[10px] sm:text-xs text-slate-400">Tap to {showGuide ? 'hide' : 'show'} quick instructions and your ships.</span>
          </div>
          <span className="text-xs sm:text-sm text-slate-300">
            {showGuide ? '−' : '+'}
          </span>
        </button>

        {showGuide && (
          <div className="mt-2 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
            <section className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-slate-900/80 border border-slate-700 rounded-md px-3 py-3 sm:px-4 sm:py-4 space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-100">Quick Start</h3>
              <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-slate-300">
                <li><span className="font-semibold">Step 1:</span> Choose an AI difficulty (Easy, Medium, or Hard).</li>
                <li>
                  <span className="font-semibold">Step 2:</span> Start a new game. Use <span className="font-semibold">Manual</span> to place your own
                  ships, or <span className="font-semibold">Auto</span> to let the game place them for you.
                </li>
                <li>
                  <span className="font-semibold">Step 3:</span> Tap squares on <span className="font-semibold">Opponent&apos;s Waters</span> to fire and
                  search for the AI&apos;s ships.
                </li>
                <li>
                  <span className="font-semibold">Goal:</span> Sink all 5 of the AI&apos;s ships before it sinks yours.
                </li>
              </ul>
            </section>

            <FleetOverview
              ships={FLEET}
              placingIndex={placementIndex}
              phase={state.phase}
              playerShips={state.playerBoard.ships}
            />
          </div>
        )}
      </section>

      {state.phase === 'placing' && placementIndex !== null && (
        <div className="w-full max-w-2xl mx-auto rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <div>
            <span className="font-semibold">Placing:</span>{' '}
            <span>
              {FLEET[placementIndex]?.name} ({FLEET[placementIndex]?.length} cells)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              <span className="font-semibold">Ships remaining:</span>{' '}
              {FLEET.length - placementIndex} of {FLEET.length}
            </span>
            <span className="text-slate-300">
              Click a starting square on <span className="font-semibold">Your Fleet</span>. Use <span className="font-semibold">H</span> / <span className="font-semibold">V</span> to rotate.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-center">
        <BoardView
          title="Your Fleet"
          board={state.playerBoard}
          onCellClick={handlePlayerPlacementClick}
          isInteractive={state.phase === 'placing'}
          hideShips={false}
          gameOver={gameOver}
          probabilityMap={state.hardDebug?.probabilityMap}
          probabilityMax={state.hardDebug?.max}
          showProbability={showHardInsight && state.difficulty === 'hard'}
          celebrateLoss={state.phase === 'finished' && state.winner === 'ai'}
          celebrationText="YOU LOSE"
        />

        <BoardView
          title="Opponent's Waters"
          board={state.aiBoard}
          onCellClick={handleOpponentCellClick}
          isInteractive={state.phase === 'playing' && !gameOver}
          hideShips
          gameOver={gameOver}
          celebrateLoss={state.phase === 'finished' && state.winner === 'human'}
          celebrationText="YOU WIN"
        />
      </div>
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
