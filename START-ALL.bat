@echo off
color 0A
title Rent Management System Launcher

echo.
echo ====================================================
echo        RENT MANAGEMENT SYSTEM - STARTUP
echo ====================================================
echo.

REM Step 1: Check if MongoDB is running
echo [1/4] Checking MongoDB status...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo      [OK] MongoDB is already running
) else (
    echo      Starting MongoDB...
    start "MongoDB Server" mongod --dbpath="%~dp0backend\mongodb_data"
    echo      [OK] MongoDB started
    timeout /t 3 /nobreak >nul
)

REM Step 2: Start Backend Server
echo.
echo [2/4] Starting Backend Server (Port 5000)...
start "RentMS Backend" cmd /k "cd /d "%~dp0backend" && npm start"
echo      [OK] Backend starting...
timeout /t 4 /nobreak >nul

REM Step 3: Start Frontend Server
echo.
echo [3/4] Starting Frontend Server (Port 3000)...
start "RentMS Frontend" cmd /k "cd /d "%~dp0" && npm run serve"
echo      [OK] Frontend starting...

REM Step 4: Open Browser with retry logic (SOLUTION 2)
echo.
echo [4/4] Waiting for frontend to be ready...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 > nul 2>&1
if errorlevel 1 (
    echo      Still waiting...
    goto WAIT_LOOP
)
echo      [OK] Frontend is ready!
timeout /t 1 /nobreak >nul
start http://localhost:3000

echo.
echo ====================================================
echo              SYSTEM STARTED SUCCESSFULLY!
echo ====================================================
echo.
echo   Backend API:  http://localhost:5000/api
echo   Frontend:     http://localhost:3000
echo   Health Check: http://localhost:5000/api/health
echo.
echo ====================================================
echo.
echo Press any key to close this window...
echo (Keep the Backend and Frontend windows open!)
pause >nul