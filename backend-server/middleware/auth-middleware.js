/**
 * JWT Auth Middleware
 * Verifies Bearer token on protected routes.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pl-insight-secret-key-2026';

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập', code: 'NO_TOKEN' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Token không hợp lệ', code: 'INVALID_TOKEN' });
    }
}

module.exports = authMiddleware;
