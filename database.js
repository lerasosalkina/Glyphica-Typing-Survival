const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'glyphica.db'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER DEFAULT 0,
        wave INTEGER DEFAULT 1,
        accuracy INTEGER DEFAULT 100,
        wpm INTEGER DEFAULT 0,
        mode TEXT DEFAULT 'classic',
        kills INTEGER DEFAULT 0,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, achievement_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);
    CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC);
    CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
`);

// ========== USER FUNCTIONS ==========

function createUser(username, password) {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const result = stmt.run(username, hash);
    return { id: result.lastInsertRowid, username };
}

function verifyUser(username, password) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (user && bcrypt.compareSync(password, user.password_hash)) {
        return { id: user.id, username: user.username };
    }
    return null;
}

function getUserByUsername(username) {
    const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE username = ?');
    return stmt.get(username);
}

// ========== GAME FUNCTIONS ==========

function saveGame(userId, gameData) {
    const stmt = db.prepare(`
        INSERT INTO games (user_id, score, wave, accuracy, wpm, mode, kills)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
        userId,
        gameData.score || 0,
        gameData.wave || 1,
        gameData.accuracy || 100,
        gameData.wpm || 0,
        gameData.mode || 'classic',
        gameData.kills || 0
    );
    return { id: result.lastInsertRowid, ...gameData };
}

function getUserStats(userId) {
    const stmt = db.prepare(`
        SELECT 
            COUNT(*) as totalGames,
            MAX(score) as bestScore,
            MAX(wave) as bestWave,
            ROUND(AVG(accuracy), 1) as avgAccuracy,
            ROUND(AVG(wpm), 1) as avgWpm,
            SUM(kills) as totalKills,
            SUM(score) as totalScore
        FROM games WHERE user_id = ?
    `);
    return stmt.get(userId);
}

function getRecentGames(userId, limit = 10) {
    const stmt = db.prepare(`
        SELECT id, score, wave, accuracy, wpm, mode, kills, played_at
        FROM games WHERE user_id = ?
        ORDER BY played_at DESC LIMIT ?
    `);
    return stmt.all(userId, limit);
}

function getLeaderboard(mode = 'classic', limit = 20) {
    const stmt = db.prepare(`
        SELECT 
            u.username,
            g.score,
            g.wave,
            g.accuracy,
            g.wpm,
            g.played_at
        FROM games g
        JOIN users u ON g.user_id = u.id
        WHERE g.mode = ?
        ORDER BY g.score DESC
        LIMIT ?
    `);
    return stmt.all(mode, limit);
}

// ========== ACHIEVEMENT FUNCTIONS ==========

function unlockAchievement(userId, achievementId) {
    const stmt = db.prepare(`
        INSERT INTO achievements (user_id, achievement_id)
        VALUES (?, ?)
    `);
    return stmt.run(userId, achievementId);
}

function getUserAchievements(userId) {
    const stmt = db.prepare(`
        SELECT achievement_id, unlocked_at
        FROM achievements WHERE user_id = ?
    `);
    return stmt.all(userId);
}

module.exports = {
    createUser,
    verifyUser,
    getUserByUsername,
    saveGame,
    getUserStats,
    getRecentGames,
    getLeaderboard,
    unlockAchievement,
    getUserAchievements
};
