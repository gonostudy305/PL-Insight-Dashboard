@echo off
REM ======================================================
REM  PL-Insight — Start All Services with Load Balancing
REM ======================================================
REM
REM  Architecture:
REM    NGINX (:80) ─┬─ /api/*  → Node.js (:3000)
REM                  └─ /ai/*   → PhoBERT workers
REM                               ├─ worker1 (:8000)
REM                               └─ worker2 (:8001)
REM
REM  Usage: Double-click or run from Command Prompt
REM ======================================================

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   PL-Insight Dashboard — Load Balancer   ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"
set PROJECT_ROOT=%~dp0

REM ── 1. Start Node.js Backend ──
echo [1/4] Starting Node.js backend on :3000...
cd "%PROJECT_ROOT%backend-server"
start "PL-Insight: Node.js" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

REM ── 2. Start FastAPI Worker 1 ──
echo [2/4] Starting PhoBERT Worker 1 on :8000...
cd "%PROJECT_ROOT%backend-ai"
start "PL-Insight: PhoBERT Worker 1" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1"
timeout /t 3 /nobreak >nul

REM ── 3. Start FastAPI Worker 2 ──
echo [3/4] Starting PhoBERT Worker 2 on :8001...
start "PL-Insight: PhoBERT Worker 2" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1"
timeout /t 3 /nobreak >nul

REM ── 4. Start NGINX Load Balancer ──
echo [4/4] Starting NGINX Load Balancer on :80...
cd "%PROJECT_ROOT%nginx"
start nginx.exe

echo.
echo  ✅ All services started!
echo.
echo  ┌─────────────────────────────────────────┐
echo  │  NGINX Load Balancer : http://localhost  │
echo  │  Node.js API         : :3000             │
echo  │  PhoBERT Worker 1    : :8000             │
echo  │  PhoBERT Worker 2    : :8001             │
echo  │  Angular Frontend    : :4200             │
echo  └─────────────────────────────────────────┘
echo.
echo  Press any key to exit (services keep running)...
pause >nul
