@echo off
title RentMS Data Backup

REM Set paths
set BACKUP_DIR=c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend\data_backups
set DATA_DIR=c:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend\data

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Create timestamp for backup folder
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FOLDER=%BACKUP_DIR%\backup_%TIMESTAMP%

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║     RentMS Data Backup Utility                    ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Creating backup folder: %BACKUP_FOLDER%
mkdir "%BACKUP_FOLDER%"

echo Backing up data files...
copy "%DATA_DIR%\*.json" "%BACKUP_FOLDER%\" >nul

echo.
echo ✅ Backup completed successfully!
echo.
echo Backup location: %BACKUP_FOLDER%
echo.
pause
