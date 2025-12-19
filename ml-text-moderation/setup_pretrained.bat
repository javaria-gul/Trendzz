@echo off
echo ============================================
echo Installing Pre-trained ML Model Dependencies
echo ============================================
echo.
echo This will download:
echo - Transformers library
echo - PyTorch (CPU version)
echo - Model will auto-download on first run (~250MB)
echo.
pause

pip install transformers torch

echo.
echo ============================================
echo ✅ Installation Complete!
echo ============================================
echo.
echo The pre-trained model will download automatically
echo on first run (one-time, ~250MB)
echo.
echo Run with: python app_pretrained_fast.py
echo.
pause
