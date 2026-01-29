@echo off
REM Rent Management System - Startup Script

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Starting RentMS - Rent Management System          ║
echo ║  MongoDB + Node.js Backend + Frontend Server       ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: MongoDB is not installed or not in PATH
    echo Please install MongoDB Community Edition first
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)

echo ✅ MongoDB found
echo ✅ Node.js found
echo.

REM Create MongoDB data directory if it doesn't exist
if not exist "%~dp0backend\mongodb_data" (
    mkdir "%~dp0backend\mongodb_data"
    echo ✅ Created MongoDB data directory
)

echo.
echo Starting MongoDB server...
start "MongoDB Server" cmd /k "mongod --dbpath "%~dp0backend\mongodb_data""
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend API Server...
start "RentMS Backend" cmd /k "cd /d "%~dp0backend" && npm start"
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "RentMS Frontend" cmd /k "cd /d "%~dp0" && node server-simple.js"
timeout /t 2 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ All Servers Starting                          ║
echo ║                                                    ║
echo ║  MongoDB:  http://localhost:27017                 ║
echo ║  Backend:  http://localhost:5000/api              ║
echo ║  Frontend: http://localhost:3000/html/index.html  ║
echo ║                                                    ║
echo ║  Opening dashboard in 5 seconds...                ║
echo ╚════════════════════════════════════════════════════╝
echo.

timeout /t 5 /nobreak

REM Open the dashboard in the default browser
start http://localhost:3000/html/index.html

echo.
echo Dashboard opened! Check your browser.
echo.
pause
