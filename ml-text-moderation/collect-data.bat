@echo off
echo ========================================
echo Collecting Training Data
echo ========================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run data collector
python data_collector.py

echo.
echo ========================================
echo Data Collection Complete!
echo ========================================
echo.
echo The following files have been created:
echo   - data/jigsaw_toxic_en.csv
echo   - data/multilingual_toxic.csv
echo   - data/merged_dataset.csv
echo   - data/custom_dataset_template.csv
echo.
echo You can add your own labeled examples to:
echo   data/custom_dataset_template.csv
echo.
echo Next step: train-model.bat
echo.

pause
