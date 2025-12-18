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
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR */}
      {showSidebars && (
        <div className="hidden md:flex">
          <SidebarLeft />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div
        className={`
          flex-1 bg-gray-50 overflow-y-auto 
          ${showSidebars ? "ml-16 md:ml-16" : "ml-0"}
          ${isChatPage ? "mr-0" : "mr-0 lg:mr-64"}
        `}
      >
        <Outlet />
      </div>

      {/* RIGHT SIDEBAR */}
      {showSidebars && (
        <div className="hidden lg:flex">
          <SidebarRight />
        </div>
      )}
    </div>
  );
};

export default HomeLayout;