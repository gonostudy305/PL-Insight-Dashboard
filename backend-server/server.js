/**
 * PL-Insight Dashboard — Node.js Backend Server
 * REST API for MongoDB queries, analytics, and AI proxy.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ──
let db;
const client = new MongoClient(process.env.MONGO_URI);

async function connectDB() {
  try {
    await client.connect();
    db = client.db('PhucLong_Hanoi');
    console.log('✅ Connected to MongoDB Atlas — PhucLong_Hanoi');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// ── Routes ──

// Import route modules
const authRouter = require('./routes/auth');
const reviewsRouter = require('./routes/reviews');
const branchesRouter = require('./routes/branches');
const analyticsRouter = require('./routes/analytics');
const alertsRouter = require('./routes/alerts');
const liveMonitorRouter = require('./routes/live-monitor');
const authMiddleware = require('./middleware/auth-middleware');

// Pass db to routes via app.locals
app.use((req, res, next) => {
  req.db = db;
  req.AI_SERVER_URL = AI_SERVER_URL;
  next();
});

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'disconnected',
    ai_server: AI_SERVER_URL,
  });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protected routes — require JWT
app.use('/api/reviews', authMiddleware, reviewsRouter);
app.use('/api/branches', authMiddleware, branchesRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);
app.use('/api/alerts', authMiddleware, alertsRouter);
app.use('/api/live-monitor', authMiddleware, liveMonitorRouter);

// ── Start ──
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 PL-Insight Backend running on http://localhost:${PORT}`);
  });
});
