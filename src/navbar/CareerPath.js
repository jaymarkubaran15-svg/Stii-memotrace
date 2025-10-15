import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import UserCard from './UserCard';

import Sidebar from "../navbar/sidebar";

const COLORS = ["#4F46E5", "#22C55E", "#EAB308", "#F43F5E", "#0EA5E9"];

export default function CareerPathDashboard() {
  const [works, setWorks] = useState([]);
  const [educations, setEducations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Fetch data
  useEffect(() => {
    fetch("/api/allalumni")
      .then((res) => res.json())
      .then((data) => {
        const uniqueCourses = [...new Set(data.map((a) => a.course))];
        const uniqueYears = [...new Set(data.map((a) => a.year_graduate))];
        setCourses(uniqueCourses);
        setYears(uniqueYears);
      });

    fetch("/api/workdata")
      .then((res) => res.json())
      .then((data) => setWorks(data));

    fetch("/api/educationdata")
      .then((res) => res.json())
      .then((data) => setEducations(data));
  }, []);

  // Filter data
  const filteredWork = works.filter(
    (w) =>
      (selectedCourse ? w.course === selectedCourse : true) &&
      (selectedYear ? w.year_graduate === selectedYear : true)
  );

  const filteredEducation = educations.filter(
    (e) =>
      (selectedCourse ? e.course === selectedCourse : true) &&
      (selectedYear ? e.year_graduate === selectedYear : true)
  );

  // Summaries
  const workSummary = Object.values(
    filteredWork.reduce((acc, curr) => {
      const key = curr.company?.trim() || "Unknown";
      if (!acc[key]) acc[key] = { name: key, count: 0 };
      acc[key].count++;
      return acc;
    }, {})
  );

  const educationSummary = Object.values(
    filteredEducation.reduce((acc, curr) => {
      const key = curr.field_of_study || "Unknown";
      if (!acc[key]) acc[key] = { name: key, count: 0 };
      acc[key].count++;
      return acc;
    }, {})
  );

  const pursuingCount = filteredEducation.length;
  const workingCount = filteredWork.length;

  const overallData = [
    { name: "Currently Working", value: workingCount },
    { name: "Pursuing Education", value: pursuingCount },
  ];

  // ===== Export Handlers =====
  const exportCSV = () => {
    const rows = [
      ["Category", "Name", "Count"],
      ...workSummary.map((item) => ["Employment", item.name, item.count]),
      ...educationSummary.map((item) => ["Education", item.name, item.count]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `career_path_${selectedCourse || "all"}_${selectedYear || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Career Path Dashboard Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Course: ${selectedCourse || "All"}`, 14, 30);
    doc.text(`Year Graduated: ${selectedYear || "All"}`, 14, 38);

    autoTable(doc, {
      startY: 50,
      head: [["Category", "Name", "Count"]],
      body: [
        ...workSummary.map((item) => ["Employment", item.name, item.count]),
        ...educationSummary.map((item) => ["Education", item.name, item.count]),
      ],
    });

    doc.save(`career_path_${selectedCourse || "all"}_${selectedYear || "all"}.pdf`);
  };

  return (

    <div className="p-8 bg-gray-100 min-h-screen">
             <Sidebar />
    <div className="flex-1 p-6 md:ml-64 bg-gray-100 min-h-screen">   
      <motion.h1
        className=" text-2xl font-bold text-gray-800 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🎓 Career Path Dashboard
      </motion.h1>

      {/* Filters + Export Buttons */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <select
          className="p-2 rounded border bg-white mb:max-w-12"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="p-2 rounded border bg-white"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y, i) => (
            <option key={i} value={y}>
              {y}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
          >
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Work Chart */}
        {/* Work Chart */}
<motion.div
  className="bg-white rounded-2xl shadow p-6"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-700">
      💼 Alumni Employment Distribution
    </h2>
    <span className="text-sm text-gray-500">
      Total Respondents: <strong>{filteredWork.length}</strong>
    </span>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={workSummary}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#4F46E5" name="Alumni Count" />
    </BarChart>
  </ResponsiveContainer>
</motion.div>

{/* Education Chart */}
<motion.div
  className="bg-white rounded-2xl shadow p-6"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-700">
      🎓 Pursued Education Fields
    </h2>
    <span className="text-sm text-gray-500">
      Total Respondents: <strong>{filteredEducation.length}</strong>
    </span>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={educationSummary}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#22C55E" name="Alumni Count" />
    </BarChart>
  </ResponsiveContainer>
</motion.div>

{/* Overall Summary Pie */}
<motion.div
  className="bg-white rounded-2xl shadow p-6 col-span-1 md:col-span-2"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-700">
      🧩 Overall Career Path Summary
    </h2>
    <span className="text-sm text-gray-500">
      Total Respondents: <strong>{workingCount + pursuingCount}</strong>
    </span>
  </div>
  <ResponsiveContainer width="100%" height={350}>
    <PieChart>
      <Pie
        data={overallData}
        dataKey="value"
        nameKey="name"
        outerRadius={130}
        label
      >
        {overallData.map((entry, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</motion.div>

      </div>
         <div className="space-y-6 mb-24">
        <UserCard />
        </div>
    </div>
    </div>    
  );
}
