@echo off
REM Stop all PL-Insight services
echo Stopping NGINX...
cd /d "%~dp0nginx"
nginx.exe -s quit 2>nul
echo Stopping Node.js and FastAPI workers...
taskkill /FI "WINDOWTITLE eq PL-Insight: Node.js" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq PL-Insight: PhoBERT Worker 1" /T /F 2>nul
taskkill /FI "WINDOWTITLE eq PL-Insight: PhoBERT Worker 2" /T /F 2>nul
echo.
echo All services stopped.
pause
