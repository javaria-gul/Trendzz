// backend/controllers/mlRecommendations.js
import { spawn } from 'child_process';
import path from 'path';

export const getMLRecommendations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    console.log(`🤖 ML Request for user: ${userId}`);
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'backend/ml-model/predict.py'),
      userId
    ]);
    
    let mlResults = [];
    let pythonError = '';
    
    pythonProcess.stdout.on('data', (data) => {
      try {
        mlResults = JSON.parse(data.toString());
        console.log(`✅ ML Model returned ${mlResults.length} suggestions`);
      } catch (e) {
        console.error('❌ Failed to parse ML output:', e.message);
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      pythonError = data.toString();
      console.error('🐍 Python Error:', pythonError);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && mlResults.length > 0) {
        // SUCCESS: Return ML recommendations
        res.status(200).json({
          success: true,
          data: mlResults,
          algorithm: "K-Nearest Neighbors (ML Model)",
          source: "Trained ML Model",
          modelVersion: "1.0",
          note: "Real ML predictions based on user similarity"
        });
      } else {
        // ML failed - return empty but don't error
        console.log('⚠️ ML model not available, returning empty');
        res.status(200).json({
          success: true,
          data: [],
          algorithm: "ML Model (Not Available)",
          source: "Fallback to existing system",
          note: "ML model training required"
        });
        // NOTE: Frontend will use existing route as fallback
      }
    });
    
  } catch (error) {
    console.error('❌ ML Controller error:', error);
    // Don't send error - return empty to prevent frontend crash
    res.status(200).json({
      success: true,
      data: [],
      algorithm: "Error in ML System",
      source: "Using existing system",
      note: "ML system temporarily unavailable"
    });
  }
};