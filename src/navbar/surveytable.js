import React, { useEffect, useState } from "react";

const SurveyTable = () => {
  const [surveyData, setSurveyData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const response = await fetch("/api/survey");
        if (!response.ok) throw new Error("Failed to fetch survey data");

        const data = await response.json();
        setSurveyData(data);
      } catch (error) {
        console.error("Error fetching survey data:", error);
      }
    };

    fetchSurveyData();
  }, []);

  const groupedData = {};
  surveyData.forEach((row) => {
    if (!groupedData[row.course]) groupedData[row.course] = {};
    if (!groupedData[row.course][row.work_field]) groupedData[row.course][row.work_field] = [];
    if (!groupedData[row.course][row.work_field].includes(row.work_title)) {
      groupedData[row.course][row.work_field].push(row.work_title);
    }
  });

  const flattenedRows = Object.entries(groupedData).flatMap(([course, fields]) =>
    Object.entries(fields).flatMap(([field, titles]) =>
      titles.map((title) => ({ course, field, title }))
    )
  );

  const totalPages = Math.ceil(flattenedRows.length / rowsPerPage);
  const paginatedRows = flattenedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="mt-6 bg-white shadow-lg rounded-xl p-6 w-full mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Available Offers in School</h2>
      <p className="text-gray-600 text-center mb-6">Courses and corresponding work titles pasible</p>

      {surveyData.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
          <table className="w-full border-collapse rounded-lg overflow-hidden text-sm md:text-base">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="border px-4 md:px-6 py-3 text-left">Course</th>
                <th className="border px-4 md:px-6 py-3 text-left">Work Titles</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let displayedCourses = new Set();
                return paginatedRows.map(({ course, title }, index) => {
                  const courseRowCount = paginatedRows.filter(row => row.course === course).length;
                  const isFirstCourseRow = !displayedCourses.has(course);

                  if (isFirstCourseRow) displayedCourses.add(course);

                  return (
                    <tr key={index} className="hover:bg-gray-100 transition duration-200 even:bg-gray-50">
                      {isFirstCourseRow ? (
                        <td className="border px-4 md:px-6 py-4 font-semibold bg-gray-200 text-gray-900" rowSpan={courseRowCount}>
                          {course}
                        </td>
                      ) : null}
                      <td className="border px-4 md:px-6 py-4 text-gray-700">{title}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-red-500 text-lg mt-4 text-center">No survey data available.</p>
      )}

      <div className="flex justify-center items-center mt-6 space-x-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 md:px-4 py-2 bg-gray-400 text-white rounded-lg shadow-md hover:bg-gray-500 transition disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm md:text-lg font-medium text-gray-800">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 md:px-4 py-2 bg-gray-400 text-white rounded-lg shadow-md hover:bg-gray-500 transition disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SurveyTable;
