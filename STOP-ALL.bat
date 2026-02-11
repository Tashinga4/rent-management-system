@echo off
echo Stopping Rent Management System...
echo.

echo Stopping MongoDB...
taskkill /F /IM mongod.exe 2>NUL

echo Stopping Node processes...
taskkill /F /IM node.exe 2>NUL

echo.
echo All services stopped!
pause