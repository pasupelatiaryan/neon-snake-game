import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Trophy, Music, Gamepad2 } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "Neon Genesis",
    artist: "AI SynthMind",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Cybernetic Pulse",
    artist: "NeuralNet",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Digital Horizon",
    artist: "AlgorithmX",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop"
  }
];

export default function App() {
  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(true);
  
  const directionRef = useRef(direction);
  const isGamePausedRef = useRef(isGamePaused);
  const gameOverRef = useRef(gameOver);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
    setIsGamePaused(false);
    isGamePausedRef.current = false;
    generateFood();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      if (e.key === ' ' && !gameOver) {
        setIsGamePaused(prev => {
          const newState = !prev;
          isGamePausedRef.current = newState;
          return newState;
        });
        return;
      }

      if (isGamePausedRef.current || gameOverRef.current) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    const moveSnake = () => {
      if (gameOverRef.current || isGamePausedRef.current) return;

      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          gameOverRef.current = true;
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          gameOverRef.current = true;
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [food, score, highScore, generateFood]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-cyan-500/30">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-4xl flex justify-between items-end mb-8 px-4">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
            NEON SNAKE
          </h1>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Score</p>
            <p className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              {score.toString().padStart(4, '0')}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
              <Trophy className="w-3 h-3" /> High Score
            </p>
            <p className="text-3xl font-bold text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]">
              {highScore.toString().padStart(4, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-5xl">
        
        {/* Center Game Board */}
        <div className="relative bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
          <div 
            className="bg-black rounded-xl overflow-hidden relative border border-cyan-500/30 shadow-[inset_0_0_20px_rgba(0,0,0,1)]"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: 'min(100vw - 2rem, 450px)',
              height: 'min(100vw - 2rem, 450px)',
            }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20" 
                 style={{
                   backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)',
                   backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`
                 }} 
            />

            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div 
                  key={i} 
                  className={`
                    relative w-full h-full
                    ${isSnakeHead ? 'bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)] z-10 rounded-sm scale-105' : ''}
                    ${isSnakeBody ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] rounded-sm scale-90' : ''}
                    ${isFood ? 'bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,1)] rounded-full scale-75 animate-pulse' : ''}
                  `}
                />
              );
            })}
          </div>

          {/* Game Over / Paused Overlay */}
          {(gameOver || isGamePaused) && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20">
              <h2 className={`text-4xl font-black mb-4 uppercase tracking-widest ${gameOver ? 'text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]'}`}>
                {gameOver ? 'Game Over' : 'Paused'}
              </h2>
              <p className="text-slate-300 mb-8 tracking-widest text-sm">
                {gameOver ? `Final Score: ${score}` : 'Press SPACE to start/pause'}
              </p>
              {gameOver && (
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold uppercase tracking-widest rounded-lg hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Side Panel: Music Player & Controls */}
        <div className="flex flex-col gap-6 w-full max-w-[320px]">
          {/* Music Player */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-2 mb-5">
              <Music className="w-4 h-4 text-fuchsia-400" />
              <h2 className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase">Now Playing</h2>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shadow-lg shrink-0">
                <img 
                  src={currentTrack.cover} 
                  alt="Album Cover" 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-base font-bold text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{currentTrack.title}</h3>
                <p className="text-slate-400 text-xs mt-1 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 rounded-full mb-5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(217,70,239,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevTrack} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-12 h-12 flex items-center justify-center bg-cyan-500 text-slate-950 rounded-full hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              
              <button onClick={nextTrack} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/50">
              <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-cyan-400">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl text-xs text-slate-400 uppercase tracking-widest leading-relaxed">
            <p className="mb-2"><span className="text-cyan-400 font-bold">WASD / Arrows</span> to move</p>
            <p><span className="text-fuchsia-400 font-bold">Space</span> to pause/resume</p>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => nextTrack()}
      />
    </div>
  );
}
