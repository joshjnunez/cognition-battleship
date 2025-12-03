import { Ship } from '../game/types';

interface FleetOverviewProps {
  ships: Ship[];
  placingIndex: number | null;
  phase: 'placing' | 'playing' | 'finished';
  playerShips: Ship[];
}

export default function FleetOverview({ ships, placingIndex, phase, playerShips }: FleetOverviewProps) {
  const remainingToPlace = placingIndex === null ? 0 : ships.length - placingIndex;

  const getStatus = (ship: Ship, index: number): { label: string; tone: 'pending' | 'active' | 'done' | 'sunk' } => {
    const placedShip = playerShips.find((s) => s.id === ship.id);
    const isPlaced = placedShip && placedShip.coordinates.length > 0;
    const isSunk = placedShip && placedShip.hits >= placedShip.length;

    if (phase === 'placing') {
      if (placingIndex === index) return { label: 'Placing now', tone: 'active' };
      if (index < (placingIndex ?? 0)) return { label: 'Placed', tone: 'done' };
      return { label: 'Waiting', tone: 'pending' };
    }

    if (phase === 'playing' || phase === 'finished') {
      if (isSunk) return { label: 'Sunk', tone: 'sunk' };
      if (isPlaced) return { label: 'Afloat', tone: 'done' };
      return { label: 'Hidden', tone: 'pending' };
    }

    return { label: '', tone: 'pending' };
  };

  return (
    <section className="w-full max-w-xs sm:max-w-sm md:max-w-xs lg:max-w-sm bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-3 sm:px-4 sm:py-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-100">Fleet Overview</h3>
        <span className="text-[10px] sm:text-xs text-slate-400">5 ships total</span>
      </div>

      <div className="space-y-2">
        {ships.map((ship, index) => {
          const status = getStatus(ship, index);
          const baseRowClasses =
            'flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 sm:px-2.5 sm:py-1.5';

          const toneClasses =
            status.tone === 'active'
              ? 'border-sky-400/80 bg-sky-900/40'
              : status.tone === 'done'
              ? 'border-emerald-500/70 bg-emerald-900/25'
              : status.tone === 'sunk'
              ? 'border-red-500/70 bg-red-900/30 opacity-90'
              : 'border-slate-700 bg-slate-900/60';

          return (
            <div key={ship.id} className={baseRowClasses + ' ' + toneClasses}>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-slate-100">{ship.name}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400">{ship.length} cells</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: ship.length }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-[2px] bg-slate-600 border border-slate-500"
                    />
                  ))}
                </div>
              </div>
              {status.label && (
                <span
                  className={`text-[10px] sm:text-[11px] font-medium ${
                    status.tone === 'active'
                      ? 'text-sky-300'
                      : status.tone === 'done'
                      ? 'text-emerald-300'
                      : status.tone === 'sunk'
                      ? 'text-red-300'
                      : 'text-slate-400'
                  }`}
                >
                  {status.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-700 pt-2 mt-1 text-[10px] sm:text-xs text-slate-300 space-y-0.5">
        <p className="font-medium text-slate-200">How ships work</p>
        <p>Each ship occupies that many connected squares on your board. The AI has the same 5 ships.</p>
        {phase === 'placing' && (
          <p className="text-sky-200/90">
            Ships remaining to place: <span className="font-semibold">{remainingToPlace}</span>
          </p>
        )}
      </div>
    </section>
  );
}
