import React, { useState, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import { searchUsers } from '../../services/user';
import { useNavigate } from 'react-router-dom';

const SearchComponent = () => {
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
        
        // Proper response handling based on your API structure
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

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
    setShowResults(false);
    setQuery('');
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
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input - Professional Design */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users by name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-12 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Professional Design */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[70vh] overflow-y-auto z-50">
          {/* Loading State */}
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-3">Searching users...</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              {/* Results Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">
                    Users ({results.length})
                  </h3>
                  <span className="text-xs text-gray-500">Press Enter for first result</span>
                </div>
              </div>

              {/* Users List */}
              <div className="py-2">
                {results.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserClick(user._id)}
                    className="w-full text-left px-6 py-4 hover:bg-purple-50 flex items-center gap-4 transition-colors border-b border-gray-100 last:border-b-0 group"
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-gray-900 text-base truncate">
                          {user.name}
                        </p>
                        {user.verified && (
                          <span className="text-blue-500 text-xs bg-blue-50 px-1.5 py-0.5 rounded">✓ Verified</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-gray-500 text-sm mt-1 truncate max-w-md">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    {/* Action Arrow */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query.length >= 2 ? (
            // No Results State
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium text-lg mb-2">No users found</p>
              <p className="text-gray-500">
                No results for "<span className="text-gray-900 font-semibold">{query}</span>"
              </p>
              <p className="text-gray-400 text-sm mt-3">Try different keywords or check spelling</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;