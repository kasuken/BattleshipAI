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
3. Click the "🤖 AI vs AI" button to enable AI vs AI mode
4. Click "Start Game" to begin the battle
5. Watch as the two AI players (Blue AI and Red AI) battle each other

## Important Notes

- In AI vs AI mode, ships are placed randomly for both sides
- Both AIs always use LM Studio, never falling back to the simple AI
- If connection issues occur, the app will retry with simplified requests to LM Studio
- The AI settings button allows configuration of the LM Studio endpoint and model parameters

## Troubleshooting

If you encounter issues with LM Studio connectivity:

1. Check that LM Studio is running and the API server is enabled
2. Verify the endpoint in AI Settings (click the gear icon)
3. Look at the browser console for detailed error messages
4. Try restarting the game and LM Studio

## Implementation Details

- Blue AI represents the "player" side in the code
- Red AI represents the "enemy" AI
- Both use the same LMStudioAI class but with separate instances
- Error handling ensures the game continues even if API calls fail
