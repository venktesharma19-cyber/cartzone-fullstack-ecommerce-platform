# CartZone dependency installer for Windows PowerShell
# Run from the cartzone project root:
# powershell -ExecutionPolicy Bypass -File scripts/install-dependencies.ps1

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Require-Command($commandName, $installHint) {
  $command = Get-Command $commandName -ErrorAction SilentlyContinue
  if (-not $command) {
    Write-Host "Missing required command: $commandName" -ForegroundColor Red
    Write-Host $installHint -ForegroundColor Yellow
    exit 1
  }
}

Write-Step "Checking Node.js and npm"
Require-Command "node" "Install Node.js LTS manually from https://nodejs.org, then reopen PowerShell."
Require-Command "npm" "npm comes with Node.js LTS. Reinstall Node.js if npm is missing."

$nodeVersion = node -v
$npmVersion = npm -v
Write-Host "Node: $nodeVersion"
Write-Host "npm:  $npmVersion"

Write-Step "Installing backend dependencies"
Push-Location backend
npm install
Pop-Location

Write-Step "Installing frontend dependencies"
Push-Location frontend
npm install
Pop-Location

Write-Step "Preparing environment files"
if (-not (Test-Path "backend/.env")) {
  if (Test-Path "backend/.env.no-docker.example") {
    Copy-Item "backend/.env.no-docker.example" "backend/.env"
    Write-Host "Created backend/.env from backend/.env.no-docker.example"
  } elseif (Test-Path "backend/.env.example") {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "Created backend/.env from backend/.env.example"
  }
} else {
  Write-Host "backend/.env already exists. Skipped."
}

if (-not (Test-Path "frontend/.env")) {
  if (Test-Path "frontend/.env.example") {
    Copy-Item "frontend/.env.example" "frontend/.env"
    Write-Host "Created frontend/.env from frontend/.env.example"
  }
} else {
  Write-Host "frontend/.env already exists. Skipped."
}

Write-Step "Done"
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Create PostgreSQL database: cartzone"
Write-Host "2. Edit backend/.env and set DATABASE_URL with your PostgreSQL password"
Write-Host "3. Keep REDIS_MODE=memory if you are not using Redis"
Write-Host "4. Run: npm run db:migrate"
Write-Host "5. Run: npm run db:seed"
Write-Host "6. Start backend: npm run dev:backend"
Write-Host "7. Start frontend in a second terminal: npm run dev:frontend"
