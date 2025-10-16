import React, { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Download, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function CareerDashboard() {
  const [employmentData, setEmploymentData] = useState({});
  const [furtherEduData, setFurtherEduData] = useState({});
  const [occupationData, setOccupationData] = useState({});
  const [industryData, setIndustryData] = useState({});
  const [jobSearchDurationData, setJobSearchDurationData] = useState({});
  const [fieldPursuedData, setFieldPursuedData] = useState({});
  const [firstJobRelatedData, setFirstJobRelatedData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const getAnswer = (submission, keys, defaultValue = "Unspecified") => {
    for (const key of keys) {
      if (submission[key]) return submission[key];
    }
    return defaultValue;
  };

  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/allsubmissions")
      .then((res) => res.json())
      .then(({ data }) => {
        const employmentCounts = {};
        const furtherEduCounts = {};
        const occupationCounts = {};
        const industryCounts = {};
        const jobSearchCounts = {};
        const fieldPursuedCounts = {};
        const firstJobRelatedCounts = {};

        data.forEach(({ submission }) => {
          const employment = getAnswer(submission, [
            "Employment Status",
            "Present Employment Status",
            "Current Employment Status",
          ]);

          const further = getAnswer(
            submission,
            [
              "Have you pursued additional studies/training after graduation?",
              "Pursuing Further Education",
              "Further Education",
            ],
            "No"
          );

          const occupation = getAnswer(submission, [
            "Present Occupation",
            "Occupation",
            "Job Title",
            "Current Job",
            "Current Position",
            "Employment Position",
            "Designation",
            "Nature of Work",
            "Position Title",
            "Work Title",
          ]);

          const industry = getAnswer(submission, [
            "Major line of business of the company you are presently employed in. Check one only.",
            "Industry",
            "Industry of Employment",
            "Field of Work",
            "Sector",
            "Employment Sector",
            "Type of Industry",
            "Nature of Industry",
            "Business Type",
            "Company Sector",
            "Field of Employment",
            "Line of Business",
            "Area of Specialization",
            "Industry Type",
          ]);

          const jobSearchDuration = getAnswer(submission, [
         
            "How long did you take you to land your first job?",
            "How long did it take to get first job after graduation",
          ]);

          const fieldPursued = getAnswer(submission, [
            "Field Pursued",
            "Field After Graduation",
            "Career Field",
            "Career Path",
            "Professional Field",
            "Related Field",
            "Work Field",
            "Occupation Field",
            "Area of Practice",
            "Field of Specialization",
            "Field of Employment",
            "Present Occupation",
          ]);

          const firstJobRelated = getAnswer(submission, [
            "Is your current/first job related to your course?",
            "Is your first job related to your course?",
            "Is your job related to your degree?",
            "Is your first job related to your field of study?",
            "Job-Course Relation",
            "Job Relation to Course",
            "Relation of Job to Course",
            "Work Relevance to Degree",
          ]);

          employmentCounts[employment] = (employmentCounts[employment] || 0) + 1;
          furtherEduCounts[further] = (furtherEduCounts[further] || 0) + 1;
          occupationCounts[occupation] = (occupationCounts[occupation] || 0) + 1;
          industryCounts[industry] = (industryCounts[industry] || 0) + 1;
          jobSearchCounts[jobSearchDuration] = (jobSearchCounts[jobSearchDuration] || 0) + 1;
          fieldPursuedCounts[fieldPursued] = (fieldPursuedCounts[fieldPursued] || 0) + 1;
          firstJobRelatedCounts[firstJobRelated] =
            (firstJobRelatedCounts[firstJobRelated] || 0) + 1;
        });

        setEmploymentData(employmentCounts);
        setFurtherEduData(furtherEduCounts);
        setOccupationData(occupationCounts);
        setIndustryData(industryCounts);
        setJobSearchDurationData(jobSearchCounts);
        setFieldPursuedData(fieldPursuedCounts);
        setFirstJobRelatedData(firstJobRelatedCounts);
      })
      .catch((err) => console.error("Error fetching submissions:", err));
  }, []);

  const makePieData = (counts) => ({
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: [
          "#4F46E5",
          "#60A5FA",
          "#A78BFA",
          "#34D399",
          "#F59E0B",
          "#F472B6",
          "#E11D48",
        ],
      },
    ],
  });

  const makeBarData = (counts, label = "Count") => ({
    labels: Object.keys(counts),
    datasets: [
      {
        label,
        data: Object.values(counts),
        backgroundColor: "#4F46E5",
        borderRadius: 8,
      },
    ],
  });

  const getTotal = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
  const cardStyle =
    "bg-gradient-to-br from-white to-indigo-50 hover:from-indigo-50 hover:to-white transition-all shadow-md rounded-2xl p-5 border border-gray-100";

  // 📄 PDF Export Function
  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("🎓 Alumni Career Path Dashboard Report", 14, 20);

    const allData = {
      "Employment Status": employmentData,
      "Further Education": furtherEduData,
      "Top Occupations": occupationData,
      Industries: industryData,
      "Job Search Duration": jobSearchDurationData,
      "Field Pursued After Graduation": fieldPursuedData,
      "First Job Related to Course": firstJobRelatedData,
    };

    let currentY = 30;

    Object.entries(allData).forEach(([category, data], index) => {
      const entries = Object.entries(data);
      if (entries.length === 0) return;

      const total = Object.values(data).reduce((a, b) => a + b, 0);

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`${category} (${total} responses)`, 14, currentY);
      currentY += 6;

      // Table data
      const tableData = entries.map(([label, count]) => [label, count]);

      autoTable(doc, {
        startY: currentY,
        head: [["Label", "Count"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229], // Indigo
          textColor: 255,
          halign: "center",
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          1: { halign: "center" },
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        },
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Add new page if needed
      if (currentY > 260 && index < Object.keys(allData).length - 1) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save("career_dashboard_report.pdf");
  };

  const chartSections = [
    { title: "Employment Status", type: "pie", data: employmentData },
    { title: "Further Education", type: "pie", data: furtherEduData },
    { title: "Top Occupations", type: "bar", data: occupationData },
    { title: "Industries", type: "bar", data: industryData },
    { title: "Job Search Duration", type: "bar", data: jobSearchDurationData },
    { title: "Field Pursued After Graduation", type: "bar", data: fieldPursuedData },
    { title: "First Job Related to Course", type: "pie", data: firstJobRelatedData },
  ];

  const visibleCharts = chartSections.filter((chart) =>
    chart.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 text-center md:text-left">
          🎓 Alumni Career Path Dashboard
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search charts..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCharts.length > 0 ? (
          visibleCharts.map((chart, index) => (
            <div key={index} className={cardStyle}>
              <h2 className="font-semibold mb-2 text-indigo-700">
                {chart.title}{" "}
                <span className="text-gray-500 text-sm ml-2">
                  ({getTotal(chart.data)} responses)
                </span>
              </h2>
              {chart.type === "pie" ? (
                <Pie data={makePieData(chart.data)} />
              ) : (
                <Bar
                  data={makeBarData(chart.data)}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
                      y: { beginAtZero: true },
                    },
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-2">
            No charts match your search.
          </p>
        )}
      </div>
    </div>
  );
}
