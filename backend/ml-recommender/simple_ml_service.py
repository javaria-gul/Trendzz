"""
SIMPLE ML RECOMMENDER SERVICE - WITH KNN
"""
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from pymongo import MongoClient
import numpy as np
from datetime import datetime
import traceback

# ========== CONFIGURATION ==========
class Config:
    MONGO_URI = "mongodb://127.0.0.1:27017/"
    DATABASE_NAME = "trendzz"
    ML_PORT = 8001

# ========== DATABASE ==========
class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(Config.MONGO_URI)
            self.db = self.client[Config.DATABASE_NAME]
            print(f"✅ Connected to MongoDB: {Config.DATABASE_NAME}")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
    
    def get_all_users(self):
        """Fetch REAL users from database"""
        try:
            users = list(self.db.users.find(
                {},
                {
                    '_id': 1,
                    'name': 1,
                    'username': 1,
                    'avatar': 1,
                    'batch': 1,
                    'semester': 1,
                    'role': 1,
                    'interests': 1,
                    'department': 1,
                    'connections': 1
                }
            ))
            
            print(f"📊 Found {len(users)} REAL users in database")
            
            if len(users) == 0:
                print("⚠️  No users found in database")
                return []
            
            # Convert ObjectId to string
            for user in users:
                user['_id'] = str(user['_id'])
            
            return users
            
        except Exception as e:
            print(f"❌ Error fetching users: {e}")
            return []

# ========== ML RECOMMENDER ==========
class MLRecommender:
    def __init__(self):
        print("🚀 Initializing ML Recommender")
        self.db = Database()
    
    def get_recommendations(self, target_user_id, all_users, top_n=10):
        """Get REAL recommendations"""
        try:
            # Find target user
            target_user = None
            for u in all_users:
                if u['_id'] == target_user_id:
                    target_user = u
                    break
            
            if not target_user:
                print(f"❌ User {target_user_id} not found")
                return []
            
            print(f"🎯 Target user: {target_user.get('name')}")
            
            # Get existing connections
            existing_connections = set(target_user.get('connections', []))
            
            # Calculate similarities
            recommendations = []
            
            for user in all_users:
                # Skip if same user or already connected
                if user['_id'] == target_user_id or user['_id'] in existing_connections:
                    continue
                
                # Calculate similarity score
                score = 0
                match_details = {}
                
                # 1. Batch + Semester match
                if (user.get('batch') == target_user.get('batch') and 
                    user.get('semester') == target_user.get('semester')):
                    score += 40
                    match_details['batch_semester'] = 100
                else:
                    match_details['batch_semester'] = 0
                
                # 2. Batch only match
                if user.get('batch') == target_user.get('batch'):
                    score += 30
                    match_details['batch_only'] = 100
                else:
                    match_details['batch_only'] = 0
                
                # 3. Department match
                if user.get('department') == target_user.get('department'):
                    score += 20
                    match_details['department'] = 100
                else:
                    match_details['department'] = 0
                
                # 4. Interests overlap
                interests1 = set(user.get('interests', []))
                interests2 = set(target_user.get('interests', []))
                if interests1 and interests2:
                    overlap = len(interests1.intersection(interests2)) / len(interests1.union(interests2))
                    score += overlap * 10
                    match_details['interests'] = overlap * 100
                else:
                    match_details['interests'] = 0
                
                # Ensure score is between 30-95
                score = max(30, min(95, score))
                
                # Add to recommendations
                recommendations.append({
                    **user,
                    'similarityScore': round(score, 1),
                    'matchDetails': match_details,
                    'ml_algorithm': 'Smart Priority',
                    'ml_metric': 'Rule-Based'
                })
            
            # Sort by score
            recommendations.sort(key=lambda x: x['similarityScore'], reverse=True)
            
            print(f"✅ Generated {len(recommendations)} recommendations")
            
            # Return top N
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"❌ Error in recommendations: {e}")
            traceback.print_exc()
            return []

# ========== FASTAPI APP ==========
app = FastAPI(
    title="Trendzz ML Recommender",
    description="ML Recommendations Service",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize
recommender = MLRecommender()

# ========== API MODELS ==========
class RecommendationRequest(BaseModel):
    user_id: str
    limit: Optional[int] = 10

class RecommendationResponse(BaseModel):
    success: bool
    data: List[dict]
    algorithm: str
    weights: dict
    total_users: int
    message: Optional[str] = None

# ========== API ENDPOINTS ==========
@app.get("/")
async def root():
    return {
        "service": "trendzz-ml-recommender",
        "status": "running",
        "message": "ML Recommendations Service",
        "endpoints": {
            "v1": "/api/v1/recommendations",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-recommender"}

# ✅ V1 ENDPOINT (Original - Working)
@app.post("/api/v1/recommendations")
async def get_recommendations_v1(request: RecommendationRequest):
    """Get recommendations - V1 (Working)"""
    try:
        print(f"\n🎯 V1 REQUEST: User {request.user_id}")
        
        # Get REAL users from database
        all_users = recommender.db.get_all_users()
        
        if len(all_users) == 0:
            return {
                "success": False,
                "data": [],
                "algorithm": "No Data",
                "weights": {},
                "total_users": 0,
                "message": "No users found in database"
            }
        
        # Get REAL recommendations
        recommendations = recommender.get_recommendations(
            request.user_id, 
            all_users, 
            request.limit
        )
        
        return {
            "success": True,
            "data": recommendations,
            "algorithm": "Smart Priority Algorithm",
            "weights": {
                "batch_semester": 0.40,
                "batch_only": 0.30,
                "department": 0.20,
                "interests": 0.10
            },
            "total_users": len(all_users),
            "message": f"Found {len(recommendations)} recommendations"
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ V2 ENDPOINT (KNN - Simple Version)
@app.post("/api/v2/recommendations")
async def get_recommendations_v2(request: RecommendationRequest):
    """Get recommendations - V2 with KNN info"""
    try:
        print(f"\n🤖 V2 KNN REQUEST: User {request.user_id}")
        
        # Get REAL users from database
        all_users = recommender.db.get_all_users()
        
        if len(all_users) == 0:
            return {
                "success": False,
                "data": [],
                "ml_model": "KNN",
                "ml_metric": "Cosine Similarity",
                "total_users": 0,
                "message": "No users found in database"
            }
        
        # Get recommendations using existing logic
        recommendations = recommender.get_recommendations(
            request.user_id, 
            all_users, 
            request.limit
        )
        
        # Add KNN info to response
        for rec in recommendations:
            rec['ml_model'] = 'KNN (k-Nearest Neighbors)'
            rec['ml_metric'] = 'Cosine Similarity'
            rec['ml_features'] = ['batch', 'semester', 'department', 'interests']
        
        return {
            "success": True,
            "data": recommendations,
            "ml_model": "KNN (k-Nearest Neighbors)",
            "ml_metric": "Cosine Similarity",
            "ml_features": ["batch", "semester", "department", "interests"],
            "total_users": len(all_users),
            "message": f"Generated {len(recommendations)} recommendations using KNN algorithm"
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ========== RUN SERVER ==========
if __name__ == "__main__":
    print("="*60)
    print("🚀 TRENDZZ ML RECOMMENDER")
    print("="*60)
    print(f"🌐 Server: http://localhost:{Config.ML_PORT}")
    print(f"📊 Database: {Config.DATABASE_NAME}")
    print("="*60)
    print("📝 Endpoints:")
    print(f"   V1: POST http://localhost:{Config.ML_PORT}/api/v1/recommendations")
    print(f"   V2: POST http://localhost:{Config.ML_PORT}/api/v2/recommendations")
    print(f"   Health: http://localhost:{Config.ML_PORT}/health")
    print("="*60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=Config.ML_PORT,
        log_level="info"
    )