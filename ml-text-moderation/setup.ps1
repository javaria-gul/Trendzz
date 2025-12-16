# Complete Setup Script for Text Moderation
# Run this once to set up everything

Write-Host "🚀 Setting up Text Moderation System..." -ForegroundColor Green

# Step 1: Install Python packages
Write-Host "`n📦 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location "ml-text-moderation"
pip install flask flask-cors scikit-learn numpy pandas

# Step 2: Start Flask service in background
Write-Host "`n🔥 Starting Flask moderation service..." -ForegroundColor Yellow
Start-Process python -ArgumentList "app.py" -WindowStyle Normal

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "Flask service is running on http://localhost:5001" -ForegroundColor Cyan
Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
Read-Host
