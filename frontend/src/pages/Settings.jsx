import React, { useState, useContext, useEffect } from 'react'; // ADD useEffect here
import { motion } from 'framer-motion';
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
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API from '../services/api'; // ADD THIS IMPORT

const Settings = () => {
  const { userData, logout, updateUserData } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('account');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate(); // NEW

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
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
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

          {/* Rest of the code remains same */}
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

            {/* Main Content - Rest remains same */}
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

// Rest of the components (AccountSettings, PrivacySettings, etc.) remain exactly the same...

// Account Settings Component
// Account Settings Component
const AccountSettings = ({ userData, updateUserData }) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(userData?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // ADD THIS LINE

  const handleEmailUpdate = async () => {
    if (!email || email === userData.email) {
      setIsEditingEmail(false);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Add API call to update email
      await updateUserData({ email });
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Error updating email:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle unblock user from settings
const handleUnblockUser = async (userToUnblock) => {
  const userIdToUnblock = typeof userToUnblock === 'object' ? userToUnblock._id : userToUnblock;
  
  if (!userIdToUnblock) {
    alert('Invalid user');
    return;
  }

  const confirmUnblock = window.confirm(
    `Are you sure you want to unblock ${
      typeof userToUnblock === 'object' ? userToUnblock.name : 'this user'
    }?`
  );

  if (!confirmUnblock) return;

  setIsLoading(true);
  try {
    // Call unblock API
    const response = await unblockUser(userIdToUnblock);
    
    if (response.data.success) {
      // Update blocked users list
      const updatedBlockedUsers = (userData.blockedUsers || []).filter(user => {
        const userId = typeof user === 'object' ? user._id : user;
        return userId !== userIdToUnblock;
      });
      
      // Update global user data
      updateUserData({
        ...userData,
        blockedUsers: updatedBlockedUsers
      });
      
      setSaveStatus('User unblocked successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      throw new Error(response.data.message || 'Failed to unblock user');
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
    setSaveStatus('Error: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
      
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
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new email address"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEmailUpdate}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingEmail(false);
                  setEmail(userData.email);
                }}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
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

      {/* Account Info - REMOVED USER ID, ONLY KEEP MEMBER SINCE */}
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
// Privacy Settings Component - UPDATED (removed debug info and improved blocked users)
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
  const [blockedUsersDetails, setBlockedUsersDetails] = useState([]); // NEW: Store detailed user info

  // Load user settings when component mounts
  useEffect(() => {
    if (userData?.privacySettings) {
      setPrivacySettings(userData.privacySettings);
    }
  }, [userData]);

  // Fetch blocked users details when component mounts or blocked users change
  useEffect(() => {
    const fetchBlockedUsersDetails = async () => {
      if (userData?.blockedUsers && userData.blockedUsers.length > 0) {
        try {
          // Filter out string IDs and only fetch details for objects without full info
          const usersToFetch = userData.blockedUsers.filter(user => 
            typeof user === 'string' || !user.name || !user.avatar
          );
          
          if (usersToFetch.length > 0) {
            const userIds = usersToFetch.map(user => 
              typeof user === 'string' ? user : user._id
            ).filter(id => id); // Remove any undefined/null IDs
            
            if (userIds.length > 0) {
              // Fetch user details from backend
              const response = await API.get(`/users/batch`, {
                params: { userIds: userIds.join(',') }
              });
              
              if (response.data.success) {
                // Merge fetched users with existing blocked users
                const fetchedUsers = response.data.users;
                const updatedBlockedUsers = userData.blockedUsers.map(user => {
                  const userId = typeof user === 'string' ? user : user._id;
                  const fetchedUser = fetchedUsers.find(u => u._id === userId);
                  return fetchedUser || user;
                });
                
                // Update state with detailed user info
                setBlockedUsersDetails(updatedBlockedUsers);
              }
            }
          } else {
            // If all users already have details, use them directly
            setBlockedUsersDetails(userData.blockedUsers);
          }
        } catch (error) {
          console.error('Error fetching blocked users details:', error);
          // Fallback to whatever data we have
          setBlockedUsersDetails(userData.blockedUsers);
        }
      } else {
        setBlockedUsersDetails([]);
      }
    };

    fetchBlockedUsersDetails();
  }, [userData?.blockedUsers]);

  const handlePrivacyChange = async (setting, value) => {
    // Immediately update UI
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    setSaveStatus('saving...');
    
    setIsLoading(true);
    try {
      // Use the imported function directly
      const response = await updatePrivacySettings(newSettings);
      
      if (response.data.success) {
        // Update global user data
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
      // Revert on error
      setPrivacySettings(prev => ({ ...prev, [setting]: !value }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unblock user from settings
  const handleUnblockUser = async (userToUnblock) => {
    const userIdToUnblock = typeof userToUnblock === 'object' ? userToUnblock._id : userToUnblock;
    
    if (!userIdToUnblock) {
      alert('Invalid user');
      return;
    }

    const userName = typeof userToUnblock === 'object' 
      ? userToUnblock.name || userToUnblock.username || 'this user'
      : 'this user';

    const confirmUnblock = window.confirm(
      `Are you sure you want to unblock ${userName}?`
    );

    if (!confirmUnblock) return;

    setIsLoading(true);
    try {
      // Call unblock API
      const response = await unblockUser(userIdToUnblock);
      
      if (response.data.success) {
        // Update blocked users list
        const updatedBlockedUsers = (userData.blockedUsers || []).filter(user => {
          const userId = typeof user === 'object' ? user._id : user;
          return userId !== userIdToUnblock;
        });
        
        // Update global user data
        updateUserData({
          ...userData,
          blockedUsers: updatedBlockedUsers
        });
        
        // Also update local state
        setBlockedUsersDetails(prev => 
          prev.filter(user => {
            const userId = typeof user === 'object' ? user._id : user;
            return userId !== userIdToUnblock;
          })
        );
        
        setSaveStatus(`${userName} unblocked successfully!`);
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      setSaveStatus('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const privacyOptions = [
    { id: 'showEmail', label: 'Show Email', description: 'Display your email on profile' },
    { id: 'showFollowers', label: 'Show Followers', description: 'Display your followers list' },
    { id: 'showFollowing', label: 'Show Following', description: 'Display who you follow' },
    { id: 'allowMessages', label: 'Allow Messages', description: 'Allow users to send you messages' },
    { id: 'showOnlineStatus', label: 'Show Online Status', description: 'Display when you are online' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Privacy Settings</h2>
      
      {/* Save Status */}
      {saveStatus && (
        <div className={`p-4 rounded-lg ${
          saveStatus.includes('Error') || saveStatus.includes('Failed') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <p className="font-medium">{saveStatus}</p>
        </div>
      )}
      
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

      {/* REMOVED THE DEBUG INFO BLUE SECTION */}

      {/* Blocked Users Section - IMPROVED */}
      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-gray-800 mb-4">Blocked Users</h3>
        <p className="text-gray-600 mb-4">
          Manage users you've blocked. Blocked users cannot message you or view your profile.
        </p>
        
        {blockedUsersDetails.length > 0 ? (
          <div className="space-y-4">
            {/* Horizontal Scroll List */}
            <div className="flex gap-4 pb-4 overflow-x-auto">
              {blockedUsersDetails.map((blockedUser) => {
                const userId = typeof blockedUser === 'object' ? blockedUser._id : blockedUser;
                const userName = typeof blockedUser === 'object' 
                  ? blockedUser.name || blockedUser.username || 'Unknown User'
                  : 'Unknown User';
                const userAvatar = typeof blockedUser === 'object' ? blockedUser.avatar : null;
                const userUsername = typeof blockedUser === 'object' 
                  ? blockedUser.username 
                  : 'unknown';
                
                return (
                  <div 
                    key={userId}
                    className="bg-white rounded-xl p-4 min-w-48 border border-gray-200 shadow-sm flex flex-col items-center text-center"
                  >
                    {/* User Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white mb-3 overflow-hidden border-2 border-white shadow">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={userName}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<User size={24} />';
                          }}
                        />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="mb-3">
                      <p className="font-medium text-gray-800 truncate">
                        {userName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{userUsername}
                      </p>
                    </div>
                    
                    {/* Unblock Button */}
                    <button
                      onClick={() => handleUnblockUser(blockedUser)}
                      disabled={isLoading}
                      className={`w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium text-sm transition ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-800'
                      }`}
                    >
                      {isLoading ? 'Processing...' : 'Unblock'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Blocked Users Count */}
            <div className="text-center pt-2">
              <p className="text-gray-500 text-sm">
                You have blocked {blockedUsersDetails.length} user{blockedUsersDetails.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No blocked users yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Blocked users will appear here when you block someone
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Security Settings Component
const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Add API call to change password
      console.log('Changing password...');
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Security Settings</h2>
      
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
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Security Tips</h3>
        <ul className="text-blue-700 text-sm space-y-2">
          <li>• Use a strong, unique password that you don't use elsewhere</li>
          <li>• Avoid using personal information in your password</li>
          <li>• Consider using a password manager</li>
          <li>• Never share your password with anyone</li>
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

