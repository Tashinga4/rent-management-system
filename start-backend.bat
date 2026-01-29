@echo off
cd /d "c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend"
echo.
echo ====================================
echo Starting RentMS Backend Server...
echo ====================================
echo.
node src\server.js
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start backend
    echo Make sure Node.js is installed
    pause
)
