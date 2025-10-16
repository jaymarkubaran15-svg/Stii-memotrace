import React, { useState, useEffect, useRef } from 'react';
import {  FaMapMarkerAlt , FaTimes,FaPaperPlane, FaEllipsisV } from "react-icons/fa";
import {  useMap } from 'react-leaflet';

import { BsThreeDotsVertical } from "react-icons/bs";
import "leaflet/dist/leaflet.css"; 

import { useNavigate, useParams,Link } from "react-router-dom";
import Swal from 'sweetalert2';


const Event = () => {
    const [content, setContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);  // Store actual files
    const [searchResults, setSearchResults] = useState([]);
    const [showMap, setShowMap] = useState(false);
    const [events, setEvents] = useState([]); // Store fetched events
    const [selectedImage, setSelectedImage] = useState(null);
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);
  const navigate = useNavigate();


  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [activeMsgMenu, setActiveMsgMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { id } = useParams();
  
const currentUser = user;

    // Fetch all events when component mounts
    useEffect(() => {
        fetchEvents();
        fetchUser();
        checkSession();
    }, []);

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

    const fetchUser = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/users", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch("https://server-1-gjvd.onrender.com/api/events", {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setEvents(data.events);
            } else {
                console.error("Error fetching events:", data.error);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    // Fetch location suggestions from OpenStreetMap (Nominatim)
    useEffect(() => {
        if (searchQuery.length > 2) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`)
                .then(response => response.json())
                .then(data => setSearchResults(data))
                .catch(error => console.error("Error fetching locations:", error));
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    // Component to update map view when location changes
    const ChangeMapView = ({ coords }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(coords, 15);
        }, [coords, map]);
        return null;
    };

    const handleLocationSelect = (place) => {
        const newLocation = {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            name: place.display_name
        };
        setLocation(newLocation);
        setSearchQuery(place.display_name);
        setSearchResults([]);
        setShowMap(true); // Show the map when a location is selected
    };

    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files);
      setImageFiles(prevImages => [...prevImages, ...files]); // Store actual files
  };

  const handlePost = async () => {
    if (!content.trim() || !location) {
      Swal.fire("Warning", "Please provide content and select a location.", "warning");
      return;
    }
  
    const formData = new FormData();
    formData.append("content", content);
    formData.append("location_name", location.name);
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lng);
  
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
  
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/events", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      const data = await response.json();
      if (data.success) {
        Swal.fire("Success!", "Event posted successfully.", "success");
  
        // Reset form
        setContent("");
        setSearchQuery("");
        setLocation(null);
        setImageFiles([]);
        setShowMap(false);
      } else {
        Swal.fire("Error!", data.error || "Failed to post event.", "error");
      }
    } catch (error) {
      Swal.fire("Error!", "Failed to post event.", "error");
    }
  };
  

const handleDelete = async (eventId) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`https://server-1-gjvd.onrender.com/api/events/${eventId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await response.json();
        if (data.success) {
          Swal.fire("Deleted!", "Your event has been deleted.", "success");
          fetchEvents(); // Refresh events after deletion
        } else {
          Swal.fire("Error!", data.error || "Failed to delete event.", "error");
        }
      } catch (error) {
        Swal.fire("Error!", "Failed to delete event.", "error");
      }
    }
  });
};


const handleMessageClick = async (event) => {
  const userToChat = {
    
    id: event.user_id,
    name: `${event.first_name || "Unknown"} ${event.last_name || ""}`,
    profile_image: event.profile,
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


    return (
        <div>

            {/* Display Events Section */}
            <div className="space-y-6">
                <h2 className="font-bold mt-3 text-lg">Recent Events</h2>
                {events.length === 0 ? (
                    <p>No events found.</p>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="border rounded-lg p-4 shadow-sm bg-white z-10 relative">
                          <div className="flex items-center justify-between" >
                          <div
  className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer"
  onClick={() => {
    if (user?.id === event.user_id) {
      navigate("/userprofile"); // your own profile
    } else {
      navigate(`/profiles/${event.user_id}`); // another user's public profile
    }
  }}
>
  {/* Profile + Name */}
  <div className="flex items-center space-x-3">
    {event.profile ? (
      <img
        src={event.profile}
        alt="Profile"
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200"
      />
    ) : (
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold text-lg">
        {event.first_name?.charAt(0) || "?"}
      </div>
    )}

    <div>
      <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
        {event.first_name || "Unknown User"}
      </h2>
      <p className="text-xs sm:text-sm text-gray-500">
        {new Date(event.created_at).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  </div>

  {/* 🔹 Message Button */}
  {user?.id !== event.user_id && (
    <button
      onClick={(e) => {
        e.stopPropagation(); // prevent parent click navigation
        handleMessageClick(event);
      }}
      className="
        bg-blue-600 text-white 
        px-3 py-1.5 
        text-xs sm:text-sm 
        rounded-md 
        hover:bg-blue-700 
        active:scale-95 
        transition
      "
    >
      Message
    </button>
  )}
</div>


{/* chat modal */}
{selectedUser && (
  <div className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-5 z-50">
    <div className="bg-white w-full h-full md:w-3/5 md:h-[70vh] lg:w-1/2 rounded-t-lg md:rounded-lg shadow-2xl flex flex-col">

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
        <Link
          to={user?.id === event.user_id ? "/userprofile" : `/profiles/${event.user_id}`}
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
      <div className="  mb-[5.5rem] sm:mb-0 p-3 border-t border-gray-300 flex items-center space-x-2 bg-white flex-shrink-0">
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





        {/* Dropdown Menu for Edit/Delete */}
            {user?.id === event.user_id && (
              <div className="relative">
                <button onClick={() => setMenuOpen(menuOpen === event.id ? null : event.id)}>
                  <BsThreeDotsVertical className="text-gray-600 hover:text-gray-800 cursor-pointer" />
                </button>

                {menuOpen === event.id && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                    <button
                            onClick={() => handleDelete(event.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            Delete
                        </button>
                  </div>
                )}
              </div>
            )}
            </div>

            
                        {/* this is the post conts  */}
                            <p className='mt-3'>{event.content}</p>
                            {event.location_name && (
                                      <p className="text-gray-600 mt-3">
                                          <FaMapMarkerAlt className="inline-block text-red-500 mr-1" />
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_name)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline"
                                        >
                                          {event.location_name}
                                        </a>
                                      </p>
                                    )}
                                      
                            {/* Display event images */}
                            {event.images && JSON.parse(event.images).length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {JSON.parse(event.images).map((image, index) => (
                  <img
                    key={index}
                    src={`${image}`}
                    alt="Event"
                    className="rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(`${image}`)}
                  />
                ))}
              </div>
            )}
                 </div>
                    ))
                )}
                 {/* Image Preview Modal */}
                 {selectedImage && (
                    <div
                      className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-75 flex justify-center items-center z-50"
                      onClick={() => setSelectedImage(null)}
                    >
                      <img
                        src={selectedImage}
                        alt="Expanded Event"
                        className="max-w-full max-h-full rounded-lg shadow-lg"
                      />
                    </div>
                  )}

            </div>
        </div>
    );
};

export default Event;
