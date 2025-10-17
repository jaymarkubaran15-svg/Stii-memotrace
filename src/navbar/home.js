import { useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import Sidebar from "../navbar/sidebar";
import Swal from "sweetalert2";
import { UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Upload Yearbook Component
const UploadYearbook = ({ setYearbooks }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [studentName, setStudentName] = useState(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const fullPath = files[0].webkitRelativePath || files[0].name;
      const folder = fullPath.split("/")[0];
      setFolderName(folder);
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!folderName || selectedFiles.length === 0 || !studentName) {
      Swal.fire(
        "Missing Information",
        "Please select a folder and a student name file.",
        "warning"
      );
      return;
    }

    const formData = new FormData();
    formData.append("folderName", folderName);
    formData.append("yearbookName", "Yearbook 2025");
    formData.append("studentNames", studentName);
    for (let file of selectedFiles) {
      formData.append("images", file);
    }

    try {
      const response = await fetch(
        "https://server-1-gjvd.onrender.com/upload-yearbook",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        Swal.fire("Success", data.message, "success");
        // ✅ Refresh yearbooks without full page reload
        const yearbooksRes = await fetch("https://server-1-gjvd.onrender.com/yearbooks");
        const yearbooksData = await yearbooksRes.json();
        setYearbooks(yearbooksData);

        setSelectedFiles([]);
        setFolderName("");
        setStudentName(null);
      } else {
        Swal.fire("Error", data.message || "Failed to upload yearbook.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to upload yearbook.", "error");
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setFolderName("");
    setStudentName(null);
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
          className="ml-3 flex items-center px-5 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition duration-300"
          disabled={!folderName}
        >
          <UploadCloud size={18} className="mr-2" />
          Upload
        </button>
      </div>

      {folderName && (
        <div className="mt-3 bg-white p-3 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-lg mb-1">Students Name:</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setStudentName(e.target.files[0])}
              className="w-full p-2 rounded border border-gray-300 text-black"
            />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">
              📁 Folder: {folderName}
            </h3>
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
              {selectedFiles.length > 5 && (
                <li>+ {selectedFiles.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Yearbook Card Component
const YearbookCard = ({ yearbook, setYearbooks }) => {
  const { id, folder_name, date_uploaded } = yearbook;
  const [imageSrc, setImageSrc] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`https://server-1-gjvd.onrender.com/yearbook/${id}/images`)
      .then((res) => res.json())
      .then((images) => {
        if (images.length > 0) {
          let url = images[0].file_path;
          if (!url.startsWith("http")) {
            url = `https://server-1-gjvd.onrender.com/${url.replace(/^\/+/, "")}`;
          }
          setImageSrc(url);
        }
      })
      .catch((err) => console.error("Error fetching images:", err));
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
      const res = await fetch(
        `https://server-1-gjvd.onrender.com/yearbook/${id}`,
        { method: "DELETE" }
      );

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
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`Yearbook ${folder_name}`}
            className="h-48 w-full object-cover rounded-md"
          />
        ) : (
          <div className="h-48 w-full bg-gray-300 flex items-center justify-center text-gray-500">
            No Preview Available
          </div>
        )}
        <h2 className="font-semibold mt-3">{folder_name}</h2>
        <p className="text-gray-500 text-sm">
          {new Date(date_uploaded).toLocaleDateString()}
        </p>

        <div className="flex justify-center gap-2 mt-3">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            View
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && (
        <YearbookViewer
          yearbook={yearbook}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// ✅ Yearbook Viewer
const YearbookViewer = ({ yearbook, onClose }) => {
  const [images, setImages] = useState([]);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });
  const [singlePage, setSinglePage] = useState(false);

  useEffect(() => {
    fetch(`https://server-1-gjvd.onrender.com/yearbook/${yearbook.id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((err) => console.error("Error fetching images:", err));

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 768) {
        setBookSize({ width: 320, height: 460 });
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="relative w-full max-w-6xl flex flex-col justify-center items-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition"
        >
          Close
        </button>

        {images.length > 0 ? (
          <HTMLFlipBook
            width={bookSize.width}
            height={bookSize.height}
            showCover
            drawShadow
            flippingTime={800}
            singlePage={singlePage}
            className="shadow-lg rounded-lg bg-white"
          >
            {images.map((img, index) => {
              let src = img.file_path.startsWith("http")
                ? img.file_path
                : `https://server-1-gjvd.onrender.com/${img.file_path.replace(
                    /^\/+/,
                    ""
                  )}`;
              return (
                <div
                  key={index}
                  className="flex justify-center items-center bg-white"
                >
                  <img
                    src={src}
                    alt={`Page ${index + 1}`}
                    className="object-contain w-full h-full rounded-lg"
                  />
                </div>
              );
            })}
          </HTMLFlipBook>
        ) : (
          <p className="text-white text-lg mt-10">No images found.</p>
        )}
      </div>
    </div>
  );
};

// ✅ Dashboard
export default function Dashboard() {
  const [yearbooks, setYearbooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/yearbooks")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setYearbooks(data))
      .catch((err) => console.error("Error fetching yearbooks:", err));
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "https://server-1-gjvd.onrender.com/api/session",
          {
            method: "GET",
            credentials: "include",
          }
        );
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
        <div className="flex flex-wrap gap-4 justify-start">
          {yearbooks.map((yearbook) => (
            <YearbookCard
              key={yearbook.id}
              yearbook={yearbook}
              setYearbooks={setYearbooks}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
