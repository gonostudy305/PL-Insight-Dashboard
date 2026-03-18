# Kiến trúc Hệ thống PL-Insight Dashboard

## Tổng quan

Hệ thống PL-Insight được thiết kế theo kiến trúc **microservices 4 lớp**, kết hợp **NGINX Load Balancer** để đảm bảo khả năng mở rộng (scalability) và tính sẵn sàng cao (high availability) cho tầng xử lý AI.

## Sơ đồ kiến trúc

```
                    ┌──────────────────────────────────────────────────────┐
                    │                   CLIENT LAYER                      │
                    │              Angular 19 (:4200)                     │
                    │         SPA + Lazy Loading + Route Guards           │
                    └──────────────────┬───────────────────────────────────┘
                                       │ HTTP + JWT Bearer Token
                    ┌──────────────────▼───────────────────────────────────┐
                    │              NGINX LOAD BALANCER (:80)               │
                    │         Reverse Proxy + Round-Robin Balancing        │
                    ├─────────────────┬───────────────────┬────────────────┤
                    │    /api/*       │                   │    /ai/*       │
                    │                 │                   │                │
              ┌─────▼─────┐          │          ┌────────▼────────┐       │
              │  Node.js  │          │          │  upstream pool  │       │
              │  Express  │          │          │  (round-robin)  │       │
              │  (:3000)  │          │          ├────────┬────────┤       │
              └─────┬─────┘          │     ┌────▼───┐ ┌──▼─────┐ │       │
                    │                │     │Worker 1│ │Worker 2│ │       │
                    │                │     │ :8000  │ │ :8001  │ │       │
                    │                │     │FastAPI │ │FastAPI │ │       │
                    │                │     │PhoBERT │ │PhoBERT │ │       │
                    │                │     └────────┘ └────────┘ │       │
                    │                │                           │       │
                    └──────────┬─────┴───────────────────────────┘       │
                               │                                         │
                    ┌──────────▼─────────────────────────────────────────┐
                    │              MONGODB ATLAS (Cloud)                  │
                    │         Database: PhucLong_Hanoi                    │
                    │    Collection: Master_Final_Analysis (6,350 docs)   │
                    └────────────────────────────────────────────────────┘
```

## Chi tiết từng lớp

### Lớp 1: Client — Angular 19

| Thành phần | Mô tả |
|---|---|
| Framework | Angular 19 (Standalone Components) |
| Routing | Lazy Loading + `authGuard` bảo vệ toàn bộ route |
| Auth | JWT token lưu `localStorage`, tự động gắn qua HTTP Interceptor |
| Giao diện | 6 trang: Dashboard, Live Monitor, Analytics, Reviews, Alerts, Branch Detail |

### Lớp 2: NGINX Load Balancer

| Cấu hình | Giá trị |
|---|---|
| Thuật toán | **Round-Robin** (mặc định, phân phối đều request) |
| Upstream pool | 2 FastAPI workers (port 8000, 8001) |
| Retry policy | `proxy_next_upstream error timeout http_502 http_503` |
| Timeout | Connect: 30s, Read: 60s (PhoBERT inference có thể mất 5-10s) |
| Failover | Nếu worker fail → tự động chuyển sang worker còn lại |

**Tại sao cần Load Balancer?**

PhoBERT inference là tác vụ tính toán nặng (~500ms–2s/request). Khi Live Monitor scan hàng loạt review cùng lúc, một FastAPI instance duy nhất sẽ tạo **bottleneck**. NGINX phân phối request đều giữa các worker, giúp:

- **Tăng throughput**: Xử lý song song nhiều request predict
- **Tăng availability**: Worker 1 fail → NGINX tự động route sang Worker 2
- **Dễ scale**: Thêm worker chỉ cần thêm 1 dòng trong `upstream` block

### Lớp 3: Backend Services

#### Node.js / Express (API Server)

| Endpoint | Chức năng |
|---|---|
| `POST /api/auth/login` | Xác thực JWT (bcrypt) |
| `GET /api/analytics/*` | Thống kê, heatmap, keywords |
| `GET /api/reviews` | Danh sách review (filter, pagination) |
| `POST /api/live-monitor/scan` | Gọi PhoBERT qua AI Server |
| `POST /api/alerts/scan` | Trigger engine + Telegram notification |
| `GET /api/branches/:placeId` | KPI chi nhánh, xu hướng, review |

Middleware xác thực JWT được áp dụng trên **toàn bộ** endpoint (trừ `/api/health` và `/api/auth/login`).

#### FastAPI / PhoBERT (AI Server)

| Endpoint | Chức năng |
|---|---|
| `GET /health` | Kiểm tra trạng thái model |
| `POST /predict` | Phân tích cảm xúc (PhoBERT inference) |
| `POST /batch-predict` | Phân tích hàng loạt |

Mỗi worker load model PhoBERT-base (~540MB) vào RAM riêng biệt, đảm bảo isolation giữa các request.

### Lớp 4: MongoDB Atlas

| Thông số | Giá trị |
|---|---|
| Provider | MongoDB Atlas (M0 Free Tier) |
| Database | `PhucLong_Hanoi` |
| Collection chính | `Master_Final_Analysis` (6,350 documents) |
| Collection phụ | `alert_history` (cảnh báo) |
| Indexes | `placeId`, `reviewId` (unique), `publishedAtDate` |

## Luồng dữ liệu chính

### 1. Luồng đăng nhập
```
Browser → Angular → POST /api/auth/login → Node.js → bcrypt verify → JWT token → localStorage
```

### 2. Luồng xem Dashboard
```
Browser → Angular → GET /api/analytics/* → [JWT verify] → Node.js → MongoDB aggregation → JSON response
```

### 3. Luồng phân tích cảm xúc (có Load Balancing)
```
Browser → Angular → POST /api/live-monitor/scan
  → Node.js → POST http://localhost:8000/predict ──→ NGINX LB
                                                       ├── Worker 1 (:8000) → PhoBERT inference
                                                       └── Worker 2 (:8001) → PhoBERT inference
  → Kết quả → Node.js → Lưu MongoDB → Response
```

### 4. Luồng cảnh báo thông minh
```
POST /api/alerts/scan → Trigger Engine (>3 negative/1h)
  → Tạo alert → alert_history collection
  → sendNotification() → Telegram Bot API → Quản lý nhận cảnh báo
```

## Cấu hình NGINX

```nginx
# Load Balancer cho PhoBERT workers
upstream phobert_workers {
    server 127.0.0.1:8000;    # Worker 1
    server 127.0.0.1:8001;    # Worker 2
}

server {
    listen 80;

    # AI endpoints → Load Balanced
    location /ai/ {
        proxy_pass http://phobert_workers/;
        proxy_next_upstream error timeout http_502 http_503;
    }

    # API endpoints → Node.js
    location /api/ {
        proxy_pass http://nodejs_backend/api/;
    }
}
```

## Khởi động hệ thống

```bash
# Cách 1: Script tự động (Windows)
start-all.bat         # Khởi động 4 services
stop-all.bat          # Tắt tất cả

# Cách 2: Thủ công
node server.js                                          # Node.js (:3000)
python -m uvicorn main:app --port 8000 --workers 1      # Worker 1
python -m uvicorn main:app --port 8001 --workers 1      # Worker 2
cd nginx && nginx.exe                                   # NGINX (:80)
npx ng serve --port 4200                                # Angular (:4200)
```

## Bảo mật

| Lớp | Biện pháp |
|---|---|
| Authentication | JWT (24h expiry) + bcrypt password hash |
| Authorization | Route guard (Angular) + Middleware (Express) |
| API Protection | Tất cả endpoint yêu cầu Bearer token |
| Auto-logout | HTTP Interceptor tự động logout khi nhận 401 |
| Secrets | `.env` không commit, `.gitignore` bảo vệ |

## Công nghệ sử dụng

| Layer | Technology | Version |
|---|---|---|
| Frontend | Angular | 19 |
| Backend API | Node.js + Express | 18+ |
| AI Server | FastAPI + Uvicorn | 0.100+ |
| NLP Model | PhoBERT-base (vinai) | — |
| Load Balancer | NGINX | 1.27.4 |
| Database | MongoDB Atlas | 7.0 |
| Notification | Telegram Bot API | — |
