@echo off
setlocal

echo.
echo  KanBoard — starting dev server...
echo.

:: Verify .env.local exists
if not exist ".env.local" (
    echo  ERROR: .env.local not found. Please run setup.bat first.
    pause
    exit /b 1
)

:: Verify node_modules exists
if not exist "node_modules" (
    echo  ERROR: node_modules not found. Please run setup.bat first.
    pause
    exit /b 1
)

:: Get local IP for LAN display
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LAN_IP=%%a
    goto :found_ip
)
:found_ip
set LAN_IP=%LAN_IP: =%

echo  Local :  http://localhost:3000
if defined LAN_IP (
    echo  LAN   :  http://%LAN_IP%:3000
)
echo.
echo  Press Ctrl+C to stop the server.
echo.

set DATABASE_URL=file:./kanboard.db
npm run dev
