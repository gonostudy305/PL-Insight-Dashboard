/**
 * /api/reviews — Review data endpoints
 * Default sort: publishedAtDate desc (newest first)
 * JSON contract matches locked §4
 */
const { Router } = require('express');
const router = Router();

// Standardized error response (locked contract)
function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

// GET /api/reviews — Paginated reviews with filters
// Default sort: newest first
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
        if (branch) filter.placeId = branch; // group by placeId, not address string
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

        // Map to camelCase for API response (locked §2)
        const data = reviews.map(r => ({
            id: r._id,
            reviewId: r.reviewId,
            placeId: r.placeId,
            text: r.text,
            stars: r.stars,
            label: r.label,
            publishedAtDate: r.publishedAtDate,
            branchAddress: r.branch_address,
            district: r.district,
            isResponded: r.is_responded,
            hour: r.hour,
            dayOfWeek: r.day_of_week,
            session: r.session,
            isWeekend: r.is_weekend,
            textLength: r.text_length,
            textLengthGroup: r.text_length_group,
        }));

        res.json({
            data,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_REVIEWS_LIST', err.message);
    }
});

// POST /api/reviews/:id/predict — Trigger AI prediction for a single review
// Uses POST because this triggers processing, not a pure query (locked REST fix)
router.post('/:id/predict', async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const collection = req.db.collection('Master_Final_Analysis');

        let review;
        try {
            review = await collection.findOne({ _id: new ObjectId(req.params.id) });
        } catch {
            return errorResponse(res, 400, 'ERR_INVALID_ID', 'Invalid review ID format');
        }

        if (!review) {
            return errorResponse(res, 404, 'ERR_NOT_FOUND', 'Review not found');
        }

        if (!review.text || review.text === 'Không có bình luận') {
            return res.json({
                reviewId: review.reviewId || req.params.id,
                sentimentSummary: 'No Content',
                confidenceAvg: 0.0,
                analysis: [],
                keywords: [],
                isTranslated: false,
            });
        }

        // Call FastAPI AI server with locked contract request
        const response = await fetch(`${req.AI_SERVER_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewText: review.text }),
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            return errorResponse(res, response.status, 'ERR_AI_SERVER', 'AI server error', errBody);
        }

        const prediction = await response.json();
        res.json({ reviewId: review.reviewId || req.params.id, ...prediction });
    } catch (err) {
        errorResponse(res, 500, 'ERR_PREDICT', err.message);
    }
});

module.exports = router;
