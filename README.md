# Toy Robot Simulator 🤖

A modern, interactive, full-stack implementation of the classic Toy Robot Simulator. This application allows users to place and pilot a simulated toy robot on a 5x5 tactical grid using a Node.js backend engine and a responsive React frontend interface.

The design strictly implements a cohesive purple-and-white theme featuring precision spacing built entirely on multiples of 8px.

---

## 🚀 Live Features

* **Interactive 5x5 Tactical Grid:** Visualizes the robot's real-time position and orientation with precise geometric translation.
* **Dual Simulation Modes:** * **Default Script Execution:** Read and simulate server-side command files (`default_command.txt`) instantly.
  * **Custom Drag-and-Drop:** Upload custom `.txt` configuration files containing arbitrary command sequences.
* **Manual Cockpit (Keyboard Controls):** Actively pilot the robot directly around the grid using your physical keyboard arrow keys.
* **Playback Controls & Telemetry History:** Scrub through execution history step-by-step using an interactive timeline slider, complete with syntax-highlighted command output.
* **Robust Safety Boundaries:** Integrated boundary checks prevent the robot from tumbling off the table, discarding destructive commands while preserving state orientation.

---

## 🛠️ Technology Stack

The project is structured as a unified monorepo divided into isolated, typed execution layers:

### Backend
* **Runtime:** Node.js
* **Framework:** Express with TypeScript (`tsx` for hot-reloading)
* **API Architecture:** RESTful Endpoints (`GET /api/default-commands`, `POST /api/simulate`)
* **Testing / Utilities:** Node File System (`fs`), Path utilities, and custom coordinate boundary validation rules.

### Frontend
* **Build Tool:** Vite + TypeScript
* **Framework:** React 19 (Functional components, Hooks, and `useRef` for timing)
* **Styling:** Tailwind CSS v4 (Using modernized `@theme` variables for native CSS performance)
* **Iconography:** Lucide React

---

## 📐 Design & Engineering Insights

### The Space Translation Formula
HTML grids naturally render index `0` at the top-left, whereas Cartesian mathematics places the origin (0,0) at the bottom-left. To map coordinates seamlessly without mutating backend engine logic, the UI translates spatial rendering vertically:

`CSS Row = 4 - y`

This mathematically ensures that y = 4 remains safely at the top of the grid and y = 0 locks to the bottom.

### Figma-to-Code Spacing Compliance
All layout padding, margins, gaps, and structural containers are locked to fixed multiples of 8px to maintain pixel-perfect layout integrity across varying displays:
* Outer Page Padding: `24px` (`p-[24px]`)
* Element Grid Gap: `24px` (`gap-[24px]`)
* Border Radii: `8px`, `12px`, and `16px`

---

## 📂 Repository Structure

text
ToyRobot/
├── package.json        # Root workspace manager & Concurrently script
├── backend/            # Express + TS backend simulator
│   ├── src/            # Simulation engines & server routes
│   └── data/           # Default command text files
└── frontend/           # Vite + React + Tailwind v4 visual application
    ├── public/         # Static assets (Favicons, assets)
    └── src/            # Interactive UI Dashboard components


⚙️ Getting Started & Installation
You can run both servers simultaneously in a single terminal tab using our integrated orchestrator.

Prerequisites
Make sure you have Node.js installed on your machine.

Setup Instructions
Clone the Repository:
git clone [https://github.com/YOUR_USERNAME/toy-robot-simulator.git](https://github.com/YOUR_USERNAME/toy-robot-simulator.git)
cd toy-robot-simulator

Install Root Workspace Dependencies:
This installs the project orchestrator (concurrently):
npm install

Install Layer Dependencies:
Install dependencies for both the backend and frontend engines:
cd backend && npm install
cd ../frontend && npm install
cd ..

🏃 Running the Application
To fire up both the Node.js backend server (Port 5000) and the Vite frontend dev environment (Port 5173) simultaneously, run the following command from the root directory:
npm run dev

Your terminal logs will be beautifully prefix-labeled and color-coded:

[BACKEND] logs will display in purple/magenta.

[FRONTEND] logs will display in blue/cyan.

Open http://localhost:5173 in your browser to start playing!

📥 Sample Test Document
Create a .txt file, paste the commands below, and upload it to see the system's boundary protection and placement recovery in action:

PLACE 1,2,EAST
MOVE
MOVE
LEFT
MOVE
REPORT

Expected final coordinate state output: (3,3) FACING NORTH
