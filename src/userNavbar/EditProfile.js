import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Cropper from "react-easy-crop";
import { FaCamera } from "react-icons/fa";
import { X } from "lucide-react"; // ✅ Import the close icon
import EditWork from "./EditWork";
import EditEducation from "./EditEducation";
import { motion } from "framer-motion";

export default function EditProfilePage({ onClose }) {
  const [user, setUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    profile: "",
    name: "",
    middlename: "",
    lastname: "",
    work: [],
    education: [],
    address: "",
    email: "",
    year: "",
    password: "",
  });

  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false); // ✅ ADD
  const [selectedEducation, setSelectedEducation] = useState(null); // ✅ ADD
  const [isSaving, setIsSaving] = useState(false);



  // ✅ Fetch user data on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/profile", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const userData = await response.json();

      setUser({ ...userData });
      setUpdatedUser({
        profile: userData.profile,
        name: userData.first_name || "",
        middlename: userData.middle_name || "",
        lastname: userData.last_name || "",
        work: [],
        education: [], // ✅ initialize
        address: userData.address || "",
        email: userData.email || "",
        year: userData.year_graduate || "",
      });

      // ✅ Fetch user's work
      const workRes = await fetch("/api/work", { credentials: "include" });
      if (workRes.ok) {
        const workData = await workRes.json();
        setUpdatedUser((prev) => ({
          ...prev,
          work: Array.isArray(workData) ? workData : [],
        }));
      }

     // ✅ Fetch user's education
      const eduRes = await fetch("/api/education", { credentials: "include" });
      if (eduRes.ok) {
        const eduData = await eduRes.json();
        setUpdatedUser((prev) => ({
          ...prev,
          education: Array.isArray(eduData.data) ? eduData.data : [],
        }));
      }

    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
      setShowCropModal(true);
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCropArea(croppedAreaPixels);
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

  const cropImage = async () => {
    if (!imageSrc || !cropArea) {
      alert("Please select and crop an image.");
      return;
    }
    try {
      const croppedBlob = await getCroppedImg(imageSrc, cropArea);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setCroppedImage(croppedUrl);
      setUpdatedUser((prev) => ({ ...prev, profile: croppedUrl }));
      setUser((prev) => ({ ...prev, profile: croppedUrl }));
      setShowCropModal(false);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image. Please try again.");
    }
  };

  const handleUserUpdate = async () => {
  try {
     setIsSaving(true); 
    const hasProfileChanged = !!croppedImage;
    const hasInfoChanged =
      updatedUser.name !== user.name ||
      updatedUser.middlename !== user.middlename ||
      updatedUser.lastname !== user.lastname ||
      updatedUser.email !== user.email ||
      updatedUser.address !== user.address;

    if (!hasInfoChanged && !hasProfileChanged && !updatedUser.work) {
         setIsSaving(false);
      return Swal.fire({
        icon: "info",
        title: "No Changes Detected",
        text: "You have not made any changes to your profile.",
      });
    }

    const formData = new FormData();
    formData.append("name", updatedUser.name);
    formData.append("middlename", updatedUser.middlename);
    formData.append("lastname", updatedUser.lastname);
    formData.append("email", updatedUser.email);
    formData.append("address", updatedUser.address);

    if (updatedUser.email !== user.email) {
      if (!updatedUser.password) {
           setIsSaving(false);
        return Swal.fire({
          icon: "warning",
          title: "Password Required",
          text: "Please enter your password to confirm the email change.",
        });
      }
      formData.append("password", updatedUser.password);
    }

    if (hasProfileChanged) {
      const blob = await (await fetch(croppedImage)).blob();
      const file = new File([blob], "profile.jpg", {
        type: blob.type || "image/jpeg",
      });
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
         setIsSaving(false);
      return Swal.fire({ icon: "error", title: "Error", text: errorMessage });
    }

    // ✅ Profile updated successfully
    const result = await res.json();

    // ✅ Save work if present (only on Save Changes)
    if (updatedUser.work && updatedUser.work.position && updatedUser.work.company) {
      try {
        const workRes = await fetch("/api/work", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            position: updatedUser.work.position,
            company: updatedUser.work.company,
            location: updatedUser.work.location,
            startDate: updatedUser.work.startDate,
            endDate: updatedUser.work.endDate,
            description: updatedUser.work.description,
            isCurrent: updatedUser.work.isCurrent,
          }),
        });

        const workResult = await workRes.json();
        if (!workRes.ok) throw new Error(workResult.message || "Failed to save work.");

        console.log("✅ Work saved successfully:", workResult);
      } catch (workErr) {
        console.error("❌ Work save error:", workErr);
        Swal.fire("Warning", "Profile saved, but failed to save work.", "warning");
      }
    }

    Swal.fire({
      icon: "success",
      title: "Profile Updated",
      text: "Your profile saved successfully!",
    });
    onClose();
    await fetchUser();
    window.location.reload();
  } catch (error) {
    console.error("Error updating user:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "An error occurred.",
    });
  }finally {
    setIsSaving(false); // 🔴 always stop loading
  }

};


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-xl">
        Loading profile...
      </div>
    );
  }

  return (
    <motion.div 
      className="relative bg-white items-center rounded-2xl shadow-lg p-6 border border-gray-100 max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      >

        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Edit Profile
        </h1>
       {/* ✅ Close Button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32">
            <label className="relative cursor-pointer">
              {croppedImage || user?.profile ? (
                <img
                  src={croppedImage || user?.profile}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 bg-blue-500 rounded-full flex justify-center items-center text-white text-6xl font-bold">
                  {user?.first_name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <input
                type="file"
                name="profile"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>

            <label className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md cursor-pointer">
              <FaCamera className="text-gray-600" />
              <input
                type="file"
                name="profile"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Cropper Modal */}
        {showCropModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
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
                <button
                  onClick={cropImage}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowCropModal(false)}
                  className="text-red-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-3">
          <input
            type="text"
            value={updatedUser.name}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, name: e.target.value })
            }
            placeholder="First Name"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={updatedUser.middlename}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, middlename: e.target.value })
            }
            placeholder="Middle Name"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={updatedUser.lastname}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, lastname: e.target.value })
            }
            placeholder="Last Name"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            value={updatedUser.address}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, address: e.target.value })
            }
            placeholder="Address"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="email"
            value={updatedUser.email}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, email: e.target.value })
            }
            placeholder="Email"
            className="w-full px-3 py-2 border rounded-lg"
          />

          {updatedUser.email !== user?.email && (
            <>
              <h1 className="text-red-600 text-sm">
                Please enter your password to confirm email changes
              </h1>
              <input
                type="password"
                value={updatedUser.password}
                onChange={(e) =>
                  setUpdatedUser({ ...updatedUser, password: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Confirm Password"
              />
            </>
          )}
                    {/* Work */}
      <div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Work Experience
  </label>

  {Array.isArray(updatedUser.work) && updatedUser.work.length > 0 ? (
    <select
      onChange={(e) => {
        const selectedIndex = e.target.value;
        const selectedWorkItem = updatedUser.work[selectedIndex];
        if (selectedWorkItem) {
          setSelectedWork(selectedWorkItem);
          setIsWorkModalOpen(true);
        }
      }}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
      defaultValue=""
    >
      <option value="" disabled>
        Select a work record to view or edit
      </option>
      {updatedUser.work.map((workItem, index) => (
        <option key={index} value={index}>
          {`${workItem.position || "N/A"} at ${workItem.company || "N/A"}`}
        </option>
      ))}
    </select>
  ) : (
    <p className="text-gray-500 text-sm mb-2">
      No work experience added yet.
    </p>
  )}

  {/* ✅ Add Work Button */}
  <button
    onClick={() => {
      setSelectedWork(null); // ensures new entry starts empty
      setIsWorkModalOpen(true);
    }}
    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  >
    + Add Work
  </button>
</div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Further Education
          </label>

          {Array.isArray(updatedUser.education) && updatedUser.education.length > 0 ? (
            <select
              onChange={(e) => {
                const selectedIndex = e.target.value;
                const selectedEdu = updatedUser.education[selectedIndex];
                if (selectedEdu) {
                  setSelectedEducation(selectedEdu);
                  setIsEducationModalOpen(true);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              defaultValue=""
            >
              <option value="" disabled>
                Select an education record to view or edit
              </option>
              {updatedUser.education.map((eduItem, index) => (
                <option key={index} value={index}>
                  {`${eduItem.programType || eduItem.program_type || "N/A"} — ${
                    eduItem.fieldOfStudy || eduItem.field_of_study || "N/A"
                  }`}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-500 text-sm mb-2">
              No further education added yet.
            </p>
          )}

          {/* ✅ Add new education button */}
          <button
            onClick={() => {
              setSelectedEducation(null); // clear selection
              setIsEducationModalOpen(true);
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            + Add Further Education
          </button>
        </div>


          </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleUserUpdate}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg text-white transition ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

        </div>

            {isWorkModalOpen && (
  <EditWork
    initialData={selectedWork || {}} // safe empty object
    onClose={() => {
      setIsWorkModalOpen(false);
      setSelectedWork(null); // ✅ reset after closing
    }}
    onSave={(workData) => {
      setUpdatedUser((prev) => {
        const workArray = Array.isArray(prev.work) ? [...prev.work] : [];
        if (selectedWork) {
          // Editing existing
          const index = workArray.findIndex((w) => w.id === selectedWork.id);
          if (index !== -1) workArray[index] = workData;
        } else {
          // Adding new
          workArray.push(workData);
        }
        return { ...prev, work: workArray };
      });
      setIsWorkModalOpen(false);
      setSelectedWork(null); // ✅ clear selection after save
    }}
  />
)}

   {/* ✅ Education Modal */}
      {isEducationModalOpen && (
        <EditEducation
          initialData={selectedEducation || {}}
          onClose={() => {
            setIsEducationModalOpen(false);
            setSelectedEducation(null);
          }}
          onSave={(eduData) => {
            setUpdatedUser((prev) => {
              const eduArray = Array.isArray(prev.education)
                ? [...prev.education]
                : [];
              if (selectedEducation) {
                const index = eduArray.findIndex(
                  (e) => e.id === selectedEducation.id
                );
                if (index !== -1) eduArray[index] = eduData;
              } else {
                eduArray.push(eduData);
              }
              return { ...prev, education: eduArray };
            });
            setIsEducationModalOpen(false);
            setSelectedEducation(null);
          }}
        />
      )}

    </motion.div>
  );
}
