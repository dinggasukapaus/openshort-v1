@echo off
title OpenShorts Frontend (Dashboard Vite)
echo ===================================================
echo  Starting OpenShorts Dashboard on http://localhost:5173
echo ===================================================
cd /d "%~dp0dashboard"
call npm.cmd run dev
pause
