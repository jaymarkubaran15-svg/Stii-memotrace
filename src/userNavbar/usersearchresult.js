import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaMapMarkerAlt,FaPaperPlane, FaEllipsisV, FaTimes,FaChevronLeft, FaChevronRight,  } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import Swal from "sweetalert2";
import Navbar from "../userNavbar/nav";
import { useLocation, useNavigate } from "react-router-dom";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import bg from "../assets/images/bg.png";
import { Link, useParams } from "react-router-dom";

const Result = () => {
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
   const [userSession, setUserSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [activeMsgMenu, setActiveMsgMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
const [previewImages, setPreviewImages] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);
  
const currentUser = userSession;


// Open preview modal
const openPreview = (images, index) => {
  setPreviewImages(images);
  setCurrentIndex(index);
};

// Close modal
const closePreview = () => {
  setPreviewImages([]);
  setCurrentIndex(0);
};

// Navigate to next image
const nextImage = () => {
  setCurrentIndex((prev) => (prev + 1) % previewImages.length);
};

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// Navigate to previous image
const prevImage = () => {
  setCurrentIndex((prev) =>
    prev === 0 ? previewImages.length - 1 : prev - 1
  );
};

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const passedQuery = queryParams.get("query") || "";
    setSearchQuery(passedQuery);

    fetchUser();
    fetchPosts();
    fetchEvents();
  }, []);

    useEffect(() => {
      const load = async () => {
        await checkSession();
      };
      load();
    }, []);
   // 🔹 Fetch user session
  const checkSession = async () => {
    try {
      const res = await fetch("/api/session", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUserSession(data.user);
      else navigate("/login");
    } catch (err) {
      console.error("Session check failed:", err);
    }
  };

  // 🧍 Fetch Logged-in User
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // 📰 Fetch Posts
  const fetchPosts = async () => {
  try {
    const response = await fetch("/api/posts", { credentials: "include" });
    if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);

    const postData = await response.json();

    const mappedPosts = postData.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      first_name: post.username,
      last_name: post.lastname,
      profile: post.profile_image
        ? post.profile_image.startsWith("http")
          ? post.profile_image
          : post.profile_image.startsWith("/")
          ? post.profile_image
          : `/${post.profile_image}`
        : null,
      content: post.content,
      date_posted: post.date_posted,
      images: post.images || [],
      location_name: post.location?.name || null,
      latitude: post.location?.lat || null,
      longitude: post.location?.lon || null,
      type: "job",
    }));

    setPosts(mappedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};

  // 🎟️ Fetch Events
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.events || []).map((event) => ({
          ...event,
          type: "event",
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  // 🔍 Search Filtering
  const searchItems = (items) => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) =>
        i.content?.toLowerCase().includes(q) ||
        i.location_name?.toLowerCase().includes(q) ||
        `${i.first_name || ""} ${i.last_name || ""}`.toLowerCase().includes(q)
    );
  };

  const filteredPosts = searchItems(posts);
  const filteredEvents = searchItems(events);

  const displayData =
    filter === "job"
      ? filteredPosts
      : filter === "event"
      ? filteredEvents
      : [...filteredPosts, ...filteredEvents];

  // 🗑️ Delete Post or Event
  const deletePost = async (id, type) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const endpoint = type === "job" ? `/api/posts/${id}` : `/api/events/${id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      if (type === "job") setPosts((p) => p.filter((post) => post.id !== id));
      else setEvents((e) => e.filter((event) => event.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting:", err);
      Swal.fire("Error", "Could not delete the item.", "error");
    }
  };

  // ✏️ Edit Post
  const editPost = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
        credentials: "include",
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, content: editedContent } : p))
        );
        setEditingPost(null);
        setMenuOpen(null);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Edit error:", err);
      Swal.fire("Error", "Unable to update post.", "error");
    }
  };

  // 🔗 Make URLs clickable in content
  const makeLinksClickable = (text) => {
  if (!text) return null; // prevent splitting null or undefined

  const regex = /(https?:\/\/[^\s]+|www\.[^\s]+|\S+@\S+\.\S+)/g;
  return text.split(regex).map((part, i) => {
    if (regex.test(part)) {
      const href = part.startsWith("www.") ? `http://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};




const handleMessageClick = async (item) => {
  const userToChat = {
    id: item.user_id,
    name: `${item.first_name || "Unknown"} ${item.last_name || ""}`,
    profile: item.profile,
  };
  setSelectedUser(userToChat);

  // Fetch chat history
  try {
    const res = await fetch(`/api/messages/${currentUser.id}/${userToChat.id}`);
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
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: messageText,
      }),
    });
  } catch (err) {
    console.error("Failed to save message", err);
  }
};


  return (
    <div>
      <Navbar />
      <div className="flex">
      <div className="flex-1 p-4 md:p-10 bg-gray-50 min-h-screen relative">

          {/* Background */}
          <div
            className="fixed inset-0 bg-cover bg-center opacity-40 z-0"
            style={{ backgroundImage: `url(${bg})` }}
          />

          <div className="w-full md:w-9/12 mx-auto z-10 relative">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
              Search Results
            </h1>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-lg shadow-md mb-6 border border-gray-300">
              <div className="flex items-center flex-1">
                <FaSearch className="text-gray-600 mr-3" size={18} />
                <input
                  type="text"
                  placeholder="Search by content, location, or user..."
                  className="w-full outline-none bg-transparent text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label htmlFor="filter" className="font-semibold text-sm sm:text-base">
                Filter By:
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="p-2 border rounded-md bg-white shadow-sm cursor-pointer hover:bg-gray-100 text-sm sm:text-base"
              >
                <option value="all">All</option>
                <option value="job">Jobs</option>
                <option value="event">Events</option>
              </select>
            </div>


            {/* Display Results */}
            {displayData.length > 0 ? (
              displayData.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6 hover:shadow-lg transition"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Profile + Name + Timestamp */}
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() =>
                            navigate(
                              user?.id === item.user_id
                                ? "/userprofile"
                                : `/profiles/${item.user_id}`
                            )
                          }
                        >
                          {/* Profile Picture */}
                          {item.profile ? (
                            <img
                              src={item.profile}
                              alt="Profile"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40?text=?";
                              }}
                              className="w-11 h-11 rounded-full border border-gray-300 object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold text-lg">
                              {item.first_name?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}

                          {/* Name + Timestamp + Message */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h2 className="font-semibold text-gray-800 text-lg">
                                {item.first_name} {item.last_name}
                              </h2>

                              {/* 💬 Message Button */}
                              {user && user.id !== item.user_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent navigating to profile
                                    handleMessageClick(item);
                                  }}
                                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition"
                                >
                                  Message
                                </button>
                              )}
                            </div>

                            {/* 🕒 Timestamp */}
                            {item.date_posted && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(item.date_posted).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

               
                    {/* Menu */}
                    {user?.id === item.user_id && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === item.id ? null : item.id)
                          }
                        >
                          <BsThreeDotsVertical className="text-gray-600 cursor-pointer" />
                        </button>

                        {menuOpen === item.id && (
                          <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-20">
                            {item.type === "job" && (
                              <button
                                onClick={() => {
                                  setEditingPost(item.id);
                                  setEditedContent(item.content);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => deletePost(item.id, item.type)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

 {/* Chat Modal */}
{selectedUser && (
  <div className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-5 z-50">
   <div className="bg-white w-full h-full sm:w-[90%] md:w-3/5 md:h-[70vh] lg:w-1/2 rounded-t-lg md:rounded-lg shadow-2xl flex flex-col">


      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
        <Link
          to={userSession?.id === item.user_id ? "/userprofile" : `/profiles/${selectedUser.id}`}
          className="flex items-center space-x-3"
        >
          {/* Profile or First Letter */}
          {selectedUser.profile ? (
            <img
              src={selectedUser.profile}
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
      <div
  className="
    p-2 sm:p-3 
    border-t border-gray-300 
    flex items-center space-x-2 
    bg-white 
    flex-shrink-0 
    sticky bottom-0 
    z-[2000]
    mb-[5.5rem] sm:mb-0
  "
>
  <input
    type="text"
    placeholder="Type a message..."
    className="
      flex-1 
      p-2 sm:p-3 
      border border-gray-300 
      rounded-md 
      text-sm sm:text-base 
      focus:outline-none 
      focus:ring-1 
      focus:ring-blue-500
    "
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
  />
  <button
    onClick={handleSend}
    className="
      bg-blue-600 text-white 
      p-2 sm:p-3 
      rounded-md 
      hover:bg-blue-700 
      transition 
      flex items-center justify-center
    "
  >
    <FaPaperPlane size={16} />
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


                  {/* Content */}
                  {editingPost === item.id ? (
                    <div className="mt-3">
                      <textarea
                        className="w-full p-2 border rounded-lg"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => editPost(item.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 mt-3 whitespace-pre-wrap break-words">
                      {makeLinksClickable(item.content)}
                    </p>
                  )}

                  {/* Location */}
                  {item.location_name && (
                    <p className="text-gray-600 mt-4 flex items-center">
                      <FaMapMarkerAlt className="text-red-500 mr-2" />
                      {item.location_name}
                    </p>
                  )}

                  {/* 🖼️ Images (Posts & Events) */}
                      {item.images && (() => {
                        let imagesArray = [];

                        try {
                          if (Array.isArray(item.images)) {
                            imagesArray = item.images;
                          } else if (typeof item.images === "string") {
                            const parsed = JSON.parse(item.images);
                            if (Array.isArray(parsed)) {
                              imagesArray = parsed;
                            } else if (parsed) {
                              imagesArray = [parsed];
                            }
                          } else if (item.images) {
                            imagesArray = [item.images];
                          }
                        } catch (err) {
                          console.warn("Invalid image data:", item.images);
                        }

                        return imagesArray.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3">
                            {imagesArray.map((img, i) => {
                              const imageUrl = img.startsWith("http")
                                ? img
                                : img.startsWith("/")
                                ? img
                                : `/${img}`;
                              return (
                                <img
                                  key={i}
                                  src={imageUrl}
                                  alt="Post"
                                  className="rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => openPreview(imagesArray, i)}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/300?text=Image+not+found";
                                  }}
                                />
                              );
                            })}
                          </div>
                        ) : null;
                      })()}



                </div>
              ))
            ) : (
              <p className="text-gray-500">No results found.</p>
            )}

            {/* Image Zoom */}
                        
            {/* 🖼️ Preview Modal */}
            {previewImages.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
                <button
                  onClick={closePreview}
                  className="absolute top-4 right-6 text-white text-3xl"
                >
                  <FaTimes />
                </button>

               <div className="flex items-center justify-center relative w-full max-w-[90%] md:max-w-3xl">
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
            <div className="h-16 md:hidden" />

          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
