import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../userNavbar/nav";
import {FaBriefcase, FaMapMarkerAlt, FaMailBulk, FaGraduationCap, FaUserGraduate, FaChevronLeft,   FaEllipsisV, FaChevronRight,  FaPaperPlane, FaTimes,} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import bg from "../assets/images/bg.png";
import { FaBars } from "react-icons/fa";


export default function SocialMediaUI() {
   const [posts, setPosts] = useState([]);
const [user, setUser] = useState(null); // logged-in user
const [profileUser, setProfileUser] = useState(null); // user being viewed
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPreviewImages, setCurrentPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeMsgMenu, setActiveMsgMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { id } = useParams();

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchCurrentUser();
    if (id) {
      fetchProfileUser();
      fetchPosts();
    }
  }, [id]);

  // ✅ Logged-in user
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/session", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user); // logged-in user
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  // ✅ The profile being viewed
  const fetchProfileUser = async () => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const userData = await response.json();
      setProfileUser(userData); // viewed user's profile
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // ✅ Fetch all posts
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const sortedPosts = data.sort(
          (b, a) => new Date(a.date_posted) - new Date(b.date_posted)
        );

        const userRes = await fetch("/api/users", { credentials: "include" });
        const allUsers = userRes.ok ? await userRes.json() : [];

        const merged = sortedPosts.map((post) => {
          const author = allUsers.find(
            (u) => Number(u.id) === Number(post.user_id)
          );
          return {
            ...post,
            first_name: author?.first_name || "",
            last_name: author?.last_name || "",
            profile: author?.profile || "",
          };
        });

        setPosts(merged);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const makeLinksClickable = (text) => {
    if (typeof text !== "string") return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  // ✅ Handle opening message box
  const handleMessageClick = async () => {
    if (!profileUser) return;

    const userToChat = {
      id: profileUser.id,
      name: `${profileUser.first_name || ""} ${profileUser.last_name || ""}`,
      profile_image: profileUser.profile,
    };

    setSelectedUser(userToChat);

    try {
      const res = await fetch(`/api/messages/${user.id}/${userToChat.id}`);
      const data = await res.json();

      setMessages(
        data.map((m) => ({
          id: m.id,
          sender: m.sender_id === user.id ? "me" : "them",
          text: m.message,
          created_at: m.created_at,
        }))
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    }
  };

  // ✅ Unsend message
  const handleUnsendMessage = async (id) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setActiveMsgMenu(null);
      } else {
        console.error("Unsend failed: response not OK");
      }
    } catch (err) {
      console.error("Unsend failed", err);
    }
  };

  // ✅ Send message
   const handleSend = async () => {
  if (!input.trim()) return;


  
  const newMessage = { sender: "me", text: input };
  setMessages([...messages, newMessage]);
  const messageText = input;
  setInput("");

  // Save to database
  try {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: messageText,
      }),
    });
  } catch (err) {
    console.error("Failed to save message", err);
  }
};


  return (
<div className="min-h-screen relative">
      <Navbar />

      <div className="flex flex-col gap-4 md:flex-row min-h-screen w-full bg-gray-100 relative z-10">
        {/* Background */}
        <div
          className="fixed inset-0 bg-cover bg-center opacity-40 z-0"
          style={{ backgroundImage: `url(${bg})` }}
        />
        {/* 🔹 Mobile Burger Icon */}
        <button
          className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-md shadow-lg hover:bg-blue-700 transition"
          onClick={() => setShowSidebar(true)}
        >
          <FaBars size={20} />
        </button>
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:sticky top-0 left-0 z-30 bg-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } w-3/4 max-w-xs h-full md:w-96 md:h-screen md:rounded-md md:shadow-lg`}
        >
          <aside className="p-4 bg-white h-full flex flex-col items-center shadow-lg md:mt-5 md:rounded-md">
            <button
              className="self-end md:hidden text-2xl mb-4"
              onClick={() => setShowSidebar(false)}
            >
              ✕
            </button>

            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
              {profileUser?.profile ? (
                <img
                  src={profileUser.profile}
                  alt="Profile"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowPreview(true)}
                />
              ) : (
                <div
                  className="w-full h-full bg-blue-500 flex justify-center items-center text-white text-6xl font-bold cursor-pointer"
                  onClick={() => setShowPreview(true)}
                >
                  {profileUser?.first_name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold mt-3 text-center">
              {profileUser?.first_name} {profileUser?.last_name}
            </h2>

            {/* ✅ Message Button */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleMessageClick}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Message
              </button>
            </div>

            <div className="text-sm text-gray-600 mt-5 text-center px-4">
              <p className="flex justify-start items-center mt-2">
                <FaGraduationCap className="mr-2" size={20} /> Year graduate:{" "}
                {profileUser?.year_graduate || "N/A"}
              </p>
              <p className="flex justify-start items-center mt-2">
                <FaUserGraduate className="mr-2" size={20} /> Course:{" "}
                {profileUser?.course || "N/A"}
              </p>
              <p className="flex justify-start items-center mt-2">
                <FaBriefcase className="mr-2" size={20} /> Work title:{" "}
                {profileUser?.work_title || "N/A"}
              </p>
              <div className="flex justify-start items-start mt-2">
                <FaMapMarkerAlt size={18} className="mt-1 flex-shrink-0" />
                <p className="pl-2">Lives in: {profileUser?.address || "N/A"}</p>
              </div>
              <p className="flex justify-start items-center mt-2">
                <FaMailBulk className="mr-2" size={20} /> Email:{" "}
                {profileUser?.email || "N/A"}
              </p>
            </div>
          </aside>
        </div>

        {/* Profile Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative">
              {profileUser?.profile ? (
                <img
                  src={profileUser.profile}
                  alt="Profile Preview"
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
              ) : (
                <div className="w-80 h-80 bg-blue-500 rounded-full flex justify-center items-center text-white text-[10rem] font-bold">
                  {profileUser?.first_name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ✅ Chat Window */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full h-full md:w-3/5 md:h-[70vh] lg:w-1/2 rounded-t-lg md:rounded-lg shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center space-x-3">
                  {selectedUser.profile_image ? (
                    <img
                      src={selectedUser.profile_image}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex justify-center items-center text-blue-600 font-semibold text-lg border-2 border-white">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h2 className="font-semibold text-lg">{selectedUser.name}</h2>
                </div>
                <FaTimes
                  className="cursor-pointer hover:text-gray-200"
                  onClick={() => {
                    setSelectedUser(null);
                    setMessages([]);
                  }}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-4">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "me" && (
                        <div className="relative">
                          <FaEllipsisV
                            className="text-gray-400 hover:text-gray-600 cursor-pointer mr-2"
                            onClick={() =>
                              setActiveMsgMenu(activeMsgMenu === i ? null : i)
                            }
                          />
                          {activeMsgMenu === i && (
                            <div className="absolute -left-20 top-0 bg-white border rounded shadow text-sm">
                              <button
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "unsend",
                                    msgId: msg.id,
                                  })
                                }
                              >
                                Unsend
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 text-sm rounded-lg max-w-[70%] ${
                          msg.sender === "me"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {msg.text}
                        <span className="block text-xs mt-1 opacity-70 text-right">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t flex items-center bg-white space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-md text-sm focus:ring-blue-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white p-2 px-3 rounded-md hover:bg-blue-700"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Unsend Confirmation Modal */}
        {confirmAction?.type === "unsend" && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
              <h3 className="text-lg font-semibold mb-3">Unsend Message?</h3>
              <p className="text-gray-600 text-sm mb-6">
                This will permanently delete the message.
              </p>
              <div className="flex justify-around">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUnsendMessage(confirmAction.msgId);
                    setConfirmAction(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Unsend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Posts Section */}
        <main className="flex-1 p-4 mt-4 relative">
          <div className="bg-white p-4 rounded-lg shadow mb-16 h-full">
            <h2 className="text-xl font-bold mb-4">Posts by {profileUser?.first_name}</h2>

            <div className="space-y-6">
              {(() => {
                const userPosts = posts.filter(
                  (post) => Number(post.user_id) === Number(profileUser?.id)
                );

                if (userPosts.length === 0) {
                  return (
                    <p className="text-center text-gray-500 text-lg">
                      No posts yet
                    </p>
                  );
                }

                return userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white p-6 rounded-lg shadow-md relative"
                  >
                    <div className="flex items-center">
                      {profileUser?.profile ? (
                        <img
                          src={profileUser.profile}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border-4 border-gray-200 cursor-pointer"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                          {profileUser?.first_name?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="ml-3">
                        <h2 className="font-semibold text-lg text-gray-800">
                          {profileUser?.first_name} {profileUser?.last_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {new Date(post.date_posted).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-700 whitespace-pre-wrap break-words mt-2">
                      {makeLinksClickable(post.content)}
                    </p>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div
                        className={`mt-4 grid ${
                          post.images.length === 1
                            ? "grid-cols-1"
                            : "grid-cols-2 md:grid-cols-3"
                        } gap-2`}
                      >
                       {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Post ${idx}`}
                      className="w-full h-60 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                      onClick={() => setCurrentPreviewImages(post.images, idx)}
                    />
                  ))}
                      </div>
                    )}
                  </div>
                ));
              })()}

              {/* Lightbox */}
              <AnimatePresence>
                {currentPreviewImages.length > 0 && (
                  <motion.div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setCurrentPreviewImages([])}
                  >
                    <motion.div
                      className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {currentPreviewImages.length > 1 && (
                        <button
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
                          onClick={() =>
                            setPreviewIndex(
                              previewIndex === 0
                                ? currentPreviewImages.length - 1
                                : previewIndex - 1
                            )
                          }
                        >
                          <FaChevronLeft />
                        </button>
                      )}

                      <img
                        src={currentPreviewImages[previewIndex]}
                        alt="Preview"
                        className="w-full h-auto max-h-[80vh] rounded-xl object-contain"
                      />

                      {currentPreviewImages.length > 1 && (
                        <button
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
                          onClick={() =>
                            setPreviewIndex(
                              previewIndex ===
                              currentPreviewImages.length - 1
                                ? 0
                                : previewIndex + 1
                            )
                          }
                        >
                          <FaChevronRight />
                        </button>
                      )}

                      <button
                        className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
                        onClick={() => setCurrentPreviewImages([])}
                      >
                        <FaTimes />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
