# Testing Guide - Text Moderation System

## Step 1: Start Flask Service

### Option A (Easy):
```powershell
cd ml-text-moderation
.\start.ps1
```

### Option B (Manual):
```powershell
cd ml-text-moderation
pip install -r requirements.txt
python app.py
```

**Expected Output:**
```
🚀 Starting Text Moderation Service...
⚠️ Model files not found. Using rule-based fallback.
 * Running on http://0.0.0.0:5001
```

## Step 2: Test Flask API (Optional)

Open new PowerShell and test:
```powershell
# Test with safe text
curl -X POST http://localhost:5001/moderate -H "Content-Type: application/json" -d '{"text":"Hello world"}'

# Expected: {"label":"safe","score":0.95}

# Test with abusive text
curl -X POST http://localhost:5001/moderate -H "Content-Type: application/json" -d '{"text":"I hate you stupid idiot"}'

# Expected: {"label":"abusive","score":0.85}
```

## Step 3: Start Backend & Frontend

### Terminal 1 (Backend):
```powershell
cd backend
npm start
```

### Terminal 2 (Frontend):
```powershell
cd frontend
npm start
```

## Step 4: Test in Application

### Test 1: Safe Post
1. Login to your app
2. Create a post with normal text: "Hello everyone! #test"
3. ✅ Should work fine

### Test 2: Abusive Post
1. Try to create post with text: "You are stupid and ugly"
2. ❌ Should show alert: "⚠️ Your text violates community guidelines"
3. Post should NOT be created

### Test 3: Abusive Comment
1. Go to any post
2. Try to add comment: "I hate this post"
3. ❌ Should show alert: "⚠️ Your text violates community guidelines"
4. Comment should NOT be added

### Test 4: Safe Comment
1. Add normal comment: "Nice post!"
2. ✅ Should work fine

## Keywords That Trigger Moderation

**Abusive words:** hate, kill, die, stupid, idiot, dumb, loser, ugly, disgusting, pathetic, worthless, trash, garbage, racist, sexist

**Also detects:**
- EXCESSIVE CAPS (>70% uppercase)
- Too many exclamation marks (!!!!!!)

## Troubleshooting

### "Failed to create post" but no moderation message
- Check if Flask service is running on port 5001
- Backend has graceful fallback - will allow posts if service is down

### Flask not starting
```powershell
# Make sure Python is installed
python --version

# Install dependencies again
pip install flask flask-cors scikit-learn numpy pandas
```

### Port 5001 already in use
```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill that process
taskkill /PID <process_id> /F
```

## Check Service Status

### Health check:
```powershell
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "text-moderation",
  "model_loaded": false,
  "vectorizer_loaded": false
}
```

## Quick Test Summary

✅ **Working correctly when:**
1. Flask shows "Running on port 5001"
2. Creating post with "stupid" shows moderation alert
3. Normal posts work fine
4. Comments with "hate" are blocked

❌ **Not working if:**
1. Abusive words don't trigger alert
2. Flask service not running
3. Backend not connected to Flask
