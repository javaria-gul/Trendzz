import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { register as apiRegister, login as apiLogin } from "../services/auth";
import { AuthContext } from "../context/AuthContext";

export default function AuthForm({ isLogin, toggleMode }) {
  const navigate = useNavigate();
  const { login: setAuthToken } = useContext(AuthContext);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    validateField(e.target.name, e.target.value);
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (name === "name") {
      errors.name = value.trim().length < 3 ? "Name must be at least 3 characters" : "";
    }
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errors.email = emailRegex.test(value) ? "" : "Invalid email format";
    }
    if (name === "password") {
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      errors.password = pwRegex.test(value)
        ? ""
        : "Password must be 8+ chars, include uppercase, lowercase & number";
    }

    setFormErrors(errors);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Final check before sending request
    for (let key in form) validateField(key, form[key]);
    if (Object.values(formErrors).some((err) => err)) return;

    setLoading(true);

    try {
      console.log('🚀 Starting auth process...');
      console.log('📝 Form data:', form);
      console.log('🔑 Mode:', isLogin ? 'Login' : 'Register');

      if (isLogin) {
        // LOGIN
        console.log('📡 Calling login API...');
        const res = await apiLogin({ email: form.email, password: form.password });
        
        console.log('📦 Login response:', res);
        console.log('🔍 Response structure:', {
          data: res.data,
          status: res.status,
          hasToken: !!(res.data?.token)
        });

        // ✅ FIXED: Extract token and user data properly
        const responseData = res.data || res;
        const token = responseData.token || responseData.data?.token || responseData.accessToken;
        const user = responseData.user || responseData.data?.user || {
          email: form.email,
          name: form.name || '',
          firstLogin: responseData.firstLogin !== false
        };

        console.log('🔑 Extracted token:', token ? 'Yes' : 'No');
        console.log('👤 Extracted user:', user);

        if (!token) {
          throw new Error("No token in response. Response: " + JSON.stringify(responseData));
        }
        
        // ✅ FIXED: Pass token and user data
        setAuthToken(token, user);
        
        // ✅ REDIRECT TO ONBOARDING FOR NEW USERS
        if (user.firstLogin !== false) {
          console.log('🎯 Redirecting to onboarding (first login)');
          navigate("/onboarding");
        } else {
          console.log('🎯 Redirecting to home (not first login)');
          navigate("/");
        }
      } else {
        // REGISTER
        console.log('📡 Calling register API...');
        const registerRes = await apiRegister({ 
          name: form.name, 
          email: form.email, 
          password: form.password 
        });
        
        console.log('📦 Register response:', registerRes);
        
        // ✅ FIXED: After registration, auto-login
        console.log('📡 Auto-login after registration...');
        const loginRes = await apiLogin({ email: form.email, password: form.password });
        
        const loginData = loginRes.data || loginRes;
        const token = loginData.token || loginData.data?.token || loginData.accessToken;
        const user = loginData.user || loginData.data?.user || {
          email: form.email,
          name: form.name,
          firstLogin: true
        };

        console.log('🔑 Registration token:', token ? 'Yes' : 'No');
        console.log('👤 Registration user:', user);

        if (!token) {
          throw new Error("No token after registration. Response: " + JSON.stringify(loginData));
        }
        
        // ✅ FIXED: Pass token and user data
        setAuthToken(token, user);
        
        // ✅ NEW USERS ALWAYS GO TO ONBOARDING
        console.log('🎯 Redirecting new user to onboarding');
        navigate("/onboarding");
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      
      // ✅ FIXED: Better error message extraction
      let errorMessage = "Something went wrong";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg w-80"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-center">
        {isLogin ? "Welcome Back" : "Create your account"}
      </h2>

      {error && (
        <div className="bg-red-600 text-white p-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col space-y-3">
        {!isLogin && (
          <>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              className="p-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 text-white placeholder-gray-400"
              required={!isLogin}
              disabled={loading}
            />
            {formErrors.name && <span className="text-red-400 text-sm">{formErrors.name}</span>}
          </>
        )}

        <>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            className="p-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 text-white placeholder-gray-400"
            required
            disabled={loading}
          />
          {formErrors.email && <span className="text-red-400 text-sm">{formErrors.email}</span>}
        </>

        <>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            type="password"
            className="p-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 text-white placeholder-gray-400"
            required
            disabled={loading}
          />
          {formErrors.password && <span className="text-red-400 text-sm">{formErrors.password}</span>}
        </>

        <button
          type="submit"
          disabled={loading}
          className={`py-3 rounded-lg font-bold text-white transition transform ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105"
          }`}
        >
          {loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "Login" : "Sign up")}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-300">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={toggleMode} 
          className="text-pink-400 font-semibold ml-2 hover:text-pink-300 transition-colors"
          disabled={loading}
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </motion.div>
  );
}