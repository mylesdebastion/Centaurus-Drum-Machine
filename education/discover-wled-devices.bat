@echo off
REM WLED Device Discovery Tool
REM Scans local network for WLED devices and generates workshop-config.json

title WLED Device Discovery Tool
echo ==========================================
echo   WLED DEVICE DISCOVERY TOOL
echo ==========================================
echo.
echo This tool will:
echo   1. Scan your local network for WLED devices
echo   2. Test connection to each device
echo   3. Generate workshop-config.json automatically
echo.
echo REQUIREMENTS:
echo   - WLED tubes powered on and connected to WiFi
echo   - Laptop connected to same WiFi network
echo   - curl installed (usually included in Windows 10+)
echo.
pause
echo.

REM Get laptop's network configuration
echo ==========================================
echo Step 1: Detecting Network Configuration
echo ==========================================
echo.

REM Get laptop IP and subnet
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set LAPTOP_IP=%%a
    goto :got_ip
)
:got_ip
set LAPTOP_IP=%LAPTOP_IP: =%

echo Your laptop IP: %LAPTOP_IP%
echo.

REM Extract subnet (assumes /24 network, e.g., 192.168.8.x)
for /f "tokens=1,2,3 delims=." %%a in ("%LAPTOP_IP%") do (
    set SUBNET=%%a.%%b.%%c
)

echo Detected subnet: %SUBNET%.0/24
echo.
echo If this looks wrong, press Ctrl+C to exit and check your WiFi connection.
echo Otherwise, press any key to start scanning...
pause >nul
echo.

REM Scan for WLED devices
echo ==========================================
echo Step 2: Scanning for WLED Devices
echo ==========================================
echo.
echo Scanning %SUBNET%.1 - %SUBNET%.254 for WLED devices...
echo This may take 2-3 minutes. Please wait...
echo.

set WLED_COUNT=0
set DISCOVERED_IPS=

REM Common WLED IP ranges to check (faster scan)
REM Check .1-.20 (router range), .100-.200 (common DHCP range), .150-.160 (workshop range)
for %%i in (1,2,3,4,5,6,7,8,9,10,100,101,102,103,104,105,150,151,152,153,154,155,156,157,158,159,160,200,201,202,203,204,205) do (
    set IP=%SUBNET%.%%i

    REM Try to fetch WLED JSON API
    curl -s --connect-timeout 1 --max-time 2 http://!IP!/json/info >nul 2>&1

    if !errorlevel!==0 (
        echo [FOUND] WLED device at !IP!
        set /a WLED_COUNT+=1
        set DISCOVERED_IPS=!DISCOVERED_IPS! !IP!

        REM Get device name from WLED API
        for /f "delims=" %%a in ('curl -s http://!IP!/json/info ^| findstr "name"') do (
            echo        Device info: %%a
        )
        echo.
    )
)

echo.
echo ==========================================
echo Scan Complete
echo ==========================================
echo.
echo Found %WLED_COUNT% WLED device(s)
echo.

if %WLED_COUNT%==0 (
    echo ==========================================
    echo   NO WLED DEVICES FOUND
    echo ==========================================
    echo.
    echo TROUBLESHOOTING:
    echo   1. Verify WLED tubes are powered on
    echo   2. Check WLED WiFi indicator (should be solid, not blinking)
    echo   3. Verify laptop is on same WiFi network
    echo   4. Try accessing WLED web UI manually: http://%SUBNET%.151
    echo   5. Check your router's DHCP client list
    echo.
    echo TIP: WLED devices usually get IPs in these ranges:
    echo   - %SUBNET%.100-110 (dynamic DHCP)
    echo   - %SUBNET%.150-160 (if manually configured)
    echo.
    pause
    exit /b 1
)

REM Display discovered devices
echo Discovered WLED devices:
set COUNT=1
for %%i in (%DISCOVERED_IPS%) do (
    echo   Device !COUNT!: %%i
    set /a COUNT+=1
)
echo.

REM Ask user to assign colors/names
echo ==========================================
echo Step 3: Configure Device Mapping
echo ==========================================
echo.
echo We found %WLED_COUNT% devices. You need 6 devices for the workshop.
echo.

if %WLED_COUNT% LSS 6 (
    echo WARNING: Only %WLED_COUNT% devices found. Workshop requires 6.
    echo          Please check remaining tubes are powered on and connected.
    echo.
)

echo I will now help you assign each device to a student position.
echo.
echo For each device, you'll assign:
echo   - Position (1-6)
echo   - Drum sound (Kick/Snare/Clap/Tom/Hat/Ride)
echo   - Color (Red/Orange/Yellow/Green/Blue/Purple)
echo.
pause
echo.

REM Generate workshop-config.json header
echo Generating workshop-config.json...
echo.

(
echo {
echo   "workshopMode": true,
echo   "description": "6-tube WLED setup for deaf student rhythm workshop",
echo   "lastUpdated": "%DATE%",
echo   "discoveredDevices": [
) > workshop-config-new.json

REM For each discovered device, prompt for configuration
set DEVICE_NUM=1
for %%i in (%DISCOVERED_IPS%) do (
    echo.
    echo Device !DEVICE_NUM!: %%i
    echo --------------------
    echo.

    REM Suggest default mapping
    if !DEVICE_NUM!==1 (
        set DEFAULT_NAME=Kick ^(Red^)
        set DEFAULT_COLOR=#FF0000
        set DEFAULT_NOTE=C
    ) else if !DEVICE_NUM!==2 (
        set DEFAULT_NAME=Snare ^(Orange^)
        set DEFAULT_COLOR=#FF7F00
        set DEFAULT_NOTE=D
    ) else if !DEVICE_NUM!==3 (
        set DEFAULT_NAME=Clap ^(Yellow^)
        set DEFAULT_COLOR=#FFFF00
        set DEFAULT_NOTE=E
    ) else if !DEVICE_NUM!==4 (
        set DEFAULT_NAME=Tom ^(Green^)
        set DEFAULT_COLOR=#00FF00
        set DEFAULT_NOTE=F
    ) else if !DEVICE_NUM!==5 (
        set DEFAULT_NAME=Hat ^(Blue^)
        set DEFAULT_COLOR=#0000FF
        set DEFAULT_NOTE=G
    ) else if !DEVICE_NUM!==6 (
        set DEFAULT_NAME=Ride ^(Purple^)
        set DEFAULT_COLOR=#8B00FF
        set DEFAULT_NOTE=A
    )

    echo Suggested: !DEFAULT_NAME!
    echo Press Enter to accept, or type custom name:
    set /p DEVICE_NAME=

    if "!DEVICE_NAME!"=="" (
        set DEVICE_NAME=!DEFAULT_NAME!
    )

    REM Add device to JSON
    if !DEVICE_NUM! GTR 1 (
        echo     ^}, >> workshop-config-new.json
    )

    (
    echo     {
    echo       "id": "tube!DEVICE_NUM!",
    echo       "name": "!DEVICE_NAME!",
    echo       "ipAddress": "%%i",
    echo       "laneIndex": !DEVICE_NUM!,
    echo       "color": "!DEFAULT_COLOR!",
    echo       "boomwhackerNote": "!DEFAULT_NOTE!",
    echo       "ledCount": 90,
    echo       "enabled": true,
    echo       "reverseDirection": true,
    echo       "studentPosition": !DEVICE_NUM!,
    echo       "physicalLabel": "Position !DEVICE_NUM! - %%i"
    ) >> workshop-config-new.json

    set /a DEVICE_NUM+=1
)

REM Close JSON structure
(
echo     }
echo   ],
echo   "patterns": {
echo     "simple": {
echo       "name": "Workshop Pattern 1 - Simple",
echo       "tempo": 60,
echo       "activeLanes": [0],
echo       "description": "Kick only, quarter notes, beginner level"
echo     },
echo     "callResponse": {
echo       "name": "Workshop Pattern 2 - Call Response",
echo       "tempo": 80,
echo       "activeLanes": [0, 1],
echo       "description": "Kick + Snare alternating, intermediate level"
echo     },
echo     "fullBeat": {
echo       "name": "Workshop Pattern 3 - Full Beat",
echo       "tempo": 100,
echo       "activeLanes": [0, 1, 2, 3, 4, 5],
echo       "description": "All 6 lanes, rock beat, advanced level"
echo     }
echo   },
echo   "setupNotes": {
echo     "laptopIP": "%LAPTOP_IP%",
echo     "networkSubnet": "%SUBNET%.0/24",
echo     "bridgePort": 8080,
echo     "serverPort": 5173,
echo     "discoveryDate": "%DATE% %TIME%"
echo   }
echo }
) >> workshop-config-new.json

echo.
echo ==========================================
echo   SUCCESS!
echo ==========================================
echo.
echo Configuration saved to: workshop-config-new.json
echo.
echo NEXT STEPS:
echo   1. Review workshop-config-new.json
echo   2. If it looks good, rename to workshop-config.json:
echo      copy workshop-config-new.json workshop-config.json
echo   3. Label each WLED tube with its IP address (colored tape)
echo   4. Test with workshop-start.bat
echo.
echo Device Summary:
echo ----------------
type workshop-config-new.json | findstr "ipAddress"
echo.
echo Ready for workshop!
echo.
pause
