import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import Sidebar from "../navbar/sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UploadCloud } from "lucide-react";
import Swal from "sweetalert2";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [AlumniID, setAlumniID] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedYear, setSelectedYear] = useState("");


   useEffect(() => {
  fetch("https://server-1-gjvd.onrender.com/api/users")
    .then((res) => res.json())
    .then((data) => {
      const alumniUsers = data.filter(user => user.role === "alumni");
      setUsers(alumniUsers);
    })
    .catch((err) => console.error("Error fetching users:", err));
}, []);

// Get unique courses and years for dropdowns
const courses = [...new Set(users.map(u => u.course).filter(Boolean))];
const years = [...new Set(users.map(u => u.year_graduate).filter(Boolean))];

    
    


// Apply search + course + year filters
const filteredUsers = users.filter((user) => {
  const fullName = `${user.first_name} ${user.middle_name || ""} ${user.last_name}`.toLowerCase();
  const matchesSearch = fullName.includes(search.toLowerCase());
  const matchesCourse = selectedCourse ? user.course === selectedCourse : true;
  const matchesYear = selectedYear ? String(user.year_graduate) === String(selectedYear) : true;
  return matchesSearch && matchesCourse && matchesYear;
});


const exportPDF = async () => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  // ===== Helper Functions =====
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const addSectionTitle = (title, yPos) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPos);
    doc.setFont("helvetica", "normal");
  };

  const lineBreak = (y, height = 6) => y + height;

  // ===== Get current filtered users =====
const filteredList = users.filter((user) => {
  const fullName = `${user.first_name} ${user.middle_name || ""} ${user.last_name}`.toLowerCase();
  const matchesSearch = fullName.includes(search.toLowerCase());
  const matchesCourse = selectedCourse ? user.course === selectedCourse : true;
  const matchesYear = selectedYear ? String(user.year_graduate) === String(selectedYear) : true;
  return matchesSearch && matchesCourse && matchesYear;
});

// ===== Fetch GTS submissions =====
let submissions = [];
try {
  const res = await fetch("https://server-1-gjvd.onrender.com/api/allsubmissions");
  const data = await res.json();
  submissions = Array.isArray(data) ? data : data.submissions || data.data || [];


  // Ensure it's an array of objects with user_id and answers_json
  if (Array.isArray(data)) {
    submissions = data;
  } else if (Array.isArray(data.submissions)) {
    submissions = data.submissions;
  } else if (Array.isArray(data.data)) {
    submissions = data.data;
  } else {
    console.warn("Unexpected submissions format:", data);
    submissions = [];
  }

  // Parse JSON answers for each submission
  submissions = submissions.map((s) => ({
    ...s,
    answers: typeof s.answers_json === "string" ? JSON.parse(s.answers_json) : s.answers_json,
  }));
} catch (error) {
  console.error("Failed to fetch GTS submissions:", error);
  submissions = [];
}


  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Alumni and GTS Report", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });

  let y = 30;

  // ===== LOOP THROUGH USERS =====
  for (let i = 0; i < filteredList.length; i++) {
    const user = filteredList[i];
    const submission = submissions.find((s) => String(s.user_id) === String(user.id));

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    addSectionTitle(`${i + 1}. ${user.first_name} ${user.last_name}`, y);
    y = lineBreak(y);

    // Alumni info table
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
      head: [["Field", "Information"]],
      body: [
        ["Course", user.course || "-"],
        ["Year Graduated", user.year_graduate || "-"],
        ["Email", user.email || "-"],
        ["Contact", user.mobileNumber   || "-"],
        ["Address", user.address || "-"],
        ["Birthday", formatDate(user.birthday)],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
    });

    y = doc.lastAutoTable.finalY + 4;

     // ===== GTS Survey section =====
addSectionTitle("GTS Survey Answers", y);
y = lineBreak(y);

if (submission && submission.submission) {
  const gtsData = [];

  for (const [question, answer] of Object.entries(submission.submission)) {
    if (!answer) continue;

    // Handle various answer types
    if (typeof answer === "string") {
      gtsData.push([question, answer || "-"]);
    } else if (Array.isArray(answer)) {
      gtsData.push([question, answer.join(", ") || "-"]);
    } else if (typeof answer === "object") {
      // Handle structured GTS sections like training tables
      if (answer.columns && answer.values) {
        gtsData.push([question, "See details below 👇"]);

        // add small subtable for structured data
        autoTable(doc, {
          startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : y + 6,
          margin: { left: 18, right: 14 },
          styles: { fontSize: 8 },
          head: [answer.columns],
          body: answer.values.length ? answer.values : [["-", "-", "-"]],
          theme: "grid",
          headStyles: { fillColor: [100, 100, 100] },
        });

        y = doc.lastAutoTable.finalY + 4;
        continue; 
      } else {
        gtsData.push([question, JSON.stringify(answer)]);
      }
    }
  }

  // Create main GTS summary table
  if (gtsData.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellWidth: "wrap" },
      head: [["Question", "Answer"]],
      body: gtsData,
      theme: "striped",
      headStyles: { fillColor: [52, 73, 94] },
      didDrawPage: (data) => {
        y = data.cursor.y;
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  }
} else {
  doc.setFontSize(10);
  doc.text("No GTS submission found for this user.", 16, y);
  y = lineBreak(y, 10);
}

  }

// ===== SUMMARY PAGE =====
doc.addPage();
doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("Summary Overview", 105, 20, { align: "center" });

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text(`Total Alumni Exported: ${filteredList.length}`, 20, 35);
doc.text(`Total GTS Responses Found: ${
  submissions.filter(s => filteredList.some(u => String(u.id) === String(s.user_id))).length
}`, 20, 42);


doc.text(`Applied Filters:`, 20, 55);
doc.text(`• Search: ${search || "None"}`, 25, 62);
doc.text(`• Course: ${selectedCourse || "All"}`, 25, 69);
doc.text(`• Year Graduated: ${selectedYear || "All"}`, 25, 76);

doc.text("This summary includes all alumni filtered by your current view.", 20, 90);

// ✅ Add this line — triggers the download
doc.save(`Alumni_GTS_Report_${new Date().toISOString().split("T")[0]}.pdf`);

};


  
const downloadUserPDF = async (user) => {
  try {
    const res = await fetch(`https://server-1-gjvd.onrender.com/api/submission/${user.id}`);
    const data = await res.json();
    const answers = data.answers || {};

    const doc = new jsPDF();
    let questionCounter = 1; // <--- counter added

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    const calculateAge = (birthday) => {
      if (!birthday) return "-";
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    };

    // --- User Info ---
    doc.setFontSize(14);
    doc.text("Alumni Information", 14, 15);

    const userDetails = [
      ["First Name", user.first_name || "-"],
      ["Middle Name", user.middle_name || "-"],
      ["Last Name", user.last_name || "-"],
      ["Birthday", formatDate(user.birthday)],
      ["Age", calculateAge(user.birthday)],
      ["Civil Status", user.civilStatus || "-"],
      ["Contact", user.mobileNumber || "-"],
      ["Course", user.course || "-"],
      ["Alumni Card Number", user.alumni_card_number || "-"],
      ["Email", user.email || "-"],
      ["Address", user.address || "-"],
      ["Verification", user.is_verified ? "Verified" : "Not Verified"],
    ];

    autoTable(doc, {
      body: userDetails,
      theme: "grid",
      styles: { fontSize: 11 },
      startY: 25,
    });

    // --- Survey Answers ---
    if (answers && Object.keys(answers).length > 0) {
      doc.addPage();
      doc.text("GTS ANSWERS", 14, 15);

      const renderAnswers = (obj, prefix = "", startY = 25) => {
        let body = [];

        Object.entries(obj).forEach(([key, value]) => {
          // MATRIX TABLE
          if (value && typeof value === "object" && !Array.isArray(value) && "rows" in value && "columns" in value && "values" in value) {
            autoTable(doc, {
              startY,
              head: [[`${prefix}${key}`, ...value.columns.map(c => c || "-")]],
              body: value.values.map((rowValues, rIdx) => [
                value.rows[rIdx] || "-",
                ...rowValues.map(cell => {
                  const normalized = String(cell).toLowerCase();
                  if (["true", "1", "yes"].includes(normalized)) return "Yes";
                  if (["false", "0", "no"].includes(normalized)) return "No";
                  return cell || "-";
                })
              ]),
              theme: "grid",
              styles: { fontSize: 9 },
              margin: { left: 14 },
            });

            startY = doc.lastAutoTable.finalY + 10;

          // NESTED OBJECT
          } else if (value && typeof value === "object" && !Array.isArray(value)) {
            const nested = renderAnswers(value, `${prefix}${key}.`, startY);
            startY = nested.startY;
            body.push(...nested.body);

          // ARRAY
          } else if (Array.isArray(value)) {
            value.forEach((v, i) =>
              body.push([`${questionCounter++}. ${prefix}${key}.${i}`, v || "-"])
            );

          // SINGLE VALUE
          } else {
            body.push([`${questionCounter++}. ${prefix}${key}`, value || "-"]);
          }
        });

        return { body, startY };
      };

      const { body, startY } = renderAnswers(answers);

      if (body.length > 0) {
        autoTable(doc, {
          head: [["#", "Question / Field", "Answer"]],
          body: body.map(([question, answer]) => {
            const parts = question.split(". ");
            return [parts[0], parts.slice(1).join(". "), answer];
          }),
          theme: "striped",
          startY,
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        });
      }
    }

    doc.save(`${user.first_name}_${user.last_name}_info.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    Swal.fire({
      icon: "error",
      title: "Download Failed",
      text: "Unable to fetch survey answers.",
    });
  }
};




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
    xhr.open("POST", "/upload-alumni-ids", true);

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
 
        <div className="flex  min-h-screen ">
            <Sidebar />
            <div className="flex-1 p-6 md:ml-64 bg-gray-50 overflow-x-hidden">
                {/* Upload Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-5 flex justify-between items-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload Alumni ID</h2>
            <div className="flex items-center border border-gray-300 p-3 rounded-lg bg-gray-50">
                <input
                    onChange={(e) => setAlumniID(e.target.files[0])}
                    type="file"
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

                {/* Users Table */}
                <div className="bg-white p-5 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3">
                      <h1 className="text-xl font-bold">All Users</h1>
                      <div className="flex items-center bg-gray-100 p-2 rounded-lg">
                        <FaSearch className="text-gray-500 mr-2" />
                        <input
                          type="text"
                          placeholder="Search"
                          className="outline-none bg-transparent"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  
                      {/* Filters Row */}
                      <div className="flex gap-6 mb-4">
                        <div className="flex flex-col">
                          <label className="text-sm text-gray-600 mb-1">Filter by Course</label>
                          <div className="relative">
                          <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="border p-2 rounded w-48 appearance-none "
                          >
                            <option value="">All Courses</option>
                            {courses.map((course, i) => (
                              <option key={i} value={course}>{course}</option>
                            ))}
                          </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-sm text-gray-600 mb-1">Filter by Year Graduate</label>
                          <div className="relative">
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border p-2 rounded w-48 appearance-none"
                          >
                            <option value="">All Years</option>
                            {years.map((year, i) => (
                              <option key={i} value={year}>{year}</option>
                            ))}
                          </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                  />
                             </svg>
                           </div>
                          </div>
                        </div>
                          <div className="flex mt-4">
                            <button
                              onClick={exportPDF}
                              disabled={filteredUsers.length === 0}
                              className={`px-3 py-1 rounded ${
                                filteredUsers.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              Export Users
                            </button>

                          </div>

                      </div>

                      <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 text-center">Files</th>
                                <th className="p-2 text-center">Name</th>
                                <th className="p-2 text-center">Middle Name</th>
                                <th className="p-2 text-center">Last Name</th>
                                <th className="p-2 text-center">Alumni Card Number</th>
                                <th className="p-2 text-center">Email</th>
                                <th className="p-2 text-center">Address</th>
                                <th className="p-2 text-center">Course</th>
                                <th className="p-2 text-center">Virification</th>
                            </tr>
                        </thead>
                 <tbody>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-3">  <button
                              onClick={() => downloadUserPDF(user)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                              Download
                            </button>
                            </td>
                            <td className="p-3">{`${user.first_name}`}</td>
                            <td className="p-3">{`${user.middle_name || ""}`}</td>
                            <td className="p-3">{`${user.last_name}`}</td>
                            <td className="p-3">{user.alumni_card_number}</td>
                            <td className="p-3">{user.email || "-"}</td>
                            <td className="p-3">{user.address || "-"}</td>
                            <td className="p-3">{user.course || "-"}</td>
                            <td className="p-3">{user.is_verified ? "Verified" : "Not Verified"}</td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td className="p-3 text-center" colSpan={9}>
                            No registrar user yet
                        </td>
                        </tr>
                    )}
                    </tbody>

                    </table>
                    </div>
                    <h1 className="text-sm font-semibold mt-2">
                            Verified: ({filteredUsers.filter(user => user.is_verified).length})
                    </h1>
                    <h1 className="text-sm font-semibold">
                            Not Verified: ({filteredUsers.filter(user => !user.is_verified).length})
                    </h1>
                    <h1 className="text-sm font-semibold">
                            Total Users: ({filteredUsers.filter.length})
                    </h1>

                    {/* Pagination Placeholder */}
                    <div className="flex justify-between items-center mt-4">
                      {/* Export Button */}
              
                    <div className="flex justify-end items-end mt-4">
                        <button className="px-3 py-1 bg-gray-200 rounded">Previous</button>
                        <span className="px-3 py-1">1</span>
                        <button className="px-3 py-1 bg-gray-200 rounded">Next</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
