/**
 * /api/branches — Branch data + KPI aggregation
 */
const { Router } = require('express');
const router = Router();

// GET /api/branches — All branches with aggregated KPIs
router.get('/', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');

        const branches = await collection.aggregate([
            {
                $group: {
                    _id: '$branch_address',
                    avg_stars: { $avg: '$stars' },
                    total_reviews: { $sum: 1 },
                    negative_count: {
                        $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] }
                    },
                    positive_count: {
                        $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] }
                    },
                    responded_count: {
                        $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] }
                    },
                    district: { $first: '$district' },
                    placeId: { $first: '$placeId' },
                }
            },
            {
                $addFields: {
                    negative_rate: {
                        $cond: [
                            { $eq: ['$total_reviews', 0] }, 0,
                            { $divide: ['$negative_count', '$total_reviews'] }
                        ]
                    },
                    response_rate: {
                        $cond: [
                            { $eq: ['$total_reviews', 0] }, 0,
                            { $divide: ['$responded_count', '$total_reviews'] }
                        ]
                    },
                }
            },
            {
                $addFields: {
                    health_score: {
                        $multiply: [
                            '$avg_stars',
                            { $subtract: [1, '$negative_rate'] },
                            { $add: [1, '$response_rate'] },
                        ]
                    }
                }
            },
            { $sort: { health_score: -1 } },
        ]).toArray();

        res.json({ data: branches, total: branches.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/branches/:id — Single branch detail
router.get('/:id', async (req, res) => {
    try {
        const collection = req.db.collection('Master_Final_Analysis');
        const branchName = decodeURIComponent(req.params.id);

        const [summary] = await collection.aggregate([
            { $match: { branch_address: branchName } },
            {
                $group: {
                    _id: '$branch_address',
                    avg_stars: { $avg: '$stars' },
                    total_reviews: { $sum: 1 },
                    negative_count: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                    responded_count: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
                    district: { $first: '$district' },
                    star_1: { $sum: { $cond: [{ $eq: ['$stars', 1] }, 1, 0] } },
                    star_2: { $sum: { $cond: [{ $eq: ['$stars', 2] }, 1, 0] } },
                    star_3: { $sum: { $cond: [{ $eq: ['$stars', 3] }, 1, 0] } },
                    star_4: { $sum: { $cond: [{ $eq: ['$stars', 4] }, 1, 0] } },
                    star_5: { $sum: { $cond: [{ $eq: ['$stars', 5] }, 1, 0] } },
                }
            }
        ]).toArray();

        if (!summary) return res.status(404).json({ error: 'Branch not found' });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
