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

/**
 * GET /api/analytics/insights — Auto-generated narrative insights
 *
 * LOCKED RESPONSE CONTRACT:
 * {
 *   insights: InsightItem[],     // always present, may be empty array
 *   generatedAt: string          // always present, ISO 8601 timestamp
 * }
 *
 * InsightItem:
 * {
 *   type: string,                // always present — enum: 'topRiskDistrict' | 'topGrowingIssue' | 'peakNegativeHour' | 'lowConfidenceCount'
 *   icon: string,                // always present — emoji string
 *   text: string,                // always present — human-readable narrative in Vietnamese
 *   confidence: string,          // always present — enum: 'high' | 'medium' | 'low'
 *   data: object | null,         // always present — structured data backing the insight, null if insufficient data
 *   insufficientData?: boolean   // optional — true when sample size too small for reliable insight
 * }
 *
 * Sample-size thresholds:
 *   - District insight: min 10 reviews, confidence 'high' at 50+, 'medium' at 20+
 *   - Issue growth: baseline ≥5 last week, confidence 'high' at 20+
 *   - Peak hours: min 10 reviews/hour, confidence 'high' at 50+
 *   - Low confidence count: always 'high' (exact count)
 */
router.get('/insights', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const MIN_DISTRICT_REVIEWS = 10;  // minimum sample for district insight
        const MIN_KEYWORD_BASELINE = 5;   // minimum count for keyword growth

        const insights = [];

        // ── 1) Top Risk District ──
        const districtStats = await collection.aggregate([
            { $match: { district: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$district',
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                }
            },
            { $match: { total: { $gte: MIN_DISTRICT_REVIEWS } } },
            { $addFields: { negRate: { $multiply: [{ $divide: ['$negative', '$total'] }, 100] } } },
            { $sort: { negRate: -1 } },
            { $limit: 1 },
        ]).toArray();

        if (districtStats.length > 0) {
            const d = districtStats[0];
            insights.push({
                type: 'topRiskDistrict',
                icon: '🔴',
                text: `Quận rủi ro cao nhất: ${d._id} (${Math.round(d.negRate)}% tiêu cực, ${d.total} đánh giá)`,
                confidence: d.total >= 50 ? 'high' : d.total >= 20 ? 'medium' : 'low',
                data: { district: d._id, negativeRate: Math.round(d.negRate * 100) / 100, total: d.total },
            });
        }

        // ── 2) Top Growing Issue (this week vs last week) ──
        const now = new Date();
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
        const thisWeekStr = oneWeekAgo.toISOString();
        const lastWeekStr = twoWeeksAgo.toISOString();
        const nowStr = now.toISOString();

        const ISSUE_GROUPS = {
            'Chờ lâu': ['đợi', 'chờ', 'lâu', 'chậm', 'wait', 'slow'],
            'Nhân viên': ['nhân viên', 'phục vụ', 'thái độ', 'staff'],
            'Chất lượng': ['dở', 'tệ', 'chất lượng', 'nhạt', 'không ngon'],
            'Không gian': ['không gian', 'chỗ ngồi', 'chật', 'ồn'],
            'Vệ sinh': ['bẩn', 'vệ sinh', 'sạch', 'ruồi', 'kiến'],
            'Giá cả': ['giá', 'đắt', 'mắc', 'expensive'],
        };

        // Count keywords this week vs last week
        const [thisWeekReviews, lastWeekReviews] = await Promise.all([
            collection.find({
                label: 0, publishedAtDate: { $gte: thisWeekStr },
                text: { $ne: 'Không có bình luận', $exists: true },
            }).project({ text: 1 }).toArray(),
            collection.find({
                label: 0, publishedAtDate: { $gte: lastWeekStr, $lt: thisWeekStr },
                text: { $ne: 'Không có bình luận', $exists: true },
            }).project({ text: 1 }).toArray(),
        ]);

        function countKeywords(reviews) {
            const counts = {};
            for (const cat of Object.keys(ISSUE_GROUPS)) counts[cat] = 0;
            for (const r of reviews) {
                const text = (r.text || '').toLowerCase();
                for (const [cat, patterns] of Object.entries(ISSUE_GROUPS)) {
                    if (patterns.some(p => text.includes(p))) counts[cat]++;
                }
            }
            return counts;
        }

        const thisWeekCounts = countKeywords(thisWeekReviews);
        const lastWeekCounts = countKeywords(lastWeekReviews);

        let topGrowth = null;
        let maxGrowthRate = 0;
        for (const cat of Object.keys(ISSUE_GROUPS)) {
            const prev = lastWeekCounts[cat] || 0;
            const curr = thisWeekCounts[cat] || 0;
            if (prev >= MIN_KEYWORD_BASELINE && curr > prev) {
                const growthRate = Math.round((curr - prev) / prev * 100);
                if (growthRate > maxGrowthRate) {
                    maxGrowthRate = growthRate;
                    topGrowth = { category: cat, thisWeek: curr, lastWeek: prev, growthRate };
                }
            }
        }

        if (topGrowth) {
            insights.push({
                type: 'topGrowingIssue',
                icon: '📈',
                text: `Vấn đề tăng mạnh nhất: "${topGrowth.category}" (+${topGrowth.growthRate}% so tuần trước)`,
                confidence: topGrowth.lastWeek >= 20 ? 'high' : 'medium',
                data: topGrowth,
            });
        } else {
            insights.push({
                type: 'topGrowingIssue',
                icon: '📊',
                text: 'Chưa phát hiện vấn đề nào tăng đột biến tuần này',
                confidence: thisWeekReviews.length >= 10 ? 'medium' : 'low',
                insufficientData: thisWeekReviews.length < 10,
                data: null,
            });
        }

        // ── 3) Peak Negative Hours ──
        const hourStats = await collection.aggregate([
            {
                $group: {
                    _id: '$hour',
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                }
            },
            { $match: { total: { $gte: 10 } } },
            { $addFields: { negRate: { $multiply: [{ $divide: ['$negative', '$total'] }, 100] } } },
            { $sort: { negRate: -1 } },
            { $limit: 3 },
        ]).toArray();

        if (hourStats.length > 0) {
            const peak = hourStats[0];
            const peakHours = hourStats.map(h => `${h._id}h`).join(', ');
            insights.push({
                type: 'peakNegativeHour',
                icon: '⏰',
                text: `Khung giờ tiêu cực cao nhất: ${peakHours} (${Math.round(peak.negRate)}% tiêu cực)`,
                confidence: peak.total >= 50 ? 'high' : 'medium',
                data: hourStats.map(h => ({
                    hour: h._id,
                    negativeRate: Math.round(h.negRate * 100) / 100,
                    total: h.total,
                })),
            });
        }

        // ── 4) Low-confidence Review Count ──
        const lowConfCount = await collection.countDocuments({
            analyzedAt: { $exists: true },
            confidenceAvg: { $lt: 0.7 },
        });
        const totalAnalyzed = await collection.countDocuments({
            analyzedAt: { $exists: true },
        });

        if (totalAnalyzed > 0) {
            insights.push({
                type: 'lowConfidenceCount',
                icon: '⚠️',
                text: lowConfCount > 0
                    ? `${lowConfCount} review có độ tin cậy thấp (<70%) — cần kiểm tra thủ công`
                    : 'Tất cả review đã phân tích đều có độ tin cậy cao (≥70%)',
                confidence: 'high',
                data: { lowConfCount, totalAnalyzed, rate: Math.round(lowConfCount / totalAnalyzed * 10000) / 100 },
            });
        }

        res.json({ insights, generatedAt: new Date().toISOString() });
    } catch (err) {
        errorResponse(res, 500, 'ERR_INSIGHTS', err.message);
    }
});

module.exports = router;
