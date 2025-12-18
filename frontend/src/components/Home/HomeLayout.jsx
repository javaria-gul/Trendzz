// src/components/Home/HomeLayout.jsx
import React from "react";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import { Outlet, useLocation } from "react-router-dom";

const HomeLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/chat");

  // Show sidebars for ALL pages except chat
  const showSidebars = !isChatPage;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* LEFT SIDEBAR - Fixed with proper z-index */}
      {showSidebars && (
        <div className="hidden md:flex fixed left-0 top-0 h-screen z-40">
          <SidebarLeft />
        </div>
      )}

      {/* MAIN CONTENT - With proper margin to avoid sidebar overlap */}
      <div
        className={`
          flex-1 bg-gray-50 overflow-y-auto min-h-screen relative z-0
          ${showSidebars ? "ml-0 md:ml-20" : "ml-0"}
          ${isChatPage ? "mr-0" : "mr-0 lg:mr-64"}
        `}
      >
        <Outlet />
      </div>

      {/* RIGHT SIDEBAR - Fixed with proper z-index */}
      {showSidebars && (
        <div className="hidden lg:flex fixed right-0 top-0 h-screen z-30">
          <SidebarRight />
        </div>
      )}
    </div>
  );
};

export default HomeLayout;