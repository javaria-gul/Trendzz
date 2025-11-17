// frontend/src/pages/Onboarding.jsx

import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, GraduationCap, Users, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    avatar: '👦',
    role: '',
    semester: '',
    batch: '',
    subjects: [],
    following: []
  });

  const navigate = useNavigate();
  const { completeOnboarding } = useContext(AuthContext);

  // Simple debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Username & Avatar Step Component
  const UsernameStep = () => {
    const [username, setUsername] = useState(formData.username);
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState(null);
    const [hasUserStoppedTyping, setHasUserStoppedTyping] = useState(false);
    const inputRef = useRef(null);

    const avatars = ['👦', '👧', '👨', '👩', '🧑', '👨‍🎓', '👩‍🎓', '😊', '🤓', '😎', '🌟', '🚀'];

    const checkUsername = useCallback(
      debounce((value) => {
        if (value.length < 3) {
          setIsAvailable(null);
          setIsChecking(false);
          return;
        }

        setIsChecking(true);
        setTimeout(() => {
          setIsAvailable(value.length >= 3);
          setIsChecking(false);
          setHasUserStoppedTyping(true);
        }, 1000);
      }, 800),
      []
    );

    const handleUsernameChange = (e) => {
      const value = e.target.value;

      if (/^[a-zA-Z0-9_ ]*$/.test(value)) {
        setUsername(value);
        setFormData(prev => ({ ...prev, username: value }));
        setHasUserStoppedTyping(false);

        if (value.length >= 3) {
          setIsChecking(true);
          checkUsername(value);
        } else {
          setIsAvailable(null);
          setIsChecking(false);
        }
      }
    };

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Choose Your Avatar</h3>
          <div className="grid grid-cols-6 gap-3">
            {avatars.map((avatar, index) => (
              <motion.button
                key={index}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`text-2xl p-3 rounded-2xl transition-all ${formData.avatar === avatar
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => setFormData(prev => ({ ...prev, avatar }))}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Choose Username</h3>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username (min 3 characters)"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-lg text-black placeholder-gray-400 bg-white"
              maxLength={20}
              autoFocus
            />

            {isChecking && (
              <div className="absolute right-3 top-4 text-gray-400 animate-spin">⟳</div>
            )}

            {!isChecking && isAvailable && hasUserStoppedTyping && (
              <CheckCircle className="absolute right-3 top-4 text-green-500" size={20} />
            )}

            {!isChecking && !isAvailable && username.length >= 3 && hasUserStoppedTyping && (
              <XCircle className="absolute right-3 top-4 text-red-500" size={20} />
            )}
          </div>

          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              Minimum 3 characters - letters, numbers, underscores, and spaces allowed
            </p>
          </div>

          {username.length > 0 && username.length < 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm font-medium text-center text-yellow-600"
            >
              Type at least {3 - username.length} more character(s)
            </motion.p>
          )}

          {isChecking && username.length >= 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm font-medium text-center text-blue-600"
            >
              Checking username availability...
            </motion.p>
          )}

          {!isChecking && isAvailable && hasUserStoppedTyping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm font-medium text-center text-green-600"
            >
              ✅ Username is available!
            </motion.p>
          )}

          {!isChecking && !isAvailable && username.length >= 3 && hasUserStoppedTyping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm font-medium text-center text-red-600"
            >
              ❌ Username is not available
            </motion.p>
          )}
        </div>
      </div>
    );
  };

  // Role Selection Step Component
  const RoleStep = () => {
    const roles = [
      {
        id: 'student',
        title: 'Student',
        description: 'I am here to learn and connect with peers',
        icon: '🎓',
        color: 'from-blue-500 to-blue-600'
      },
      {
        id: 'faculty',
        title: 'Faculty Member',
        description: 'I teach and guide students',
        icon: '👨‍🏫',
        color: 'from-green-500 to-green-600'
      }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-6">
          Select Your Role
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {roles.map((role) => (
            <motion.button
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-2xl border-2 transition-all ${formData.role === role.id
                  ? `border-transparent bg-gradient-to-r ${role.color} text-white shadow-lg`
                  : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                }`}
              onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`text-3xl ${formData.role === role.id ? 'text-white' : 'text-gray-600'
                  }`}>
                  {role.icon}
                </div>
                <h4 className="text-xl font-bold">{role.title}</h4>
                <p className="text-sm opacity-80">{role.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  // Academic Details Step Component
  const AcademicStep = () => {
    const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const batches = ['2020', '2021', '2022', '2023', '2024', '2025'];

    if (formData.role === 'student') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 text-center mb-6">
            Academic Information
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Current Semester
            </label>
            <div className="grid grid-cols-4 gap-2">
              {semesters.map((semester) => (
                <motion.button
                  key={semester}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl border transition-all ${formData.semester === semester
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  onClick={() => setFormData(prev => ({ ...prev, semester }))}
                >
                  {semester}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Batch Year
            </label>
            <div className="grid grid-cols-3 gap-2">
              {batches.map((batch) => (
                <motion.button
                  key={batch}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl border transition-all ${formData.batch === batch
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  onClick={() => setFormData(prev => ({ ...prev, batch }))}
                >
                  {batch}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Faculty Member</h3>
        <p className="text-gray-600">You're all set as a faculty member!</p>
      </div>
    );
  };

  // Follow Suggestions Step Component - CLEAN VERSION
const FollowStep = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await API.get('/users/suggested-users');
        
        if (response.data.success) {
          const users = response.data.data || [];
          setSuggestedUsers(users);
        } else {
          setError('Failed to load users');
          setSuggestedUsers([]);
        }
      } catch (error) {
        setError('Failed to load suggestions');
        setSuggestedUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, []);

  // TOGGLE FOLLOW FUNCTION
  const toggleFollow = (userId) => {
    setFormData(prevData => {
      const isCurrentlyFollowing = prevData.following.includes(userId);
      let newFollowing;
      
      if (isCurrentlyFollowing) {
        // Unfollow - remove user from array
        newFollowing = prevData.following.filter(id => id !== userId);
      } else {
        // Follow - add user to array
        newFollowing = [...prevData.following, userId];
      }
      
      return {
        ...prevData,
        following: newFollowing
      };
    });
  };

  const isMinimumSelected = formData.following.length >= 3;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading suggestions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Users</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Build Your Network
        </h3>
        <p className="text-gray-600 mb-4">
          Follow at least 3 people to get started
        </p>
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          isMinimumSelected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          <span className="text-sm font-medium">
            {formData.following.length}/3 selected
          </span>
          {isMinimumSelected && <Check size={16} />}
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {suggestedUsers.length > 0 ? (
          suggestedUsers.map((user) => {
            const isFollowing = formData.following.includes(user._id);
            
            return (
              <motion.div
                key={user._id}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl border-2 border-gray-200 bg-white transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl ${
                      isFollowing ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-100'
                    }`}>
                      {user.avatar || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {user.name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username || 'No username'}
                      </p>
                      <p className="text-xs text-gray-400 capitalize truncate">
                        {user.role || 'User'} 
                        {user.semester && ` • ${user.semester} semester`}
                        {user.batch && ` • Batch ${user.batch}`}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFollow(user._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      isFollowing
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check size={16} />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Follow
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users available to follow yet</p>
            <p className="text-gray-400 text-sm mt-1">
              There might be no other users in the system yet.
            </p>
          </div>
        )}
      </div>

      {!isMinimumSelected && formData.following.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-orange-500 text-sm font-medium"
        >
          Follow {3 - formData.following.length} more to continue
        </motion.p>
      )}

      {isMinimumSelected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-green-600 text-sm font-medium"
        >
          Perfect! You can now continue
        </motion.p>
      )}
    </div>
  );
};

  const steps = [
    {
      title: " Welcome to Trendzz!",
      subtitle: "Let's setup your amazing profile",
      description: "We're excited to have you! Complete your profile to get personalized experience.",
      icon: <Sparkles className="w-12 h-12 text-yellow-500" />
    },
    {
      title: "👤 Choose Your Identity",
      subtitle: "Pick a cool username & avatar",
      description: "Your username is your unique identity on Trendzz",
      icon: <User className="w-12 h-12 text-blue-500" />,
      component: <UsernameStep />
    },
    {
      title: "🎓 Tell Us About You",
      subtitle: "Are you a student or faculty member?",
      description: "This helps us connect you with relevant content",
      icon: <GraduationCap className="w-12 h-12 text-green-500" />,
      component: <RoleStep />
    },
    {
      title: "📚 Academic Details",
      subtitle: "Share your academic information",
      description: "Connect with peers and educators",
      component: <AcademicStep />
    },
    {
      title: "🤝 Build Your Network",
      subtitle: "Follow at least 3 people to get started",
      description: "Discover amazing content from your network",
      icon: <Users className="w-12 h-12 text-purple-500" />,
      component: <FollowStep />
    }
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.username && formData.username.length >= 3;
      case 2: return formData.role;
      case 3: return formData.role === 'student' ? formData.semester && formData.batch : true;
      case 4: return formData.following.length >= 3;
      default: return true;
    }
  };

  // UPDATE THIS FUNCTION IN Onboarding.jsx
  const handleComplete = async () => {
    try {
      console.log('Final Form Data:', formData);

      // ✅ SEND DATA TO BACKEND
      const response = await API.put('/auth/profile', formData);

      if (response.data.success) {
        // Complete onboarding and update user data in context
        const userProfile = {
          ...response.data.user,
          firstLogin: false // Mark onboarding as complete
        };

        completeOnboarding(userProfile);

        console.log('Onboarding completed successfully:', userProfile);

        // Navigate to home page
        navigate("/", { replace: true });
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error('Error completing onboarding:', error);

      // Show specific error message
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to complete profile. Please try again.';

      alert(errorMessage);

      // If username conflict, go back to username step
      if (error.response?.data?.message?.includes('Username already taken')) {
        setCurrentStep(1); // Go back to username step
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="h-2 bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="text-center"
            >
              {steps[currentStep].icon && (
                <div className="flex justify-center mb-6">
                  {steps[currentStep].icon}
                </div>
              )}

              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-lg text-purple-600 font-semibold mb-2">
                {steps[currentStep].subtitle}
              </p>
              <p className="text-gray-600 mb-8">
                {steps[currentStep].description}
              </p>

              <div className="mb-8">
                {steps[currentStep].component}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${currentStep === 0
                      ? 'invisible'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <ArrowLeft size={20} />
                  Back
                </button>

                <div className="flex items-center gap-4">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                          ? 'bg-purple-500 w-6'
                          : index < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={currentStep === steps.length - 1 ? handleComplete : nextStep}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${canProceed()
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Complete Setup
                      <Check size={20} />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;