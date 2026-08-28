@echo off
title NutriPlan - Recipe Planner ^& Calorie Analyzer
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
    python start.py
) else (
    py -3 start.py
)
pause
