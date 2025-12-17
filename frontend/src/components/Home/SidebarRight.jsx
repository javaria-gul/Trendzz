// src/components/Home/SidebarRight.jsx
import React, { useState, useEffect } from "react";
import { UserPlus, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { postsAPI } from "../../services/api";

const SidebarRight = () => {
  const navigate = useNavigate();
  const [openPopup, setOpenPopup] = useState(null);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);

  // Dummy data (later API)
  const suggestions = [
    { name: "Ayesha Khan", username: "@ayesha" },
    { name: "Ali Raza", username: "@ali" },
    { name: "Sara Ahmed", username: "@sara" },
    { name: "Usman Tariq", username: "@usman" },
  ];

  const followers = [
    { name: "Hassan Malik", username: "@hassan" },
    { name: "Fatima Noor", username: "@fatima" },
    { name: "Bilal Hussain", username: "@bilal" },
  ];

  const following = [
    { name: "Maryam Zafar", username: "@maryam" },
    { name: "Ahmed Ali", username: "@ahmed" },
    { name: "Arslan Iqbal", username: "@arslan" },
  ];

  // Fetch trending hashtags
  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      setLoadingHashtags(true);
      const response = await postsAPI.getTrendingHashtags(5, 7);
      if (response.success) {
        setTrendingHashtags(response.trending || []);
      }
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    } finally {
      setLoadingHashtags(false);
    }
  };

  const getTop2 = (arr) => arr.slice(0, 2);

  return (
    <>
      {/* Main Sidebar */}
      <div
        className="
          hidden md:flex 
          flex-col space-y-3
          p-3
          w-64
          fixed right-3 top-4 
          bg-blue-900 
          h-[calc(100vh-30px)]
          rounded-2xl 
          
          overflow-hidden
        "
      >
        {/* Trending Hashtags */}
        <div className="bg-white rounded-xl shadow p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-800 text-s">Trending</h2>
          </div>

          {loadingHashtags ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : trendingHashtags.length > 0 ? (
            <ul className="space-y-1">
              {getTop2(trendingHashtags).map((item, index) => (
                <li 
                  key={index}
                  onClick={() => navigate(`/hashtag/${item.hashtag}`)}
                  className="cursor-pointer hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                >
                  <p className="text-xs font-semibold text-blue-600">#{item.hashtag}</p>
                  <p className="text-xs text-gray-500">{item.count} {item.count === 1 ? 'post' : 'posts'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 py-2">No trending hashtags yet</p>
          )}

          {trendingHashtags.length > 2 && (
            <button
              onClick={() => setOpenPopup("trending")}
              className="mt-1 text-red-600 text-xs hover:text-red-700 transition"
            >
              View All →
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-xl shadow p-2">
          <div className="flex items-center gap-1 mb-1">
            <UserPlus size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-800 text-s">Suggestions</h2>
          </div>

          <ul className="space-y-1">
            {getTop2(suggestions).map((user, index) => (
              <li key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.username}</p>
                </div>
                <button className="
                  text-xs 
                  bg-red-700 text-white 
                  rounded-full px-2 py-1
                  hover:bg-blue-900 
                  transition
                ">
                  Follow
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpenPopup("suggestions")}
            className="mt-1 text-blue-600 text-xs hover:text-red-700 transition"
          >
            View All →
          </button>
        </div>

        {/* Followers */}
        <div className="bg-white rounded-xl shadow p-2">
          <div className="flex items-center gap-1 mb-1">
            <Users size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-800 text-s">Followers</h2>
          </div>

          <ul className="space-y-1">
            {getTop2(followers).map((user, index) => (
              <li key={index}>
                <p className="text-xs font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.username}</p>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpenPopup("followers")}
            className="mt-1 text-green-600 text-xs hover:text-red-700 transition"
          >
            View All →
          </button>
        </div>

        {/* Following */}
        <div className="bg-white rounded-xl shadow p-2">
          <div className="flex items-center gap-1 mb-1">
            <Users size={16} className="text-purple-500" />
            <h2 className="font-semibold text-gray-800 text-s">Following</h2>
          </div>

          <ul className="space-y-1">
            {getTop2(following).map((user, index) => (
              <li key={index}>
                <p className="text-xs font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.username}</p>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpenPopup("following")}
            className="mt-1 text-purple-600 text-xs hover:text-red-700 transition"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Universal Popup */}
      {openPopup && (
        <div
          className="
            fixed inset-0 
            bg-black/30 backdrop-blur-sm 
            flex items-center justify-center
            z-50
          "
        >
          <div className="bg-white w-96 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 capitalize">
              {openPopup} list
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(openPopup === "trending"
                ? trendingHashtags.map((item, index) => ({
                    name: `#${item.hashtag}`,
                    username: `${item.count} posts`,
                    hashtag: item.hashtag
                  }))
                : openPopup === "suggestions"
                ? suggestions
                : openPopup === "followers"
                ? followers
                : following
              ).map((item, index) => (
                <div
                  key={index}
                  className="
                    flex justify-between items-center 
                    bg-gray-50 
                    p-3 rounded-xl 
                    hover:bg-blue-50 
                    transition-all
                  "
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">{item.username}</p>
                  </div>

                  {openPopup === "trending" ? (
                    <button
                      onClick={() => {
                        setOpenPopup(null);
                        navigate(`/hashtag/${item.hashtag}`);
                      }}
                      className="
                        px-3 py-1 bg-blue-600 
                        text-white rounded-lg 
                        hover:bg-blue-700 
                        transition text-sm
                      "
                    >
                      View
                    </button>
                  ) : (
                    <button
                      className="
                        px-3 py-1 bg-blue-900 
                        text-white rounded-lg 
                        hover:bg-red-700 
                        transition
                      "
                    >
                      Follow
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpenPopup(null)}
              className="
                mt-5 w-full 
                bg-blue-900 text-white 
                py-2 rounded-xl 
                hover:bg-red-700 
                transition
              "
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarRight;