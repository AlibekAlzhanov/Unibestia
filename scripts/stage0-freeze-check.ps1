$ErrorActionPreference = "Stop"

function Invoke-Step {
  param([string]$Command)

  Write-Host ""
  Write-Host "▶ $Command" -ForegroundColor Cyan
  Invoke-Expression $Command
}

function Fail-IfMatches {
  param(
    [string]$Pattern,
    [string]$Message
  )

  $matches = git grep -n -- "$Pattern" 2>$null
  if ($LASTEXITCODE -eq 0 -and $matches) {
    Write-Host ""
    Write-Host "❌ $Message" -ForegroundColor Red
    Write-Host $matches
    exit 1
  }
}

Write-Host "Stage 0 freeze check started..." -ForegroundColor Green

Write-Host ""
Write-Host "Checking tracked real .env files..." -ForegroundColor Cyan
$trackedRealEnvs = git ls-files | Select-String -Pattern '(^|/)\.env$'
if ($trackedRealEnvs) {
  Write-Host "❌ Real .env files are tracked by git:" -ForegroundColor Red
  Write-Host $trackedRealEnvs
  exit 1
}

Write-Host "✅ No tracked real .env files found."

Fail-IfMatches "DEV/PANEL ONLY" "DEV/PANEL ONLY comments must not remain in production code."
Fail-IfMatches "validateByQrToken: procedure" "validateByQrToken must not be public procedure."
Fail-IfMatches "confirmByQrToken: procedure" "confirmByQrToken must not be public procedure."
Fail-IfMatches "cancelByQrToken: procedure" "cancelByQrToken must not be public procedure."

Write-Host ""
Write-Host "Checking optional cleanup warnings..." -ForegroundColor Cyan
$demoPartner = git grep -n -- "getDemoPartner" 2>$null
if ($LASTEXITCODE -eq 0 -and $demoPartner) {
  Write-Host "⚠ getDemoPartner still exists. Remove it before final production release:" -ForegroundColor Yellow
  Write-Host $demoPartner
}

Invoke-Step "pnpm --filter @repo/trpc type-check"
Invoke-Step "pnpm --filter @repo/trpc build"
Invoke-Step "pnpm --filter @repo/backend type-check"
Invoke-Step "pnpm --filter @repo/web type-check"
Invoke-Step "pnpm --filter @repo/business-web type-check"
Invoke-Step "pnpm type-check"

Write-Host ""
Write-Host "✅ Stage 0 freeze check completed." -ForegroundColor Green
