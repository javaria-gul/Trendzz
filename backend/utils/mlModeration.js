// backend/utils/mlModeration.js - ML-based content moderation
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5002';
const DEFAULT_THRESHOLD = 0.7;

/**
 * Check content using ML moderation service
 * @param {string} text - Text to moderate
 * @param {number} threshold - Confidence threshold (0-1)
 * @returns {Promise<Object>} Moderation result
 */
export const moderateContent = async (text, threshold = DEFAULT_THRESHOLD) => {
  try {
    console.log('🤖 Checking content with ML model...');
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/moderate`,
      { text },
      { timeout: 5000 }
    );
    
    const data = response.data;
    
    // New format: { is_toxic, confidence, toxicity_score, labels, model }
    const isToxic = data.is_toxic && data.confidence >= threshold;
    
    // Find flagged categories
    const flaggedCategories = [];
    if (data.labels) {
      Object.entries(data.labels).forEach(([key, value]) => {
        if (value && key !== 'toxic') {
          flaggedCategories.push(key);
        }
      });
    }
    
    const result = {
      flagged: isToxic,
      reason: isToxic ? (flaggedCategories[0] || 'toxic') : null,
      flagged_categories: flaggedCategories,
      confidence: data.confidence || 0,
      toxicity_score: data.toxicity_score || 0,
      model: data.model || 'unknown',
      scores: data.labels || {}
    };
    
    if (result.flagged) {
      console.log(`❌ Content FLAGGED by ML model (${data.model})`);
      console.log(`   Reason: ${result.reason}`);
      console.log(`   Categories: ${flaggedCategories.join(', ')}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`✅ Content approved by ML model (${data.model})`);
    }
    
    return result;
    
  } catch (error) {
    // Handle ML service unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('⚠️ ML moderation service unavailable');
      console.warn('   Allowing content (fail-open mode)');
      
      // Return safe default - allow content if service is down
      return {
        flagged: false,
        reason: null,
        flagged_categories: [],
        confidence: 0,
        serviceUnavailable: true
      };
    }
    
    console.error('❌ ML moderation error:', error.message);
    throw error;
  }
};

/**
 * Check if content should be blocked
 * @param {string} text - Text to check
 * @param {number} threshold - Optional threshold (default: 0.7)
 * @returns {Promise<Object>} { allowed: boolean, reason: string, details: object }
 */
export const checkContentAllowed = async (text, threshold = DEFAULT_THRESHOLD) => {
  if (!text || text.trim().length === 0) {
    return { allowed: true, reason: null };
  }
  
  const result = await moderateContent(text, threshold);
  
  if (result.flagged) {
    // Map technical categories to user-friendly messages
    const reasonMap = {
      'toxic': 'Your post contains inappropriate or toxic content',
      'severe_toxic': 'Your post contains severely toxic content',
      'obscene': 'Your post contains obscene language',
      'threat': 'Your post contains threatening content',
      'insult': 'Your post contains insulting language',
      'identity_hate': 'Your post contains hateful content'
    };
    
    const userMessage = reasonMap[result.reason] || 
                        'Your content violates our community guidelines';
    
    return {
      allowed: false,
      reason: userMessage,
      details: {
        categories: result.flagged_categories,
        confidence: result.confidence,
        scores: result.scores
      }
    };
  }
  
  return { 
    allowed: true, 
    reason: null,
    serviceAvailable: !result.serviceUnavailable
  };
};

/**
 * Batch moderate multiple texts
 * @param {string[]} texts - Array of texts
 * @param {number} threshold - Optional threshold
 * @returns {Promise<Array>} Array of moderation results
 */
export const batchModerateContent = async (texts, threshold = DEFAULT_THRESHOLD) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/batch-moderate`,
      { texts, threshold },
      { timeout: 10000 }
    );
    
    return response.data.results;
    
  } catch (error) {
    console.error('Batch moderation error:', error.message);
    
    // Return all as allowed if service is down
    return texts.map(() => ({
      flagged: false,
      serviceUnavailable: true
    }));
  }
};

/**
 * Check ML service health
 * @returns {Promise<Object>} Health status
 */
export const checkServiceHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
    return response.data;
  } catch (error) {
    return {
      status: 'unavailable',
      model_loaded: false,
      error: error.message
    };
  }
};
