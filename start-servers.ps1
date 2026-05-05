# BU Alumni Portal - Server Startup Script (PowerShell)

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          BU Alumni Portal - Server Startup                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Warning: backend\.env file not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please configure your backend settings:" -ForegroundColor Yellow
    Write-Host "1. Edit backend\.env file" -ForegroundColor Yellow
    Write-Host "2. Set your JWT_SECRET" -ForegroundColor Yellow
    Write-Host "3. Set your SMTP email settings" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "See QUICK_START_GUIDE.md for detailed instructions" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}

# Install Python dependencies
Write-Host "📦 Checking Python dependencies..." -ForegroundColor Cyan
Push-Location backend
try {
    py -c "import flask, flask_cors, jwt, bcrypt" 2>&1 | Out-Null
    Write-Host "✅ Python dependencies OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Installing Python dependencies..." -ForegroundColor Yellow
    py -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
}
Pop-Location
Write-Host ""

Write-Host "🚀 Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Open your browser and go to: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop the servers" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; py app.py; Read-Host 'Press Enter to close'"

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; node server.js; Read-Host 'Press Enter to close'"

Write-Host ""
Write-Host "✅ Servers started in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Check both new windows to verify servers started" -ForegroundColor White
Write-Host "   2. Open your browser" -ForegroundColor White
Write-Host "   3. Go to http://localhost:3000" -ForegroundColor White
Write-Host "   4. Test event registration on the Events page" -ForegroundColor White
Write-Host ""
Write-Host "For troubleshooting, see QUICK_START_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
