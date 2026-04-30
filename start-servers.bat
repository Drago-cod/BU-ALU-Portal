@echo off
chcp 65001 >nul
title BU Alumni Portal - Starting Servers
cls

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║          BU Alumni Portal - Server Startup                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python found: 
python --version
echo ✅ Node.js found: 
node --version
echo.

:: Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️  Warning: backend\.env file not found!
    echo.
    echo Please configure your backend settings:
    echo 1. Edit backend\.env file
    echo 2. Set your JWT_SECRET (generate with: python -c "import secrets; print(secrets.token_hex(32))")
    echo 3. Set your SMTP email settings (Gmail App Password recommended)
    echo.
    echo See QUICK_START_GUIDE.md for detailed instructions
    echo.
    pause
)

:: Install Python dependencies if needed
echo 📦 Checking Python dependencies...
cd backend
python -c "import flask, flask_cors, jwt, bcrypt" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install Python dependencies
        cd ..
        pause
        exit /b 1
    )
    echo ✅ Python dependencies installed
) else (
    echo ✅ Python dependencies OK
)
cd ..
echo.

echo 🚀 Starting servers...
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Open your browser and go to: http://localhost:3000
echo.
echo   Press Ctrl+C in each window to stop the servers
echo ═══════════════════════════════════════════════════════════════
echo.

:: Start backend in new window
start "BU Alumni Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && python app.py"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
start "BU Alumni Frontend (Port 3000)" cmd /k "cd /d "%~dp0" && node server.js"

echo.
echo ✅ Servers started in separate windows
echo.
echo 📖 Next steps:
echo    1. Wait for both servers to finish starting (check the new windows)
echo    2. Open your browser
echo    3. Go to http://localhost:3000
echo    4. Test event registration on the Events page
echo.
echo 📚 For troubleshooting, see QUICK_START_GUIDE.md
echo.
pause
