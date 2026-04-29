@echo off
chcp 65001 >nul
title BU Alumni Portal - Backend Server
cls

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║          BU Alumni Portal - Backend Server                    ║
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

echo ✅ Python found:
python --version
echo.

:: Navigate to backend directory
cd /d "%~dp0backend"

:: Check if requirements are installed
echo 📦 Checking dependencies...
python -c "import flask, flask_cors, jwt, bcrypt" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Some dependencies not found. Installing...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ All dependencies are installed
)
echo.

:: Check if .env file exists in parent directory
if not exist "..\.env" (
    echo ⚠️  Warning: .env file not found!
    echo Copying .env.example to .env...
    copy "..\.env.example" "..\.env" >nul
    echo Please edit .env with your configuration before continuing
    echo.
    pause
)

:: Load environment variables from .env
for /f "tokens=*" %%a in (..\.env) do (
    set %%a
)

:: Display configuration
echo 🔧 Configuration:
echo    Port: %FLASK_PORT% (default: 5000)
echo    Base URL: %BASE_URL% (default: http://localhost:5000)
echo    Environment: %ENVIRONMENT% (default: development)
echo.

:: Initialize database
echo 🗄️  Initializing database...
python -c "import database; database.init_db()" >nul 2>&1
echo ✅ Database ready
echo.

echo 🚀 Starting Flask server...
echo.
echo ═══════════════════════════════════════════════════════════════
echo   Server will be available at:
echo   http://localhost:%FLASK_PORT% (or http://localhost:5000)
echo.
echo   Press Ctrl+C to stop the server
echo ═══════════════════════════════════════════════════════════════
echo.

:: Start the Flask application
python app.py

:: If server crashes, keep window open
echo.
echo ❌ Server stopped unexpectedly
pause
