import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function GTSPage({ onSurveySubmit }) {
  const [schema, setSchema] = useState({ sections: [] });
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [laterCount, setLaterCount] = useState(0);
  const LATER_LIMIT = 3;


  // ✅ Load saved form data
  useEffect(() => {
    const saved = localStorage.getItem("ched_gts_dynamic");
    if (saved) setData(JSON.parse(saved));
  }, []);

  // ✅ Session & role check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/session", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
          if (data.user.role === "admin") navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("ched_gts_dynamic", JSON.stringify(data));
  }, [data]);

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
        } else {
          setSchema({ sections: [] });
        }
      })
      .catch((err) => {
        console.error("❌ Error loading schema:", err);
        setSchema({ sections: [] });
      });
  }, []);

  const update = (label, val) => setData((prev) => ({ ...prev, [label]: val }));

  const validate = () => {
    const e = {};
    schema.sections.forEach((s) =>
      s.fields.forEach((f) => {
        if (f.required && shouldShowField(f) && !data[f.label]) {
          e[f.label] = `${f.label} is required`;
        }
      })
    );
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const shouldShowField = (field) => {
    if (!field.showWhen) return true;
    return data[field.showWhen.label] === field.showWhen.equals;
  };

const onSubmit = async (e) => {
  e.preventDefault();

  // Run validation
  if (!validate()) {
    // Find first missing required field
    const firstErrorLabel = Object.keys(errors)[0];

    // Show alert
    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: "Please fill out all required fields before submitting.",
      confirmButtonColor: "#4f46e5",
    }).then(() => {
      // Scroll to the first missing question
      if (firstErrorLabel) {
        const el = document.querySelector(`[data-label='${firstErrorLabel}']`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-red-500", "ring-offset-2");
          setTimeout(() => el.classList.remove("ring-2", "ring-red-500", "ring-offset-2"), 2000);
        }
      }
    });
    return;
  }

  setSubmitted(true);

  try {
    const res = await fetch("/api/submitsurvey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (res.ok) {
      Swal.fire({
        title: "Thank You!",
        text: "Your survey was submitted successfully.",
        icon: "success",
        confirmButtonText: "Continue",
        confirmButtonColor: "#4f46e5",
      }).then(() => {
        navigate("/userhome");
        if (onSurveySubmit) onSurveySubmit();
      });
    } else {
      Swal.fire("Error", "Failed to submit survey.", "error");
    }
  } catch (err) {
    console.error("Error submitting survey:", err);
    Swal.fire("Error", "An error occurred while submitting.", "error");
  }
};

useEffect(() => {
  const fetchLaterCount = async () => {
    try {
      const res = await fetch("/api/getlatercount", { credentials: "include" });
      const data = await res.json();
      if (data.success) setLaterCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching later count:", err);
    }
  };
  fetchLaterCount();
}, []);

const handleFillOutLater = async () => {
  try {
    // Check if user has already reached the limit
    if (laterCount >= LATER_LIMIT) {
      Swal.fire({
        icon: "error",
        title: "Limit Reached",
        text: "You can no longer use 'Fill Out Later'. Please complete the survey.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    // Increment the "fill out later" count in your backend
    const res = await fetch("/api/incrementlater", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok && data.success) {
      const newCount = laterCount + 1;
      setLaterCount(newCount);

      await Swal.fire({
        icon: "success",
        title: "Saved for Later",
        text: "You can return to complete the survey later.",
        confirmButtonColor: "#4f46e5",
      });

      // ✅ Reload the page after success
      window.location.reload();
    } else {
      await Swal.fire({
        icon: "warning",
        title: "Notice",
        text: data.message || "Failed to update your 'Fill Out Later' count.",
        confirmButtonColor: "#4f46e5",
      });

      // ✅ Even if it fails, still reload for consistency
      window.location.reload();
    }
  } catch (err) {
    console.error("Error in handleFillOutLater:", err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while saving progress.",
      confirmButtonColor: "#4f46e5",
    });
    window.location.reload();
  }
};


  // ✅ Field Renderer
  const RenderField = ({ field, number }) => {
    if (!shouldShowField(field)) return null;
    const value = data[field.label] || "";
    const err = errors[field.label];

    const labelEl = (
      <label className="block text-gray-800 font-medium mb-2">
        {number}. {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>
    );

    // Radio
    if (field.type === "radio") {
      return (
        <div className="mb-6" data-label={field.label}>
          {labelEl}
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((o, i) => (
              <label
                key={i}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition cursor-pointer ${
                  value === o
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={field.label}
                  value={o}
                  checked={value === o}
                  onChange={(e) => update(field.label, e.target.value)}
                  className="hidden"
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {submitted && err && (
            <p className="text-sm text-red-600 mt-1">{err}</p>
          )}
        </div>
      );
    }

    // Select
if (field.type === "select") {
  return (
    <div className="mb-6" data-label={field.label}>
      <label className="block text-gray-800 font-medium mb-2">
        {number}. {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>

      <div className="relative">
        {/* Custom-styled select */}
        <select
          value={value}
          onChange={(e) => update(field.label, e.target.value)}
          className="appearance-none w-full px-4 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        >
          <option value="">Select an option</option>
          {(field.options || []).map((o, i) => (
            <option key={i} value={o}>
              {o}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          ▼
        </span>
      </div>

      {submitted && err && (
        <p className="text-sm text-red-600 mt-1">{err}</p>
      )}
    </div>
  );
}
    // Checkbox
    if (field.type === "checkbox") {
      const values = Array.isArray(value) ? value : [];
      const selected = new Set(values);
      return (
        <div className="mb-6" data-label={field.label}>
          {labelEl}
          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((o, i) => {
              const isOthers = String(o).toLowerCase() === "others";
              const othersLabel = `${field.label} (Others)`;
              return (
                <div key={i}>
                  <label
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                      selected.has(o)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={o}
                      checked={selected.has(o)}
                      onChange={(e) => {
                        const set = new Set(selected);
                        e.target.checked ? set.add(o) : set.delete(o);
                        update(field.label, Array.from(set));
                      }}
                      className="hidden"
                    />
                    <span>{o}</span>
                  </label>
                  {isOthers && selected.has(o) && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={data?.[othersLabel] || ""}
                      onChange={(e) => update(othersLabel, e.target.value)}
                      className="mt-3 ml-6 border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {submitted && err && (
            <p className="text-sm text-red-600 mt-1">{err}</p>
          )}
        </div>
      );
    }

    return null;
  };

  // ✅ Progress Bar
  const completedFields = Object.keys(data).length;
  const totalFields = schema.sections.reduce(
    (acc, sec) => acc + (sec.fields?.length || 0),
    0
  );
  const progress = totalFields ? (completedFields / totalFields) * 100 : 0;

  // ✅ Main Layout
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden my-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-8 px-6 text-center">
          <h1 className="text-3xl font-bold mb-2">
            🎓 Alumni Information Survey
          </h1>
          <p className="text-sm text-indigo-100 max-w-2xl mx-auto">
            Please complete this short survey truthfully. Your feedback helps us
            improve our programs and services for future graduates.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-gray-200 h-2 w-full">
          <div
            className="h-2 bg-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-right pr-6 py-1">
          {Math.round(progress)}% complete
        </p>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="p-6 sm:p-10 max-h-[70vh] overflow-y-auto"
        >
          {schema.sections.map((sec, sIdx) => {
            let fieldCounter = 0;
            return (
              <motion.section
  key={sIdx}
  layout={false}
  initial={false}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="mb-8 border border-gray-200 rounded-xl p-6 bg-gray-50"
>
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    {sIdx + 1}. {sec.title}
  </h2>
  {sec.fields?.map((f, fIdx) => (
    <RenderField key={f.key || fIdx} field={f} number={fIdx + 1} />
  ))}
</motion.section>

            );
          })}

           {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-md transition transform hover:scale-105"
          >
            Submit Survey
          </button>

          <button
            type="button"
            onClick={handleFillOutLater}
            className={`${
              laterCount >= LATER_LIMIT
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            } text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-md transition transform hover:scale-105`}
            disabled={laterCount >= LATER_LIMIT}
          >
            {laterCount >= LATER_LIMIT
              ? "Fill Out Later (Limit Reached)"
              : "Fill Out Later"}
          </button>
        </div>

        {/* Later Count Indicator */}
        <p className="text-center text-gray-500 text-sm mt-3">
          You have used <b>{laterCount}</b> of <b>{LATER_LIMIT}</b> allowed “Fill Out Later” attempts.
        </p>
        </form>
      </div>
    </div>
  );
}
