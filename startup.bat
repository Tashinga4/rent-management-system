@echo off
title RentMS Dashboard & Backend Startup

echo.
echo ========================================
echo  RentMS Rent Management System
echo  Dashboard & Backend Startup
echo ========================================
echo.

REM Start Frontend Server
echo Starting Frontend Server (Port 3000)...
start cmd /k "cd /d c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0 && node server-simple.js"

REM Wait a moment
timeout /t 2 /nobreak

REM Start Backend Server  
echo Starting Backend Server (Port 5000)...
start cmd /k "cd /d c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend && node src\server.js"

REM Wait for servers to start
timeout /t 3 /nobreak

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo.
echo Frontend: http://localhost:3000/html/index.html
echo Backend API: http://localhost:5000/api
echo.
echo Both servers should be running now.
echo If you see errors, check the console windows.
echo.
pause
