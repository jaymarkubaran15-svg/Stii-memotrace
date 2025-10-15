import React, { useState, useRef, useEffect } from 'react';
import Sidebar from "../navbar/sidebar";
import { FaSearch } from "react-icons/fa";
import AlumniCharts from './surveychart';
import SurveyTable from './surveytable';
import { CiCircleRemove } from "react-icons/ci";
import Swal from 'sweetalert2';

const Courses = () => {
  const [inputValue, setInputValue] = useState("");
  const [workTitles, setWorkTitles] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const inputRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [workFields, setWorkFields] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedWorkField, setSelectedWorkField] = useState("");



  // Fetch data from the backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data); 
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    const fetchWorkFields = async () => {
      try {
        const response = await fetch("/api/workfields");
        if (!response.ok) throw new Error("Failed to fetch work fields");
        const data = await response.json();
        setWorkFields(data); 
      } catch (error) {
        console.error("Error fetching work fields:", error);
      }
    };

    fetchCourses();
    fetchWorkFields();
  }, []);

  const handleAddTitle = (e) => {
    if ((e.key === "Enter" || e.type === "blur") && inputValue.trim()) {
      setWorkTitles([...workTitles, inputValue.trim()]);
      setInputValue("");
      setShowMessage(true);
    }
  };

  const handleRemoveTitle = (title) => {
    setWorkTitles(workTitles.filter((t) => t !== title));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse.trim() || workTitles.length === 0) {
      Swal.fire({
        title: "Success",
        text: "Please fill in all fields.",
        icon: "success",
        draggable: true
      });
      alert("");
      return;
    }

    const surveyData = { selectedCourse, selectedWorkField, workTitles };

    try {
      const response = await fetch("/api/surveyop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) throw new Error("Failed to submit survey data.");

      console.log("Survey submitted successfully");
      setSelectedCourse("");
      // setSelectedWorkField("");
      setWorkTitles([]);
    } catch (error) {
      console.error("Error submitting survey:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Courses</h1>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6 w-full">
      <h1 className="text-2xl font-bold text-gray-800">Add Options</h1>
      <p className="text-gray-600">You can add more than one work title.</p>

      <div className="flex flex-col gap-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Input */}
            <div className="flex flex-col">
              <label className="text-lg font-medium text-gray-700">Course</label>
              <input
                list="course-options"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Search or Add Course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              />
              <datalist id="course-options">
                {courses.map((course, index) => (
                  <option key={index} value={course} />
                ))}
              </datalist>
            </div>

            {/* Work Title Input */}
            <div className="flex flex-col">
              <label className="text-lg font-medium text-gray-700">Work Title</label>
              <input
                ref={inputRef}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Enter Work Title and Press Enter"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAddTitle}
                onBlur={handleAddTitle}
              />
            </div>
          </div>

          {showMessage && <p className="text-blue-600 text-md">You can continue adding more work titles.</p>}

          {/* Work Titles Table */}
          {workTitles.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full border border-gray-300 rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-gray-800">Course</th>
                    <th className="border px-4 py-2 text-gray-800">Work Title</th>
                    <th className="border px-4 py-2 text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workTitles.map((title, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {index === 0 && (
                        <td className="border px-4 py-2" rowSpan={workTitles.length}>
                          {selectedCourse}
                        </td>
                      )}
                      <td className="border px-4 py-2">{title}</td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveTitle(title)}
                        >
                          <CiCircleRemove size={32} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-300"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
        <SurveyTable />
        {/* <AlumniCharts /> */}
      </div>
    </div>
  );
};

export default Courses;
