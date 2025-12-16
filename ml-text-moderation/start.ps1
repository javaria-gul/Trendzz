# Start Flask Moderation Service
# Double-click this file to start the service

Write-Host "🔥 Starting Text Moderation Service..." -ForegroundColor Green
Write-Host "Service will run on: http://localhost:5001" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Yellow

Set-Location $PSScriptRoot
python app.py

Read-Host "`nPress Enter to exit"
