// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import { updateProfile } from "../services/auth";

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
      localStorage.setItem("trendzz_user", JSON.stringify(user));
      setUserData(user);
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
  const updateUserData = (newData) => {
    console.log('🔄 AuthContext: updateUserData called with:', newData);
    
    setUserData(prevData => {
      const updatedData = { ...prevData, ...newData };
      
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
      
      if (response && response.success !== undefined) {
        if (response.success) {
          const updatedUser = response.user || response;
          
          console.log('✅ [AuthContext] Onboarding successful, user:', updatedUser);
          
          // Update local storage and state
          localStorage.setItem("trendzz_user", JSON.stringify(updatedUser));
          setUserData(updatedUser);
          
          return updatedUser;
        } else {
          throw new Error(response.message || "Onboarding failed");
        }
      } else {
        // If success property is missing but we got a response
        console.warn('⚠️ [AuthContext] Success property missing in response:', response);
        
        // Assume success if we have user data
        if (response && (response._id || response.username)) {
          console.log('⚠️ [AuthContext] Assuming success and updating user');
          localStorage.setItem("trendzz_user", JSON.stringify(response));
          setUserData(response);
          return response;
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

  return (
    <AuthContext.Provider value={{
      userToken,
      isAuthenticated,
      userData,
      login,
      logout,
      updateUserData,
      completeOnboarding,
      handleAuthError // ✅ ADDED: For handling auth errors
    }}>
      {children}
    </AuthContext.Provider>
  );
};