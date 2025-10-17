import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../src/assets/images/bg.png";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const MemoryMapSignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const navigate = useNavigate();
const [loading, setLoading] = useState(false);

  const startCooldown = () => {
    setCooldown(60);
    setIsCooldownActive(true);
  };

  useEffect(() => {
    let timer;
    if (isCooldownActive) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCooldownActive]);

  const sendCodeToEmail = async (email) => {
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to send code");
      console.log("Code sent to:", email);
    } catch (error) {
      console.error("Error sending code:", error);
      setError("Failed to send verification code. Please try again.");
    }
  };

  const handleSearchEmail = async () => {
    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/users");
      const users = await response.json();
      const matchedUser = users.find(
        (u) => u.email?.toLowerCase() === formData.email.toLowerCase()
      );

      if (!matchedUser) {
        setError("No account found with that email.");
        setLoading(false);
        return;
      }

      // Send code and go to verification step
      await sendCodeToEmail(formData.email);
      startCooldown();
      setError("");
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again later.");
    }finally {
    setLoading(false);
  }
  };

  const handleVerifyClick = async () => {
      setLoading(true);
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: userCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Verification failed");
        return;
      }

      setError("");
      setStep(4);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong. Please try again.");
    }finally {
    setLoading(false);
  }
  };

  const handlePasswordReset = async () => {
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Passwords do not match.",
      });
      return;
    }
  setLoading(true);
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.message || "Password update failed.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your password has been updated.",
        confirmButtonColor: "#3085d6",
      }).then(() => navigate("/login"));
    } catch (err) {
      console.error("Reset error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again later.",
      });
    }finally {
    setLoading(false);
  }
  };

  return (
    <div
      className="flex items-center justify-center h-screen w-screen bg-cover bg-center bg-no-repeat fixed"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-8 backdrop-blur-lg bg-blue-900 bg-opacity-30 border border-blue-300 rounded-lg text-white w-2/4 shadow-lg flex flex-col items-center"
      >
        <motion.h1
          className="text-4xl font-bold text-white text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {step === 1
            ? "Forgot Password"
            : step === 3
            ? "Verify Your Email"
            : "Reset Password"}
        </motion.h1>

        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <p className="text-sm mt-2 text-center">Enter your registered email address.</p>
            <div className="mt-4 w-full">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 mt-1 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
           <button
              disabled={loading}
              className={`w-full mt-6 px-4 py-2 rounded-lg text-white shadow-md ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={handleSearchEmail}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>

            <button
              className="w-full mt-3 bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
              onClick={() => navigate("/login")}
            >
              Cancel
            </button>
          </>
        )}

        {/* Step 3: Verify Code */}
        {step === 3 && (
          <>
            <p className="text-sm mt-2 text-center">
              Enter the verification code sent to {formData.email}.
            </p>
            <div className="mt-4 w-full">
              <input
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full px-4 py-2 mt-1 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the code"
              />
            </div>

             <button
                disabled={loading}
                className={`w-full mt-3 px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleVerifyClick}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

            <button
              disabled={isCooldownActive}
              onClick={() => {
                sendCodeToEmail(formData.email);
                startCooldown();
              }}
              className={`w-full mt-6 px-4 py-2 rounded-lg text-white shadow-md transition-transform transform hover:scale-105 ${
                isCooldownActive
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isCooldownActive ? `Resend code ${cooldown}s` : "Resend Code"}
            </button>
          </>
        )}

        {/* Step 4: Reset Password */}
        {step === 4 && (
          <>
            <p className="text-sm text-center mt-2">
              Now you can proceed to set your new password.
            </p>

            <div className="mt-4 w-full">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 mt-1 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>
            <div className="mt-4 w-full">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 mt-1 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
              />
            </div>

            <button
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
              onClick={handlePasswordReset}
            >
              Reset Password
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MemoryMapSignUp;
