import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

export default function AlumniTable() {
  const [alumni, setAlumni] = useState([]);
  const [filteredAlumni, setFilteredAlumni] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch data
  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/alumni")
      .then((res) => res.json())
      .then((data) => {
        setAlumni(data);
        setFilteredAlumni(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching alumni:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Filter + search logic
  useEffect(() => {
    let results = alumni;

    if (selectedBatch !== "All") {
      results = results.filter((a) => a.year_graduate === selectedBatch);
    }

    if (selectedCourse !== "All") {
      results = results.filter((a) => a.course === selectedCourse);
    }

    if (search.trim() !== "") {
      const term = search.toLowerCase();
      results = results.filter(
        (a) =>
          `${a.first_name} ${a.middle_name} ${a.last_name}`
            .toLowerCase()
            .includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.mobileNumber?.toLowerCase().includes(term)
      );
    }

    setFilteredAlumni(results);
  }, [search, selectedBatch, selectedCourse, alumni]);

  const batches = ["All", ...new Set(alumni.map((a) => a.year_graduate))];
  const courses = ["All", ...new Set(alumni.map((a) => a.course))];

  // ✅ Export single alumni
  const exportSingle = (a) => {
    const doc = new jsPDF();
    doc.text(`Alumni Profile: ${a.first_name} ${a.last_name}`, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Full Name", `${a.first_name} ${a.middle_name || ""} ${a.last_name}`],
        ["Email", a.email],
        ["Mobile Number", a.mobileNumber || "—"],
        ["Address", a.address || a.currentAddress || "—"],
        ["Gender", a.gender || "—"],
        ["Status", a.civilStatus || "—"],
        ["Course", a.course || "—"],
        ["Batch", a.year_graduate || "—"],
      ],
    });
if (a.work?.length) {
  // Sort by end_date so that "Present" or latest comes first
  const sortedWork = [...a.work].sort((a, b) => {
    const endA = a.end_date ? new Date(a.end_date) : new Date(); // treat "Present" as current date
    const endB = b.end_date ? new Date(b.end_date) : new Date();
    return endB - endA; // descending (most recent first)
  });

  doc.text("Work Experience", 14, doc.lastAutoTable.finalY + 10);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [["Position", "Company", "Start", "End"]],
    body: sortedWork.map((w) => [
      w.position,
      w.company,
      w.start_date?.slice(0, 10) || "",
      w.end_date?.slice(0, 10) || "Present",
    ]),
  });
}


    if (a.education?.length) {
      doc.text("Educational Attainment  ", 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Program", "Field", "Institution", "Start", "End"]],
        body: a.education.map((e) => [
          e.programType,
          e.fieldOfStudy,
          e.institutionName,
          e.startDate?.slice(0, 10) || "",
          e.endDate?.slice(0, 10) || "Ongoing",
        ]),
      });
    }

    doc.save(`${a.first_name}_${a.last_name}_Profile.pdf`);
  };

// ✅ Export all alumni (with Work & Education)
const exportAll = () => {
  const doc = new jsPDF();
  doc.text("All Alumni Records", 14, 15);

  let y = 25; // current vertical position in the PDF

  filteredAlumni.forEach((a, index) => {
    // 🧍‍♂️ Alumni Info Table
    autoTable(doc, {
      startY: y,
      head: [["#", "Full Name", "Email", "Course", "Batch", "Mobile", "Gender", "Status"]],
      body: [
        [
          index + 1,
          `${a.first_name} ${a.middle_name || ""} ${a.last_name}`,
          a.email,
          a.course || "—",
          a.year_graduate || "—",
          a.mobileNumber || "—",
          a.gender || "—",
          a.civilStatus || "—",
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    // Update Y position for next section
    y = doc.lastAutoTable.finalY + 5;

    // 🏢 Work Experience
    if (a.work && a.work.length > 0) {
      doc.text(`Work Experience`, 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [["Position", "Company", "Start", "End"]],
        body: a.work.map((w) => [
          w.position,
          w.company,
          w.end_date ? w.end_date.slice(0, 10) : "Present",
          w.start_date ? w.start_date.slice(0, 10) : "",
        ]),
        theme: "striped",
        styles: { fontSize: 8 },
      });

      y = doc.lastAutoTable.finalY + 5;
    } else {
      doc.text(`No work experience available.`, 14, y);
      y += 10;
    }

    // 🎓 Education
    if (a.education && a.education.length > 0) {
      doc.text(`Educational Attentment`, 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [["Program", "Field", "Institution", "Start", "End"]],
        body: a.education.map((e) => [
          e.programType || "—",
          e.fieldOfStudy || "—",
          e.institutionName || "—",
          e.endDate ? e.endDate.slice(0, 10) : "Ongoing",
          e.startDate ? e.startDate.slice(0, 10) : "",
        ]),
        theme: "striped",
        styles: { fontSize: 8 },
      });

      y = doc.lastAutoTable.finalY + 10;
    } else {
      doc.text(`No education records available.`, 14, y);
      y += 10;
    }

    // 🧾 Page break if needed
    if (y > 260 && index !== filteredAlumni.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("All_Alumni_With_Work_Education.pdf");
};

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading alumni...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-center">
         Alumni Recordes ({filteredAlumni.length} total)
      </h2>
<div className="flex flex-wrap gap-3 mb-6 justify-center items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
  {/* Search Input */}
  <input
    type="text"
    placeholder="Search by name, email, or mobile..."
    className="border border-gray-300 rounded-lg px-3 py-2 w-64 bg-white 
               shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               placeholder-gray-400 text-sm transition duration-200"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {/* Batch Dropdown */}
  <div className="relative">
    <select
      className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                 text-sm transition duration-200"
      value={selectedBatch}
      onChange={(e) => setSelectedBatch(e.target.value)}
    >
      <option value="" disabled>Select Batch</option>
      {batches.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </select>
    {/* Custom Dropdown Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

  {/* Course Dropdown */}
  <div className="relative">
    <select
      className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                 text-sm transition duration-200"
      value={selectedCourse}
      onChange={(e) => setSelectedCourse(e.target.value)}
    >
      <option value="" disabled>Select Course</option>
      {courses.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

  {/* Export Button */}
  <button
    onClick={exportAll}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg 
               flex items-center gap-2 shadow-md text-sm font-medium transition duration-200"
  >
    <Download size={18} /> Export All
  </button>
</div>


      {/* 🧾 Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border text-center w-12">#</th>
              <th className="p-2 border">Full Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Mobile</th>
              <th className="p-2 border">Gender</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Educational Attainment</th>
              <th className="p-2 border">Batch</th>
              <th className="p-2 border">Work Experience</th>
              <th className="p-2 border text-center">Export</th>
            </tr>
          </thead>

          <tbody>
            {filteredAlumni.map((a, index) => (
              <tr key={a.id} className="hover:bg-gray-50 align-top">
                <td className="p-2 border text-center font-medium">{index + 1}</td>
                <td className="p-2 border">
                  {a.first_name} {a.middle_name} {a.last_name}
                </td>
                <td className="p-2 border">{a.email}</td>
                <td className="p-2 border">{a.mobileNumber || "—"}</td>
                <td className="p-2 border">{a.gender || "—"}</td>
                <td className="p-2 border">{a.civilStatus || "—"}

                </td>
                <td className="p-2 border">{a.course || "—"}
                      {a.education?.length > 0 && (
                          <div className="mt-2">
                            <ul className="list-disc list-inside">
                              {a.education.map((e) => (
                                <li key={e.id}>
                                  {e.programType} in {e.fieldOfStudy} ({e.startDate?.slice(0, 10)} –{" "}
                                  {e.endDate ? e.endDate.slice(0, 10) : "Ongoing"})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                </td>
                <td className="p-2 border text-center">{a.year_graduate || "—"}</td>

                <td className="p-2 border">
                    {a.work?.length > 0 ? (
                      <>
                        {a.work?.length > 0 && (
                          <div>
                            <ul className="list-disc list-inside">
                              {a.work.map((w) => (
                                <li key={w.id}>
                                  {w.position} at {w.company} (
                                  {w.start_date ? w.start_date.slice(0, 10) : ""} –{" "}
                                  {w.end_date ? w.end_date.slice(0, 10) : "Present"})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </>
                    ) : (
                      <span className="text-gray-500 italic">No Work Experience</span>
                    )}
                  </td>


                <td className="p-2 border text-center">
                  <button
                    onClick={() => exportSingle(a)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
                  >
                      <Download size={18} />  Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}