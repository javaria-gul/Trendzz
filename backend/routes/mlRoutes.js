import express from 'express';
import axios from 'axios';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// Import auth middleware
import authMiddleware from '../middleware/authMiddleware.js';

// ✅ TEST ROUTE - Without authentication (for debugging)
router.get('/test-connection', async (req, res) => {
    try {
        console.log('🔍 Testing connection to ML service...');
        
        // Test 1: Direct health check
        const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 3000
        });
        
        console.log('✅ ML Service Health:', healthResponse.data);
        
        // Test 2: Try test endpoint
        const testResponse = await axios.get(
            `${ML_SERVICE_URL}/api/v1/test/65f2a1b3c8d9e7f0a1b2c3d4`,
            { timeout: 5000 }
        );
        
        console.log('✅ ML Test Response:', {
            success: testResponse.data.success,
            count: testResponse.data.recommendations?.length || 0
        });
        
        res.json({
            success: true,
            ml_service: ML_SERVICE_URL,
            health: healthResponse.data,
            test: testResponse.data,
            message: 'ML service connection successful'
        });
        
    } catch (error) {
        console.error('❌ ML Service Connection Test FAILED:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   URL:', ML_SERVICE_URL);
        
        // Check if Python service is running
        console.error('   ⚠️  Check if Python ML service is running:');
        console.error('       1. cd ml-recommender');
        console.error('       2. python simple_ml_service.py');
        
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            ml_service: ML_SERVICE_URL,
            message: 'Cannot connect to ML service. Make sure Python service is running on port 8001.'
        });
    }
});

// ✅ GET ML SERVICE HEALTH (for monitoring)
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 3000
        });
        
        res.json({
            success: true,
            ml_service: response.data,
            message: 'ML service is running'
        });
        
    } catch (error) {
        console.error('ML Service Health Check Failed:', error.message);
        
        res.status(503).json({
            success: false,
            error: error.message,
            message: 'ML service is not available',
            solution: 'Start the ML service: python simple_ml_service.py in ml-recommender folder'
        });
    }
});

// ✅ REAL RECOMMENDATIONS - WITH PROPER ERROR HANDLING
router.get('/recommendations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        
        console.log(`\n🤖 [ML REQUEST] Fetching recommendations for user: ${userId}`);
        console.log(`   📝 User: ${req.user.name} (${req.user.role})`);
        console.log(`   📊 Batch: ${req.user.batch}, Semester: ${req.user.semester}`);
        console.log(`   🔗 Calling ML service: ${ML_SERVICE_URL}/api/v1/recommendations`);
        
        // Call Python ML service
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/v1/recommendations`,
            { 
                user_id: userId,
                limit: 10 
            },
            { 
                timeout: 10000, // 10 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ [ML RESPONSE] Success:`, {
            success: response.data.success,
            count: response.data.data?.length || 0,
            message: response.data.message,
            total_users: response.data.total_users || 0
        });
        
        // Return the response directly
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ [ML ERROR] Recommendations Failed:');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('   ⚠️  Connection refused - Python ML service is not running');
            console.error('   💡 Solution: Start ML service:');
            console.error('       1. cd ml-recommender');
            console.error('       2. python simple_ml_service.py');
            
            return res.status(503).json({
                success: false,
                data: [],
                algorithm: "Service Unavailable",
                message: "ML service is not running. Please start the Python ML service on port 8001.",
                error_code: error.code,
                solution: "Run: python ml-recommender/simple_ml_service.py"
            });
        }
        
        if (error.code === 'ETIMEDOUT') {
            console.error('   ⚠️  Timeout - Python service is slow');
            
            return res.json({
                success: false,
                data: [],
                algorithm: "Service Timeout",
                message: "ML service is taking too long to respond. Please try again.",
                error_code: error.code
            });
        }
        
        if (error.response) {
            console.error('   📊 Python ML service error:', error.response.data);
            
            return res.status(error.response.status).json({
                success: false,
                data: [],
                algorithm: "ML Service Error",
                message: `ML service error: ${error.response.data.detail || error.message}`,
                error_code: error.code
            });
        }
        
        console.error('   📝 Error:', error.message);
        
        // Generic error response
        res.status(500).json({
            success: false,
            data: [],
            algorithm: "Internal Error",
            message: `Failed to get recommendations: ${error.message}`,
            error_code: error.code
        });
    }
});

// ✅ TEST RECOMMENDATIONS WITH SPECIFIC USER
router.get('/test/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`🔬 Testing ML recommendations for user: ${userId}`);
        
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/v1/recommendations`,
            { 
                user_id: userId,
                limit: 5 
            },
            { 
                timeout: 8000
            }
        );
        
        res.json({
            success: true,
            test_user: userId,
            result: response.data
        });
        
    } catch (error) {
        console.error('Test error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            test_user: req.params.userId
        });
    }
});

export default router;