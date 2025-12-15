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
import { getMLRecommendations } from "../../services/user";

const SidebarRight = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [followingStates, setFollowingStates] = useState({});
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

// Handle profile click - UPDATED ROUTE
const handleProfileClick = (user) => {
  // Debug
  console.log("🔄 Profile click triggered");
  console.log("📋 User data:", user);
  
  // Get user ID
  const userId = user._id || user.id || user.userId;
  
  if (!userId) {
    console.error("❌ No user ID found!");
    console.error("User object:", user);
    return;
  }
  
  console.log(`✅ Navigating to: /user/${userId}`);
  
  // NAVIGATE TO /user/:userId (NOT /profile/:userId)
  navigate(`/user/${userId}`);
};

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

  // Similarity Badge Component - FIXED
  const SimilarityBadge = ({ score }) => {
    let color = "bg-gray-100 text-gray-800";
    if (score >= 80) color = "bg-green-100 text-green-800";
    else if (score >= 60) color = "bg-blue-100 text-blue-800";
    else if (score >= 40) color = "bg-yellow-100 text-yellow-800";
    
    return (
      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color} whitespace-nowrap inline-flex items-center`}>
        <span className="font-bold">{Math.round(score)}%</span>
        <span className="ml-1">match</span>
      </div>
    );
  };

  const getUserRoleIcon = (role) => {
    if (role === 'faculty') {
      return <Briefcase size={10} className="text-amber-600" />;
    }
    return <GraduationCap size={10} className="text-blue-600" />;
  };

  const getSimilarityColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="hidden md:flex flex-col w-64 h-[calc(100vh-30px)] fixed right-3 top-4 bg-blue-900 rounded-2xl overflow-hidden">
      <div className="bg-white rounded-xl shadow m-3">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-blue-600" />
              <h2 className="font-bold text-gray-800 text-sm">Smart Suggestions</h2>
            </div>
            {mlStats && <div className="text-xs text-gray-500">AI-Powered</div>}
          </div>

          {/* Current User Info - COMPACT */}
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

          {loading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-xs mt-1">Loading...</p>
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="text-red-600 text-xs font-medium">Error</p>
              <p className="text-gray-400 text-xs mt-0.5">{error}</p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-1">
                  <Users size={12} />
                  <span>Suggested Connections</span>
                </h3>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {suggestions.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {suggestions.map((user) => {
                  const isFollowing = followingStates[user._id];
                  
                  return (
                    <div 
                      key={user._id} 
                      className="bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="p-1.5">
                        <div className="flex items-start gap-1.5">
                          {/* Avatar - Smaller */}
{/* Avatar - Clickable */}
<div className="relative flex-shrink-0">
  {/* Clickable Circle */}
  <div 
    className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden cursor-pointer border-2 border-white hover:border-blue-300 transition-all hover:scale-105"
    onClick={() => handleProfileClick(user)}
  >
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
  
  {/* Role Icon */}
  <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full border border-gray-200">
    {getUserRoleIcon(user.role)}
  </div>
</div>
                          
                          {/* User Info - COMPACT */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleProfileClick(user._id)}
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
                            
                            <div className="mt-0.5">
                              <SimilarityBadge score={user.similarityScore} />
                            </div>
                            
                            {/* FIXED: Filter out "Batch..." from reason
                            {user.reason && user.reason !== "Batch..." && !user.reason.includes("Batch...") && (
                              <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">
                                {user.reason.replace("Batch...", "").trim()}
                              </p>
                            )}
                             */}
                            {/* Tags - COMPACT HORIZONTAL */}
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
                            </div>
                          </div>
                          
                          {/* Follow Button - Smaller */}
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
                        
                        {/* Similarity Bar - Smaller */}
                        <div className="mt-1 pt-1 border-t border-gray-100">
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Similarity</span>
                            <span className={`font-bold ${getSimilarityColor(user.similarityScore).replace('bg-', 'text-')}`}>
                              {Math.round(user.similarityScore)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${getSimilarityColor(user.similarityScore)}`}
                              style={{ width: `${user.similarityScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>Live Database Query</span>
                  <span className="font-medium">{suggestions.length} matches</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users size={16} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-xs font-medium">No suggestions</p>
              <p className="text-gray-400 text-[10px] mt-0.5">
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