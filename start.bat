@echo off
echo ========================================================
echo        ComplianceTwin 360 - AICTE Prototype
echo ========================================================
echo.
echo [1/2] Starting Backend API (Uvicorn on port 8000)...
start "ComplianceTwin 360 - Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Web Server (Vite on port 5173)...
start "ComplianceTwin 360 - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is starting!
echo Web Application URL: http://localhost:5173
echo Backend API Docs:    http://127.0.0.1:8000/docs
echo.
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173
echo Done.

