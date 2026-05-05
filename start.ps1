# Quantyx Startup Script (Windows PowerShell)
# Run this from the quantyx-refactored root directory

Write-Host "🚀 Starting Quantyx v5..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path "backend/.env")) {
    Write-Host "❌ backend/.env not found!" -ForegroundColor Red
    Write-Host "   Copy backend/.env.example to backend/.env and configure it" -ForegroundColor Yellow
    exit 1
}

# Start backend
Write-Host "`n📦 Starting Express backend (port 3001)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start ML engine
Write-Host "🤖 Starting ML engine (port 5001)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend/ml-engine; .\.venv\Scripts\Activate.ps1; python api.py"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "🎨 Starting Vite frontend (port 5173)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n✅ All services starting!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   ML API:   http://localhost:5001" -ForegroundColor White
Write-Host "`n   Close the terminal windows to stop services.`n" -ForegroundColor Yellow
