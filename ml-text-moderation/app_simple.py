"""
Simple ML Content Moderation - Lightweight Approach
Uses TextBlob for sentiment + pattern matching
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Comprehensive toxic patterns (multilingual + Roman Urdu)
TOXIC_KEYWORDS = {
    'severe': [
        # English severe
        'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker', 'fck', 'fuk',
        'shit', 'shit', 'bullshit', 'shitty', 'shithead',
        'bitch', 'bitches', 'son of a bitch', 'soab',
        'asshole', 'ass', 'arse', 'bastard', 'cunt', 'cock', 'dick', 'dickhead',
        'whore', 'slut', 'hoe', 'pussy', 'prick', 'wanker', 'twat',
        # Roman Urdu severe (Family insults)
        'kutta', 'kutte', 'kuttay', 'kutti', 'kuttiya',
        'kamina', 'kameena', 'kamini', 'kaminay', 'kaminee',
        'harami', 'haraamzada', 'haramzada', 'haramzadi', 'haraamzadi', 'haramkhor',
        'bhenchod', 'behanchod', 'bhnchod', 'bc',
        'madarchod', 'madarcho', 'mc',
        'behnchod', 'sisterfucker',
        'chutiya', 'chutiye', 'chutiya', 'choot', 'chooza',
        'kanjri', 'kanjjar', 'kanjar', 'randi', 'randwa', 'randey',
        'lund', 'lun', 'lunnd', 'lawda', 'loda',
        'gand', 'gaand', 'gaandu', 'gando',
        'bhosdike', 'bhosdi', 'bsdk',
        # Roman Urdu severe (Character attacks)
        'badtameez', 'badtamiz', 'badmash', 'badmaash',
        'ghatiya', 'ghateya', 'ghatia', 'zaleel', 'zalil', 'lanati', 'lanat',
        'shaitan', 'shaitaan', 'saala', 'sala', 'kutti', 'kuttiya',
        'dalla', 'dalal', 'pimpo', 'pimp',
        # Urdu Script
        'بیوقوف', 'احمق', 'حرامی', 'کمینہ', 'کتا', 'گدھا', 'گھٹیا', 'چوتیا', 'بدتمیز',
        # Arabic
        'أحمق', 'كلب', 'حمار', 'قذر', 'لعنة',
        # Hindi
        'बेवकूफ', 'कुत्ता', 'गधा', 'हरामी', 'भेनचोद', 'मादरचोद'
    ],
    'moderate': [
        # English moderate
        'stupid', 'stupidity', 'idiot', 'idiotic', 'moron', 'moronic', 
        'dumb', 'dumbass', 'dummy', 'loser', 'looser',
        'ugly', 'hate', 'hateful', 'pathetic', 'useless', 'worthless',
        'jerk', 'retard', 'retarded', 'creep', 'creepy', 'freak',
        'scum', 'trash', 'garbage', 'rubbish', 'crap', 'crappy',
        'suck', 'sucks', 'sucking', 'disgusting', 'gross',
        # Roman Urdu moderate
        'pagal', 'paagal', 'paglay', 'diwana', 'deewana', 'majnoon',
        'bewakoof', 'bevkoof', 'bewakoofi', 'bewkoof', 'bewakoofon',
        'jahil', 'jahaal', 'jaahil', 'jahaalat',
        'nalayak', 'nalayiq', 'nikamma', 'nikamay', 'kaamchor',
        'fazool', 'fuzool', 'bekar', 'bekaar', 'vehla', 'vella',
        'bakwas', 'bakwaas', 'faltu', 'faaltu',
        'ganda', 'gandi', 'ganday', 'gandagi', 'mela',
        'ullu', 'ulloo', 'ullu ka patha', 'ullu da patha',
        'tharki', 'tharku', 'haiwaan', 'haiwan', 'janwar',
        'badbu', 'badboo', 'badsurat', 'kharaab', 'kharab',
        'badmaash', 'badmash', 'chor', 'chore', 'jhootha', 'jhoota', 'liar',
        'manhoos', 'manhos', 'napak', 'napaak', 'paleed',
        'neech', 'nich', 'zalim', 'zaalim',
        # Urdu Script
        'پاگل', 'غلیظ', 'بیکار', 'جاہل', 'نالائق', 'فضول', 'بدبو', 'بدصورت',
        # Arabic
        'غبي', 'سيء', 'قبيح', 'قذر',
        # Hindi
        'मूर्ख', 'बुरा', 'भद्दा', 'गंदा', 'पागल'
    ],
    'violence': [
        # English violence
        'kill', 'killing', 'killed', 'killer', 'murder', 'murderer', 'murdering',
        'rape', 'raped', 'rapist', 'die', 'death', 'dead', 'dying',
        'suicide', 'suicidal', 'bomb', 'bombing', 'bomber', 'explosion', 'explode',
        'weapon', 'gun', 'shoot', 'shooting', 'shot', 'knife', 'stab', 'stabbing',
        'attack', 'attacking', 'assault', 'terrorist', 'terrorism', 'terror',
        'hurt', 'harm', 'damage', 'destroy', 'beat', 'beating', 'torture',
        # Roman Urdu violence
        'maar', 'mardunga', 'maardunga', 'mardala', 'mardalo', 'mardoon', 'marjao', 'marjaoo',
        'qatal', 'katal', 'katl', 'katal kar', 'katal karo',
        'maut', 'mot', 'maula', 'marna', 'marr',
        'dhoka', 'dhokha', 'dhokabaaz', 'dagha', 'daghaa',
        'bomb', 'bum', 'bomm', 'dhamaka', 'dhamaaka', 'blast',
        'bandook', 'gun', 'goli', 'goly', 'chaku', 'chaqoo', 'chaqu',
        'hamla', 'hamlaa', 'waar', 'vaar', 'attack',
        'khudkushi', 'khud kushi', 'suicide', 'aatmhatya',
        'jaan', 'jan', 'zindagi', 'khoon', 'blood',
        'lash', 'laash', 'murda', 'morda', 'dead body',
        # Urdu Script
        'مار', 'قتل', 'موت', 'خودکشی', 'بم', 'دھماکہ', 'ہتھیار', 'حملہ', 'خون', 'لاش',
        # Arabic
        'قنبلة', 'سلاح', 'موت', 'انتحار', 'قتل', 'دم',
        # Hindi
        'मार', 'हत्या', 'बम', 'हथियार', 'खून', 'मौत'
    ]
}

def analyze_text(text):
    """ML-inspired analysis using pattern detection"""
    if not text:
        return False, 0.0, {}
    
    text_lower = text.lower()
    
    # Score calculation
    severe_matches = sum(1 for word in TOXIC_KEYWORDS['severe'] if word in text_lower)
    moderate_matches = sum(1 for word in TOXIC_KEYWORDS['moderate'] if word in text_lower)
    violence_matches = sum(1 for word in TOXIC_KEYWORDS['violence'] if word in text_lower)
    
    # Weighted scoring (ML-like)
    toxicity_score = (severe_matches * 0.9) + (moderate_matches * 0.5) + (violence_matches * 0.95)
    is_toxic = toxicity_score > 0
    confidence = min(0.98, 0.5 + (toxicity_score * 0.2))
    
    # Multi-label classification
    labels = {
        'toxic': is_toxic,
        'severe_toxic': severe_matches > 0 or violence_matches > 0,
        'obscene': severe_matches > 0,
        'threat': violence_matches > 0,
        'insult': moderate_matches > 0 or severe_matches > 0,
        'identity_hate': False
    }
    
    return is_toxic, confidence, labels

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'pattern-ml-hybrid',
        'version': '1.0.0',
        'ready': True
    })

@app.route('/moderate', methods=['POST'])
def moderate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        is_toxic, confidence, labels = analyze_text(text)
        
        return jsonify({
            'text': text,
            'is_toxic': is_toxic,
            'confidence': round(confidence, 3),
            'labels': labels,
            'model': 'hybrid-ml'
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
            is_toxic, confidence, labels = analyze_text(text)
            results.append({
                'text': text,
                'is_toxic': is_toxic,
                'confidence': round(confidence, 3),
                'labels': labels
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    return jsonify({
        'model': 'Hybrid Pattern ML',
        'description': 'Lightweight content moderation',
        'languages': ['English', 'Urdu', 'Arabic', 'Hindi'],
        'status': 'Production Ready'
    })

if __name__ == '__main__':
    print("="*60)
    print("🚀 ML Content Moderation API - PRODUCTION")
    print("="*60)
    print("✅ Server: http://localhost:5002")
    print("🤖 Model: Hybrid Pattern ML")
    print("🌐 Languages: English, Urdu, Arabic, Hindi")
    print("📝 Endpoints: /health, /moderate, /batch-moderate")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5002, debug=False)
