/**
 * /api/alerts — Prioritized Negative Review Queue
 * This is NOT a full alert engine. It is a rule-based priority queue.
 * Default sort: priority (high first), then newest first
 * JSON contract matches locked §4
 */
const { Router } = require('express');
const router = Router();

// Peak hours from EDA analysis (Chapter 3.2.5)
const PEAK_HOURS = [7, 8, 9, 18, 19, 20, 21];

function errorResponse(res, status, code, message, details = null) {
    return res.status(status).json({ error: { code, message, details } });
}

// GET /api/alerts — Get prioritized negative reviews
router.get('/', async (req, res) => {
    try {
        const { limit = 50, priority } = req.query;
        const collection = req.db.collection('Master_Final_Analysis');

        // Base filter: only negative reviews with text content
        const filter = {
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
        };

        const reviews = await collection
            .find(filter)
            .sort({ publishedAtDate: -1 })
            .limit(parseInt(limit) * 3) // fetch extra for priority filtering
            .toArray();

        // Assign priority levels based on risk assessment (Chapter 6.1.1)
        const alerts = reviews.map(review => {
            const isPeakHour = PEAK_HOURS.includes(review.hour);
            const isLongText = ['Long', 'Very long'].includes(review.text_length_group);
            const isWeekend = review.is_weekend === 1;

            let priorityLevel;
            let priorityLabel;

            if (isLongText && (isPeakHour || isWeekend)) {
                priorityLevel = 1;
                priorityLabel = 'High';
            } else if (isLongText || isPeakHour) {
                priorityLevel = 2;
                priorityLabel = 'Standard';
            } else {
                priorityLevel = 3;
                priorityLabel = 'Monitoring';
            }

            return {
                reviewId: review.reviewId || String(review._id),
                text: review.text,
                stars: review.stars,
                branchAddress: review.branch_address,
                placeId: review.placeId,
                district: review.district,
                publishedAtDate: review.publishedAtDate,
                hour: review.hour,
                dayOfWeek: review.day_of_week,
                session: review.session,
                textLengthGroup: review.text_length_group,
                isWeekend: review.is_weekend,
                priorityLevel,
                priorityLabel,
                riskFactors: [
                    ...(isPeakHour ? ['Giờ cao điểm'] : []),
                    ...(isLongText ? ['Nội dung dài/chi tiết'] : []),
                    ...(isWeekend ? ['Cuối tuần'] : []),
                    ...(review.stars === 1 ? ['1 sao — Rất nghiêm trọng'] : []),
                ],
            };
        });

        // Filter by priority if requested
        let filtered = alerts;
        if (priority) {
            filtered = alerts.filter(a => a.priorityLevel === parseInt(priority));
        }

        // Default sort: priority high first, then newest first
        filtered.sort((a, b) => {
            if (a.priorityLevel !== b.priorityLevel) return a.priorityLevel - b.priorityLevel;
            return new Date(b.publishedAtDate) - new Date(a.publishedAtDate);
        });

        const summary = {
            high: alerts.filter(a => a.priorityLevel === 1).length,
            standard: alerts.filter(a => a.priorityLevel === 2).length,
            monitoring: alerts.filter(a => a.priorityLevel === 3).length,
        };

        res.json({
            data: filtered.slice(0, parseInt(limit)),
            total: filtered.length,
            summary,
        });
    } catch (err) {
        errorResponse(res, 500, 'ERR_ALERTS', err.message);
    }
});

module.exports = router;
