/**
 * PL-Insight Dashboard — Node.js Backend Server
 * REST API for MongoDB queries, analytics, and AI proxy.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const { runTriggerScan, sendNotification } = require('./services/alert-engine');

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
const reportsRouter = require('./routes/reports');
const suggestionsRouter = require('./routes/suggestions');
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
app.use('/api/reports', authMiddleware, reportsRouter);
app.use('/api/suggestions', authMiddleware, suggestionsRouter);

// ── Start ──
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 PL-Insight Backend running on http://localhost:${PORT}`);
  });

  // ── Scheduled Trigger Scan ──
  const ENABLE_SCAN = process.env.ENABLE_SCHEDULED_SCAN !== 'false'; // default: enabled
  const SCAN_CRON = process.env.SCAN_CRON || '*/15 * * * *'; // default: every 15 min

  if (ENABLE_SCAN && cron.validate(SCAN_CRON)) {
    cron.schedule(SCAN_CRON, async () => {
      const timestamp = new Date().toISOString();
      console.log(`[cron] ${timestamp} — Running scheduled trigger scan...`);
      try {
        const result = await runTriggerScan(db);
        let notified = 0, failed = 0;

        for (const alert of result.alerts) {
          try {
            const notif = await sendNotification(alert);
            if (notif.sent) {
              await db.collection('alert_history').updateOne(
                { alertId: alert.alertId },
                { $set: { notified: true } }
              );
              notified++;
            } else {
              failed++;
            }
          } catch (e) {
            console.error(`[cron] Notify error for ${alert.alertId}: ${e.message}`);
            failed++;
          }
        }

        console.log(`[cron] ✅ created=${result.created} skipped=${result.skipped} notified=${notified} failed=${failed}`);
      } catch (err) {
        console.error(`[cron] ❌ Scan error: ${err.message}`);
      }
    });
    console.log(`⏰ Scheduled scan enabled: ${SCAN_CRON}`);
  } else {
    console.log(`⏸️ Scheduled scan disabled`);
  }
});
