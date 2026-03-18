/**
 * /api/branches — Branch data + KPI aggregation
 * Canonical branch ID: placeId (locked §5)
 * All aggregation groups by placeId, NOT by branch_address
 * Default sort: healthScore ascending (risk-first view)
 * JSON contract matches locked §4
 */
const { Router } = require('express');
const router = Router();

function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

// GET /api/branches — All branches with aggregated KPIs
router.get('/', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');

        const branches = await collection.aggregate([
            {
                $group: {
                    _id: '$placeId', // group by placeId, not branch_address
                    branchAddress: { $first: '$branch_address' }, // display only
                    district: { $first: '$district' },
                    avgStars: { $avg: '$stars' },
                    totalReviews: { $sum: 1 },
                    negativeCount: {
                        $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] }
                    },
                    positiveCount: {
                        $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] }
                    },
                    respondedCount: {
                        $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] }
                    },
                }
            },
            {
                $addFields: {
                    negativeRate: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] }, 0,
                            { $round: [{ $multiply: [{ $divide: ['$negativeCount', '$totalReviews'] }, 100] }, 2] }
                        ]
                    },
                    responseRate: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] }, 0,
                            { $round: [{ $multiply: [{ $divide: ['$respondedCount', '$totalReviews'] }, 100] }, 2] }
                        ]
                    },
                }
            },
            {
                $addFields: {
                    healthScore: {
                        $round: [
                            {
                                $multiply: [
                                    '$avgStars',
                                    { $subtract: [1, { $divide: ['$negativeCount', { $max: ['$totalReviews', 1] }] }] },
                                    { $add: [1, { $divide: ['$respondedCount', { $max: ['$totalReviews', 1] }] }] },
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            { $sort: { healthScore: 1 } }, // ascending = risk-first
        ]).toArray();

        // Map to locked contract shape
        const data = branches.map(b => ({
            placeId: b._id,
            branchAddress: b.branchAddress,
            district: b.district,
            avgStars: Math.round(b.avgStars * 100) / 100,
            totalReviews: b.totalReviews,
            negativeRate: b.negativeRate,
            responseRate: b.responseRate,
            healthScore: b.healthScore,
        }));

        res.json({ data, total: data.length });
    } catch (err) {
        errorResponse(res, 500, 'ERR_BRANCHES_LIST', err.message);
    }
});

// GET /api/branches/:placeId — Full branch detail (4 blocks + topIssues)
router.get('/:placeId', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const placeId = req.params.placeId;

        // 1) KPI + Star Distribution
        const [summary] = await collection.aggregate([
            { $match: { placeId } },
            {
                $group: {
                    _id: '$placeId',
                    branchAddress: { $first: '$branch_address' },
                    district: { $first: '$district' },
                    avgStars: { $avg: '$stars' },
                    totalReviews: { $sum: 1 },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    positiveCount: { $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] } },
                    respondedCount: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
                    star1: { $sum: { $cond: [{ $eq: ['$stars', 1] }, 1, 0] } },
                    star2: { $sum: { $cond: [{ $eq: ['$stars', 2] }, 1, 0] } },
                    star3: { $sum: { $cond: [{ $eq: ['$stars', 3] }, 1, 0] } },
                    star4: { $sum: { $cond: [{ $eq: ['$stars', 4] }, 1, 0] } },
                    star5: { $sum: { $cond: [{ $eq: ['$stars', 5] }, 1, 0] } },
                }
            }
        ]).toArray();

        if (!summary) {
            return errorResponse(res, 404, 'ERR_BRANCH_NOT_FOUND', 'Branch not found');
        }

        const negativeRate = summary.totalReviews > 0
            ? Math.round(summary.negativeCount / summary.totalReviews * 10000) / 100 : 0;
        const responseRate = summary.totalReviews > 0
            ? Math.round(summary.respondedCount / summary.totalReviews * 10000) / 100 : 0;
        const healthScore = Math.round(
            summary.avgStars
            * (1 - summary.negativeCount / Math.max(summary.totalReviews, 1))
            * (1 + summary.respondedCount / Math.max(summary.totalReviews, 1))
            * 100
        ) / 100;

        // 2) Monthly Trend
        const monthlyTrend = await collection.aggregate([
            { $match: { placeId, publishedAtDate: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: { $substr: ['$publishedAtDate', 0, 7] },
                    total: { $sum: 1 },
                    negative: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    avgStars: { $avg: '$stars' },
                }
            },
            { $sort: { _id: 1 } },
        ]).toArray();

        const trends = monthlyTrend.map(t => ({
            period: t._id,
            total: t.total,
            negative: t.negative,
            negativeRate: t.total > 0 ? Math.round(t.negative / t.total * 10000) / 100 : 0,
            avgStars: Math.round(t.avgStars * 100) / 100,
        }));

        // 3) Recent Reviews (latest 20)
        const recentReviews = await collection
            .find({
                placeId,
                text: { $ne: 'Không có bình luận', $exists: true },
            })
            .sort({ publishedAtDate: -1 })
            .limit(20)
            .project({
                reviewId: 1, text: 1, stars: 1, label: 1,
                publishedAtDate: 1, session: 1,
                predictedLabel: 1, aiSentimentSummary: 1,
            })
            .toArray();

        // 4) Top Issues (keyword extraction from negative reviews for this branch)
        const negativeReviews = await collection
            .find({
                placeId, label: 0,
                text: { $ne: 'Không có bình luận', $exists: true },
            })
            .project({ text: 1 })
            .toArray();

        const KEYWORD_GROUPS = {
            'Nhân viên': ['nhân viên', 'nhan vien', 'phục vụ', 'phuc vu', 'thái độ', 'thai do', 'staff'],
            'Chờ lâu': ['đợi', 'chờ', 'lâu', 'chậm', 'wait', 'slow'],
            'Chất lượng': ['dở', 'tệ', 'chất lượng', 'nhạt', 'không ngon', 'ko ngon'],
            'Bảo vệ': ['bảo vệ', 'gác xe', 'giữ xe', 'parking'],
            'Không gian': ['không gian', 'chỗ ngồi', 'chật', 'ồn', 'bàn', 'ghế'],
            'Vệ sinh': ['bẩn', 'vệ sinh', 'ruồi', 'kiến', 'gián'],
            'Giá cả': ['giá', 'đắt', 'mắc', 'price', 'expensive'],
            'Order sai': ['order sai', 'sai', 'nhầm', 'thiếu'],
            'Đồ uống': ['nước', 'trà', 'cà phê', 'coffee', 'trà sữa', 'đá'],
        };

        const issueCounts = {};
        for (const [category] of Object.entries(KEYWORD_GROUPS)) {
            issueCounts[category] = 0;
        }
        for (const review of negativeReviews) {
            const text = (review.text || '').toLowerCase();
            for (const [category, patterns] of Object.entries(KEYWORD_GROUPS)) {
                for (const pattern of patterns) {
                    if (text.includes(pattern)) {
                        issueCounts[category]++;
                        break;
                    }
                }
            }
        }
        const topIssues = Object.entries(issueCounts)
            .map(([issue, count]) => ({ issue, count }))
            .filter(i => i.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            placeId: summary._id,
            branchAddress: summary.branchAddress,
            district: summary.district,
            avgStars: Math.round(summary.avgStars * 100) / 100,
            totalReviews: summary.totalReviews,
            negativeCount: summary.negativeCount,
            positiveCount: summary.positiveCount,
            negativeRate,
            responseRate,
            healthScore,
            starDistribution: {
                1: summary.star1, 2: summary.star2, 3: summary.star3,
                4: summary.star4, 5: summary.star5,
            },
            monthlyTrend: trends,
            recentReviews: recentReviews.map(r => ({
                reviewId: r.reviewId || String(r._id),
                text: r.text,
                stars: r.stars,
                label: r.label,
                publishedAtDate: r.publishedAtDate,
                session: r.session,
                predictedLabel: r.predictedLabel,
                aiSentimentSummary: r.aiSentimentSummary,
            })),
            topIssues,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_BRANCH_DETAIL', err.message);
    }
});

module.exports = router;
