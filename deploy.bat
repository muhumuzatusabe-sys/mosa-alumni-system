@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
set DEPLOY_STATUS=%errorlevel%

if %DEPLOY_STATUS% neq 0 (
    echo.
    echo [ERROR] Deployment script encountered an issue (code %DEPLOY_STATUS%).
    pause
    exit /b %DEPLOY_STATUS%
)

pause
