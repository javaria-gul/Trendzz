@echo off
echo Installing NLP dependencies...
echo.

pip install textblob
python -m textblob.download_corpora

echo.
echo ✅ NLP setup complete!
echo.
echo Run the service with:
echo python app_nlp_simple.py
pause
