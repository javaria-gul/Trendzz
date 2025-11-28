import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserProfile, followUser, admireUser, blockUser, unblockUser } from '../services/user';
import { 
  User, 
  Heart, 
  MessageCircle, 
  Shield,
  Eye,
  MoreVertical,
  GraduationCap,
  Users,
  X,
  Ban,
  UserX
} from 'lucide-react';

const OtherUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData: currentUser, updateUserData } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasAdmired, setHasAdmired] = useState(false);
  const [error, setError] = useState('');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isAdmireLoading, setIsAdmireLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  // Check if user is blocked
  const checkIfBlocked = () => {
    if (!currentUser || !currentUser.blockedUsers) return false;
    return currentUser.blockedUsers.includes(userId);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError('');
      
      // Check if user is blocked before fetching
      const blocked = checkIfBlocked();
      setIsBlocked(blocked);
      
      if (blocked) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getUserProfile(userId);
        
        if (response.data.success) {
          const userData = response.data.data;
          setUserProfile(userData);
          setIsFollowing(userData.isFollowing || false);
          setHasAdmired(userData.hasAdmired || false);
        } else {
          setError(response.data.message || 'Failed to load user profile');
        }

      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.response?.data?.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, currentUser]);

  // Follow functionality
  const handleFollow = async () => {
    if (!currentUser) {
      alert('Please login to follow users');
      return;
    }

    setIsFollowLoading(true);
    try {
      const response = await followUser(userId);
      
      if (response.data.success) {
        setIsFollowing(response.data.isFollowing);
        
        setUserProfile(prev => ({
          ...prev,
          followersCount: response.data.followersCount || prev.followersCount
        }));

        if (currentUser && updateUserData) {
          const updatedFollowing = response.data.isFollowing 
            ? [...(currentUser.following || []), userId]
            : currentUser.following.filter(id => id !== userId);
          
          updateUserData({
            ...currentUser,
            following: updatedFollowing
          });
        }

        console.log(response.data.message);
      } else {
        alert(response.data.message || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to follow user';
      alert(errorMessage);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Block functionality
  const handleBlockUser = async () => {
    try {
      const response = await blockUser(userId);
      if (response.data.success) {
        setShowOptions(false);
        setShowBlockConfirm(false);
        
        // Update current user's blocked list
        if (currentUser && updateUserData) {
          const updatedBlockedUsers = [...(currentUser.blockedUsers || []), userId];
          updateUserData({
            ...currentUser,
            blockedUsers: updatedBlockedUsers
          });
        }
        
        setIsBlocked(true);
        
        // Show success message without alert window
        setShowSuccessMessage(`${userProfile.name} has been blocked`);
        setTimeout(() => setShowSuccessMessage(''), 3000);
        
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert(error.response?.data?.message || 'Failed to block user');
      setShowBlockConfirm(false);
    }
  };

  // Unblock functionality
  const handleUnblockUser = async () => {
    try {
      const response = await unblockUser(userId);
      if (response.data.success) {
        // Update current user's blocked list
        if (currentUser && updateUserData) {
          const updatedBlockedUsers = (currentUser.blockedUsers || []).filter(id => id !== userId);
          updateUserData({
            ...currentUser,
            blockedUsers: updatedBlockedUsers
          });
        }
        
        setIsBlocked(false);
        
        // Refresh the profile
        const profileResponse = await getUserProfile(userId);
        if (profileResponse.data.success) {
          const userData = profileResponse.data.data;
          setUserProfile(userData);
          setIsFollowing(userData.isFollowing || false);
          setHasAdmired(userData.hasAdmired || false);
        }
        
        // Show success message without alert window
        setShowSuccessMessage(`${userProfile.name} has been unblocked`);
        setTimeout(() => setShowSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const confirmBlockUser = () => {
    setShowBlockConfirm(true);
    setShowOptions(false);
  };

  const cancelBlockUser = () => {
    setShowBlockConfirm(false);
  };

  // Admire functionality
  const handleAdmire = async () => {
    if (!currentUser) {
      alert('Please login to admire users');
      return;
    }

    setIsAdmireLoading(true);
    try {
      const response = await admireUser(userId);
      
      if (response.data.success) {
        setHasAdmired(response.data.hasAdmired);
        
        setUserProfile(prev => ({
          ...prev,
          admirersCount: response.data.admirersCount || prev.admirersCount
        }));

        console.log(response.data.hasAdmired ? 'User admired successfully' : 'User unadmired successfully');
      } else {
        alert(response.data.message || 'Failed to admire user');
      }
    } catch (error) {
      console.error('Error admiring user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to admire user';
      alert(errorMessage);
    } finally {
      setIsAdmireLoading(false);
    }
  };

  // Handle message
  const handleMessage = () => {
    navigate(`/chat/${userId}`);
  };

  // Handle view posts
  const handleViewPosts = () => {
    navigate(`/user/${userId}/posts`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile && !isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
          <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Blocked User View
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
                {showSuccessMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Blocked User Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden mb-4 sm:mb-6"
          >
            {/* Cover Photo - Dimmed */}
            <div 
              className="h-48 sm:h-64 bg-gradient-to-r from-purple-500 to-pink-500 relative opacity-50"
              style={{ 
                backgroundImage: userProfile?.coverImage ? `url(${userProfile.coverImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            {/* Blocked User Info */}
            <div className="px-4 sm:px-6 pb-6 sm:pb-8">
              <div className="flex flex-col items-center text-center -mt-20">
                {/* Avatar - Dimmed */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-2xl border-4 border-white bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden opacity-50">
                    {userProfile?.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-white" />
                    )}
                  </div>
                  {/* Block Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500 rounded-full p-3 shadow-lg">
                      <Ban size={32} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Blocked Message */}
                <div className="space-y-4 max-w-md">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {userProfile?.name || 'User Name'}
                  </h1>
                  
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex flex-col items-center space-y-3">
                      <UserX size={48} className="text-red-500" />
                      <h2 className="text-xl font-bold text-red-700">You've Blocked This User</h2>
                      <p className="text-red-600 text-center">
                        You have blocked this user. Unblock to view their profile and content.
                      </p>
                    </div>
                  </div>

                  {/* Unblock Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUnblockUser}
                    className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-lg"
                  >
                    <Shield className="inline mr-2" size={20} />
                    Unblock User
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Normal User Profile View
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
              {showSuccessMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Modal */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Options</h3>
                <button
                  onClick={() => setShowOptions(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleViewPosts();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition"
                >
                  <Eye size={18} />
                  View Posts
                </button>
                
                <button
                  onClick={confirmBlockUser}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition"
                >
                  <Shield size={18} />
                  Block User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Confirmation Modal */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Block {userProfile.name}?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to block this user? You won't be able to see their profile or posts anymore.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={cancelBlockUser}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Block User
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden mb-4 sm:mb-6 relative"
        >
          {/* Cover Photo */}
          <div 
            className="h-48 sm:h-64 bg-gradient-to-r from-purple-500 to-pink-500 relative"
            style={{ 
              backgroundImage: userProfile.coverImage ? `url(${userProfile.coverImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Profile Info */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex items-start gap-4 sm:gap-6 mt-14 sm:mt-18">
              {/* Avatar */}
              <div className="relative flex-shrink-0 -mt-28 sm:-mt-32">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-2xl border-4 border-white bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden">
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt={userProfile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="space-y-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                        {userProfile.name || 'User Name'}
                      </h1>
                      <p className="text-gray-500 text-lg">
                        @{userProfile.username || 'username'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-2">
                  <p className="text-gray-600 whitespace-pre-wrap break-words text-sm sm:text-base">
                    {userProfile.bio || 'No bio yet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-72 right-4 sm:top-80 sm:right-6">
            <div className="flex gap-2 items-center">
              {/* Follow Button */}
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isFollowing 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-red-700 text-white hover:bg-blue-900'
                } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isFollowLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  isFollowing ? 'Following' : 'Follow'
                )}
              </button>

              {/* Admire Button */}
              <button
                onClick={handleAdmire}
                disabled={isAdmireLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                  hasAdmired 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-700 text-white hover:bg-blue-900'
                } ${isAdmireLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAdmireLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Heart size={16} fill={hasAdmired ? 'currentColor' : 'none'} />
                )}
                {hasAdmired ? 'Admired' : 'Admire'}
              </button>

              {/* Message Button */}
              {userProfile.privacySettings?.allowMessages && (
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium"
                >
                  <MessageCircle size={16} />
                  Message
                </button>
              )}

              {/* Options Button */}
              <button
                onClick={() => setShowOptions(true)}
                className="flex items-center justify-center w-10 h-10 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Rest of your profile content remains the same */}
        {/* ... (Social Stats, Academic Information, Personal Information, Recent Followers) */}


                {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Social Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Heart className="text-red-500" size={18} fill="currentColor" />
              Social Stats
            </h2>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-red-600">{userProfile.admirersCount || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Admirers</p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{userProfile.following?.length || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Following</p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{userProfile.followers?.length || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Followers</p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{userProfile.postsCount || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Posts</p>
              </div>
            </div>
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <GraduationCap className="text-blue-500" size={18} />
              Academic Information
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Role</p>
                <p className="text-base sm:text-lg font-semibold text-gray-800 capitalize">{userProfile.role || 'Not set'}</p>
              </div>

              {userProfile.role === 'student' && (
                <>
                  {userProfile.semester && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Semester</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-800">{userProfile.semester}</p>
                    </div>
                  )}
                  
                  {userProfile.batch && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Batch</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-800">{userProfile.batch}</p>
                    </div>
                  )}
                </>
              )}

              {userProfile.role === 'faculty' && userProfile.subjects && userProfile.subjects.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Subjects</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {userProfile.subjects.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-6"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <User className="text-purple-500" size={18} />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Member Since</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                {new Date(userProfile.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
            
            {userProfile.lastSeen && (
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Last Active</p>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                  {new Date(userProfile.lastSeen).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Followers (if available) */}
        {userProfile.followers && userProfile.followers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-6"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="text-green-500" size={18} />
              Recent Followers
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userProfile.followers.slice(0, 4).map((follower) => (
                <div
                  key={follower._id}
                  className="text-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/user/${follower._id}`)}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white mb-2 overflow-hidden border-2 border-white shadow-lg">
                    {follower.avatar ? (
                      <img 
                        src={follower.avatar} 
                        alt={follower.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {follower.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{follower.username}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      
      </div>
    </div>
  );
};

export default OtherUserProfile;