# AI vs AI Mode Instructions

This file provides instructions for running and testing the AI vs AI mode in the Battleship game.

## Setup LM Studio

1. Install LM Studio and start the local server
2. Ensure it's running on `http://localhost:1234` (this is the default endpoint in the game)
3. Load any compatible language model in LM Studio
4. Make sure the API server is running (toggle on in the "API" tab)

## Running AI vs AI Mode

1. Start the game by running `npm run dev` in the project directory
2. Open the game in a web browser (usually at http://localhost:5173)
3. Click "Start AI Battle!" to begin the battle
4. Watch as the two AI players (Blue AI and Red AI) battle each other
5. When a game finishes, a 20-second countdown will begin for auto-restart
6. A new game will automatically start after the countdown completes
7. You can cancel auto-restart by clicking the "Cancel Auto-Restart" button

## Important Notes

- In AI vs AI mode, ships are placed randomly for both sides
- Both AIs always use LM Studio, with a robust retry mechanism:
  - Each AI will attempt up to 3 times to get a valid move from LM Studio
  - First attempt uses full context (board state, hits, misses, sunk ships)
  - Second attempt uses simplified context (just the board and previous hits)
  - Third attempt uses minimal context (just the board)
  - Only after all 3 attempts fail will it fall back to a simple backup AI
- The AI settings button allows configuration of the LM Studio endpoint and model parameters

## Troubleshooting

If you encounter issues with LM Studio connectivity:

1. Check that LM Studio is running and the API server is enabled
2. Verify the endpoint in AI Settings (click the gear icon)
3. Look at the browser console for detailed error messages
   - The app now provides more verbose error logging to help diagnose issues
   - Look for patterns like "AI attempt 1 failed", "AI attempt 2 failed", etc.
4. If LM Studio is returning "Invalid move" errors, try:
   - Using a different model in LM Studio
   - Increasing the max tokens setting in AI Settings
   - Decreasing the temperature setting for more focused responses
5. Try restarting the game and LM Studio

## Implementation Details

- Blue AI represents the "player" side in the code
- Red AI represents the "enemy" AI
- Both use the same LMStudioAI class but with separate instances
- Multi-level fallback system:
  1. Three retry attempts with progressively simplified context 
  2. 300ms delay between retry attempts
  3. Enhanced error reporting for better debugging
  4. As a last resort, a strategic AI algorithm that targets adjacent cells for hits
- The coordinate parsing has been improved to handle various response formats
- Detailed logging helps diagnose issues with the LM Studio API responses

## Auto-Restart Feature

The AI vs AI mode includes an automatic game restart feature for continuous gameplay:

- When a game ends (either Blue AI or Red AI wins), a 20-second countdown begins
- A visual indicator shows the countdown with a pulsing animation
- After the countdown completes, a new game automatically starts
- Ships are randomly placed for both AIs in the new game
- This creates a continuous simulation environment for the AIs to battle
- You can cancel the auto-restart at any time by clicking the cancel button

This feature is particularly useful for:
- Running long-term AI simulation experiments
- Observing how different LM Studio models perform over multiple games
- Creating a "spectator mode" demonstration of AI vs AI gameplay
