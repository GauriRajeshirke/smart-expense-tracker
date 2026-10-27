@echo off
rem Stops the API server, AI service and website.
echo Stopping everything on ports 5000, 5173 and 8000...
powershell -NoProfile -Command "foreach ($p in 5000,5173,8000) { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"
echo Done. You can close the black windows.
timeout /t 4 >nul
