import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

import Sidebar from "../navbar/sidebar";
import Event from "../navbar/event";
import {useNavigate} from "react-router-dom";
import CreateAdminPost from '../navbar/CreateAdminPost'
import AdminPost from '../navbar/AdminPost'


export default function Post({ onSearch }) {
  const [showPostSection, setShowPostSection] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const handleClick = () => {
    if (inputValue.trim()) {
      navigate(`/searchresult?query=${encodeURIComponent(inputValue)}`);
    }
  };


  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/session", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          navigate(data.user.role === "admin" ? "/post" : "/userhome");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, [navigate]);
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-100 min-h-screen">
        <div className="w-full mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{showPostSection ? "Community" : "Community"}</h1>
              <div className="flex items-center bg-white p-2 rounded-lg shadow-md">
                  <FaSearch className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="outline-none bg-transparent"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  />
                  <button 
                    onClick={handleClick} 
                    className="bg-blue-500 text-white px-4 py-1 ml-2 rounded-lg">
                    Search
                  </button>
                </div>
          </div>


          <div className="flex gap-4 items-center mb-5">
            <button onClick={() => { setShowPostSection(true); }} className={`px-4 py-2 font-bold rounded-lg ${showPostSection ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Post</button>
            <button onClick={() => { setShowPostSection(false); }} className={`px-4 py-2 font-bold rounded-lg ${!showPostSection ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Event</button>
          </div>
        

        {/* Event Page  */}
        {showPostSection ? (
           <>
           {/* Create Post Section */}
              <CreateAdminPost />
           {/* Posts Section */}
        <div className="space-y-6 mb-24">
           <AdminPost />
        </div>
         </>
        
      ) : (
        <Event />
)}

        </div>
      </div>
    </div>
  );
}
