import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { 
  Lock, 
  Moon, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  LogOut, 
  Shield,
  Check,
  X,
  Save,
  Edit3,
  ArrowLeft, // NEW IMPORT
  XCircle // NEW IMPORT
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // NEW IMPORT

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
const AccountSettings = ({ userData, updateUserData }) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(userData?.email || '');
  const [isLoading, setIsLoading] = useState(false);

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

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Member Since</h3>
          <p className="text-gray-600">
            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-2">User ID</h3>
          <p className="text-gray-600 font-mono text-sm">{userData?._id || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Component
const PrivacySettings = ({ userData, updateUserData }) => {
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    showEmail: false,
    showFollowers: true,
    showFollowing: true,
    allowMessages: true,
    showOnlineStatus: true
  });

  const handlePrivacyChange = (setting, value) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    // TODO: Save to backend
    updateUserData({ privacySettings: newSettings });
  };

  const privacyOptions = [
    {
      id: 'profilePublic',
      label: 'Public Profile',
      description: 'Anyone can view your profile'
    },
    {
      id: 'showEmail',
      label: 'Show Email',
      description: 'Display your email on profile'
    },
    {
      id: 'showFollowers',
      label: 'Show Followers',
      description: 'Display your followers list'
    },
    {
      id: 'showFollowing',
      label: 'Show Following',
      description: 'Display who you follow'
    },
    {
      id: 'allowMessages',
      label: 'Allow Messages',
      description: 'Allow users to send you messages'
    },
    {
      id: 'showOnlineStatus',
      label: 'Show Online Status',
      description: 'Display when you are online'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Privacy Settings</h2>
      
      <div className="space-y-4">
        {privacyOptions.map((option) => (
          <div key={option.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{option.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
            <button
              onClick={() => handlePrivacyChange(option.id, !privacySettings[option.id])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings[option.id] ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacySettings[option.id] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Blocked Users Section */}
      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <h3 className="font-semibold text-gray-800 mb-4">Blocked Users</h3>
        <p className="text-gray-600 mb-4">
          Manage users you've blocked. Blocked users cannot message you or view your profile.
        </p>
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No blocked users yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Blocked users will appear here when you block someone
          </p>
        </div>
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



