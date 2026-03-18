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

// GET /api/branches/:placeId — Single branch detail
router.get('/:placeId', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const placeId = req.params.placeId;

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

        res.json({
            placeId: summary._id,
            branchAddress: summary.branchAddress,
            district: summary.district,
            avgStars: Math.round(summary.avgStars * 100) / 100,
            totalReviews: summary.totalReviews,
            negativeCount: summary.negativeCount,
            respondedCount: summary.respondedCount,
            starDistribution: {
                1: summary.star1,
                2: summary.star2,
                3: summary.star3,
                4: summary.star4,
                5: summary.star5,
            },
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_BRANCH_DETAIL', err.message);
    }
});

module.exports = router;
