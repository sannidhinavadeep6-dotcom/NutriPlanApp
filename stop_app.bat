@echo off
title NutriPlan - Stop App
cd /d "%~dp0"

echo ======================================================
echo   NutriPlan - Stopping 24/7 Background Server...
echo ======================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Stopping process ID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo NutriPlan server on port 8000 has been stopped.
echo.
pause
