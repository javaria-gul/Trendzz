import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import HomeLayout from "./components/Home/HomeLayout";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Onboarding from "./pages/Onboarding";
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import OtherUserProfile from './pages/OtherUserProfile';
import Search from './pages/Search';
import ChatLayout from "./components/ChatLayout";
import ChatWindow from "./components/ChatWindow";
import ChatEmptyState from "./components/ChatEmptyState";


// Simple Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Onboarding Check Component
const OnboardingCheck = ({ children }) => {
  const { userData } = useContext(AuthContext);

  if (userData && userData.firstLogin === true) {
    return <Onboarding />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Onboarding Route */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingCheck>
                <Onboarding />
              </OnboardingCheck>
            </ProtectedRoute>
          } />

          {/* ✅ CORRECTED: HomeLayout with nested routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <OnboardingCheck>
                <HomeLayout />
              </OnboardingCheck>
            </ProtectedRoute>
          }>
            {/* Nested routes - these will show in HomeLayout's main area */}
            <Route index element={<Feed />} /> {/* Default feed */}
            <Route path="profile" element={<Profile />} /> {/* Profile page */}
            <Route path="create-post" element={<div>Create Post Page</div>} /> {/* Create post page */}
          </Route>
          <Route path="/settings" element={
            <ProtectedRoute>
              <OnboardingCheck>
                <Settings />
              </OnboardingCheck>
            </ProtectedRoute>
          } />

          <Route path="/user/:userId" element={
            <ProtectedRoute>
              <OtherUserProfile />
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } />

          <Route path="/user/:userId" element={
            <ProtectedRoute>
              <OtherUserProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatEmptyState />} />
            <Route path=":chatId" element={<ChatWindow />} />
            <Route path="new/:userId" element={<ChatWindow />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;