# backend/ml-model/export_data.py
import json
from pymongo import MongoClient
import os

def export_user_data():
    """Export MongoDB data to JSON for training"""
    # Connect to your existing MongoDB
    client = MongoClient('mongodb://localhost:27017/')  # Same as your app
    db = client.socialmedia  # Your database name
    users = db.users.find()
    
    data = []
    for user in users:
        data.append({
            'user_id': str(user['_id']),
            'name': user.get('name', ''),
            'batch': user.get('batch', ''),
            'semester': user.get('semester', ''),
            'department': user.get('department', ''),
            'role': user.get('role', 'student'),
            'interests': user.get('interests', []),
            'skills': user.get('skills', []),
            'following': [str(f) for f in user.get('following', [])],
            'followers': [str(f) for f in user.get('followers', [])]
        })
    
    # Save to file
    with open('backend/ml-model/data/users_dataset.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Exported {len(data)} users for ML training")
    return len(data)

if __name__ == "__main__":
    export_user_data()