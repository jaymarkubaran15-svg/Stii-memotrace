import React, { useState } from "react";
import {  Link } from "react-router-dom";
import OK from "../src/assets/images/bahog.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-0 left-0 w-full p-6 bg-opacity-50 bg-black animate-pop-up z-50">
      <nav className="flex justify-between items-center text-white">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <img 
            src={OK} 
            alt="Logo" 
            className="w-12 h-8 sm:w-16 sm:h-10 md:w-20 md:h-12 object-contain" 
          />
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-blue-400 animate-glow">
            MemoTrace
          </h1>
        </div>


        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 ml-auto">
          <Link to="/" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Home</Link>
          <Link to="/about" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">About</Link>
          <Link to="/services" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Services</Link>
          {/* <Link to="/project" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Project</Link> */}
          <Link to="/contact" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Contact</Link>
          <Link to="/login" className="text-2xl font-bold hover:bg-sky-500 active:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Login</Link>
        </div>

        {/* Hamburger Icon (Mobile) */}
        <div className="md:hidden ml-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none"
          >
            {/* Hamburger icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="flex flex-col mt-4 space-y-4 md:hidden text-white text-center">
          <Link to="/" className="text-xl font-bold hover:bg-sky-500 px-4 py-2 rounded-lg" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/about" className="text-xl font-bold hover:bg-sky-500 px-4 py-2 rounded-lg" onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/services" className="text-xl font-bold hover:bg-sky-500 px-4 py-2 rounded-lg" onClick={() => setIsOpen(false)}>Services</Link>
          
          <Link to="/contact" className="text-xl font-bold hover:bg-sky-500 px-4 py-2 rounded-lg" onClick={() => setIsOpen(false)}>Contact</Link>
          <Link to="/login" className="text-xl font-bold hover:bg-sky-500 px-4 py-2 rounded-lg" onClick={() => setIsOpen(false)}>Login</Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;