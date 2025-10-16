import React,{useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bg from "../src/assets/images/bg.png";
import Swal from 'sweetalert2';

const MemoryMapLanding = () => {
const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Swal.fire({
        title: "Missing Fields",
        text: "Make sure all fields are filled",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
  
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This is important for handling sessions
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        Swal.fire({
          title: "Login Failed",
          text: data.message,
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
  
      if (data.is_verified === 0) {
        Swal.fire({
          title: "Login Failed",
          text: "Your email is not verified. Please check your email.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
  
      // Redirect based on role
       // 🔥 Check if user has already submitted the survey
    if (data.user.role === "admin") {
      navigate("/dashboard");
    } else if (data.user.isGTSsurvey) {
      navigate("/userhome"); // Redirect to user home if survey is completed
    } else {
      navigate("/gtsform"); // Redirect to survey if not submitted
    }
  } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        title: "Login Failed",
        text: "An error occurred. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/user", {
          method: "GET",
          credentials: "include", // Include cookies
        });
  
        const data = await response.json();
  
        if (response.ok && data.user) {
          if (data.user.role === "admin") {
            navigate("/dashboard");
          } else if (data.user.isGTSsurvey) {
            navigate("/userhome"); // ✅ If survey is submitted, go to user home
          } else {
            navigate("/gtsform"); // ❌ If not, go to survey page
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
  
    checkSession();
  }, [navigate]); 
  
  

  return (
    <div    
      className="relative flex items-center justify-center h-screen w-full bg-dark-gradient px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Background Animation */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,255,0.15) 0%, rgba(0,0,0,0) 70%)" }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col md:flex-row h-auto w-full max-w-lg bg-black bg-opacity-10 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-xl shadow-white/20 border border-white/30 animate-float"
      >
        {/* Left Section (Login Form) */}
        <div className="w-full text-white flex flex-col justify-center">
          <h1 className="mb-2 text-3xl sm:text-4xl font-bold text-center animate-glow" style={{ fontFamily: 'ultra' }}>Login</h1>
          <p className="text-gray-300 mb-6 text-center text-sm sm:text-base">
            New to MemoTrace? <span className="text-green-400 cursor-pointer ml-1 hover:underline" onClick={() => navigate("/register")}>
              Sign up now
            </span>
          </p>
          <p className="text-sm flex justify-center">
            Click here to go back
            <span className="text-green-400 ml-2 cursor-pointer hover:underline" onClick={() => navigate("/")}>
              Home
            </span>
          </p>
          <div className="mb-4 animate-fade-in">
            <label className="block text-lg mb-1">Email:</label>
            <input type="email" placeholder="Enter your email" className="w-full p-3 rounded-lg text-black bg-black bg-opacity-30 backdrop-blur-md border border-white/40 focus:ring-2 focus:ring-blue-400 transition"  
            value={email}
            onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-4 animate-fade-in">
            <label className="block text-lg mb-1">Password:</label>
            <input type="password" placeholder="Enter your password" className="w-full p-3 rounded-lg text-black bg-black bg-opacity-30 backdrop-blur-md border border-white/40 focus:ring-2 focus:ring-blue-400 transition"  
            value={password}
            onChange={(e) => setPassword(e.target.value)} />
          </div>
          <p className="text-blue-400 text-sm sm:text-lg cursor-pointer mb-4 text-center hover:underline" onClick={() => navigate("/Forgotpassword")}>
            Forgot password?
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white text-lg w-full shadow-lg transition transform hover:scale-105 hover:shadow-blue-400/50"
            onClick={handleLogin}
          >
            Login
          </motion.button>
        </div>
      </motion.div>

      {/* Tailwind CSS Keyframe Animations */}
      <style>
        {`
          @keyframes animatedBackground {
            0% { background: linear-gradient(45deg, #1e3a8a, #2563eb, #1e40af); }
            50% { background: linear-gradient(45deg, #2563eb, #1e40af, #1e3a8a); }
            100% { background: linear-gradient(45deg, #1e3a8a, #2563eb, #1e40af); }
          }
          .bg-dark-gradient {
            animation: animatedBackground 8s infinite alternate;
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
            animation: fadeIn 1.5s ease-in-out;
          }

          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }
          .animate-float {
            animation: float 4s infinite ease-in-out;
          }
            @keyframes animatedBackground {
           0% { background: linear-gradient(45deg, #0a1f44, #102a67, #0c2b55); }
           50% { background: linear-gradient(45deg, #102a67, #0c2b55, #0a1f44); }
           100% { background: linear-gradient(45deg, #0a1f44, #102a67, #0c2b55); }
          }
          .bg-dark-gradient {
          animation: animatedBackground 8s infinite alternate;
          }

        `}
      </style>
    </div>
  );
};

export default MemoryMapLanding;


