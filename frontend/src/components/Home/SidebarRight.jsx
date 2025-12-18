import React, { useState, useEffect, useContext } from "react";
import { 
  GraduationCap, 
  Briefcase, 
  AlertCircle, 
  UserCheck,
  Users,
  Cpu,
  UserPlus,
  RefreshCw,
  Database,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from 'axios';

const SidebarRight = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [followingStates, setFollowingStates] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [dbStats, setDbStats] = useState({ totalUsers: 0, connected: false });
  
  const { userData, handleFollowAction } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handle follow button click
  const handleFollow = async (userId) => {
    try {
      setFollowingStates(prev => ({ ...prev, [userId]: true }));
      
      const result = await handleFollowAction(userId, false);
      
      if (result.success) {
        setSuggestions(prev => prev.filter(user => user._id !== userId));
      } else {
        throw new Error(result.error || 'Failed to follow');
      }
    } catch (err) {
      console.error('Follow error:', err);
      setFollowingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Navigate to user profile
  const handleProfileClick = (userId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔗 Navigating to user profile from sidebar:', userId);
    navigate(`/user/${userId}`);
  };

  // Fetch recommendations DIRECTLY from Python ML service
  const fetchMLRecommendations = async () => {
    if (!userData || !userData._id) {
      console.log("⚠️ Waiting for user data...");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 [ML] Fetching recommendations for user:', userData._id);
      console.log('👤 User Profile:', {
        name: userData.name,
        batch: userData.batch,
        semester: userData.semester,
        role: userData.role
      });
      
      // DIRECT CALL to Python ML Service
// Change API endpoint to v2
// Temporary: Use v1 endpoint (jo working hai)
const response = await axios.post(
    'http://localhost:8001/api/v1/recommendations',  // ✅ V1 USE KARO
    {
        user_id: userData._id,
        limit: 10
    },
    {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    }
);

// Add ML model info display
{mlStats && (
    <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-[10px] text-gray-500">
            <div className="flex justify-between">
                <span>ML Model:</span>
                <span className="font-medium">{response.data.ml_model || 'KNN'}</span>
            </div>
            <div className="flex justify-between mt-0.5">
                <span>Algorithm:</span>
                <span className="font-medium">k-Nearest Neighbors</span>
            </div>
        </div>
    </div>
)}
      console.log('✅ [ML] Response received:', {
        success: response.data.success,
        count: response.data.data?.length || 0,
        message: response.data.message,
        total_users: response.data.total_users
      });

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Show all recommendations
        setSuggestions(response.data.data);
        setMlStats({
          algorithm: response.data.algorithm || "Smart ML",
          weights: response.data.weights || {},
          totalUsers: response.data.total_users || 0
        });
        setDbStats({
          totalUsers: response.data.total_users || 0,
          connected: true
        });
        setError(null);
        
        console.log(`🎯 Showing ${response.data.data.length} recommendations`);
        
        // Log top recommendations
        response.data.data.slice(0, 3).forEach((rec, i) => {
          console.log(`   ${i+1}. ${rec.name} - Score: ${rec.similarityScore}%`);
        });
      } else {
        // No data or empty response
        setError(response.data.message || "No recommendations available");
        setSuggestions([]);
        console.log('⚠️ ML service returned empty recommendations');
      }

    } catch (err) {
      console.error('❌ [ML] Error:', err.message);
      
      if (err.code === 'ECONNREFUSED') {
        setError("ML service not running. Start: python simple_ml_service.py");
      } else if (err.code === 'ETIMEDOUT') {
        setError("ML service timeout. Please wait...");
        // Auto-retry after 3 seconds
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchMLRecommendations();
          }, 3000);
        }
      } else {
        setError(`Error: ${err.message}`);
      }
      
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setRetryCount(0);
    fetchMLRecommendations();
  };

  useEffect(() => {
    if (userData && userData._id) {
      fetchMLRecommendations();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchMLRecommendations, 300000);
      return () => clearInterval(interval);
    }
  }, [userData, retryCount]);

  // Similarity Badge Component
  const SimilarityBadge = ({ score }) => {
    let color = "bg-gray-100 text-gray-800";
    let icon = "⭐";
    
    if (score >= 80) {
      color = "bg-green-100 text-green-800";
      icon = "🔥";
    } else if (score >= 60) {
      color = "bg-blue-100 text-blue-800";
      icon = "⚡";
    } else if (score >= 40) {
      color = "bg-yellow-100 text-yellow-800";
      icon = "✨";
    }
    
    return (
      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color} whitespace-nowrap inline-flex items-center gap-1`}>
        <span>{icon}</span>
        <span className="font-bold">{Math.round(score)}%</span>
        <span className="ml-1">match</span>
      </div>
    );
  };

  // Get user role icon
  const getUserRoleIcon = (role) => {
    if (role === 'faculty') {
      return <Briefcase size={10} className="text-amber-600" />;
    }
    return <GraduationCap size={10} className="text-blue-600" />;
  };

  // Get similarity color
  const getSimilarityColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="hidden md:flex flex-col w-64 h-[calc(100vh-30px)] fixed right-3 top-4 bg-blue-900 rounded-2xl overflow-hidden">
      
      {/* ML-Powered Suggestions Card */}
      <div className="bg-white rounded-xl shadow m-3">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-800 text-sm">
                Smart Suggestions
              </h2>
              <Sparkles size={12} className="text-yellow-500" />
            </div>
            <div className="flex items-center gap-1">
              {dbStats.connected && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  <Database size={8} />
                  <span>{dbStats.totalUsers} users</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Refresh recommendations"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Current User Info */}
          {userData && (
            <div className="mb-2 p-1.5 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                  {userData.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                            ${userData.name?.charAt(0) || 'U'}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {userData.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {getUserRoleIcon(userData.role)}
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {userData.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 truncate">
                    {userData.role === 'student' 
                      ? `Batch ${userData.batch || 'N/A'}, Sem ${userData.semester || 'N/A'}`
                      : 'Faculty Member'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-xs mt-1">
                {retryCount > 0 ? `Retrying... (${retryCount})` : "Analyzing profiles..."}
              </p>
              <p className="text-gray-400 text-[10px] mt-0.5">
                Matching batch, semester & interests
              </p>
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="text-red-600 text-xs font-medium">Unable to fetch</p>
              <p className="text-gray-400 text-xs mt-0.5 max-w-[200px] mx-auto">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-blue-600 text-[10px] font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {/* Suggestions Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-1">
                  <Users size={12} />
                  <span>Suggested Connections</span>
                </h3>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {suggestions.length} matches
                </span>
              </div>

              {/* Suggestions List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {suggestions.map((user) => {
                  const isFollowing = followingStates[user._id];
                  
                  return (
                    <div 
                      key={user._id} 
                      className="bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="p-1.5">
                        {/* User Row */}
                        <div className="flex items-start gap-1.5">
                          {/* Avatar */}
                          <div 
                            className="cursor-pointer flex-shrink-0"
                            onClick={(e) => handleProfileClick(user._id, e)}
                          >
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  user.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full border border-gray-200">
                                {getUserRoleIcon(user.role)}
                              </div>
                            </div>
                          </div>
                          
                          {/* User Info */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={(e) => handleProfileClick(user._id, e)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-xs truncate">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate mt-px">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                            
                            {/* Similarity Badge */}
                            <div className="mt-0.5">
                              <SimilarityBadge score={user.similarityScore} />
                            </div>
                            
                            {/* Tags */}
                            <div className="flex items-center gap-1 mt-0.5">
                              {user.batch && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center font-medium">
                                  <span>Batch</span>
                                  <span className="ml-0.5 font-bold">{user.batch}</span>
                                </span>
                              )}
                              {user.semester && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center font-medium">
                                  <span>Sem</span>
                                  <span className="ml-0.5 font-bold">{user.semester}</span>
                                </span>
                              )}
                              {user.department && (
                                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center font-medium">
                                  <span>{user.department}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Follow Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(user._id);
                              }}
                              disabled={isFollowing}
                              className={`
                                flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200
                                ${isFollowing 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-700 text-white hover:bg-blue-900'
                                }
                                whitespace-nowrap
                              `}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck size={10} />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={10} />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Similarity Bar */}
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Match Score</span>
                            <span className={`font-bold ${getSimilarityColor(user.similarityScore).replace('bg-', 'text-')}`}>
                              {Math.round(user.similarityScore)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${getSimilarityColor(user.similarityScore)}`}
                              style={{ width: `${Math.min(user.similarityScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ML Stats */}
              {mlStats && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-[10px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="font-medium">{mlStats.algorithm}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>Database:</span>
                      <span className="font-medium">{mlStats.totalUsers} users</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No Suggestions Found */
            <div className="py-4 text-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users size={16} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-xs font-medium">No matches found</p>
              <p className="text-gray-400 text-[10px] mt-0.5">
                Update your profile with batch & semester
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarRight;