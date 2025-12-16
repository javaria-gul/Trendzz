# Text Moderation Service - Complete Standalone Module

TEXT-ONLY content moderation using NLP.

## 🚀 Quick Start (Easy Method)

### Windows:
1. Right-click `start.ps1` → Run with PowerShell
2. Service starts on http://localhost:5001

### Manual Start:
```bash
cd ml-text-moderation
pip install -r requirements.txt
python app.py
```

## 📁 Files in This Folder

- **app.py** - Flask API service (port 5001)
- **requirements.txt** - Python dependencies
- **start.ps1** - One-click startup script
- **setup.ps1** - First-time setup script

## 🔧 Backend Integration

The backend automatically connects to this service at `http://localhost:5001`.

**Backend file created:**
- `backend/utils/textModeration.js` - Calls this Flask API

**Modified files:**
- `backend/models/Post.js` - Added moderation fields
- `backend/controllers/postController.js` - Added moderation checks
- `frontend/src/components/Home/CreatePostModal.jsx` - Error handling
- `frontend/src/components/Home/PostCard.jsx` - Comment error handling

## 🔍 How It Works

1. User creates post/comment with text
2. Backend sends text to Flask API at `/moderate`
3. API returns: `{ "label": "safe|abusive|hate", "score": 0.95 }`
4. If unsafe (label != "safe"):
   - Backend returns HTTP 403
   - Frontend shows: "⚠️ Your text violates community guidelines"
5. If safe:
   - Content is saved with moderation metadata

## 📊 API Endpoints

### POST /moderate
```json
Request: { "text": "Your text here" }
Response: { "label": "safe", "score": 0.95 }
```

### GET /health
Check if service is running

### GET /
Service info

## 🛡️ Moderation Logic

**Rule-based (fallback):**
- Detects abusive keywords (hate, kill, racist, etc.)
- Checks excessive CAPS (>70% = shouting)
- Checks aggressive punctuation (!!!???)

**ML-based (optional):**
- Place `moderation_model.pkl` and `vectorizer.pkl` in this folder
- Service will automatically use ML model

## ⚠️ Important Notes

1. **This service must be running** for moderation to work
2. If service is down, backend allows content (graceful fallback)
3. No media moderation - TEXT ONLY
4. All existing posts/comments are unaffected
5. Database fields are optional and backward compatible
