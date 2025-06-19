# ⚓ Battleship Game

A modern, browser-based Battleship game built with TypeScript, React, and Vite. Play against an AI opponent in this classic naval strategy game!

## 🎮 Features

### Core Gameplay
- **Single Player vs AI**: Battle against intelligent AI opponents with dual AI system
- **Interactive Ship Placement**: Drag and drop or click to place your ships with rotation
- **Beautiful Modern UI**: Responsive design with smooth animations and ocean themes
- **Standard Battleship Rules**: 10x10 grid with ships of sizes 5, 4, 3, 3, and 2
- **Real-time Game State**: Track hits, misses, and sunk ships with visual feedback
- **No Page Reloads**: Smooth, single-page application experience

### AI Integration
- **Dual AI System**: Choose between Simple AI and advanced LM Studio AI
- **LM Studio Support**: Connect to local LLM models for intelligent, context-aware gameplay
- **AI Configuration**: Customize endpoint, model parameters, temperature, and token limits
- **Strategic Decision Making**: Advanced AI with pattern recognition and move history analysis
- **Graceful Fallback**: Automatic switch to Simple AI if LM Studio is unavailable
- **Settings Persistence**: AI configuration saved between game sessions

## 🚢 How to Play

1. **Setup Phase**: Place your 5 ships on your board
   - Carrier (5 cells)
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Submarine (3 cells)
   - Destroyer (2 cells)

2. **Placement Options**:
   - Click a ship to select it, then click on the board to place
   - Right-click or use the rotate button to change orientation
   - Use "Random Placement" for quick setup
   - Ships cannot touch each other

3. **Battle Phase**: Take turns attacking the enemy grid
   - Click on enemy waters to fire
   - 💥 = Hit, 💨 = Miss
   - Sink all enemy ships to win!

## 🛠 Technologies Used

- **TypeScript** - Type-safe JavaScript
- **React** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **CSS3** - Beautiful styling with gradients and animations

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd battleship
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### LM Studio AI Setup (Optional)

For advanced AI gameplay using local LLM models:

1. **Install LM Studio**: Download from [LM Studio](https://lmstudio.ai/)

2. **Load a Model**: Download and load a compatible model (Llama, Mistral, etc.)

3. **Start Local Server**: 
   - In LM Studio, go to the "Local Server" tab
   - Start the server (default: http://localhost:1234)

4. **Configure in Game**:
   - Click the "⚙️ AI Settings" button in the game
   - Set the endpoint URL (usually http://localhost:1234)
   - Select your model and adjust parameters
   - Test the connection
   - Toggle to "🤖 LM Studio AI" mode

The AI will now use your local LLM for strategic decision-making!

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎯 Game Controls

### Ship Placement
- **Left Click**: Select ship / Place ship on board
- **Right Click**: Rotate ship during placement
- **Random Placement**: Automatically place all ships randomly
- **Clear Board**: Remove all placed ships to start over

### Gameplay
- **Left Click**: Attack enemy grid positions
- **Start Battle**: Begin the game once all ships are placed
- **Reset Game**: Start a new game at any time

### AI Controls
- **🎯 Simple AI / 🤖 LM Studio AI**: Toggle between AI modes
- **⚙️ AI Settings**: Configure LM Studio connection and parameters
- **Test Connection**: Verify LM Studio server availability

## 🤖 AI Strategy

### Simple AI
- Random targeting for initial shots
- Smart adjacent targeting after hitting a ship
- Systematic hunting patterns for ship completion

### LM Studio AI (Advanced)
- **Context Awareness**: Analyzes board state and move history
- **Strategic Planning**: Makes decisions based on probability and patterns
- **Learning Behavior**: Adapts strategy based on successful moves
- **Natural Language Processing**: Uses LLM reasoning for tactical decisions
- **Dynamic Difficulty**: Adjusts based on configured temperature settings

## 📱 Responsive Design

The game is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 UI Features

- Gradient backgrounds with ocean themes
- Smooth hover effects and animations
- Visual feedback for game states
- Intuitive ship placement with preview
- Real-time fleet status tracking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── Board.tsx       # Game board component
│   ├── Board.css       # Board styling
│   ├── ShipSelector.tsx# Ship placement UI
│   ├── ShipSelector.css
│   ├── GameStatus.tsx  # Game state display
│   └── GameStatus.css
├── types.ts            # TypeScript type definitions
├── utils.ts            # Game logic utilities
├── App.tsx             # Main application component
├── App.css             # Main application styles
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Enjoy the Game!

Have fun playing Battleship! May your shots be true and your ships stay afloat! ⚓️
