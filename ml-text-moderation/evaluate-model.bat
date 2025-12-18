@echo off
echo ========================================
echo Evaluating Trained Model
echo ========================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run evaluation
python evaluate_model.py

echo.
echo Check evaluation_results.csv for detailed metrics
echo.

pause
