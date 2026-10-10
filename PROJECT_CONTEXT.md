# WEBQUADRATEE - Project Context & Architecture

## 1. Tech Stack & Files
- **Frontend Framework**: Vanilla JavaScript, HTML5, CSS3
- **Animations**: GSAP (GreenSock) for smooth, high-performance 60 FPS transitions and "radio knob" rotations.
- **Multiplayer**: Socket.io with 4-digit room codes.
- **Structure**:
  - `index.html`: Main menu, player profile (Name, Avatar 🐸🦊🤖👾🚀), palette theme selection (`localStorage`), and Multiplayer lobby (Create/Join room).
  - `play.html`: Active game arena, quadrants, timer, score, and win conditions.

## 2. Core Game Logic & Rules
- **Grid / Board**: 2x2 rotatable quadrants.
- **Rotation Mechanics**: GSAP additive/smooth rotation (resembling a physical radio knob) to handle rapid player taps cleanly without queue lagging.
- **Persistence**: Player name, selected avatar, and theme palette are stored in `localStorage` and loaded dynamically in `play.html`.