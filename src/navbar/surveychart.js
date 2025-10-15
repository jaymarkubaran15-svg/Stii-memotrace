import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from 'sweetalert2';
import { ChevronDown, Download } from "lucide-react";

export default function ChartsDashboard() {
  const [surveyData, setSurveyData] = useState([]);
  const [chartType, setChartType] = useState("pie");
  const [selectedDataKey, setSelectedDataKey] = useState("employment_status");
  const [exportType, setExportType] = useState("pdf");

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const response = await fetch("/api/surveydata");
        const result = await response.json();
        if (response.ok) {
          setSurveyData(result);
        }
      } catch (error) {
        console.error("Error fetching survey data:", error);
      }
    };
    fetchSurveyData();
  }, []);

  const processData = (key) => {
    const counts = {};
    surveyData.forEach((entry) => {
      counts[entry[key]] = (counts[entry[key]] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#ffbb28", "#d884d8", "#84d8c2"];

  const chartOptions = [
    { title: "Employment Status", key: "employment_status" },
    { title: "Work Industry", key: "industry" },
    { title: "Years of Experience", key: "work_experience" },
    { title: "Education Relevance", key: "education_relevance" },
    { title: "Alumni Event Participation", key: "alumni_events" },
    { title: "Course", key: "course" },
  ];

  const selectedData = chartOptions.find((option) => option.key === selectedDataKey);
  const data = processData(selectedDataKey);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const exportAllToPDF = () => {
    const doc = new jsPDF();
    doc.text("Alumni Survey All Data", 20, 10);
    
    if (surveyData.length > 0) {
      const headers = [["Name", "Middle Name", "Last Name", "Gender", "Year Graduate", "Employment Status", "Industry", "Work Experience", "Education Relevance", "Alumni Events", "Course"]];
      const body = surveyData.map(({ name, middlename, lastname, gender, yeargraduate, employment_status, industry, work_experience, education_relevance, alumni_events, course }) => 
        [name, middlename, lastname, gender, yeargraduate, employment_status, industry, work_experience, education_relevance, alumni_events, course]
      );
      autoTable(doc, {
        head: headers,
        body: body,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, halign: "center" },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 15 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 } },
      });
    } else {
      doc.text("No data available", 20, 20);
    }
    
    doc.save("Alumni_Survey_All_Data.pdf");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Alumni Survey All Data", 20, 10);
    
    if (surveyData.length > 0) {
      const headers = [[selectedData.title, "Count"]];
      const body = data.map(({ name, value }) => [name, value]);
      body.push(["Total", total]);
      
      autoTable(doc, {
        head: headers,
        body: body,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8, halign: "center" },
      });
    } else {
      doc.text("No data available", 20, 20);
    }
    
    doc.save("Alumni_Survey_All_Data.pdf");
  };

  const exportAllToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(surveyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Data");
    XLSX.writeFile(workbook, "Alumni_Survey_All_Data.xlsx");
  };

  
    const exportAllExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet([
        ...data.map(({ name, value }) => ({ [selectedData.title]: name, Count: value })),
        { [selectedData.title]: "Total", Count: total }
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "All Data");
      XLSX.writeFile(workbook, "Alumni_Survey_All_Data.xlsx");
    };
  
    const handleExport = () => {
      Swal.fire({
        title: "Export Data",
        text: "Are you sure you want to export the data?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, export it!",
      }).then((result) => {
        if (result.isConfirmed) {
          if (exportType === "pdf") {
            exportAllToPDF();
          } else {
            exportAllToExcel();
          }
          Swal.fire("Success!", "The file has been exported.", "success");
        }
      });
    };
    const Export = () => {
      Swal.fire({
        title: "Export Survey Data",
        text: "Do you want to export the selected survey data?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, export it!",
      }).then((result) => {
        if (result.isConfirmed) {
          if (exportType === "pdf") {
            exportToPDF();
          } else {
            exportAllExcel();
          }
          Swal.fire("Success!", "The file has been exported.", "success");
        }
      });
    };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center mb-4">📊 Alumni Survey Charts</h2>

      <div className="flex justify-center items-center mb-6 space-x-4 bg-gray-50 p-4 rounded-lg shadow-md">
        
        {/* Chart Type Selector */}
        <div className="relative w-44">
          <select
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition appearance-none"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="pie">📊 Pie Chart</option>
            <option value="bar">📈 Bar Chart</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 text-gray-500" size={18} />
        </div>

        {/* Data Key Selector */}
        <div className="relative w-44">
          <select
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition appearance-none"
            value={selectedDataKey}
            onChange={(e) => setSelectedDataKey(e.target.value)}
          >
            {chartOptions.map(({ title, key }) => (
              <option key={key} value={key}>{title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-gray-500" size={18} />
        </div>

        {/* Export Type Selector */}
        <div className="relative w-52">
          <select
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition appearance-none"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="pdf">📄 Export All PDF</option>
            <option value="excel">📘 Export All Excel</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 text-gray-500" size={18} />
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center bg-blue-500 text-white py-3 px-5 rounded-lg hover:bg-blue-600 transition duration-300 shadow-md"
        >
          <Download size={18} className="mr-2" />
          Export
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-4">
        <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold mb-3">{selectedData.title} (Total: {total})</h3>
        <button
           onClick={Export}
          className="flex items-center bg-blue-500 text-white py-3 px-5 rounded-lg hover:bg-blue-600 transition duration-300 shadow-md"
        >
          <Download size={18} className="mr-2" />
          Export
        </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}