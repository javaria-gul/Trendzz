"""
Production Inference API
Flask server that loads trained model and serves predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import logging
import os
from datetime import datetime
from functools import lru_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
model = None
tokenizer = None
device = None
label_names = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']

def load_model(model_path='models/toxic-classifier'):
    """Load trained model and tokenizer"""
    global model, tokenizer, device
    
    try:
        logger.info(f"🔄 Loading model from: {model_path}")
        
        # Check if model exists
        if not os.path.exists(model_path):
            logger.error(f"❌ Model not found at: {model_path}")
            logger.info("💡 Please train the model first using: python train_model.py")
            return False
        
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        
        # Set device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model.to(device)
        model.eval()
        
        logger.info(f"✅ Model loaded successfully on {device}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {str(e)}")
        return False

@lru_cache(maxsize=1000)
def predict_cached(text, threshold):
    """Cached prediction for frequently seen texts"""
    return predict_text(text, threshold)

def predict_text(text, threshold=0.7):
    """
    Predict toxicity for given text
    
    Returns:
        dict with predictions and confidence scores
    """
    try:
        # Tokenize
        encodings = tokenizer(
            text,
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors='pt'
        )
        
        # Move to device
        input_ids = encodings['input_ids'].to(device)
        attention_mask = encodings['attention_mask'].to(device)
        
        # Predict
        with torch.no_grad():
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            predictions = torch.sigmoid(logits).cpu().numpy()[0]
        
        # Parse results
        results = {}
        flagged_labels = []
        max_confidence = 0.0
        
        for i, label in enumerate(label_names):
            score = float(predictions[i])
            results[label] = score
            
            if score >= threshold:
                flagged_labels.append(label)
                max_confidence = max(max_confidence, score)
        
        is_flagged = len(flagged_labels) > 0
        
        return {
            'flagged': is_flagged,
            'reason': flagged_labels[0] if flagged_labels else None,
            'flagged_categories': flagged_labels,
            'confidence': max_confidence,
            'scores': results
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_loaded = model is not None and tokenizer is not None
    
    return jsonify({
        'status': 'healthy' if model_loaded else 'unhealthy',
        'model_loaded': model_loaded,
        'device': str(device) if device else None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/moderate', methods=['POST'])
def moderate():
    """
    Main moderation endpoint
    
    Request:
    {
        "text": "Text to moderate",
        "threshold": 0.7  (optional)
    }
    
    Response:
    {
        "flagged": true/false,
        "reason": "toxic",
        "flagged_categories": ["toxic", "obscene"],
        "confidence": 0.95,
        "scores": {
            "toxic": 0.95,
            "severe_toxic": 0.23,
            ...
        }
    }
    """
    try:
        # Validate model is loaded
        if model is None or tokenizer is None:
            return jsonify({
                'error': 'Model not loaded',
                'flagged': False
            }), 503
        
        # Parse request
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing text field'
            }), 400
        
        text = data.get('text', '').strip()
        threshold = data.get('threshold', 0.7)
        
        # Empty text
        if not text:
            return jsonify({
                'flagged': False,
                'reason': None,
                'flagged_categories': [],
                'confidence': 0.0,
                'scores': {}
            })
        
        logger.info(f"📝 Moderating: {text[:50]}...")
        
        # Predict
        result = predict_text(text, threshold)
        
        if result['flagged']:
            logger.warning(f"🚫 FLAGGED: {result['reason']} (confidence: {result['confidence']:.2f})")
        else:
            logger.info("✅ Content approved")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Moderation error: {str(e)}")
        return jsonify({
            'error': str(e),
            'flagged': False
        }), 500

@app.route('/batch-moderate', methods=['POST'])
def batch_moderate():
    """
    Batch moderation endpoint
    
    Request:
    {
        "texts": ["text1", "text2", ...],
        "threshold": 0.7
    }
    """
    try:
        if model is None or tokenizer is None:
            return jsonify({
                'error': 'Model not loaded'
            }), 503
        
        data = request.get_json()
        texts = data.get('texts', [])
        threshold = data.get('threshold', 0.7)
        
        if not texts:
            return jsonify({'error': 'Missing texts field'}), 400
        
        logger.info(f"📦 Batch moderating {len(texts)} texts")
        
        results = []
        for text in texts:
            result = predict_text(text, threshold)
            results.append(result)
        
        flagged_count = sum(1 for r in results if r['flagged'])
        
        return jsonify({
            'results': results,
            'total': len(results),
            'flagged_count': flagged_count,
            'flagged_percentage': (flagged_count / len(results) * 100) if results else 0
        })
        
    except Exception as e:
        logger.error(f"Batch moderation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'model_loaded': model is not None,
        'labels': label_names,
        'device': str(device) if device else None,
        'model_path': 'models/toxic-classifier'
    })

if __name__ == '__main__':
    logger.info("🚀 Starting ML Moderation Service...")
    
    # Load model
    model_loaded = load_model()
    
    if not model_loaded:
        logger.error("="*60)
        logger.error("❌ FAILED TO LOAD MODEL")
        logger.error("="*60)
        logger.error("")
        logger.error("Please train the model first:")
        logger.error("  1. Collect data: python data_collector.py")
        logger.error("  2. Train model: python train_model.py")
        logger.error("  3. Start server: python app.py")
        logger.error("")
        logger.error("="*60)
    else:
        logger.info("="*60)
        logger.info("✅ ML Moderation Service Ready!")
        logger.info("="*60)
        logger.info("")
        logger.info("API Endpoints:")
        logger.info("  GET  /health          - Health check")
        logger.info("  POST /moderate        - Moderate single text")
        logger.info("  POST /batch-moderate  - Moderate multiple texts")
        logger.info("  GET  /info            - Model information")
        logger.info("")
        logger.info("Starting server on http://0.0.0.0:5001")
        logger.info("="*60)
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5001, debug=False)
