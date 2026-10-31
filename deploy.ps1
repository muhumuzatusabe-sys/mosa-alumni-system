Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)" -ForegroundColor Cyan
Write-Host "   Automated Deployment: Firebase Hosting + GitHub" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "`n[1/4] Building production bundle (TypeScript + Vite)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Build failed! Aborting deployment." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "[OK] Production bundle compiled successfully into ./dist" -ForegroundColor Green

Write-Host "`n[2/4] Deploying to Firebase Hosting (mtech-46634)..." -ForegroundColor Yellow
npx -y firebase-tools deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Firebase deploy reported an issue." -ForegroundColor DarkYellow
} else {
    Write-Host "[OK] Deployed to Firebase Hosting successfully." -ForegroundColor Green
}

Write-Host "`n[3/4] Staging and committing changes to Git..." -ForegroundColor Yellow
git add .
git commit -m "feat(id-card): update official MOSA ID card format, institutional crest logo, contacts, and remove emojis"
Write-Host "[OK] Staged and committed changes." -ForegroundColor Green

Write-Host "`n[4/4] Pushing to GitHub (origin/main)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Successfully pushed to origin/main!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Git push encountered an issue. Check git credentials." -ForegroundColor DarkYellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT PROCESS COMPLETE!" -ForegroundColor Green
Write-Host "   Live Website: https://mtech-46634.web.app" -ForegroundColor Green
Write-Host "   GitHub Repo:  https://github.com/muhumuzatusabe-sys/mosa-alumni-system" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
