# URBANAi Startup Script

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Starting URBANAi Decision Platform..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." )).Path
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
	$pythonPath = "python"
}

# Start FastAPI Backend
Write-Host "[1/2] Starting FastAPI Backend on Port 8000..." -ForegroundColor Green
$backendPath = (Resolve-Path (Join-Path $projectRoot "backend" )).Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$pythonPath' -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Vite Frontend
Write-Host "[2/2] Starting Vite Frontend on Port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev"

# Wait a brief moment for servers to start
Start-Sleep -Seconds 3

# Launch web browser
Write-Host "Launching URBANAi Dashboard in default web browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173/"

Write-Host "URBANAi is ready!" -ForegroundColor Cyan
