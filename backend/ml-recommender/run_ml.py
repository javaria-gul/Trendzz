#!/usr/bin/env python3
"""
Simple runner script for ML Recommender
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("="*60)
print("🚀 STARTING TRENDZZ ML RECOMMENDER")
print("="*60)
print("📂 Current directory:", os.getcwd())
print("📁 Script directory:", os.path.dirname(os.path.abspath(__file__)))
print("="*60)

try:
    # Load environment variables if .env exists
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print("✅ Loaded environment variables from:", env_path)
    else:
        print("⚠️  .env file not found, using defaults")
    
    # Now import and run the service
    from simple_ml_service import app, Config
    import uvicorn
    
    print(f"🌐 Starting ML Recommender on port {Config.ML_PORT}")
    print(f"📊 MongoDB URI: {Config.ML_PORT}")
    print("="*60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=Config.ML_PORT,
        log_level="info",
        reload=False  # Disable reload for production
    )
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("📦 Make sure all dependencies are installed:")
    print("   pip install fastapi uvicorn pymongo pydantic")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error starting ML service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)