import React from 'react';
import SearchComponent from '../components/Search/SearchComponent';

const Search = () => {
  return (
    // REMOVE: items-center justify-center - Yeh center kar raha tha
    // ADD: pt-4 for top padding only
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Search Card - Remove extra top margin */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-2"> {/* mt-2 for minimal top space */}
          
          {/* Add a proper header since we removed "Start Searching" text */}
          <div className="mb-6 text-center">
          
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Search Users</h1>
            <p className="text-gray-500 text-sm">Find people by name or username</p>
          </div>
          
          {/* Search Component */}
          <div className="mb-6">
            <SearchComponent />
          </div>
          
          {/* Tips Section - Compact design */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              SEARCH TIPS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-600 font-medium text-sm mb-1">1. Start Typing</div>
                <p className="text-gray-600 text-xs">Minimum 2 characters</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-600 font-medium text-sm mb-1">2. Instant Results</div>
                <p className="text-gray-600 text-xs">See users as you type</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 font-medium text-sm mb-1">3. View Profile</div>
                <p className="text-gray-600 text-xs">Click to visit profiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;