@echo off
echo Setting up Audiolux Jam to start automatically on boot...
echo.

REM Get the path to the Startup folder
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Create a shortcut in the Startup folder
powershell "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\Audiolux Jam Server.lnk'); $s.TargetPath = '%~dp0start-dev-server-win.bat'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

echo.
echo ✓ Autostart shortcut created successfully!
echo.
echo The Audiolux Jam server will now start automatically when Windows boots.
echo.
echo Shortcut location: %STARTUP_FOLDER%\Audiolux Jam Server.lnk
echo.
echo To remove autostart, delete the shortcut from the Startup folder.
echo.
pause
