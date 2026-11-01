@echo off
setlocal

echo ==========================================================
echo    MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)
echo    Automated Deployment: Firebase Hosting + GitHub
echo ==========================================================

cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=8192

echo.
echo [1/4] Building production bundle (TypeScript + Vite with 8GB memory)...
cmd /c "npm run build"
set BUILD_STATUS=%errorlevel%

if %BUILD_STATUS% neq 0 (
    echo.
    echo [ERROR] Build failed with exit code %BUILD_STATUS%! Aborting deployment.
    pause
    exit /b %BUILD_STATUS%
)

if not exist "dist\assets" (
    echo.
    echo [ERROR] dist\assets folder was not created by Vite! Aborting deployment.
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo.
    echo [ERROR] dist\index.html was not created! Aborting deployment.
    pause
    exit /b 1
)

echo.
echo [OK] Production bundle compiled successfully into ./dist (assets verified).

echo.
echo [2/4] Deploying to Firebase Hosting (mtech-46634)...
call npx.cmd -y firebase-tools deploy --only hosting
set FIREBASE_STATUS=%errorlevel%
if %FIREBASE_STATUS% neq 0 (
    echo.
    echo [RETRYING] Firebase deploy encountered a network glitch. Retrying upload...
    call npx.cmd -y firebase-tools deploy --only hosting
    set FIREBASE_STATUS=%errorlevel%
)
if %FIREBASE_STATUS% neq 0 (
    echo [ERROR] Firebase deploy failed with code %FIREBASE_STATUS%. Check network connection.
) else (
    echo [OK] Deployed to Firebase Hosting successfully.
)

echo.
echo [3/4] Staging and committing changes to Git...
git add .
git commit -m "feat(branding): integrate official Mandela Secondary School emblem across platform, pale green menu panel, and email gateway"
echo [OK] Staged and committed changes.

echo.
echo [4/4] Pushing to GitHub (origin/main)...
call git push origin main
set GIT_STATUS=%errorlevel%
if %GIT_STATUS% neq 0 (
    echo.
    echo [RETRYING] Git push encountered a network timeout. Retrying...
    timeout /t 3 /nobreak >nul
    call git push origin main
    set GIT_STATUS=%errorlevel%
)
if %GIT_STATUS% equ 0 (
    echo [OK] Successfully pushed to origin/main!
) else (
    echo [WARNING] Git push encountered an issue. Check network/git credentials.
)

echo.
echo ==========================================================
echo    DEPLOYMENT PROCESS COMPLETE!
echo    Live Website: https://mtech-46634.web.app
echo    GitHub Repo:  https://github.com/muhumuzatusabe-sys/mosa-alumni-system
echo ==========================================================
pause
