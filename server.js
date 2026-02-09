const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from JSON files
function loadData(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error(`Error loading ${filePath}:`, err);
    }
    return defaultValue;
}

// Save data to JSON file
function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error(`Error saving ${filePath}:`, err);
    }
}

// Initialize data
let users = loadData(USERS_FILE, []);
let games = loadData(GAMES_FILE, []);
let achievements = loadData(ACHIEVEMENTS_FILE, []);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'glyphica-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Auth middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    next();
}

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Требуется имя пользователя и пароль' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Имя пользователя должно быть от 3 до 20 символов' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 4 символа' });
        }

        // Check if user exists
        const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'Это имя уже занято' });
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            username: username,
            password_hash: passwordHash,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        saveData(USERS_FILE, users);

        // Log in the new user
        req.session.userId = newUser.id;

        res.json({
            success: true,
            user: { id: newUser.id, username: newUser.username }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Требуется имя пользователя и пароль' });
        }

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        req.session.userId = user.id;

        res.json({
            success: true,
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }

    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
        return res.json({ loggedIn: false });
    }

    res.json({
        loggedIn: true,
        user: { id: user.id, username: user.username }
    });
});

// ========== STATS ROUTES ==========

// Save game result
app.post('/api/stats/game', requireAuth, (req, res) => {
    try {
        const { score, wave, accuracy, wpm, mode, kills } = req.body;

        const game = {
            id: Date.now(),
            user_id: req.session.userId,
            score: score || 0,
            wave: wave || 1,
            accuracy: accuracy || 0,
            wpm: wpm || 0,
            mode: mode || 'classic',
            kills: kills || 0,
            played_at: new Date().toISOString()
        };

        games.push(game);
        saveData(GAMES_FILE, games);

        res.json({ success: true, gameId: game.id });

    } catch (err) {
        console.error('Save game error:', err);
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// Get user profile statistics
app.get('/api/stats/profile', requireAuth, (req, res) => {
    try {
        const userId = req.session.userId;
        const userGames = games.filter(g => g.user_id === userId);
        const userAchievements = achievements.filter(a => a.user_id === userId);

        // Calculate stats
        const totalGames = userGames.length;

        if (totalGames === 0) {
            return res.json({
                stats: { totalGames: 0, bestScore: 0, bestWave: 0, avgWpm: 0, avgAccuracy: 0, totalKills: 0 },
                recentGames: [],
                achievements: []
            });
        }

        const bestScore = Math.max(...userGames.map(g => g.score));
        const bestWave = Math.max(...userGames.map(g => g.wave));
        const avgWpm = userGames.reduce((sum, g) => sum + g.wpm, 0) / totalGames;
        const avgAccuracy = userGames.reduce((sum, g) => sum + g.accuracy, 0) / totalGames;
        const totalKills = userGames.reduce((sum, g) => sum + g.kills, 0);

        // Recent 10 games
        const recentGames = userGames
            .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
            .slice(0, 10);

        res.json({
            stats: { totalGames, bestScore, bestWave, avgWpm, avgAccuracy, totalKills },
            recentGames,
            achievements: userAchievements
        });

    } catch (err) {
        console.error('Profile stats error:', err);
        res.status(500).json({ error: 'Ошибка загрузки' });
    }
});

// Get leaderboard
app.get('/api/stats/leaderboard', (req, res) => {
    try {
        const mode = req.query.mode || 'classic';

        // Get best score per user for this mode
        const modeGames = games.filter(g => g.mode === mode);

        // Group by user and get max score
        const userBestGames = {};
        modeGames.forEach(game => {
            if (!userBestGames[game.user_id] || game.score > userBestGames[game.user_id].score) {
                userBestGames[game.user_id] = game;
            }
        });

        // Convert to array and add username
        const leaderboard = Object.values(userBestGames)
            .map(game => {
                const user = users.find(u => u.id === game.user_id);
                return {
                    username: user ? user.username : 'Unknown',
                    score: game.score,
                    wave: game.wave,
                    wpm: game.wpm,
                    accuracy: game.accuracy
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);

        res.json(leaderboard);

    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Ошибка загрузки' });
    }
});

// Save achievement
app.post('/api/stats/achievement', requireAuth, (req, res) => {
    try {
        const { achievementId } = req.body;
        const userId = req.session.userId;

        // Check if already unlocked
        const existing = achievements.find(a =>
            a.user_id === userId && a.achievement_id === achievementId
        );

        if (existing) {
            return res.json({ success: true, alreadyUnlocked: true });
        }

        achievements.push({
            id: Date.now(),
            user_id: userId,
            achievement_id: achievementId,
            unlocked_at: new Date().toISOString()
        });

        saveData(ACHIEVEMENTS_FILE, achievements);

        res.json({ success: true });

    } catch (err) {
        console.error('Achievement error:', err);
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// ========== PAGE ROUTES ==========

// HTML pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/leaderboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🎮 Glyphica Typing Survival Server Running     ║
    ║                                                   ║
    ║   Local:   http://localhost:${PORT}                ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `);
});
