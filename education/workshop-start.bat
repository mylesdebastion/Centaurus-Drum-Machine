@echo off
title Centaurus Workshop Mode
REM Workshop Startup Script - Windows
REM Starts WLED WebSocket bridge + Dev server for workshop mode

echo ==========================================
echo   CENTAURUS WORKSHOP MODE STARTUP
echo ==========================================
echo.
echo This script will start:
echo   1. WLED WebSocket Bridge (port 8080)
echo   2. Vite Dev Server (port 5173)
echo   3. Browser in fullscreen /isometric mode
echo.
echo Workshop mode: 6-tube WLED setup for education
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the project root:
    echo   cd C:\path\to\Centaurus-Drum-Machine
    echo   education\workshop-start.bat
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo WARNING: node_modules not found
    echo Installing dependencies...
    call npm install
)

echo ==========================================
echo Step 1: Starting WLED WebSocket Bridge...
echo ==========================================
echo.

REM Start WLED bridge in new window
start "WLED Bridge" node scripts\wled-websocket-bridge.cjs

REM Wait for bridge to start
timeout /t 3 /nobreak >nul

echo Bridge running in separate window
echo.

echo ==========================================
echo Step 2: Starting Vite Dev Server...
echo ==========================================
echo.

REM Start dev server in current window (so we can see logs)
echo Server starting...
echo.
echo ==========================================
echo   WORKSHOP MODE READY
echo ==========================================
echo.
echo   Open browser to: http://localhost:5173/isometric
echo.
echo   SETUP CHECKLIST:
echo   1. Connect laptop to WiFi
echo   2. Power on 6 WLED tubes
echo   3. Wait 30 seconds for tubes to connect
echo   4. Open browser URL above
echo   5. Verify 6 tubes show 'Connected' in LEDStripManager
echo   6. Click 'Play' to test
echo.
echo   TROUBLESHOOTING:
echo   - Workshop config: education\workshop-config.json
echo   - Setup guide: docs\workshop\SETUP-GUIDE.md
echo   - Emergency backup: docs\workshop\EMERGENCY-BACKUP.md
echo.
echo   Press Ctrl+C to stop all services
echo.

REM Start dev server in background (allows script to continue)
echo Starting Vite dev server...
start /B npm run dev

REM Wait for server to be ready
echo Waiting for server to start...
timeout /t 10 /nobreak >nul
echo.

REM Open browser in fullscreen mode (proven approach from start-dev-server-win.bat)
echo Opening browser in fullscreen /isometric mode...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173/isometric
    echo Opened in Chrome (fullscreen)
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173/isometric
    echo Opened in Chrome (fullscreen)
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --start-fullscreen http://localhost:5173/isometric
        echo Opened in Edge (fullscreen)
    ) else (
        start http://localhost:5173/isometric
        echo Opened in default browser - Press F11 for fullscreen
    )
)

echo.
echo ==========================================
echo   WORKSHOP MODE ACTIVE
echo ==========================================
echo.
echo Browser should be open at: http://localhost:5173/isometric
echo.
echo Keep this window open - closing it will stop the server.
echo Press Ctrl+C to stop all services.
echo.

REM Cleanup (only reached if npm run dev exits)
echo.
echo ==========================================
echo   SHUTTING DOWN WORKSHOP MODE
echo ==========================================
echo.
echo All services stopped
echo Thank you for using Centaurus Workshop Mode!
echo.
pause
