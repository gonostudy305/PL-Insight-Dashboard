/**
 * re-scan-mixed.js — Re-analyze reviews to fix Mixed historical data
 *
 * Usage:
 *   node scripts/re-scan-mixed.js [--dry-run] [--batch-size=50]
 *
 * Purpose:
 *   After the Mixed→2 fix, historical reviews analyzed before the fix
 *   have predictedLabel=0 even when aiSentimentSummary='Mixed'.
 *   This script finds and corrects those records.
 *
 * Behavior:
 *   1. Find all documents where aiSentimentSummary='Mixed' but predictedLabel≠2
 *   2. Update predictedLabel to 2
 *   3. Log results
 *
 * Flags:
 *   --dry-run    Show what would be updated without changing anything
 *   --batch-size How many records to process per batch (default: 50)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const batchArg = args.find(a => a.startsWith('--batch-size='));
    const batchSize = batchArg ? parseInt(batchArg.split('=')[1]) : 50;

    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  PL-Insight: Re-scan Mixed Historical Data      │');
    console.log('│  Mode:', dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update DB)', '          │');
    console.log('└─────────────────────────────────────────────────┘');

    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db('PhucLong_Hanoi');
        const col = db.collection('Master_Final_Analysis');

        // Step 1: Find mismatched records
        const filter = {
            aiSentimentSummary: 'Mixed',
            predictedLabel: { $ne: 2 },
            analyzedAt: { $exists: true },
        };

        const count = await col.countDocuments(filter);
        console.log(`\n🔍 Found ${count} reviews with aiSentimentSummary='Mixed' but predictedLabel≠2`);

        if (count === 0) {
            console.log('✅ No records need fixing. All Mixed reviews are already correct.');
            return;
        }

        // Step 2: Show sample of affected records
        const samples = await col.find(filter)
            .project({ reviewId: 1, aiSentimentSummary: 1, predictedLabel: 1, confidenceAvg: 1 })
            .limit(5)
            .toArray();

        console.log('\n📋 Sample records:');
        for (const s of samples) {
            console.log(`   ${s.reviewId || s._id} — predicted: ${s.predictedLabel}, sentiment: ${s.aiSentimentSummary}, confidence: ${s.confidenceAvg}`);
        }

        if (dryRun) {
            console.log(`\n⏸️  DRY RUN: Would update ${count} records. Run without --dry-run to apply.`);
            return;
        }

        // Step 3: Update in batches
        console.log(`\n🔄 Updating ${count} records in batches of ${batchSize}...`);
        let updated = 0;

        while (updated < count) {
            const result = await col.updateMany(
                filter,
                { $set: { predictedLabel: 2 } },
            );
            updated += result.modifiedCount;
            console.log(`   Batch complete: ${updated}/${count} updated`);
            if (result.modifiedCount === 0) break; // safety break
        }

        console.log(`\n✅ Done. ${updated} records updated: predictedLabel → 2`);

        // Step 4: Verify
        const remaining = await col.countDocuments(filter);
        if (remaining === 0) {
            console.log('✅ Verification passed: no mismatched records remain.');
        } else {
            console.log(`⚠️  ${remaining} records still mismatched — please investigate.`);
        }

    } finally {
        await client.close();
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
