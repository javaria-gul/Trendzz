import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { updatePrivacySettings, unblockUser } from '../services/user';
import { 
  Lock, 
  Moon, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  LogOut, 
  Shield,
  X,
  Save,
  Edit3,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Settings = () => {
  const { userData, logout, updateUserData } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('account');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header with Back Button */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600">Manage your account preferences and privacy</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar Navigation */}
            <div className="lg:w-1/4 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {[
                  { id: 'account', label: 'Account', icon: User },
                  { id: 'privacy', label: 'Privacy', icon: Shield },
                  { id: 'security', label: 'Security', icon: Lock },
                  { id: 'appearance', label: 'Appearance', icon: Moon }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeTab === item.id
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all mt-8"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4 p-6">
              {activeTab === 'account' && <AccountSettings userData={userData} updateUserData={updateUserData} />}
              {activeTab === 'privacy' && <PrivacySettings userData={userData} updateUserData={updateUserData} />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'appearance' && <AppearanceSettings darkMode={darkMode} setDarkMode={setDarkMode} />}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
// Account Settings Component
const AccountSettings = ({ userData, updateUserData }) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(userData?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveStatusType, setSaveStatusType] = useState(''); // 'success' or 'error'

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailUpdate = async () => {
    console.log("🔄 ===== EMAIL UPDATE START =====");
    
    if (!email || email === userData.email) {
      setIsEditingEmail(false);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setSaveStatus('Error: Please enter a valid email address');
      setSaveStatusType('error');
      setTimeout(() => {
        setSaveStatus('');
        setSaveStatusType('');
      }, 3000);
      return;
    }

    setIsLoading(true);
    try {
      console.log("📡 Calling API to update email...");
      
      // Try the correct API endpoint
      const response = await API.put('/users/update-email', { email });
      
      console.log("✅ API Response:", response.data);
      
      if (response.data.success) {
        console.log("✅ Email updated in backend");
        
        // Update localStorage directly
        const currentStoredUser = JSON.parse(localStorage.getItem('trendzz_user')) || {};
        const updatedStoredUser = {
          ...currentStoredUser,
          email: email
        };
        localStorage.setItem('trendzz_user', JSON.stringify(updatedStoredUser));
        
        // Update context - pass the complete user object from response if available
        if (response.data.user) {
          updateUserData(response.data.user);
        } else {
          updateUserData({ email: email });
        }
        
        // Show success message
        setSaveStatus('Email updated successfully!');
        setSaveStatusType('success');
        
        // Exit editing mode after a short delay
        setTimeout(() => {
          setIsEditingEmail(false);
        }, 500);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveStatus('');
          setSaveStatusType('');
        }, 3000);
        
      } else {
        throw new Error(response.data.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('❌ Error updating email:', error);
      console.error('❌ Error details:', error.response?.data);
      
      // Try alternative endpoint if first fails
      if (error.response?.status === 404) {
        try {
          console.log("🔄 Trying alternative endpoint...");
          const altResponse = await API.put('/users/profile', { email });
          if (altResponse.data.success) {
            updateUserData({ email: email });
            setSaveStatus('Email updated successfully!');
            setSaveStatusType('success');
            setTimeout(() => {
              setIsEditingEmail(false);
              setSaveStatus('');
              setSaveStatusType('');
            }, 3000);
            return;
          }
        } catch (altError) {
          console.error('❌ Alternative endpoint also failed:', altError);
        }
      }
      
      setSaveStatus('Error: ' + (error.response?.data?.message || error.message || 'Failed to update email'));
      setSaveStatusType('error');
      setEmail(userData.email);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
        setSaveStatusType('');
      }, 3000);
    } finally {
      setIsLoading(false);
      console.log("🔄 ===== EMAIL UPDATE END =====");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
      
      {/* Save Status with smooth animation */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              saveStatusType === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatusType === 'success' ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              <p className="font-medium">{saveStatus}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Email Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Mail size={18} />
              Email Address
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Update your email address. You'll need to verify the new email.
            </p>
          </div>
          {!isEditingEmail && (
            <button
              onClick={() => setIsEditingEmail(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit3 size={16} />
              Change
            </button>
          )}
        </div>

        {isEditingEmail ? (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-500"
              placeholder="Enter new email address"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEmailUpdate}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditingEmail(false);
                  setEmail(userData.email);
                  setSaveStatus('');
                  setSaveStatusType('');
                }}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg font-medium text-gray-800">{userData?.email}</p>
        )}
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Member Since</h3>
          <p className="text-gray-600">
            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Component
const PrivacySettings = ({ userData, updateUserData }) => {
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: userData?.privacySettings?.showEmail || false,
    showFollowers: userData?.privacySettings?.showFollowers !== undefined ? userData.privacySettings.showFollowers : true,
    showFollowing: userData?.privacySettings?.showFollowing !== undefined ? userData.privacySettings.showFollowing : true,
    allowMessages: userData?.privacySettings?.allowMessages !== undefined ? userData.privacySettings.allowMessages : true,
    showOnlineStatus: userData?.privacySettings?.showOnlineStatus !== undefined ? userData.privacySettings.showOnlineStatus : true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [blockedUsersDetails, setBlockedUsersDetails] = useState([]);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Load user settings when component mounts
  useEffect(() => {
    if (userData?.privacySettings) {
      setPrivacySettings(userData.privacySettings);
    }
  }, [userData]);

  // Fetch blocked users details
  useEffect(() => {
    const fetchBlockedUsersDetails = async () => {
      if (userData?.blockedUsers && userData.blockedUsers.length > 0) {
        setIsLoading(true);
        try {
          const userPromises = userData.blockedUsers.map(async (userId) => {
            try {
              const response = await API.get(`/users/profile/${userId}`);
              
              if (response.data.success && response.data.data) {
                return {
                  _id: userId,
                  name: response.data.data.name || 'Unknown User',
                  username: response.data.data.username || `user_${userId.slice(-4)}`,
                  avatar: response.data.data.avatar || null,
                  bio: response.data.data.bio || '',
                  role: response.data.data.role || 'user',
                  coverImage: response.data.data.coverImage || null
                };
              }
              
              return { 
                _id: userId, 
                name: 'Unknown User', 
                username: `user_${userId.slice(-4)}`,
                avatar: null
              };
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              return { 
                _id: userId, 
                name: 'User Not Found', 
                username: `user_${userId.slice(-4)}`,
                avatar: null
              };
            }
          });
          
          const users = await Promise.all(userPromises);
          setBlockedUsersDetails(users);
        } catch (error) {
          console.error('Error fetching blocked users details:', error);
          const fallbackUsers = userData.blockedUsers.map(userId => ({
            _id: userId,
            name: `User ${userId.slice(-6)}`,
            username: `user_${userId.slice(-4)}`,
            avatar: null
          }));
          setBlockedUsersDetails(fallbackUsers);
        } finally {
          setIsLoading(false);
        }
      } else {
        setBlockedUsersDetails([]);
      }
    };

    fetchBlockedUsersDetails();
  }, [userData?.blockedUsers]);

  const handlePrivacyChange = async (setting, value) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    setSaveStatus('saving...');
    
    setIsLoading(true);
    try {
      const response = await updatePrivacySettings(newSettings);
      
      if (response.data.success) {
        updateUserData({ 
          ...userData, 
          privacySettings: newSettings 
        });
        setSaveStatus('Saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setSaveStatus('Error: ' + (error.response?.data?.message || error.message));
      setPrivacySettings(prev => ({ ...prev, [setting]: !value }));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUnblockUser = (user) => {
    setUserToUnblock(user);
    setShowUnblockConfirm(true);
  };

  const handleUnblockUser = async () => {
    if (!userToUnblock) return;

    const userIdToUnblock = userToUnblock._id;
    const userName = userToUnblock.name || userToUnblock.username || 'this user';

    setIsLoading(true);
    try {
      const response = await unblockUser(userIdToUnblock);
      
      if (response.data.success) {
        const updatedBlockedUsers = (userData.blockedUsers || []).filter(userId => 
          userId !== userIdToUnblock
        );
        
        updateUserData({
          ...userData,
          blockedUsers: updatedBlockedUsers
        });
        
        setBlockedUsersDetails(prev => 
          prev.filter(user => user._id !== userIdToUnblock)
        );
        
        setShowSuccessMessage(`${userName} unblocked successfully!`);
        setTimeout(() => setShowSuccessMessage(''), 3000);
        
      } else {
        throw new Error(response.data.message || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      setShowSuccessMessage('Error: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } finally {
      setIsLoading(false);
      setShowUnblockConfirm(false);
      setUserToUnblock(null);
    }
  };

  const cancelUnblockUser = () => {
    setShowUnblockConfirm(false);
    setUserToUnblock(null);
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const privacyOptions = [
    { id: 'showEmail', label: 'Show Email', description: 'Display your email on profile' },
    { id: 'showFollowers', label: 'Show Followers', description: 'Display your followers list' },
    { id: 'showFollowing', label: 'Show Following', description: 'Display who you follow' },
    { id: 'allowMessages', label: 'Allow Messages', description: 'Allow users to send you messages' },
    { id: 'showOnlineStatus', label: 'Show Online Status', description: 'Display when you are online' }
  ];

  const getAvatarColor = (userId) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
      'from-teal-500 to-teal-600',
      'from-indigo-500 to-indigo-600'
    ];
    
    if (!userId) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    return initials.length > 2 ? initials.slice(0, 2) : initials;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Privacy Settings</h2>
      
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`px-6 py-3 rounded-lg shadow-lg font-medium ${
              showSuccessMessage.includes('Error') 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}>
              {showSuccessMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Status */}
      {saveStatus && !showSuccessMessage && (
        <div className={`p-4 rounded-lg ${
          saveStatus.includes('Error') || saveStatus.includes('Failed') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <p className="font-medium">{saveStatus}</p>
        </div>
      )}
      
      {/* Privacy Options */}
      <div className="space-y-4">
        {privacyOptions.map((option) => (
          <div 
            key={option.id} 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
            onClick={() => {
              if (!isLoading) {
                handlePrivacyChange(option.id, !privacySettings[option.id]);
              }
            }}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{option.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              {isLoading && (
                <p className="text-xs text-blue-600 mt-1">Saving...</p>
              )}
            </div>
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings[option.id] ? 'bg-green-500' : 'bg-gray-300'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings[option.id] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Unblock Confirmation Modal */}
      <AnimatePresence>
        {showUnblockConfirm && userToUnblock && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={cancelUnblockUser}
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm z-40"
              onClick={cancelUnblockUser}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Unblock {userToUnblock.name}?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to unblock this user? You will be able to see their profile and posts again.
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={cancelUnblockUser}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUnblockUser}
                      disabled={isLoading}
                      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Unblocking...' : 'Unblock User'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Blocked Users Section */}
      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Blocked Users</h3>
            <p className="text-gray-600">
              Blocked users cannot message you or view your profile.
            </p>
          </div>
          {blockedUsersDetails.length > 0 && (
            <span className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
              {blockedUsersDetails.length} blocked
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
            <p className="text-gray-500">Loading blocked users...</p>
          </div>
        ) : blockedUsersDetails.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blockedUsersDetails.map((user) => (
                <div 
                  key={user._id}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => handleUserClick(user._id)}
                      className={`w-14 h-14 rounded-full bg-gradient-to-r ${getAvatarColor(user._id)} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span>${getUserInitials(user.name)}</span>`;
                          }}
                        />
                      ) : (
                        getUserInitials(user.name)
                      )}
                    </div>
                    
                    <div 
                      onClick={() => handleUserClick(user._id)}
                      className="flex-1 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <h4 className="font-semibold text-gray-800 truncate">
                        {user.name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username || `user_${user._id.slice(-4)}`}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                      {user.role && user.role !== 'user' && (
                        <p className="text-xs text-purple-600 font-medium mt-1">
                          {user.role}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => confirmUnblockUser(user)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        isLoading 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
                      }`}
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-2">
              <p className="text-gray-500 text-sm">
                You have blocked {blockedUsersDetails.length} user{blockedUsersDetails.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No blocked users yet</p>
            <p className="text-sm text-gray-400 mt-1">
              When you block someone, they will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Security Settings Component
// Security Settings Component
const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success or error

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage({ text: '', type: '' });
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords don't match!", type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long!", type: 'error' });
      return;
    }

    if (currentPassword === newPassword) {
      setMessage({ text: "New password cannot be the same as current password!", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📡 Changing password...');
      
      // Call the password change API
      const response = await API.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        console.log('✅ Password changed successfully');
        
        // Show success message
        setMessage({ 
          text: 'Password changed successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 5000);
        
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('❌ Error changing password:', error);
      setMessage({ 
        text: error.response?.data?.message || error.message || 'Failed to change password. Please try again.', 
        type: 'error' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Security Settings</h2>
      
      {/* Message Display */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </motion.div>
      )}
      
      {/* Change Password Form */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock size={18} />
          Change Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Security Tips</h3>
        <ul className="text-blue-700 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Use a strong, unique password that you don't use elsewhere</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Avoid using personal information in your password</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Consider using a password manager</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Never share your password with anyone</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Appearance Settings Component
const AppearanceSettings = ({ darkMode, setDarkMode }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Appearance</h2>
      
      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Moon size={18} />
            Dark Mode
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Switch between light and dark theme
          </p>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            darkMode ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">More Appearance Options Coming Soon</h3>
        <p className="text-yellow-700 text-sm">
          We're working on adding more customization options like theme colors, 
          font sizes, and layout preferences.
        </p>
      </div>
    </div>
  );
};

export default Settings;