/**
 * /api/alerts — Smart Alert System
 * Flags high-priority negative reviews based on risk assessment criteria.
 */
const { Router } = require('express');
const router = Router();

// Peak hours from EDA analysis (Chapter 3.2.5)
const PEAK_HOURS = [7, 8, 9, 18, 19, 20, 21];

// GET /api/alerts — Get prioritized negative reviews
router.get('/', async (req, res) => {
    try {
        const { limit = 50, priority } = req.query;
        const collection = req.db.collection('Master_Final_Analysis');

        // Base filter: only negative reviews with text
        const filter = {
            label: 0,
            text: { $ne: 'Không có bình luận', $exists: true },
        };

        const reviews = await collection
            .find(filter)
            .sort({ publishedAtDate: -1 })
            .limit(parseInt(limit) * 3) // Get more to filter by priority
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
                _id: review._id,
                text: review.text,
                stars: review.stars,
                branch_address: review.branch_address,
                district: review.district,
                publishedAtDate: review.publishedAtDate,
                hour: review.hour,
                day_of_week: review.day_of_week,
                session: review.session,
                text_length: review.text_length,
                text_length_group: review.text_length_group,
                is_weekend: review.is_weekend,
                priority_level: priorityLevel,
                priority_label: priorityLabel,
                risk_factors: [
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
            filtered = alerts.filter(a => a.priority_level === parseInt(priority));
        }

        // Sort by priority (1 = highest) then by date
        filtered.sort((a, b) => a.priority_level - b.priority_level);

        res.json({
            data: filtered.slice(0, parseInt(limit)),
            total: filtered.length,
            summary: {
                high: alerts.filter(a => a.priority_level === 1).length,
                standard: alerts.filter(a => a.priority_level === 2).length,
                monitoring: alerts.filter(a => a.priority_level === 3).length,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
