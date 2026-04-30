@echo off
echo ========================================
echo BU Alumni Portal - Starting All Servers
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking backend dependencies...
cd backend
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and configure your settings.
    echo See BACKEND_SETUP.md for detailed instructions.
    echo.
    pause
    cd ..
    exit /b 1
)

echo [2/4] Installing Python dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    cd ..
    exit /b 1
)

echo [3/4] Starting backend server...
start "BU Alumni Backend" cmd /k "python app.py"
timeout /t 3 /nobreak >nul

cd ..

echo [4/4] Starting frontend server...
start "BU Alumni Frontend" cmd /k "node server.js"

echo.
echo ========================================
echo Servers Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Open your browser and go to: http://localhost:3000
echo.
echo Press any key to open the portal in your default browser...
pause >nul

start http://localhost:3000

echo.
echo To stop the servers, close the terminal windows.
echo.
