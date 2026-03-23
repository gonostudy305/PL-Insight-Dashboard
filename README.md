# PL-Insight Dashboard

**Hệ thống phân tích cảm xúc khách hàng — Phúc Long Coffee & Tea (Hà Nội)**

> Biến 6,350 đánh giá Google Maps thành Actionable Insights bằng PhoBERT AI.

---

## Kiến trúc

```
Angular 19 (:4200)  →  Node.js/Express (:3000)  →  FastAPI/PhoBERT (:8000)
                              ↕
                        MongoDB Atlas
```

| Layer | Stack | Vai trò |
|---|---|---|
| Frontend | Angular 19, Chart.js | Dashboard, Live Monitor, Analytics, Alerts, Branch Detail |
| Backend | Node.js, Express | REST API, Trigger Engine, Business Logic |
| AI Server | FastAPI, PhoBERT | Sentiment prediction, keyword extraction |
| Database | MongoDB Atlas | `Master_Final_Analysis`, `alert_history` |

---

## Cài đặt & Chạy

### 1. Clone repo

```bash
git clone https://github.com/gonostudy305/PL-Insight-Dashboard.git
cd PL-Insight-Dashboard
```

### 2. Cấu hình environment

```bash
cp backend-server/.env.example backend-server/.env
# Sửa MONGO_URI, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID trong .env
```

### 3. Cài dependencies

```bash
# Backend Node.js
cd backend-server && npm install

# Frontend Angular
cd ../frontend-web && npm install

# AI Server (cần Python 3.9+)
cd ../backend-ai && pip install -r requirements.txt
```

### 4. Copy model PhoBERT

```bash
# Copy thư mục best_phobert_phuclong vào backend-ai/model/
# File model (~540MB) không có trên GitHub, cần copy từ Google Drive hoặc local
```

### 5. Chạy 3 server

```bash
# Terminal 1: AI Server
cd backend-ai
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# Terminal 2: Backend
cd backend-server
node server.js

# Terminal 3: Frontend
cd frontend-web
npx ng serve --port 4200
```

### 6. Mở trình duyệt

```
http://localhost:4200
```

---

## Các phân hệ

| Phân hệ | Route | Mô tả |
|---|---|---|
| Dashboard | `/dashboard` | KPI, trend chart, star distribution, branch ranking, **insight tự động** |
| Live Monitor | `/live-monitor` | AI inference thời gian thực, polling 30s, **filter Mixed** |
| Analytics | `/analytics` | District heatmap, keyword cloud, trend filters, **hour×day heatmap, session chart** |
| Alerts | `/alerts` | Trigger engine, alert history, status workflow |
| Branch Detail | `/branches/:placeId` | KPI riêng, trend, star dist, top issues, reviews |
| Reviews | `/reviews` | Danh sách review phân trang, **filter sentiment/stars/search** |

---

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/analytics/overview` | KPI tổng quan |
| GET | `/api/analytics/distribution` | Phân bố sao |
| GET | `/api/analytics/trends` | Xu hướng theo tháng |
| GET | `/api/analytics/district-heatmap` | Heatmap theo quận |
| GET | `/api/analytics/keywords` | Từ khóa phàn nàn |
| GET | `/api/analytics/heatmap` | Negative rate theo giờ × ngày |
| GET | `/api/analytics/by-session` | Phân bố review theo ca |
| GET | `/api/analytics/insights` | **[NEW]** Insight narrative tự động (có confidence) |
| GET | `/api/branches` | Danh sách chi nhánh + KPI |
| GET | `/api/branches/:placeId` | Chi tiết chi nhánh (4 blocks + topIssues) |
| GET | `/api/alerts` | Priority queue |
| GET | `/api/alerts/history` | Alert history |
| POST | `/api/alerts/scan` | Trigger engine scan |
| PATCH | `/api/alerts/:alertId/status` | Cập nhật trạng thái alert |
| GET | `/api/live-monitor/recent` | Review đã phân tích AI (filter: **positive/negative/mixed**) |
| POST | `/api/live-monitor/scan` | Batch analyze unprocessed reviews |
| GET | `/api/reviews` | Review phân trang (filter: **sentiment, stars, search**) |
| GET | `/health` | FastAPI health check |
| POST | `/predict` | PhoBERT sentiment prediction |
| POST | `/predict-batch` | Batch prediction |

---

## Lưu ý quan trọng

- `label` = nhãn từ sao (KPI lịch sử), `predictedLabel` = PhoBERT output → **tách riêng, không trộn**
- `predictedLabel` mapping: `1` = Positive, `0` = Negative, `2` = Mixed
- F1-score là metric đánh giá mô hình, **không phải KPI vận hành**
- Telegram notifier active khi có `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` trong `.env`
- File model PhoBERT (~540MB) cần copy local, **không commit lên GitHub**
- **Mixed historical data**: reviews phân tích trước Phase 3 có thể lưu `predictedLabel=0` cho Mixed. Chạy `node scripts/re-scan-mixed.js` để sửa.

---

## Scripts tiện ích

| Script | Mô tả |
|---|---|
| `scripts/re-scan-mixed.js` | Fix Mixed lịch sử (hỗ trợ `--dry-run`) |
| `scripts/regression-test.js` | Regression test tối thiểu (7 nhóm test) |

---

## Commits mốc (Phase 2)

| Commit | Nội dung |
|---|---|
| Step 1 | Deploy FastAPI + PhoBERT, Layer 3 verified |
| Step 2 | Live Sentiment Monitor (polling, badges, scan) |
| Step 3+4 | Analytics page (District Heatmap + Keyword Cloud) |
| Step 5 | Smart Alert System (trigger, history, status) |
| Step 6 | Branch Detail page |
| Step 7 | Final polish + report |

### Phase 3 — Nâng cấp Insight & Fix Bugs

| Hạng mục | Mô tả |
|---|---|
| Fix report cutoff | `gatherReportData()` áp `$match timeFilter` cho tất cả query |
| Fix Mixed→2 | `predictedLabel` mapping 3 giá trị (0/1/2), filter mixed hoạt động |
| Filter Reviews | Backend nhận `sentiment`, `stars`, `search` (regex escape, `$or` text+branch) |
| Insight Narrative | `/api/analytics/insights` — 4 insight types, confidence flags, ngưỡng mẫu |
| Hour×Day Heatmap | Grid 24×7 pre-filled, color scale xanh→đỏ |
| Session Chart | Bar chart grouped, sort cố định Sáng→Trưa→Chiều→Tối |
| Empty States | Xử lý empty/error state cho Insight, Heatmap, Session panels |
| Migration Script | `scripts/re-scan-mixed.js` — fix Mixed lịch sử |
| Regression Tests | `scripts/regression-test.js` — 7 nhóm test |

---

## License

Academic project — PTDL Web, HK8.
