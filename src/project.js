import React, { useEffect } from "react";
import NavLink from "./linkbar";
import { useNavigate } from "react-router-dom";
import bg from "../src/assets/images/bg.png";
import jj from "../src/assets/images/bgadadsasd.jpg";

const MemoryMapLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/session", {
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
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-black">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-background z-0"
        style={{ backgroundImage: `url(${bg})` }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-500 to-transparent opacity-60 animate-gradient z-10"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 opacity-50 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: "6s",
            }}
          ></div>
        ))}
      </div>

      {/* Navigation */}
      <NavLink />

      {/* Content */}
      <div className="relative z-30 w-full px-4 py-12 sm:px-6 md:px-10 lg:px-20 max-w-7xl animate-pop-up">
        <div className="flex flex-col lg:flex-row items-center mt-12 justify-between gap-12">

            {/* Left Side (Text + Image) */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 lg:mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white animate-glow">
              Project
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white leading-relaxed animate-fade-in">
              The MEMOTRACE is designed to serve as a digital platform that combines a traditional yearbook with an alumni tracking feature...
            </p>
            <div className="flex justify-center lg:justify-start">
              <img
                src={jj}
                alt="jj"
                className="w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="w-full lg:w-1/2 text-left text-white space-y-8">
            <div>
              <h2 className="text-2xl text-blue-300 font-semibold">Technology Stack:</h2>
              <ul className="text-sm sm:text-base list-disc list-inside">
                <li>Frontend: HTML, CSS, JavaScript, React</li>
                <li>Backend: PHP, Node.js, or Python (Django/Flask)</li>
                <li>Database: MySQL, PostgreSQL, or Firebase</li>
                <li>Hosting: Cloud-based (AWS, Heroku, Firebase Hosting)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl text-blue-300 font-semibold">Expected Outcome:</h2>
              <ul className="text-sm sm:text-base list-disc list-inside">
                <li>A functional web application...</li>
                <li>Improved connectivity among graduates...</li>
                <li>Reliable data source for employment trends...</li>
                <li>Enhanced alumni engagement...</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl text-blue-300 font-semibold">Conclusion:</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                This project aims to modernize the traditional yearbook concept by integrating...
              </p>
            </div>
          </div>

          
        
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-80 py-3 z-40 animate-pop-up">
        <p className="text-center text-sm text-white opacity-75">
          © {new Date().getFullYear()} MemoTrace. All Rights Reserved.
        </p>
      </div>

      {/* Custom Animations */}
      {/* <style>
        {`
        @keyframes popUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
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
          animation: moveBackground 15s infinite linear alternate;
        }

        @keyframes gradientMove {
          0% { transform: translateX(-50%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(-50%); }
        }
        .animate-gradient {
          animation: gradientMove 8s infinite alternate;
        }

        @keyframes float {
          0% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-10px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.6; }
        }
        .animate-float {
          animation: float 5s infinite ease-in-out;
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
        `}
      </style> */}
    </div>
  );
};

export default MemoryMapLanding;
