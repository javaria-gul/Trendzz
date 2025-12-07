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
      
  // In AuthContext.jsx, add this function:
const handleFollowAction = async (userId, isFollowing) => {
  try {
    const response = await followUser(userId); // You'll need to import followUser
    
    if (response.data.success) {
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
      handleFollowAction
    }}>
      {children}
    </AuthContext.Provider>
  );
};


