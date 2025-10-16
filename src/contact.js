import React, { useEffect } from "react";
import NavLink from "./linkbar";
import bg from "../src/assets/images/bg.png";
import { useNavigate } from "react-router-dom";

const MemoryMapLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/session", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          if (data.user.role === "admin") {
            navigate("/dashboard");
          } else if (data.user.has_submitted_survey) {
            navigate("/userhome");
          } else {
            navigate("/surveyq");
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="relative flex items-center justify-center h-screen w-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-background"
        style={{ backgroundImage: `url(${bg})` }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-500 to-transparent opacity-50 animate-gradient"></div>

      <NavLink />

    
     {/* Full Contact Card */}
<div className="p-4 flex justify-center w-full z-10 mt-8 animate-pop-up">
  <div className="relative bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl shadow-2xl text-white max-w-sm w-full overflow-hidden">
    <div className="p-6 space-y-5 z-10 relative mb-8">
      <h2 className="text-3xl font-bold text-white text-center">CONTACT US</h2>

      {/* Contact Details */}
      <div className="space-y-3 text-sm">
        {/* Phone */}
        <div className="flex items-center space-x-3 bg-blue-800 rounded-full px-4 py-2 shadow-inner">
          <i className="fas fa-phone-alt text-white"></i>
          <p> (062)333-2469| 091884873846/09177073044 </p>
        </div>

        {/* Email */}
        <div className="flex items-center space-x-3 bg-blue-800 rounded-full px-4 py-2 shadow-inner">
          <i className="fas fa-envelope text-white"></i>
          <p>alface01@yahoo.com</p>
        </div>

        {/* facebook */}
       <a 
          href="https://www.facebook.com/SibugayTechnicalInstitueIncorporated" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-3 bg-blue-800 rounded-full px-4 py-2 shadow-inner"
        >
          <i className="fa-brands fa-facebook-f text-sm sm:text-base"></i>
          <p className="text-xs sm:text-sm md:text-base truncate max-w-full">
            www.facebook.com/SibugayTechnicalInstitueIncorporated
          </p>
        </a>


        {/* Website */}
        <a 
          href="https://www.sibugaytech.edu.ph" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-3 bg-blue-800 rounded-full px-4 py-2 shadow-inner"
        >
          <i className="fa-solid fa-globe text-sm sm:text-base"></i>
          <p className="text-xs sm:text-sm md:text-base truncate max-w-full">
            www.sibugaytech.edu.ph
          </p>
        </a>
       

        {/* Address */}
        <div className="flex items-center space-x-3 bg-blue-800 rounded-full px-4 py-2 shadow-inner">
          <i className="fas fa-map-marker-alt text-white"></i>
          <p>Lower taway, Ipil, Zamboanga Sibugay </p>
        </div>
      </div>
    </div>

    {/* Bottom Half Circle Divider */}
    <div className="absolute bottom-0 w-full h-32 bg-white rounded-t-full z-0"></div>

    {/* Image - On top of the white arc */}
    <div className="relative z-10 px-6 pb-6">
      <img
        src="https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
        alt="Support Representative"
        className="w-full rounded-xl shadow-lg -mt-12"
      />
    </div>
  </div>
</div>

      {/* Tailwind Animations */}
      {/* <style>{`
        @keyframes popUp {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-up {
          animation: popUp 0.6s ease-out forwards;
        }
        @keyframes moveBackground {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-background {
          animation: moveBackground 10s infinite linear alternate;
        }
        @keyframes gradientMove {
          0% { transform: translateX(-50%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(-50%); }
        }
        .animate-gradient {
          animation: gradientMove 6s infinite alternate;
        }
        @keyframes glow {
          0% { text-shadow: 0 0 10px #3b82f6; }
          50% { text-shadow: 0 0 20px #1e3a8a; }
          100% { text-shadow: 0 0 10px #3b82f6; }
        }
        .animate-glow {
          animation: glow 2s infinite alternate;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 2s ease-in;
        }
      `}</style> */}

      {/* Bottom Footer */}
      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 py-4 animate-pop-up">
        <nav className="flex justify-center items-center text-white">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} MemoTrace. All Rights Reserved.</p>
        </nav>
      </div>
    </div>
  );
};

export default MemoryMapLanding;
