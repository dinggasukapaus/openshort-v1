@echo off
title OpenShorts Launcher
echo ===================================================
echo  Launching OpenShorts Fullstack (Backend + Frontend)
echo ===================================================
cd /d "%~dp0"
start "OpenShorts Backend" cmd /k "%~dp0start_backend.bat"
echo Menunggu Backend startup (3 detik)...
timeout /t 3 /nobreak >nul
start "OpenShorts Frontend" cmd /k "%~dp0start_frontend.bat"
echo Menunggu Frontend startup (3 detik)...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo ===================================================
echo  OpenShorts berhasil dijalankan!
echo  - Backend API: http://127.0.0.1:8000
echo  - Dashboard UI: http://localhost:5173
echo ===================================================
