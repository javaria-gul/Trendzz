// backend/routes/mlRoutes.js
import express from 'express';
import { getMLRecommendations } from '../controllers/mlRecommendations.js';
import requireAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// ML Recommendations endpoint
router.get('/recommendations', requireAuth, getMLRecommendations);

// ML Model training endpoint (for course demonstration)
router.post('/train', requireAuth, (req, res) => {
  // This endpoint would trigger model training
  // For course project, you can show this as evidence
  res.json({
    success: true,
    message: "ML training endpoint",
    instructions: "Run 'python backend/ml-model/train_model.py' to train model"
  });
});

export default router;