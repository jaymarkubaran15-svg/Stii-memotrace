import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchBar({ onSearch }) {
  const [inputValue, setInputValue] = useState('');

  const handleClick = () => {
    onSearch(inputValue);
  };

  return (
    <div className="flex items-center bg-white p-2 rounded-lg shadow-md">
      <FaSearch className="text-gray-500 mr-2" />
      <input
        type="text"
        placeholder="Search"
        className="outline-none bg-transparent"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button 
        onClick={handleClick} 
        className="bg-blue-500 text-white px-4 py-1 ml-2 rounded-lg">
        Search
      </button>
    </div>
  );
}

export default SearchBar;
