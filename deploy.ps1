Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   MOSA ALUMNI MANAGEMENT SYSTEM (MASSH Est. 1997)" -ForegroundColor Green
Write-Host "   Automated Deployment: Firebase Hosting + GitHub" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Working Directory: $PWD" -ForegroundColor Gray
Write-Host ""

$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Host "[1/3] Building production bundle..." -ForegroundColor Cyan
node ./scripts/apply-light-green.js
node ./scripts/copy-assets.js
node ./scripts/run-build.js
$buildCode = $LASTEXITCODE

if ($buildCode -ne 0 -or -not (Test-Path "dist\assets")) {
    Write-Host "Attempting fallback: npx vite build..." -ForegroundColor Yellow
    npx vite build
    $buildCode = $LASTEXITCODE
}

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

# Clear corrupted cache if present so firebase CLI runs cleanly
if (Test-Path "$env:USERPROFILE\.cache\firebase\tools") {
    Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\firebase\tools" -ErrorAction SilentlyContinue
}

$deployed = $false
try {
    Write-Host "Deploying via npx firebase-tools..." -ForegroundColor Yellow
    npx --yes firebase-tools deploy --only hosting
    if ($LASTEXITCODE -eq 0) { $deployed = $true }
} catch {
    Write-Host "npx execution encountered error, trying global firebase..." -ForegroundColor Yellow
}

if (-not $deployed) {
    try {
        firebase deploy --only hosting
    } catch {}
}

Write-Host ""
Write-Host "[3/3] Committing & pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "feat(theme): deepen green to rich prestige dark green, enforce 2x2 grid and restore school crest"
git push origin main

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT PROCESS COMPLETE!" -ForegroundColor Green
Write-Host "   Live Website: https://mtech-46634.web.app" -ForegroundColor Green
Write-Host "   GitHub Repo:  https://github.com/muhumuzatusabe-sys/mosa-alumni-system" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
