import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import stringSimilarity from "string-similarity";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { courseAlignment, roleSynonyms } from "./courseAlignment";

export default function AlumniProfiles() {
  const [alumni, setAlumni] = useState([]);

  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/alumni_profiles")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAlumni(data);
        else console.error("Expected array, got:", data);
      })
      .catch((err) => console.error("Error fetching alumni profiles:", err));
  }, []);

  // 🔧 Text normalization
  const normalize = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\b(junior|senior|lead|ii|iii|iv|v|specialist|officer)\b/g, "")
      .trim();
  };

  const mapSynonym = (title) => {
    const normalized = normalize(title);
    for (const [key, synonyms] of Object.entries(roleSynonyms)) {
      if (synonyms.includes(normalized)) return key;
    }
    return normalized;
  };

  const findBestCourseMatch = (inputCourse) => {
    if (!inputCourse) return null;

    const normalizedInput = inputCourse
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\b(bs|bsc|bachelor of science in|bachelor in|bachelor)\b/g, "")
      .trim();

    let bestMatch = null;
    let bestScore = 0;

    for (const course of Object.keys(courseAlignment)) {
      const normalizedCourse = course
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\b(bs|bsc|bachelor of science in|bachelor in|bachelor)\b/g, "")
        .trim();

      const similarity = stringSimilarity.compareTwoStrings(normalizedInput, normalizedCourse);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = course;
      }
    }

    return bestScore > 0.4 ? bestMatch : null;
  };

  const getAlignmentScore = (course, position) => {
    if (!course || !position) return 0;

    const matchedCourse = findBestCourseMatch(course);
    if (!matchedCourse) return 0;

    const alignedRoles = courseAlignment[matchedCourse] || [];
    if (!alignedRoles.length) return 0;

    const normalizedPos = mapSynonym(position);
    let bestScore = 0;

    alignedRoles.forEach(({ title, weight }) => {
      const normalizedTitle = mapSynonym(title);
      const posTokens = new Set(normalizedPos.split(/\s+/));
      const titleTokens = new Set(normalizedTitle.split(/\s+/));
      const intersection = [...titleTokens].filter((t) => posTokens.has(t));
      const jaccardScore = intersection.length / new Set([...posTokens, ...titleTokens]).size;
      const fuzzyScore = stringSimilarity.compareTwoStrings(normalizedPos, normalizedTitle);
      const combined = (jaccardScore * 0.5 + fuzzyScore * 0.5) * 100 * weight;
      if (combined > bestScore) bestScore = combined;
    });

    return Math.round(Math.min(100, bestScore));
  };

  const COLORS = ["#22C55E", "#E5E7EB"];

// 🧾 Minimal PDF generator (no Tailwind)
const generatePDF = (alumniList, filename = "alumni_profiles.pdf") => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 20;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Alumni Career Alignment Report", 20, y);
  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, y);
  y += 10;

  alumniList.forEach((a, index) => {
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = 20;
    }

    const alignmentScore = getAlignmentScore(a.course, a.current_position);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(`${a.full_name}`, 20, y);
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Course: ${a.course || "N/A"} (${a.year_graduate || "N/A"})`, 20, y);
    y += 6;
    pdf.text(`Current Position: ${a.current_position || "N/A"}`, 20, y);
    y += 6;
    pdf.text(`Current Company: ${a.current_work || "N/A"}`, 20, y);
    y += 6;

    pdf.text(
      `Pursuing Education: ${
        a.is_pursuing_education
          ? `${a.pursuing_degree || "N/A"} at ${a.pursuing_school || "Unknown"}`
          : "No"
      }`,
      20,
      y
    );
    y += 6;

    pdf.setFont("helvetica", "bold");
    pdf.text(`Alignment Score: ${alignmentScore}%`, 20, y);
    y += 10;

    // Simple visual separator
    pdf.setDrawColor(200);
    pdf.line(20, y, 190, y);
    y += 10;
  });

  pdf.save(filename);
};

// 📄 Export single PDF
const exportSinglePDF = (alumniData) => {
  generatePDF([alumniData], `alumni_${alumniData.alumni_id}.pdf`);
};

// 🌍 Export all alumni sorted A–Z by last name
const exportAllPDF = () => {
  if (!Array.isArray(alumni) || alumni.length === 0) {
    alert("No alumni data available to export.");
    return;
  }

    // Sort by first name (A–Z)
  const sortedAlumni = [...alumni].sort((a, b) => {
    const firstA = a.full_name?.trim().split(" ")[0].toLowerCase() || "";
    const firstB = b.full_name?.trim().split(" ")[0].toLowerCase() || "";
    return firstA.localeCompare(firstB);
  });

  generatePDF(sortedAlumni, "all_alumni_profiles_sorted.pdf");
};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">🎓 Alumni Career Alignment</h1>
        <button
          onClick={exportAllPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
        >
          <Download size={18} /> Export All to PDF
        </button>
      </div>

      {/* Alumni Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumni.map((a) => {
          const alignmentScore = getAlignmentScore(a.course, a.current_position);
          const chartData = [
            { name: "Aligned", value: alignmentScore },
            { name: "Not Aligned", value: 100 - alignmentScore },
          ];

          return (
            <div
              key={a.alumni_id}
              className="relative bg-white border border-gray-200 rounded-2xl shadow-md p-5 hover:shadow-lg transition"
            >
              <button
                onClick={() => exportSinglePDF(a)}
                className="absolute top-3 right-3 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-md"
                title="Export PDF"
              >
                <Download size={16} />
              </button>

              <h2 className="text-lg font-semibold text-indigo-700">{a.full_name}</h2>
              <p className="text-sm text-gray-600 mb-1">
                {a.course} • {a.year_graduate}
              </p>
              <p className="text-sm mb-2">
                <strong>Current Work:</strong>{" "}
                {a.current_position && a.current_work ? (
                  <>{a.current_position} at {a.current_work}</>
                ) : (
                  <span className="text-gray-500">Not available</span>
                )}
              </p>

              {a.is_pursuing_education ? (
                <div className="text-sm text-green-700 mb-2">
                  🎓 <span className="font-medium">Pursuing:</span>{" "}
                  {a.pursuing_degree
                    ? `${a.pursuing_degree} at ${a.pursuing_school || "Unknown"}`
                    : "Details unavailable"}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-2">🎓 Not Pursuing Further Studies</p>
              )}

              <div className="mt-4 h-40">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <p className="text-center text-sm font-medium text-gray-800 mt-2">
                Alignment Score:{" "}
                <span className="text-indigo-700 font-semibold">{alignmentScore}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
