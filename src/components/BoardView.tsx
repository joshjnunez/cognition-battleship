import { Board } from '../game/types';

interface BoardViewProps {
  title: string;
  board: Board;
  onCellClick?: (x: number, y: number) => void;
  isInteractive?: boolean;
  hideShips?: boolean;
  gameOver?: boolean;
}

export default function BoardView({
  title,
  board,
  onCellClick,
  isInteractive = false,
  hideShips = false,
  gameOver = false,
}: BoardViewProps) {
  const handleClick = (x: number, y: number) => {
    if (!isInteractive || gameOver || !onCellClick) return;
    onCellClick(x, y);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <div
        className="inline-grid bg-slate-900/40 rounded-md p-2"
        style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1.75rem))` }}
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

            return (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => handleClick(x, y)}
                disabled={disabled}
                className={`w-7 h-7 border border-slate-600 flex items-center justify-center text-xs text-white ${bg} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isHit ? '✕' : isMiss ? '•' : ''}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
