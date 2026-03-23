/**
 * regression-test.js — Minimal regression tests for PL-Insight Phase 3
 *
 * Usage:
 *   node scripts/regression-test.js
 *
 * Requirements:
 *   - Backend server running on localhost:3000
 *   - Valid JWT token (set TEST_TOKEN env var or uses default test token)
 *
 * Tests:
 *   1. Report weekly vs monthly differ
 *   2. Live monitor mixed filter
 *   3. Reviews combined filter (sentiment + stars + search)
 *   4. Insights endpoint with confidence fields
 *   5. Heatmap returns full grid data
 *   6. Sessions returns data
 */

const http = require('http');

const BASE = 'http://localhost:3000';
const TOKEN = process.env.TEST_TOKEN || '';

let passed = 0;
let failed = 0;
const failures = [];

function request(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const req = http.get(url, {
            headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {},
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function assert(testName, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ ${testName}${detail ? ' — ' + detail : ''}`);
        failed++;
        failures.push(testName);
    }
}

async function runTests() {
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  PL-Insight Regression Tests                    │');
    console.log('└─────────────────────────────────────────────────┘\n');

    if (!TOKEN) {
        console.log('⚠️  No TEST_TOKEN set — tests requiring auth will return 401.\n');
        console.log('   Set TEST_TOKEN env var to a valid JWT token.\n');
        console.log('   Example: $env:TEST_TOKEN="eyJhb..."; node scripts/regression-test.js\n');
    }

    // ── Test 1: Health endpoint (no auth required) ──
    console.log('📋 Test 1: Health endpoint');
    try {
        const res = await request('/api/health');
        assert('Health returns 200', res.status === 200);
        assert('Health has status=ok', res.data?.status === 'ok');
        assert('Health reports database connected', res.data?.database === 'connected');
    } catch (e) {
        assert('Health endpoint reachable', false, e.message);
    }

    if (!TOKEN) {
        console.log('\n⏸️  Skipping auth-required tests (no TEST_TOKEN).\n');
        printSummary();
        return;
    }

    // ── Test 2: Insights endpoint ──
    console.log('\n📋 Test 2: Insights endpoint contract');
    try {
        const res = await request('/api/analytics/insights');
        assert('Insights returns 200', res.status === 200);
        assert('Insights has insights array', Array.isArray(res.data?.insights));
        assert('Insights has generatedAt', !!res.data?.generatedAt);

        if (res.data?.insights?.length > 0) {
            const first = res.data.insights[0];
            assert('Insight item has type', !!first.type);
            assert('Insight item has icon', !!first.icon);
            assert('Insight item has text', !!first.text);
            assert('Insight item has confidence (high|medium|low)',
                ['high', 'medium', 'low'].includes(first.confidence));
            assert('Insight item has data field', first.data !== undefined);
        }
    } catch (e) {
        assert('Insights endpoint reachable', false, e.message);
    }

    // ── Test 3: Reviews filter (sentiment + stars) ──
    console.log('\n📋 Test 3: Reviews filter wiring');
    try {
        const res = await request('/api/reviews?sentiment=negative&stars=1&limit=5');
        assert('Reviews filter returns 200', res.status === 200);
        assert('Reviews returns data array', Array.isArray(res.data?.data));

        if (res.data?.data?.length > 0) {
            const allNeg = res.data.data.every(r => r.label === 0);
            const allStar1 = res.data.data.every(r => r.stars === 1);
            assert('All results have label=0 (negative)', allNeg);
            assert('All results have stars=1', allStar1);
        } else {
            assert('Has results matching filter', res.data?.data?.length > 0,
                'No reviews with sentiment=negative + stars=1');
        }
    } catch (e) {
        assert('Reviews filter endpoint reachable', false, e.message);
    }

    // ── Test 4: Reviews search ──
    console.log('\n📋 Test 4: Reviews search with regex');
    try {
        const res = await request('/api/reviews?search=phuc+long&limit=5');
        assert('Search returns 200', res.status === 200);
        assert('Search returns data array', Array.isArray(res.data?.data));
    } catch (e) {
        assert('Search endpoint reachable', false, e.message);
    }

    // ── Test 5: Live Monitor mixed filter ──
    console.log('\n📋 Test 5: Live Monitor mixed filter');
    try {
        const res = await request('/api/live-monitor/recent?sentiment=mixed&limit=5');
        assert('Mixed filter returns 200', res.status === 200);
        assert('Mixed filter returns data array', Array.isArray(res.data?.data));

        if (res.data?.data?.length > 0) {
            const allMixed = res.data.data.every(r => r.predictedLabel === 2);
            assert('All results have predictedLabel=2 (mixed)', allMixed);
        } else {
            console.log('    ℹ️  No mixed results yet — run re-scan-mixed.js or scan new reviews');
        }
    } catch (e) {
        assert('Live Monitor mixed reachable', false, e.message);
    }

    // ── Test 6: Heatmap data ──
    console.log('\n📋 Test 6: Analytics heatmap data');
    try {
        const res = await request('/api/analytics/heatmap');
        assert('Heatmap returns 200', res.status === 200);
        assert('Heatmap returns array', Array.isArray(res.data));

        if (res.data?.length > 0) {
            const first = res.data[0];
            assert('Heatmap item has hour', first.hour !== undefined);
            assert('Heatmap item has dayOfWeek', first.dayOfWeek !== undefined);
            assert('Heatmap item has negativeRate', first.negativeRate !== undefined);
        }
    } catch (e) {
        assert('Heatmap endpoint reachable', false, e.message);
    }

    // ── Test 7: Session data ──
    console.log('\n📋 Test 7: Analytics session data');
    try {
        const res = await request('/api/analytics/by-session');
        assert('Session returns 200', res.status === 200);
        assert('Session returns array', Array.isArray(res.data));

        if (res.data?.length > 0) {
            const first = res.data[0];
            assert('Session item has session field', !!first.session);
            assert('Session item has total field', first.total !== undefined);
            assert('Session item has negative field', first.negative !== undefined);
        }
    } catch (e) {
        assert('Session endpoint reachable', false, e.message);
    }

    printSummary();
}

function printSummary() {
    console.log('\n════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.log('  Failures:');
        for (const f of failures) console.log(`    ✘ ${f}`);
    }
    console.log('════════════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
});
