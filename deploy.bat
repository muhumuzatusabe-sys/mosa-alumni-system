@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo    MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)
echo    Automated Deployment: Firebase Hosting + GitHub
echo ==========================================================

cd /d "%~dp0"

echo.
echo [1/4] Building production bundle (TypeScript + Vite)...
call npm run build > build_log.txt 2>&1
type build_log.txt
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check TypeScript errors above or in build_log.txt.
    pause
    exit /b %errorlevel%
)
echo [OK] Production bundle compiled successfully into ./dist

echo.
echo [2/4] Deploying to Firebase Hosting (mtech-46634)...
where firebase >nul 2>nul
if %errorlevel% equ 0 (
    call firebase deploy
) else (
    echo firebase CLI not found in PATH, using npx firebase-tools...
    call npx -y firebase-tools deploy
)

echo.
echo [3/4] Staging and committing changes to Git...
git add .
git diff --quiet && git diff --staged --quiet
if %errorlevel% neq 0 (
    git commit -m "feat: complete MOSA master restoration - admin panel, secretariat WhatsApp directory, permanent MA numbers, legacy register auto-verification, accordion navigation, and mobile UX"
    echo [OK] Changes committed.
) else (
    echo [INFO] No new changes to commit.
)

echo.
echo [4/4] Pushing to GitHub (origin/main)...
git push origin main
if %errorlevel% equ 0 (
    echo [OK] Successfully pushed to origin/main!
) else (
    echo [WARNING] Git push encountered an issue. Check git credentials.
)

echo.
echo ==========================================================
echo    DEPLOYMENT PROCESS COMPLETE!
echo    Live URL:    https://mtech-46634.web.app
echo    GitHub Repo: https://github.com/muhumuzatusabe-sys/mosa-alumni-system
echo ==========================================================
pause
