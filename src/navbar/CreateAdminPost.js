import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkerAlt, FaImage, FaTimes } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function CreatePost() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
 const [postType, setPostType] = useState("post");
const [eventTitle, setEventTitle] = useState("");
const [eventDate, setEventDate] = useState("");
const [eventTime, setEventTime] = useState("");



  // ✅ Load user session
  useEffect(() => {
    fetch("/api/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(console.error);
  }, []);

  // 🌍 Fetch location suggestions
  useEffect(() => {
    const fetchLocations = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&addressdetails=1&limit=5`
        );
        if (!res.ok) throw new Error("Location fetch failed");
        const data = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    const delay = setTimeout(fetchLocations, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // ❌ Remove image
  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Compress and add images (limit 5)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (selectedImages.length + files.length > 5) {
      Swal.fire("Too many images", "You can only upload up to 5 images.", "warning");
      return;
    }

    const compressedFiles = [];
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        Swal.fire("File too large", `${file.name} exceeds 20MB limit.`, "error");
        continue;
      }

      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1, // Compress to around 1MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        compressedFiles.push(compressed);
      } catch (err) {
        console.error("Compression failed:", err);
        compressedFiles.push(file);
      }
    }

    setSelectedImages((prev) => [...prev, ...compressedFiles]);
  };

  // 📨 Submit post
const handlePostSubmit = async () => {
  if (!postText.trim() && selectedImages.length === 0) {
    Swal.fire("Oops!", "Write something or add an image first!", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("content", postText);
  formData.append("type", postType); // 🆕 "post" or "event"

  // ✅ Include location if available
  if (selectedLocation) {
    formData.append("location_name", selectedLocation.display_name || "");
    formData.append("lat", selectedLocation.lat);
    formData.append("lon", selectedLocation.lon);
  }

  // ✅ Include images
  selectedImages.forEach((file) => formData.append("images", file));

  // ✅ If it's an event, include event-specific details
  if (postType === "event") {
    if (eventTitle) formData.append("event_title", eventTitle);
    if (eventDate) formData.append("event_date", eventDate);
    if (eventTime) formData.append("event_time", eventTime);
  }

  try {
    setLoading(true);

    // 🆕 Choose endpoint based on post type
    const endpoint =
      postType === "event"
        ? "/api/events"
        : "/api/posts";

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to post");

    Swal.fire({
      title: postType === "event" ? "Event Posted!" : "Posted!",
      text:
        postType === "event"
          ? "Your event has been shared successfully."
          : "Your post has been uploaded successfully.",
      icon: "success",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        // Reset fields after successful post
        setIsModalOpen(false);
        setPostText("");
        setSelectedImages([]);
        setSelectedLocation(null);
        setPostType("post");
        setEventTitle("");
        setEventDate("");
        setEventTime("");

        // Refresh to show the new post/event
        window.location.reload();
      }
    });
  } catch (error) {
    console.error("Error posting data:", error);
    Swal.fire("Error", error.message, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full max-w-full mx-auto mt-6 bg-white text-black rounded-xl p-4 shadow-lg z-10">
      {/* Create Post Input */}
      <div
          className="w-full flex items-center sm:items-start bg-white p-3 sm:p-4 rounded-full sm:rounded-lg cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setIsModalOpen(true)}
        >
          {/* Profile Picture / Initial */}
          {user?.profile ? (
            <img
              src={user.profile}
              alt={user.name || "user"}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}

          {/* Greeting Text */}
          <span
            className="text-gray-600 ml-3 text-sm sm:text-base leading-snug break-words"
          >
            Hello{" "}
            <span className="font-semibold text-gray-800">
              {user?.name || "user"}
            </span>
            ,  Share the latest milestones or updates with your alumni community
          </span>
        </div>
{/* Post Modal */}
<AnimatePresence>
  {isModalOpen && (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#f3f4f5] w-full max-w-md rounded-xl shadow-lg p-4 my-8 overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 sticky top-0 bg-[#f3f4f5] z-10">
          <h2 className="text-lg font-semibold">Create post</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-black hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center mt-3 space-x-3">
          {user?.profile ? (
            <img
              src={user.profile}
              alt={user.name || "user"}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div>
            <p className="font-semibold">{user?.name || "User"}</p>
            {selectedLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>📍 {selectedLocation.display_name}</span>
                <button
                  className="text-xs text-red-500 underline"
                  onClick={() => setSelectedLocation(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Input */}
        <textarea
          className="w-full bg-transparent mt-4 text-black outline-none resize-none"
          rows="4"
          placeholder="Share the latest milestones or updates with your alumni community..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1 hover:bg-opacity-80"
                  onClick={() => removeImage(index)}
                >
                  <FaTimes className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add to Post Section */}
        <div className="mt-4 border border-gray-300 rounded-lg p-3">
          <p className="text-gray-500 mb-2 text-sm">Add to your post</p>
          <div className="flex justify-around text-2xl">
            <label>
              <FaImage className="text-green-500 cursor-pointer" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            <FaMapMarkerAlt
              className="text-red-500 cursor-pointer"
              onClick={() => setIsLocationModalOpen(true)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            You can upload up to 5 images (max 20 MB each)
          </p>
        </div>

        {/* Choose Post Type */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Choose Post Type
          </label>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full appearance-none border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all cursor-pointer"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg fill=\'%236b7280\' height=\'20\' viewBox=\'0 0 20 20\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M5.5 7l4.5 4.5L14.5 7z\'/></svg>")',
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1rem",
            }}
          >
            <option value="post">Normal Post</option>
            <option value="event">Event</option>
          </select>
        </div>

        {/* Post Button */}
        <button
          onClick={handlePostSubmit}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
        >
          {loading ? "Posting..." : postType === "event" ? "Post Event" : "Post"}
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#f3f4f5] w-full max-w-lg rounded-xl shadow-lg p-4"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
            >
              <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-3">
                <h2 className="text-lg font-semibold">Search for location</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={() => setIsLocationModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder="Where are you?"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="mt-3 max-h-56 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((loc) => (
                    <div
                      key={loc.place_id}
                      className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setIsLocationModalOpen(false);
                      }}
                    >
                      <p className="font-medium">
                        {loc.display_name?.split(",")[0] || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">{loc.display_name}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm mt-2 text-center">
                    No results found.
                  </p>
                )}
              </div>

              {selectedLocation && (
                <div className="mt-4 h-56 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[
                      parseFloat(selectedLocation.lat),
                      parseFloat(selectedLocation.lon),
                    ]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution="© OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[
                        parseFloat(selectedLocation.lat),
                        parseFloat(selectedLocation.lon),
                      ]}
                      icon={markerIcon}
                    >
                      <Popup>{selectedLocation.display_name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
