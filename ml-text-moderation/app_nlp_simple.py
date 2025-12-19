"""
Simple NLP-Enhanced Content Moderation
Uses TextBlob sentiment + keyword patterns
Fast and lightweight - no heavy models needed
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Try to import TextBlob for NLP, fallback to basic if not available
try:
    from textblob import TextBlob
    NLP_AVAILABLE = True
    print("✅ NLP (TextBlob) loaded successfully")
except ImportError:
    NLP_AVAILABLE = False
    print("⚠️  TextBlob not found - using pattern matching only")
    print("   Install with: pip install textblob")

# Comprehensive toxic patterns
TOXIC_PATTERNS = {
    'severe': [
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
        'kutta', 'kamina', 'harami', 'bhenchod', 'madarchod', 'chutiya', 
        'kanjri', 'randi', 'lund', 'gand', 'bhosdike'
    ],
    'moderate': [
        'stupid', 'idiot', 'moron', 'dumb', 'loser', 'ugly', 'hate', 'pathetic',
        'pagal', 'bewakoof', 'jahil', 'nalayak', 'bakwas', 'ganda', 'ullu', 'tharki'
    ],
    'violence': [
        'kill', 'murder', 'rape', 'die', 'death', 'suicide', 'bomb', 'gun', 'knife',
        'maar', 'qatal', 'maut', 'dhoka', 'bandook', 'hamla', 'khudkushi'
    ]
}

def get_sentiment_score(text):
    """Get sentiment polarity using NLP (-1 to 1)"""
    if not NLP_AVAILABLE:
        return 0.0
    
    try:
        blob = TextBlob(text)
        return blob.sentiment.polarity
    except:
        return 0.0

def get_subjectivity_score(text):
    """Get subjectivity (0=objective, 1=subjective)"""
    if not NLP_AVAILABLE:
        return 0.5
    
    try:
        blob = TextBlob(text)
        return blob.sentiment.subjectivity
    except:
        return 0.5

def count_toxic_words(text):
    """Count toxic keywords in text"""
    text_lower = text.lower()
    
    severe = sum(1 for word in TOXIC_PATTERNS['severe'] if word in text_lower)
    moderate = sum(1 for word in TOXIC_PATTERNS['moderate'] if word in text_lower)
    violence = sum(1 for word in TOXIC_PATTERNS['violence'] if word in text_lower)
    
    return severe, moderate, violence

def analyze_text_with_nlp(text):
    """NLP-enhanced text analysis"""
    if not text or len(text.strip()) < 2:
        return False, 0.0, {}
    
    # Get NLP features
    sentiment = get_sentiment_score(text)
    subjectivity = get_subjectivity_score(text)
    
    # Get pattern matches
    severe_count, moderate_count, violence_count = count_toxic_words(text)
    
    # Calculate toxicity using NLP + patterns
    pattern_score = (severe_count * 0.9) + (moderate_count * 0.5) + (violence_count * 0.95)
    
    # Negative sentiment + high subjectivity + patterns = toxic
    sentiment_factor = max(0, -sentiment)  # Only negative sentiment counts
    subjectivity_factor = subjectivity * 0.3
    
    # Combined NLP score
    toxicity_score = (pattern_score * 0.7) + (sentiment_factor * 0.2) + (subjectivity_factor * 0.1)
    
    is_toxic = toxicity_score > 0.3 or severe_count > 0 or violence_count > 0
    confidence = min(0.95, 0.4 + (toxicity_score * 0.3))
    
    # Multi-label classification
    labels = {
        'toxic': is_toxic,
        'severe_toxic': severe_count > 0 or violence_count > 0,
        'obscene': severe_count > 0,
        'threat': violence_count > 0,
        'insult': moderate_count > 0 or severe_count > 0,
        'identity_hate': False,
        'negative_sentiment': sentiment < -0.3
    }
    
    # Extra NLP info
    nlp_info = {
        'sentiment': round(sentiment, 3),
        'subjectivity': round(subjectivity, 3),
        'pattern_matches': severe_count + moderate_count + violence_count
    }
    
    return is_toxic, confidence, labels, nlp_info

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'nlp-enhanced' if NLP_AVAILABLE else 'pattern-only',
        'version': '1.0.0',
        'nlp_enabled': NLP_AVAILABLE,
        'features': ['sentiment', 'subjectivity', 'pattern_matching'] if NLP_AVAILABLE else ['pattern_matching']
    })

@app.route('/moderate', methods=['POST'])
def moderate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        is_toxic, confidence, labels, nlp_info = analyze_text_with_nlp(text)
        
        return jsonify({
            'text': text,
            'is_toxic': is_toxic,
            'confidence': round(confidence, 3),
            'labels': labels,
            'nlp_analysis': nlp_info,
            'model': 'nlp-enhanced' if NLP_AVAILABLE else 'pattern-only'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch-moderate', methods=['POST'])
def batch_moderate():
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        results = []
        for text in texts:
            is_toxic, confidence, labels, nlp_info = analyze_text_with_nlp(text)
            results.append({
                'text': text,
                'is_toxic': is_toxic,
                'confidence': round(confidence, 3),
                'labels': labels,
                'nlp_analysis': nlp_info
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Detailed NLP analysis endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        sentiment = get_sentiment_score(text)
        subjectivity = get_subjectivity_score(text)
        severe, moderate, violence = count_toxic_words(text)
        
        return jsonify({
            'text': text,
            'sentiment': {
                'polarity': round(sentiment, 3),
                'label': 'positive' if sentiment > 0.1 else 'negative' if sentiment < -0.1 else 'neutral'
            },
            'subjectivity': round(subjectivity, 3),
            'toxicity': {
                'severe_words': severe,
                'moderate_words': moderate,
                'violence_words': violence,
                'total': severe + moderate + violence
            },
            'nlp_enabled': NLP_AVAILABLE
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("🚀 NLP-Enhanced Content Moderation API")
    print("="*60)
    print(f"✅ Server: http://localhost:5002")
    print(f"🧠 NLP: {'Enabled (TextBlob)' if NLP_AVAILABLE else 'Disabled'}")
    print("🌐 Languages: English, Urdu (Roman)")
    print("📝 Endpoints: /health, /moderate, /batch-moderate, /analyze")
    print("="*60)
    
    if not NLP_AVAILABLE:
        print("\n💡 To enable NLP features, run:")
        print("   pip install textblob")
        print("   python -m textblob.download_corpora")
        print()
    
    app.run(host='0.0.0.0', port=5002, debug=False)
