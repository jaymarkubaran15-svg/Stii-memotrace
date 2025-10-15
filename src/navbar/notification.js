import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

import Sidebar from "../navbar/sidebar";


export default function Dashboard() {
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-10 bg-gray-50">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Yearbooks</h1>
          <div className="flex items-center bg-white p-2 rounded-lg shadow-md">
            <FaSearch className="text-gray-500 mr-2" />
            <input type="text" placeholder="Search" className="outline-none bg-transparent" />
          </div>
        </div>
      
      </div>
    </div>
  );
}