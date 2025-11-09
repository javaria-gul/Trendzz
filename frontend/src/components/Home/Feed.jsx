// src/components/Home/Feed.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Feed = () => {
  const { logout } = useContext(AuthContext);
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Trendzz Feed</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>

        <div className="grid gap-4">
          <div className="bg-white p-4 rounded shadow">Welcome! You're logged in — token is active.</div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
