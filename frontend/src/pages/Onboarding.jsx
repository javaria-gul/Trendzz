import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, GraduationCap, CheckCircle, XCircle, ChevronRight, Star, Target, Users, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    avatar: '/avatars/avatar1.png',
    role: '',
    semester: '',
    batch: '',
    subjects: []
  });
  
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [touchedUsername, setTouchedUsername] = useState(false);

  const navigate = useNavigate();
  const { completeOnboarding } = useContext(AuthContext);

  // Avatar options
  const avatarOptions = [
    { id: 1, path: '/avatars/avatar1.png', alt: 'Avatar 1' },
    { id: 2, path: '/avatars/avatar2.png', alt: 'Avatar 2' },
    { id: 3, path: '/avatars/avatar3.png', alt: 'Avatar 3' },
    { id: 4, path: '/avatars/avatar4.png', alt: 'Avatar 4' },
    { id: 5, path: '/avatars/avatar5.png', alt: 'Avatar 5' },
    { id: 6, path: '/avatars/avatar6.png', alt: 'Avatar 6' },
    { id: 7, path: '/avatars/avatar7.png', alt: 'Avatar 7' },
    { id: 8, path: '/avatars/avatar8.png', alt: 'Avatar 8' },
    { id: 9, path: '/avatars/avatar9.png', alt: 'Avatar 9' },
    { id: 10, path: '/avatars/avatar10.png', alt: 'Avatar 10' },
    { id: 11, path: '/avatars/avatar11.png', alt: 'Avatar 11' },
    { id: 12, path: '/avatars/avatar12.png', alt: 'Avatar 12' }
  ];

  // ✅ REAL API CALL FOR USERNAME CHECK
  const checkUsernameAvailability = useCallback(
    async (username) => {
      if (!username || username.length < 3) {
        setIsUsernameAvailable(null);
        setUsernameError('');
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError('');

      try {
        // Yahan aapka actual API call hoga
        // const response = await API.get(`/check-username/${username}`);
        // setIsUsernameAvailable(response.data.available);
        // if (!response.data.available) {
        //   setUsernameError('Username already taken');
        // }
        
        // Temporary simulation - API integration ke baad comment karna hai
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate API response - 70% chance available
        const available = Math.random() > 0.3;
        setIsUsernameAvailable(available);
        if (!available) {
          setUsernameError('Username already taken');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        // Agar API fail ho to temporary logic
        const available = Math.random() > 0.3;
        setIsUsernameAvailable(available);
        if (!available) {
          setUsernameError('Username already taken');
        }
      } finally {
        setIsCheckingUsername(false);
      }
    },
    []
  );

  // Debounced version of API call
  const debouncedCheckUsername = useCallback(
    debounce((username) => {
      checkUsernameAvailability(username);
    }, 800),
    [checkUsernameAvailability]
  );

  // Welcome Step Component - UPDATED EYE-CATCHY DESIGN
  const WelcomeStep = () => {
    return (
      <div className="text-center py-8 px-4">
        {/* Animated Background Elements */}
        <div className="relative">
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-100 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-100 rounded-full opacity-20 blur-xl"></div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          {/* Logo/Brand */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Zap className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Trendzz
              </h1>
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              Welcome to Your
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mt-1">
                Academic Journey
              </span>
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-6">
              Let's personalize your experience and connect you with the right community
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            {[
              {
                icon: <Target className="text-purple-600" size={20} />,
                title: "Personalized Feed",
                description: "Content tailored to your interests"
              },
              {
                icon: <Users className="text-blue-600" size={20} />,
                title: "Smart Connections",
                description: "Connect with peers from your batch"
              },
              {
                icon: <Star className="text-pink-600" size={20} />,
                title: "Exclusive Access",
                description: "Study materials and resources"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-3">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress Indicators */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 1 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-4 h-0.5 ${step === 1 ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">Step 1 of 4 • Quick Setup</p>
          </div>
        </motion.div>
      </div>
    );
  };

  // Username & Avatar Step Component
  const UsernameStep = () => {
    const [username, setUsername] = useState(formData.username);
    const inputRef = useRef(null);

    const handleUsernameChange = (e) => {
      const value = e.target.value.trim();
      
      // Validate characters
      if (!/^[a-zA-Z0-9_ ]*$/.test(value)) {
        return;
      }

      setUsername(value);
      setFormData(prev => ({ ...prev, username: value }));
      setTouchedUsername(true);

      // Clear previous validation
      if (value.length === 0) {
        setIsUsernameAvailable(null);
        setUsernameError('');
        setIsCheckingUsername(false);
        return;
      }

      // Validate length
      if (value.length > 20) {
        setUsernameError('Maximum 20 characters allowed');
        setIsUsernameAvailable(false);
        return;
      }

      if (value.length < 3) {
        setUsernameError('Minimum 3 characters required');
        setIsUsernameAvailable(false);
        return;
      }

      // Clear error if requirements met
      setUsernameError('');
      
      // Start checking availability
      setIsCheckingUsername(true);
      debouncedCheckUsername(value);
    };

    const handleUsernameBlur = () => {
      setTouchedUsername(true);
    };

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
            <User className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Create Your Identity</h2>
          <p className="text-gray-600 text-sm">Choose how others will see you on Trendzz</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-800">Your Avatar</h3>
              <div className="text-xs text-gray-500">{avatarOptions.length} options</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {avatarOptions.map((avatar, index) => (
                <motion.button
                  key={avatar.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    formData.avatar === avatar.path
                      ? 'ring-2 ring-purple-500 ring-offset-1 bg-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.path }))}
                >
                  <div className="relative">
                    <img 
                      src={avatar.path} 
                      alt={avatar.alt}
                      className="w-full aspect-square rounded-md object-cover border border-gray-200"
                    />
                    {formData.avatar === avatar.path && (
                      <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Avatar Preview */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img 
                    src={formData.avatar} 
                    alt="Selected Avatar"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border border-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">Selected Avatar</p>
                  <p className="text-xs text-gray-500">Your profile picture</p>
                </div>
              </div>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-3">
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">Choose Username</h3>
              <p className="text-xs text-gray-500 mb-3">This will be your unique identifier</p>
            </div>

            <div className="relative">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  placeholder="Enter username"
                  className={`w-full px-3 py-2 pl-9 border rounded-lg focus:outline-none focus:ring-1 text-gray-800 bg-white shadow-sm ${
                    usernameError 
                      ? 'border-red-400 focus:ring-red-400' 
                      : isUsernameAvailable 
                        ? 'border-green-400 focus:ring-green-400' 
                        : 'border-gray-300 focus:ring-purple-400'
                  }`}
                  maxLength={20}
                />
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  @
                </div>
                
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-purple-500"
                    >
                      ⟳
                    </motion.div>
                  )}
                  {!isCheckingUsername && isUsernameAvailable && (
                    <CheckCircle className="text-green-500" size={16} />
                  )}
                  {!isCheckingUsername && isUsernameAvailable === false && username && (
                    <XCircle className="text-red-500" size={16} />
                  )}
                </div>
              </div>

              {/* REAL-TIME ERROR MESSAGE - FIELD KE NEECHE */}
              {usernameError && touchedUsername && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-red-600 text-xs font-medium flex items-center gap-1"
                >
                  <XCircle size={12} />
                  {usernameError}
                </motion.p>
              )}

              {/* Username Guidelines */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${username.length >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-600">Minimum 3 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${/^[a-zA-Z0-9_ ]*$/.test(username) ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-600">Letters, numbers, spaces, underscore</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${username.length <= 20 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-600">Maximum 20 characters</span>
                </div>
              </div>

              {/* Status Messages */}
              <div className="mt-3 space-y-1.5">
                {username.length > 0 && username.length < 3 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-amber-600 text-xs font-medium"
                  >
                    Type at least {3 - username.length} more character(s)
                  </motion.p>
                )}

                {isCheckingUsername && username.length >= 3 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-blue-600 text-xs font-medium"
                  >
                    Checking username availability...
                  </motion.p>
                )}

                {!isCheckingUsername && isUsernameAvailable && username.length >= 3 && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-green-600 text-xs font-medium flex items-center gap-1"
                  >
                    <CheckCircle size={12} />
                    Username is available!
                  </motion.p>
                )}
              </div>
            </div>
          </div>
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
        description: 'Join as a learner to explore, connect, and grow with peers',
        icon: '🎓',
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-700',
        bgColor: 'bg-purple-50'
      },
      {
        id: 'faculty',
        title: 'Faculty Member',
        description: 'Guide students, share knowledge, and engage with the academic community',
        icon: '👨‍🏫',
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-3 shadow-lg">
            <GraduationCap className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Select Your Role</h2>
          <p className="text-gray-600 text-sm">Choose how you'll engage with the Trendzz community</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                formData.role === role.id
                  ? `${role.borderColor} ${role.bgColor} ring-1 ${role.borderColor.replace('border', 'ring')} ring-opacity-30 shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center text-white text-xl`}>
                  {role.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-md font-bold ${formData.role === role.id ? role.textColor : 'text-gray-800'}`}>
                      {role.title}
                    </h3>
                    {formData.role === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`${role.color} rounded-full p-0.5`}
                      >
                        <Check size={12} className="text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  <p className={`text-xs ${formData.role === role.id ? `${role.textColor} opacity-90` : 'text-gray-600'}`}>
                    {role.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Selection Status */}
        {formData.role && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-full">
              <Check size={12} className="text-purple-500" />
              <span className="text-xs font-medium text-purple-700">
                Selected: {formData.role === 'student' ? 'Student' : 'Faculty Member'}
              </span>
            </div>
          </motion.div>
        )}
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
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Academic Details</h2>
            <p className="text-gray-600 text-sm">Help us connect you with relevant peers and content</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Semester Selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-1">Current Semester</h3>
                <p className="text-xs text-gray-500 mb-3">Select your current academic semester</p>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {semesters.map((semester, index) => (
                  <motion.button
                    key={semester}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-lg transition-all duration-200 ${
                      formData.semester === semester
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-purple-400 hover:shadow-sm'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, semester }))}
                  >
                    <div className="font-semibold text-sm">{semester}</div>
                    <div className="text-xs opacity-75">Sem</div>
                  </motion.button>
                ))}
              </div>

              {formData.semester && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2 bg-purple-50 rounded-md border border-purple-200"
                >
                  <p className="text-xs text-purple-700 font-medium">
                    Selected: {formData.semester} Semester
                  </p>
                </motion.div>
              )}
            </div>

            {/* Batch Selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-1">Batch Year</h3>
                <p className="text-xs text-gray-500 mb-3">Select your admission year</p>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5">
                {batches.map((batch, index) => (
                  <motion.button
                    key={batch}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-lg transition-all duration-200 ${
                      formData.batch === batch
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-pink-400 hover:shadow-sm'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, batch }))}
                  >
                    <div className="font-semibold text-sm">{batch}</div>
                    <div className="text-xs opacity-75">Batch</div>
                  </motion.button>
                ))}
              </div>

              {formData.batch && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-2 bg-pink-50 rounded-md border border-pink-200"
                >
                  <p className="text-xs text-pink-700 font-medium">
                    Selected: {formData.batch} Batch
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-3xl">👨‍🏫</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Faculty Account Ready</h2>
        <p className="text-gray-600 max-w-md mx-auto text-sm">
          Your faculty profile is all set! You can start engaging with students and sharing knowledge.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full">
          <Check size={12} className="text-blue-500" />
          <span className="text-xs font-medium text-blue-700">Faculty features activated</span>
        </div>
      </div>
    );
  };

  const steps = [
    {
      component: <WelcomeStep />
    },
    {
      component: <UsernameStep />
    },
    {
      component: <RoleStep />
    },
    {
      component: <AcademicStep />
    }
  ];

  const stepTitles = ["Welcome", "Avatar & Username", "Role", "Academic Info"];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const canProceed = () => {
    switch (currentStep) {
      case 1: 
        return formData.username && 
               formData.username.length >= 3 && 
               isUsernameAvailable === true &&
               !usernameError; // ✅ Ensure no error
      case 2: return formData.role;
      case 3: return formData.role === 'student' ? formData.semester && formData.batch : true;
      default: return true;
    }
  };

  const handleComplete = async () => {
    try {
      console.log('Final Form Data:', formData);

      const onboardingData = {
        username: formData.username,
        avatar: formData.avatar,
        role: formData.role,
        semester: formData.semester,
        batch: formData.batch,
        subjects: formData.subjects,
        name: formData.username,
        bio: `Hey! I'm ${formData.username} on Trendzz!`,
        firstLogin: false
      };

      console.log('📦 Sending onboarding data via AuthContext...');

      const userProfile = await completeOnboarding(onboardingData);
      
      console.log('✅ Onboarding completed successfully!', userProfile);
      navigate("/", { replace: true });

    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      
      // ✅ Yahan pe agar username taken ka error aaye to wapas username step pe le jao
      if (error.response?.data?.message?.includes('Username already taken') ||
          error.message?.includes('Username already taken')) {
        setCurrentStep(1);
        setIsUsernameAvailable(false);
        setUsernameError('Username already taken. Please choose another one.');
      } else {
        const errorMessage = error.response?.data?.message ||
          error.message ||
          'Failed to complete profile. Please try again.';

        alert(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100"
      >
        {/* Progress Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Zap size={12} className="text-white" />
                </div>
                Profile Setup
              </h1>
              <p className="text-gray-600 text-xs flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs">Quick setup</span>
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              {stepTitles.map((title, index) => (
                <div key={index} className="text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 text-xs ${
                    index === currentStep 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' 
                      : index < currentStep 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index === currentStep ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    ) : index < currentStep ? (
                      <Check size={10} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className={`text-xs font-medium ${
                    index === currentStep ? 'text-purple-600' : 
                    index < currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={prevStep}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 text-sm ${
                currentStep === 0
                  ? 'invisible'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={16} />
              Back
            </motion.button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && currentStep < steps.length - 1 && (
                <button
                  onClick={() => navigate('/')}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-xs font-medium hover:bg-gray-100 rounded-md transition-colors"
                >
                  Skip setup
                </button>
              )}
              
              <motion.button
                whileHover={canProceed() ? { scale: 1.02 } : {}}
                whileTap={canProceed() ? { scale: 0.98 } : {}}
                onClick={currentStep === steps.length - 1 ? handleComplete : nextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm ${
                  canProceed()
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete
                    <Check size={16} />
                  </>
                ) : (
                  <>
                    {currentStep === 0 ? 'Get Started' : 'Continue'}
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;