import  { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {  ShieldCheck } from "lucide-react";

export default function EmployerFeedbackForm() {
  const [schema, setSchema] = useState({ sections: [] });
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [alumniId, setAlumniId] = useState(null);

  // ✅ Extract token from URL and get alumni ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get("token");

    if (!tokenFromURL) {
      Swal.fire({
        icon: "error",
        title: "Invalid Link",
        text: "Missing or invalid token.",
      });
      return;
    }

    fetch(`https://server-1-gjvd.onrender.com/api/get-alumni-by-token/${tokenFromURL}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlumniId(data.alumni_id);
        } else {
          Swal.fire({
            icon: "error",
            title: "Invalid or Expired Link",
            text: "Your invitation link is not valid.",
          });
        }
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Connection Error",
          text: "Unable to fetch alumni information.",
        });
      });
  }, []);

  // ✅ Load Feedback Form Schema
  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/feedback-schema")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.schema) {
          setSchema({
            sections: result.schema.sections || [],
            id: result.schema.id,
          });
        }
      })
      .catch((err) =>
        console.error("❌ Error loading feedback schema:", err)
      );
  }, []);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!answers.consent) {
      Swal.fire({
        icon: "warning",
        title: "Consent Required",
        text: "You must agree to the Data Privacy Act Notice before submitting.",
      });
      return;
    }

    if (!alumniId) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Invalid or missing alumni ID. Please use your invitation link.",
      });
      return;
    }

    try {
      const payload = {
        schema_id: schema?.id || null,
        alumni_id: alumniId,
        response: answers,
      };

      const res = await fetch("https://server-1-gjvd.onrender.com/api/feedback-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setSubmitted(true);
        Swal.fire({
          icon: "success",
          title: "Feedback Submitted",
          text: "Thank you for your feedback!",
          showConfirmButton: false,
          timer: 2500,
        }).then(() => {
          window.close(); // ✅ Close tab after success
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Please try again later.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while submitting your feedback.",
      });
    }
  };

const renderLikert = (question) => {
  const { label, rows = [], columns = [] } = question;

  if (!rows.length || !columns.length) {
    return (
      <div className="text-red-500 text-sm italic mb-2">
        ⚠️ Likert question "{label}" has missing rows or columns in the database.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full border border-gray-300 rounded-lg">
        <thead className="bg-indigo-100 text-gray-800">
          <tr>
            <th className="border px-3 py-2 text-left">{label}</th>
            {columns.map((opt, i) => (
              <th key={i} className="border px-3 py-2 text-center">
                {opt}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((rowLabel, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-50">
              <td className="border px-3 py-2 font-medium text-gray-700">
                {rowLabel}
              </td>
              {columns.map((opt, oIdx) => (
                <td key={oIdx} className="border px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`${question.label}_${rIdx}`}
                    value={opt}
                    onChange={() => {
                      handleChange(question.label, {
                        ...(answers[question.label] || {}),
                        [rowLabel]: opt,
                      });
                    }}
                    className="accent-indigo-600"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex flex-col items-center py-12 px-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-10 border border-indigo-100">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-700 mb-2">
            Employer Feedback Form
          </h1>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Help us improve our academic programs by providing valuable feedback
            on the graduates you have employed.
          </p>
        </div>

        {submitted ? (
          <div className="text-center text-green-600 text-lg font-semibold">
            ✅ Thank you for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 🔒 Data Privacy Notice */}
            <div className="border-2 border-indigo-100 rounded-2xl p-6 bg-indigo-50/40 shadow-sm">
              <label className="flex items-center text-gray-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  onChange={(e) => handleChange("consent", e.target.checked)}
                  className="mr-2 accent-indigo-600 w-5 h-5"
                />
                I agree to the{" "}
                <span className="ml-1 font-semibold text-indigo-700">
                  Data Privacy Act Notice
                </span>
              </label>

              {answers.consent && (
                <div className="mt-4 p-5 bg-white border border-indigo-100 rounded-xl shadow-sm text-gray-700 text-sm leading-relaxed">
                  <div className="flex items-center mb-3 text-indigo-700 font-semibold">
                    <ShieldCheck size={18} className="mr-2" />
                    Data Privacy Act of 2012 (RA 10173)
                  </div>
                  <p className="mb-2">
                    Your responses will be collected for the purpose of evaluating
                    the performance of our graduates in their workplaces.
                  </p>
                  <p className="mb-2">
                    All data will remain confidential and used solely for
                    institutional development and academic improvement.
                  </p>
                  <p>
                    By agreeing, you voluntarily consent to data collection and
                    processing in accordance with the Data Privacy Act of 2012.
                  </p>
                </div>
              )}
            </div>

            {/* 📋 Feedback Questions */}
            {[...schema.sections].reverse().map((section, sIdx) => (
              <div
                key={sIdx}
                className="border rounded-2xl bg-gray-50 p-8 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-semibold text-indigo-700 mb-6">
                  {section.title}
                </h3>

                {(section.questions || []).map((q, qIdx) => (
                  <div key={qIdx} className="mb-6">
                    <label className="block text-gray-800 font-medium mb-2 text-base">
                      {q.label}{" "}
                      {q.required && <span className="text-red-500">*</span>}
                    </label>

                    {/* Regular Input Types */}
                    {q.type === "text" && (
                      <input
                        type="text"
                        required={q.required}
                        onChange={(e) => handleChange(q.label, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    )}

                    {q.type === "textarea" && (
                      <textarea
                        required={q.required}
                        onChange={(e) => handleChange(q.label, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        rows={4}
                      />
                    )}

                    {q.type === "radio" &&
                      (q.options || []).map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className="flex items-center space-x-2 text-gray-700 mb-1"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            required={q.required}
                            onChange={(e) =>
                              handleChange(q.id, e.target.value)
                            }
                            className="accent-indigo-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}

                    {q.type === "checkbox" &&
                      (q.options || []).map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className="flex items-center space-x-2 text-gray-700 mb-1"
                        >
                          <input
                            type="checkbox"
                            value={opt}
                            onChange={(e) => {
                              const current = answers[q.id] || [];
                              if (e.target.checked) {
                                handleChange(q.id, [...current, opt]);
                              } else {
                                handleChange(
                                  q.id,
                                  current.filter((x) => x !== opt)
                                );
                              }
                            }}
                            className="accent-indigo-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}

                    {q.type === "select" && (
                      <select
                        required={q.required}
                        onChange={(e) => handleChange(q.label, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      >
                        <option value="">Select an option</option>
                        {(q.options || []).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* 🧮 Likert Scale Table */}
                    {q.type === "likert" && renderLikert(q)}
                  </div>
                ))}
              </div>
            ))}

            {/* ✅ Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
