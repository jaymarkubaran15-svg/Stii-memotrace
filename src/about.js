import React, { useEffect } from "react";
import NavLink from "./linkbar";
import { useNavigate } from "react-router-dom";
import bg from "../src/assets/images/bg.png";
import jj from "../src/assets/images/bgadadsasd.jpg";
import merin from "../src/assets/images/merin.jpg";
import shyla from "../src/assets/images/shylha.jpg";
import rhodian from "../src/assets/images/rhodian.jpg";
import waga from "../src/assets/images/waga.png";
import jaymark from "../src/assets/images/jaymark.jpg";

const MemoryMapLanding = () => {
  const navigate = useNavigate();

  // Check if user is logged in
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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Background */}
      <div
      className="absolute inset-0 bg-cover bg-center animate-background z-0"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-500 to-transparent opacity-60 animate-gradient" />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 opacity-40 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: "6s",
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <NavLink />

     {/* Content Section */}
<main className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-center gap-10 px-6 md:px-10 lg:px-24 pt-28 pb-16 w-full mt-10">
  {/* Left - Image Section */}
  <div className="w-full md:w-1/2 flex justify-center animate-scale-in">
    <img
      src={jj}
      alt="About Us"
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl rounded-xl shadow-2xl"
    />
  </div>

  {/* Right - Text Section */}
  <div className="w-full md:w-1/2 text-white text-center md:text-left space-y-6 animate-pop-up">
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight animate-glow">
      About <span className="text-blue-400">Us</span>
    </h1>
    <p className="text-lg md:text-xl leading-relaxed text-gray-300 animate-fade-in">
      A <strong>Yearbook</strong> captures memories, but with an alumni tracer, it keeps the connection alive — turning moments into lifelong networks.
    </p>
    <p className="text-lg md:text-xl leading-relaxed text-gray-300 animate-fade-in">
      Our goal is to help institutions track graduate progress, gather alumni insights, and build a lasting network of success stories. Whether you're a student, teacher, or school administrator, we offer a smart and engaging way to celebrate the past and connect for the future.
    </p>
    <p className="text-lg md:text-xl leading-relaxed text-gray-300 animate-fade-in">
      Let your school memories live on, and let your connections grow with us.
    </p>
  </div>
</main>

          {/* Meet the Team Section */}
        <section className="w-full bg-transparent py-8 px-4 md:px-8 text-white z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 animate-pop-up">
            Meet the <span className="text-blue-700">Team</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center z-10">
            {/* Team Member 1 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-md w-48 p-3 flex flex-col items-center text-center hover:scale-105 transition duration-300">
              <img
                src={jaymark}
                alt="Marceline Anderson"
                className="w-16 h-16 object-cover rounded-full border-4 border-blue-950 mb-2"
              />
              <h3 className="text-sm font-bold text-black leading-tight">Jay Mark Ubaran </h3>
              <div className="mt-1 px-3 py-0.5 bg-red-500 text-white text-xs rounded-full">Programmer</div>
            </div>

            {/* Team Member 2 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-md w-48 p-3 flex flex-col items-center text-center hover:scale-105 transition duration-300">
              <img
                src={waga}
                alt="Samira Hadid"
                className="w-16 h-16 object-cover rounded-full border-4 border-blue-950 mb-2"
              />
              <h3 className="text-sm font-bold text-black leading-tight">Keithrick Waga</h3>
              <div className="mt-1 px-3 py-0.5 bg-orange-500 text-white text-xs rounded-full">Assistant Programmer</div>
            </div>

            {/* Team Member 3 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-md w-48 p-3 flex flex-col items-center text-center hover:scale-105 transition duration-300">
              <img
                src={shyla}
                alt="Jonathan Patterson"
                className="w-16 h-16 object-cover rounded-full border-4 border-blue-950 mb-2"
              />
              <h3 className="text-sm font-bold text-black leading-tight">Shylhamae Gulpane</h3>
              <div className="mt-1 px-3 py-0.5 bg-orange-600 text-white text-xs rounded-full">Project Manager</div>
            </div>

            {/* Team Member 4 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-md w-48 p-3 flex flex-col items-center text-center hover:scale-105 transition duration-300">
              <img
                src={merin}
                alt="Claire Robinson"
                className="w-16 h-16 object-cover rounded-full border-4 border-blue-950 mb-2"
              />
              <h3 className="text-sm font-bold text-black leading-tight">Jensenbil Merin</h3>
              <div className="mt-1 px-3 py-0.5 bg-purple-500 text-white text-xs rounded-full">System Analyst</div>
            </div>

            {/* Team Member 5 */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-md w-48 p-3 flex flex-col items-center text-center hover:scale-105 transition duration-300">
              <img
                src={rhodian}
                alt="Liam Cruz"
                className="w-16 h-16 object-cover rounded-full border-4 border-blue-950 mb-2"
              />
              <h3 className="text-sm font-bold text-black leading-tight">Rhodian Generalao</h3>
              <div className="mt-1 px-3 py-0.5 bg-green-600 text-white text-xs rounded-full">System Quality Assurance</div>
            </div>
          </div>
        </section>




      {/* Footer */}
      <footer className="relative z-10 bg-black/70 text-white text-center py-4 animate-pop-up mt-auto">
        <p className="text-sm opacity-75">
          © {new Date().getFullYear()} MemoTrace. All Rights Reserved.
        </p>
      </footer>

     
    </div>
  );
};

export default MemoryMapLanding;
