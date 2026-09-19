@echo off
title OpenShorts Backend (FastAPI)
echo ===================================================
echo  Starting OpenShorts Backend on http://127.0.0.1:8000
echo ===================================================
cd /d "%~dp0"
if exist "%~dp0venv311\Scripts\activate.bat" (
    echo [OK] Menggunakan Python 3.11 Virtual Environment (venv311)
    call "%~dp0venv311\Scripts\activate.bat"
) else if exist "%~dp0venv\Scripts\activate.bat" (
    echo [OK] Menggunakan Virtual Environment (venv)
    call "%~dp0venv\Scripts\activate.bat"
)
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload --reload-exclude "output/*" --reload-exclude "uploads/*" --reload-exclude "dashboard/*"
pause
