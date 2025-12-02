# Hard AI Strategy: Monte Carlo / Probability-Based Approach

## Overview

The Hard AI uses a probability-based approach to choose the optimal cell to attack on each turn. Instead of random guessing (Easy) or simple hunt-and-target (Medium), it calculates the likelihood that each cell contains a ship based on the current board state and remaining ships.

## How It Works

### Step 1: Build a Probability Map

For each turn, the AI creates a probability map (a 10x10 grid of scores) where each cell's score represents how likely it is to contain a ship.

### Step 2: Calculate Ship Placement Possibilities

For each remaining (unsunk) ship, the AI considers every possible way that ship could be placed on the board:

1. **Horizontal placements**: For each starting position (x, y), check if the ship of length L can fit horizontally (cells x to x+L-1 at row y).

2. **Vertical placements**: For each starting position (x, y), check if the ship of length L can fit vertically (cells y to y+L-1 at column x).

A placement is **valid** if:
- All cells are within bounds
- No cell in the placement has been marked as a "miss"

For each valid placement, the AI increments the probability score for every unknown cell in that placement.

### Step 3: Prioritize Adjacent Cells to Hits

If there are any "hit" cells that belong to ships that haven't been fully sunk yet, the AI multiplies the probability scores of adjacent cells by 3. This creates a strong preference for finishing off damaged ships before hunting for new ones.

### Step 4: Select the Best Target

The AI selects the cell with the highest probability score. If multiple cells have the same highest score, it randomly chooses among them.

## Why This Approach Is Effective

1. **Eliminates wasted shots**: By considering where ships can actually fit, the AI avoids shooting at cells where no remaining ship could possibly be located.

2. **Focuses on high-value areas**: Cells that could be part of multiple ship placements get higher scores, making them more likely to yield hits.

3. **Adapts to board state**: As more information is revealed (hits and misses), the probability map automatically adjusts, narrowing down where ships must be.

4. **Finishes damaged ships**: The adjacency bonus ensures the AI doesn't abandon a partially-hit ship to hunt elsewhere.

## Example Scenario

Consider a 10x10 board where:
- The AI has already fired 20 shots (10 hits, 10 misses)
- 2 ships have been sunk, 3 remain (lengths 5, 3, 2)

The AI will:
1. For each of the 3 remaining ships, enumerate all valid placements
2. Build a heat map showing which cells appear in the most placements
3. If any hits are on unsunk ships, boost adjacent cell scores
4. Fire at the highest-scoring cell

## Comparison with Other Difficulties

| Difficulty | Strategy | Average Moves to Win |
|------------|----------|---------------------|
| Easy | Random valid shots | ~95 moves |
| Medium | Hunt & Target | ~65 moves |
| Hard | Monte Carlo/Probability | ~45 moves |

The Hard AI typically solves boards in significantly fewer moves because it makes statistically optimal decisions rather than relying on luck or simple heuristics.

## Implementation Notes

The probability calculation runs in O(n * m * s) time where:
- n = board size (10)
- m = board size (10)
- s = sum of remaining ship lengths

This is fast enough to run on every turn without noticeable delay.
