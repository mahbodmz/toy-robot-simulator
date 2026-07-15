import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { ToyRobot, Direction, RobotState } from './robotLogic';

const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json());


interface SimulationStep {
  command: string;
  state: RobotState | null; // null if the robot isn't placed yet
}

// Helper function to process a list of raw string commands and return the history of states
function runSimulation(commands: string[]): SimulationStep[] {
  const robot = new ToyRobot();
  const history: SimulationStep[] = [];

  for (const line of commands) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('PLACE')) {
      const parts = trimmed.split(' ');
      const argsStr = parts[1];
      if (argsStr) {
        const args = argsStr.split(',');
        const x = parseInt(args[0] || '0', 10);
        const y = parseInt(args[1] || '0', 10);
        const f = args[2] as Direction;
        robot.place(x, y, f);
      }
    } else if (trimmed === 'MOVE') {
      robot.move();
    } else if (trimmed === 'LEFT') {
      robot.left();
    } else if (trimmed === 'RIGHT') {
      robot.right();
    }

    // Get the updated state of the robot after this command
    // We will quickly add a getState() method to our ToyRobot class next to make this easy!
    const currentState = (robot as any).getState(); 
    history.push({
      command: trimmed,
      state: currentState
    });
  }

  return history;
}

// Endpoint 1: Read and simulate the default command file
app.get('/api/default-commands', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/default_command.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const commands = fileContent.split(/\r?\n/);
    const history = runSimulation(commands);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not read default command file' });
  }
});

// Endpoint 2: Simulate custom commands (from uploaded files or manual inputs)
app.post('/api/simulate', (req, res) => {
  const { commands } = req.body; // Expects an array of string commands: ["PLACE 0,0,NORTH", "MOVE"]
  if (!Array.isArray(commands)) {
    res.status(400).json({ success: false, error: 'Commands must be an array of strings' });
    return;
  }
  const history = runSimulation(commands);
  res.json({ success: true, history });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});