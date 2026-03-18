/**
 * Alert Trigger Engine
 * Monitors review patterns and creates alerts when thresholds are exceeded.
 * 
 * Rules:
 *   - >3 negative reviews in 1 hour for same placeId
 *   - Cooldown: 60 minutes (no duplicate alert for same branch within window)
 * 
 * Alert History Collection Schema:
 *   alertId: string (auto-generated)
 *   placeId: string
 *   branchAddress: string
 *   district: string
 *   triggerRule: string
 *   triggerCount: number
 *   reviewIds: string[]
 *   status: 'new' | 'acknowledged' | 'resolved'
 *   createdAt: Date
 *   acknowledgedAt: Date | null
 *   resolvedAt: Date | null
 *   notified: boolean
 */

const COOLDOWN_MINUTES = 60;
const TRIGGER_THRESHOLD = 3;
const TRIGGER_WINDOW_HOURS = 1;

/**
 * Scan for branches exceeding negative review threshold and create alerts.
 * @param {object} db - MongoDB database instance
 * @returns {object} { created: number, skipped: number, alerts: array }
 */
async function runTriggerScan(db) {
    const reviewsCol = db.collection('Master_Final_Analysis');
    const alertsCol = db.collection('alert_history');

    const windowStart = new Date(Date.now() - TRIGGER_WINDOW_HOURS * 60 * 60 * 1000);
    const cooldownStart = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);

    // Find branches with >TRIGGER_THRESHOLD negative reviews in the last TRIGGER_WINDOW_HOURS
    const hotspots = await reviewsCol.aggregate([
        {
            $match: {
                label: 0,
                text: { $ne: 'Không có bình luận', $exists: true },
                publishedAtDate: { $gte: windowStart.toISOString() },
            }
        },
        {
            $group: {
                _id: '$placeId',
                count: { $sum: 1 },
                branchAddress: { $first: '$branch_address' },
                district: { $first: '$district' },
                reviewIds: { $push: { $toString: '$_id' } },
            }
        },
        { $match: { count: { $gt: TRIGGER_THRESHOLD } } },
        { $sort: { count: -1 } },
    ]).toArray();

    let created = 0;
    let skipped = 0;
    const newAlerts = [];

    for (const hotspot of hotspots) {
        // De-dup: check if alert already exists within cooldown window
        const existingAlert = await alertsCol.findOne({
            placeId: hotspot._id,
            createdAt: { $gte: cooldownStart },
        });

        if (existingAlert) {
            skipped++;
            continue;
        }

        const alert = {
            alertId: `ALR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            placeId: hotspot._id,
            branchAddress: hotspot.branchAddress,
            district: hotspot.district,
            triggerRule: `>${TRIGGER_THRESHOLD} negative reviews in ${TRIGGER_WINDOW_HOURS}h`,
            triggerCount: hotspot.count,
            reviewIds: hotspot.reviewIds.slice(0, 10), // Cap at 10 IDs
            status: 'new',
            createdAt: new Date(),
            acknowledgedAt: null,
            resolvedAt: null,
            notified: false,
        };

        await alertsCol.insertOne(alert);
        created++;
        newAlerts.push(alert);
    }

    console.log(`[trigger] created=${created} skipped=${skipped} hotspots=${hotspots.length}`);
    return { created, skipped, alerts: newAlerts };
}

/**
 * Notifier interface — currently a stub for Telegram.
 * Replace with actual implementation when token is available.
 */
async function sendNotification(alert) {
    const message = `🚨 PL-Insight Alert\n` +
        `Chi nhánh: ${alert.branchAddress}\n` +
        `Quận: ${alert.district}\n` +
        `Quy tắc: ${alert.triggerRule}\n` +
        `Số review: ${alert.triggerCount}\n` +
        `Thời điểm: ${alert.createdAt.toISOString()}`;

    // TODO: Replace with actual Telegram API call
    // const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    // const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    // if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    //     await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    //     });
    // }

    console.log(`[notifier] STUB — would send: ${message.substring(0, 80)}...`);
    return { sent: false, stub: true, message };
}

module.exports = { runTriggerScan, sendNotification, COOLDOWN_MINUTES, TRIGGER_THRESHOLD };
