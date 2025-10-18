import { useEffect, useState } from "react";
import Sidebar from "../navbar/sidebar";
import { UploadCloud, Info } from "lucide-react";
import Swal from "sweetalert2";
import UsersList from "./UsersList";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [AlumniID, setAlumniID] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const alumniUsers = data.filter((user) => user.role === "alumni");
        setUsers(alumniUsers);
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!AlumniID) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select an Excel file containing Alumni IDs.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("alumniFile", AlumniID);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:5000/upload-alumni-ids", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            setUploadProgress(100);
            Swal.fire({
              icon: "success",
              title: "Upload Complete",
              text: response.message || "Alumni ID file uploaded successfully!",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Upload Failed",
              text: response.message || "An error occurred while uploading.",
            });
          }
        } catch (parseError) {
          Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Something went wrong while processing the server response.",
          });
        }

        setAlumniID("");
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Check your internet connection and try again.",
        });
        setAlumniID("");
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading Alumni IDs:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again later.",
      });
      setAlumniID("");
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-50 overflow-x-hidden">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              Upload Alumni ID List

              {/* 🟦 Info Button with Tooltip */}
              <div className="relative group">
                <button
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-1.5 rounded-full hover:scale-105 transition transform"
                >
                  <Info size={16} />
                </button>

                {/* Tooltip Box (now positioned BELOW the icon) */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition duration-200 z-20 w-80 bg-white border border-gray-200 shadow-xl rounded-lg p-4 text-sm text-gray-700">
                  {/* Tooltip Arrow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>

                  <p className="font-semibold mb-2 text-blue-600">
                    📄 Upload Instructions
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Upload an Excel file (<strong>.xlsx</strong> or <strong>.xls</strong>).</li>
                    <li>The first column header must be <strong>AlumniID</strong>.</li>
                    <li>Each row should contain one alumni ID.</li>
                  </ul>

                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-2">
                    <table className="text-xs border-collapse border border-gray-300 w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 text-gray-800 text-left">
                            AlumniID
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-gray-300 px-2 py-1">2021001</td></tr>
                        <tr><td className="border border-gray-300 px-2 py-1">2021002</td></tr>
                        <tr><td className="border border-gray-300 px-2 py-1">2021003</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </h2>
          </div>

          {/* Upload Input */}
          <div className="flex items-center border border-gray-300 p-3 rounded-lg bg-gray-50">
            <input
              onChange={(e) => setAlumniID(e.target.files[0])}
              type="file"
              accept=".xlsx,.xls"
              className="flex-1 text-gray-600 bg-transparent focus:outline-none"
            />
            <button
              onClick={handleUpload}
              className="ml-3 flex items-center px-5 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition duration-300"
            >
              <UploadCloud size={18} className="mr-2" />
              Upload
            </button>
          </div>

          {/* Progress Bar */}
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>

        {/* Users List Section */}
        <div className="space-y-6 mb-24">
          <UsersList />
        </div>
      </div>
    </div>
  );
}
