import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Loader2,
  Mail,
  Link as LinkIcon,
  Send,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";

export default function EmployerSection({ onClose }) {
  const [employerName, setEmployerName] = useState("");
  const [employerEmail, setEmployerEmail] = useState("");
  const [sendAuto, setSendAuto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [employerLink, setEmployerLink] = useState(null);
  const [inviteCount, setInviteCount] = useState(0);
  const maxInvites = 2;

  useEffect(() => {
    const fetchInviteCount = async () => {
      try {
        const res = await fetch("https://server-1-gjvd.onrender.com/api/employer-invite-count", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setInviteCount(data.count);
      } catch (err) {
        console.error("Failed to fetch invite count:", err);
      }
    };
    fetchInviteCount();
  }, []);

  const handleSendInvite = async () => {
  if (!employerName.trim() || !employerEmail.trim()) {
    Swal.fire("⚠️ Missing Fields", "Please enter employer name and email.", "warning");
    return;
  }

  setLoading(true);
  setEmployerLink(null);

  try {
    const res = await fetch("https://server-1-gjvd.onrender.com/api/sendemployerinvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        employerName,
        employerEmail,
        sendAutomatically: sendAuto,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setInviteCount((prev) => prev + 1);

      if (sendAuto) {
        // ✅ Show success, then close after OK
        Swal.fire("✅ Sent!", data.message, "success").then(() => {
          if (onClose) onClose(); // close modal
        });
      } else {
        setEmployerLink(data.inviteLink);
        Swal.fire("✅ Link Generated!", data.message, "success");
      }
    } else {
      Swal.fire("⚠️ Error", data.message, "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Error", "Something went wrong.", "error");
  } finally {
    setLoading(false);
  }
};


  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Link copied to clipboard!",
        showConfirmButton: false,
        timer: 1800,
        position: "top-end",
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire("❌ Error", "Failed to copy link.", "error");
    }
  };

  return (
    <motion.div
      className="relative bg-white items-center rounded-2xl shadow-lg p-6 border border-gray-100 max-w-md mx-auto overflow-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-indigo-600" /> Employer Feedback Invitation
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        You can send up to <strong>{maxInvites}</strong> invitations per month.{" "}
        <span className="text-indigo-600 font-medium">
          ({inviteCount}/{maxInvites} used)
        </span>
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Employer Name
      </label>
      <input
        type="text"
        value={employerName}
        onChange={(e) => setEmployerName(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
      />

      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
        Employer Email
      </label>
      <input
        type="email"
        value={employerEmail}
        onChange={(e) => setEmployerEmail(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
      />

      <div className="mt-4 flex items-center space-x-2">
        <input
          type="checkbox"
          checked={sendAuto}
          onChange={() => setSendAuto(!sendAuto)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          Send automatically via email
        </span>
      </div>

      {!sendAuto && (
        <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>
            You’ll need to manually copy and send the generated link to your
            employer.
          </span>
        </div>
      )}

      <button
        onClick={handleSendInvite}
        disabled={loading || inviteCount >= maxInvites}
        className={`mt-6 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-medium transition ${
          loading || inviteCount >= maxInvites
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Sending...
          </>
        ) : inviteCount >= maxInvites ? (
          <>Limit Reached</>
        ) : (
          <>
            <Send className="w-5 h-5" /> Send Invitation
          </>
        )}
      </button>

      {employerLink && (
        <motion.div
          className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 text-gray-700 mb-2 font-medium">
            <LinkIcon className="w-4 h-4 text-indigo-600" />
            Invitation Link
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
            <code className="text-sm text-gray-800 break-all">{employerLink}</code>
            <button
              onClick={() => handleCopyLink(employerLink)}
              className="ml-2 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Copy
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
