# AI Strategy Guide

This document explains how the three AI difficulty levels work in Cognition Battleship. It's written for anyone to understand, regardless of technical background.

## The Challenge

In Battleship, the AI needs to find and sink your hidden ships. The board is a 10x10 grid (100 cells), and your ships occupy 17 cells total. The AI's job is to find all 17 ship cells while wasting as few shots as possible.

Think of it like searching for treasure in a field. You could dig randomly, follow clues, or use a map showing where treasure is most likely to be buried.

## The Three Difficulty Levels

### Easy: Random Guessing

**How it works:** The AI picks any cell it hasn't shot at yet, completely at random.

**Analogy:** Imagine throwing darts at a board while blindfolded. You'll eventually hit something, but there's no strategy involved.

**What you'll notice:** The AI's shots are scattered across the board with no apparent pattern. Even after hitting one of your ships, it might shoot somewhere completely unrelated on the next turn.

```
Example board after 10 Easy AI shots:

  0 1 2 3 4 5 6 7 8 9
0 . . . . . . . . . .
1 . X . . . . . X . .
2 . . . . X . . . . .
3 . . . . . . . . . X
4 X . . . . . . . . .
5 . . . X . . . . . .
6 . . . . . . X . . .
7 . X . . . . . . . .
8 . . . . . . . . X .
9 . . . X . . . . . .

X = shot fired (scattered randomly)
```

**Typical performance:** ~95 shots to win (nearly the whole board)

---

### Medium: Hunt & Target

**How it works:** The AI starts by shooting randomly, but as soon as it hits a ship, it switches to "hunt mode." In hunt mode, it targets the cells directly above, below, left, and right of the hit until the ship is sunk. Then it goes back to random shooting.

**Analogy:** Imagine you're looking for a lost set of keys in your house. You search randomly until you find one key. Then you search carefully around that spot because the rest of the keys are probably nearby.

**What you'll notice:** After the AI hits your ship, its next few shots will cluster around that hit. It's clearly trying to find the rest of the ship.

```
Example: AI hits a ship at position (4,4)

  0 1 2 3 4 5 6 7 8 9
0 . . . . . . . . . .
1 . . . . . . . . . .
2 . . . . . . . . . .
3 . . . . 2 . . . . .     2 = next priority target
4 . . . 3 H 1 . . . .     H = hit, 1-4 = hunt targets
5 . . . . 4 . . . . .
6 . . . . . . . . . .

The AI will try positions 1, 2, 3, 4 before
going back to random shooting.
```

**Typical performance:** ~65 shots to win

---

### Hard: Probability Analysis

**How it works:** The AI calculates the probability that each cell contains a ship. It considers which ships are still afloat and where they could possibly fit on the board. Cells that could be part of many different ship placements get higher scores. The AI always shoots at the highest-probability cell.

**Analogy:** Imagine you're a detective solving a case. Instead of searching randomly, you analyze the evidence and focus on the most likely locations. You know the suspect drives a red car, so you focus on areas where red cars have been spotted.

**What you'll notice:** The AI's shots seem strategic from the start. It tends to shoot toward the center of the board early (more ships can fit there) and quickly narrows in on your ships. After a hit, it becomes laser-focused on finishing that ship.

```
Probability "heat map" early in the game:

  0 1 2 3 4 5 6 7 8 9
0 L L L M M M M L L L
1 L M M H H H H M M L
2 L M H H H H H H M L
3 M H H H H H H H H M
4 M H H H H H H H H M
5 M H H H H H H H H M
6 M H H H H H H H H M
7 L M H H H H H H M L
8 L M M H H H H M M L
9 L L L M M M M L L L

L = Low probability (edges/corners)
M = Medium probability
H = High probability (center area)

The AI targets H cells first because more
ships can fit through the center.
```

**After a hit, adjacent cells get 3x priority:**

```
  0 1 2 3 4 5 6 7 8 9
3 . . . . * . . . . .     * = 3x boosted priority
4 . . . * H * . . . .     H = hit on unsunk ship
5 . . . . * . . . . .

The AI will almost certainly shoot at one
of the * cells next.
```

**Typical performance:** ~45 shots to win

---

## Side-by-Side Comparison

| Aspect | Easy | Medium | Hard |
|--------|------|--------|------|
| **Strategy** | None (random) | React to hits | Predict ship locations |
| **After a hit** | Ignores it | Hunts nearby | Hunts nearby + calculates odds |
| **Shot pattern** | Scattered | Scattered, then clustered | Strategic from start |
| **Feels like playing against** | A beginner | A casual player | An expert |
| **Average shots to win** | ~95 | ~65 | ~45 |
| **Best for** | New players, relaxed games | Most players | Players wanting a challenge |

---

## Why This Matters

The three difficulty levels create genuinely different gameplay experiences:

**Easy** lets new players learn the game without frustration. The AI won't punish mistakes or find ships quickly.

**Medium** provides a fair challenge. The AI plays like a reasonable human opponent, following obvious clues but not overthinking.

**Hard** creates a competitive experience. The AI makes mathematically optimal decisions, forcing players to think carefully about ship placement and hope for some luck.

---

## Technical Summary (for the curious)

For those interested in the implementation details:

- **Easy**: Randomly selects from all valid (unshot) cells using uniform distribution
- **Medium**: Maintains a "hunt queue" of adjacent cells after hits; processes queue before falling back to random
- **Hard**: Builds a probability map by enumerating all valid ship placements for remaining ships; applies 3x multiplier to cells adjacent to unfinished hits; selects highest-probability cell

The probability calculation in Hard mode runs in O(n^2 * s) time where n is board size (10) and s is the sum of remaining ship lengths. This completes in milliseconds, so there's no noticeable delay during gameplay.

For implementation details, see the source code in `src/game/ai.ts`.
