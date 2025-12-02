import Game from './components/Game'

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cognition Battleship
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Game />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
