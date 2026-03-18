/**
 * /api/suggestions — Response Suggestion for Reviews
 * 
 * Endpoints:
 *   GET /:reviewId — Get suggested responses for a specific review
 */
const { Router } = require('express');
const { generateSuggestions } = require('../services/suggestion-engine');
const router = Router();

// GET /api/suggestions/:reviewId
router.get('/:reviewId', async (req, res) => {
    try {
        const { reviewId } = req.params;
        const col = req.db.collection('Master_Final_Analysis');

        const review = await col.findOne({
            $or: [
                { reviewId },
                { _id: reviewId },
            ],
            text: { $exists: true, $ne: 'Không có bình luận' },
        });

        if (!review) {
            return res.status(404).json({ error: 'Review không tìm thấy hoặc không có nội dung' });
        }

        const result = generateSuggestions(review);
        res.json({
            ...result,
            reviewText: review.text,
            stars: review.stars,
            branchAddress: review.branch_address,
        });
    } catch (err) {
        console.error('[suggestions] Error:', err.message);
        res.status(500).json({ error: 'Lỗi tạo gợi ý', details: err.message });
    }
});

module.exports = router;
