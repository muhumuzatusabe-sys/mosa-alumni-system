# ==============================================================================
# MOSA Alumni Platform - Deployment Script (Firebase Hosting + GitHub)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)" -ForegroundColor Yellow
Write-Host "   Automated Deployment: Firebase Hosting + GitHub" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# Step 1: Build Production Assets
Write-Host "`n[1/4] Building production bundle (TypeScript + Vite)..." -ForegroundColor Green
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed! Check TypeScript errors above." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Production bundle compiled successfully into ./dist" -ForegroundColor Green

# Step 2: Deploy to Firebase Hosting & Firestore Rules
Write-Host "`n[2/4] Deploying to Firebase Hosting (mtech-46634)..." -ForegroundColor Green
npx.cmd -y firebase-tools deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Firebase deploy reported an issue. Check credentials if needed." -ForegroundColor Yellow
} else {
    Write-Host "[SUCCESS] Firebase deployment complete: https://mtech-46634.web.app" -ForegroundColor Green
}

# Step 3: Git Status & Commit
Write-Host "`n[3/4] Staging and committing changes to Git..." -ForegroundColor Green
git add .
$gitChanges = git status --porcelain
if ($gitChanges) {
    git commit -m "feat(mobile): optimize mobile responsiveness, touch targets, horizontal touch scrolling, bottom sheet modals, and safe areas"
    Write-Host "[SUCCESS] Changes committed." -ForegroundColor Green
} else {
    Write-Host "(info) Working tree is clean, no new changes to commit." -ForegroundColor DarkGray
}

# Step 4: Push to GitHub Remote
Write-Host "`n[4/4] Pushing to GitHub (origin/main)..." -ForegroundColor Green
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Successfully pushed to https://github.com/muhumuzatusabe-sys/mosa-alumni-system" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Git push failed. Verify authentication or network connection." -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT PROCESS COMPLETE!" -ForegroundColor Yellow
Write-Host "   Live URL:    https://mtech-46634.web.app" -ForegroundColor Cyan
Write-Host "   GitHub Repo: https://github.com/muhumuzatusabe-sys/mosa-alumni-system" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
