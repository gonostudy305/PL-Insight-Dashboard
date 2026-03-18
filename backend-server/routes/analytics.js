/**
 * /api/analytics — Analytics and KPI endpoints
 * All KPIs use `label` field (historical sentiment source — locked §1)
 * Timezone: Asia/Ho_Chi_Minh — uses pre-computed fields (locked §3)
 * JSON contract matches locked §4
 */
const { Router } = require('express');
const router = Router();

function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

// GET /api/analytics/overview — System-wide KPIs (locked contract §4)
router.get('/overview', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');

        const [stats] = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    avgStars: { $avg: '$stars' },
                    positiveCount: { $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] } },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    respondedCount: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
                }
            }
        ]).toArray();

        if (!stats) return res.json({});

        const sentimentScore = Math.round(stats.positiveCount / stats.totalReviews * 10000) / 100;
        const negativeRate = Math.round(stats.negativeCount / stats.totalReviews * 10000) / 100;
        const responseRate = Math.round(stats.respondedCount / stats.totalReviews * 10000) / 100;
        const healthScore = Math.round(
            stats.avgStars * (1 - stats.negativeCount / stats.totalReviews)
            * (1 + stats.respondedCount / stats.totalReviews) * 100
        ) / 100;

        // Count priority-1 alerts for alertCount
        const alertCount = await collection.countDocuments({
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
            text_length_group: { $in: ['Long', 'Very long'] },
            $or: [
                { hour: { $in: [7, 8, 9, 18, 19, 20, 21] } },
                { is_weekend: 1 },
            ],
        });

        res.json({
            totalReviews: stats.totalReviews,
            avgStars: Math.round(stats.avgStars * 100) / 100,
            sentimentScore,
            negativeRate,
            responseRate,
            healthScore,
            positiveCount: stats.positiveCount,
            negativeCount: stats.negativeCount,
            alertCount,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_OVERVIEW', err.message);
    }
});

// GET /api/analytics/distribution — Star distribution (1-5)
router.get('/distribution', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const distribution = await collection.aggregate([
            { $group: { _id: '$stars', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]).toArray();

        res.json(distribution.map(d => ({ stars: d._id, count: d.count })));
    } catch (err) {
        errorResponse(res, 500, 'ERR_DISTRIBUTION', err.message);
    }
});

// GET /api/analytics/trends — Monthly negative rate trends
// Uses pre-computed year/month fields (timezone locked §3)
router.get('/trends', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const trends = await collection.aggregate([
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    avgStars: { $avg: '$stars' },
                }
            },
            {
                $addFields: {
                    negativeRate: {
                        $round: [
                            { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$negative', '$total'] }, 100] }] },
                            2
                        ]
                    },
                    period: {
                        $concat: [
                            { $toString: '$_id.year' }, '-',
                            {
                                $cond: [
                                    { $lt: ['$_id.month', 10] },
                                    { $concat: ['0', { $toString: '$_id.month' }] },
                                    { $toString: '$_id.month' }
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]).toArray();

        res.json(trends.map(t => ({
            period: t.period,
            total: t.total,
            negative: t.negative,
            negativeRate: t.negativeRate,
            avgStars: Math.round(t.avgStars * 100) / 100,
        })));
    } catch (err) {
        errorResponse(res, 500, 'ERR_TRENDS', err.message);
    }
});

// GET /api/analytics/heatmap — Negative rate by hour × day_of_week
// Uses pre-computed hour/day_of_week fields (timezone locked §3)
router.get('/heatmap', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const heatmap = await collection.aggregate([
            {
                $group: {
                    _id: { hour: '$hour', day: '$day_of_week' },
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                }
            },
            { $sort: { '_id.day': 1, '_id.hour': 1 } },
        ]).toArray();

        res.json(heatmap.map(h => ({
            hour: h._id.hour,
            dayOfWeek: h._id.day,
            total: h.total,
            negative: h.negative,
            negativeRate: h.total > 0 ? Math.round(h.negative / h.total * 10000) / 100 : 0,
        })));
    } catch (err) {
        errorResponse(res, 500, 'ERR_HEATMAP', err.message);
    }
});

// GET /api/analytics/by-session — Review distribution by session
router.get('/by-session', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const sessions = await collection.aggregate([
            {
                $group: {
                    _id: '$session',
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    avgStars: { $avg: '$stars' },
                }
            },
            { $sort: { _id: 1 } },
        ]).toArray();

        res.json(sessions.map(s => ({
            session: s._id,
            total: s.total,
            negative: s.negative,
            avgStars: Math.round(s.avgStars * 100) / 100,
        })));
    } catch (err) {
        errorResponse(res, 500, 'ERR_SESSION', err.message);
    }
});

module.exports = router;
