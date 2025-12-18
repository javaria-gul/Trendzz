@echo off
echo ========================================
echo Training ML Model
echo ========================================
echo.
echo This will train a multilingual toxic content classifier
echo Training may take 30-60 minutes depending on your hardware
echo.

choice /C YN /M "Do you want to continue"
if errorlevel 2 exit /b

echo.
echo Starting training...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run training
python train_model.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Training failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Training Complete!
echo ========================================
echo.
echo Model saved to: models/toxic-classifier
echo.
echo Next steps:
echo   1. Evaluate model: evaluate-model.bat
echo   2. Start ML service: start-ml-service.bat
echo.

pause
