import React from 'react';

export const GameComponents = {
  MenuOverlay: ({ onStartGame, birdSkins, selectedBird, setSelectedBird, highScore, isDarkMode }) => (
    <div className="game-overlay menu-overlay">
      <div className="menu-content">
        <h2 className="menu-title">🎮 Flappy X: AI Sky Quest</h2>
        <div className="menu-subtitle">Advanced Interactive Bird Adventure</div>
        
        <div className="high-score-display">
          <div className="high-score-label">🏆 High Score</div>
          <div className="high-score-value">{highScore}</div>
        </div>

        <div className="bird-selection">
          <h3>Choose Your Bird:</h3>
          <div className="bird-grid">
            {birdSkins.map((skin, index) => (
              <div
                key={index}
                className={`bird-option ${selectedBird === index ? 'selected' : ''} ${!skin.unlocked ? 'locked' : ''}`}
                onClick={() => skin.unlocked && setSelectedBird(index)}
              >
                <div
                  className="bird-preview"
                  style={{ backgroundColor: skin.color }}
                ></div>
                <div className="bird-name">{skin.name}</div>
                {!skin.unlocked && <div className="lock-icon">🔒</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="game-features">
          <h3>🚀 Features:</h3>
          <ul>
            <li>🛡️ Shield Power-up - Ignore obstacles</li>
            <li>⏰ Slow Motion - Time control</li>
            <li>🚀 Jet Boost - Super speed</li>
            <li>🌤️ Dynamic Weather Effects</li>
            <li>🌙 Day/Night Cycle</li>
            <li>🤖 AI Adaptive Difficulty</li>
          </ul>
        </div>

        <button className="start-button" onClick={onStartGame}>
          <span className="button-text">🎯 START GAME</span>
          <div className="button-subtitle">Click or press SPACE to flap!</div>
        </button>

        <div className="game-tips">
          <h4>💡 Pro Tips:</h4>
          <p>• Stay calm and maintain rhythm</p>
          <p>• Collect power-ups for advantages</p>
          <p>• Use debug mode (⚙️) for practice</p>
        </div>
      </div>
    </div>
  ),

  GameOverOverlay: ({ score, highScore, motivationalMessage, onRestartGame, isDarkMode }) => (
    <div className="game-overlay game-over-overlay">
      <div className="game-over-content">
        <h2 className="game-over-title">💥 Game Over!</h2>
        
        <div className="score-display">
          <div className="final-score">
            <div className="score-label">Your Score</div>
            <div className="score-value">{score}</div>
          </div>
          
          <div className="high-score-display">
            <div className="score-label">Best Score</div>
            <div className="score-value">{highScore}</div>
          </div>
        </div>

        {score > highScore && (
          <div className="new-record">
            🎉 NEW HIGH SCORE! 🎉
          </div>
        )}

        <div className="motivational-message">
          <div className="message-icon">🤖</div>
          <div className="message-text">{motivationalMessage}</div>
        </div>

        <div className="game-stats">
          <h3>📊 Performance Analytics:</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{score}</div>
              <div className="stat-label">Pipes Passed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Math.floor(score / 10) + 1}</div>
              <div className="stat-label">Difficulty Level</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{score > 0 ? Math.floor(100 * score / (score + 1)) : 0}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        <button className="restart-button" onClick={onRestartGame}>
          <span className="button-text">🔄 PLAY AGAIN</span>
          <div className="button-subtitle">Ready for another flight?</div>
        </button>

        <div className="improvement-tips">
          <h4>🎯 Next Level Tips:</h4>
          <p>• Focus on consistent tapping rhythm</p>
          <p>• Aim for the center of pipe gaps</p>
          <p>• Use power-ups strategically</p>
          <p>• Practice in debug mode first</p>
        </div>
      </div>
    </div>
  ),

  GameHUD: ({ score, highScore, activePowerUps, powerUpTypes, weather, timeOfDay, isDarkMode }) => (
    <div className="game-hud">
      <div className="hud-top">
        <div className="score-container">
          <div className="current-score">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="best-score">
            <span className="score-label">Best</span>
            <span className="score-value">{highScore}</span>
          </div>
        </div>

        <div className="environment-indicators">
          <div className="weather-indicator">
            {weather === 'rain' ? '🌧️' : weather === 'snow' ? '❄️' : '☀️'}
          </div>
          <div className="time-indicator">
            {timeOfDay === 'day' ? '🌅' : '🌙'}
          </div>
        </div>
      </div>

      <div className="power-up-indicators">
        {activePowerUps.map((powerUp, index) => {
          const powerUpType = powerUpTypes.find(p => p.type === powerUp.type);
          const remainingTime = Math.max(0, powerUp.duration - (Date.now() - powerUp.startTime));
          const progress = remainingTime / powerUp.duration;
          
          return (
            <div key={index} className="power-up-indicator">
              <div className="power-up-icon">
                {powerUp.type === 'shield' ? '🛡️' : powerUp.type === 'slowMotion' ? '⏰' : '🚀'}
              </div>
              <div className="power-up-timer">
                <div 
                  className="timer-bar" 
                  style={{ 
                    width: `${progress * 100}%`,
                    backgroundColor: powerUpType?.color || '#fff'
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="game-controls-hint">
        <span>Click or SPACE to flap</span>
      </div>
    </div>
  ),

  DebugPanel: ({ gameStats, aiDifficulty, weather, timeOfDay }) => (
    <div className="debug-panel">
      <h3>🔧 Debug Information</h3>
      <div className="debug-stats">
        <div>FPS: {gameStats.fps}</div>
        <div>Jumps: {gameStats.jumps}</div>
        <div>Hits: {gameStats.hits}</div>
        <div>AI Difficulty: {aiDifficulty}</div>
        <div>Weather: {weather}</div>
        <div>Time: {timeOfDay}</div>
      </div>
    </div>
  )
};