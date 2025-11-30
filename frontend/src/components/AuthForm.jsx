
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
      if (isLogin) {
        const res = await apiLogin({ email: form.email, password: form.password });
        const token = res.data.token || (res.data && res.data.token) || res.data;
        const firstLogin = res.data.firstLogin; // ✅ GET firstLogin FROM RESPONSE
        
        if (!token) throw new Error("No token in response");
        
        // ✅ UPDATED: Pass user data with firstLogin status
        setAuthToken(token, { 
          email: form.email, 
          firstLogin: firstLogin !== undefined ? firstLogin : true,
          name: form.name || '' 
        });
        
        // ✅ REDIRECT TO ONBOARDING FOR NEW USERS
        if (firstLogin !== false) {
          navigate("/onboarding");
        } else {
          navigate("/");
        }
      } else {
        await apiRegister({ name: form.name, email: form.email, password: form.password });
        const res = await apiLogin({ email: form.email, password: form.password });
        const token = res.data.token || res.data;
        const firstLogin = res.data.firstLogin;
        
        // ✅ UPDATED: Pass user data with firstLogin status  
        setAuthToken(token, { 
          email: form.email, 
          firstLogin: firstLogin !== undefined ? firstLogin : true,
          name: form.name 
        });
        
        // ✅ NEW USERS ALWAYS GO TO ONBOARDING
        navigate("/onboarding");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Something went wrong");
      }
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

      {error && <div className="bg-red-600 text-white p-2 rounded mb-3 text-sm">{error}</div>}

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
        <button onClick={toggleMode} className="text-pink-400 font-semibold ml-2 hover:text-pink-300 transition-colors">
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </motion.div>
  );
}