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

        // alertCount = exactly priority-1 reviews (locked definition)
        // Priority-1: label=0, has text content, isLongText AND (isPeakHour OR isWeekend)
        const PEAK_HOURS = [7, 8, 9, 18, 19, 20, 21];
        const alertCount = await collection.countDocuments({
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
            text_length_group: { $in: ['Long', 'Very long'] },
            $or: [
                { hour: { $in: PEAK_HOURS } },
                { is_weekend: 1 },
            ],
        });

        // totalQueuedReviews = all negative reviews with text (full queue size)
        const totalQueuedReviews = await collection.countDocuments({
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
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
            alertCount,              // priority-1 only
            totalQueuedReviews,      // all negative reviews in queue
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

// GET /api/analytics/district-heatmap — Negative rate by district
// District name standardization mapping
const DISTRICT_MAP = {
    'Go Vap': null,                    // HCM district, not Hanoi → merge into Khác
    'Hanoi City': null,                // ambiguous → Khác
    'Hanoi': null,                     // ambiguous → Khác
    'Hai Bà Trưng District': 'Hai Bà Trưng',
};
const MIN_REVIEWS_THRESHOLD = 20; // below this, flag as low-sample

router.get('/district-heatmap', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const rawDistricts = await collection.aggregate([
            { $match: { district: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$district',
                    totalReviews: { $sum: 1 },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    avgStars: { $avg: '$stars' },
                    respondedCount: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
                }
            },
        ]).toArray();

        // Standardize district names and merge duplicates
        const merged = {};
        for (const d of rawDistricts) {
            let name = d._id;
            if (name in DISTRICT_MAP) {
                name = DISTRICT_MAP[name] || 'Khác';
            }
            if (!merged[name]) {
                merged[name] = { totalReviews: 0, negativeCount: 0, starSum: 0, respondedCount: 0 };
            }
            merged[name].totalReviews += d.totalReviews;
            merged[name].negativeCount += d.negativeCount;
            merged[name].starSum += d.avgStars * d.totalReviews; // weighted sum
            merged[name].respondedCount += d.respondedCount;
        }

        const result = Object.entries(merged).map(([district, d]) => {
            const negativeRate = d.totalReviews > 0
                ? Math.round(d.negativeCount / d.totalReviews * 10000) / 100 : 0;
            const avgStars = d.totalReviews > 0
                ? Math.round((d.starSum / d.totalReviews) * 100) / 100 : 0;
            const healthScore = d.totalReviews > 0
                ? Math.round(
                    avgStars * (1 - d.negativeCount / d.totalReviews)
                    * (1 + d.respondedCount / d.totalReviews) * 100
                ) / 100 : 0;
            // Risk Score = negativeRate × log2(totalReviews + 1) — weighs both severity and volume
            const riskScore = Math.round(
                negativeRate * Math.log2(d.totalReviews + 1) * 100
            ) / 100;
            return {
                district,
                totalReviews: d.totalReviews,
                negativeCount: d.negativeCount,
                negativeRate,
                avgStars,
                healthScore,
                riskScore,
                lowSample: d.totalReviews < MIN_REVIEWS_THRESHOLD,
            };
        }).sort((a, b) => b.riskScore - a.riskScore);

        res.json(result);
    } catch (err) {
        errorResponse(res, 500, 'ERR_DISTRICT', err.message);
    }
});

// GET /api/analytics/keywords — Top keywords from negative reviews
// Rule-based extraction using Vietnamese keyword categories
router.get('/keywords', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');

        // Get all negative reviews with text
        const negativeReviews = await collection
            .find({
                label: 0,
                text: { $ne: 'Không có bình luận', $exists: true },
            })
            .project({ text: 1 })
            .toArray();

        // Vietnamese keyword categories
        const KEYWORD_GROUPS = {
            'Nhân viên': ['nhân viên', 'nhan vien', 'phục vụ', 'phuc vu', 'thái độ', 'thai do', 'staff', 'nhân viên bảo vệ'],
            'Chờ lâu': ['đợi', 'doi', 'chờ', 'cho', 'lâu', 'lau', 'chậm', 'cham', 'wait', 'slow'],
            'Chất lượng': ['dở', 'do', 'tệ', 'te', 'chất lượng', 'chat luong', 'nhạt', 'nhat', 'dở tệ', 'không ngon', 'ko ngon'],
            'Bảo vệ': ['bảo vệ', 'bao ve', 'gác xe', 'gac xe', 'giữ xe', 'giu xe', 'parking'],
            'Không gian': ['không gian', 'khong gian', 'chỗ ngồi', 'cho ngoi', 'chật', 'chat', 'ồn', 'on', 'bàn', 'ghế'],
            'Vệ sinh': ['bẩn', 'ban', 'vệ sinh', 've sinh', 'sạch', 'sach', 'ruồi', 'kiến', 'kien', 'gián'],
            'Giá cả': ['giá', 'gia', 'đắt', 'dat', 'mắc', 'mac', 'price', 'expensive'],
            'Order sai': ['order sai', 'sai', 'nhầm', 'nham', 'thiếu', 'thieu', 'wrong', 'missing'],
            'Đồ uống': ['nước', 'nuoc', 'trà', 'tra', 'cà phê', 'ca phe', 'coffee', 'trà sữa', 'tra sua', 'đá', 'da'],
        };

        const keywordCounts = {};
        for (const [category, patterns] of Object.entries(KEYWORD_GROUPS)) {
            keywordCounts[category] = { count: 0, category };
        }

        for (const review of negativeReviews) {
            const text = (review.text || '').toLowerCase();
            for (const [category, patterns] of Object.entries(KEYWORD_GROUPS)) {
                for (const pattern of patterns) {
                    if (text.includes(pattern)) {
                        keywordCounts[category].count++;
                        break; // count each category only once per review
                    }
                }
            }
        }

        const result = Object.entries(keywordCounts)
            .map(([keyword, data]) => ({ keyword, count: data.count, category: data.category }))
            .filter(k => k.count > 0)
            .sort((a, b) => b.count - a.count);

        res.json({
            data: result,
            totalNegativeReviews: negativeReviews.length,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_KEYWORDS', err.message);
    }
});

module.exports = router;
