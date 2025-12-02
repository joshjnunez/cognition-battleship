import type { ReactNode } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm sm:max-w-md mx-4 rounded-lg bg-slate-900 border border-slate-700 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm sm:text-base font-semibold text-white">How to Play &amp; About AI</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white text-xs sm:text-sm px-1.5 py-0.5 rounded-md hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="px-4 py-3 space-y-3 text-xs sm:text-sm text-slate-200">
          <section className="space-y-1">
            <h3 className="font-semibold text-slate-100">Objective</h3>
            <p>Sink all of your opponent&apos;s ships before they sink yours.</p>
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-slate-100">Your Turn</h3>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>Tap a cell on <span className="font-semibold">Opponent&apos;s Waters</span> to fire.</li>
              <li><span className="font-semibold">✕</span> = hit, <span className="font-semibold">•</span> = miss.</li>
              <li>After you fire, the AI will take a shot at <span className="font-semibold">Your Fleet</span>.</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-slate-100">Placing Ships (Manual)</h3>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>Choose <span className="font-semibold">New Game (Manual)</span> to place your own ships.</li>
              <li>Use the <span className="font-semibold">H / V</span> buttons to set orientation.</li>
              <li>Tap on <span className="font-semibold">Your Fleet</span> to place each ship in order.</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-slate-100">AI Difficulty</h3>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li><span className="font-semibold">Easy</span> – Pure random shots (no memory beyond avoiding repeats).</li>
              <li><span className="font-semibold">Medium</span> – Hunt &amp; target: after a hit, focuses on nearby cells.</li>
              <li><span className="font-semibold">Hard</span> – Probability map: evaluates all possible ship positions and shoots the most likely cells.</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-slate-100">Hard AI Heatmap</h3>
            <p className="text-slate-300">
              On Hard, you can toggle the <span className="font-semibold">Show Hard AI Heatmap</span> button.
              Your Fleet will show a blue overlay where the AI believes your ships are most likely.
              Darker blue means higher probability.
            </p>
          </section>

          <section className="space-y-1 pb-1">
            <h3 className="font-semibold text-slate-100">End of Game</h3>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              <li>When a side loses, that board erupts into flames with a clear <span className="font-semibold">YOU WIN</span> or <span className="font-semibold">YOU LOSE</span> banner.</li>
              <li>Use the <span className="font-semibold">New Game</span> buttons to start again with auto or manual placement.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
