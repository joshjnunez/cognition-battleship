# Cognition Battleship

A modern, browser-based Battleship game featuring three AI difficulty levels, built with React, TypeScript, and Tailwind CSS.

## About the Game

Battleship is a classic naval combat strategy game where you and the computer take turns firing shots at each other's hidden fleet. The goal is to sink all of your opponent's ships before they sink yours.

Each player has a 10x10 grid with 5 ships:
- Carrier (5 cells)
- Battleship (4 cells)
- Cruiser (3 cells)
- Submarine (3 cells)
- Destroyer (2 cells)

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 3
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/joshjnunez/cognition-battleship.git
cd cognition-battleship

# Install dependencies
npm install
```

### Running the App

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run unit tests
npm test

# Run tests once (no watch mode)
npm test -- --run
```

## AI Difficulty Levels

The game features three AI difficulty levels that you can select before starting a game:

### Easy
The AI fires at random valid cells. Simple and unpredictable, but not strategic. Good for beginners or casual play.

### Medium (Hunt & Target)
When the AI hits a ship, it "hunts" by targeting adjacent cells (up, down, left, right) until the ship is sunk. This mimics how a human player would logically search for the rest of a ship after finding it.

### Hard (Monte Carlo / Probability)
The AI calculates the probability that each cell contains a ship based on where remaining ships could possibly fit. It prioritizes cells that appear in the most valid ship placements, and gives extra weight to cells adjacent to existing hits. This results in statistically optimal play.

For a detailed explanation of the AI strategies, see [docs/AI-STRATEGY.md](docs/AI-STRATEGY.md).

## How Windsurf and Devin Were Used

This project was built using AI-assisted development tools:

- **Windsurf** was used for initial project scaffolding and iterative development of game logic
- **Devin** was used to:
  - Set up the Vite + React + TypeScript + Tailwind CSS project structure
  - Implement the three AI difficulty levels (Easy, Medium, Hard)
  - Create the Monte Carlo probability-based Hard AI algorithm
  - Add the difficulty selector UI and wire it into the game loop
  - Write comprehensive unit tests for AI behavior verification
  - Generate documentation explaining the AI strategies
- Both tools enabled rapid prototyping and iteration on game mechanics
- AI assistance helped ensure clean code architecture and proper TypeScript typing throughout

## Project Structure

```
src/
  components/
    Game.tsx        # Main game component with UI and game loop
    BoardView.tsx   # Board rendering component
  game/
    types.ts        # TypeScript type definitions
    board.ts        # Board creation and manipulation
    ai.ts           # AI difficulty strategies
    ai.test.ts      # Unit tests for AI behavior
docs/
  AI-STRATEGY.md    # Detailed AI strategy documentation
```

## License

MIT
