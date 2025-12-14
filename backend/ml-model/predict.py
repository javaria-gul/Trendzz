# backend/ml-model/predict.py
import sys
import json
import pickle
import numpy as np
from pymongo import MongoClient

def load_ml_model():
    """Load trained ML model"""
    try:
        with open('backend/ml-model/models/ml_model_latest.pkl', 'rb') as f:
            model_data = pickle.load(f)
        return model_data
    except:
        return None

def get_user_features(user_data):
    """Extract features from user data (same as training)"""
    # Batch
    batch_num = 0
    if user_data.get('batch'):
        try:
            batch_num = float(user_data['batch'])
        except:
            pass
    
    # Semester
    semester_num = 0
    if user_data.get('semester'):
        try:
            semester_str = str(user_data['semester']).lower()
            if 'sem' in semester_str:
                semester_str = semester_str.replace('sem', '').strip()
            semester_num = float(''.join(filter(str.isdigit, semester_str)) or 0)
        except:
            pass
    
    # Role
    role_encoded = 1 if user_data.get('role') == 'faculty' else 0
    
    # Interests & Skills
    interests_count = len(user_data.get('interests', []))
    skills_count = len(user_data.get('skills', []))
    
    # Engagement
    following_count = len(user_data.get('following', []))
    followers_count = len(user_data.get('followers', []))
    engagement_score = following_count + followers_count
    
    return np.array([[batch_num, semester_num, role_encoded, 
                     interests_count, skills_count, engagement_score]])

def get_ml_recommendations(user_id):
    """Get recommendations using ML model"""
    model_data = load_ml_model()
    
    if not model_data:
        return []
    
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client.socialmedia
    
    # Get current user
    current_user = db.users.find_one({'_id': user_id})
    if not current_user:
        return []
    
    # Get all users (excluding current user)
    all_users = list(db.users.find(
        {'_id': {'$ne': user_id}},
        {'_id': 1, 'name': 1, 'username': 1, 'avatar': 1, 
         'batch': 1, 'semester': 1, 'role': 1}
    ))
    
    if len(all_users) == 0:
        return []
    
    # Prepare current user features
    current_features = get_user_features(current_user)
    current_scaled = model_data['scaler'].transform(current_features)
    
    # Find similar users using KNN
    distances, indices = model_data['model'].kneighbors(
        current_scaled, 
        n_neighbors=min(6, len(all_users))
    )
    
    # Prepare recommendations
    recommendations = []
    for i, idx in enumerate(indices[0]):
        if i >= len(all_users):
            continue
            
        user = all_users[idx]
        similarity = 100 * (1 - distances[0][i])  # Convert distance to similarity %
        
        if similarity > 20:  # Threshold
            recommendations.append({
                '_id': str(user['_id']),
                'name': user.get('name', 'Unknown'),
                'username': user.get('username', ''),
                'avatar': user.get('avatar', ''),
                'batch': user.get('batch', ''),
                'semester': user.get('semester', ''),
                'role': user.get('role', 'student'),
                'similarityScore': round(similarity, 1),
                'reason': f'ML Match: {round(similarity, 1)}% similar'
            })
    
    return recommendations[:6]  # Return top 6

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        results = get_ml_recommendations(user_id)
        print(json.dumps(results))
    else:
        print(json.dumps([]))