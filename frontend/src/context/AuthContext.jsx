// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(() => localStorage.getItem("trendzz_token") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userToken);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(!!userToken);
  }, [userToken]);

  const login = (token) => {
    localStorage.setItem("trendzz_token", token);
    setUserToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("trendzz_token");
    setUserToken(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ userToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
