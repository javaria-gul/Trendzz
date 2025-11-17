import React from 'react';
import SearchComponent from '../components/Search/SearchComponent';

const Search = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Search Users</h1>
          <SearchComponent />
        </div>
      </div>
    </div>
  );
};

export default Search;