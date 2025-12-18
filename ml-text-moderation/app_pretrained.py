"""
ML-Based Content Moderation API (Pre-trained Model)
No training needed - uses pre-trained model directly
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import torch

app = Flask(__name__)
CORS(app)

print("🔄 Loading ML model...")
print("⏳ This will download ~250MB on first run...")

# Use pre-trained toxic comment classifier
# No training needed - works out of the box!
try:
    classifier = pipeline(
        "text-classification",
        model="unitary/toxic-bert",
        device=-1  # CPU
    )
    print("✅ ML Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    classifier = None

def analyze_toxicity(text):
    """Analyze text using ML model"""
    if not classifier:
        return {'error': 'Model not loaded'}, False, 0.0
    
    try:
        result = classifier(text[:512])[0]  # Limit to 512 chars
        label = result['label']
        score = result['score']
        
        is_toxic = label == 'toxic'
        confidence = score if is_toxic else (1 - score)
        
        return {
            'toxic': is_toxic,
            'severe_toxic': is_toxic and confidence > 0.8,
            'obscene': is_toxic and confidence > 0.7,
            'threat': False,
            'insult': is_toxic and confidence > 0.6,
            'identity_hate': False
        }, is_toxic, confidence
    
    except Exception as e:
        return {'error': str(e)}, False, 0.0

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy' if classifier else 'model_not_loaded',
        'model': 'unitary/toxic-bert (pre-trained)',
        'type': 'ML-based',
        'version': '1.0.0'
    })

@app.route('/moderate', methods=['POST'])
def moderate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if not classifier:
            return jsonify({'error': 'Model not loaded'}), 503
        
        labels, is_toxic, confidence = analyze_toxicity(text)
        
        return jsonify({
            'text': text,
            'is_toxic': is_toxic,
            'confidence': round(confidence, 3),
            'labels': labels,
            'model': 'ML-pretrained'
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
            labels, is_toxic, confidence = analyze_toxicity(text)
            results.append({
                'text': text,
                'is_toxic': is_toxic,
                'confidence': round(confidence, 3)
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    return jsonify({
        'model_name': 'unitary/toxic-bert',
        'type': 'ML-pretrained',
        'description': 'Pre-trained ML model for toxicity detection',
        'note': 'No training needed - uses production-ready model'
    })

if __name__ == '__main__':
    print("="*60)
    print("🚀 Starting ML Moderation API (Pre-trained)")
    print("="*60)
    print("✅ Server: http://localhost:5001")
    print("🤖 Model: Pre-trained ML (NOT static rules)")
    print("📝 Endpoints: /health, /moderate, /batch-moderate, /info")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)
