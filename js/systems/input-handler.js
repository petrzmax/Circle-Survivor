// Input Handler - keyboard and UI button bindings
// Centralizes all input event listeners

const InputHandler = {
    /**
     * Setup all event listeners for the game
     * @param {Game} game - Game instance
     */
    setup(game) {
        this.setupKeyboard(game);
        this.setupCharacterSelection(game);
        this.setupButtons(game);
        this.setupLeaderboard(game);
    },
    
    /**
     * Setup keyboard listeners
     * @param {Game} game - Game instance
     */
    setupKeyboard(game) {
        window.addEventListener('keydown', (e) => {
            game.keys[e.key.toLowerCase()] = true;
            
            // Pause toggle
            if (e.key === 'Escape') {
                if (game.state === 'playing') {
                    game.pauseGame();
                } else if (game.state === 'paused') {
                    game.resumeGame();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            game.keys[e.key.toLowerCase()] = false;
        });
    },
    
    /**
     * Setup character selection cards
     * @param {Game} game - Game instance
     */
    setupCharacterSelection(game) {
        document.querySelectorAll('.character-card').forEach(card => {
            card.onclick = () => game.selectCharacter(card.dataset.character);
        });
    },
    
    /**
     * Setup UI buttons
     * @param {Game} game - Game instance
     */
    setupButtons(game) {
        document.getElementById('restart-btn').onclick = () => game.showCharacterSelect();
        document.getElementById('start-wave-btn').onclick = () => game.startNextWave();
        document.getElementById('resume-btn').onclick = () => game.resumeGame();
        document.getElementById('quit-btn').onclick = () => game.quitToMenu();
        document.getElementById('sound-toggle').onclick = () => game.toggleSound();
    },
    
    /**
     * Setup leaderboard interactions
     * @param {Game} game - Game instance
     */
    setupLeaderboard(game) {
        // Score submission
        document.getElementById('submit-score-btn').onclick = () => game.submitScore();
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') game.submitScore();
        });
        
        // Leaderboard tabs (game over screen)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => game.switchLeaderboardTab(btn.dataset.tab);
        });
        
        // Menu leaderboard
        document.getElementById('menu-leaderboard-btn').onclick = () => game.openMenuLeaderboard();
        document.getElementById('menu-leaderboard-close').onclick = () => game.closeMenuLeaderboard();
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.onclick = () => game.switchMenuLeaderboardTab(btn.dataset.tab);
        });
    }
};
