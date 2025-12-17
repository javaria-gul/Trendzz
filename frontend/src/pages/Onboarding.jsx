import React, { useState, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, GraduationCap, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

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

  // Debounce function
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
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Identity</h2>
          <p className="text-gray-600">Choose how others will see you on Trendzz</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Avatar Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Your Avatar</h3>
              <div className="text-sm text-gray-500">{avatarOptions.length} options</div>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {avatarOptions.map((avatar, index) => (
                <motion.button
                  key={avatar.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    formData.avatar === avatar.path
                      ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.path }))}
                >
                  <div className="relative">
                    <img 
                      src={avatar.path} 
                      alt={avatar.alt}
                      className="w-full aspect-square rounded-lg object-cover border border-gray-200"
                    />
                    {formData.avatar === avatar.path && (
                      <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Avatar Preview */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={formData.avatar} 
                    alt="Selected Avatar"
                    className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Selected Avatar</p>
                  <p className="text-xs text-gray-500">This will be your profile picture</p>
                </div>
              </div>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Username</h3>
              <p className="text-sm text-gray-500 mb-4">This will be your unique identifier</p>
            </div>

            <div className="relative">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-white shadow-sm"
                  maxLength={20}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  @
                </div>
                
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isChecking && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-purple-500"
                    >
                      ⟳
                    </motion.div>
                  )}
                  {!isChecking && isAvailable && hasUserStoppedTyping && (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                  {!isChecking && !isAvailable && username.length >= 3 && hasUserStoppedTyping && (
                    <XCircle className="text-red-500" size={20} />
                  )}
                </div>
              </div>

              {/* Username Guidelines */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${username.length >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Minimum 3 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${/^[a-zA-Z0-9_ ]*$/.test(username) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">Letters, numbers, spaces, underscore</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${username.length <= 20 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">Maximum 20 characters</span>
                </div>
              </div>

              {/* Status Message */}
              {username.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <div className={`p-3 rounded-lg ${
                    isAvailable ? 'bg-green-50 border border-green-200' :
                    !isAvailable && username.length >= 3 ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    {isChecking ? (
                      <p className="text-sm text-blue-600">Checking availability...</p>
                    ) : isAvailable ? (
                      <p className="text-sm text-green-700 font-medium">✓ Username is available!</p>
                    ) : !isAvailable && username.length >= 3 ? (
                      <p className="text-sm text-red-700 font-medium">✗ Username is not available</p>
                    ) : username.length < 3 ? (
                      <p className="text-sm text-amber-600">Type {3 - username.length} more character(s)</p>
                    ) : (
                      <p className="text-sm text-gray-600">Enter a username to check availability</p>
                    )}
                  </div>
                </motion.div>
              )}
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
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50'
      },
      {
        id: 'faculty',
        title: 'Faculty Member',
        description: 'Guide students, share knowledge, and engage with the academic community',
        icon: '👨‍🏫',
        color: 'bg-green-500',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50'
      }
    ];

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center mb-4 shadow-xl">
            <GraduationCap className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Role</h2>
          <p className="text-gray-600">Choose how you'll engage with the Trendzz community</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                formData.role === role.id
                  ? `${role.borderColor} ${role.bgColor} ring-2 ${role.borderColor.replace('border', 'ring')} ring-opacity-30 shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${role.color} flex items-center justify-center text-white text-2xl`}>
                  {role.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-bold ${formData.role === role.id ? role.textColor : 'text-gray-800'}`}>
                      {role.title}
                    </h3>
                    {formData.role === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`${role.color} rounded-full p-1`}
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  <p className={`text-sm ${formData.role === role.id ? `${role.textColor} opacity-90` : 'text-gray-600'}`}>
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Click to select</span>
                  <ChevronRight size={16} className={`${formData.role === role.id ? role.textColor : 'text-gray-400'}`} />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <Check size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
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
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-xl">
              <GraduationCap className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Academic Details</h2>
            <p className="text-gray-600">Help us connect you with relevant peers and content</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Semester Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Current Semester</h3>
                <p className="text-sm text-gray-500 mb-4">Select your current academic semester</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {semesters.map((semester, index) => (
                  <motion.button
                    key={semester}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-3 rounded-xl transition-all duration-200 ${
                      formData.semester === semester
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-purple-400 hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, semester }))}
                  >
                    <div className="font-semibold">{semester}</div>
                    <div className="text-xs opacity-75">Semester</div>
                  </motion.button>
                ))}
              </div>

              {formData.semester && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <p className="text-sm text-purple-700 font-medium">
                    Selected: {formData.semester} Semester
                  </p>
                </motion.div>
              )}
            </div>

            {/* Batch Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Batch Year</h3>
                <p className="text-sm text-gray-500 mb-4">Select your admission year</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {batches.map((batch, index) => (
                  <motion.button
                    key={batch}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-3 rounded-xl transition-all duration-200 ${
                      formData.batch === batch
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 border border-gray-300 hover:border-blue-400 hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, batch }))}
                  >
                    <div className="font-semibold">{batch}</div>
                    <div className="text-xs opacity-75">Batch</div>
                  </motion.button>
                ))}
              </div>

              {formData.batch && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-sm text-blue-700 font-medium">
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
      <div className="text-center py-12">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-xl">
          <span className="text-5xl">👨‍🏫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Faculty Account Ready</h2>
        <p className="text-gray-600 max-w-md mx-auto text-lg">
          Your faculty profile is all set! You can start engaging with students and sharing knowledge.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
          <Check size={16} className="text-green-500" />
          <span className="text-sm font-medium text-green-700">Faculty features activated</span>
        </div>
      </div>
    );
  };

  const steps = [
    {
      title: "Welcome to Trendzz",
      subtitle: "Let's create your profile",
      description: "A few quick steps to personalize your experience",
      icon: <Sparkles className="w-8 h-8" />
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
      case 1: return formData.username && formData.username.length >= 3;
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
      
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to complete profile. Please try again.';

      alert(`Error: ${errorMessage}`);

      if (error.response?.data?.message?.includes('Username already taken')) {
        setCurrentStep(1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden border border-gray-100"
      >
        {/* Progress Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Profile Setup</h1>
              <p className="text-gray-600">Step {currentStep} of {steps.length}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {stepTitles.map((title, index) => (
                <div key={index} className="hidden md:block">
                  <div className={`text-sm font-medium ${
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
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            {/* Progress Dots */}
            <div className="absolute -top-1 w-full flex justify-between">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-4 h-4 rounded-full border-2 border-white shadow ${
                    index === currentStep
                      ? 'bg-purple-500'
                      : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {currentStep === 0 ? (
                <div className="text-center py-12">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-8 shadow-xl">
                    <Sparkles className="text-white w-16 h-16" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Trendzz! 🎉</h2>
                  <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
                    Let's set up your profile to unlock personalized features and connect with your academic community.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                    <Check size={16} className="text-green-500" />
                    <span>Quick setup • Secure • Personalized experience</span>
                  </div>
                </div>
              ) : (
                steps[currentStep].component
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={prevStep}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'invisible'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft size={20} className="inline mr-2" />
              Back
            </motion.button>

            <div className="flex items-center gap-4">
              {currentStep > 0 && (
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Skip setup
                </button>
              )}
              
              <motion.button
                whileHover={canProceed() ? { scale: 1.02 } : {}}
                whileTap={canProceed() ? { scale: 0.98 } : {}}
                onClick={currentStep === steps.length - 1 ? handleComplete : nextStep}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
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
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;