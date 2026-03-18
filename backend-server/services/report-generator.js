/**
 * PDF Report Generator
 * Renders HTML report templates using Puppeteer → PDF
 * Uses page.emulateMediaType('screen') for dashboard-style colors
 */
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

/**
 * Gather all data needed for a report
 * @param {object} db - MongoDB database instance
 * @param {number} days - Number of days to look back
 */
async function gatherReportData(db, days) {
    const col = db.collection('Master_Final_Analysis');
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoff.toISOString();

    // Overview KPIs
    const [overview] = await col.aggregate([
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgStars: { $avg: '$stars' },
                positiveCount: { $sum: { $cond: [{ $eq: ['$label', 1] }, 1, 0] } },
                negativeCount: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                respondedCount: { $sum: { $cond: [{ $eq: ['$is_responded', 1] }, 1, 0] } },
            }
        },
    ]).toArray();

    const totalReviews = overview?.totalReviews || 0;
    const negativeRate = totalReviews > 0 ? Math.round(overview.negativeCount / totalReviews * 10000) / 100 : 0;
    const responseRate = totalReviews > 0 ? Math.round(overview.respondedCount / totalReviews * 10000) / 100 : 0;
    const avgStars = overview?.avgStars ? Math.round(overview.avgStars * 100) / 100 : 0;

    // District risk summary
    const DISTRICT_MAP = {
        'Go Vap': null, 'Hanoi City': null, 'Hanoi': null,
        'Hai Bà Trưng District': 'Hai Bà Trưng',
    };

    const rawDistricts = await col.aggregate([
        { $match: { district: { $exists: true, $ne: null } } },
        {
            $group: {
                _id: '$district',
                totalReviews: { $sum: 1 },
                negativeCount: { $sum: { $cond: [{ $eq: ['$label', 0] }, 1, 0] } },
                avgStars: { $avg: '$stars' },
            }
        },
    ]).toArray();

    const merged = {};
    for (const d of rawDistricts) {
        let name = d._id;
        if (name in DISTRICT_MAP) name = DISTRICT_MAP[name] || 'Khác';
        if (!merged[name]) merged[name] = { totalReviews: 0, negativeCount: 0, starSum: 0 };
        merged[name].totalReviews += d.totalReviews;
        merged[name].negativeCount += d.negativeCount;
        merged[name].starSum += d.avgStars * d.totalReviews;
    }

    const districts = Object.entries(merged).map(([district, d]) => {
        const negRate = d.totalReviews > 0 ? Math.round(d.negativeCount / d.totalReviews * 10000) / 100 : 0;
        const avg = d.totalReviews > 0 ? Math.round((d.starSum / d.totalReviews) * 100) / 100 : 0;
        const risk = Math.round(negRate * Math.log2(d.totalReviews + 1) * 100) / 100;
        return { district, totalReviews: d.totalReviews, negativeRate: negRate, avgStars: avg, riskScore: risk };
    }).sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);

    // Top keywords
    const KEYWORD_GROUPS = {
        'Nhân viên': ['nhân viên', 'phục vụ', 'thái độ', 'staff'],
        'Chờ lâu': ['đợi', 'chờ', 'lâu', 'chậm', 'wait', 'slow'],
        'Chất lượng': ['dở', 'tệ', 'chất lượng', 'nhạt', 'không ngon'],
        'Không gian': ['không gian', 'chỗ ngồi', 'chật', 'ồn'],
        'Vệ sinh': ['bẩn', 'vệ sinh', 'sạch', 'ruồi', 'kiến'],
        'Giá cả': ['giá', 'đắt', 'mắc', 'expensive'],
        'Order sai': ['order sai', 'sai', 'nhầm', 'thiếu'],
        'Đồ uống': ['nước', 'trà', 'cà phê', 'coffee'],
    };

    const negativeReviews = await col.find({
        label: 0, text: { $ne: 'Không có bình luận', $exists: true },
    }).project({ text: 1 }).toArray();

    const keywordCounts = {};
    for (const [cat] of Object.entries(KEYWORD_GROUPS)) keywordCounts[cat] = 0;
    for (const review of negativeReviews) {
        const text = (review.text || '').toLowerCase();
        for (const [cat, patterns] of Object.entries(KEYWORD_GROUPS)) {
            if (patterns.some(p => text.includes(p))) keywordCounts[cat]++;
        }
    }

    const keywords = Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .filter(k => k.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Alert summary
    const alertsCol = db.collection('alert_history');
    const alertCounts = {
        total: await alertsCol.countDocuments(),
        new: await alertsCol.countDocuments({ status: 'new' }),
        acknowledged: await alertsCol.countDocuments({ status: 'acknowledged' }),
        resolved: await alertsCol.countDocuments({ status: 'resolved' }),
    };

    return {
        reportDate: new Date().toLocaleDateString('vi-VN'),
        periodLabel: days === 7 ? 'Tuần' : 'Tháng',
        periodDays: days,
        totalReviews, avgStars, negativeRate, responseRate,
        negativeCount: overview?.negativeCount || 0,
        positiveCount: overview?.positiveCount || 0,
        districts, keywords, alertCounts,
    };
}

/**
 * Build HTML report string
 */
function buildReportHTML(data) {
    const maxKwCount = Math.max(...data.keywords.map(k => k.count), 1);

    const districtRows = data.districts.map(d => {
        const negColor = d.negativeRate > 40 ? '#ef4444' : d.negativeRate > 25 ? '#f59e0b' : '#22c55e';
        return `<tr>
            <td style="font-weight:600">${d.district}</td>
            <td style="text-align:center">${d.totalReviews}</td>
            <td style="text-align:center;color:${negColor};font-weight:700">${d.negativeRate}%</td>
            <td style="text-align:center">${d.avgStars}</td>
            <td style="text-align:center;font-weight:700">${d.riskScore}</td>
        </tr>`;
    }).join('');

    const keywordBars = data.keywords.map(k => {
        const width = Math.round((k.count / maxKwCount) * 100);
        return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="width:90px;text-align:right;font-size:13px;font-weight:500">${k.keyword}</span>
            <div style="flex:1;height:20px;background:#f1f5f9;border-radius:4px;overflow:hidden">
                <div style="width:${width}%;height:100%;background:linear-gradient(90deg,#ef4444,#f87171);border-radius:4px"></div>
            </div>
            <span style="font-size:13px;font-weight:700;color:#64748b;min-width:40px">${k.count}</span>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #0f172a; background: #fff; padding: 40px; font-size: 14px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #0C713D; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-icon { width: 40px; height: 40px; background: #0C713D; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
        .brand-name { font-size: 22px; font-weight: 800; color: #0C713D; }
        .brand-sub { font-size: 12px; color: #64748b; }
        .meta { text-align: right; font-size: 12px; color: #64748b; }
        .meta strong { color: #0f172a; }
        h2 { font-size: 16px; font-weight: 700; color: #0C713D; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
        .kpi-value { font-size: 28px; font-weight: 800; color: #0C713D; }
        .kpi-value.danger { color: #ef4444; }
        .kpi-value.warning { color: #f59e0b; }
        .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:hover { background: #f8fafc; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .alert-summary { display: flex; gap: 12px; margin-bottom: 16px; }
        .alert-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .pill-new { background: #fef2f2; color: #ef4444; }
        .pill-ack { background: #fffbeb; color: #f59e0b; }
        .pill-res { background: #ecfdf5; color: #059669; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <div class="brand-icon">PL</div>
            <div>
                <div class="brand-name">PL-Insight Dashboard</div>
                <div class="brand-sub">Phúc Long Coffee & Tea — Hà Nội</div>
            </div>
        </div>
        <div class="meta">
            <div>Báo cáo <strong>${data.periodLabel}</strong></div>
            <div>Ngày xuất: <strong>${data.reportDate}</strong></div>
            <div>Kỳ: <strong>${data.periodDays} ngày gần nhất</strong></div>
            <div>Nguồn: Google Maps Reviews</div>
        </div>
    </div>

    <h2>Tổng quan KPI</h2>
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-value">${data.totalReviews.toLocaleString()}</div>
            <div class="kpi-label">Tổng review</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value warning">${data.avgStars}</div>
            <div class="kpi-label">Sao trung bình</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value danger">${data.negativeRate}%</div>
            <div class="kpi-label">Tỷ lệ tiêu cực</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.responseRate}%</div>
            <div class="kpi-label">Tỷ lệ phản hồi</div>
        </div>
    </div>

    <div class="grid-2">
        <div>
            <h2>Bảng nhiệt rủi ro theo Quận (Top 10)</h2>
            <table>
                <thead>
                    <tr><th>Quận</th><th>Reviews</th><th>Neg Rate</th><th>Sao TB</th><th>Risk Score</th></tr>
                </thead>
                <tbody>${districtRows}</tbody>
            </table>
        </div>
        <div>
            <h2>Từ khóa phàn nàn chính</h2>
            <div style="margin-top:12px">${keywordBars}</div>
        </div>
    </div>

    <h2>Tình trạng cảnh báo</h2>
    <div class="alert-summary">
        <span class="alert-pill pill-new">🔴 Mới: ${data.alertCounts.new}</span>
        <span class="alert-pill pill-ack">🟡 Đã xác nhận: ${data.alertCounts.acknowledged}</span>
        <span class="alert-pill pill-res">🟢 Đã xử lý: ${data.alertCounts.resolved}</span>
        <span class="alert-pill" style="background:#f1f5f9;color:#475569">Tổng: ${data.alertCounts.total}</span>
    </div>

    <div class="footer">
        <span>PL-Insight Dashboard v1.0 — Hệ thống giám sát chất lượng dịch vụ Phúc Long</span>
        <span>Bản quyền © 2026 — Đồ án Phân tích dữ liệu Web</span>
    </div>
</body>
</html>`;
}

/**
 * Generate PDF buffer from report HTML
 */
async function generatePDF(db, days) {
    const data = await gatherReportData(db, days);
    const html = buildReportHTML(data);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        });

        return pdf;
    } finally {
        await browser.close();
    }
}

/**
 * Generate Excel buffer from report data
 */
async function generateXLSX(db, days) {
    const data = await gatherReportData(db, days);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PL-Insight';

    // Overview Sheet
    const sheet1 = workbook.addWorksheet('Tổng quan');
    sheet1.columns = [
        { header: 'Chỉ số', key: 'metric', width: 30 },
        { header: 'Giá trị', key: 'value', width: 20 }
    ];
    sheet1.addRows([
        { metric: 'Kỳ báo cáo', value: `${data.periodDays} ngày gần nhất` },
        { metric: 'Ngày xuất', value: data.reportDate },
        { metric: 'Tổng đánh giá', value: data.totalReviews },
        { metric: 'Sao trung bình', value: data.avgStars },
        { metric: 'Tỷ lệ tiêu cực (%)', value: data.negativeRate },
        { metric: 'Tỷ lệ phản hồi (%)', value: data.responseRate },
        { metric: 'Cảnh báo mới', value: data.alertCounts.new },
        { metric: 'Cảnh báo đã xử lý', value: data.alertCounts.resolved }
    ]);
    // highlight header
    sheet1.getRow(1).font = { bold: true };

    // Districts Sheet
    const sheet2 = workbook.addWorksheet('Xếp hạng Chi nhánh');
    sheet2.columns = [
        { header: 'Khu vực / Quận', key: 'district', width: 30 },
        { header: 'Tổng đánh giá', key: 'total', width: 15 },
        { header: 'Tỷ lệ tiêu cực (%)', key: 'negRate', width: 18 },
        { header: 'Sao trung bình', key: 'avgStars', width: 15 },
        { header: 'Điểm rủi ro', key: 'risk', width: 15 }
    ];
    data.districts.forEach(d => {
        sheet2.addRow({
            district: d.district,
            total: d.totalReviews,
            negRate: d.negativeRate,
            avgStars: d.avgStars,
            risk: d.riskScore
        });
    });
    sheet2.getRow(1).font = { bold: true };

    // Keywords Sheet
    const sheet3 = workbook.addWorksheet('Từ khóa rủi ro');
    sheet3.columns = [
        { header: 'Từ khóa chủ đề', key: 'keyword', width: 30 },
        { header: 'Số lượt đề cập', key: 'count', width: 20 }
    ];
    data.keywords.forEach(k => {
        sheet3.addRow({
            keyword: k.keyword,
            count: k.count
        });
    });
    sheet3.getRow(1).font = { bold: true };

    // Buffer
    return await workbook.xlsx.writeBuffer();
}

module.exports = { generatePDF, generateXLSX, gatherReportData };
