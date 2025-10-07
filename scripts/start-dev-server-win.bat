@echo off
title Audiolux Jam Server
cd /d "C:\Centaurus-Drum-Machine"
echo Starting Audiolux Jam Server...
echo.

REM Start the dev server in the background and wait for it to be ready
start /B npm run dev

REM Wait 10 seconds for server to start (adjust if needed)
timeout /t 10 /nobreak

echo.
echo Select startup mode:
echo   1) Home Page
echo   2) Jam Mode
echo   3) Education Mode
echo   4) Isometric Sequencer (default)
echo.
echo Enter selection (1-4) or wait 5 seconds for Isometric Sequencer...

REM Read user input with 5 second timeout
set MODE_PATH=/isometric
choice /c 1234 /d 4 /t 5 /n >nul
set CHOICE_RESULT=%errorlevel%

if %CHOICE_RESULT%==1 (
    set MODE_PATH=
    echo Starting in Home Page mode...
) else if %CHOICE_RESULT%==2 (
    set MODE_PATH=/jam
    echo Starting in Jam Mode...
) else if %CHOICE_RESULT%==3 (
    set MODE_PATH=/education
    echo Starting in Education Mode...
) else if %CHOICE_RESULT%==4 (
    set MODE_PATH=/isometric
    echo Starting in Isometric Sequencer mode...
) else (
    set MODE_PATH=/isometric
    echo No selection made. Starting in Isometric Sequencer ^(default^)...
)

echo.

REM Open the app in fullscreen mode
REM Try Chrome first (check standard install paths), fallback to Edge, then default browser
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173%MODE_PATH%
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --start-fullscreen http://localhost:5173%MODE_PATH%
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --start-fullscreen http://localhost:5173%MODE_PATH%
    ) else (
        start http://localhost:5173%MODE_PATH%
        echo Note: Press F11 for fullscreen
    )
)

echo.
echo Server is running and browser opened!
echo Keep this window open - closing it will stop the server.
echo.
