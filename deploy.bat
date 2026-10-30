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
if exist "node_modules\.tmp" rd /s /q "node_modules\.tmp"
call npm.cmd run build > deploy_build.log 2>&1
type deploy_build.log
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Aborting deployment.
    pause
    exit /b %errorlevel%
)
echo [OK] Production bundle compiled successfully into ./dist

echo.
echo [2/4] Deploying to Firebase Hosting (mtech-46634)...
call npx.cmd -y firebase-tools deploy > deploy_firebase.log 2>&1
type deploy_firebase.log
if %errorlevel% neq 0 (
    echo [WARNING] Firebase deploy reported an issue.
) else (
    echo [OK] Deployed to Firebase Hosting successfully.
)

echo.
echo [3/4] Staging and committing changes to Git...
git add .
git commit -m "feat(id-card): update official MOSA ID card format, institutional crest logo, contacts, and remove emojis"
echo [OK] Staged and committed changes.

echo.
echo [4/4] Pushing to GitHub (origin/main)...
call git push origin main > deploy_git.log 2>&1
type deploy_git.log
if %errorlevel% equ 0 (
    echo [OK] Successfully pushed to origin/main!
) else (
    echo [WARNING] Git push encountered an issue. Check git credentials.
)

echo.
echo ==========================================================
echo    DEPLOYMENT PROCESS COMPLETE!
echo    Live Website: https://mandelassalumni.com
echo    Firebase URL: https://mtech-46634.web.app
echo    GitHub Repo:  https://github.com/muhumuzatusabe-sys/mosa-alumni-system
echo ==========================================================
pause
