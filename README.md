# PL-Insight Dashboard

<p align="center">
  <strong>Enterprise-Grade Customer Feedback & Sentiment Analytics Platform</strong><br>
  <em>Transforming 6,350+ Google Maps Reviews into Operational Intelligence using PhoBERT, Angular 19, Node.js, and FastAPI</em>
</p>

<p align="center">
  <a href="https://angular.dev/"><img src="https://img.shields.io/badge/Frontend-Angular_19-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 19"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js_Express-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/AI_Engine-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://huggingface.co/vinai/phobert-base"><img src="https://img.shields.io/badge/NLP_Model-PhoBERT--base-yellow?style=flat-square" alt="PhoBERT"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB Atlas"></a>
  <a href="https://nginx.org/"><img src="https://img.shields.io/badge/Reverse_Proxy-NGINX-009639?style=flat-square&logo=nginx&logoColor=white" alt="NGINX"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
</p>

<p align="center">
  <strong>English</strong> | <a href="README_VN.md">Tiếng Việt</a>
</p>

---

## 📌 Executive Summary

**PL-Insight Dashboard** is an end-to-end sentiment analytics and business intelligence system built for food & beverage retail operations (analyzing **6,350+ real customer reviews** across Phúc Long Coffee & Tea branches in Hanoi).

Traditional customer feedback systems rely solely on star ratings, masking critical operational pain points (e.g., slow service, beverage inconsistency, parking constraints). PL-Insight solves this by bridging the gap between raw unstructured Vietnamese text and executive decision-making through fine-tuned state-of-the-art transformer NLP (**PhoBERT**), automated anomaly detection, and interactive spatial analytics.

---

## 🏗️ System Architecture

The platform is designed as a modular 4-tier microservices architecture with reverse-proxy load balancing for compute-intensive NLP inference:

```mermaid
flowchart TD
    Client["Client Tier<br/>Angular 19 (Standalone Components, Lazy-Loaded)"]
    
    subgraph Proxy["Load Balancer & Gateway"]
        Nginx["NGINX Reverse Proxy (:80)<br/>Round-Robin Upstream Pool & Failover"]
    end
    
    subgraph Services["Application & AI Services Tier"]
        NodeServer["Node.js / Express REST API (:3000)<br/>JWT Auth, Business Logic & Trigger Engine"]
        FastAPI1["AI Worker 1 (:8000)<br/>FastAPI + PhoBERT-base"]
        FastAPI2["AI Worker 2 (:8001)<br/>FastAPI + PhoBERT-base"]
    end
    
    subgraph Data["Persistence & Integration"]
        Mongo[("MongoDB Atlas Cloud<br/>Master Reviews & Historical Alerts")]
        Telegram["Telegram Webhook Bot<br/>Real-Time Anomaly Notifications"]
    end

    Client -->|HTTP / JWT Bearer| Nginx
    Nginx -->|/api/*| NodeServer
    Nginx -->|/ai/* (Round-Robin)| FastAPI1
    Nginx -->|/ai/* (Round-Robin)| FastAPI2
    NodeServer --> Mongo
    NodeServer --> Telegram
    FastAPI1 -.-> Mongo
```

### Architectural Highlights:
1. **Separation of Concerns**: High-frequency CRUD operations and authentication are handled by Node.js/Express, while heavy machine learning inferences are offloaded to dedicated asynchronous FastAPI workers.
2. **Inference Scalability**: NGINX distributes prediction workloads across workers using round-robin balancing, preventing I/O blocking during batch scanning.
3. **Data Integrity & Label Decoupling**: The system strictly separates historical star-derived labels (`label`) from machine-predicted sentiments (`predictedLabel`: 0 = Negative, 1 = Positive, 2 = Mixed).

---

## ✨ Key Feature Modules

| Module | Route | Capabilities |
|---|---|---|
| **Executive Dashboard** | `/dashboard` | High-level CSAT scorecards, star distribution curves, multi-month sentiment trends, branch performance rankings, and automated narrative insights with confidence scoring. |
| **Real-time Live Monitor** | `/live-monitor` | Real-time sentiment ingestion (30s polling), on-the-fly PhoBERT inference, batch scans for unprocessed reviews, and tripartite sentiment filtering (`Positive` / `Negative` / `Mixed`). |
| **Multi-dimensional Analytics** | `/analytics` | Spatial district density heatmaps, complaint keyword word clouds, 24×7 operational heatmaps (Hour × Day of week), and serving session breakdown (Morning, Noon, Afternoon, Evening). |
| **Automated Alerts & Webhooks** | `/alerts` | Configurable threshold trigger engine detecting sudden spikes in negative feedback, incident management status workflows, and instant Telegram bot push notifications. |
| **Branch Scorecard** | `/branches/:placeId` | Granular location analysis, individual branch CSAT trends, localized complaint root-cause analysis, and direct review exploration. |
| **Semantic Review Explorer** | `/reviews` | Paginated search across 6,350+ entries with combined filters (star rating, sentiment class, keyword regex, and branch location). |

---

## 🔬 NLP & Machine Learning Engineering

- **Vietnamese Language Preprocessing (`backend-ai/preprocessor.py`)**:
  - Normalizes Vietnamese teencode, slang, and dialectal variations.
  - Parses emojis and punctuation into sentiment signals while stripping noise.
  - Handles negation syntax (e.g., *"không dở"* vs *"không ngon"*) to prevent false polarities.
- **PhoBERT Fine-Tuning**:
  - Leverages pretrained `vinai/phobert-base` with classification heads fine-tuned on customer dining feedback.
  - Provides sentence-level aspect hints and confidence probabilities.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ & **npm** v9+
- **Python** v3.10+
- **MongoDB Atlas** cluster (or local MongoDB 6.0+)
- **Angular CLI** (`npm install -g @angular/cli`)

### 1. Repository Setup

```bash
git clone https://github.com/gonostudy305/PL-Insight-Dashboard.git
cd PL-Insight-Dashboard
```

### 2. Environment Configuration

```bash
# Configure Node.js Backend API
cp backend-server/.env.example backend-server/.env

# Configure FastAPI AI Engine
cp backend-ai/.env.example backend-ai/.env
```
> *Update `MONGO_URI`, `JWT_SECRET`, and optional `TELEGRAM_BOT_TOKEN` in `backend-server/.env`.*

### 3. Dependencies Installation

```bash
# 1. Backend API dependencies
cd backend-server && npm install

# 2. Frontend Angular dependencies
cd ../frontend-web && npm install

# 3. AI Server dependencies
cd ../backend-ai && pip install -r requirements.txt
```

### 4. PhoBERT Model Weights

Place fine-tuned PhoBERT model artifacts into `backend-ai/model/`.
*(Note: Large binary model weights ~540MB are excluded from git per version control best practices).*

### 5. Launch the Services

**Option A — Automated Launcher (Windows):**
```cmd
start-all.bat
```

**Option B — Manual Launch across Terminals:**
```bash
# Terminal 1: AI Inference Server (Port 8000)
cd backend-ai
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# Terminal 2: Node.js API Gateway (Port 3000)
cd backend-server
node server.js

# Terminal 3: Angular Frontend (Port 4200)
cd frontend-web
npx ng serve --port 4200
```

Open your browser at **`http://localhost:4200`**.

---

## 🔌 API Specification Overview

| Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/login` | Authenticate user & issue JWT Bearer token | No |
| `GET` | `/api/analytics/overview` | Retrieve executive KPIs (total reviews, CSAT, avg rating) | Yes |
| `GET` | `/api/analytics/distribution` | Star rating distribution breakdown | Yes |
| `GET` | `/api/analytics/trends` | Time-series monthly sentiment trends | Yes |
| `GET` | `/api/analytics/district-heatmap`| Spatial density & negative rate by district | Yes |
| `GET` | `/api/analytics/keywords` | Extracted high-frequency complaint terms | Yes |
| `GET` | `/api/analytics/heatmap` | 24×7 matrix (Hour of Day × Day of Week) | Yes |
| `GET` | `/api/analytics/by-session` | Shift-based review distribution (Morning/Noon/Evening) | Yes |
| `GET` | `/api/analytics/insights` | Automated narrative insights with confidence score | Yes |
| `GET` | `/api/branches` | Complete branch list with localized performance KPIs | Yes |
| `GET` | `/api/branches/:placeId` | Detailed scorecard for a specific branch location | Yes |
| `GET` | `/api/alerts` | Priority queue of unresolved operational incidents | Yes |
| `POST` | `/api/alerts/scan` | Execute anomaly detection scan across recent feedback | Yes |
| `PATCH`| `/api/alerts/:alertId/status` | Update incident resolution state | Yes |
| `GET` | `/api/live-monitor/recent` | Real-time stream of latest AI-classified reviews | Yes |
| `POST` | `/api/live-monitor/scan` | Trigger batch sentiment inference job | Yes |
| `GET` | `/api/reviews` | Paginated review catalog with multi-facet filters | Yes |
| `GET` | `/health` | AI Engine health check & model readiness status | No |
| `POST` | `/predict` | Single review inference via PhoBERT | No |
| `POST` | `/predict-batch` | High-throughput batch inference | No |

---

## 🧪 Testing & Quality Assurance

The backend includes a comprehensive regression test suite covering all critical services:

```bash
cd backend-server
node scripts/regression-test.js
```

**Test Coverage Areas:**
1. Authentication & JWT Interceptors
2. Analytics Aggregation Pipelines
3. Review Filtering & Regex Sanitization
4. Alert Trigger Engine & Threshold Calculations
5. Branch Scorecard Data Integrity
6. Live Monitor Polling Contracts
7. Mixed Sentiment Label Consistency

---

## 📁 Repository Structure

```
PL-Insight-Dashboard/
├── backend-ai/               # Python FastAPI PhoBERT Inference Service
│   ├── model/                # Model weights directory (gitignored)
│   ├── preprocessor.py       # Vietnamese NLP text cleaning & tokenization
│   ├── main.py               # FastAPI application & endpoints
│   └── requirements.txt      # Python dependencies
├── backend-server/           # Node.js & Express REST API Server
│   ├── routes/               # API route definitions
│   ├── services/             # Analytics, alert triggers & DB services
│   ├── scripts/              # Regression tests & migration utilities
│   └── server.js             # API entry point & middleware setup
├── frontend-web/             # Angular 19 Single Page Application
│   ├── src/app/pages/        # Dashboard, Analytics, Live Monitor, Alerts
│   ├── src/app/services/     # API clients & state management
│   └── src/app/guards/       # Route authentication guards
├── nginx/                    # Reverse proxy & load balancing configuration
├── ARCHITECTURE.md           # In-depth architectural blueprint
├── README_VN.md              # Vietnamese documentation
└── LICENSE                   # MIT Open-Source License
```

---

## 👨‍💻 Author & Academic Context

- **Developer**: **Huỳnh Văn Vũ** ([@gonostudy305](https://github.com/gonostudy305))
- **Professional Role**: MarTech Executive
- **Academic Affiliation**: University of Economics and Law (UEL), Vietnam National University, Ho Chi Minh City (VNU-HCM) — *Department of Information Systems / E-commerce*
- **Connect**: [LinkedIn Profile](https://www.linkedin.com/in/huynhvanvu305/) | [Portfolio](https://gonovn.me)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
