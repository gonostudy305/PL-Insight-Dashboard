/**
 * Frozen Test Set Generator
 * Queries MongoDB for representative samples across all required categories.
 * Run: node generate-test-set.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function generate() {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('PhucLong_Hanoi');
    const col = db.collection('Master_Final_Analysis');

    const testSet = [];

    // ── 1. Positive reviews (label=1, various star levels) ──
    const positives = await col.find({ label: 1, text: { $ne: 'Không có bình luận' } })
        .sort({ text_length: -1 }).limit(12).toArray();
    positives.forEach(r => testSet.push({
        category: 'positive',
        reviewId: r.reviewId || String(r._id),
        text: r.text,
        stars: r.stars,
        expectedLabel: 1,
        textLength: r.text_length,
    }));

    // ── 2. Negative reviews (label=0, various star levels) ──
    const negatives = await col.find({ label: 0, text: { $ne: 'Không có bình luận' } })
        .sort({ text_length: -1 }).limit(12).toArray();
    negatives.forEach(r => testSet.push({
        category: 'negative',
        reviewId: r.reviewId || String(r._id),
        text: r.text,
        stars: r.stars,
        expectedLabel: 0,
        textLength: r.text_length,
    }));

    // ── 3. Empty text reviews ──
    const empties = await col.find({ text: 'Không có bình luận' }).limit(5).toArray();
    empties.forEach(r => testSet.push({
        category: 'empty',
        reviewId: r.reviewId || String(r._id),
        text: r.text,
        stars: r.stars,
        expectedLabel: r.label,
        textLength: r.text_length,
    }));

    // ── 4. Very short reviews (potential edge cases) ──
    const veryShort = await col.find({
        text_length_group: 'Very Short',
        text: { $ne: 'Không có bình luận' },
    }).limit(5).toArray();
    veryShort.forEach(r => testSet.push({
        category: 'very_short',
        reviewId: r.reviewId || String(r._id),
        text: r.text,
        stars: r.stars,
        expectedLabel: r.label,
        textLength: r.text_length,
    }));

    // ── 5. Very long reviews ──
    const veryLong = await col.find({ text_length_group: 'Very long' })
        .sort({ text_length: -1 }).limit(5).toArray();
    veryLong.forEach(r => testSet.push({
        category: 'very_long',
        reviewId: r.reviewId || String(r._id),
        text: r.text,
        stars: r.stars,
        expectedLabel: r.label,
        textLength: r.text_length,
    }));

    // ── 6. 1-star reviews (most severe) ──
    const oneStar = await col.find({ stars: 1, text: { $ne: 'Không có bình luận' } })
        .limit(5).toArray();
    oneStar.forEach(r => {
        if (!testSet.find(t => t.reviewId === (r.reviewId || String(r._id)))) {
            testSet.push({
                category: '1_star_severe',
                reviewId: r.reviewId || String(r._id),
                text: r.text,
                stars: r.stars,
                expectedLabel: 0,
                textLength: r.text_length,
            });
        }
    });

    // ── 7. 5-star reviews ──
    const fiveStar = await col.find({ stars: 5, text: { $ne: 'Không có bình luận' } })
        .sort({ text_length: -1 }).limit(5).toArray();
    fiveStar.forEach(r => {
        if (!testSet.find(t => t.reviewId === (r.reviewId || String(r._id)))) {
            testSet.push({
                category: '5_star',
                reviewId: r.reviewId || String(r._id),
                text: r.text,
                stars: r.stars,
                expectedLabel: 1,
                textLength: r.text_length,
            });
        }
    });

    // ── 8. Weekend reviews (for alert priority testing) ──
    const weekend = await col.find({
        is_weekend: 1, label: 0,
        text: { $ne: 'Không có bình luận' },
        text_length_group: { $in: ['Long', 'Very long'] },
    }).limit(3).toArray();
    weekend.forEach(r => {
        if (!testSet.find(t => t.reviewId === (r.reviewId || String(r._id)))) {
            testSet.push({
                category: 'weekend_negative_long',
                reviewId: r.reviewId || String(r._id),
                text: r.text,
                stars: r.stars,
                expectedLabel: 0,
                textLength: r.text_length,
                isWeekend: r.is_weekend,
                hour: r.hour,
            });
        }
    });

    // ── 9. Peak hour reviews (for alert priority testing) ──
    const peakHour = await col.find({
        hour: { $in: [7, 8, 9, 18, 19, 20, 21] },
        label: 0,
        text: { $ne: 'Không có bình luận' },
    }).limit(3).toArray();
    peakHour.forEach(r => {
        if (!testSet.find(t => t.reviewId === (r.reviewId || String(r._id)))) {
            testSet.push({
                category: 'peak_hour_negative',
                reviewId: r.reviewId || String(r._id),
                text: r.text,
                stars: r.stars,
                expectedLabel: 0,
                textLength: r.text_length,
                hour: r.hour,
            });
        }
    });

    // ── Add synthetic edge cases ──
    testSet.push(
        {
            category: 'no_diacritics',
            reviewId: 'SYNTH_NO_DIACRITICS_01',
            text: 'Quan ngon lam, nhan vien nhiet tinh, se quay lai',
            stars: null,
            expectedLabel: 1,
            textLength: 48,
            synthetic: true,
        },
        {
            category: 'no_diacritics',
            reviewId: 'SYNTH_NO_DIACRITICS_02',
            text: 'Do uong do, nhan vien cham, cho doi lau qua',
            stars: null,
            expectedLabel: 0,
            textLength: 45,
            synthetic: true,
        },
        {
            category: 'english',
            reviewId: 'SYNTH_EN_01',
            text: 'Great bubble tea, best milk tea in Hanoi! Will come back definitely.',
            stars: null,
            expectedLabel: 1,
            textLength: 67,
            synthetic: true,
        },
        {
            category: 'english',
            reviewId: 'SYNTH_EN_02',
            text: 'Terrible service, waited 30 minutes, staff was rude and ignored us.',
            stars: null,
            expectedLabel: 0,
            textLength: 66,
            synthetic: true,
        },
        {
            category: 'sarcastic',
            reviewId: 'SYNTH_SARCASTIC_01',
            text: 'Tuyệt vời luôn, trà sữa đắng nghét mà nhân viên bảo đúng công thức rồi 🙃',
            stars: null,
            expectedLabel: 0,
            textLength: 75,
            synthetic: true,
        },
        {
            category: 'sarcastic',
            reviewId: 'SYNTH_SARCASTIC_02',
            text: 'Quá xuất sắc, đợi 45 phút mới có ly nước, trải nghiệm đỉnh cao 👏',
            stars: null,
            expectedLabel: 0,
            textLength: 67,
            synthetic: true,
        },
        {
            category: 'mixed',
            reviewId: 'SYNTH_MIXED_01',
            text: 'Trà sữa rất ngon, vị đậm đà. Nhưng nhân viên thái độ quá, order sai 2 lần không xin lỗi.',
            stars: null,
            expectedLabel: null, // Mixed — sentence-level analysis needed
            textLength: 89,
            synthetic: true,
        },
        {
            category: 'mixed',
            reviewId: 'SYNTH_MIXED_02',
            text: 'Không gian đẹp, view thoáng mát. Tuy nhiên đồ uống hơi nhạt so với giá tiền.',
            stars: null,
            expectedLabel: null, // Mixed
            textLength: 76,
            synthetic: true,
        },
    );

    // Write the test set
    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalSamples: testSet.length,
            categories: {},
        },
        samples: testSet,
    };

    // Count categories
    testSet.forEach(s => {
        output.metadata.categories[s.category] = (output.metadata.categories[s.category] || 0) + 1;
    });

    fs.writeFileSync('frozen-test-set.json', JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Frozen test set generated: ${testSet.length} samples`);
    console.log('Categories:', JSON.stringify(output.metadata.categories, null, 2));

    await client.close();
}

generate().catch(console.error);
