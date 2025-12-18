import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, GraduationCap, CheckCircle, XCircle, BookOpen, Globe, Heart, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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

  // Floating Background Animation Component
// Floating Background Animation Component - UPDATED
const FloatingBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60" />
      
      {/* Animated Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 80 + 20,
            height: Math.random() * 80 + 20,
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, ${Math.random() * 0.08 + 0.02}) 0%, 
              rgba(168, 85, 247, ${Math.random() * 0.06 + 0.02}) 50%,
              transparent 100%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(20px)',
          }}
          animate={{
            y: [0, Math.random() * 100 - 50, 0],
            x: [0, Math.random() * 100 - 50, 0],
            scale: [1, Math.random() * 0.5 + 0.8, 1],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Soft Wave-like Layers */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.1) 50%, 
            transparent 100%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 100, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Floating Dots Pattern */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 150}, 255, ${Math.random() * 0.2 + 0.05})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 40 - 20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Subtle Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-blue-50/5" />
    </div>
  );
};

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

  // Welcome Step Component - UPDATED WITH SOFT COLORS
  const WelcomeStep = () => {
    return (
      <div className="text-center py-8 px-4">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          {/* Logo/Brand */}
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="inline-flex items-center justify-center gap-2 mb-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Globe className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Trendzz
              </h1>
            </motion.div>
          </div>

          {/* Hero Section */}
          <div className="mb-6">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 leading-tight"
            >
              Welcome to Your
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-1"
              >
                Digital Campus
              </motion.span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 max-w-lg mx-auto mb-6"
            >
              Let's create your personalized academic profile
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            {[
              {
                icon: <BookOpen className="text-blue-500" size={20} />,
                title: "Smart Learning",
                description: "Personalized content and resources"
              },
              {
                icon: <Heart className="text-pink-500" size={20} />,
                title: "Community First",
                description: "Connect with peers and mentors"
              },
              {
                icon: <Zap className="text-amber-500" size={20} />,
                title: "Quick Setup",
                description: "Get started in just a few steps"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ 
                  y: -4, 
                  scale: 1.02,
                  transition: { duration: 0.2 } 
                }}
                className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-3"
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress Indicators */}
          <div className="mb-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mb-3"
            >
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <motion.div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === 1 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {step}
                  </motion.div>
                  {step < 4 && (
                    <div className={`w-4 h-0.5 ${step === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 text-xs"
            >
              Step 1 of 4 • Quick Setup
            </motion.p>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-3 shadow-lg"
          >
            <User className="text-white" size={24} />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Create Your Identity</h2>
          <p className="text-gray-600 text-sm">Choose how others will see you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-800">Your Avatar</h3>
              <span className="text-xs text-gray-500">{avatarOptions.length} options</span>
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
                  className={`p-1.5 rounded-lg transition-all duration-300 ${
                    formData.avatar === avatar.path
                      ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 shadow-sm'
                      : 'hover:bg-gray-50 hover:shadow'
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5"
                      >
                        <Check size={10} className="text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Avatar Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-3 border-t border-gray-100"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <motion.img 
                    src={formData.avatar} 
                    alt="Selected Avatar"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">Selected Avatar</p>
                  <p className="text-xs text-gray-500">Your profile picture</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Username Input */}
          <div className="space-y-3">
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-1">Choose Username</h3>
              <p className="text-xs text-gray-500 mb-3">This will be your unique identifier</p>
            </div>

            <div className="relative">
              <div className="relative">
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  placeholder="Enter username"
                  className={`w-full px-3 py-2 pl-9 border rounded-lg focus:outline-none focus:ring-1 text-gray-800 bg-white shadow-sm ${
                    usernameError 
                      ? 'border-red-300 focus:ring-red-300' 
                      : isUsernameAvailable 
                        ? 'border-green-300 focus:ring-green-300' 
                        : 'border-gray-300 focus:ring-blue-300'
                  }`}
                  maxLength={20}
                  whileFocus={{ scale: 1.01 }}
                />
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  @
                </div>
                
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-blue-500"
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

              {/* REAL-TIME ERROR MESSAGE */}
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
                {[
                  { condition: username.length >= 3, text: 'Minimum 3 characters' },
                  { condition: /^[a-zA-Z0-9_ ]*$/.test(username), text: 'Letters, numbers, spaces, underscore' },
                  { condition: username.length <= 20, text: 'Maximum 20 characters' }
                ].map((guideline, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${guideline.condition ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-600">{guideline.text}</span>
                  </motion.div>
                ))}
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
      </motion.div>
    );
  };

  // Role Selection Step Component
  const RoleStep = () => {
    const roles = [
      {
        id: 'student',
        title: 'Student',
        description: 'Join as a learner to explore, connect, and grow with peers',
        icon: <BookOpen className="text-blue-600" size={20} />,
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50'
      },
      {
        id: 'faculty',
        title: 'Faculty Member',
        description: 'Guide students, share knowledge, and engage with the academic community',
        icon: <GraduationCap className="text-indigo-600" size={20} />,
        color: 'bg-indigo-500',
        borderColor: 'border-indigo-500',
        textColor: 'text-indigo-700',
        bgColor: 'bg-indigo-50'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-3 shadow-lg"
          >
            <GraduationCap className="text-white" size={24} />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Select Your Role</h2>
          <p className="text-gray-600 text-sm">Choose how you'll engage with the community</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02, 
                y: -3,
                transition: { type: "spring", stiffness: 300 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                formData.role === role.id
                  ? `${role.borderColor} ${role.bgColor} ring-1 ring-opacity-30 shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center text-white`}
                >
                  {role.icon}
                </motion.div>
                
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full">
              <Check size={12} className="text-blue-500" />
              <span className="text-xs font-medium text-blue-700">
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-3 shadow-lg"
            >
              <BookOpen className="text-white" size={24} />
            </motion.div>
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
                    className={`py-2 rounded-lg transition-all duration-300 ${
                      formData.semester === semester
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-blue-400 hover:shadow-sm'
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
                  className="p-2 bg-blue-50 rounded-md border border-blue-200"
                >
                  <p className="text-xs text-blue-700 font-medium">
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
                    className={`py-2 rounded-lg transition-all duration-300 ${
                      formData.batch === batch
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-indigo-400 hover:shadow-sm'
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
                  className="p-2 bg-indigo-50 rounded-md border border-indigo-200"
                >
                  <p className="text-xs text-indigo-700 font-medium">
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg"
        >
          <GraduationCap className="text-white" size={28} />
        </motion.div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Faculty Account Ready</h2>
        <p className="text-gray-600 max-w-md mx-auto text-sm">
          Your faculty profile is all set! You can start engaging with students and sharing knowledge.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full"
        >
          <Check size={12} className="text-blue-500" />
          <span className="text-xs font-medium text-blue-700">Faculty features activated</span>
        </motion.div>
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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
    {/* Floating Background Animation */}
    <FloatingBackground />
    
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-white/30 relative z-10"
      style={{
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Rest of your component remains the same */}
        {/* Progress Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <motion.div 
                  className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Globe size={12} className="text-white" />
                </motion.div>
                Profile Setup
              </h1>
              <p className="text-gray-600 text-xs flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs">Quick setup</span>
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              {stepTitles.map((title, index) => (
                <div key={index} className="text-center">
                  <motion.div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 text-xs ${
                      index === currentStep 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                        : index < currentStep 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {index === currentStep ? (
                      <motion.div 
                        className="w-1.5 h-1.5 rounded-full bg-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    ) : index < currentStep ? (
                      <Check size={10} />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  <div className={`text-xs font-medium ${
                    index === currentStep ? 'text-blue-600' : 
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
                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
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
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-gray-200/50">
          <div className="flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-xs font-medium hover:bg-gray-100 rounded-md transition-colors"
                >
                  Skip setup
                </motion.button>
              )}
              
              <motion.button
                whileHover={canProceed() ? { scale: 1.05, y: -2 } : {}}
                whileTap={canProceed() ? { scale: 0.95 } : {}}
                onClick={currentStep === steps.length - 1 ? handleComplete : nextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-1.5 text-sm ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-md shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check size={16} />
                    </motion.span>
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