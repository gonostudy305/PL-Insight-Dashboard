/**
 * /api/analytics — Analytics and KPI endpoints
 */
const { Router } = require('express');
const router = Router();

// GET /api/analytics/overview — System-wide KPIs
router.get('/overview', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');

        const [stats] = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    total_reviews: { $sum: 1 },
                    avg_stars: { $avg: '$stars' },
                    positive_count: { $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] } },
                    negative_count: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    responded_count: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
                }
            }
        ]).toArray();

        if (!stats) return res.json({});

        const sentiment_score = stats.positive_count / stats.total_reviews;
        const negative_rate = stats.negative_count / stats.total_reviews;
        const response_rate = stats.responded_count / stats.total_reviews;
        const health_score = stats.avg_stars * (1 - negative_rate) * (1 + response_rate);

        res.json({
            total_reviews: stats.total_reviews,
            avg_stars: Math.round(stats.avg_stars * 100) / 100,
            sentiment_score: Math.round(sentiment_score * 10000) / 100,
            negative_rate: Math.round(negative_rate * 10000) / 100,
            response_rate: Math.round(response_rate * 10000) / 100,
            health_score: Math.round(health_score * 100) / 100,
            positive_count: stats.positive_count,
            negative_count: stats.negative_count,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/trends — Monthly negative rate trends
router.get('/trends', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const trends = await collection.aggregate([
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    avg_stars: { $avg: '$stars' },
                }
            },
            {
                $addFields: {
                    negative_rate: {
                        $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$negative', '$total'] }]
                    },
                    period: {
                        $concat: [
                            { $toString: '$_id.year' }, '-',
                            { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] }
                        ]
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]).toArray();

        res.json(trends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/heatmap — Negative rate by hour × day_of_week
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
            {
                $addFields: {
                    negative_rate: {
                        $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$negative', '$total'] }]
                    }
                }
            },
            { $sort: { '_id.day': 1, '_id.hour': 1 } },
        ]).toArray();

        res.json(heatmap.map(h => ({
            hour: h._id.hour,
            day_of_week: h._id.day,
            total: h.total,
            negative: h.negative,
            negative_rate: Math.round(h.negative_rate * 10000) / 100,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
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
                    avg_stars: { $avg: '$stars' },
                }
            },
            { $sort: { _id: 1 } },
        ]).toArray();

        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
