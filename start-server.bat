@echo off
cd /d "c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0"
echo.
echo ====================================
echo Starting RentMS Dashboard Server...
echo ====================================
echo.
node server-simple.js
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start server
    echo Make sure Node.js is installed
    pause
)
