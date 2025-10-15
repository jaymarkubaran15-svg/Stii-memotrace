import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUserCircle, FaUpload } from "react-icons/fa";

const PostModal = ({ isOpen, onClose, onPost }) => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setImages([...images, ...urls]);
  };

  const handleSubmit = () => {
    if (text.trim() === "" && images.length === 0) return;
    onPost({ text, images });
    setText("");
    setImages([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 text-white rounded-2xl p-6 w-full max-w-md relative shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Post</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-lg"
              >
                <FaTimes />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
              <FaUserCircle className="text-4xl text-gray-400" />
              <div>
                <p className="font-semibold">Jay Mark</p>
                <span className="text-sm text-gray-400">
                  📍 Buug, Zamboanga Sibugay
                </span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              className="w-full bg-gray-800 p-3 rounded-xl resize-none focus:outline-none mb-3"
              placeholder="What's on your mind, Jay?"
              rows="4"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Upload Images */}
            <label className="cursor-pointer flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl w-fit mb-3">
              <FaUpload /> Add Photo/Video
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>

            {/* Preview Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="preview"
                    className="rounded-xl object-cover h-24 w-full"
                  />
                ))}
              </div>
            )}

            {/* Post Button */}
            <button
              onClick={handleSubmit}
              className="bg-blue-600 w-full py-2 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Post
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostModal;
