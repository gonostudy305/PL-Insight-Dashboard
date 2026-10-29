# PL-Insight Dashboard

[English Version](README.md) | **Tiếng Việt**

**Hệ thống phân tích cảm xúc khách hàng — Phúc Long Coffee & Tea (Hà Nội)**

> Biến 6,350 đánh giá Google Maps thành Actionable Insights bằng mô hình PhoBERT AI.

---

## Kiến trúc Hệ thống

```
Angular 19 (:4200)  →  NGINX (:80)  →  Node.js/Express (:3000)  →  FastAPI/PhoBERT (:8000)
                                                ↕
                                          MongoDB Atlas
```

| Layer | Stack | Vai trò |
|---|---|---|
| **Frontend** | Angular 19, Chart.js | Dashboard, Live Monitor, Analytics, Alerts, Branch Detail |
| **Load Balancer** | NGINX | Reverse Proxy, Round-Robin Upstream Pool cho AI Workers |
| **Backend** | Node.js, Express | REST API, Trigger Engine, Business Logic, JWT Auth |
| **AI Server** | FastAPI, PhoBERT | Sentiment prediction, keyword extraction, Vietnamese NLP |
| **Database** | MongoDB Atlas | Lưu trữ 6,350 reviews, phân loại cảm xúc và alert history |

---

## Cài đặt & Khởi chạy

### 1. Clone repository

```bash
git clone https://github.com/gonostudy305/PL-Insight-Dashboard.git
cd PL-Insight-Dashboard
```

### 2. Cấu hình Biến môi trường

```bash
# Backend Server
cp backend-server/.env.example backend-server/.env
# Điền MONGO_URI, JWT_SECRET, TELEGRAM_BOT_TOKEN trong backend-server/.env

# AI Server
cp backend-ai/.env.example backend-ai/.env
# Điền MONGO_URI, MODEL_PATH trong backend-ai/.env
```

### 3. Cài đặt Dependencies

```bash
# Backend Node.js
cd backend-server && npm install

# Frontend Angular
cd ../frontend-web && npm install

# AI Server (Python 3.10+)
cd ../backend-ai && pip install -r requirements.txt
```

### 4. Thiết lập Model PhoBERT

Copy thư mục model đã fine-tune vào `backend-ai/model/`.
*(File weights ~540MB không lưu trên GitHub theo chính sách quản lý mã nguồn)*.

### 5. Khởi chạy Hệ thống

Có thể dùng script tiện ích:
```cmd
start-all.bat
```
Hoặc chạy thủ công trên 3 terminal:

```bash
# Terminal 1: AI Server
cd backend-ai
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# Terminal 2: Backend API
cd backend-server
node server.js

# Terminal 3: Frontend Web
cd frontend-web
npx ng serve --port 4200
```

Truy cập dashboard: **`http://localhost:4200`**

---

## Các Phân hệ Chức năng

| Phân hệ | Route | Mô tả |
|---|---|---|
| **Dashboard** | `/dashboard` | KPI tổng quan, biểu đồ xu hướng, phân bố sao, xếp hạng chi nhánh, insight tự động |
| **Live Monitor** | `/live-monitor` | AI inference thời gian thực, polling 30s, phân loại cảm xúc (Tích cực/Tiêu cực/Hỗn hợp) |
| **Analytics** | `/analytics` | Heatmap quận huyện, word cloud từ khóa phàn nàn, heatmap giờ × ngày, biểu đồ ca làm việc |
| **Alerts** | `/alerts` | Trigger engine cảnh báo sự cố, lịch sử cảnh báo, tích hợp Telegram bot |
| **Branch Detail** | `/branches/:placeId` | Báo cáo chi tiết từng chi nhánh, KPI riêng, phân tích vấn đề nổi cộm |
| **Reviews** | `/reviews` | Tra cứu phản hồi phân trang, bộ lọc đa chiều (sao, cảm xúc, từ khóa) |

---

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/analytics/overview` | KPI tổng quan |
| GET | `/api/analytics/distribution` | Phân bố số sao đánh giá |
| GET | `/api/analytics/trends` | Xu hướng cảm xúc theo tháng |
| GET | `/api/analytics/district-heatmap` | Bản đồ nhiệt mật độ phản hồi theo quận |
| GET | `/api/analytics/keywords` | Trích xuất từ khóa phàn nàn phổ biến |
| GET | `/api/analytics/heatmap` | Tỷ lệ tiêu cực theo khung Giờ × Ngày trong tuần |
| GET | `/api/analytics/by-session` | Phân bố đánh giá theo ca phục vụ (Sáng/Trưa/Chiều/Tối) |
| GET | `/api/analytics/insights` | Tự động sinh nhận định thông minh (có độ tin cậy) |
| GET | `/api/branches` | Danh sách chi nhánh & KPI |
| GET | `/api/branches/:placeId` | Chi tiết hiệu suất chi nhánh |
| GET | `/api/alerts` | Hàng đợi cảnh báo ưu tiên |
| POST | `/api/alerts/scan` | Quét phát hiện sự cố bất thường |
| PATCH | `/api/alerts/:alertId/status` | Cập nhật quy trình xử lý cảnh báo |
| GET | `/api/live-monitor/recent` | Danh sách review vừa phân tích AI |
| POST | `/api/live-monitor/scan` | Quét phân tích hàng loạt đánh giá mới |
| GET | `/api/reviews` | Danh sách review phân trang & tìm kiếm |
| GET | `/health` | Kiểm tra trạng thái AI Server |
| POST | `/predict` | Dự đoán cảm xúc câu đơn qua PhoBERT |
| POST | `/predict-batch` | Dự đoán cảm xúc hàng loạt |

---

## Scripts Kiểm thử & Vận hành

| Script | Đường dẫn | Chức năng |
|---|---|---|
| `regression-test.js` | `backend-server/scripts/regression-test.js` | Chạy bộ kiểm thử hồi quy 7 nhóm chức năng API |
| `re-scan-mixed.js` | `backend-server/scripts/re-scan-mixed.js` | Chuẩn hóa dữ liệu nhãn Mixed lịch sử (hỗ trợ `--dry-run`) |

---

## Tác giả & Thông tin Dự án

- **Tác giả**: Huỳnh Văn Vũ ([@gonostudy305](https://github.com/gonostudy305))
- **Định vị**: MarTech Executive & E-commerce / Information Systems Student
- **Đơn vị đào tạo**: Trường Đại học Kinh tế - Luật (UEL), ĐHQG TP.HCM
- **LinkedIn**: [linkedin.com/in/huynhvanvu305](https://www.linkedin.com/in/huynhvanvu305/)
- **License**: MIT License (xem tệp [LICENSE](LICENSE))
