"""
Simple Rule-Based Content Moderation API
Fallback while ML model downloads
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Comprehensive toxic words list (multilingual)
TOXIC_PATTERNS = {
    'english': [
        r'\b(fuck|shit|bitch|asshole|bastard|damn|crap|piss|cock|dick|pussy|cunt|whore|slut)\b',
        r'\b(kill|murder|rape|suicide|terrorist|bomb|weapon|drug|cocaine|heroin)\b',
        r'\b(stupid|idiot|moron|retard|loser|dumb|ugly|fat|disgusting)\b',
    ],
    'urdu': [
        r'(بیوقوف|احمق|گدھا|کتا|حرامی|کمینہ)',
        r'(مار|قتل|موت|خودکشی|دھماکہ)',
        r'(گالی|بدتمیز|غلیظ|فحش)',
    ],
    'arabic': [
        r'(أحمق|غبي|لعنة|كلب|حمار|قذر)',
        r'(قتل|موت|انتحار|قنبلة|سلاح)',
        r'(قبيح|سيء|فاحش)',
    ],
    'hindi': [
        r'(बेवकूफ|गधा|कुत्ता|हरामी|मूर्ख)',
        r'(मार|मौत|हत्या|बम|हथियार)',
        r'(गंदा|भद्दा|बुरा)',
    ]
}

def check_toxicity(text):
    """Check if text contains toxic content"""
    if not text:
        return False, 0.0, []
    
    text_lower = text.lower()
    detected_categories = []
    match_count = 0
    
    # Check each language pattern
    for language, patterns in TOXIC_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            if matches:
                match_count += len(matches)
                if language not in detected_categories:
                    detected_categories.append(language)
    
    # Calculate confidence based on matches
    is_toxic = match_count > 0
    confidence = min(0.95, 0.5 + (match_count * 0.15))
    
    return is_toxic, confidence, detected_categories

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'rule-based-multilingual',
        'version': '1.0.0-fallback'
    })

@app.route('/moderate', methods=['POST'])
def moderate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        is_toxic, confidence, categories = check_toxicity(text)
        
        # Mock multi-label predictions
        labels = {
            'toxic': is_toxic,
            'severe_toxic': is_toxic and confidence > 0.8,
            'obscene': is_toxic and confidence > 0.7,
            'threat': 'kill' in text.lower() or 'murder' in text.lower() or 'مار' in text,
            'insult': is_toxic and confidence > 0.6,
            'identity_hate': False
        }
        
        return jsonify({
            'text': text,
            'is_toxic': is_toxic,
            'confidence': round(confidence, 3),
            'labels': labels,
            'detected_languages': categories,
            'model': 'rule-based'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-moderate', methods=['POST'])
def batch_moderate():
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({'error': 'No texts provided'}), 400
        
        results = []
        for text in texts:
            is_toxic, confidence, categories = check_toxicity(text)
            results.append({
                'text': text,
                'is_toxic': is_toxic,
                'confidence': round(confidence, 3),
                'detected_languages': categories
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    return jsonify({
        'model_name': 'rule-based-multilingual-moderation',
        'type': 'fallback',
        'description': 'Simple rule-based moderation while ML model downloads',
        'supported_languages': list(TOXIC_PATTERNS.keys()),
        'note': 'This is a temporary fallback. ML model will be more accurate.'
    })

if __name__ == '__main__':
    print("="*60)
    print("🚀 Starting Rule-Based Moderation API (Fallback)")
    print("="*60)
    print("✅ Server: http://localhost:5001")
    print("📝 Endpoints: /health, /moderate, /batch-moderate, /info")
    print("🌐 Languages: English, Urdu, Arabic, Hindi")
    print("⚠️  Note: This is a simple fallback while ML model downloads")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)
