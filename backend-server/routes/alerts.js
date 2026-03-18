/**
 * /api/alerts — Smart Alert System
 * 
 * Endpoints:
 *   GET  /              — Prioritized negative review queue (existing)
 *   GET  /history       — Alert history from alert_history collection
 *   POST /scan          — Run trigger engine to create new alerts
 *   PATCH /:alertId/status — Update alert status (new → acknowledged → resolved)
 * 
 * alertCount in overview = priority-1 only (unchanged)
 * alert_history = separate collection (never in review documents)
 */
const { Router } = require('express');
const { runTriggerScan, sendNotification } = require('../services/alert-engine');
const router = Router();

// Peak hours from EDA analysis (Chapter 3.2.5)
const PEAK_HOURS = [7, 8, 9, 18, 19, 20, 21];

function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

// GET /api/alerts — Prioritized negative review queue (existing logic unchanged)
router.get('/', async (req, res) => {
    try {
        const { limit = 50, priority } = req.query;
        const collection = req.db.collection('Master_Final_Analysis');

        const filter = {
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
        };

        const allReviews = await collection
            .find(filter)
            .sort({ publishedAtDate: -1 })
            .toArray();

        const alerts = allReviews.map(review => {
            const isPeakHour = PEAK_HOURS.includes(review.hour);
            const isLongText = ['Long', 'Very long'].includes(review.text_length_group);
            const isWeekend = review.is_weekend === 1;

            let priorityLevel, priorityLabel;

            if (isLongText && (isPeakHour || isWeekend)) {
                priorityLevel = 1;
                priorityLabel = 'High';
            } else if (isLongText || isPeakHour) {
                priorityLevel = 2;
                priorityLabel = 'Standard';
            } else {
                priorityLevel = 3;
                priorityLabel = 'Monitoring';
            }

            return {
                reviewId: review.reviewId || String(review._id),
                text: review.text,
                stars: review.stars,
                branchAddress: review.branch_address,
                placeId: review.placeId,
                district: review.district,
                publishedAtDate: review.publishedAtDate,
                hour: review.hour,
                dayOfWeek: review.day_of_week,
                session: review.session,
                textLengthGroup: review.text_length_group,
                isWeekend: review.is_weekend,
                priorityLevel,
                priorityLabel,
                riskFactors: [
                    ...(isPeakHour ? ['Giờ cao điểm'] : []),
                    ...(isLongText ? ['Nội dung dài/chi tiết'] : []),
                    ...(isWeekend ? ['Cuối tuần'] : []),
                    ...(review.stars === 1 ? ['1 sao — Rất nghiêm trọng'] : []),
                ],
            };
        });

        let filtered = alerts;
        if (priority) {
            filtered = alerts.filter(a => a.priorityLevel === parseInt(priority));
        }

        filtered.sort((a, b) => {
            if (a.priorityLevel !== b.priorityLevel) return a.priorityLevel - b.priorityLevel;
            return new Date(b.publishedAtDate) - new Date(a.publishedAtDate);
        });

        const summary = {
            high: alerts.filter(a => a.priorityLevel === 1).length,
            standard: alerts.filter(a => a.priorityLevel === 2).length,
            monitoring: alerts.filter(a => a.priorityLevel === 3).length,
        };

        res.json({
            data: filtered.slice(0, parseInt(limit)),
            total: filtered.length,
            summary,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_ALERTS', err.message);
    }
});

// GET /api/alerts/history — Alert history (from alert_history collection)
router.get('/history', async (req, res) => {
    try {
        const { limit = 50, status: filterStatus } = req.query;
        const alertsCol = req.db.collection('alert_history');

        const filter = {};
        if (filterStatus) filter.status = filterStatus;

        const alerts = await alertsCol
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .toArray();

        const total = await alertsCol.countDocuments(filter);

        // Summary by status
        const statusCounts = {
            new: await alertsCol.countDocuments({ status: 'new' }),
            acknowledged: await alertsCol.countDocuments({ status: 'acknowledged' }),
            resolved: await alertsCol.countDocuments({ status: 'resolved' }),
        };

        res.json({
            data: alerts.map(a => ({
                alertId: a.alertId,
                placeId: a.placeId,
                branchAddress: a.branchAddress,
                district: a.district,
                triggerRule: a.triggerRule,
                triggerCount: a.triggerCount,
                reviewIds: a.reviewIds,
                status: a.status,
                createdAt: a.createdAt,
                acknowledgedAt: a.acknowledgedAt,
                resolvedAt: a.resolvedAt,
                notified: a.notified,
            })),
            total,
            statusCounts,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_ALERT_HISTORY', err.message);
    }
});

// POST /api/alerts/scan — Run trigger engine
router.post('/scan', async (req, res) => {
    try {
        const result = await runTriggerScan(req.db);

        // Send notifications for new alerts
        for (const alert of result.alerts) {
            try {
                const notif = await sendNotification(alert);
                if (notif.sent) {
                    await req.db.collection('alert_history').updateOne(
                        { alertId: alert.alertId },
                        { $set: { notified: true } }
                    );
                }
            } catch (e) {
                console.error(`[notify] Error for ${alert.alertId}: ${e.message}`);
            }
        }

        res.json(result);
    } catch (err) {
        errorResponse(res, 500, 'ERR_ALERT_SCAN', err.message);
    }
});

// PATCH /api/alerts/:alertId/status — Update alert status
router.patch('/:alertId/status', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { status } = req.body;

        const VALID_STATUSES = ['new', 'acknowledged', 'resolved'];
        if (!VALID_STATUSES.includes(status)) {
            return errorResponse(res, 400, 'ERR_INVALID_STATUS',
                `Status must be one of: ${VALID_STATUSES.join(', ')}`);
        }

        const alertsCol = req.db.collection('alert_history');
        const existing = await alertsCol.findOne({ alertId });

        if (!existing) {
            return errorResponse(res, 404, 'ERR_NOT_FOUND', `Alert ${alertId} not found`);
        }

        // Status transition validation
        const TRANSITIONS = {
            'new': ['acknowledged', 'resolved'],
            'acknowledged': ['resolved'],
            'resolved': [],
        };

        if (!TRANSITIONS[existing.status]?.includes(status)) {
            return errorResponse(res, 400, 'ERR_INVALID_TRANSITION',
                `Cannot transition from '${existing.status}' to '${status}'`);
        }

        const update = { status };
        if (status === 'acknowledged') update.acknowledgedAt = new Date();
        if (status === 'resolved') update.resolvedAt = new Date();

        await alertsCol.updateOne({ alertId }, { $set: update });

        res.json({
            alertId,
            previousStatus: existing.status,
            newStatus: status,
            ...update,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_STATUS_UPDATE', err.message);
    }
});

// GET /api/alerts/telegram-status — Check if Telegram is configured
router.get('/telegram-status', (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    res.json({
        configured: !!(token && chatId),
        chatId: chatId ? chatId.replace(/./g, (c, i) => i < 3 ? c : '*') : null,
    });
});

// POST /api/alerts/test-notify — Send a test alert to Telegram (E2E verification)
router.post('/test-notify', async (req, res) => {
    try {
        const testAlert = {
            alertId: `TEST-${Date.now()}`,
            branchAddress: 'Test Branch — Phúc Long Thái Hà',
            district: 'Đống Đa',
            triggerRule: '>3 negative reviews in 1h',
            triggerCount: 5,
            createdAt: new Date(),
        };
        const result = await sendNotification(testAlert);
        res.json({ success: result.sent, ...result });
    } catch (err) {
        errorResponse(res, 500, 'ERR_TEST_NOTIFY', err.message);
    }
});

module.exports = router;
