/**
 * Auth Routes — JWT Login
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'pl-insight-secret-key-2026';
const JWT_EXPIRES = '24h';

// Default admin account (password hashed with bcryptjs)
const ADMIN_USER = {
    username: 'admin',
    passwordHash: '$2b$10$wlAmlLnl.o1mXYr31JOLaumPGmdUyg/tM5Slm8WokoaIuGsGXoRXW', // phuclong2026
    role: 'admin',
    displayName: 'Quản trị viên',
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username và password là bắt buộc' });
        }

        // Check username
        if (username !== ADMIN_USER.username) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Check password
        const valid = await bcrypt.compare(password, ADMIN_USER.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Generate JWT
        const token = jwt.sign(
            { username: ADMIN_USER.username, role: ADMIN_USER.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.json({
            token,
            user: {
                username: ADMIN_USER.username,
                role: ADMIN_USER.role,
                displayName: ADMIN_USER.displayName,
            },
        });
    } catch (err) {
        console.error('[auth] Login error:', err.message);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// GET /api/auth/me — Verify token and return user info
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            username: decoded.username,
            role: decoded.role,
            displayName: ADMIN_USER.displayName,
        });
    } catch (err) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
});

module.exports = router;
