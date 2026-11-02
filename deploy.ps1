Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)" -ForegroundColor Green
Write-Host "   Automated Deployment: Firebase Hosting + GitHub" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "[1/3] Building production bundle..." -ForegroundColor Cyan
node ./scripts/copy-assets.js
node ./scripts/run-build.js
$buildCode = $LASTEXITCODE

Write-Host ""
Write-Host "--- BUILD STAGES LOG (Exit code: $buildCode) ---" -ForegroundColor Yellow
if (Test-Path "build_stages.txt") {
    Get-Content "build_stages.txt"
}

if ($buildCode -ne 0 -or -not (Test-Path "dist\assets")) {
    Write-Host "[ERROR] dist\assets was not created (Exit code: $buildCode). Review the stage log above." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Production bundle compiled successfully into ./dist" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Deploying to Firebase Hosting (mtech-46634)..." -ForegroundColor Cyan
try {
    firebase deploy --only hosting
    if ($LASTEXITCODE -ne 0) {
        throw "firebase command failed, trying npx"
    }
} catch {
    npx --yes firebase deploy --only hosting
}

Write-Host ""
Write-Host "[3/3] Committing & pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "feat(system): clean blank system baseline and unblocked authentication"
git push origin main

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT PROCESS COMPLETE!" -ForegroundColor Green
Write-Host "   Live Website: https://mtech-46634.web.app" -ForegroundColor Green
Write-Host "   GitHub Repo:  https://github.com/muhumuzatusabe-sys/mosa-alumni-system" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
