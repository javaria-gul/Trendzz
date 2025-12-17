# ml-text-moderation/app.py
# Flask API for text-only content moderation
# Detects abusive, hate speech, and inappropriate text

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import re

app = Flask(__name__)
CORS(app)

# Load pre-trained model and vectorizer
MODEL_PATH = 'moderation_model.pkl'
VECTORIZER_PATH = 'vectorizer.pkl'

# Global variables for model and vectorizer
model = None
vectorizer = None

def load_model():
    """Load the trained model and vectorizer"""
    global model, vectorizer
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            with open(VECTORIZER_PATH, 'rb') as f:
                vectorizer = pickle.load(f)
            print("✅ Model and vectorizer loaded successfully")
        else:
            print("⚠️ Model files not found. Using rule-based fallback.")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("⚠️ Using rule-based fallback.")

def rule_based_moderation(text):
    """Fallback rule-based moderation using keyword matching"""
    text_lower = text.lower()
    
    # Comprehensive abusive/offensive keywords list
    hate_keywords = [
        # Basic abusive words
        'hate', 'kill', 'die', 'murder', 'dead', 'death', 'suicide',
        'stupid', 'idiot', 'dumb', 'moron', 'fool', 'loser', 'failure',
        'ugly', 'disgusting', 'pathetic', 'worthless', 'useless', 'trash', 'garbage',
        'racist', 'sexist', 'homophobic', 'slur', 'offensive',
        
        # Strong profanity
        'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker', 'motherf***er',
        'bitch', 'bitches', 'son of a bitch', 'asshole', 'ass', 'bastard',
        'shit', 'shit', 'bullshit', 'damn', 'damned', 'hell', 'crap',
        'piss', 'pissed', 'dick', 'cock', 'penis', 'pussy', 'vagina',
        'whore', 'slut', 'prostitute', 'hooker',
        
        # Racial slurs
        'nigger', 'nigga', 'negro', 'coon', 'spic', 'beaner', 'wetback',
        'chink', 'gook', 'jap', 'zipperhead', 'raghead', 'towelhead',
        'kike', 'hymie', 'cracker', 'honkey', 'whitey', 'gringo',
        'paki', 'muzzie', 'terrorist',
        
        # Homophobic slurs
        'fag', 'faggot', 'dyke', 'queer', 'homo', 'gay' + ' ' + 'slur',
        'tranny', 'shemale',
        
        # Sexist/misogynistic terms
        'cunt', 'twat', 'slut', 'whore', 'hoe', 'thot', 'bimbo',
        
        # Ableist slurs
        'retard', 'retarded', 'tard', 'spastic', 'cripple', 'gimp',
        'psycho', 'crazy', 'insane', 'mental',
        
        # Religious offensive terms
        'blasphemy', 'heretic', 'infidel', 'kafir', 'kaffir',
        'godless', 'heathen', 'pagan', 'idol worshipper',
        
        # Violent threats
        'attack', 'assault', 'rape', 'molest', 'abuse', 'torture',
        'stab', 'shoot', 'bomb', 'explosion', 'terrorist',
        
        # Body shaming
        'fat', 'obese', 'pig', 'cow', 'whale', 'skinny', 'anorexic',
        'short', 'midget', 'dwarf', 'giant',
        
        # General toxicity
        'cancer', 'aids', 'disease', 'plague', 'parasite', 'scum',
        'filth', 'vermin', 'pest', 'lowlife', 'cockroach',
        'slave', 'servant', 'inferior', 'subhuman',
        
        # Internet toxicity
        'kys', 'kill yourself', 'hang yourself', 'end yourself',
        'neck yourself', 'commit suicide', 'die in a fire',
        'get cancer', 'get aids', 'hope you die'
    ]
    
    # Check for abusive content
    for keyword in hate_keywords:
        if keyword in text_lower:
            return {
                "label": "abusive",
                "score": 0.85,
                "method": "rule-based"
            }
    
    # Check for excessive caps (shouting)
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.7 and len(text) > 10:
        return {
            "label": "abusive",
            "score": 0.65,
            "method": "rule-based"
        }
    
    # Check for excessive punctuation (aggressive)
    punct_ratio = sum(1 for c in text if c in '!?') / max(len(text), 1)
    if punct_ratio > 0.3:
        return {
            "label": "abusive",
            "score": 0.60,
            "method": "rule-based"
        }
    
    return {
        "label": "safe",
        "score": 0.95,
        "method": "rule-based"
    }

def ml_based_moderation(text):
    """ML-based moderation using trained model"""
    try:
        # Transform text using vectorizer
        text_vectorized = vectorizer.transform([text])
        
        # Predict using model
        prediction = model.predict(text_vectorized)[0]
        
        # Get prediction probability
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(text_vectorized)[0]
            score = float(max(proba))
        else:
            score = 0.90
        
        # Map prediction to label
        label_map = {
            0: "safe",
            1: "abusive",
            2: "hate"
        }
        
        label = label_map.get(prediction, "safe")
        
        return {
            "label": label,
            "score": score,
            "method": "ml-model"
        }
    except Exception as e:
        print(f"❌ ML prediction error: {e}")
        return rule_based_moderation(text)

@app.route('/moderate', methods=['POST'])
def moderate_text():
    """
    Moderate text content
    Input: { "text": "string" }
    Output: { "label": "safe|abusive|hate", "score": float }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                "error": "Missing 'text' field in request"
            }), 400
        
        text = data['text'].strip()
        
        if not text:
            return jsonify({
                "label": "safe",
                "score": 1.0
            })
        
        # Use ML model if available, otherwise fallback to rules
        if model is not None and vectorizer is not None:
            result = ml_based_moderation(text)
        else:
            result = rule_based_moderation(text)
        
        return jsonify({
            "label": result["label"],
            "score": result["score"]
        })
        
    except Exception as e:
        print(f"❌ Moderation error: {e}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "text-moderation",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None
    })

@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return jsonify({
        "service": "Text Moderation API",
        "version": "1.0.0",
        "endpoints": {
            "/moderate": "POST - Moderate text content",
            "/health": "GET - Health check"
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Text Moderation Service...")
    load_model()
    app.run(host='0.0.0.0', port=5001, debug=True)
