import { useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import Sidebar from "../navbar/sidebar";
import Swal from "sweetalert2";
import { UploadCloud, Loader2 } from "lucide-react"; 
import { useNavigate } from "react-router-dom";


// ------------------- Upload Yearbook Component -------------------
const UploadYearbook = ({ setYearbooks }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [studentName, setstudentName] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ loading state

  const [progress, setProgress] = useState(0);


  const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    const firstPath = files[0].webkitRelativePath || files[0].name;
    const folder = firstPath.includes("/") ? firstPath.split("/")[0] : "UnnamedFolder";
    setFolderName(folder);
  }
  setSelectedFiles(files);
};


const handleUpload = async () => {
  if (!folderName || selectedFiles.length === 0 || !studentName) {
    Swal.fire("Missing Information", "Please select a folder and a student name file.", "warning");
    return;
  }

  setLoading(true);
  setProgress(0);

  try {
    // 1️⃣  Get Cloudinary signature
    const sigRes = await fetch(`https://server-1-gjvd.onrender.com/cloudinary-signature?folder=${folderName}`);
    const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

    // 2️⃣  Upload all images directly to Cloudinary
    const uploadedUrls = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", `yearbooks/${folderName}`);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      uploadedUrls.push(data.secure_url);
      setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }

    // 3️⃣  Send metadata + student file + URLs to backend
    const backendForm = new FormData();
    backendForm.append("folderName", folderName);
    backendForm.append("yearbookName", "Yearbook 2025");
    backendForm.append("studentNames", studentName);
    uploadedUrls.forEach((url) => backendForm.append("imageUrls[]", url));

    const response = await fetch("https://server-1-gjvd.onrender.com/upload-yearbook", {
      method: "POST",
      body: backendForm,
    });

    const result = await response.json();
    Swal.fire("Success", result.message, "success");

    // Refresh yearbooks list
    const res = await fetch("https://server-1-gjvd.onrender.com/yearbooks");
    const data = await res.json();
    setYearbooks(data);

    setSelectedFiles([]);
    setFolderName("");
    setstudentName(null);

  } catch (err) {
    console.error("Upload failed:", err);
    Swal.fire("Error", "Upload failed. Please try again.", "error");
  } finally {
    setLoading(false);
  }
};


  const handleCancel = () => {
    setSelectedFiles([]);
    setFolderName("");
    setstudentName(null);
  };

  return (
    <div className="mb-5 p-4 bg-gray-100 rounded-lg shadow">
      <h2 className="font-semibold text-lg mb-3">Create Yearbook</h2>

      <div className="flex items-center bg-gray-200 rounded-lg p-2">
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            className="hidden"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFileSelect}
          />
          <span className="text-gray-600">📁 Select Folder</span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!folderName || loading}
          className={`ml-3 flex items-center px-5 py-2 font-medium rounded-lg transition duration-300 ${
            loading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Uploading...{progress}%
            </>
          ) : (
            <>
              <UploadCloud size={18} className="mr-2" />
              Upload
            </>
          )}
        </button>
      </div>

      {folderName && (
        <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-lg mb-1">Students Name:</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setstudentName(e.target.files[0])}
              placeholder="Students Names"
              className="w-full p-2 rounded border border-gray-300 text-black"
            />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">📁 Folder: {folderName}</h3>
            <button
              onClick={handleCancel}
              className="text-red-500 text-sm font-semibold hover:underline"
            >
              Cancel
            </button>
          </div>

          <div className="mt-3 max-h-40 overflow-y-auto border-t pt-2">
            <h4 className="font-medium text-gray-600">Files:</h4>
            <ul className="text-sm text-gray-700">
              {selectedFiles.slice(0, 5).map((file, index) => (
                <li key={index}>📄 {file.name}</li>
              ))}
              {selectedFiles.length > 5 && <li>+ {selectedFiles.length - 5} more...</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};


// ------------------- Yearbook Card Component -------------------
const YearbookCard = ({ yearbook, setYearbooks }) => {
  const { id, folder_name, date_uploaded } = yearbook;
  const [imageSrc, setImageSrc] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ image loading

  useEffect(() => {
    fetch(`https://server-1-gjvd.onrender.com/yearbook/${id}/images`)
      .then((res) => res.json())
      .then((images) => {
        if (images.length > 0) {
          setImageSrc(`https://server-1-gjvd.onrender.com/${images[0].file_path}`);
        }
      })
      .catch((err) => console.error("Error fetching images:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${folder_name}. This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://server-1-gjvd.onrender.com/yearbook/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Deleted!", data.message, "success");
        setYearbooks((prev) => prev.filter((y) => y.id !== id));
      } else {
        Swal.fire("Error", data.message || "Failed to delete yearbook", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong while deleting.", "error");
    }
  };

  return (
    <>
      <div className="bg-gray-100 p-5 rounded-lg shadow-md text-center w-64">
        {loading ? (
          <div className="h-48 w-full flex items-center justify-center text-gray-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={`Yearbook ${folder_name}`}
            className="h-48 w-full mx-auto object-cover rounded-md"
          />
        ) : (
          <div className="h-48 w-full bg-gray-300 flex items-center justify-center text-gray-500">
            No Preview Available
          </div>
        )}
        <h2 className="font-semibold mt-3">{folder_name}</h2>
        <p className="text-gray-500 text-sm">{new Date(date_uploaded).toLocaleDateString()}</p>

        <div className="flex justify-center gap-2 mt-3">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            View
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && <YearbookViewer yearbook={yearbook} onClose={() => setIsOpen(false)} />}
    </>
  );
};


// ------------------- Yearbook Viewer (Flipbook) -------------------
const YearbookViewer = ({ yearbook, onClose }) => {
  const [images, setImages] = useState([]);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });
  const [singlePage, setSinglePage] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ viewer loading

  useEffect(() => {
    fetch(`https://server-1-gjvd.onrender.com/yearbook/${yearbook.id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((err) => console.error("Error fetching images:", err))
      .finally(() => setLoading(false));

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 768 || height < 700) {
        setBookSize({ width: 320, height: 460 });
        setSinglePage(true);
      } else if (width < 1024 || height < 900) {
        setBookSize({ width: 420, height: 600 });
        setSinglePage(true);
      } else {
        setBookSize({ width: 600, height: 800 });
        setSinglePage(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [yearbook.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-6">
      <div className="relative w-full max-w-6xl h-full flex flex-col justify-center items-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600"
        >
          Close
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-full text-white">
            <Loader2 size={40} className="animate-spin" />
          </div>
        ) : images.length > 0 ? (
          <HTMLFlipBook
            width={bookSize.width}
            height={bookSize.height}
            showCover={true}
            drawShadow={true}
            flippingTime={800}
            useMouseEvents={true}
            className="shadow-lg rounded-lg"
            singlePage={singlePage}
          >
      {images.map((img, i) => (
      <div key={i} className="w-auto h-auto flex justify-center items-center">
        <img
          src={img.file_path} // Cloudinary URL from database
          alt={`Yearbook page ${i + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => (e.target.style.display = "none")} // hides broken images
        />
      </div>
    ))}

          </HTMLFlipBook>
        ) : (
          <p className="text-center text-gray-300">No images found.</p>
        )}
      </div>
    </div>
  );
};


// ------------------- Dashboard -------------------
export default function Dashboard() {
  const [yearbooks, setYearbooks] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ dashboard loading
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/yearbooks")
      .then((res) => res.json())
      .then((data) => setYearbooks(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching yearbooks:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/session", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          navigate(data.user.role === "admin" ? "/home" : "/userhome");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-50">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Yearbooks</h1>
        </div>
        <UploadYearbook setYearbooks={setYearbooks} />

        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">
            <Loader2 size={40} className="animate-spin" />
          </div>
        ) : yearbooks.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-start">
            {yearbooks.map((yearbook) => (
              <YearbookCard key={yearbook.id} yearbook={yearbook} setYearbooks={setYearbooks} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-10">No yearbooks found.</p>
        )}
      </div>
    </div>
  );
}
