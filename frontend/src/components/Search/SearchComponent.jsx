import React, { useState, useEffect } from 'react';
import { Search, User, X, MessageCircle, ChevronRight } from 'lucide-react';
import { searchUsers } from '../../services/user';
import { startChat } from '../../services/chat';
import { useNavigate } from 'react-router-dom';

const SearchComponent = ({ mode = "profile", onUserSelect }) => {
  // mode can be: "profile" (default) or "chat"
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchUsers(query);
        
        // Proper response handling
        let users = [];
        if (response.data && Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && response.data.data) {
          users = response.data.data;
        } else if (response.data && response.data.success && response.data.data) {
          users = response.data.data;
        }
        
        setResults(users);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleStartChat = async (user) => {
    try {
      const response = await startChat(user._id);
      if (response.data.success) {
        if (onUserSelect) {
          onUserSelect(response.data.data);
        } else {
          navigate(`/chat/${response.data.data._id}`);
        }
        setShowResults(false);
        setQuery('');
      }
    } catch (error) {
      console.error("Start chat error:", error);
      alert(error.response?.data?.message || "Failed to start chat");
    }
  };

  const handleUserClick = (user) => {
    if (mode === "chat") {
      handleStartChat(user);
    } else {
      navigate(`/user/${user._id}`);
      setShowResults(false);
      setQuery('');
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && query.length >= 2 && results.length > 0) {
      handleUserClick(results[0]._id);
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Input - FIXED TEXT COLOR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder={mode === "chat" ? "Search users to message..." : "Search users by name or username..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-12 pr-12 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          style={{ color: '#111827' }} // Force dark text color
          autoFocus
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - STAYS INSIDE BLOCK */}
      {showResults && (
        <div className="relative mt-3 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-96 overflow-y-auto">
            {/* Loading State */}
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Searching users...</p>
              </div>
            ) : results.length > 0 ? (
              /* Users List */
              <div>
                {results.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserClick(user._id)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        @{user.username}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              /* No Results */
              <div className="p-6 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  No users found for "<span className="font-medium text-gray-800">{query}</span>"
                </p>
                <p className="text-gray-400 text-xs mt-1">Try different keywords</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;