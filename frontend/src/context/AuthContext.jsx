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

  const logout = () => {
    // Clear all storage
    localStorage.removeItem("trendzz_token");
    localStorage.removeItem("trendzz_user");
    sessionStorage.clear();

    // Clear browser cache
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    // Redirect to login
    window.location.href = '/login';

    // Prevent back navigation
    window.history.pushState(null, '', '/login');
  };

  // Function to update user data after onboarding
 const updateUserData = (newData) => {
  console.log('🔄 AuthContext: updateUserData called with:', newData);
  
  setUserData(prevData => {
    const updatedData = { ...prevData, ...newData };
    console.log('🔄 AuthContext: Updated user data:', updatedData);
    return updatedData;
  });
};

  // UPDATE completeOnboarding function
const completeOnboarding = async (userData) => {
  try {
    // Send data to backend
    const response = await updateProfile(userData);
    
    if (response.data.success) {
      const updatedUser = response.data.user;
      
      // Update local storage and state
      localStorage.setItem("trendzz_user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      
      return updatedUser;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Error in completeOnboarding:', error);
    throw error;
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
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};


