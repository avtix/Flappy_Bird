import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { GameComponents } from './components';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 40;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PIPE_SPEED = 3;

const FlappyXGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver, paused
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBird, setSelectedBird] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [gameStats, setGameStats] = useState({ fps: 0, hits: 0, jumps: 0 });
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  
  // Game objects
  const gameObjects = useRef({
    bird: { x: 150, y: 300, velocity: 0, size: BIRD_SIZE },
    pipes: [],
    powerUps: [],
    particles: [],
    background: { x: 0, mountain: 0, city: 0 }
  });

  // Power-up types
  const powerUpTypes = [
    { type: 'shield', color: '#4FC3F7', duration: 5000 },
    { type: 'slowMotion', color: '#9C27B0', duration: 3000 },
    { type: 'jetBoost', color: '#FF9800', duration: 2000 }
  ];

  // Bird skins
  const birdSkins = [
    { name: 'Classic', color: '#FFD700', unlocked: true },
    { name: 'Robotic', color: '#607D8B', unlocked: false },
    { name: 'Neon', color: '#E91E63', unlocked: false },
    { name: 'Stealthy', color: '#424242', unlocked: false }
  ];

  // Weather effects
  const weatherEffects = useRef([]);
  const activePowerUps = useRef([]);
  const timeMultiplier = useRef(1);
  const lastFrameTime = useRef(0);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappyXHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Save high score to localStorage
  useEffect(() => {
    localStorage.setItem('flappyXHighScore', highScore.toString());
  }, [highScore]);

  // Initialize game
  const initGame = useCallback(() => {
    const bird = gameObjects.current.bird;
    bird.x = 150;
    bird.y = 300;
    bird.velocity = 0;
    
    gameObjects.current.pipes = [];
    gameObjects.current.powerUps = [];
    gameObjects.current.particles = [];
    gameObjects.current.background = { x: 0, mountain: 0, city: 0 };
    
    activePowerUps.current = [];
    timeMultiplier.current = 1;
    
    setScore(0);
    setGameStats({ fps: 0, hits: 0, jumps: 0 });
    setMotivationalMessage('');
    
    // Generate initial pipes
    for (let i = 0; i < 3; i++) {
      generatePipe(i * 300 + 500);
    }
    
    // Generate weather effects
    generateWeatherEffects();
  }, []);

  // Generate pipe
  const generatePipe = (x) => {
    const minHeight = 100;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    
    gameObjects.current.pipes.push({
      x: x,
      topHeight: height,
      bottomY: height + PIPE_GAP,
      scored: false,
      powerUp: Math.random() < 0.3 // 30% chance for power-up
    });
  };

  // Generate power-up
  const generatePowerUp = (x, y) => {
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    gameObjects.current.powerUps.push({
      x: x,
      y: y,
      type: powerUpType.type,
      color: powerUpType.color,
      duration: powerUpType.duration,
      collected: false
    });
  };

  // Generate weather effects
  const generateWeatherEffects = () => {
    weatherEffects.current = [];
    if (weather === 'rain') {
      for (let i = 0; i < 100; i++) {
        weatherEffects.current.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: Math.random() * 5 + 3,
          length: Math.random() * 20 + 10
        });
      }
    } else if (weather === 'snow') {
      for (let i = 0; i < 50; i++) {
        weatherEffects.current.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: Math.random() * 2 + 1,
          size: Math.random() * 3 + 2
        });
      }
    }
  };

  // Jump function
  const jump = useCallback(() => {
    if (gameState === 'playing') {
      gameObjects.current.bird.velocity = JUMP_FORCE;
      setGameStats(prev => ({ ...prev, jumps: prev.jumps + 1 }));
      
      // Create jump particles
      for (let i = 0; i < 5; i++) {
        gameObjects.current.particles.push({
          x: gameObjects.current.bird.x,
          y: gameObjects.current.bird.y + 20,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2,
          life: 20,
          color: birdSkins[selectedBird].color
        });
      }
    }
  }, [gameState, selectedBird]);

  // Check collision
  const checkCollision = (bird, pipe) => {
    return (
      bird.x < pipe.x + PIPE_WIDTH &&
      bird.x + bird.size > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.size > pipe.bottomY)
    );
  };

  // Check power-up collection
  const checkPowerUpCollection = (bird, powerUp) => {
    const distance = Math.sqrt(
      Math.pow(bird.x + bird.size/2 - powerUp.x, 2) +
      Math.pow(bird.y + bird.size/2 - powerUp.y, 2)
    );
    return distance < 30;
  };

  // Apply power-up effect
  const applyPowerUp = (powerUp) => {
    activePowerUps.current.push({
      type: powerUp.type,
      startTime: Date.now(),
      duration: powerUp.duration
    });

    if (powerUp.type === 'slowMotion') {
      timeMultiplier.current = 0.5;
    } else if (powerUp.type === 'jetBoost') {
      gameObjects.current.bird.velocity = -15;
    }
  };

  // Update power-ups
  const updatePowerUps = () => {
    const currentTime = Date.now();
    activePowerUps.current = activePowerUps.current.filter(powerUp => {
      if (currentTime - powerUp.startTime > powerUp.duration) {
        if (powerUp.type === 'slowMotion') {
          timeMultiplier.current = 1;
        }
        return false;
      }
      return true;
    });
  };

  // Generate motivational message
  const generateMotivationalMessage = () => {
    const messages = [
      `Great effort! You made ${gameStats.jumps} jumps!`,
      `So close! Try tapping more consistently through the pipes.`,
      `You're getting better! Your best is ${highScore} points.`,
      `Pro tip: Time your jumps to stay in the middle of the gaps!`,
      `Don't give up! Even the best players crash sometimes.`,
      `Nice rhythm! Keep practicing to improve your timing.`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setMotivationalMessage(randomMessage);
  };

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    const bird = gameObjects.current.bird;
    const pipes = gameObjects.current.pipes;
    const powerUps = gameObjects.current.powerUps;
    const particles = gameObjects.current.particles;
    const background = gameObjects.current.background;

    // Update FPS
    if (deltaTime > 0) {
      setGameStats(prev => ({ ...prev, fps: Math.round(1000 / deltaTime) }));
    }

    // Apply time multiplier for slow motion
    const speed = PIPE_SPEED * timeMultiplier.current;
    const gravity = GRAVITY * timeMultiplier.current;

    // Update bird physics
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Update background parallax
    background.x -= speed * 0.5;
    background.mountain -= speed * 0.3;
    background.city -= speed * 0.7;

    // Update pipes
    pipes.forEach(pipe => {
      pipe.x -= speed;
      
      // Check scoring
      if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.scored = true;
        setScore(prev => prev + 1);
        
        // Generate power-up occasionally
        if (pipe.powerUp && Math.random() < 0.5) {
          generatePowerUp(pipe.x, pipe.topHeight + PIPE_GAP / 2);
        }
      }
    });

    // Update power-ups
    powerUps.forEach(powerUp => {
      powerUp.x -= speed;
      
      // Check collection
      if (!powerUp.collected && checkPowerUpCollection(bird, powerUp)) {
        powerUp.collected = true;
        applyPowerUp(powerUp);
      }
    });

    // Update particles
    particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
    });

    // Update weather effects
    weatherEffects.current.forEach(effect => {
      effect.y += effect.speed;
      if (effect.y > CANVAS_HEIGHT) {
        effect.y = -20;
        effect.x = Math.random() * CANVAS_WIDTH;
      }
    });

    // Remove old objects
    gameObjects.current.pipes = pipes.filter(pipe => pipe.x > -PIPE_WIDTH);
    gameObjects.current.powerUps = powerUps.filter(powerUp => powerUp.x > -50 && !powerUp.collected);
    gameObjects.current.particles = particles.filter(particle => particle.life > 0);

    // Generate new pipes
    const lastPipe = pipes[pipes.length - 1];
    if (lastPipe && lastPipe.x < CANVAS_WIDTH - 300) {
      generatePipe(lastPipe.x + 300);
    }

    // Update power-ups
    updatePowerUps();

    // Check collisions
    let hasShield = activePowerUps.current.some(p => p.type === 'shield');
    
    if (!hasShield) {
      // Check pipe collisions
      for (let pipe of pipes) {
        if (checkCollision(bird, pipe)) {
          setGameState('gameOver');
          setGameStats(prev => ({ ...prev, hits: prev.hits + 1 }));
          generateMotivationalMessage();
          if (score > highScore) {
            setHighScore(score);
          }
          return;
        }
      }

      // Check ground/ceiling collision
      if (bird.y + bird.size > CANVAS_HEIGHT || bird.y < 0) {
        setGameState('gameOver');
        setGameStats(prev => ({ ...prev, hits: prev.hits + 1 }));
        generateMotivationalMessage();
        if (score > highScore) {
          setHighScore(score);
        }
        return;
      }
    }

    // Adaptive AI difficulty
    if (score > 0 && score % 10 === 0) {
      setAiDifficulty(Math.min(3, Math.floor(score / 10) + 1));
    }
  }, [gameState, score, highScore, gameStats, selectedBird]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (timeOfDay === 'day') {
      gradient.addColorStop(0, isDarkMode ? '#1a1a2e' : '#87CEEB');
      gradient.addColorStop(1, isDarkMode ? '#16213e' : '#E0F6FF');
    } else {
      gradient.addColorStop(0, '#0F1419');
      gradient.addColorStop(1, '#1a1a2e');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw parallax backgrounds
    const background = gameObjects.current.background;
    
    // Mountains
    ctx.fillStyle = timeOfDay === 'day' ? '#4A5568' : '#2D3748';
    for (let i = 0; i < 4; i++) {
      const x = (background.mountain + i * 200) % (CANVAS_WIDTH + 200);
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_HEIGHT);
      ctx.lineTo(x + 100, CANVAS_HEIGHT - 150);
      ctx.lineTo(x + 200, CANVAS_HEIGHT);
      ctx.fill();
    }

    // City skyline
    ctx.fillStyle = timeOfDay === 'day' ? '#2D3748' : '#1A202C';
    for (let i = 0; i < 6; i++) {
      const x = (background.city + i * 150) % (CANVAS_WIDTH + 150);
      const height = 100 + Math.sin(i) * 50;
      ctx.fillRect(x, CANVAS_HEIGHT - height, 120, height);
    }

    // Draw weather effects
    if (weather === 'rain') {
      ctx.strokeStyle = '#4A90E2';
      ctx.lineWidth = 2;
      weatherEffects.current.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y - drop.length);
        ctx.stroke();
      });
    } else if (weather === 'snow') {
      ctx.fillStyle = '#FFFFFF';
      weatherEffects.current.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw pipes
    ctx.fillStyle = isDarkMode ? '#4A5568' : '#228B22';
    gameObjects.current.pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
      
      // Pipe highlights
      ctx.fillStyle = isDarkMode ? '#68D391' : '#32CD32';
      ctx.fillRect(pipe.x, pipe.topHeight - 30, PIPE_WIDTH, 30);
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, 30);
      ctx.fillStyle = isDarkMode ? '#4A5568' : '#228B22';
    });

    // Draw power-ups
    gameObjects.current.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Power-up icon
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const icon = powerUp.type === 'shield' ? '🛡️' : powerUp.type === 'slowMotion' ? '⏰' : '🚀';
        ctx.fillText(icon, powerUp.x, powerUp.y + 5);
      }
    });

    // Draw particles
    gameObjects.current.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 20;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw bird
    const bird = gameObjects.current.bird;
    ctx.fillStyle = birdSkins[selectedBird].color;
    
    // Bird body
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2 + 5, bird.y + bird.size/2 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2 + 7, bird.y + bird.size/2 - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Shield effect
    if (activePowerUps.current.some(p => p.type === 'shield')) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2 + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Debug mode
    if (debugMode) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(bird.x, bird.y, bird.size, bird.size);
      
      gameObjects.current.pipes.forEach(pipe => {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(pipe.x, pipe.topHeight, PIPE_WIDTH, PIPE_GAP);
      });
    }

    // Draw UI
    ctx.fillStyle = isDarkMode ? 'white' : 'black';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillText(`Best: ${highScore}`, 20, 90);

    // Power-up indicators
    let powerUpY = 130;
    activePowerUps.current.forEach(powerUp => {
      const remainingTime = Math.max(0, powerUp.duration - (Date.now() - powerUp.startTime));
      const progress = remainingTime / powerUp.duration;
      
      ctx.fillStyle = powerUpTypes.find(p => p.type === powerUp.type)?.color || 'white';
      ctx.fillRect(20, powerUpY, 100 * progress, 10);
      
      ctx.fillStyle = isDarkMode ? 'white' : 'black';
      ctx.font = '14px Arial';
      ctx.fillText(powerUp.type, 20, powerUpY + 25);
      
      powerUpY += 35;
    });

    // Debug info
    if (debugMode) {
      ctx.fillStyle = 'yellow';
      ctx.font = '16px Arial';
      ctx.fillText(`FPS: ${gameStats.fps}`, CANVAS_WIDTH - 100, 30);
      ctx.fillText(`Jumps: ${gameStats.jumps}`, CANVAS_WIDTH - 100, 50);
      ctx.fillText(`Hits: ${gameStats.hits}`, CANVAS_WIDTH - 100, 70);
      ctx.fillText(`AI Difficulty: ${aiDifficulty}`, CANVAS_WIDTH - 100, 90);
      ctx.fillText(`Weather: ${weather}`, CANVAS_WIDTH - 100, 110);
    }

    requestAnimationFrame(draw);
  }, [gameState, score, highScore, debugMode, isDarkMode, selectedBird, timeOfDay, weather, gameStats, aiDifficulty]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastFrameTime.current = Date.now();
      gameLoopRef.current = setInterval(gameLoop, 16); // ~60 FPS
    } else {
      clearInterval(gameLoopRef.current);
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, gameLoop]);

  // Start draw loop
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      
      // Debug commands
      if (debugMode) {
        if (e.code === 'KeyG') { // God mode
          activePowerUps.current.push({ type: 'shield', startTime: Date.now(), duration: 10000 });
        } else if (e.code === 'KeyP') { // Spawn power-up
          generatePowerUp(bird.x + 100, bird.y);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, debugMode]);

  // Toggle weather effect every 30 seconds
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      const weathers = ['clear', 'rain', 'snow'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(newWeather);
      generateWeatherEffects();
    }, 30000);

    return () => clearInterval(weatherInterval);
  }, []);

  // Toggle day/night cycle every 45 seconds
  useEffect(() => {
    const dayNightInterval = setInterval(() => {
      setTimeOfDay(prev => prev === 'day' ? 'night' : 'day');
    }, 45000);

    return () => clearInterval(dayNightInterval);
  }, []);

  // Start game
  const startGame = () => {
    initGame();
    setGameState('playing');
  };

  // Restart game
  const restartGame = () => {
    startGame();
  };

  // Handle canvas click
  const handleCanvasClick = () => {
    if (gameState === 'playing') {
      jump();
    }
  };

  return (
    <div className={`game-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="game-header">
        <h1 className="game-title">🎮 Flappy X: AI Sky Quest</h1>
        <div className="game-controls">
          <button onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setDebugMode(!debugMode)}>
            {debugMode ? '🔧' : '⚙️'}
          </button>
        </div>
      </div>

      <div className="game-canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="game-canvas"
        />

        {gameState === 'menu' && (
          <GameComponents.MenuOverlay 
            onStartGame={startGame}
            birdSkins={birdSkins}
            selectedBird={selectedBird}
            setSelectedBird={setSelectedBird}
            highScore={highScore}
            isDarkMode={isDarkMode}
          />
        )}

        {gameState === 'gameOver' && (
          <GameComponents.GameOverOverlay
            score={score}
            highScore={highScore}
            motivationalMessage={motivationalMessage}
            onRestartGame={restartGame}
            isDarkMode={isDarkMode}
          />
        )}

        {gameState === 'playing' && (
          <GameComponents.GameHUD
            score={score}
            highScore={highScore}
            activePowerUps={activePowerUps.current}
            powerUpTypes={powerUpTypes}
            weather={weather}
            timeOfDay={timeOfDay}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      <div className="game-instructions">
        <p>🎯 Click or press SPACE to flap • 🎁 Collect power-ups • 🏆 Beat your high score!</p>
        {debugMode && (
          <p>🔧 Debug Mode: G = God Mode, P = Spawn Power-up</p>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <FlappyXGame />
    </div>
  );
}

export default App;