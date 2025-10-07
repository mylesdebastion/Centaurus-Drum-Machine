@echo off
echo Removing Audiolux Jam autostart from Windows...
echo.

REM Get the path to the Startup folder
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_FILE=%STARTUP_FOLDER%\Audiolux Jam Server.lnk

REM Check if shortcut exists
if exist "%SHORTCUT_FILE%" (
    del "%SHORTCUT_FILE%"
    echo ✓ Autostart shortcut removed successfully!
    echo.
    echo The Audiolux Jam server will no longer start automatically on boot.
) else (
    echo No autostart shortcut found.
    echo.
    echo Location checked: %SHORTCUT_FILE%
)

echo.
pause
