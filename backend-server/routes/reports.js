/**
 * /api/reports — PDF Report Generation
 * 
 * Endpoints:
 *   GET /weekly.pdf   — Weekly report (last 7 days)
 *   GET /monthly.pdf  — Monthly report (last 30 days)
 */
const { Router } = require('express');
const { generatePDF, generateXLSX } = require('../services/report-generator');
const router = Router();

// GET /api/reports/weekly.pdf
router.get('/weekly.pdf', async (req, res) => {
    try {
        const pdf = await generatePDF(req.db, 7);
        const filename = `PL-Insight_Weekly_${new Date().toISOString().slice(0, 10)}.pdf`;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': Buffer.byteLength(Buffer.from(pdf)),
        });
        res.send(Buffer.from(pdf));
    } catch (err) {
        console.error('[reports] Weekly PDF error:', err.message);
        res.status(500).json({ error: 'Lỗi tạo báo cáo', details: err.message });
    }
});

// GET /api/reports/monthly.pdf
router.get('/monthly.pdf', async (req, res) => {
    try {
        const pdf = await generatePDF(req.db, 30);
        const filename = `PL-Insight_Monthly_${new Date().toISOString().slice(0, 10)}.pdf`;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': Buffer.byteLength(Buffer.from(pdf)),
        });
        res.send(Buffer.from(pdf));
    } catch (err) {
        console.error('[reports] Monthly PDF error:', err.message);
        res.status(500).json({ error: 'Lỗi tạo báo cáo', details: err.message });
    }
});

// GET /api/reports/weekly.xlsx
router.get('/weekly.xlsx', async (req, res) => {
    try {
        const xlsx = await generateXLSX(req.db, 7);
        const filename = `PL-Insight_Weekly_${new Date().toISOString().slice(0, 10)}.xlsx`;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': Buffer.byteLength(xlsx),
        });
        res.send(xlsx);
    } catch (err) {
        console.error('[reports] Weekly XLSX error:', err.message);
        res.status(500).json({ error: 'Lỗi tạo báo cáo', details: err.message });
    }
});

// GET /api/reports/monthly.xlsx
router.get('/monthly.xlsx', async (req, res) => {
    try {
        const xlsx = await generateXLSX(req.db, 30);
        const filename = `PL-Insight_Monthly_${new Date().toISOString().slice(0, 10)}.xlsx`;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': Buffer.byteLength(xlsx),
        });
        res.send(xlsx);
    } catch (err) {
        console.error('[reports] Monthly XLSX error:', err.message);
        res.status(500).json({ error: 'Lỗi tạo báo cáo', details: err.message });
    }
});

module.exports = router;
