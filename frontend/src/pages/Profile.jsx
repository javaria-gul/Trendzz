import React, { useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Edit3, Camera, X, User, GraduationCap, Heart, CheckCircle, XCircle, Image, Users } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getFollowingList, getFollowersList, getUserById, followUser } from '../services/user';

const Profile = () => {
  const { userData, updateUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    username: '',
    semester: '',
    batch: '',
    subjects: [],
    avatar: '',
    coverImage: '',
    avatarFile: null,
    coverFile: null
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [usernameChangeTime, setUsernameChangeTime] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempCover, setTempCover] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followerUsers, setFollowerUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState({});
  
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const modalRef = useRef(null);

  // Initialize form when userData changes
  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || '',
        bio: userData.bio || '',
        username: userData.username || '',
        semester: userData.semester || '',
        batch: userData.batch || '',
        subjects: userData.subjects || [],
        avatar: userData.avatar || '/avatars/avatar1.png',
        coverImage: userData.coverImage || '',
        avatarFile: null,
        coverFile: null
      });
      setUsernameChangeTime(userData.lastUsernameChange || null);

      // Process following data
      if (userData.following) {
        const processedFollowing = userData.following.map(user => ({
          ...user,
          _id: user._id || user,
          name: user.name || 'User',
          username: user.username || 'username',
          avatar: user.avatar || null,
          isFollowing: true
        }));
        setFollowingUsers(processedFollowing);
      }

      // Process followers data
      if (userData.followers) {
        const processedFollowers = userData.followers.map(user => ({
          ...user,
          _id: user._id || user,
          name: user.name || 'User',
          username: user.username || 'username',
          avatar: user.avatar || null,
          isFollowing: userData.following?.some(followingUser => 
            (followingUser._id || followingUser) === (user._id || user)
          ) || false
        }));
        setFollowerUsers(processedFollowers);
      }
    }
  }, [userData]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isEditing]);

  // Check if username can be changed (30 days cooldown)
  const canChangeUsername = () => {
    if (!usernameChangeTime) return true;
    const lastChange = new Date(usernameChangeTime);
    const now = new Date();
    const diffTime = Math.abs(now - lastChange);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    setTimeout(() => {
      const available = Math.random() > 0.3;
      setIsUsernameAvailable(available);
      setIsCheckingUsername(false);
    }, 1000);
  };

  const handleUsernameChange = (username) => {
    setEditForm(prev => ({ ...prev, username }));
    if (username.length >= 3) {
      checkUsernameAvailability(username);
    } else {
      setIsUsernameAvailable(null);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'avatar') {
          setTempAvatar(e.target.result);
        } else {
          setTempCover(e.target.result);
        }
      };
      reader.readAsDataURL(file);

      if (type === 'avatar') {
        setEditForm(prev => ({ ...prev, avatarFile: file }));
      } else {
        setEditForm(prev => ({ ...prev, coverFile: file }));
      }

      console.log(`✅ ${type} image selected for upload`);
    } catch (error) {
      console.error(`Error reading ${type} image:`, error);
      alert(`Failed to process ${type} image`);
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('🟡 Starting profile update with images...');
      
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', editForm.name);
      formData.append('username', editForm.username);
      formData.append('bio', editForm.bio);
      formData.append('role', userData.role);
      formData.append('semester', editForm.semester);
      formData.append('batch', editForm.batch);
      formData.append('subjects', JSON.stringify(editForm.subjects));
      
      // Add image files if they exist
      if (editForm.avatarFile) {
        console.log('📸 Adding avatar file to form data');
        formData.append('avatar', editForm.avatarFile);
      }
      if (editForm.coverFile) {
        console.log('📸 Adding cover file to form data');
        formData.append('coverImage', editForm.coverFile);
      }

      console.log('📦 Sending profile update with form data');

      let response;
      let lastError;
      
      const endpoints = [
        '/api/auth/profile-with-images',
        '/auth/profile-with-images',
        '/api/profile-with-images',
        '/profile-with-images'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          response = await API.put(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log(`✅ Success with endpoint: ${endpoint}`);
          break;
        } catch (error) {
          lastError = error;
          console.log(`❌ Failed with endpoint: ${endpoint}`, error.response?.status);
          continue;
        }
      }

      if (!response) {
        throw new Error(`All endpoints failed. Last error: ${lastError?.message}`);
      }
      
      console.log('✅ API Response received:', response.data);

      if (response.data.success) {
        console.log('🔄 Updated user data:', response.data.user);
        updateUserData(response.data.user);
        localStorage.setItem("trendzz_user", JSON.stringify(response.data.user));
        
        // Clear temporary files
        setEditForm(prev => ({ ...prev, avatarFile: null, coverFile: null }));
        setTempAvatar(null);
        setTempCover(null);
        
        alert('✅ Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error('❌ Profile update error:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        console.error('❌ Server response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Network error - No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      alert('Error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: userData?.name || '',
      bio: userData?.bio || '',
      username: userData?.username || '',
      semester: userData?.semester || '',
      batch: userData?.batch || '',
      subjects: userData?.subjects || [],
      avatar: userData?.avatar || '/avatars/avatar1.png',
      coverImage: userData?.coverImage || '',
      avatarFile: null,
      coverFile: null
    });
    setTempAvatar(null);
    setTempCover(null);
    setIsEditing(false);
    setIsUsernameAvailable(null);
  };

// KEEP this one (around line 361) and REMOVE the duplicate inside FollowingModal

// Handle follow/unfollow in modals - UPDATED VERSION
const handleFollowInModal = async (userId, isCurrentlyFollowing, e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!userData) {
    alert('Please login to follow users');
    return;
  }

  setFollowLoading(prev => ({ ...prev, [userId]: true }));

  try {
    const response = await followUser(userId);
    
    if (response.data.success) {
      // Update following users list
      setFollowingUsers(prev => 
        prev.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              isFollowing: response.data.isFollowing
            };
          }
          return user;
        })
      );

      // Update followers list
      setFollowerUsers(prev => 
        prev.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              isFollowing: response.data.isFollowing
            };
          }
          return user;
        })
      );

      // Update global user data WITH FOLLOWING COUNT
      if (updateUserData) {
        // Calculate new following count
        const currentFollowing = userData.following || [];
        let newFollowingCount = userData.followingCount || currentFollowing.length;
        
        if (response.data.isFollowing) {
          // Follow action
          newFollowingCount += 1;
        } else {
          // Unfollow action  
          newFollowingCount = Math.max(0, newFollowingCount - 1);
        }
        
        // Get updated following array
        const updatedFollowing = response.data.isFollowing 
          ? [...currentFollowing, userId]
          : currentFollowing.filter(id => {
              const followingId = typeof id === 'object' ? id._id : id;
              return followingId?.toString() !== userId.toString();
            });
        
        updateUserData({
          ...userData,
          following: updatedFollowing,
          followingCount: newFollowingCount
        });
      }

      console.log(response.data.isFollowing ? 'Followed successfully' : 'Unfollowed successfully');
    } else {
      alert(response.data.message || 'Failed to follow user');
    }
  } catch (error) {
    console.error('Error following user:', error);
    const errorMessage = error.response?.data?.message || 'Failed to follow user';
    alert(errorMessage);
  } finally {
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  }
};

  // Followers Modal Component
// Improved Followers Modal Component
const FollowersModal = () => {
  const [localFollowers, setLocalFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);
        const response = await getFollowersList(userData._id);
        
        if (response.data.success) {
          console.log('✅ Followers fetched:', response.data.followers);
          const processedFollowers = response.data.followers.map(follower => ({
            ...follower,
            isFollowing: userData.following?.some(followingUser => {
              const followingId = typeof followingUser === 'object' ? followingUser._id : followingUser;
              return followingId.toString() === follower._id.toString();
            }) || false
          }));
          setLocalFollowers(processedFollowers);
        } else {
          // Fallback to existing data
          setLocalFollowers(followerUsers);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
        setLocalFollowers(followerUsers);
      } finally {
        setLoading(false);
      }
    };

    if (showFollowersModal) {
      fetchFollowers();
    }
  }, [showFollowersModal, userData._id, userData.following, followerUsers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowFollowersModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl max-h-96 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Your Followers ({localFollowers.length || 0})
          </h3>
          <button
            onClick={() => setShowFollowersModal(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
            </div>
          ) : localFollowers.length > 0 ? (
            <div className="space-y-3">
              {localFollowers.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      setShowFollowersModal(false);
                      navigate(`/user/${follower._id}`);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden border-2 border-white shadow">
                      {follower.avatar ? (
                        <img 
                          src={follower.avatar} 
                          alt={follower.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {follower.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{follower.username}
                      </p>
                    </div>
                  </div>
                  
                  {userData && follower._id.toString() !== userData._id.toString() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowInModal(follower._id, follower.isFollowing, e);
                      }}
                      disabled={followLoading[follower._id]}
                      className={`px-3 py-1 text-xs rounded-lg transition font-medium ${
                        follower.isFollowing 
                          ? 'bg-gray-500 text-white hover:bg-gray-600' 
                          : 'bg-red-700 text-white hover:bg-blue-900'
                      } ${followLoading[follower._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {followLoading[follower._id] ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                      ) : (
                        follower.isFollowing ? 'Following' : 'Follow'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No followers yet</p>
              <p className="text-sm text-gray-400 mt-1">
                When someone follows you, they'll appear here
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

  // Following Modal Component
// Fixed Following Modal Component
const FollowingModal = () => {
  const [localFollowing, setLocalFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [followLoading, setFollowLoading] = useState({});

  // Fetch following users with proper data
  useEffect(() => {
    const fetchFollowingUsers = async () => {
      try {
        setLoading(true);
        
        // Use the new function you added to user.js service
        const response = await getFollowingList(userData._id);
        
        if (response.data.success) {
          console.log('✅ Following users fetched:', response.data.following);
          
          const processedUsers = response.data.following.map(user => ({
            _id: user._id,
            name: user.name || 'User',
            username: user.username || 'username',
            avatar: user.avatar || null,
            bio: user.bio || '',
            role: user.role || '',
            isFollowing: true // Since these are users you're following
          }));
          
          setLocalFollowing(processedUsers);
        } else {
          console.error('Failed to fetch following list');
          // Fallback to existing processed data
          if (followingUsers && followingUsers.length > 0) {
            setLocalFollowing(followingUsers);
          } else {
            setLocalFollowing([]);
          }
        }
      } catch (error) {
        console.error('Error fetching following users:', error);
        // Fallback to existing processed data
        if (followingUsers && followingUsers.length > 0) {
          setLocalFollowing(followingUsers);
        } else {
          setLocalFollowing([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (showFollowingModal) {
      fetchFollowingUsers();
    }
  }, [showFollowingModal]);

  // Get actual count
  const actualCount = localFollowing.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowFollowingModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl max-h-96 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            You're Following ({actualCount})
          </h3>
          <button
            onClick={() => setShowFollowingModal(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
            </div>
          ) : localFollowing.length > 0 ? (
            <div className="space-y-3">
              {localFollowing.map((followingUser) => (
                <div
                  key={followingUser._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      setShowFollowingModal(false);
                      if (followingUser._id && !followingUser._id.startsWith('temp-')) {
                        navigate(`/user/${followingUser._id}`);
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden border-2 border-white shadow">
                      {followingUser.avatar ? (
                        <img 
                          src={followingUser.avatar} 
                          alt={followingUser.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {followingUser.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{followingUser.username}
                      </p>
                    </div>
                  </div>
                  
                  {userData && followingUser._id && followingUser._id.toString() !== userData._id.toString() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowInModal(followingUser._id, followingUser.isFollowing, e);
                      }}
                      disabled={followLoading[followingUser._id]}
                      className={`px-3 py-1 text-xs rounded-lg transition font-medium ${
                        followingUser.isFollowing 
                          ? 'bg-red-700 text-white hover:bg-red-700' 
                          : 'bg-red-700 text-white hover:bg-blue-900'
                      } ${followLoading[followingUser._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {followLoading[followingUser._id] ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                      ) : (
                        followingUser.isFollowing ? 'Following' : 'Follow'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Not following anyone yet</p>
              <p className="text-sm text-gray-400 mt-1">
                When you follow someone, they'll appear here
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const currentAvatar = tempAvatar || userData.avatar;
  const currentCover = tempCover || userData.coverImage;
  const admirersCount = userData.admirersCount || 0;
  const bioCharsCount = editForm.bio ? editForm.bio.length : 0;
  const maxChars = 60;
  const followersCount = followerUsers.length || 0;
  // Around line 700, update followingCount:
const followingCount = userData?.followingCount || userData?.following?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <AnimatePresence>
        {showFollowersModal && <FollowersModal />}
      </AnimatePresence>

      <AnimatePresence>
        {showFollowingModal && <FollowingModal />}
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
              backgroundImage: currentCover ? `url(${currentCover})` : 'none',
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
                  {currentAvatar ? (
                    <img 
                      src={currentAvatar} 
                      alt={userData.name}
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
                        {userData.name || 'Your Name'}
                      </h1>
                      <p className="text-gray-500 text-lg">
                        @{userData.username || 'username'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-2">
                  <p className="text-gray-600 whitespace-pre-wrap break-words text-sm sm:text-base">
                    {userData.bio || 'No bio yet. Tell us about yourself!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-72 right-4 sm:top-80 sm:right-6">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition text-sm sm:text-base shadow-lg"
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          </div>
        </motion.div>
        
        {/* Social Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                <p className="text-xl sm:text-2xl font-bold text-red-600">{admirersCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Admirers</p>
              </div>
              
              {/* Clickable Following Box */}
              <div 
                className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setShowFollowingModal(true)}
              >
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{followingCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Following</p>
              </div>
              
              {/* Clickable Followers Box */}
              <div 
                className="text-center p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => setShowFollowersModal(true)}
              >
                <p className="text-xl sm:text-2xl font-bold text-green-600">{followersCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Followers</p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">0</p>
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
                <p className="text-base sm:text-lg font-semibold text-gray-800 capitalize">{userData.role || 'Not set'}</p>
              </div>

              {userData.role === 'student' && (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Semester</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800">{userData.semester || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Batch</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800">{userData.batch || 'Not set'}</p>
                  </div>
                </>
              )}

              {userData.role === 'faculty' && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Subjects</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800">
                    {userData.subjects?.length > 0 ? userData.subjects.join(', ') : 'No subjects set'}
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
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 break-all">{userData.email}</p>
            </div>
            
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Member Since</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                {new Date(userData.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditing && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
              
              {/* Modal */}
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <motion.div
                  ref={modalRef}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="border-b border-gray-200 p-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                      <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={24} className="text-gray-500" />
                      </button>
                    </div>
                    <p className="text-gray-600 mt-2">Update your profile information</p>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                      {/* Cover Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
                        <div 
                          className="h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl relative cursor-pointer group"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {currentCover ? (
                            <img 
                              src={currentCover} 
                              alt="Cover"
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <Image size={32} className="text-white opacity-70" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                            <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={coverInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'cover')}
                        />
                      </div>

                      {/* Avatar */}
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                          <div 
                            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 relative cursor-pointer group overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {currentAvatar ? (
                              <img 
                                src={currentAvatar} 
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                <User size={24} className="text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-all flex items-center justify-center">
                              <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            Click on the avatar to upload a new profile picture. JPG, PNG recommended.
                          </p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'avatar')}
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                          placeholder="Enter your full name"
                          maxLength={50}
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            disabled={!canChangeUsername()}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Choose a username"
                            maxLength={30}
                          />
                          <div className="absolute right-3 top-3">
                            {isCheckingUsername && (
                              <div className="animate-spin text-gray-400">⟳</div>
                            )}
                            {!isCheckingUsername && isUsernameAvailable && editForm.username.length >= 3 && (
                              <CheckCircle className="text-green-500" size={20} />
                            )}
                            {!isCheckingUsername && isUsernameAvailable === false && (
                              <XCircle className="text-red-500" size={20} />
                            )}
                          </div>
                        </div>
                        {editForm.username.length > 0 && editForm.username.length < 3 && (
                          <p className="text-sm text-red-600 mt-1">Username must be at least 3 characters</p>
                        )}
                        {!canChangeUsername() && (
                          <p className="text-sm text-orange-600 mt-1">Username can be changed once every 30 days</p>
                        )}
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-gray-800 placeholder-gray-400"
                          placeholder="Tell us about yourself..."
                          rows="3"
                          maxLength={maxChars}
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{bioCharsCount}/{maxChars} characters</span>
                          <span>{maxChars - bioCharsCount} remaining</span>
                        </div>
                      </div>

                      {/* Academic Information */}
                      {userData.role === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                            <select
                              value={editForm.semester}
                              onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800"
                            >
                              <option value="">Select Semester</option>
                              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                            <select
                              value={editForm.batch}
                              onChange={(e) => setEditForm(prev => ({ ...prev, batch: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800"
                            >
                              <option value="">Select Batch</option>
                              {['2020', '2021', '2022', '2023', '2024', '2025'].map(batch => (
                                <option key={batch} value={batch}>{batch}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {userData.role === 'faculty' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                          <input
                            type="text"
                            value={editForm.subjects.join(', ')}
                            onChange={(e) => setEditForm(prev => ({ ...prev, subjects: e.target.value.split(', ') }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
                            placeholder="Enter subjects separated by comma"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-gray-200 p-6 flex-shrink-0">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all font-medium duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;