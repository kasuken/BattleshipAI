// AI Strategy implementations for different AI players
import type { Board, Position } from "./types";

export interface AIStrategy {
  name: string;
  description: string;
  createPrompt(gameState: GameState, lastMoves?: { position: Position; wasHit: boolean }[]): string;
}

export interface GameState {
  board: string[][];
  previousMoves: Position[];
  hitPositions: Position[];
  missPositions: Position[];
  sunkShips: string[];
  gameHistory: string[];
}

// Helper function to format board for AI display
function formatBoardForAI(board: string[][]): string {
  let formatted = "   A B C D E F G H I J\n";
  board.forEach((row, index) => {
    const rowNum = (index + 1).toString().padStart(2, " ");
    formatted += `${rowNum} ${row.join(" ")}\n`;
  });
  return formatted;
}

// Helper function to format last moves
function formatLastMoves(lastMoves: { position: Position; wasHit: boolean }[]): string {
  if (lastMoves.length === 0) return "";
  
  return "\nLast moves and results:\n" +
    lastMoves
      .map((move) => {
        const coord = `${String.fromCharCode(65 + move.position.col)}${move.position.row + 1}`;
        return `- ${coord}: ${move.wasHit ? "HIT" : "MISS"}`;
      })
      .join("\n");
}

// Aggressive Hunter Strategy - Fast, risk-taking AI
export class AggressiveHunterStrategy implements AIStrategy {
  name = "Aggressive Hunter";
  description = "Fast, aggressive AI that takes risks and hunts ships relentlessly";

  createPrompt(gameState: GameState, lastMoves: { position: Position; wasHit: boolean }[] = []): string {
    const boardDisplay = formatBoardForAI(gameState.board);
    const lastMovesInfo = formatLastMoves(lastMoves);

    return `BATTLESHIP AI - AGGRESSIVE HUNTER MODE 🔥

You are an AGGRESSIVE naval commander. You strike fast, take calculated risks, and hunt ships relentlessly!

Ships fleet to destroy:
- Carrier (5 cells)
- Battleship (4 cells) 
- Cruiser (3 cells)
- Submarine (3 cells)
- Destroyer (2 cells)

Current Battle Grid:
${boardDisplay}

Legend: '.' = water, 'H' = hit, 'M' = miss

Previous strikes: ${
      gameState.previousMoves
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Confirmed hits: ${
      gameState.hitPositions
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Ships destroyed: ${gameState.sunkShips.join(", ") || "None"}${lastMovesInfo}

AGGRESSIVE BATTLE TACTICS:
1. 🎯 PRIORITY: If you scored a HIT, IMMEDIATELY attack adjacent cells (up/down/left/right) - no mercy!
2. 🔥 HUNT MODE: If you have multiple hits in a line, CONTINUE firing in that direction until you sink it!
3. ⚡ RAPID STRIKE: When hunting ends, use diagonal or checkerboard patterns for faster ship detection
4. 🚀 TAKE RISKS: Target ship-likely areas even if not perfectly spaced
5. 💥 FINISH THE KILL: Always complete sinking a ship before moving to new targets

Strike coordinates with MAXIMUM AGGRESSION! Respond with ONLY the coordinate like "A1", "B5", or "J10".`;
  }
}

// Methodical Strategist - Careful, systematic AI
export class MethodicalStrategistStrategy implements AIStrategy {
  name = "Methodical Strategist";
  description = "Careful, systematic AI that uses logic and patience to win";

  createPrompt(gameState: GameState, lastMoves: { position: Position; wasHit: boolean }[] = []): string {
    const boardDisplay = formatBoardForAI(gameState.board);
    const lastMovesInfo = formatLastMoves(lastMoves);

    return `BATTLESHIP AI - METHODICAL STRATEGIST MODE 🧠

You are a METHODICAL naval strategist. You use careful analysis, logical deduction, and systematic approaches to victory.

Fleet analysis required:
- Carrier (5 cells) - Largest target, priority elimination
- Battleship (4 cells) - High-value target
- Cruiser (3 cells) - Medium threat
- Submarine (3 cells) - Stealth threat  
- Destroyer (2 cells) - Smallest, hardest to find

Current Tactical Grid:
${boardDisplay}

Legend: '.' = water, 'H' = confirmed hit, 'M' = confirmed miss

Strategic history: ${
      gameState.previousMoves
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Successful strikes: ${
      gameState.hitPositions
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Eliminated targets: ${gameState.sunkShips.join(", ") || "None"}${lastMovesInfo}

METHODICAL STRATEGIC DOCTRINE:
1. 📊 ANALYSIS FIRST: Study hit patterns carefully before choosing next target
2. 🎯 SYSTEMATIC PURSUIT: When you hit a ship, methodically check all 4 directions before expanding search
3. 📏 OPTIMAL SPACING: Use perfect checkerboard/parity patterns to maximize search efficiency
4. 🔍 LOGICAL DEDUCTION: Consider ship sizes and eliminate impossible placements
5. 🛡️ PATIENT APPROACH: Never waste shots - each move should be calculated and purposeful
6. 📐 PATTERN RECOGNITION: Use systematic grid patterns when searching for new ships

Calculate your next strategic coordinate with MAXIMUM PRECISION! Respond with ONLY the coordinate like "A1", "B5", or "J10".`;
  }
}

// Export available strategies
export const AI_STRATEGIES = {
  AGGRESSIVE_HUNTER: new AggressiveHunterStrategy(),
  METHODICAL_STRATEGIST: new MethodicalStrategistStrategy()
} as const;

export type StrategyType = keyof typeof AI_STRATEGIES;
