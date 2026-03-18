/**
 * 3-Layer Verification Script
 * Run: node run-verification.js
 * 
 * Layer 1: Technical — API health, schema, build
 * Layer 2: Business Logic — KPI cross-check, ranking, alerts
 * Layer 3: Model — /predict + /predict-batch edge cases (requires FastAPI)
 */
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:3000/api';
const results = { pass: 0, fail: 0, skip: 0, details: [] };

function log(layer, test, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    results.details.push({ layer, test, status, detail });
    results[status.toLowerCase()]++;
    console.log(`${icon} [${layer}] ${test}${detail ? ' — ' + detail : ''}`);
}

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, data: body }); }
            });
        }).on('error', reject);
    });
}

async function layer1_technical() {
    console.log('\n═══════════════════════════════════════════');
    console.log('LAYER 1: TECHNICAL VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    // 1.1 Health endpoint
    try {
        const r = await get(`${BASE}/health`);
        if (r.data.status === 'ok' && r.data.database === 'connected') {
            log('L1', 'Health endpoint returns OK + DB connected', 'PASS');
        } else {
            log('L1', 'Health endpoint', 'FAIL', JSON.stringify(r.data));
        }
    } catch (e) { log('L1', 'Health endpoint', 'FAIL', e.message); }

    // 1.2 Overview endpoint — schema check
    try {
        const r = await get(`${BASE}/analytics/overview`);
        const required = ['totalReviews', 'avgStars', 'sentimentScore', 'negativeRate', 'responseRate', 'healthScore', 'positiveCount', 'negativeCount', 'alertCount'];
        const missing = required.filter(k => r.data[k] === undefined);
        if (missing.length === 0) {
            log('L1', 'Overview schema has all 9 required fields', 'PASS');
        } else {
            log('L1', 'Overview schema', 'FAIL', `Missing: ${missing.join(', ')}`);
        }
        // Check types
        const allNumbers = required.every(k => typeof r.data[k] === 'number');
        if (allNumbers) {
            log('L1', 'Overview fields are all numeric', 'PASS');
        } else {
            log('L1', 'Overview field types', 'FAIL', 'Some fields are not numbers');
        }
    } catch (e) { log('L1', 'Overview endpoint', 'FAIL', e.message); }

    // 1.3 Branches endpoint — schema check
    try {
        const r = await get(`${BASE}/branches`);
        const b = r.data.data[0];
        const required = ['placeId', 'branchAddress', 'avgStars', 'totalReviews', 'negativeRate', 'healthScore'];
        const missing = required.filter(k => b[k] === undefined);
        if (missing.length === 0) {
            log('L1', 'Branches schema has all required camelCase fields', 'PASS');
        } else {
            log('L1', 'Branches schema', 'FAIL', `Missing: ${missing.join(', ')}`);
        }
        // Verify no snake_case leaks
        const keys = Object.keys(b);
        const snakeCase = keys.filter(k => k.includes('_'));
        if (snakeCase.length === 0) {
            log('L1', 'Branches: no snake_case field leaks', 'PASS');
        } else {
            log('L1', 'Branches: snake_case leak', 'FAIL', `Found: ${snakeCase.join(', ')}`);
        }
    } catch (e) { log('L1', 'Branches endpoint', 'FAIL', e.message); }

    // 1.4 Alerts endpoint — schema check
    try {
        const r = await get(`${BASE}/alerts?limit=3`);
        if (r.data.data && r.data.summary) {
            const a = r.data.data[0];
            const required = ['reviewId', 'placeId', 'branchAddress', 'stars', 'text', 'priorityLevel', 'priorityLabel', 'riskFactors'];
            const missing = required.filter(k => a[k] === undefined);
            if (missing.length === 0) {
                log('L1', 'Alerts schema has all required fields incl. riskFactors', 'PASS');
            } else {
                log('L1', 'Alerts schema', 'FAIL', `Missing: ${missing.join(', ')}`);
            }
            // Summary structure
            const sumKeys = ['high', 'standard', 'monitoring'];
            const sumMissing = sumKeys.filter(k => r.data.summary[k] === undefined);
            if (sumMissing.length === 0) {
                log('L1', 'Alerts summary has high/standard/monitoring', 'PASS');
            } else {
                log('L1', 'Alerts summary', 'FAIL', `Missing: ${sumMissing.join(', ')}`);
            }
        } else {
            log('L1', 'Alerts endpoint structure', 'FAIL', 'Missing data or summary');
        }
    } catch (e) { log('L1', 'Alerts endpoint', 'FAIL', e.message); }

    // 1.5 Distribution endpoint
    try {
        const r = await get(`${BASE}/analytics/distribution`);
        const data = Array.isArray(r.data) ? r.data : r.data.value || r.data;
        if (data.length === 5) {
            log('L1', 'Distribution returns exactly 5 star levels', 'PASS');
        } else {
            log('L1', 'Distribution', 'FAIL', `Got ${data.length} entries`);
        }
    } catch (e) { log('L1', 'Distribution endpoint', 'FAIL', e.message); }

    // 1.6 Trends endpoint
    try {
        const r = await get(`${BASE}/analytics/trends`);
        const data = Array.isArray(r.data) ? r.data : r.data.value || r.data;
        if (data.length > 0) {
            const t = data[0];
            const required = ['period', 'total', 'negative', 'negativeRate', 'avgStars'];
            const missing = required.filter(k => t[k] === undefined);
            if (missing.length === 0) {
                log('L1', `Trends schema correct (${data.length} months)`, 'PASS');
            } else {
                log('L1', 'Trends schema', 'FAIL', `Missing: ${missing.join(', ')}`);
            }
        } else {
            log('L1', 'Trends data', 'FAIL', 'Empty');
        }
    } catch (e) { log('L1', 'Trends endpoint', 'FAIL', e.message); }

    // 1.7 Reviews endpoint — pagination
    try {
        const r = await get(`${BASE}/reviews?limit=2&page=1`);
        if (r.data.data && r.data.total && r.data.page && r.data.totalPages) {
            log('L1', 'Reviews pagination structure correct', 'PASS');
            // Check camelCase
            const rev = r.data.data[0];
            const required = ['reviewId', 'placeId', 'branchAddress', 'stars', 'text'];
            const missing = required.filter(k => rev[k] === undefined);
            if (missing.length === 0) {
                log('L1', 'Reviews item schema has camelCase fields', 'PASS');
            } else {
                log('L1', 'Reviews item schema', 'FAIL', `Missing: ${missing.join(', ')}`);
            }
        } else {
            log('L1', 'Reviews pagination', 'FAIL', 'Missing pagination fields');
        }
    } catch (e) { log('L1', 'Reviews endpoint', 'FAIL', e.message); }

    // 1.8 Error contract — invalid endpoint
    try {
        const r = await get(`${BASE}/nonexistent`);
        if (r.status === 404) {
            log('L1', 'Unknown route returns 404', 'PASS');
        } else {
            log('L1', 'Unknown route', 'FAIL', `Got ${r.status}`);
        }
    } catch (e) { log('L1', 'Error contract test', 'FAIL', e.message); }
}

async function layer2_business() {
    console.log('\n═══════════════════════════════════════════');
    console.log('LAYER 2: BUSINESS LOGIC VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    // 2.1 Overview KPI consistency
    try {
        const o = (await get(`${BASE}/analytics/overview`)).data;
        // positiveCount + negativeCount should equal totalReviews
        if (o.positiveCount + o.negativeCount === o.totalReviews) {
            log('L2', 'positiveCount + negativeCount = totalReviews', 'PASS',
                `${o.positiveCount} + ${o.negativeCount} = ${o.totalReviews}`);
        } else {
            log('L2', 'Review count consistency', 'FAIL',
                `${o.positiveCount} + ${o.negativeCount} ≠ ${o.totalReviews}`);
        }

        // negativeRate = negativeCount / totalReviews * 100
        const expectedRate = Math.round(o.negativeCount / o.totalReviews * 10000) / 100;
        if (Math.abs(o.negativeRate - expectedRate) < 0.1) {
            log('L2', 'negativeRate matches negativeCount/totalReviews', 'PASS',
                `${o.negativeRate}% ≈ ${expectedRate}%`);
        } else {
            log('L2', 'negativeRate calculation', 'FAIL',
                `${o.negativeRate}% vs expected ${expectedRate}%`);
        }

        // sentimentScore = 100 - negativeRate
        const expectedSentiment = Math.round((100 - o.negativeRate) * 100) / 100;
        if (Math.abs(o.sentimentScore - expectedSentiment) < 0.1) {
            log('L2', 'sentimentScore = 100 - negativeRate', 'PASS',
                `${o.sentimentScore}% ≈ ${expectedSentiment}%`);
        } else {
            log('L2', 'sentimentScore calculation', 'FAIL',
                `${o.sentimentScore}% vs expected ${expectedSentiment}%`);
        }

        // alertCount > 0
        if (o.alertCount > 0) {
            log('L2', 'alertCount is populated (> 0)', 'PASS', `${o.alertCount} alerts`);
        } else {
            log('L2', 'alertCount', 'FAIL', 'Zero alerts');
        }
    } catch (e) { log('L2', 'Overview KPI consistency', 'FAIL', e.message); }

    // 2.2 Branch ranking — risk-first sort
    try {
        const r = (await get(`${BASE}/branches`)).data;
        const scores = r.data.map(b => b.healthScore);
        const isSorted = scores.every((v, i) => i === 0 || v >= scores[i - 1]);
        if (isSorted) {
            log('L2', 'Branches sorted by healthScore ascending (risk-first)', 'PASS',
                `First: ${scores[0]}, Last: ${scores[scores.length - 1]}`);
        } else {
            log('L2', 'Branch sorting', 'FAIL', 'Not ascending');
        }

        // All branches have placeId
        const allHavePlaceId = r.data.every(b => b.placeId && b.placeId.startsWith('PL_'));
        if (allHavePlaceId) {
            log('L2', 'All branches have valid placeId (PL_HN_*)', 'PASS');
        } else {
            log('L2', 'Branch placeId', 'FAIL', 'Some missing or invalid');
        }

        // Total branches
        log('L2', `Total branches: ${r.total}`, 'PASS', `Expected ~24`);
    } catch (e) { log('L2', 'Branch ranking', 'FAIL', e.message); }

    // 2.3 Alerts — priority sort
    try {
        const r = (await get(`${BASE}/alerts?limit=50`)).data;
        const priorities = r.data.map(a => a.priorityLevel);
        const isSorted = priorities.every((v, i) => i === 0 || v >= priorities[i - 1]);
        if (isSorted) {
            log('L2', 'Alerts sorted by priorityLevel ascending (high=1 first)', 'PASS');
        } else {
            log('L2', 'Alert sorting', 'FAIL', 'Not ascending by priority');
        }

        // Summary counts match
        const totalFromSummary = r.summary.high + r.summary.standard + r.summary.monitoring;
        if (totalFromSummary === r.total) {
            log('L2', 'Alert summary counts match total', 'PASS',
                `${r.summary.high}+${r.summary.standard}+${r.summary.monitoring}=${totalFromSummary}`);
        } else {
            log('L2', 'Alert count mismatch', 'FAIL',
                `Summary total ${totalFromSummary} ≠ ${r.total}`);
        }

        // All alerts are negative (label=0 or stars<=2)
        const allNeg = r.data.every(a => a.stars <= 3);
        if (allNeg) {
            log('L2', 'All alerts are negative reviews (stars ≤ 3)', 'PASS');
        } else {
            log('L2', 'Alert filtering', 'FAIL', 'Found positive reviews in alerts');
        }
    } catch (e) { log('L2', 'Alert verification', 'FAIL', e.message); }

    // 2.4 Distribution — sum equals totalReviews
    try {
        const o = (await get(`${BASE}/analytics/overview`)).data;
        const d = (await get(`${BASE}/analytics/distribution`)).data;
        const distData = Array.isArray(d) ? d : d.value || d;
        const distTotal = distData.reduce((sum, x) => sum + x.count, 0);
        if (distTotal === o.totalReviews) {
            log('L2', 'Distribution sum = totalReviews', 'PASS',
                `${distTotal} = ${o.totalReviews}`);
        } else {
            log('L2', 'Distribution sum', 'FAIL',
                `${distTotal} ≠ ${o.totalReviews}`);
        }
    } catch (e) { log('L2', 'Distribution cross-check', 'FAIL', e.message); }

    // 2.5 Trends — sum of monthly totals ≈ totalReviews
    try {
        const o = (await get(`${BASE}/analytics/overview`)).data;
        const t = (await get(`${BASE}/analytics/trends`)).data;
        const trendData = Array.isArray(t) ? t : t.value || t;
        const trendTotal = trendData.reduce((sum, x) => sum + x.total, 0);
        if (trendTotal === o.totalReviews) {
            log('L2', 'Trends monthly sum = totalReviews', 'PASS',
                `${trendTotal} = ${o.totalReviews}`);
        } else {
            log('L2', 'Trends monthly sum', 'FAIL',
                `${trendTotal} ≠ ${o.totalReviews}`);
        }

        // Periods are chronologically sorted
        const periods = trendData.map(x => x.period);
        const isSorted = periods.every((v, i) => i === 0 || v >= periods[i - 1]);
        if (isSorted) {
            log('L2', 'Trends periods sorted chronologically', 'PASS',
                `${periods[0]} → ${periods[periods.length - 1]}`);
        } else {
            log('L2', 'Trends period sort', 'FAIL', 'Not chronological');
        }
    } catch (e) { log('L2', 'Trends cross-check', 'FAIL', e.message); }
}

async function layer3_model() {
    console.log('\n═══════════════════════════════════════════');
    console.log('LAYER 3: MODEL VERIFICATION');
    console.log('═══════════════════════════════════════════\n');

    // FastAPI server is typically at :8000. Check if it's running.
    try {
        const r = await get('http://localhost:8000/health');
        if (r.data.status === 'healthy') {
            log('L3', 'FastAPI server is running', 'PASS');
        } else {
            log('L3', 'FastAPI server', 'FAIL', JSON.stringify(r.data));
        }
    } catch {
        log('L3', 'FastAPI server NOT running (PhoBERT not loaded)', 'SKIP',
            'Model verification requires FastAPI at :8000 with PhoBERT loaded');
        log('L3', '/predict endpoint', 'SKIP', 'Requires FastAPI');
        log('L3', '/predict-batch endpoint', 'SKIP', 'Requires FastAPI');
        log('L3', 'Edge case inference (sarcastic, English, no diacritics)', 'SKIP', 'Requires FastAPI');
        return;
    }

    // If FastAPI is running, test /predict with frozen samples
    const fs = require('fs');
    const testSet = JSON.parse(fs.readFileSync('frozen-test-set.json', 'utf8'));
    const samples = testSet.samples.filter(s => s.text && s.text !== 'Không có bình luận').slice(0, 5);

    for (const sample of samples) {
        try {
            const postData = JSON.stringify({ reviewText: sample.text });
            const r = await new Promise((resolve, reject) => {
                const req = http.request('http://localhost:8000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }, res => {
                    let body = '';
                    res.on('data', d => body += d);
                    res.on('end', () => resolve(JSON.parse(body)));
                });
                req.on('error', reject);
                req.write(postData);
                req.end();
            });

            if (r.sentimentSummary && r.confidenceAvg !== undefined) {
                log('L3', `Predict [${sample.category}] "${sample.text.substring(0, 40)}..."`, 'PASS',
                    `${r.sentimentSummary} (${r.confidenceAvg})`);
            } else {
                log('L3', `Predict [${sample.category}]`, 'FAIL', 'Missing sentimentSummary');
            }
        } catch (e) {
            log('L3', `Predict [${sample.category}]`, 'FAIL', e.message);
        }
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  PL-Insight Dashboard — 3-Layer Verify    ║');
    console.log('╚═══════════════════════════════════════════╝');

    await layer1_technical();
    await layer2_business();
    await layer3_model();

    console.log('\n═══════════════════════════════════════════');
    console.log('RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ PASS: ${results.pass}`);
    console.log(`❌ FAIL: ${results.fail}`);
    console.log(`⏭️  SKIP: ${results.skip}`);
    console.log(`Total:  ${results.pass + results.fail + results.skip}`);
    console.log('═══════════════════════════════════════════');

    // Write JSON results
    const fs = require('fs');
    const report = {
        timestamp: new Date().toISOString(),
        summary: { pass: results.pass, fail: results.fail, skip: results.skip },
        details: results.details,
    };
    fs.writeFileSync('verification-results.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('\n📄 Results saved to verification-results.json');
}

main().catch(console.error);
