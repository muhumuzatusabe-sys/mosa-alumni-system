Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   MOSA ALUMNI - Direct Firebase Hosting Deploy" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Working Directory: $PWD" -ForegroundColor Gray
Write-Host ""

if (Test-Path "$env:USERPROFILE\.cache\firebase\tools") {
    Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\firebase\tools" -ErrorAction SilentlyContinue
}

Write-Host "Deploying compiled ./dist bundle to Firebase Hosting..." -ForegroundColor Cyan
npx --yes firebase-tools deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT SUCCEEDED!" -ForegroundColor Green
    Write-Host "   Live Website: https://mtech-46634.web.app" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "[NOTE] If prompted to login, run: npx firebase-tools login" -ForegroundColor Yellow
}
