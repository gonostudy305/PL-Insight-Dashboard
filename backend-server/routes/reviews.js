/**
 * /api/reviews — Review data endpoints
 */
const { Router } = require('express');
const router = Router();

// GET /api/reviews — Paginated reviews with filters
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            branch,
            label,
            sort = 'publishedAtDate',
            order = 'desc',
        } = req.query;

        const filter = {};
        if (branch) filter.branch_address = branch;
        if (label !== undefined) filter.label = parseInt(label);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

        const collection = req.db.collection('Master_Final_Analysis');
        const [reviews, total] = await Promise.all([
            collection
                .find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .toArray(),
            collection.countDocuments(filter),
        ]);

        res.json({
            data: reviews,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/:id/predict — Predict sentiment for a single review
router.get('/:id/predict', async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const collection = req.db.collection('Master_Final_Analysis');
        const review = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (!review.text || review.text === 'Không có bình luận') {
            return res.json({ message: 'No text content to analyze', review_id: req.params.id });
        }

        // Call FastAPI AI server
        const response = await fetch(`${req.AI_SERVER_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: review.text }),
        });

        const prediction = await response.json();
        res.json({ review_id: req.params.id, ...prediction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
