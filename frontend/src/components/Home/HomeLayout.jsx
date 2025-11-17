import React from "react";
import SidebarLeft from "./SidebarLeft";
import { Outlet, useLocation } from "react-router-dom";

const HomeLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/chat");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR - Always visible */}
      <div className="hidden md:flex">
        <SidebarLeft />
      </div>

      {/* MAIN CONTENT - Full width on chat pages */}
      <div className={`
        flex-1 bg-gray-50 overflow-y-auto 
        ml-16 md:ml-16 
        ${isChatPage ? 'mr-0' : 'mr-0 lg:mr-64'}
      `}>
        <Outlet />
      </div>
    </div>
  );
};

export default HomeLayout;