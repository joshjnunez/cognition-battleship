import { Board } from '../game/types';

interface BoardViewProps {
  title: string;
  board: Board;
  onCellClick?: (x: number, y: number) => void;
  isInteractive?: boolean;
  hideShips?: boolean;
  gameOver?: boolean;
  probabilityMap?: number[][];
  probabilityMax?: number;
  showProbability?: boolean;
  celebrateLoss?: boolean;
  celebrationText?: string;
}

export default function BoardView({
  title,
  board,
  onCellClick,
  isInteractive = false,
  hideShips = false,
  gameOver = false,
  probabilityMap,
  probabilityMax,
  showProbability = false,
  celebrateLoss = false,
  celebrationText = 'YOU LOSE',
}: BoardViewProps) {
  const handleClick = (x: number, y: number) => {
    if (!isInteractive || gameOver || !onCellClick) return;
    onCellClick(x, y);
  };

  return (
    <div className="space-y-2 sm:space-y-3 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto relative">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
      </div>

      {celebrateLoss && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="px-2 text-center text-xs sm:text-sm md:text-lg font-black tracking-[0.25em] sm:tracking-[0.4em] text-red-200/90 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] uppercase">
            {celebrationText}
          </div>
        </div>
      )}

      <div
        className="grid bg-slate-900/40 rounded-md p-1.5 sm:p-2 gap-[2px] sm:gap-[3px] w-full"
        style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}
      >
        {board.cells.map((row, y) =>
          row.map((cell, x) => {
            let status = cell.status;

            if (hideShips && status === 'ship') {
              status = 'empty';
            }

            const isShip = status === 'ship';
            const isHit = status === 'hit';
            const isMiss = status === 'miss';

            let bg = 'bg-slate-700 hover:bg-slate-600';

            if (isShip) {
              bg = 'bg-teal-700 hover:bg-teal-600';
            }
            if (isHit) {
              bg = 'bg-red-600';
            }
            if (isMiss) {
              bg = 'bg-slate-500';
            }

            const disabled = gameOver || !isInteractive || isHit || isMiss;

            let probBg = '';
            if (!celebrateLoss && showProbability && probabilityMap && typeof probabilityMax === 'number') {
              const cellProb = probabilityMap[y]?.[x] ?? 0;
              if (probabilityMax > 0 && cellProb > 0 && !isHit && !isMiss) {
                const weight = cellProb / probabilityMax;
                if (weight > 0.66) probBg = ' bg-sky-500/40';
                else if (weight > 0.33) probBg = ' bg-sky-500/25';
                else probBg = ' bg-sky-500/15';
              }
            }

            const content = celebrateLoss
              ? '🔥'
              : isHit
              ? '✕'
              : isMiss
              ? '•'
              : '';

            const extraLossClasses = celebrateLoss
              ? ' bg-gradient-to-br from-orange-600 via-red-700 to-black animate-pulse'
              : '';

            return (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => handleClick(x, y)}
                disabled={disabled}
                className={`aspect-square w-full border border-slate-700 flex items-center justify-center text-[10px] sm:text-xs text-white rounded-[3px] sm:rounded-[4px] ${bg}${probBg}${extraLossClasses} disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors transition-transform duration-150 active:scale-[0.97]`}
              >
                {content}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
