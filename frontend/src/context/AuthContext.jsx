// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import { updateProfile } from "../services/auth";
import { followUser } from "../services/user";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(() => localStorage.getItem("trendzz_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userToken);
  const [userData, setUserData] = useState(() => {
    const stored = localStorage.getItem("trendzz_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setIsAuthenticated(!!userToken);
  }, [userToken]);

  const login = (token, user = null) => {
  localStorage.setItem("trendzz_token", token);
  if (user) {
    // Ensure privacySettings exists in user data
    const userWithPrivacy = {
      ...user,
      privacySettings: user.privacySettings || {
        showEmail: true,
        showFollowers: true,
        showFollowing: true,
        allowMessages: true,
        showOnlineStatus: true
      }
    };
    localStorage.setItem("trendzz_user", JSON.stringify(userWithPrivacy));
    setUserData(userWithPrivacy);
  }
  setUserToken(token);
  setIsAuthenticated(true);
};

  // ✅ IMPROVED LOGOUT FUNCTION
  const logout = (message = "Logged out successfully") => {
    console.log('🔒 [AuthContext] Logging out...', message);
    
    // Clear all storage
    localStorage.removeItem("trendzz_token");
    localStorage.removeItem("trendzz_user");
    sessionStorage.clear();
    
    // ✅ ADDED: Clear specific session items
    localStorage.removeItem("socket_connected");
    localStorage.removeItem("last_activity");
    
    // Clear browser cache
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Reset state
    setUserToken(null);
    setUserData(null);
    setIsAuthenticated(false);
    
    // ✅ ADDED: Clear any pending requests
    if (typeof window !== 'undefined') {
      // Clear all timeouts and intervals
      const maxId = setTimeout(() => {}, 0);
      for (let i = maxId; i >= 0; i--) {
        clearTimeout(i);
        clearInterval(i);
      }
    }
    
    console.log('✅ [AuthContext] Logout complete');
    
    // Redirect to login with slight delay
    setTimeout(() => {
      window.location.href = '/login';
      
      // Prevent back navigation
      window.history.pushState(null, '', '/login');
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', '/login');
      });
    }, 100);
  };

  // ✅ ADDED: Function to handle auth errors from backend
  const handleAuthError = (error) => {
    console.error('🔐 [AuthContext] Auth error detected:', error);
    
    // Check if it's a "User not found" error
    if (error?.response?.data?.message?.includes("User not found") || 
        error?.response?.data?.message?.includes("session expired") ||
        error?.response?.data?.clearToken) {
      
      console.log('⚠️ [AuthContext] Invalid session detected, auto-logout');
      logout("Your session has expired. Please login again.");
      return true;
    }
    
    return false;
  };

  // Enhanced updateUserData function for block/unblock
// Enhanced updateUserData function for block/unblock
const updateUserData = (newData) => {
  console.log('🔄 AuthContext: updateUserData called with:', newData);
  
  setUserData(prevData => {
    // Deep merge to ensure nested objects update correctly
    const updatedData = {
      ...prevData,
      ...newData,
      // If privacySettings exists in newData, merge it properly
      ...(newData.privacySettings && {
        privacySettings: {
          ...prevData.privacySettings,
          ...newData.privacySettings
        }
      })
    };
    
    // Ensure blockedUsers array exists and is properly formatted
    if (updatedData.blockedUsers && !Array.isArray(updatedData.blockedUsers)) {
      updatedData.blockedUsers = [];
    }
    
    console.log('🔄 AuthContext: Updated user data:', updatedData);
    localStorage.setItem("trendzz_user", JSON.stringify(updatedData));
    return updatedData;
  });
};

  // UPDATE completeOnboarding function
  const completeOnboarding = async (userData) => {
    try {
      console.log('🎯 [AuthContext] completeOnboarding called with:', userData);
      
      // Send data to backend
      const response = await updateProfile(userData);
      
      console.log('✅ [AuthContext] Response from updateProfile:', response);
      
      // Extract data from response.data if it exists
      const responseData = response.data || response;
      
      if (responseData && responseData.success !== undefined) {
        if (responseData.success) {
          const updatedUser = responseData.user || responseData;
          
          console.log('✅ [AuthContext] Onboarding successful, user:', updatedUser);
          
          // Update local storage and state
          localStorage.setItem("trendzz_user", JSON.stringify(updatedUser));
          setUserData(updatedUser);
          
          return updatedUser;
        } else {
          throw new Error(responseData.message || "Onboarding failed");
        }
      } else {
        // If success property is missing but we got a response
        console.warn('⚠️ [AuthContext] Success property missing in response:', responseData);
        
        // Assume success if we have user data
        if (responseData && (responseData._id || responseData.username)) {
          console.log('⚠️ [AuthContext] Assuming success and updating user');
          localStorage.setItem("trendzz_user", JSON.stringify(responseData));
          setUserData(responseData);
          return responseData;
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error in completeOnboarding:', error);
      
      // Check if it's an auth error
      if (handleAuthError(error)) {
        return;
      }
      
      // Create proper error object
      const errorObj = {
        message: error.message || "Failed to complete onboarding",
        response: error.response || error,
        success: false
      };
      
      throw errorObj;
    }
  };
      
  // In AuthContext.jsx, add this function:
const handleFollowAction = async (userId, isFollowing) => {
  try {
    const response = await followUser(userId); // You'll need to import followUser
    
    // Extract data from response.data if it exists
    const responseData = response.data || response;
    
    if (responseData.success) {
      const currentFollowing = userData.following || [];
      let updatedFollowing;
      let followingCount = userData.followingCount || 0;
      
      if (isFollowing) {
        // Unfollow - remove from array
        updatedFollowing = currentFollowing.filter(following => {
          const followingId = typeof following === 'object' ? following._id : following;
          return followingId.toString() !== userId.toString();
        });
        followingCount = Math.max(0, followingCount - 1);
      } else {
        // Follow - add to array
        updatedFollowing = [...currentFollowing, userId];
        followingCount += 1;
      }
      
      // Update user data
      updateUserData({
        ...userData,
        following: updatedFollowing,
        followingCount: followingCount
      });
      
      return { success: true, isFollowing: !isFollowing };
    }
  } catch (error) {
    console.error('Follow action error:', error);
    return { success: false, error: error.message };
  }
};

  return (
    <AuthContext.Provider value={{
      userToken,
      isAuthenticated,
      userData,
      login,
      logout,
      updateUserData,
      completeOnboarding,
      handleAuthError, // ✅ ADDED: For handling auth errors
      handleFollowAction
    }}>
      {children}
    </AuthContext.Provider>
  );
};


