// Script to inject secrets into leaderboard.js
// Used by GitHub Actions workflow

const fs = require('fs');

const binId = process.env.JSONBIN_BIN_ID || '';
const apiKey = process.env.JSONBIN_API_KEY || '';

let content = fs.readFileSync('js/leaderboard.js', 'utf8');

content = content.replace(
    'this.JSONBIN_BIN_ID = null;',
    `this.JSONBIN_BIN_ID = "${binId}";`
);

content = content.replace(
    'this.JSONBIN_API_KEY = null;',
    `this.JSONBIN_API_KEY = "${apiKey}";`
);

fs.writeFileSync('js/leaderboard.js', content);
