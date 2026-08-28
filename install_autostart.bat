@echo off
title NutriPlan - Enable 24/7 Auto-Start on Windows Boot
cd /d "%~dp0"

echo ======================================================
echo   NutriPlan: 24/7 Continuous Background Auto-Start
echo ======================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%SCRIPT_DIR%run_background.vbs
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\NutriPlan_24x7_Background.vbs

copy /Y "%TARGET_VBS%" "%SHORTCUT_PATH%" >nul

if %errorlevel%==0 (
    echo [SUCCESS] NutriPlan is now configured to start automatically on Windows boot!
    echo.
    echo Location: "%SHORTCUT_PATH%"
    echo.
    echo Starting NutriPlan in background right now...
    wscript.exe "%SHORTCUT_PATH%"
    echo.
    echo [RUNNING] NutriPlan is running in the background 24/7 at http://localhost:8000
) else (
    echo [ERROR] Failed to configure startup shortcut.
)

echo.
pause
