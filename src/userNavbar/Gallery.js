import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Gallery = () => {
  const [posts, setPosts] = useState([]); // grouped posts
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentUploaderImages, setCurrentUploaderImages] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        // 🧩 Group posts with same uploader + content
        const grouped = [];
        data.forEach((post) => {
          if (!Array.isArray(post.images) || post.images.length === 0) return;

          const uploader = post.username || "Unknown";
          const content = post.content || "Untitled";
          const profile = post.profile_image;
          const validImages = post.images.filter((img) => img && img.trim() !== "");

          const existing = grouped.find(
            (g) => g.uploader === uploader && g.title === content
          );

          if (existing) existing.images.push(...validImages);
          else
            grouped.push({
              id: post.id,
              title: content,
              uploader,
              profile,
              images: validImages,
            });
        });

        setPosts(grouped);
      } catch (err) {
        console.error("Error fetching gallery posts:", err);
      }
    };

    fetchPosts();
  }, []);

  // 🔍 Filter
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // Lightbox
 const openLightbox = (post, index = 0) => {
  const imagesWithInfo = post.images.map((img) => ({
    url: img,
    uploader: post.uploader,
    content: post.title,
  }));
  setCurrentUploaderImages(imagesWithInfo);
  setSelectedImageIndex(index);
};

  const closeLightbox = () => {
    setCurrentUploaderImages([]);
    setSelectedImageIndex(0);
  };
  const nextImage = () =>
    setSelectedImageIndex((i) =>
      i === currentUploaderImages.length - 1 ? 0 : i + 1
    );
  const prevImage = () =>
    setSelectedImageIndex((i) =>
      i === 0 ? currentUploaderImages.length - 1 : i - 1
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {/* Search */}
      <div className="relative w-full max-w-3xl mb-8">
        <input
          type="text"
          placeholder="Search images..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

{/* Image Groups */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
  {filteredPosts.length > 0 ? (
    filteredPosts.map((post) => (
      <motion.div
        key={post.id}
        whileHover={{ scale: 1.03 }}
        className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group"
        onClick={() => openLightbox(post, 0)}
      >
        {/* Post Image */}
        {post.images[0] ? (
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* Post Info */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            {/* Profile Image or Initial */}
          {post.profile && post.profile.trim() !== "" ? (
              <img
                src={post.profile}
                alt={post.uploader || "user"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {post.uploader?.charAt(0).toUpperCase() || "U"}
              </div>
            )}


            {/* Uploader Name and Post Title */}
            <div>
              <div className="font-semibold text-gray-800">{post.uploader}</div>
              <div className="text-sm text-gray-500 truncate">{post.title}</div>
            </div>
          </div>

          {/* Multiple Images Indicator */}
          {post.images.length > 1 && (
            <div className="text-xs text-gray-400 mt-1">
              {post.images.length} images
            </div>
          )}
        </div>
      </motion.div>
    ))
  ) : (
    <p className="text-gray-500 text-sm text-center col-span-full mt-10">
      No image posts found.
    </p>
  )}
</div>


      {/* Lightbox */}
      <AnimatePresence>
        {currentUploaderImages.length > 0 && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {currentUploaderImages.length > 1 && (
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
                  onClick={prevImage}
                >
                  <FaChevronLeft />
                </button>
              )}

             <img
                src={currentUploaderImages[selectedImageIndex]?.url}
                alt="gallery"
                className="w-full h-auto max-h-[80vh] rounded-xl object-contain"
              />
              {currentUploaderImages.length > 1 && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
                  onClick={nextImage}
                >
                  <FaChevronRight />
                </button>
              )}

              
              <div className="absolute bottom-4 left-4 text-white bg-black/50 p-3 rounded-lg backdrop-blur-sm">
                <div className="text-sm">
                  {selectedImageIndex + 1} of {currentUploaderImages.length}
                </div>
                <div className="font-semibold text-white">
                  {currentUploaderImages[selectedImageIndex]?.uploader}
                </div>
                <div className="text-sm text-gray-200 truncate max-w-[200px]">
                  {currentUploaderImages[selectedImageIndex]?.content || "No description"}
                </div>
              </div>


              <button
                className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
                onClick={closeLightbox}
              >
                <FaTimes />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
