import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserProfile, followUser, admireUser, blockUser } from '../services/user';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Calendar, 
  Users, 
  Heart, 
  MessageCircle, 
  Shield,
  Eye,
  MoreVertical,
  BookOpen,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';

const OtherUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData: currentUser } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasAdmired, setHasAdmired] = useState(false);
  const [error, setError] = useState('');

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError('');
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

  const handleBlockUser = async () => {
    if (!window.confirm(`Are you sure you want to block ${userProfile.name}?`)) return;
    
    try {
      const response = await blockUser(userId);
      if (response.data.success) {
        setShowOptions(false);
        alert(`${userProfile.name} has been blocked`);
        navigate('/');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleAdmire = async () => {
    try {
      const response = await admireUser(userId);
      if (response.data.success) {
        setHasAdmired(response.data.hasAdmired);
        setUserProfile(prev => ({
          ...prev,
          admirersCount: response.data.admirersCount
        }));
      }
    } catch (error) {
      console.error('Error admiring user:', error);
      alert(error.response?.data?.message || 'Failed to admire user');
    }
  };

  const handleMessage = () => {
    navigate(`/chat/${userId}`);
  };

  const handleFollow = async () => {
    try {
      const response = await followUser(userId);
      if (response.data.success) {
        setIsFollowing(response.data.isFollowing);
        setUserProfile(prev => ({
          ...prev,
          followers: response.data.followers,
          followersCount: response.data.followersCount
        }));
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert(error.response?.data?.message || 'Failed to follow user');
    }
  };

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
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
          <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-4xl shadow-2xl border-4 border-white bg-gradient-to-r from-green-400 to-blue-500">
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt={userProfile.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 mt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">
                      {userProfile.name}
                    </h1>
                    <p className="text-lg text-gray-500 mt-1">
                      @{userProfile.username}
                    </p>
                    {userProfile.bio && (
                      <p className="text-gray-600 mt-3 whitespace-pre-wrap">
                        {userProfile.bio}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 relative">
                    {/* Admire Button */}
                    <button
                      onClick={handleAdmire}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        hasAdmired 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Heart size={18} fill={hasAdmired ? 'currentColor' : 'none'} />
                      Admire ({userProfile.admirersCount || 0})
                    </button>

                    {/* Message Button */}
                    {userProfile.privacySettings?.allowMessages && (
                      <button
                        onClick={handleMessage}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all"
                      >
                        <MessageCircle size={18} />
                        Message
                      </button>
                    )}

                    {/* Follow Button */}
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isFollowing 
                          ? 'bg-gray-500 text-white hover:bg-gray-600' 
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    {/* Options Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-300 transition-all"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-10 min-w-[150px]">
                          <button
                            onClick={handleBlockUser}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Shield size={16} />
                            Block User
                          </button>
                          <button
                            onClick={handleViewPosts}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Eye size={16} />
                            View Posts
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {userProfile.followers?.length || 0}
              </div>
              <div className="text-gray-500 text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {userProfile.following?.length || 0}
              </div>
              <div className="text-gray-500 text-sm">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {userProfile.admirersCount || 0}
              </div>
              <div className="text-gray-500 text-sm">Admirers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {userProfile.postsCount || 0}
              </div>
              <div className="text-gray-500 text-sm">Posts</div>
            </div>
          </div>
        </motion.div>

        {/* Academic Information */}
        {(userProfile.role || userProfile.semester || userProfile.batch) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GraduationCap size={20} />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.role && (
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <p className="font-medium text-gray-800 capitalize">{userProfile.role}</p>
                </div>
              )}
              {userProfile.semester && (
                <div>
                  <label className="text-sm text-gray-500">Semester</label>
                  <p className="font-medium text-gray-800">{userProfile.semester}</p>
                </div>
              )}
              {userProfile.batch && (
                <div>
                  <label className="text-sm text-gray-500">Batch</label>
                  <p className="font-medium text-gray-800">{userProfile.batch}</p>
                </div>
              )}
              {userProfile.subjects && userProfile.subjects.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Subjects</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userProfile.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Followers */}
        {userProfile.followers && userProfile.followers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} />
              Recent Followers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userProfile.followers.slice(0, 8).map((follower) => (
                <div
                  key={follower._id}
                  className="text-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/user/${follower._id}`)}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg mb-2">
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