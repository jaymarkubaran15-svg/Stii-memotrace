import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Swal from "sweetalert2";

export default function EducationModal({ onClose, onSave, initialData }) {
  const [education, setEducation] = useState({
    programType: "",
    otherProgram: "",
    fieldOfStudy: "",
    institutionName: "",
    institutionLocation: "",
    startDate: "",
    endDate: "",
    isCompleted: false,
  });

  const [fieldSuggestions, setFieldSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Fixed: Corrected function and state usage
  const fetchFieldSuggestions = async (text) => {
    if (!text || text.length < 2) return setFieldSuggestions([]);

    try {
      const res = await fetch(
        `https://api.openalex.org/autocomplete/concepts?search=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const results = (data.results || []).map((item) => item.display_name);
      setFieldSuggestions(results);
    } catch (error) {
      console.error("Error fetching field suggestions:", error);
      setFieldSuggestions([]);
    }
  };

useEffect(() => {
  if (initialData) {
    const normalizeDate = (value) => {
      if (!value) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const d = new Date(value);
      return !isNaN(d) ? d.toISOString().split("T")[0] : "";
    };

    setEducation({
      id: initialData.id || null, // ✅ Include this
      programType: initialData.programType || "",
      otherProgram: initialData.otherProgram || "",
      fieldOfStudy: initialData.fieldOfStudy || "",
      institutionName: initialData.institutionName || "",
      institutionLocation: initialData.institutionLocation || "",
      startDate: normalizeDate(initialData.startDate || initialData.start_date),
      endDate: normalizeDate(initialData.endDate || initialData.end_date),
      isCompleted:
        typeof initialData.isCompleted !== "undefined"
          ? initialData.isCompleted
          : Boolean(initialData.is_completed),
    });
  }
}, [initialData]);


  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

const handleSave = async () => {
  if (!education.programType || !education.institutionName) {
    return Swal.fire("Missing Info", "Program type and institution name are required.", "warning");
  }

  if (education.programType === "Others" && !education.otherProgram.trim()) {
    return Swal.fire("Missing Info", "Please specify your program type.", "warning");
  }

  const finalProgramType =
    education.programType === "Others"
      ? education.otherProgram.trim()
      : education.programType;

  const payload = {
    programType: finalProgramType,
    fieldOfStudy: education.fieldOfStudy?.trim() || "",
    institutionName: education.institutionName?.trim() || "",
    institutionLocation: education.institutionLocation?.trim() || "",
    startDate: education.startDate || null,
    endDate: education.endDate || null,
    isCompleted: Boolean(education.isCompleted),
  };

  try {
    const isUpdate = Boolean(education.id);
    const endpoint = isUpdate ? `https://server-1-gjvd.onrender.com/api/education/${education.id}` : `https://server-1-gjvd.onrender.com/api/education`;
    const method = isUpdate ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      Swal.fire(
        "Saved!",
        isUpdate
          ? "Your education record has been updated."
          : "Your education record has been added.",
        "success"
      );

      onSave({
        ...education,
        programType: finalProgramType,
        ...(data.id ? { id: data.id } : {}),
        updated_at: new Date().toISOString(),
      });

      onClose();
    } else {
      Swal.fire("Error", data.message || "Failed to save record.", "error");
    }
  } catch (error) {
    console.error("Save error:", error);
    Swal.fire("Error", "Unable to connect to server.", "error");
  }
};



  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
          {education.id ? "Edit Education" : "Add Further Education"}
        </h2>

        <div className="space-y-4">
          {/* === Program Type === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type of Program <span className="text-red-500">*</span>
            </label>
            <select
              value={education.programType}
              onChange={(e) =>
                setEducation({ ...education, programType: e.target.value, otherProgram: "" })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select program type</option>
              <option value="Master’s Degree">Master’s Degree</option>
              <option value="Doctorate (PhD)">Doctorate (PhD)</option>
              <option value="Postgraduate Diploma/Certificate">Postgraduate Diploma/Certificate</option>
              <option value="Second Bachelor’s Degree">Second Bachelor’s Degree</option>
              <option value="Professional Training/Certification">Professional Training/Certification</option>
              <option value="Others">Others</option>
            </select>

            {education.programType === "Others" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={education.otherProgram}
                  onChange={(e) =>
                    setEducation({ ...education, otherProgram: e.target.value })
                  }
                  placeholder="Please specify your program type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* === Field of Study (with Autocomplete) === */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field of Study
            </label>
            <input
              type="text"
              value={education.fieldOfStudy}
              onChange={(e) => {
                const val = e.target.value;
                setEducation({ ...education, fieldOfStudy: val });
                fetchFieldSuggestions(val);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g., Computer Science, MBA, Education"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {showSuggestions && fieldSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                {fieldSuggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    onMouseDown={() => {
                      setEducation({ ...education, fieldOfStudy: suggestion });
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* === Institution Name === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={education.institutionName}
              onChange={(e) => setEducation({ ...education, institutionName: e.target.value })}
              placeholder="e.g., University of the Philippines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* === Institution Location === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Location
            </label>
            <input
              type="text"
              value={education.institutionLocation}
              onChange={(e) => setEducation({ ...education, institutionLocation: e.target.value })}
              placeholder="e.g., Quezon City, Philippines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* === Dates === */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={education.startDate}
                onChange={(e) => setEducation({ ...education, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {education.startDate && (
                <p className="text-sm text-gray-600 mt-1">{formatFullDate(education.startDate)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={education.endDate}
                onChange={(e) => setEducation({ ...education, endDate: e.target.value })}
                disabled={!education.isCompleted}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !education.isCompleted ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              {education.endDate && (
                <p className="text-sm text-gray-600 mt-1">{formatFullDate(education.endDate)}</p>
              )}
            </div>
          </div>

          {/* === Checkbox === */}
          <div className="flex items-center mt-1">
            <input
              id="completed"
              type="checkbox"
              checked={education.isCompleted}
              onChange={(e) =>
                setEducation({
                  ...education,
                  isCompleted: e.target.checked,
                  endDate: e.target.checked ? education.endDate : "",
                })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="completed" className="ml-2 text-sm text-gray-700">
              I have completed this program
            </label>
          </div>
        </div>

        {/* === Buttons === */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
