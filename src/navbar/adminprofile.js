import { useEffect, useState,useCallback } from "react";
import {  FaCamera } from "react-icons/fa";
import Sidebar from "../navbar/sidebar";
import Cropper from "react-easy-crop";
import Swal from 'sweetalert2';

export default function AdminProfile() {
  const [user, setUser] = useState(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({profile:"" ,name: "", middlename:"" , lastname:"", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);


 // Handle Image Selection
 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setImageSrc(URL.createObjectURL(file));
    setShowCropModal(true);
  }
};

// Capture Cropped Area
const onCropComplete = useCallback((_, croppedAreaPixels) => {
  console.log("Crop complete:", croppedAreaPixels);
  setCropArea(croppedAreaPixels);
}, []);

// Apply Cropped Image
const cropImage = async () => {
  if (!imageSrc || !cropArea) {
    alert("Please select an image and crop it.");
    return;
  }
  try {
    const croppedBlob = await getCroppedImg(imageSrc, cropArea);
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setCroppedImage(croppedUrl);
    setUpdatedUser((prev) => ({ ...prev, profile: croppedUrl }));
    setUser((prev) => ({ ...prev, profile: croppedUrl }));
    setShowCropModal(false);
    alert("Image cropped successfully!");
  } catch (error) {
    console.error("Error cropping image:", error);
    alert("Failed to crop image. Please try again.");
  }
};



  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await response.json();
      setUser(userData);
      setUpdatedUser({ profile:userData.profile, name: userData.name, middlename: userData.middlename, lastname: userData.lastname, email: userData.email });
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };
  
  const handleUserUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", updatedUser.name);
      formData.append("middlename", updatedUser.middlename);
      formData.append("lastname", updatedUser.lastname);
      formData.append("email", updatedUser.email);
  
      if (updatedUser.email !== user.email) {
        if (!updatedUser.password) {
          return Swal.fire({
            icon: 'warning',
            title: 'Password Required',
            text: 'Please enter your password to confirm the email change.',
          });
        }
        formData.append("password", updatedUser.password);
      }
  
      if (croppedImage) {
        const blob = await (await fetch(croppedImage)).blob();
        const file = new File([blob], "profile.jpg", { type: blob.type || "image/jpeg" });
        formData.append("profile", file);
      }
  
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
  
      if (!res.ok) {
        const errorResult = await res.json().catch(() => ({}));
        const errorMessage = errorResult.message || "Failed to update user data.";
        return Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
      }
  
      const result = await res.json();
  
      if (updatedUser.email !== user.email) {
        Swal.fire({
          icon: 'info',
          title: 'Verification Sent',
          text: result.message,
          input: 'text',
          inputPlaceholder: 'Enter Verification Code',
          showCancelButton: true,
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          inputValidator: (value) => {
            if (!value) {
              return 'Please enter the verification code!';
            }
          }
        }).then(async (response) => {
          if (response.isConfirmed) {
            try {
              const confirmRes = await fetch('/confirm-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: response.value, userId: user.id }),
                credentials: 'include',
              });
      
              const confirmResult = await confirmRes.json();
              if (!confirmRes.ok) {
                return Swal.fire({ icon: 'error', title: 'Error', text: confirmResult.message });
              }
      
              Swal.fire({ icon: 'success', title: 'Email Verified', text: confirmResult.message });
              fetchUser(); // Refresh user data
            } catch (error) {
              Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'An error occurred.' });
            }
          }
        });
      } else {
        Swal.fire({ icon: 'success', title: 'Profile Updated', text: 'Profile updated successfully!' });
      }      
  
      fetchUser();
      setEditingUser(false);
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'An error occurred.' });
    }
  };
  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      return Swal.fire({ icon: "warning", title: "Missing Fields", text: "All fields are required." });
    }
  
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return Swal.fire({ icon: "error", title: "Mismatch", text: "New passwords do not match." });
    }
  
    try {
      const response = await fetch(`/api/users/${user.id}/change-password`, {
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
  
  
  
  const getCroppedImg = (imageSrc, cropArea) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        
        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        }, "image/jpeg");
      };
      image.onerror = (error) => reject(error);
    });
  };
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-50">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        <div className="p-6 w-full bg-white shadow-md rounded-xl">
          <div className="flex items-center space-x-6 border-b pb-6 mb-6">
          <div className="relative w-32 h-32">
                        
                  {user?.profile ? (
                    <img 
                      src={user.profile} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 cursor-pointer" 
                      onClick={() => setShowPreview(true)}
                    />
                  ) : (
                    <div 
                      className="w-32 h-32 bg-blue-500 rounded-full flex justify-center items-center text-white text-6xl font-bold cursor-pointer"
                      onClick={() => setShowPreview(true)}
                    >
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Modal for Image or Initial Preview */}
                {showPreview && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative">
                      {user?.profile ? (
                        <img src={user?.profile} alt="Profile Preview" className="max-w-full max-h-[80vh] rounded-lg"/>
                      ) : (
                        <div className="w-80 h-80 bg-blue-500 rounded-full flex justify-center items-center text-white text-[10rem] font-bold">
                          {user?.name?.charAt(0).toUpperCase() || '?'}
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


            <div>
              <h2 className="text-3xl font-bold text-gray-800">{user?.name || 'Guest'}</h2>
              <h3 className="text-lg font-medium text-gray-500">{user?.role || 'Unknown'}</h3>
              <div className="flex space-x-3 mt-4">
                <button onClick={() => setEditingUser(true)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Edit</button>
                <button onClick={() => setEditingPassword(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Edit Password</button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit User Modal */}
                      {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        {croppedImage || user?.profile ? (
                          <img
                            src={croppedImage || user.profile}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 cursor-pointer"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-blue-500 rounded-full flex justify-center items-center text-white text-6xl font-bold">
                            {user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}

                        {/* Upload Button */}
                        <label className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md cursor-pointer">
                          <FaCamera className="text-gray-600" />
                          <input type="file" name="profile" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>

                        {/* Crop Modal */}
                        {showCropModal && (
                          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
                              <h2 className="text-xl font-bold mb-2">Crop Image</h2>
                              <div className="relative w-full h-64">
                                <Cropper
                                  image={imageSrc}
                                  crop={crop}
                                  zoom={zoom}
                                  aspect={1}
                                  onCropChange={setCrop}
                                  onZoomChange={setZoom}
                                  onCropComplete={onCropComplete}
                                />
                              </div>
                              <div className="flex justify-between mt-4">
                                <button onClick={cropImage} className="bg-green-500 text-white px-4 py-2 rounded-lg">
                                  Save
                                </button>
                                <button onClick={() => setShowCropModal(false)} className="text-red-500">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={updatedUser.name}
                      onChange={(e) => setUpdatedUser({ ...updatedUser, name: e.target.value })}
                      className="border p-2 rounded w-full mt-2 mb-2"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={updatedUser.middlename}
                      onChange={(e) => setUpdatedUser({ ...updatedUser, middlename: e.target.value })}
                      className="border p-2 rounded w-full mb-2"
                      placeholder="Middle Name"
                    />
                    <input
                      type="text"
                      value={updatedUser.lastname}
                      onChange={(e) => setUpdatedUser({ ...updatedUser, lastname: e.target.value })}
                      className="border p-2 rounded w-full mb-2"
                      placeholder="Last Name"
                    />
                    <input
                      type="text"
                      value={updatedUser.email}
                      onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })}
                      className="border p-2 rounded w-full mb-2"
                      placeholder="Email"
                    />

                    {updatedUser.email !== user?.email && (
                      <>
                        <input
                          type="password"
                          value={updatedUser.password}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, password: e.target.value })}
                          className="border p-2 rounded w-full mb-2"
                          placeholder="Confirm Password"
                        />
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setEditingUser(false)}  className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
                        Cancel</button>
                  
                      <button onClick={handleUserUpdate}  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
                        Save
                        </button>
                    
                    </div>
                  </div>
                </div>
              )}

                      {/* Edit Password Modal */}
              {editingPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-96 transition-transform transform scale-100">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Change Password</h2>

                    <div className="relative mb-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                    </div>

                    <div className="relative mb-3">
                      <input
                        type="password"
                        placeholder="New Password"
                        className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                    </div>

                    <div className="relative mb-4">
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                      <button 
                        onClick={() => setEditingPassword(false)} 
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handlePasswordUpdate} 
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
                      >
                        Save
                      </button>
                    </div>

                  </div>
                </div>
              )}

      </div>
    </div>
    
  );
  
  
}