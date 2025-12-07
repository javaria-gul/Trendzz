// In SidebarRight.jsx, fix imports and function:
import React, { useState, useEffect, useContext } from "react";
import { 
  GraduationCap, 
  Briefcase, 
  AlertCircle, 
  UserCheck,
  Users,
  Cpu,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getMLRecommendations } from "../../services/user"; // REMOVE followUser import

const SidebarRight = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [followingStates, setFollowingStates] = useState({});
  const { userData, handleFollowAction } = useContext(AuthContext); // ADD handleFollowAction
  const navigate = useNavigate();

  // Handle follow button click - UPDATED
  const handleFollow = async (userId) => {
    try {
      setFollowingStates(prev => ({ ...prev, [userId]: true }));
      
      // Use the centralized follow function from AuthContext
      const result = await handleFollowAction(userId, false); // false = follow action
      
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
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };
  // Fetch ML recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userData) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getMLRecommendations();
        
        if (response.success && response.data) {
          setSuggestions(response.data);
          setMlStats({
            algorithm: response.algorithm,
            weights: response.weights,
            threshold: response.threshold
          });
        }
      } catch (err) {
        console.error('Error in ML recommendations:', err);
        setError(err.message);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userData]);

  // Similarity Badge Component
  const SimilarityBadge = ({ score }) => {
    let color = "bg-gray-100 text-gray-800";
    if (score >= 80) color = "bg-green-100 text-green-800";
    else if (score >= 60) color = "bg-blue-100 text-blue-800";
    else if (score >= 40) color = "bg-yellow-100 text-yellow-800";
    
    return (
      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
        {Math.round(score)}% match
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
            </div>
            {mlStats && (
              <div className="text-xs text-gray-500">
                AI-Powered
              </div>
            )}
          </div>

          {/* Current User Info */}
          {userData && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {userData.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {getUserRoleIcon(userData.role)}
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {userData.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
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
            <div className="py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-xs mt-2">Loading...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 text-xs font-medium">Error</p>
              <p className="text-gray-500 text-xs mt-1">{error}</p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {/* Suggestions Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-1">
                  <Users size={14} />
                  <span>Suggested Connections</span>
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {suggestions.length}
                </span>
              </div>

              {/* Suggestions List - FIXED: No horizontal scroll */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {suggestions.map((user) => {
                  const isFollowing = followingStates[user._id];
                  
                  return (
                    <div 
                      key={user._id} 
                      className="bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="p-2">
                        {/* User Row - FIXED: Better layout */}
                        <div className="flex items-start gap-2">
                          {/* Avatar */}
                          <div 
                            className="cursor-pointer flex-shrink-0"
                            onClick={() => handleProfileClick(user._id)}
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
                          
                          {/* User Info - FIXED: Truncate long text */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleProfileClick(user._id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-xs truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                            
                            {/* Similarity Badge */}
                            <div className="mt-1">
                              <SimilarityBadge score={user.similarityScore} />
                            </div>
                            
                            {/* Reason */}
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {user.reason}
                            </p>
                            
                            {/* Tags - FIXED: Wrap properly */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.batch && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  Batch {user.batch}
                                </span>
                              )}
                              {user.semester && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                  Sem {user.semester}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Follow Button - FIXED: Proper size and position */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(user._id);
                              }}
                              disabled={isFollowing}
                              className={`
                                flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                                ${isFollowing 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-700 text-white hover:bg-blue-900'
                                }
                                whitespace-nowrap
                              `}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck size={12} />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={12} />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Similarity Bar - FIXED: Better alignment */}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Similarity</span>
                            <span className={`font-bold ${getSimilarityColor(user.similarityScore).replace('bg-', 'text-')}`}>
                              {Math.round(user.similarityScore)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${getSimilarityColor(user.similarityScore)}`}
                              style={{ width: `${user.similarityScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Database Stats */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Live Database Query</span>
                  <span className="font-medium">{suggestions.length} matches</span>
                </div>
              </div>
            </>
          ) : (
            /* No Suggestions Found */
            <div className="py-6 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm font-medium">No suggestions</p>
              <p className="text-gray-400 text-xs mt-1">
                {userData?.role === 'student' 
                  ? "Update your profile info" 
                  : "Complete profile details"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarRight;