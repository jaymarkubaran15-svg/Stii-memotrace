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
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
       className="absolute inset-0 bg-cover bg-center animate-background z-0"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-500 to-transparent opacity-60 animate-gradient" />

      {/* Navbar */}
      <NavLink />

      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-bold text-white text-center mb-10 animate-pop-up">
          SERVICES
        </h1>

        <div className="flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto">
          {/* Left Column */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {[
              {
                title: "Digital Yearbook Access 🎓",
                desc:
                  "View and browse digital versions of your graduation yearbook anytime, anywhere. Flip through pages, find your class photos, and revisit memories from your school days.",
              },
              {
                title: "Alumni Tracer System 📍",
                desc:
                  "Stay connected with your batch mates and keep your alumni records updated. Track employment status and educational progress.",
              },
              {
                title: "Alumni Survey & Reports 📊",
                desc:
                  "Help us gather valuable data through alumni surveys. This supports school development and career placement tracking.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-blue-800/80 p-6 rounded-xl shadow-lg text-white animate-pop-up"
              >
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {[
              {
                title: "Job & Event Postings 🧢",
                desc:
                  "Stay updated with the latest job openings and alumni events through our interactive bulletin.",
              },
              {
                title: "Privacy and Data Security 🔒",
                desc:
                  "We comply with data protection policies to secure all alumni records and personal details.",
              },
              {
                title: "Feedback and Support 💬",
                desc:
                  "Have suggestions or issues? Reach out to our support team or submit feedback via your dashboard.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-blue-700/80 p-6 rounded-xl shadow-lg text-white animate-pop-up"
              >
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full bg-black/70 text-white text-center py-3 text-sm animate-pop-up z-10">
        © {new Date().getFullYear()} MemoTrace. All Rights Reserved.
      </footer>

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
