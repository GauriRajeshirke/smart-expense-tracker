@echo off
rem STARTS EVERYTHING: API server, AI service and website, then opens the browser.
rem Double-click this file every time you want to use the app.
cd /d "%~dp0"
title Smart Expense Tracker - Launcher

echo Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 echo WARNING: the MongoDB service does not look like it is running. The API server needs it.

echo Stopping any old copies on ports 5000, 5173 and 8000...
powershell -NoProfile -Command "foreach ($p in 5000,5173,8000) { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"

echo Starting the three services in their own windows...
start "API server (port 5000)" /d "%~dp0server" cmd /k npm run dev
start "AI service (port 8000)" /d "%~dp0ml-service" cmd /k python -m uvicorn main:app --reload --port 8000
start "Website (port 5173)" /d "%~dp0client" cmd /k npm run dev

echo Waiting for them to start...
timeout /t 10 /nobreak >nul
start "" http://localhost:5173

echo.
echo The app is opening in your browser.
echo Login:  demo@example.com   /   Demo@1234
echo Keep the three black windows open while you use the app.
echo To stop everything, double-click stop.bat
timeout /t 8 >nul
