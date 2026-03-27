/**
 * /api/suggestions — Response Suggestion for Reviews
 * 
 * Endpoints:
 *   GET  /:reviewId          — Get rule-based suggested responses
 *   POST /:reviewId/ai-response — Get AI-personalized response (PhoBERT)
 */
const { Router } = require('express');
const { generateSuggestions, generateAIResponse } = require('../services/suggestion-engine');
const router = Router();

// GET /api/suggestions/:reviewId — rule-based suggestions (legacy)
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

// POST /api/suggestions/:reviewId/ai-response — AI-personalized response
router.post('/:reviewId/ai-response', async (req, res) => {
    try {
        const { reviewId } = req.params;
        const col = req.db.collection('Master_Final_Analysis');

        // 1. Find review in MongoDB
        let review;
        try {
            const { ObjectId } = require('mongodb');
            review = await col.findOne({
                $or: [
                    { reviewId },
                    { _id: new ObjectId(reviewId) },
                ],
            });
        } catch {
            review = await col.findOne({ reviewId });
        }

        if (!review) {
            return res.status(404).json({
                error: { code: 'ERR_NOT_FOUND', message: 'Review không tìm thấy' },
            });
        }

        if (!review.text || review.text === 'Không có bình luận') {
            return res.json({
                reviewId: review.reviewId || reviewId,
                aiResponse: null,
                categories: [],
                keywords: [],
                sentimentSummary: 'No Content',
                confidence: 0,
                negativeSentences: [],
                branchAddress: review.branch_address,
                stars: review.stars,
                message: 'Review không có nội dung văn bản để phân tích.',
            });
        }

        // 2. Call FastAPI AI server for PhoBERT analysis
        let aiAnalysis;
        try {
            const response = await fetch(`${req.AI_SERVER_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewText: review.text }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error('[ai-response] AI server error:', response.status, errBody);
                // Fallback: generate using rule-based if AI server fails
                const fallback = generateSuggestions(review);
                return res.json({
                    reviewId: review.reviewId || reviewId,
                    aiResponse: fallback.suggestions[0]?.text || 'Cảm ơn bạn đã phản hồi.',
                    categories: fallback.categories,
                    keywords: [],
                    sentimentSummary: review.label === 0 ? 'Negative' : 'Positive',
                    confidence: 0,
                    negativeSentences: [],
                    branchAddress: review.branch_address,
                    stars: review.stars,
                    fallback: true,
                });
            }

            aiAnalysis = await response.json();
        } catch (err) {
            console.error('[ai-response] AI server unreachable:', err.message);
            // Fallback to rule-based
            const fallback = generateSuggestions(review);
            return res.json({
                reviewId: review.reviewId || reviewId,
                aiResponse: fallback.suggestions[0]?.text || 'Cảm ơn bạn đã phản hồi.',
                categories: fallback.categories,
                keywords: [],
                sentimentSummary: review.label === 0 ? 'Negative' : 'Positive',
                confidence: 0,
                negativeSentences: [],
                branchAddress: review.branch_address,
                stars: review.stars,
                fallback: true,
            });
        }

        // 3. Generate personalized response
        const result = generateAIResponse(review, aiAnalysis);
        res.json(result);

    } catch (err) {
        console.error('[ai-response] Error:', err.message);
        res.status(500).json({
            error: { code: 'ERR_AI_RESPONSE', message: 'Lỗi tạo phản hồi AI', details: err.message },
        });
    }
});

module.exports = router;
