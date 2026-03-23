/**
 * /api/live-monitor — Live Sentiment Monitor
 * Near-real-time AI analysis of customer reviews using PhoBERT.
 * 
 * Endpoints:
 *   GET  /recent              — Recently analyzed reviews
 *   POST /analyze/:reviewId   — Analyze a single review
 *   POST /scan                — Batch-analyze unprocessed reviews
 * 
 * AI runtime fields are stored alongside existing document (never overwrite `label`):
 *   predictedLabel, aiSentimentSummary, confidenceAvg,
 *   analysis, keywords, analyzedAt, isTranslated
 */
const { Router } = require('express');
const http = require('http');
const router = Router();

function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

/**
 * Call FastAPI /predict endpoint
 * @param {string} aiUrl - Base URL of AI server
 * @param {string} reviewText - Text to analyze
 * @returns {Promise<object>} AI prediction result
 */
function callPredict(aiUrl, reviewText) {
    return new Promise((resolve, reject) => {
        // Truncate to 2000 chars (Pydantic max_length)
        const text = reviewText.substring(0, 2000);
        const postData = JSON.stringify({ reviewText: text });
        const url = new URL(`${aiUrl}/predict`);

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (res.statusCode >= 400) {
                        reject(new Error(data.error?.message || `AI server returned ${res.statusCode}`));
                    } else {
                        resolve(data);
                    }
                } catch {
                    reject(new Error('Failed to parse AI response'));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(60000, () => { req.destroy(); reject(new Error('AI request timeout')); });
        req.write(postData);
        req.end();
    });
}

// GET /api/live-monitor/recent — Recently analyzed reviews
router.get('/recent', async (req, res) => {
    try {
        const { limit = 30, sentiment, placeId } = req.query;
        const collection = req.db.collection('Master_Final_Analysis');

        const filter = { analyzedAt: { $exists: true } };
        if (sentiment === 'positive') filter.predictedLabel = 1;
        if (sentiment === 'negative') filter.predictedLabel = 0;
        if (sentiment === 'mixed') filter.predictedLabel = 2;
        if (placeId) filter.placeId = placeId;

        const reviews = await collection
            .find(filter)
            .sort({ analyzedAt: -1 })
            .limit(parseInt(limit))
            .toArray();

        const data = reviews.map(r => ({
            reviewId: r.reviewId || String(r._id),
            text: r.text,
            stars: r.stars,
            branchAddress: r.branch_address,
            placeId: r.placeId,
            publishedAtDate: r.publishedAtDate,
            label: r.label,                          // historical (from stars)
            predictedLabel: r.predictedLabel,         // AI runtime
            aiSentimentSummary: r.aiSentimentSummary,
            confidenceAvg: r.confidenceAvg,
            keywords: r.keywords || [],
            analyzedAt: r.analyzedAt,
            isTranslated: r.isTranslated || false,
        }));

        const total = await collection.countDocuments(filter);

        res.json({ data, total, limit: parseInt(limit) });
    } catch (err) {
        errorResponse(res, 500, 'ERR_LIVE_RECENT', err.message);
    }
});

// POST /api/live-monitor/analyze/:reviewId — Analyze a single review
router.post('/analyze/:reviewId', async (req, res) => {
    try {
        const { reviewId } = req.params;
        const collection = req.db.collection('Master_Final_Analysis');

        const review = await collection.findOne({ reviewId });
        if (!review) {
            return errorResponse(res, 404, 'ERR_NOT_FOUND', `Review ${reviewId} not found`);
        }

        if (!review.text || review.text === 'Không có bình luận') {
            return errorResponse(res, 400, 'ERR_EMPTY_TEXT', 'Review has no analyzable text');
        }

        const aiResult = await callPredict(req.AI_SERVER_URL, review.text);

        // Save AI runtime fields (never overwrite `label`)
        const update = {
            predictedLabel: aiResult.sentimentSummary === 'Positive' ? 1 :
                aiResult.sentimentSummary === 'Mixed' ? 2 : 0,
            aiSentimentSummary: aiResult.sentimentSummary,
            confidenceAvg: aiResult.confidenceAvg,
            analysis: aiResult.analysis,
            keywords: aiResult.keywords,
            analyzedAt: new Date(),
            isTranslated: aiResult.isTranslated || false,
        };

        await collection.updateOne({ reviewId }, { $set: update });

        res.json({
            reviewId,
            ...update,
            branchAddress: review.branch_address,
            text: review.text,
            stars: review.stars,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_ANALYZE', err.message);
    }
});

// POST /api/live-monitor/scan — Batch-analyze unprocessed reviews
router.post('/scan', async (req, res) => {
    try {
        const { maxItems = 10 } = req.body || {};
        const batchSize = Math.min(parseInt(maxItems) || 10, 20); // Hard cap at 20 for CPU
        const collection = req.db.collection('Master_Final_Analysis');

        // Find reviews not yet analyzed, with actual text content
        const unanalyzed = await collection
            .find({
                analyzedAt: { $exists: false },
                text: { $ne: 'Không có bình luận', $exists: true },
            })
            .sort({ publishedAtDate: -1 }) // newest first
            .limit(batchSize)
            .toArray();

        let analyzed = 0, skipped = 0, failed = 0;
        const results = [];

        for (const review of unanalyzed) {
            try {
                if (!review.text || review.text.trim().length === 0) {
                    skipped++;
                    continue;
                }

                const aiResult = await callPredict(req.AI_SERVER_URL, review.text);

                const update = {
                    predictedLabel: aiResult.sentimentSummary === 'Positive' ? 1 :
                        aiResult.sentimentSummary === 'Mixed' ? 2 : 0,
                    aiSentimentSummary: aiResult.sentimentSummary,
                    confidenceAvg: aiResult.confidenceAvg,
                    analysis: aiResult.analysis,
                    keywords: aiResult.keywords,
                    analyzedAt: new Date(),
                    isTranslated: aiResult.isTranslated || false,
                };

                await collection.updateOne(
                    { _id: review._id },
                    { $set: update }
                );

                analyzed++;
                results.push({
                    reviewId: review.reviewId || String(review._id),
                    aiSentimentSummary: aiResult.sentimentSummary,
                    confidenceAvg: aiResult.confidenceAvg,
                });
            } catch (err) {
                failed++;
                console.error(`[scan] Failed review ${review.reviewId}: ${err.message}`);
            }
        }

        // Count remaining unanalyzed
        const remaining = await collection.countDocuments({
            analyzedAt: { $exists: false },
            text: { $ne: 'Không có bình luận', $exists: true },
        });

        console.log(`[scan] analyzed=${analyzed} skipped=${skipped} failed=${failed} remaining=${remaining}`);

        res.json({
            analyzed,
            skipped,
            failed,
            remaining,
            results,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_SCAN', err.message);
    }
});

module.exports = router;
