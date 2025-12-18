 // src/pages/AuthPage.jsx
import React from "react";
import { motion } from "framer-motion";
import AuthForm from "../components/AuthForm";
import { useLocation, useNavigate } from "react-router-dom";
import loginGif from "../assets/trendzz-login.gif";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === "/login" || location.pathname === "/";

  // Fixed toggleMode inside component
  const toggleMode = () => {
    if (isLogin) {
      navigate("/register");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Panel */}
      <motion.div
        className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-purple-700 to-pink-500"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center p-6">
          <img
            src={loginGif}
            alt="Trendzz"
            className="rounded-2xl shadow-2xl w-72 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold mb-2">
            Welcome to <span className="text-yellow-300">Trendzz</span>
          </h1>
          <p className="text-lg text-gray-100">
            Where creativity meets connection — join the Trendzz wave today 🌊
          </p>
        </div>
      </motion.div>

      {/* Right Panel - AuthForm */}
      <motion.div
        className="md:w-1/2 flex items-center justify-center bg-gray-900"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <AuthForm isLogin={isLogin} toggleMode={toggleMode} />
      </motion.div>
    </div>
  );
}

