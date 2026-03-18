# PL-Insight Dashboard

**Hệ thống phân tích cảm xúc và quản trị phản hồi khách hàng — Phúc Long Coffee & Tea khu vực Hà Nội**

## 🏗️ Kiến trúc hệ thống

```
pl-insight-project/
├── backend-ai/          # Python FastAPI — PhoBERT model server
├── backend-server/      # Node.js Express — REST API + MongoDB
└── frontend-web/        # Angular 19 — Dashboard UI
```

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 19 | Dashboard UI, charts, KPIs |
| Backend API | Node.js + Express | REST API, MongoDB queries, proxy to AI |
| AI Server | Python FastAPI | PhoBERT inference, text preprocessing |
| Database | MongoDB Atlas | Review data, branch data, predictions |
| ML Model | PhoBERT (fine-tuned) | Vietnamese sentiment analysis (~92% accuracy) |

## 🚀 Quick Start

### 1. Backend AI (Python)
```bash
cd backend-ai
pip install -r requirements.txt
# Copy PhoBERT model files to ./model/
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backend Server (Node.js)
```bash
cd backend-server
npm install
npm run dev
```

### 3. Frontend (Angular)
```bash
cd frontend-web
npm install
ng serve
```

## 📊 Features

- **Live Sentiment Monitor**: Real-time review classification (Positive/Negative)
- **KPI Dashboard**: Sentiment Score, Health Score, Response Rate, Branch Ranking
- **Insight Analytics**: District heatmap, temporal trends, keyword cloud
- **Smart Alerts**: Priority-based alert system for critical negative reviews

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews` | GET | Paginated reviews with filters |
| `/api/branches` | GET | All branches with KPIs |
| `/api/analytics/overview` | GET | System-wide KPIs |
| `/api/analytics/trends` | GET | Monthly negative rate trends |
| `/api/analytics/heatmap` | GET | Hour × Weekday negative heatmap |
| `/predict` | POST | PhoBERT sentiment prediction |

## 🗃️ Database

MongoDB Atlas: `PhucLong_Hanoi`

**Collections**: `Master_Final_Analysis`, `Stores`, `Reviews`, `Reviewers`

---

*Đồ án cuối kỳ — Phân tích Dữ liệu Web*
