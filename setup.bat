@echo off
rem ONE-TIME SETUP: installs everything and loads the demo data.
rem Double-click this file. Needs: Node.js, Python and MongoDB (running).
cd /d "%~dp0"
title Smart Expense Tracker - Setup

echo.
echo === 1/4  API server: installing packages ===
cd server
call npm install
if errorlevel 1 goto fail
node scripts\make-env.js
if errorlevel 1 goto fail
cd ..

echo.
echo === 2/4  Website: installing packages ===
cd client
call npm install
if errorlevel 1 goto fail
cd ..

echo.
echo === 3/4  AI service: installing Python packages ===
cd ml-service
python -m pip install -r requirements.txt
if errorlevel 1 goto fail
cd ..

echo.
echo === 4/4  Loading fake demo data into MongoDB ===
cd server
call npm run seed
if errorlevel 1 goto fail
cd ..

echo.
echo ==================================================
echo  SETUP COMPLETE.  Now double-click  start.bat
echo ==================================================
pause
exit /b 0

:fail
echo.
echo ==================================================
echo  SOMETHING FAILED. Scroll up to read the error,
echo  then send a screenshot of this window to Claude.
echo ==================================================
pause
exit /b 1
