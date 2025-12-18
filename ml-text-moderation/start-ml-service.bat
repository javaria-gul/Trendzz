@echo off
echo ========================================
echo Starting ML Moderation Service
echo ========================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start Flask server
echo Starting server on http://localhost:5001
echo Press Ctrl+C to stop
echo.

python app.py

pause
