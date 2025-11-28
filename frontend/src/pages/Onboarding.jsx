import React, { useState, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Sparkles, User, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Avatar Selection */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Choose Your Avatar</h3>
          <div className="grid grid-cols-4 gap-4">
            {avatarOptions.map((avatar, index) => (
              <motion.button
                key={avatar.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-2xl transition-all border-2 ${
                  formData.avatar === avatar.path
                    ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.path }))}
              >
                <div className="flex flex-col items-center space-y-2">
                  <img 
                    src={avatar.path} 
                    alt={avatar.alt}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  />
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    formData.avatar === avatar.path ? 'bg-purple-500' : 'bg-gray-300'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Selected Avatar Preview */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600 mb-3 font-medium">Your selected avatar</p>
            <div className="inline-flex items-center justify-center p-4 bg-purple-50 rounded-2xl border-2 border-purple-200">
              <img 
                src={formData.avatar} 
                alt="Selected Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Username Input */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose Your Username</h3>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username (min 3 characters)"
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 text-lg text-gray-800 placeholder-gray-400 bg-white shadow-sm"
              maxLength={20}
              autoFocus
            />
            
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {isChecking && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
                </motion.div>
              )}
              {!isChecking && isAvailable && hasUserStoppedTyping && (
                <CheckCircle className="text-green-500" size={24} />
              )}
              {!isChecking && !isAvailable && username.length >= 3 && hasUserStoppedTyping && (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mt-4 space-y-2">
            {username.length > 0 && username.length < 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-600 text-sm font-medium text-center"
              >
                Type at least {3 - username.length} more character(s)
              </motion.p>
            )}

            {isChecking && username.length >= 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-600 text-sm font-medium text-center"
              >
                Checking username availability...
              </motion.p>
            )}

            {!isChecking && isAvailable && hasUserStoppedTyping && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-600 text-sm font-medium text-center"
              >
                ✅ Username is available!
              </motion.p>
            )}

            {!isChecking && !isAvailable && username.length >= 3 && hasUserStoppedTyping && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-600 text-sm font-medium text-center"
              >
                ❌ Username is not available
              </motion.p>
            )}
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
        description: 'I am here to learn and connect with peers',
        icon: '🎓',
        color: 'blue'
      },
      {
        id: 'faculty',
        title: 'Faculty Member',
        description: 'I teach and guide students',
        icon: '👨‍🏫',
        color: 'green'
      }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <h3 className="text-xl font-bold text-gray-800 text-center mb-8">Select Your Role</h3>

        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-2xl border-2 transition-all shadow-sm text-left ${
                formData.role === role.id
                  ? `border-${role.color}-500 bg-${role.color}-50 ring-2 ring-${role.color}-200`
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
            >
              <div className="flex items-center space-x-4">
                <div className={`text-3xl ${formData.role === role.id ? `text-${role.color}-600` : 'text-gray-500'}`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold ${
                    formData.role === role.id ? `text-${role.color}-700` : 'text-gray-800'
                  }`}>
                    {role.title}
                  </h4>
                  <p className={`text-sm ${
                    formData.role === role.id ? `text-${role.color}-600` : 'text-gray-600'
                  }`}>
                    {role.description}
                  </p>
                </div>
                {formData.role === role.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`bg-${role.color}-500 rounded-full p-1`}
                  >
                    <Check size={16} className="text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  // Academic Details Step Component
  const AcademicStep = () => {
    const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const batches = ['2020', '2021', '2022', '2023', '2024', '2025'];

    if (formData.role === 'student') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <h3 className="text-xl font-bold text-gray-800 text-center mb-8">Academic Information</h3>

          {/* Semester Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4 text-center">Current Semester</label>
            <div className="grid grid-cols-4 gap-3">
              {semesters.map((semester, index) => (
                <motion.button
                  key={semester}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    formData.semester === semester
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                      : 'bg-white text-gray-800 border-gray-300 hover:border-purple-400 hover:shadow-md'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, semester }))}
                >
                  {semester}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4 text-center">Batch Year</label>
            <div className="grid grid-cols-3 gap-3">
              {batches.map((batch, index) => (
                <motion.button
                  key={batch}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    formData.batch === batch
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:shadow-md'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, batch }))}
                >
                  {batch}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-6">👨‍🏫</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Faculty Member</h3>
        <p className="text-gray-600 text-lg">You're all set as a faculty member!</p>
      </motion.div>
    );
  };

  const steps = [
    {
      title: "Welcome to Trendzz!",
      subtitle: "Let's setup your amazing profile",
      description: "We're excited to have you! Complete your profile to get personalized experience.",
      icon: <Sparkles className="w-12 h-12 text-purple-500" />
    },
    {
      title: "Choose Your Identity",
      subtitle: "Pick a cool username & avatar",
      description: "Your username is your unique identity on Trendzz",
      icon: <User className="w-12 h-12 text-blue-500" />,
      component: <UsernameStep />
    },
    {
      title: "Tell Us About You",
      subtitle: "Are you a student or faculty member?",
      description: "This helps us connect you with relevant content",
      icon: <GraduationCap className="w-12 h-12 text-green-500" />,
      component: <RoleStep />
    },
    {
      title: "Academic Details",
      subtitle: "Share your academic information",
      description: "Connect with peers and educators",
      component: <AcademicStep />
    }
  ];

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

      console.log('📦 Sending onboarding data:', onboardingData);

      const response = await API.put('/auth/profile', onboardingData);

      if (response.data.success) {
        const userProfile = {
          ...response.data.user,
          firstLogin: false
        };

        completeOnboarding(userProfile);
        localStorage.setItem("trendzz_user", JSON.stringify(userProfile));
        
        console.log('✅ Onboarding completed successfully:', userProfile);
        navigate("/", { replace: true });
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to complete profile. Please try again.';

      alert(errorMessage);

      if (error.response?.data?.message?.includes('Username already taken')) {
        setCurrentStep(1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center"
            >
              {steps[currentStep].icon && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="flex justify-center mb-6"
                >
                  {steps[currentStep].icon}
                </motion.div>
              )}

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-800 mb-3"
              >
                {steps[currentStep].title}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-purple-600 font-semibold mb-3"
              >
                {steps[currentStep].subtitle}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8 leading-relaxed"
              >
                {steps[currentStep].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                {steps[currentStep].component}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-between items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className={`px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium ${
                    currentStep === 0 ? 'invisible' : ''
                  }`}
                >
                  <ArrowLeft size={20} className="inline mr-2" />
                  Back
                </motion.button>

                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.2 }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-purple-500 w-6'
                          : index < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: canProceed() ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={currentStep === steps.length - 1 ? handleComplete : nextStep}
                  disabled={!canProceed()}
                  className={`px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-red-700 transition font-medium ${
                    !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Complete Setup
                      <Check size={20} className="inline ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={20} className="inline ml-2" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;