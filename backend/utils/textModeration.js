// backend/utils/textModeration.js
// Utility to moderate text content via Flask ML API

import axios from 'axios';

const MODERATION_API_URL = process.env.MODERATION_API_URL || 'http://localhost:5001';

/**
 * Moderate text content using ML API
 * @param {string} text - Text to moderate
 * @returns {Promise<{label: string, score: number, isSafe: boolean}>}
 */
export const moderateText = async (text) => {
  try {
    // Skip empty text
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        label: 'safe',
        score: 1.0,
        isSafe: true
      };
    }

    // Call moderation API
    const response = await axios.post(`${MODERATION_API_URL}/moderate`, {
      text: text.trim()
    }, {
      timeout: 5000 // 5 second timeout
    });

    const { label, score } = response.data;

    return {
      label,
      score,
      isSafe: label === 'safe'
    };

  } catch (error) {
    console.error('Text moderation error:', error.message);
    
    // Fallback: if moderation service is down, allow content but log
    console.warn('⚠️ Moderation service unavailable. Allowing content.');
    
    return {
      label: 'safe',
      score: 0.5,
      isSafe: true,
      fallback: true
    };
  }
};

/**
 * Check if moderation service is healthy
 * @returns {Promise<boolean>}
 */
export const checkModerationHealth = async () => {
  try {
    const response = await axios.get(`${MODERATION_API_URL}/health`, {
      timeout: 3000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('Moderation health check failed:', error.message);
    return false;
  }
};
