import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../userNavbar/nav";
import { FaBriefcase, FaMapMarkerAlt, FaMailBulk, FaGraduationCap, FaEdit, FaSignOutAlt, FaLock, FaUserGraduate  } from "react-icons/fa";
import Cropper from "react-easy-crop";
import { FaCamera } from "react-icons/fa";
import Swal from 'sweetalert2';
import { BsThreeDotsVertical } from "react-icons/bs";
import bg from "../assets/images/bg.png";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import EmployerSection from "./EmployerSection";
import EditProfile from "./EditProfile";

export default function SocialMediaUI() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({profile:"" ,name: "", middlename:"" , lastname:"", work:"", address:"", email: "" });
  const [user, setUser] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
const [showSidebar, setShowSidebar] = useState(false);
  const [currentPreviewImages, setCurrentPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

const [passwordData, setPasswordData] = useState({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

  useEffect(() => {
  fetchUser();
  fetchPosts();
}, []);

useEffect(() => {
  if (showEditProfile) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
  return () => {
    document.body.style.overflow = "auto";
  };
}, [showEditProfile]);

  const fetchUser = async () => {
  try {
    // ✅ Fetch user profile
    const response = await fetch("/api/profile", { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch user data");
    const userData = await response.json();
    setUser({ ...userData });

    // ✅ Fetch latest work experience (no need to include ID, backend uses session)
    const workRes = await fetch("/api/work/latest", { credentials: "include" });
    let latestWork = null;
    if (workRes.ok) {
      latestWork = await workRes.json();
    }

    // ✅ Fetch latest education
    const eduRes = await fetch("/api/education/latest", { credentials: "include" });
    let latestEducation = null;
    if (eduRes.ok) {
      latestEducation = await eduRes.json();
    }

    // ✅ Update editable fields
    setUpdatedUser({
      profile: userData.profile,
      name: userData.first_name || "",
      middlename: userData.middle_name || "",
      lastname: userData.last_name || "",
      work: latestWork ? latestWork.position : "No current work",
      education: latestEducation ? `${latestEducation.program_type} in ${latestEducation.field_of_study}` : "No education data",
      institution: latestEducation ? latestEducation.institution_name : "",
      address: userData.address || "",
      email: userData.email || "",
      year: userData.year_graduate || "",
    });

    // ✅ Sync latest work info with user object
    setUser((prev) => ({
      ...prev,
      work_title: latestWork ? latestWork.position : "No current work",
      company: latestWork ? latestWork.company : "",
      location: latestWork ? latestWork.location : "",
       education_title: latestEducation ? latestEducation.program_type : "",
      education_field: latestEducation ? latestEducation.field_of_study : "",
      institution: latestEducation ? latestEducation.institution_name : "",
    }));
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePasswordChange = async () => {
       if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
         return Swal.fire({ icon: "warning", title: "Missing Fields", text: "All fields are required." });
       }
     
       if (passwordData.newPassword !== passwordData.confirmNewPassword) {
         return Swal.fire({ icon: "error", title: "Mismatch", text: "New passwords do not match." });
       }
     
       try {
         const response = await fetch(`/api/users/${user.id}/change-userpassword`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           credentials: "include",
           body: JSON.stringify({
             currentPassword: passwordData.currentPassword,
             newPassword: passwordData.newPassword,
           }),
         });
     
         const result = await response.json();
         console.log("API Response:", result); // Debugging
     
         if (!response.ok) {
           if (result.code === "INVALID_PASSWORD") {
             return Swal.fire({ icon: "error", title: "Incorrect Password", text: "Current password is incorrect." });
           }
           return Swal.fire({ icon: "error", title: "Error", text: result.message || "Failed to update password." });
         }
     
         // Show success message
         await Swal.fire({ icon: "success", title: "Success", text: "Password updated successfully! You will be logged out." });
     
         // Call logout API
         await fetch("/api/logout", {
           method: "POST",
           credentials: "include",
         });
     
         // Redirect to login page
         window.location.href = "/login";
         
       } catch (error) {
         console.error("Error updating password:", error);
         Swal.fire({ icon: "error", title: "Error", text: "An error occurred. Please try again." });
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
  if (typeof text !== "string") return ""; // ✅ handle null/undefined safely

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

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex flex-col gap-4 md:flex-row min-h-screen w-full bg-gray-100">
           {/* Background Overlay */}
              <div 
                className="fixed inset-0 bg-cover bg-center opacity-40 z-0 "
                style={{ backgroundImage: `url(${bg})` }}
              />
        {/* Mobile Top Bar */}
        <div className="md:hidden flex justify-between items-center p-4 bg-white shadow z-50 w-full">
          <h1 className="text-lg font-bold">Profile</h1>
          <button onClick={() => {
            setShowSidebar(!showSidebar);
            console.log("Sidebar:", !showSidebar);
          }}>☰</button>
        </div>

  {/* Sidebar */}
  <div
    className={`fixed md:sticky top-0 left-0 z-50 md:z-auto bg-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
      showSidebar ? "translate-x-0" : "-translate-x-full"
    } w-3/4 max-w-xs h-full md:w-96 md:h-screen md:rounded-md md:shadow-lg`}
  >
  <aside className="p-4 bg-white h-full flex flex-col items-center shadow-lg md:mt-5 md:rounded-md">

    {/* Mobile Close Button */}
    <button
      className="self-end md:hidden text-2xl mb-4"
      onClick={() => setShowSidebar(false)}
    >
      ✕
    </button>

    {/* Profile Avatar */}
    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
      {user?.profile ? (
        <img
          src={user.profile}
          alt="Profile"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setShowPreview(true)}
        />
      ) : (
        <div
          className="w-full h-full bg-blue-500 flex justify-center items-center text-white text-6xl font-bold cursor-pointer"
          onClick={() => setShowPreview(true)}
        >
          {user?.first_name?.charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>

    <h2 className="text-xl font-bold mt-3 text-center">
      {user?.first_name} {user?.last_name}
    </h2>

    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
            onClick={(e) => {
          e.stopPropagation();
          setShowEditProfile(true);
        }}>
        <FaEdit className="mr-2" /> Edit
      </button>

      <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center"
      onClick={() => setIsPasswordOpen(true)}>
        <FaLock className="mr-2" /> Change Password
      </button>
    </div>

<div className="text-sm text-gray-600 mt-5 text-center px-4 space-y-2">

  {/* Year Graduate */}
  <p className="flex justify-start items-center">
    <FaGraduationCap className="mr-2" size={20} />
    Year graduate: {user?.year_graduate || "N/A"}
  </p>

  {/* Course */}
  <p className="flex justify-start items-center">
    <FaUserGraduate className="mr-2" size={20} />
    Course: {user?.course || "N/A"}
  </p>
  
{/* Further Education */}
{user?.education_title && (
  <div className="flex items-start">
    <FaUserGraduate className="mr-2 mt-1" size={20} />
    <p>
      Further Education:{" "}
      {user.education_field ? ` in ${user.education_field}` : ""}
    </p>
  </div>
)}

  {/* Work */}
  <p className="flex items-start">
    <FaBriefcase className="mr-2 mt-1" size={20} />
    {user?.work_title
      ? `${user.work_title}${user.company ? ` at ${user.company}` : ""}`
      : "No current work"}
  </p>

  {/* Address */}
  <div className="flex items-start">
    <FaMapMarkerAlt size={20} className="mr-2 mt-1 flex-shrink-0" />
    <p>Lives in: {user?.address || "N/A"}</p>
  </div>

</div>

      <button
        className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        onClick={(e) => {
          e.stopPropagation();
          setShowFeedbackForm(true);
        }}
      >
        Send feedback form to employer
      </button>
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 mt-5 rounded-lg flex items-center w-full sm:w-auto"
    >
      <FaSignOutAlt className="mr-2" /> Logout
    </button>
  </aside>
</div>

{/* Backdrop (mobile only) */}
{showSidebar && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    onClick={() => setShowSidebar(false)}
  />
)}

{/* Profile Preview */}
{showPreview && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="relative">
      {user?.profile ? (
        <img
          src={user.profile}
          alt="Profile Preview"
          className="max-w-full max-h-[80vh] rounded-lg"
        />
      ) : (
        <div className="w-80 h-80 bg-blue-500 rounded-full flex justify-center items-center text-white text-[10rem] font-bold">
          {user?.first_name?.charAt(0).toUpperCase() || "?"}
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
{/* Main Content */}
<main className="flex-1 p-4 mt-4 relative">
  <div className="bg-white p-4 rounded-lg shadow mb-16 h-full">
    <h2 className="text-xl font-bold mb-4">Your Post</h2>

    <div className="space-y-6">
      {(() => {
        const userPosts = posts.filter((post) => post.user_id === user?.id);
        if (userPosts.length === 0) {
          return (
            <p className="text-center text-gray-500 text-lg">
              You have not posted yet
            </p>
          );
        }

        return userPosts.map((post) => (
          <div key={post.id} className="bg-white p-6 rounded-lg shadow-md relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {user?.profile ? (
                  <img
                    src={user.profile}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-4 border-gray-200 cursor-pointer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                    {post.username?.charAt(0)}
                  </div>
                )}

                <div className="ml-3">
                  <h2 className="font-semibold text-lg text-gray-800">
                    {post.username || "Unknown User"} {post.lastname}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(post.date_posted).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Edit/Delete Menu */}
              {user?.id === post.user_id && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === post.id ? null : post.id)
                    }
                  >
                    <BsThreeDotsVertical className="text-gray-600 hover:text-gray-800 cursor-pointer" />
                  </button>

                  {menuOpen === post.id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setEditingPost(post.id);
                          setEditedContent(post.content);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

            {/* Post Content */}
            {editingPost === post.id ? (
              <div>
                <textarea
                  className="w-full p-2 border rounded-lg mt-2"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => editPost(post.id, editedContent)}
                    className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap break-words mt-2">
                {makeLinksClickable(post.content)}
              </p>
            )}

            {/* Images Grid */}
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

      {/* Lightbox Modal */}
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
              {/* Previous */}
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

              {/* Image */}
              <img
                src={currentPreviewImages[previewIndex]}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] rounded-xl object-contain"
              />

              {/* Next */}
              {currentPreviewImages.length > 1 && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
                  onClick={() =>
                    setPreviewIndex(
                      previewIndex === currentPreviewImages.length - 1
                        ? 0
                        : previewIndex + 1
                    )
                  }
                >
                  <FaChevronRight />
                </button>
              )}

              {/* Close */}
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

     {/* Feedback Modal */}
{showFeedbackForm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 px-2 sm:px-0">
    <div
      className="
        bg-transparent 
        w-full 
        h-[95vh] 
        max-w-3xl 
        sm:h-[90vh] 
        rounded-none 
        sm:rounded-xl 
        shadow-xl 
        relative 
        overflow-hidden
      "
    >
      <EmployerSection onClose={() => setShowFeedbackForm(false)} />
    </div>
  </div>
)}

{showEditProfile && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 px-2 sm:px-0">
    <div
      className="
        bg-transparent 
        w-full 
        h-[95vh] 
        max-w-5xl 
        sm:h-[90vh] 
        rounded-none 
        sm:rounded-xl 
        shadow-xl 
        relative 
        overflow-y-auto  
        hide-scrollbar  
      "
    >
      <EditProfile onClose={() => setShowEditProfile(false)} />
    </div>
  </div>
)}

      {isPasswordOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-gray-200 p-6 rounded-lg w-2/4">
                  <h2 className="text-lg font-semibold">Change Password</h2>
                  <div className="mt-4 space-y-3">
                    <input type="password" onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Current Password" className="w-full px-3 py-2 border rounded-lg" />
                    <input type="password" onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="New Password" className="w-full px-3 py-2 border rounded-lg" />
                    <input type="password" onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })} placeholder="Confirm New Password" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button onClick={() => setIsPasswordOpen(false)} className="px-4 py-2 bg-gray-400 text-white rounded-lg">Cancel</button>
                    <button onClick={handlePasswordChange} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Update Password</button>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}
