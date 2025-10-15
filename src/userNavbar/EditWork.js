import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Swal from "sweetalert2";

export default function WorkModal({ onClose, onSave, initialData }) {
  const [work, setWork] = useState({
      id: null, 
    position: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    isCurrent: false,
  });

  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

useEffect(() => {
  if (initialData) {
    const normalizeDate = (value) => {
      if (!value) return "";
      // If already "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const d = new Date(value);
      return !isNaN(d) ? d.toISOString().split("T")[0] : "";
    };

    setWork({
     id: initialData.id || null, 
      position: initialData.position || "",
      company: initialData.company || "",
      location: initialData.location || "",
      startDate: normalizeDate(initialData.startDate || initialData.start_date),
      endDate: normalizeDate(initialData.endDate || initialData.end_date),
      description: initialData.description || "",
      isCurrent:
        typeof initialData.isCurrent !== "undefined"
          ? initialData.isCurrent
          : Boolean(initialData.is_current),
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

  // === Company API (Clearbit) ===
  const fetchCompanySuggestions = async (query) => {
    if (!query.trim()) return setCompanySuggestions([]);
    try {
      const res = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`
      );
      const data = await res.json();
      setCompanySuggestions(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // === Job Title API (RapidAPI JSearch) ===
  const fetchTitleSuggestions = async (query) => {
    if (!query.trim()) return setTitleSuggestions([]);
    try {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
          query
        )}&page=1&num_pages=1&country=us&date_posted=all`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": "d7db2ce81dmsh4390fa211f90592p1143ecjsn38fa046242e9",
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        }
      );
      const data = await res.json();
      const titles =
        data.data
          ?.map((job) => job.job_title)
          ?.filter((title, index, arr) => title && arr.indexOf(title) === index)
          ?.slice(0, 10) || [];
      setTitleSuggestions(titles);
    } catch (err) {
      console.error("Error fetching job titles:", err);
      setTitleSuggestions([]);
    }
  };

  // === Location API (Nominatim) ===
  const fetchLocationSuggestions = async (query) => {
    if (!query.trim()) return setLocationSuggestions([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // === Save ===
const handleSave = async () => {
  if (!work.position || !work.company) {
    return Swal.fire("Missing Info", "Position and company are required.", "warning");
  }

  const payload = {
    position: work.position.trim(),
    company: work.company.trim(),
    location: work.location?.trim() || "",
    startDate: work.startDate || null,
    endDate: work.isCurrent ? null : work.endDate || null,
    description: work.description?.trim() || "",
    isCurrent: Boolean(work.isCurrent),
  };

  try {
    const isUpdate = Boolean(work.id);
    const endpoint = isUpdate ? `/api/work/${work.id}` : `/api/work`;
    const method = isUpdate ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ include cookies/session
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire(
        "Saved!",
        isUpdate
          ? "Your work experience has been updated."
          : "Your work experience has been added.",
        "success"
      );

      // Update parent list
      onSave({
        ...work,
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

  // === Render ===
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
          Add Work Experience
        </h2>

        <div className="space-y-4">
          {/* === Company === */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={work.company}
              onChange={(e) => {
                setWork({ ...work, company: e.target.value });
                fetchCompanySuggestions(e.target.value);
              }}
              placeholder="e.g., Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {companySuggestions.length > 0 && (
              <ul className="absolute bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-56 overflow-auto z-20 shadow">
                {companySuggestions.map((company, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setWork({ ...work, company: company.name });
                      setCompanySuggestions([]);
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    <img
                      src={
                        company.logo ||
                        `https://logo.clearbit.com/${company.domain}`
                      }
                      alt={company.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => (e.target.src = "/placeholder-company.png")}
                    />
                    <span className="text-sm">{company.name}</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {company.domain}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* === Position / Title === */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={work.position}
              onChange={(e) => {
                setWork({ ...work, position: e.target.value });
                fetchTitleSuggestions(e.target.value);
              }}
              placeholder="e.g., Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {titleSuggestions.length > 0 && (
              <ul className="absolute bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-56 overflow-auto z-20 shadow">
                {titleSuggestions.map((title, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setWork({ ...work, position: title });
                      setTitleSuggestions([]);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* === Location === */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={work.location}
              onChange={(e) => {
                const value = e.target.value;
                setWork({ ...work, location: value });
                if (value.trim()) fetchLocationSuggestions(value);
                else setLocationSuggestions([]);
              }}
              placeholder="e.g., Manila, Philippines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {locationSuggestions.length > 0 && (
              <ul className="absolute bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-48 overflow-auto z-20 shadow">
                {locationSuggestions.map((place, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setWork({ ...work, location: place.display_name });
                      setLocationSuggestions([]);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

            {/* === Dates === */}
            <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
                </label>
                <input
                type="date"
                max={new Date().toISOString().split("T")[0]} // ⛔ prevents future dates
                value={work.startDate}
                onChange={(e) => setWork({ ...work, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {work.startDate && (
                <p className="text-sm text-gray-600 mt-1">
                    {formatFullDate(work.startDate)}
                </p>
                )}
            </div>

            {/* End Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
                </label>
                <input
                type="date"
                max={new Date().toISOString().split("T")[0]} // ⛔ prevents future dates
                value={work.endDate}
                onChange={(e) => setWork({ ...work, endDate: e.target.value })}
                disabled={work.isCurrent}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    work.isCurrent ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                />
                {!work.isCurrent && work.endDate && (
                <p className="text-sm text-gray-600 mt-1">
                    {formatFullDate(work.endDate)}
                </p>
                )}
                {work.isCurrent && (
                <p className="text-sm text-gray-600 mt-1">Present</p>
                )}
            </div>
            </div>

          {/* === Checkbox === */}
          <div className="flex items-center mt-1">
            <input
              id="currentJob"
              type="checkbox"
              checked={work.isCurrent}
              onChange={(e) =>
                setWork({ ...work, isCurrent: e.target.checked, endDate: "" })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="currentJob" className="ml-2 text-sm text-gray-700">
              I currently work here
            </label>
          </div>

          {/* === Description === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={work.description}
              onChange={(e) =>
                setWork({ ...work, description: e.target.value })
              }
              placeholder="Describe your role, achievements, or projects..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
