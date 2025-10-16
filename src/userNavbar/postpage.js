import React, { useState, useRef, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaChevronLeft, FaChevronRight, FaTimes,FaPaperPlane, FaEllipsisV  } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Link, useParams } from "react-router-dom";

// Utility: makes links clickable in post content
const makeLinksClickable = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
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

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState([]); // 🖼️ for modal images
  const [currentIndex, setCurrentIndex] = useState(0); // current index in modal
    const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
   const [activeMsgMenu, setActiveMsgMenu] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const { id } = useParams();

  const navigate = useNavigate();

const currentUser = user;

const handleMessageClick = async (post) => {
  const userToChat = {
    
    id: post.user_id,
    name: `${post.username || "Unknown"} ${post.lastname || ""}`,
    profile_image: post.profile_image,
  };
  setSelectedUser(userToChat);

  // Fetch chat history
  try {
    const res = await fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/${userToChat.id}`);
    const data = await res.json();
    setMessages(
      data.map((m) => ({
        id: m.id,
        sender: m.sender_id === currentUser.id ? "me" : "them",
        text: m.message,
        created_at: m.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    setMessages([]);
  }
};


 // Unsend message
  const handleUnsendMessage = async (id) => {
  try {
    const res = await fetch(`https://server-1-gjvd.onrender.com/api/messages/${id}`, { method: "DELETE" });
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


 const handleSend = async () => {
  if (!input.trim()) return;

  const newMessage = { sender: "me", text: input };
  setMessages([...messages, newMessage]);
  const messageText = input;
  setInput("");

  // Save to database
  try {
    await fetch("https://server-1-gjvd.onrender.com/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: messageText,
      }),
    });
  } catch (err) {
    console.error("Failed to save message", err);
  }
};


  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Fetch user session
  const checkSession = async () => {
    try {
      const res = await fetch("https://server-1-gjvd.onrender.com/api/session", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUser(data.user);
      else navigate("/login");
    } catch (err) {
      console.error("Session check failed:", err);
    }
  };

  // 🔹 Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await fetch("https://server-1-gjvd.onrender.com/api/posts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
           const sortedPosts = data.sort(
        (b, a) => new Date(a.date_posted) - new Date(b.date_posted)
      );
      setPosts(sortedPosts);

      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // 🔹 Delete post
  const deletePost = async (postId) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      const res = await fetch(`https://server-1-gjvd.onrender.com/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        Swal.fire("Deleted!", "Your post has been removed.", "success");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // 🔹 Edit post
  const editPost = async (postId) => {
    try {
      const res = await fetch(`https://server-1-gjvd.onrender.com/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, content: editedContent } : p
          )
        );
        setEditingPost(null);
        Swal.fire("Updated!", "Your post has been edited.", "success");
      }
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  // 🔹 Load data
  useEffect(() => {
    const load = async () => {
      await checkSession();
      await fetchPosts();
      setLoading(false);
    };
    load();
  }, []);

  // 🔹 Close dropdown on outside click
  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest(".dropdown-menu")) setMenuOpen(null);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);
  // Prevent background scroll when chat modal is open
useEffect(() => {
  if (selectedUser) {
    document.body.style.overflow = "hidden"; // disable scroll
  } else {
    document.body.style.overflow = "auto"; // enable scroll again
  }

  // cleanup just in case
  return () => {
    document.body.style.overflow = "auto";
  };
}, [selectedUser]);


  // 🖼️ Image preview modal
  const openImagePreview = (images, index) => {
    setPreviewImages(images);
    setCurrentIndex(index);
  };

  const closePreview = () => {
    setPreviewImages([]);
    setCurrentIndex(0);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % previewImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">Loading posts...</p>;

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="space-y-6 mb-24">
        {posts.length === 0 ? (
          <p className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            No posts yet
          </p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow-md">
              {/* 🔹 Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* 🔹 Profile + Name (Clickable Link) */}
                  <Link
                    to={user?.id === post.user_id ? "/userprofile" : `/profiles/${post.user_id}`}
                    className="flex items-center space-x-3"
                  >
                    {post.profile_image ? (
                      <img
                        src={post.profile_image}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                        {post.username?.charAt(0) || "U"}
                      </div>
                    )}

                    {/* 🔹 Name + Timestamp vertically aligned */}
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-gray-800">
                        {post.username || "Unknown User"} {post.lastname}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(post.date_posted).toLocaleString()}
                      </p>
                      {post.location && (
                        <p className="text-sm text-gray-500">
                          📍 {post.location.name}
                        </p>
                      )}

                    </div>
                  </Link>

                  {/* 🔹 Message Button */}
                  <div className="ml-3">
                    {user?.id !== post.user_id && (
                      <button
                        onClick={() => handleMessageClick(post)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Message
                      </button>
                    )}
                  </div>
                </div>


                {/* 🔹 Dropdown */}
                {user?.id === post.user_id && (
                  <div className="relative dropdown-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === post.id ? null : post.id);
                      }}
                    >
                      <BsThreeDotsVertical className="text-gray-600 hover:text-gray-800" />
                    </button>

                    {menuOpen === post.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditedContent(post.content);
                            setMenuOpen(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* 🔹 Content */}
              {editingPost === post.id ? (
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => editPost(post.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                  {makeLinksClickable(post.content)}
                </p>
              )}

              {/* 🔹 Images */}
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
                      onClick={() => openImagePreview(post.images, idx)}
                    />
                  ))}
                </div>
              )}
                    {/* Chat Modal */}
{selectedUser && (
  <div className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-5 z-50">
    <div className="bg-white w-full h-full md:w-3/5 md:h-[80vh] lg:w-1/2 rounded-t-lg md:rounded-lg shadow-2xl flex flex-col">

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
        <Link
          to={user?.id === post.user_id ? "/userprofile" : `/profiles/${post.user_id}`}
          className="flex items-center space-x-3"
        >
          {/* Profile or First Letter */}
          {selectedUser.profile_image ? (
            <img
              src={selectedUser.profile_image}
              alt={selectedUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-white">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* User Name */}
          <h2 className="font-semibold text-lg text-white hover:underline">
            {selectedUser.name}
          </h2>
        </Link>
      </div>


        <FaTimes
          className="cursor-pointer hover:text-gray-200 transition"
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
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${
                msg.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Options icon — left side for sent messages */}
              {msg.sender === "me" && (
                <div className="relative flex items-center">
                  <FaEllipsisV
                    className="text-gray-400 hover:text-gray-600 cursor-pointer mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMsgMenu(activeMsgMenu === i ? null : i);
                    }}
                  />
                  {activeMsgMenu === i && (
                    <div className="absolute -left-10 top-0 bg-white border rounded shadow text-sm z-50">
                      <button
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                        onClick={() =>
                          setConfirmAction({ type: "unsend", msgId: msg.id })
                        }
                      >
                        Unsend
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`relative px-4 py-2 text-sm max-w-[70%] shadow-sm rounded-lg ${
                  msg.sender === "me"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
                {/* Timestamp */}
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
      <div className="p-3 border-t border-gray-300 flex items-center space-x-2 bg-white flex-shrink-0">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white p-2 px-3 rounded-md hover:bg-blue-700 transition"
        >
          <FaPaperPlane size={14} />
        </button>
      </div>


      {/* Unsend Confirmation Modal */}
{confirmAction?.type === "unsend" && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center animate-fadeIn">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Unsend Message</h3>
      <p className="text-gray-600 text-sm mb-6">
        Are you sure you want to unsend this message? It will be permanently deleted.
      </p>
      <div className="flex justify-around">
        <button
          onClick={() => setConfirmAction(null)}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            handleUnsendMessage(confirmAction.msgId);
            setConfirmAction(null);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
        >
          Unsend
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  </div>
)}


          </div>
          ))
        )}
      </div>

      {/* 🖼️ Preview Modal */}
      {previewImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          <button
            onClick={closePreview}
            className="absolute top-4 right-6 text-white text-3xl"
          >
            <FaTimes />
          </button>

          <div className="flex items-center justify-center relative w-full max-w-3xl">
            {previewImages.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 text-white text-3xl p-2 bg-black bg-opacity-40 rounded-full hover:bg-opacity-70"
              >
                <FaChevronLeft />
              </button>
            )}

            <img
              src={previewImages[currentIndex]}
              alt="Preview"
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-lg"
            />

            {previewImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 text-white text-3xl p-2 bg-black bg-opacity-40 rounded-full hover:bg-opacity-70"
              >
                <FaChevronRight />
              </button>
            )}
          </div>

          <p className="text-gray-300 mt-3 text-sm">
            {currentIndex + 1} / {previewImages.length}
          </p>
        </div>
      )}
    </div>
  );
}
