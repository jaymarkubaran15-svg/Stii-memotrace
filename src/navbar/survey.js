import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../navbar/sidebar";

export default function GTSPage() {
  const [schema, setSchema] = useState({ sections: [] });
  const [submissions, setSubmissions] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
const [selectedBatch, setSelectedBatch] = useState("");

  // Auto map outcomes based on question label
  const autoMapOutcome = (fieldLabel) => {
    const label = fieldLabel.toLowerCase();

    if (label.includes("competenc")) return "Knowledge & Skills";
    if (
      label.includes("strengthen") ||
      label.includes("training") ||
      label.includes("internship") ||
      label.includes("facilities")
    )
      return "Application";
    if (label.includes("job relevance") || label.includes("industry alignment"))
      return "Application";
    if (label.includes("satisfaction") || label.includes("benefits") || label.includes("compensation"))
      return "Values / Application";
    if (label.includes("career") || label.includes("advancement") || label.includes("promotion"))
      return "Skills & Lifelong Learning";
    if (label.includes("further studies") || label.includes("graduate"))
      return "Lifelong Learning";
    if (
      label.includes("teamwork") ||
      label.includes("leadership") ||
      label.includes("adaptability") ||
      label.includes("ethics") ||
      label.includes("ability") ||
      label.includes("communication")
    )
      return "Skills, Values, Lifelong Learning";

    return "General Outcome";
  };

  // Fetch schema
  useEffect(() => {
    fetch("/api/survyschema")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.schema) {
          const fixed = {
            ...result.schema,
            sections: (result.schema.sections || []).map((sec) => ({
              ...sec,
              fields: sec.fields || [],
            })),
          };
          setSchema(fixed);
        }
      });
  }, []);

  // Fetch submissions
useEffect(() => {
  fetch("/api/allsubmissions")
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        setSubmissions(result.data || []);
      }
    })
    .catch((err) => console.error("Error fetching all submissions:", err));
}, []);

  // ✅ Get all unique batches (from alumni batch_year)
const getAllBatches = () => {
  const batches = submissions.map((s) => s.user?.year_graduate || "No Year");
  return [...new Set(batches)];
};

// ✅ Get all unique programs (from alumni course)
const getAllPrograms = () => {
  const programs = submissions.map((s) => s.user?.course || "Unknown Program");
  return [...new Set(programs)];
};

  // Filter submissions by selected program
  const filteredSubmissions = submissions.filter((s) => {
  return (
    (!selectedProgram || s.user?.course === selectedProgram) &&
    (!selectedBatch || s.user?.year_graduate === selectedBatch)
  );
});


// Generate chart data (FIXED)
const collectChartData = (field) => {
  const values = filteredSubmissions.flatMap((s) => {
    const val = s.submission?.[field.label];
    return Array.isArray(val) ? val : val ? [val] : [];
  });

  const counts = values.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


  // Field status
  const getFieldStatus = (chartData) => {
    if (!chartData.length) return { label: "No data", color: "#6B7280" };
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const topPercent = (sorted[0].value / total) * 100;
    if (topPercent >= 60) return { label: "Majority", color: "#10B981" };
    if (topPercent >= 40) return { label: "Mixed", color: "#F59E0B" };
    return { label: "Spread", color: "#EF4444" };
  };

  // Generate conclusion
  const generateConclusion = (field, chartData) => {
    if (!chartData.length) return "No responses recorded yet.";
    const status = getFieldStatus(chartData);
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const topPercent = ((top.value / total) * 100).toFixed(1);
    switch (status.label) {
      case "Majority":
        return `Majority of respondents (${topPercent}%) chose "${top.name}". Field performing well.`;
      case "Mixed":
        return `"${top.name}" is the top choice (${topPercent}%), but responses are mixed. Consider investigating.`;
      case "Spread":
        return `Responses are spread out; no clear majority. Field needs attention.`;
      default:
        return "No responses yet.";
    }
  };

  // Generate recommendation
  const generateRecommendation = (field, chartData) => {
    if (!chartData.length) return "No recommendation yet.";
    const status = getFieldStatus(chartData);
    const outcomeDomain = autoMapOutcome(field.label);

    switch (outcomeDomain) {
      case "Knowledge & Skills":
        return status.label === "Majority"
          ? "Maintain strong competency-based training."
          : "Enhance training in weaker skill areas.";
      case "Application":
        return status.label === "Majority"
          ? "Continue current practical and internship programs."
          : "Increase hands-on training and industry linkages.";
      case "Values / Application":
        return status.label === "Majority"
          ? "Maintain current programs that promote job satisfaction and ethics."
          : "Review programs to improve employee satisfaction and workplace values.";
      case "Skills & Lifelong Learning":
        return status.label === "Majority"
          ? "Support career advancement and leadership programs."
          : "Offer additional training in leadership, adaptability, and professional growth.";
      case "Lifelong Learning":
        return status.label === "Majority"
          ? "Encourage alumni to pursue graduate studies and research."
          : "Provide guidance and resources for further studies and lifelong learning.";
      case "Skills, Values, Lifelong Learning":
        return status.label === "Majority"
          ? "Continue emphasizing teamwork, leadership, ethics, and communication."
          : "Introduce more activities to strengthen soft skills and values.";
      default:
        return "Continuous monitoring and curriculum review recommended.";
    }
  };

  const exportPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("Survey Analytics Report", pageWidth / 2, 20, { align: "center" });

  // 🟢 Add filters summary at top
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(
    `Program: ${selectedProgram || "All Programs"} | Batch: ${selectedBatch || "All Batches"}`,
    14,
    37
  );
  doc.text(
    `Total Respondents: ${filteredSubmissions.length}`,
    14,
    44
  );

  const fields = schema.sections.flatMap((s) => s.fields);
  const filteredFields = selectedField
    ? fields.filter((f) => f.label === selectedField)
    : fields;

  let startY = 55;

  filteredFields.forEach((field, idx) => {
    // Main data (filtered submissions)
    const chartData = collectChartData(field);
    const status = getFieldStatus(chartData);
    const conclusion = generateConclusion(field, chartData);
    const recommendation = generateRecommendation(field, chartData);
    const outcomeDomain = autoMapOutcome(field.label);

    // Section title
    doc.setFontSize(14);
    doc.text(`${idx + 1}. ${field.label}`, 14, startY);
    startY += 6;

    // 🟢 Add total responses count for this field
    doc.setFontSize(10);
    doc.text(
      `Total responses recorded for this field: ${chartData.reduce(
        (sum, d) => sum + d.value,
        0
      )}`,
      14,
      startY
    );
    startY += 6;

    // Table of main responses
if (chartData.length) {
  const tableData = chartData
    .map((d) => {
      const percentage = ((d.value / filteredSubmissions.length) * 100).toFixed(1);
      return { name: d.name, value: d.value, percentage: parseFloat(percentage) };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .map((d) => [d.name, d.value, `${d.percentage}%`]);

  autoTable(doc, {
    startY,
    head: [["Option", "Count", "Percentage"]],
    body: tableData,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });
  startY = doc.lastAutoTable.finalY + 6;
}


    // Comparison across programs (only when All Programs is selected)
    if (!selectedProgram) {
      const programs = getAllPrograms();
      const comparisonData = [];

      programs.forEach((prog) => {
        const progSubmissions = submissions.filter(
          (s) => (s.user?.course || "Unknown Program") === prog
        );
        const progChartData = progSubmissions.flatMap((s) => {
          const val = s.submission?.[field.label];
          return Array.isArray(val) ? val : val ? [val] : [];
        });

        const counts = progChartData.reduce((acc, v) => {
          acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {});
        const total = progSubmissions.length;

        Object.entries(counts).forEach(([option, count]) => {
          comparisonData.push([
            prog,
            option,
            count,
            total ? `${((count / total) * 100).toFixed(1)}%` : "0%",
          ]);
        });
      });

      if (comparisonData.length) {

  const sortedComparison = comparisonData.sort((a, b) => {
    const percentA = parseFloat(a[3]);
    const percentB = parseFloat(b[3]);
    return percentB - percentA;
  });

  doc.setFontSize(10);
  doc.text(
    `Program comparison based on ${submissions.length} total submissions`,
    14,
    startY
  );
  startY += 4;

  autoTable(doc, {
    startY,
    head: [["Program", "Option", "Count", "Percentage"]],
    body: sortedComparison,
    theme: "grid",
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  startY = doc.lastAutoTable.finalY + 6;
}

    }

    // Add mapping + interpretation
    autoTable(doc, {
      startY,
      head: [["Mapped CMO 46 Outcome", "Interpretation", "Recommendation"]],
      body: [[outcomeDomain, conclusion, recommendation]],
      theme: "grid",
      styles: { fontSize: 9, cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 70 },
        2: { cellWidth: 70 },
      },
      margin: { left: 14, right: 14 },
    });

    startY = doc.lastAutoTable.finalY + 10;
    if (startY > 270) {
      doc.addPage();
      startY = 20;
    }
  });

  // 🟢 Final summary at bottom
  doc.setFontSize(11);
  doc.text(
    `End of Report — Total Respondents: ${filteredSubmissions.length}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save("GTS_Analytics.pdf");
};


  const DynamicCharts = () => {
    if (!schema.sections.length || !submissions.length) {
      return <p className="text-gray-500">No submissions yet</p>;
    }

    const fields = schema.sections.flatMap((section) => section.fields);
    const filteredFieldsByField = selectedField
      ? fields.filter((f) => f.label === selectedField)
      : fields;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {filteredFieldsByField.map((field) => {
          const chartData = collectChartData(field);
          if (!chartData.length) return null;
          const status = getFieldStatus(chartData);
          const conclusion = generateConclusion(field, chartData);

          return (
            <div
              key={field.label}
              className="p-4 bg-white shadow rounded-2xl w-full overflow-x-auto"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{field.label}</h3>
                <span
                  className={`px-2 py-1 rounded text-white text-sm`}
                  style={{ backgroundColor: status.color }}
                >
                  {status.label}
                </span>
              </div>

              {field.type === "radio" && (
                <div className="w-full overflow-auto">
                  <PieChart width={Math.min(300, window.innerWidth - 60)} height={250}>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][i % 4]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              )}

              {field.type === "checkbox" && (
                <div className="w-full overflow-auto">
                  <BarChart
                    width={Math.min(350, window.innerWidth - 60)}
                    height={250}
                    data={chartData}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </div>
              )}

              <p className="mt-3 text-sm text-gray-700 italic">{conclusion}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const allFields = schema.sections.flatMap((s) => s.fields);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 min-h-screen p-6 md:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <h1 className="text-2xl font-bold mb-4">Survey Analytics</h1>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
           <div className="w-full sm:w-1/3">
              <label className="block mb-2 font-medium text-gray-700">
                Select a batch
              </label>
              <div className="relative">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full border rounded px-3 py-2 pr-10 bg-white appearance-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">All Batch</option>
                  {getAllBatches().map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
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

            <div className="w-full sm:w-1/2">
              <label className="block mb-2 font-medium text-gray-700">
                Select a program
              </label>
              <div className="relative">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full border rounded px-3 py-2 pr-10 bg-white appearance-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Programs</option>
                {getAllPrograms().map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
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

            <div className="w-full sm:w-1/2">
              <label className="block mb-2 font-medium text-gray-700">
                Select a field to analyze
              </label>
               <div className="relative">
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full border rounded px-3 py-2 pr-10 bg-white appearance-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Fields</option>
                {allFields.map((f) => (
                  <option key={f.label} value={f.label}>
                    {f.label}
                  </option>
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

            <div className="w-full sm:w-auto">
              <button
                onClick={exportPDF}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md"
              >
                Export PDF
              </button>
            </div>
          </div>

          <DynamicCharts />
        </div>
      </div>
    </div>
  );
}
