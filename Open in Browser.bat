@echo off
title AURELION - The Sovereign
color 0A
echo.
echo  ============================================
echo    AURELION - The Sovereign (Dark Gold)
echo  ============================================
echo.

:: Get local IP address
set IP=Unknown
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set RAW=%%a
    call set IP=%%RAW: =%%
    goto :showInfo
)

:showInfo
echo  [PC Browser]   http://localhost:3000
echo  [Android/WiFi] http://%IP%:3000
echo.
echo  Make sure Android is on the SAME WiFi as this PC.
echo  Press Ctrl+C to stop the server.
echo.
echo  ============================================
echo.

:: Try Node.js first
where node >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Starting server with Node.js...
    echo.
    start "" "http://localhost:3000"
    npx serve . -p 3000
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Server stopped unexpectedly.
        pause
    )
    goto :end
)

:: Try Python 3
where python >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Starting server with Python...
    echo.
    start "" "http://localhost:3000"
    python -m http.server 3000
    goto :end
)

:: Try Python launcher (py)
where py >nul 2>&1
if %errorlevel% == 0 (
    echo  [OK] Starting server with Python...
    echo.
    start "" "http://localhost:3000"
    py -m http.server 3000
    goto :end
)

:: Nothing found
echo.
echo  [ERROR] Neither Node.js nor Python was found.
echo.
echo  Please install one of the following:
echo    Node.js  - https://nodejs.org
echo    Python   - https://python.org
echo.

:end
pause
