@echo off
echo ========================================
echo ML Text Moderation - Setup
echo ========================================
echo.

REM Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Python found
echo.

REM Create virtual environment
if not exist "venv" (
    echo [2/4] Creating virtual environment...
    python -m venv venv
    echo       Virtual environment created
) else (
    echo [2/4] Virtual environment already exists
)
echo.

REM Activate and install packages
echo [3/4] Installing Python packages...
echo       This may take 5-10 minutes...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install packages!
    pause
    exit /b 1
)

echo.
echo [4/4] Creating data directory...
if not exist "data" mkdir data
if not exist "models" mkdir models
if not exist "logs" mkdir logs

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Collect training data: collect-data.bat
echo   2. Train the model:       train-model.bat
echo   3. Start ML service:      start-ml-service.bat
echo.

pause
