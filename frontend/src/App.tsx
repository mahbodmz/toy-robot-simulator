import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Play, Square, RotateCcw, Compass, 
  Keyboard, FileText, ArrowUp, ArrowLeft, ArrowRight 
} from 'lucide-react';

// Define the shape of our API data
interface RobotState {
  x: number;
  y: number;
  f: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
}

interface SimulationStep {
  command: string;
  state: RobotState | null;
}

export default function App() {
  // State variables
  const [commands, setCommands] = useState<string[]>([]);
  const [history, setHistory] = useState<SimulationStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [keyboardMode, setKeyboardMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const playbackInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Default Simulation
  const handleLoadDefault = async () => {
    try {
      setError(null);
      resetPlayback();
      const response = await fetch('http://localhost:5000/api/default-commands');
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
        setCommands(data.history.map((h: any) => h.command));
        setCurrentIndex(0); // Start at the beginning of history
      } else {
        setError(data.error || 'Failed to load simulation.');
      }
    } catch (err) {
      setError('Could not connect to the server. Is it running on port 5000?');
    }
  };

  // 2. Upload Custom File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const fileCommands = text.split(/\r?\n/).filter(line => line.trim() !== '');
      await runCustomSimulation(fileCommands);
    };
    reader.readAsText(file);
  };

  // 3. Send Commands to API
  const runCustomSimulation = async (cmdList: string[]) => {
    try {
      setError(null);
      resetPlayback();
      const response = await fetch('http://localhost:5000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: cmdList })
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
        setCommands(cmdList);
        setCurrentIndex(0);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error communicating with backend server.');
    }
  };

  // 4. Keyboard Controller Input Helper
  const handleKeyboardCommand = async (command: string) => {
    setError(null);
    let nextCommands = [...commands];

    // If starting fresh without a PLACE, default to placing at 0,0,NORTH
    const hasBeenPlaced = history.some(h => h.state !== null);
    if (!hasBeenPlaced && !command.startsWith('PLACE')) {
      nextCommands.push('PLACE 0,0,NORTH');
    }

    nextCommands.push(command);
    nextCommands.push('REPORT'); // Auto-report to capture the output

    try {
      const response = await fetch('http://localhost:5000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: nextCommands })
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
        setCommands(nextCommands);
        // Instantly focus the visual coordinate onto the latest step
        setCurrentIndex(data.history.length - 1);
      }
    } catch (err) {
      setError('Connection to backend lost.');
    }
  };

  // Capture Physical Arrow Keys when Keyboard Mode is Active
  useEffect(() => {
    if (!keyboardMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleKeyboardCommand('MOVE');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleKeyboardCommand('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleKeyboardCommand('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardMode, commands, history]);

  // Animated Playback Engine (Lively stepping through states)
  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= history.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800); // Step every 800ms
    } else if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
    }

    return () => {
      if (playbackInterval.current) clearInterval(playbackInterval.current);
    };
  }, [isPlaying, history]);

  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setCommands([]);
    setHistory([]);
  };

  // Get active step data
  const currentStep = currentIndex >= 0 ? history[currentIndex] : null;
  const currentRobot = currentStep?.state || null;

  // Visual helper to rotate robot arrow icon based on direction
  const getRotationClass = (dir: string) => {
    switch (dir) {
      case 'EAST': return 'rotate-90';
      case 'SOUTH': return 'rotate-180';
      case 'WEST': return '-rotate-90';
      default: return 'rotate-0';
    }
  };

  return (
    <div className="min-h-screen bg-brand-light p-[24px] text-slate-800 flex flex-col justify-between">
      {/* HEADER PANEL */}
      <header className="mb-[24px]">
        <h1 className="text-[28px] font-black text-brand-purple flex items-center gap-[12px]">
          🤖 TOY ROBOT SIMULATOR
        </h1>
        <p className="text-slate-500 text-[14px]">Control, simulate, and observe coordinate mathematics in real-time.</p>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-[24px] bg-red-50 border-l-4 border-red-500 text-red-700 p-[16px] rounded-[8px] text-[14px]">
          {error}
        </div>
      )}

      {/* THREE-COLUMN DASHBOARD PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] items-stretch flex-grow">
        
        {/* COLUMN 1: CONTROL STATION (LEFT) */}
        <div className="bg-white rounded-[16px] p-[24px] border border-purple-100 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-[18px] font-bold text-slate-700 mb-[16px] flex items-center gap-[8px]">
              <FileText className="w-[20px] text-brand-purple" /> CONTROL CENTER
            </h2>

            {/* Quick Demo Button */}
            <button
              onClick={handleLoadDefault}
              className="w-full bg-brand-purple hover:bg-brand-dark text-white font-bold py-[12px] px-[16px] rounded-[8px] cursor-pointer transition-colors mb-[16px] flex items-center justify-center gap-[8px]"
            >
              <Play className="w-[18px]" /> Run Default Demo File
            </button>

            {/* Upload Boundary Box */}
            <div className="border-2 border-dashed border-purple-200 hover:border-brand-purple rounded-[12px] p-[20px] text-center transition-colors mb-[24px] relative bg-purple-50/30">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-[32px] mx-auto text-brand-purple mb-[8px]" />
              <p className="text-[14px] font-medium text-slate-600">Upload Commands File</p>
              <p className="text-[11px] text-slate-400 mt-[4px]">Accepts custom .txt documents</p>
            </div>
          </div>

          {/* Manual Controller Interface */}
          <div className="border-t border-slate-100 pt-[24px]">
            <div className="flex items-center justify-between mb-[16px]">
              <label className="text-[14px] font-bold text-slate-700 flex items-center gap-[8px]">
                <Keyboard className="w-[18px] text-brand-purple" /> Keyboard Arrow Controls
              </label>
              <button
                onClick={() => setKeyboardMode(!keyboardMode)}
                className={`text-[12px] font-bold px-[12px] py-[6px] rounded-[20px] transition-all cursor-pointer ${
                  keyboardMode 
                    ? 'bg-brand-purple text-white shadow-md' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {keyboardMode ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            {keyboardMode ? (
              <div className="flex flex-col items-center gap-[8px] bg-purple-50/50 p-[16px] rounded-[12px]">
                <button 
                  onClick={() => handleKeyboardCommand('MOVE')}
                  className="bg-white hover:bg-slate-50 border border-purple-200 p-[10px] rounded-[8px] shadow-sm cursor-pointer"
                >
                  <ArrowUp className="w-[20px] text-brand-purple" />
                </button>
                <div className="flex gap-[16px]">
                  <button 
                    onClick={() => handleKeyboardCommand('LEFT')}
                    className="bg-white hover:bg-slate-50 border border-purple-200 p-[10px] rounded-[8px] shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-[20px] text-brand-purple" />
                  </button>
                  <button 
                    onClick={() => handleKeyboardCommand('RIGHT')}
                    className="bg-white hover:bg-slate-50 border border-purple-200 p-[10px] rounded-[8px] shadow-sm cursor-pointer"
                  >
                    <ArrowRight className="w-[20px] text-brand-purple" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-[8px]">Focus window and use your physical Arrow Keys</p>
              </div>
            ) : (
              <p className="text-[12px] text-slate-400 text-center italic py-[12px]">
                Toggle "ACTIVE" to pilot the robot using live keyboard commands
              </p>
            )}
          </div>
        </div>

        {/* COLUMN 2: LIVE VISUAL GRID (CENTER) */}
        <div className="bg-white rounded-[16px] p-[24px] border border-purple-100 flex flex-col justify-between items-center h-full">
          <div className="w-full">
            <h2 className="text-[18px] font-bold text-slate-700 mb-[16px] flex items-center gap-[8px]">
              <Compass className="w-[20px] text-brand-purple" /> 5x5 TACTICAL GRID
            </h2>
            
            {/* Visual Grid Loop */}
            <div className="grid grid-cols-5 gap-[8px] bg-slate-100 p-[8px] rounded-[16px] aspect-square w-full">
              {[4, 3, 2, 1, 0].map((y) => (
                <React.Fragment key={y}>
                  {[0, 1, 2, 3, 4].map((x) => {
                    const isRobotHere = currentRobot && currentRobot.x === x && currentRobot.y === y;
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`aspect-square rounded-[8px] flex items-center justify-center border transition-all duration-300 relative ${
                          isRobotHere
                            ? 'bg-brand-purple text-white border-transparent scale-[1.03] shadow-md shadow-brand-purple/30 z-10'
                            : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isRobotHere ? (
                          <div className={`transition-transform duration-300 ${getRotationClass(currentRobot.f)}`}>
                            <ArrowUp className="w-[24px] h-[24px] stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] absolute bottom-1 right-1 select-none">{x},{y}</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Timeline Animation Scrub Controls */}
          {history.length > 0 && (
            <div className="w-full mt-[20px] border-t border-slate-100 pt-[16px] flex items-center justify-between gap-[16px]">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-brand-purple hover:bg-brand-dark text-white font-bold p-[8px] rounded-[8px] cursor-pointer transition-colors"
              >
                {isPlaying ? <Square className="w-[18px]" /> : <Play className="w-[18px]" />}
              </button>
              
              <input
                type="range"
                min="0"
                max={history.length - 1}
                value={currentIndex >= 0 ? currentIndex : 0}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentIndex(parseInt(e.target.value, 10));
                }}
                className="flex-grow accent-brand-purple cursor-pointer"
              />
              
              <button
                onClick={resetPlayback}
                className="border border-slate-200 hover:bg-slate-100 p-[8px] rounded-[8px] cursor-pointer transition-colors"
              >
                <RotateCcw className="w-[18px] text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 3: LIVE STATE COORDINATES & HISTORY (RIGHT) */}
        <div className="bg-white rounded-[16px] p-[24px] border border-purple-100 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-[18px] font-bold text-slate-700 mb-[16px]">LIVE STATE</h2>
            
            {/* Telemetry Output Display */}
            {currentRobot ? (
              <div className="bg-brand-light border border-purple-200 rounded-[12px] p-[20px] mb-[24px] text-center shadow-inner">
                <div className="text-[36px] font-black text-brand-purple tracking-tight leading-none">
                  ({currentRobot.x}, {currentRobot.y})
                </div>
                <div className="text-[14px] font-bold text-slate-500 tracking-widest mt-[8px]">
                  FACING {currentRobot.f}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[12px] p-[20px] mb-[24px] text-center text-slate-400 italic text-[14px]">
                Robot not placed on the grid yet. Run a demo or issue a command.
              </div>
            )}
          </div>

          {/* Commands History Log Output */}
          <div className="flex-grow flex flex-col min-h-0">
            <h3 className="text-[12px] font-bold tracking-wider text-slate-400 mb-[8px] uppercase">Command Stream</h3>
            <div className="bg-slate-900 text-slate-300 font-mono text-[11px] rounded-[8px] p-[16px] flex-grow overflow-y-auto max-h-[220px]">
              {history.length > 0 ? (
                history.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`py-[4px] px-[8px] rounded-[4px] cursor-pointer transition-colors ${
                      idx === currentIndex 
                        ? 'bg-brand-purple/30 text-brand-purple border-l-2 border-brand-purple' 
                        : 'hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex(idx);
                    }}
                  >
                    <span className="text-slate-500 select-none mr-2">[{idx + 1}]</span>
                    <span className="font-bold text-white">{step.command}</span>
                    {step.state ? (
                      <span className="text-emerald-400 ml-2">
                        → ({step.state.x},{step.state.y},{step.state.f})
                      </span>
                    ) : (
                      <span className="text-amber-400 ml-2">→ (ignored)</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic text-center">No telemetry logging active</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="mt-[24px] text-center text-[11px] text-slate-400">
        System active. Created with React, TypeScript, Node.js, and Tailwind CSS.
      </footer>
    </div>
  );
}