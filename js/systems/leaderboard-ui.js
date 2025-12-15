// Leaderboard UI - handles leaderboard display and score submission
// Extracted from game.js for better organization

const LeaderboardUI = {
    // State
    currentLeaderboardTab: 'local',
    currentMenuLeaderboardTab: 'local',
    highlightedName: null,
    
    /**
     * Open leaderboard from menu
     * @param {Game} game - Game instance (for context)
     */
    async openMenuLeaderboard(game) {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('menu-leaderboard').classList.remove('hidden');
        await this.showMenuLeaderboard('local');
    },
    
    /**
     * Close menu leaderboard
     */
    closeMenuLeaderboard() {
        document.getElementById('menu-leaderboard').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    },
    
    /**
     * Show menu leaderboard with specific tab
     * @param {string} tab - 'local' or 'global'
     */
    async showMenuLeaderboard(tab = 'local') {
        const listEl = document.getElementById('menu-leaderboard-list');
        
        // Pokaż loading dla globalnych wyników
        if (tab === 'global') {
            listEl.innerHTML = '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
        }
        
        // Update tab buttons
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        const scores = await leaderboard.getScores(tab);
        listEl.innerHTML = leaderboard.renderLeaderboard(scores);
        
        this.currentMenuLeaderboardTab = tab;
    },
    
    /**
     * Switch menu leaderboard tab
     * @param {string} tab - 'local' or 'global'
     */
    switchMenuLeaderboardTab(tab) {
        this.showMenuLeaderboard(tab);
    },
    
    /**
     * Submit score to leaderboard
     * @param {Game} game - Game instance
     */
    async submitScore(game) {
        const nameInput = document.getElementById('player-name');
        const submitBtn = document.getElementById('submit-score-btn');
        const name = nameInput.value.trim();
        
        if (!name) {
            nameInput.focus();
            nameInput.style.borderColor = '#e94560';
            setTimeout(() => nameInput.style.borderColor = '', 500);
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Zapisywanie...';
        
        try {
            await leaderboard.submitScore(
                name, 
                game.waveManager.waveNumber, 
                game.xp, 
                game.selectedCharacter
            );
            
            // Hide submit form, show leaderboard
            document.getElementById('score-submit').style.display = 'none';
            this.showLeaderboard('local', name);
            
            // Save name for next time
            localStorage.setItem('circle_survivor_player_name', name);
        } catch (e) {
            console.error('Error submitting score:', e);
            submitBtn.textContent = '❌ Błąd - spróbuj ponownie';
            submitBtn.disabled = false;
        }
    },
    
    /**
     * Show leaderboard with specific tab
     * @param {string} tab - 'local' or 'global'
     * @param {string|null} highlightName - Name to highlight
     */
    async showLeaderboard(tab = 'local', highlightName = null) {
        const listEl = document.getElementById('leaderboard-list');
        
        // Pokaż loading dla globalnych wyników
        if (tab === 'global') {
            listEl.innerHTML = '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
        }
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        const scores = await leaderboard.getScores(tab);
        listEl.innerHTML = leaderboard.renderLeaderboard(scores, highlightName);
        
        this.currentLeaderboardTab = tab;
        this.highlightedName = highlightName;
    },
    
    /**
     * Switch leaderboard tab
     * @param {string} tab - 'local' or 'global'
     */
    switchLeaderboardTab(tab) {
        this.showLeaderboard(tab, this.highlightedName);
    }
};
