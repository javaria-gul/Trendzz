import React from 'react';
import SearchComponent from '../components/Search/SearchComponent';

const Search = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Search Users</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Find and connect with people by name, username, or interests
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Start Searching</h2>
            <p className="text-gray-500">Type at least 2 characters to find users</p>
          </div>
          
          {/* Search Component */}
          <SearchComponent />
          
          {/* Tips */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
              Search Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="text-blue-600 font-bold text-lg mb-2">1. Start Typing</div>
                <p className="text-gray-600 text-sm">Minimum 2 characters required</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="text-purple-600 font-bold text-lg mb-2">2. Instant Results</div>
                <p className="text-gray-600 text-sm">See users as you type</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="text-green-600 font-bold text-lg mb-2">3. View Profile</div>
                <p className="text-gray-600 text-sm">Click to visit profiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;