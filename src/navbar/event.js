import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import "leaflet/dist/leaflet.css";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Event = () => {
  const [events, setEvents] = useState([]);
  const [userSession, setUserSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  
  // 👇 For image preview modal
  const [previewImages, setPreviewImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    checkSession();
  }, []);

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

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events", { credentials: "include" });
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

  const handleDelete = async (eventId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This event will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await response.json();
          if (data.success) {
            Swal.fire("Deleted!", "Event has been deleted.", "success");
            fetchEvents();
          } else {
            Swal.fire("Error!", data.error || "Failed to delete event.", "error");
          }
        } catch (error) {
          Swal.fire("Error!", "Failed to delete event.", "error");
        }
      }
    });
  };

  const handleEditClick = (event) => {
    setEditingEvent(event.id);
    setEditedContent(event.content);
    setMenuOpen(null);
  };

  const handleSaveEdit = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editedContent }),
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire("Updated!", "Event updated successfully.", "success");
        setEditingEvent(null);
        fetchEvents();
      } else {
        Swal.fire("Error!", data.error || "Failed to update event.", "error");
      }
    } catch (error) {
      Swal.fire("Error!", "Failed to update event.", "error");
    }
  };

  // 🖼️ Image Preview Modal Controls
  const openPreview = (images, index) => {
    setPreviewImages(images);
    setCurrentIndex(index);
  };

  const closePreview = () => {
    setPreviewImages([]);
    setCurrentIndex(0);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      <div className="space-y-6">
        <h2 className="font-bold mt-3 text-lg">Recent Events</h2>

        {events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          events.map((event) => {
            const images = event.images ? JSON.parse(event.images).map(img => `${img}`) : [];
            return (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm bg-white relative">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {event.profile ? (
                      <img
                        src={event.profile}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-4 border-gray-200 cursor-pointer"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                        {event.first_name?.charAt(0)}
                      </div>
                    )}
                    <div className="ml-3">
                      <h2 className="font-semibold text-lg text-gray-800">
                        {event.first_name || "Unknown User"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  {userSession?.id === event.user_id && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === event.id ? null : event.id)
                        }
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <BsThreeDotsVertical size={20} />
                      </button>

                      {menuOpen === event.id && (
                        <div className="absolute right-0 mt-2 w-28 bg-white border rounded-lg shadow-lg z-50">
                          <button
                            onClick={() => handleEditClick(event)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>
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

                {/* Inline Editing */}
                {editingEvent === event.id ? (
                  <div className="mt-4">
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(event.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEvent(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                    {event.content}
                  </p>
                )}

                {/* Location */}
                {event.location_name && (
                  <p className="text-gray-600 mt-3">
                    <FaMapMarkerAlt className="inline-block text-red-500 mr-1" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        event.location_name
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {event.location_name}
                    </a>
                  </p>
                )}

                {/* Event Images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt="Event"
                        className="rounded-lg cursor-pointer object-cover"
                        onClick={() => openPreview(images, index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 🖼️ Enhanced Preview Modal */}
        {previewImages.length > 0 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50"
            onClick={closePreview}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePreview();
              }}
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
    </div>
  );
};

export default Event;
