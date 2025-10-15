import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import Navbar from "../userNavbar/nav";
import Event from "../userNavbar/userevent";
import Swal from 'sweetalert2';
import {useNavigate} from "react-router-dom";
import bg from "../assets/images/bg.png";

import ChatApp from "./ChatApp";
import { FaComments } from "react-icons/fa";
import CreatePost from "./CreatePost";
import PostsPage from "./postpage";
import Gallery from "./Gallery"; 

export default function Post({ onSearch }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [user, setUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open
  const [showPostSection, setShowPostSection] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  const [showGallery, setShowGallery] = useState(false); // new state
  

  const handleClick = () => {
    if (inputValue.trim()) {
      navigate(`/usersearchresult?query=${encodeURIComponent(inputValue)}`);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user", { credentials: "include" });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts", { credentials: "include" });
      if (response.ok) {
        const postData = await response.json();
        console.log("Posts:", postData);
        setPosts(postData);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;
  
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost }),
        credentials: "include",
      });
  
      if (response.ok) {
        const newPostData = await response.json();
        setPosts([newPostData, ...posts]);
        setNewPost("");


        Swal.fire({
          icon: "success",
          title: "Post Created!",
          text: "Your post has been successfully added.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong. Please try again.",
      });
    }
  };
  
  

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
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
  
      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
  
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Your post has been removed.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Unable to delete the post.",
      });
    }
  };
  

  const editPost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
        credentials: "include",
      });
  
      if (response.ok) {
        setPosts(posts.map((post) => (post.id === postId ? { ...post, content: editedContent } : post)));
        setEditingPost(null);
        setMenuOpen(null); // Close menu after edit
  
        Swal.fire({
          icon: "success",
          title: "Post Updated!",
          text: "Your post has been successfully updated.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong while updating the post.",
      });
    }
  };
  

  const makeLinksClickable = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\S+@\S+\.\S+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part && part.match(urlRegex)) {
        // If the part matches the URL pattern, make it clickable
        const href = part.startsWith("www.") ? `http://${part}` : part;
        return (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {part}
          </a>
        );
      }
      return part;
    });
  };
  

  return (
    <div className="relative h-screen overflow-hidden">
  {/* Background Overlay */}
  <div 
    className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
    style={{ backgroundImage: `url(${bg})` }}
  />

  {/* Navbar */}
  <Navbar />

  {/* Main Content Area */}
  <div className="relative grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 p-4 h-[calc(100vh-4rem)]"> 
    {/* Adjust height (subtract navbar height ~4rem) */}

    {/* COLUMN 1 (Scrollable Section) */}
    <div className="flex flex-col h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 sticky top-0 backdrop-blur-md z-10 p-2 rounded-md shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {showPostSection ? "Community" : "Community"}
        </h1>

        {/* Search Section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-2 rounded-lg shadow-md w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="outline-none bg-transparent w-full sm:w-auto"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClick()}
            />
          </div>
          <button
            onClick={handleClick}
            className="bg-blue-500 text-white px-4 py-2 sm:py-1 mt-2 sm:mt-0 sm:ml-2 rounded-lg"
          >
            Search
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 items-center mb-4">
        <button
          onClick={() => setShowPostSection(true)}
          className={`px-4 py-2 font-bold rounded-lg ${
            showPostSection
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Post
        </button>
        <button
          onClick={() => setShowPostSection(false)}
          className={`px-4 py-2 font-bold rounded-lg ${
            !showPostSection
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Event
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1">
        {showPostSection ? (
          <>
            <CreatePost />
            <div className="flex justify-center my-4">
              <button
                className="w-10/12 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                onClick={() => setShowGallery((prev) => !prev)}
              >
                {showGallery ? "Back to Posts" : "Photo Gallery"}
              </button>
            </div>
            {showGallery ? <Gallery /> : <PostsPage />}
          </>
        ) : (
          <Event />
        )}
      </div>
    </div>

    {/* COLUMN 2 (Non-scrollable, fixed chat area) */}
    <div className="hidden md:flex flex-col h-full overflow-hidden">
      <ChatApp />
    </div>
  </div>
{/* Mobile Chat Floating Button */}
<div className="fixed bottom-6 right-6 md:hidden z-50">
  <button
    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg mb-28"
    onClick={() => setIsChatOpen(true)}
  >
    <FaComments className="text-2xl" />
  </button>

  {/* Mobile Chat Modal */}
  {isChatOpen && (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      <div className="bg-[#242526] w-full h-2/3 rounded-t-xl p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold">Chat</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsChatOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatApp />
        </div>
      </div>
    </div>
  )}
  </div>

</div>

  );
}
