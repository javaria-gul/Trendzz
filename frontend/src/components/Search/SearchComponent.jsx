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
    const searchUsers = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchUsers(query);
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
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

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white">
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
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;