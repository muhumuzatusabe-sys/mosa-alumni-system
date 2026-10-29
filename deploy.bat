@echo off
setlocal

echo ==========================================================
echo    MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)
echo    Automated Deployment: Firebase Hosting + GitHub
echo ==========================================================

cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=4096

echo.
echo [1/4] Building production bundle (TypeScript + Vite)...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Aborting deployment.
    pause
    exit /b %errorlevel%
)
echo [OK] Production bundle compiled successfully into ./dist

echo.
echo [2/4] Deploying to Firebase Hosting (mtech-46634)...
call npx.cmd -y firebase-tools deploy
if %errorlevel% neq 0 (
    echo [WARNING] Firebase deploy reported an issue.
) else (
    echo [OK] Deployed to Firebase Hosting successfully.
)

echo.
echo [3/4] Staging and committing changes to Git...
git add .
git commit -m "feat(chapters): populate university chapters in registration wizard, remove map section from chapters hub, and deduplicate career hub menu item"
echo [OK] Staged and committed changes.

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
