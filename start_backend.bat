@echo off
title OpenShorts Backend (FastAPI)
echo ===================================================
echo  Starting OpenShorts Backend on http://127.0.0.1:8000
echo ===================================================
cd /d "%~dp0"
call .\venv\Scripts\activate
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause
