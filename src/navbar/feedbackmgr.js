import Sidebar from "../navbar/sidebar";
import React, { useState, useEffect } from "react";
import { Trash2, Save, PlusCircle, FolderPlus } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminFeedbackTable() {
  const [schema, setSchema] = useState({ sections: [] });
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch schema
  useEffect(() => {
    fetch("/api/feedback-schema")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.schema) {
          setSchema({ sections: result.schema.sections || [] });
        }
      })
      .catch((err) => console.error("❌ Error loading schema:", err));
  }, []);

  // 🔹 Save schema
  const persistSchema = async (updatedSchema) => {
    try {
      const cleanedSchema = {
        ...updatedSchema,
        sections: updatedSchema.sections.map((section) => ({
          ...section,
          questions: section.questions.map((q) => ({
            ...q,
            options: q.options?.filter((opt) => opt.trim() !== "") || [],
            rows: q.rows?.filter((r) => r.trim() !== "") || [],
            columns: q.columns?.filter((c) => c.trim() !== "") || [],
          })),
        })),
      };

      const res = await fetch("/api/feedback-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedSchema),
      });
      const result = await res.json();
      if (!result.success) throw new Error("Failed to save schema");
    } catch (err) {
      console.error("❌ Error saving schema:", err);
    }
  };

  /* --- Section Management --- */
  const addSection = () => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections = [
        ...next.sections,
        {
          title: `New Section ${next.sections.length + 1}`,
          questions: [],
        },

      ];
 
      return next;
    });
  };

  const updateSectionTitle = (sIdx, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections[sIdx].title = val;
     
      return next;
    });
  };

  const removeSection = (sIdx) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will delete the entire section and its questions.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setSchema((prev) => {
          const next = { ...prev };
          next.sections = next.sections.filter((_, i) => i !== sIdx);
     
          return next;
        });
        Swal.fire("Deleted!", "Section has been removed.", "success");
      }
    });
  };

  /* --- Question Management --- */
  const addQuestion = (sIdx) => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections[sIdx].questions.push({
        label: "",
        type: "text",
        required: false,
        options: [],
        rows: [],
        columns: [],
      });
   
      return next;
    });
  };

  const updateQuestion = (sIdx, qIdx, key, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections[sIdx].questions[qIdx][key] = val;
 
      return next;
    });
      setShowPreview(false); 
  };

  const removeQuestion = (sIdx, qIdx) => {
    Swal.fire({
      title: "Remove this question?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setSchema((prev) => {
          const next = { ...prev };
          next.sections[sIdx].questions = next.sections[sIdx].questions.filter(
            (_, i) => i !== qIdx
          );
          
          return next;
        });
        Swal.fire("Removed!", "Question has been deleted.", "success");
      }
    });
  };

  const addOption = (sIdx, qIdx) => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections[sIdx].questions[qIdx].options.push("");
 
      return next;
    });
  };

  const updateOption = (sIdx, qIdx, oIdx, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      next.sections[sIdx].questions[qIdx].options[oIdx] = val;
      return next;
    });
  };
  const saveSchema = async () => {
    try {
      await persistSchema(schema);
      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Feedback schema saved successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
        setTimeout(() => {
      setShowPreview(true); // 👈 open preview modal
    }, 1000);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.message || "Failed to save schema.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 min-h-screen p-6 md:ml-64">
        <h1 className="text-2xl font-bold mb-6">Feedback Questions Builder</h1>

        {/* Controls */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={addSection}
            className="flex items-center gap-2 px-5 py-2 mb-6 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            <FolderPlus size={16} /> Add Section
          </button>

          <button
            onClick={saveSchema}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 mb-6 rounded-lg text-white ${
              saving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search by section or question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-6"
        />

        {/* Render Sections */}
        {schema.sections
          .filter(
            (section) =>
              section.title.toLowerCase().includes(search.toLowerCase()) ||
              section.questions.some((q) =>
                q.label.toLowerCase().includes(search.toLowerCase())
              )
          )
          .map((section, sIdx) => {
            const filteredQuestions = section.questions.filter((q) =>
              q.label.toLowerCase().includes(search.toLowerCase())
            );

            return (
              <div key={sIdx} className="mb-8 bg-white shadow-md rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    value={section.title}
                    placeholder={`Section ${sIdx + 1} Title`}
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    className="border rounded px-3 py-2 w-full mr-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addQuestion(sIdx)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                    >
                      <PlusCircle size={16} /> Add Question
                    </button>
                    <button
                      onClick={() => removeSection(sIdx)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 size={16} /> Remove Section
                    </button>
                  </div>
                </div>

                {/* Questions Table */}
                {filteredQuestions.length > 0 ? (
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border px-3 py-2">Question</th>
                        <th className="border px-3 py-2">Type</th>
                        <th className="border px-3 py-2">Required</th>
                        <th className="border px-3 py-2">Options / Scale</th>
                        <th className="border px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((q, qIdx) => (
                        <tr key={qIdx} className="hover:bg-gray-100">
                          <td className="border px-3 py-2">
                            <input
                              type="text"
                              value={q.label}
                              placeholder="Question label"
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, "label", e.target.value)
                              }
                              className="w-full border px-2 py-1 rounded"
                            />
                          </td>

                          <td className="border px-3 py-2">
                            <select
                              value={q.type}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, "type", e.target.value)
                              }
                              className="w-full border px-2 py-1 rounded"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="radio">Radio</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="select">Select</option>
                              <option value="likert">Likert Scale</option>
                            </select>
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={q.required || false}
                              onChange={(e) =>
                                updateQuestion(
                                  sIdx,
                                  qIdx,
                                  "required",
                                  e.target.checked
                                )
                              }
                            />
                          </td>

                          <td className="border px-3 py-2">
                            {/* Regular Options */}
                            {(q.type === "radio" ||
                              q.type === "checkbox" ||
                              q.type === "select") && (
                              <div className="flex flex-col gap-1">
                                {q.options.map((opt, oIdx) => (
                                  <input
                                    key={oIdx}
                                    type="text"
                                    value={opt}
                                    placeholder={`Option ${oIdx + 1}`}
                                    onChange={(e) =>
                                      updateOption(sIdx, qIdx, oIdx, e.target.value)
                                    }
                                    className="w-full border px-2 py-1 rounded"
                                  />
                                ))}
                                <button
                                  onClick={() => addOption(sIdx, qIdx)}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm mt-1"
                                >
                                  + Add Option
                                </button>
                              </div>
                            )}

                            {/* Likert Scale Configuration */}
                            {q.type === "likert" && (
                              <div className="flex flex-col gap-3">
                                <div>
                                  <p className="font-semibold mb-1">Rows (Questions)</p>
                                  {q.rows?.map((row, rIdx) => (
                                    <input
                                      key={rIdx}
                                      type="text"
                                      value={row}
                                      placeholder={`Row ${rIdx + 1}`}
                                      onChange={(e) => {
                                        const next = { ...schema };
                                        next.sections[sIdx].questions[qIdx].rows[rIdx] =
                                          e.target.value;
                                        setSchema(next);
                                       
                                      }}
                                      className="w-full border px-2 py-1 rounded mb-1"
                                    />
                                  ))}
                                  <button
                                    onClick={() => {
                                      const next = { ...schema };
                                      next.sections[sIdx].questions[qIdx].rows.push("");
                                      setSchema(next);
                                      
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                                  >
                                    + Add Row
                                  </button>
                                </div>

                                <div>
                                  <p className="font-semibold mb-1">Columns (Ratings)</p>
                                  {q.columns?.map((col, cIdx) => (
                                    <input
                                      key={cIdx}
                                      type="text"
                                      value={col}
                                      placeholder={`Column ${cIdx + 1}`}
                                      onChange={(e) => {
                                        const next = { ...schema };
                                        next.sections[sIdx].questions[qIdx].columns[cIdx] =
                                          e.target.value;
                                        setSchema(next);
                                      
                                      }}
                                      className="w-full border px-2 py-1 rounded mb-1"
                                    />
                                  ))}
                                  <button
                                    onClick={() => {
                                      const next = { ...schema };
                                      next.sections[sIdx].questions[qIdx].columns.push("");
                                      setSchema(next);
                                  
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                                  >
                                    + Add Column
                                  </button>
                                </div>

                                {/* Preview */}
                                {q.rows?.length > 0 && q.columns?.length > 0 && (
                                  <table className="border border-gray-300 mt-3 text-sm">
                                    <thead>
                                      <tr>
                                        <th className="border px-2 py-1 bg-gray-100">
                                          Questions
                                        </th>
                                        {q.columns.map((col, i) => (
                                          <th
                                            key={i}
                                            className="border px-2 py-1 bg-gray-100"
                                          >
                                            {col}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {q.rows.map((row, i) => (
                                        <tr key={i}>
                                          <td className="border px-2 py-1 font-medium">
                                            {row}
                                          </td>
                                          {q.columns.map((_, j) => (
                                            <td
                                              key={j}
                                              className="border px-2 py-1 text-center"
                                            >
                                              <input
                                                type="radio"
                                                name={`row-${i}-${qIdx}`}
                                                disabled
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <button
                              onClick={() => removeQuestion(sIdx, qIdx)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 mx-auto"
                            >
                              <Trash2 size={16} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    {section.title.toLowerCase().includes(search.toLowerCase())
                      ? "No questions in this section."
                      : "No questions match your search."}
                  </p>
                )}
              </div>
            );
          })}

        {schema.sections.filter(
          (section) =>
            section.title.toLowerCase().includes(search.toLowerCase()) ||
            section.questions.some((q) =>
              q.label.toLowerCase().includes(search.toLowerCase())
            )
        ).length === 0 && (
          <p className="text-center py-6 text-gray-500">
            No sections or questions match your search.
          </p>
        )}
      </div>

    {/* --- Preview Modal --- */}
{showPreview && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto relative p-6">
      {/* Header */}
     
      <button
        onClick={() => setShowPreview(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4 text-center text-green-700">
     Preview of Saved Feedback Form
      </h2>


      {/* Preview Content */}
      {[...schema.sections].reverse().map((section, sIdx) => (

        <div key={sIdx} className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-indigo-700">
            {section.title || `Section ${sIdx + 1}`}
          </h3>

          {section.questions.length === 0 && (
            <p className="text-gray-500 italic">No questions in this section.</p>
          )}

          {section.questions.map((q, qIdx) => (
            <div key={qIdx} className="mb-5">
              <p className="font-medium mb-2">
                {q.label || `Untitled Question ${qIdx + 1}`}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </p>

              {/* Render input types based on question type */}
              {q.type === "text" && (
                <input
                  type="text"
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  placeholder="Short answer"
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  rows="3"
                  placeholder="Long answer"
                />
              )}

              {(q.type === "radio" || q.type === "checkbox") && (
                <div className="flex flex-col gap-1">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className="flex items-center gap-2">
                      <input type={q.type} disabled />
                      <span>{opt || `Option ${oIdx + 1}`}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "select" && (
                <select
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                >
                  <option>Select an option</option>
                  {q.options.map((opt, oIdx) => (
                    <option key={oIdx}>{opt}</option>
                  ))}
                </select>
              )}

              {q.type === "likert" &&
                q.rows?.length > 0 &&
                q.columns?.length > 0 && (
                  <table className="border border-gray-300 mt-3 text-sm w-full">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 bg-gray-100">
                          Questions
                        </th>
                        {q.columns.map((col, i) => (
                          <th key={i} className="border px-2 py-1 bg-gray-100">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="border px-2 py-1">{row}</td>
                          {q.columns.map((_, j) => (
                            <td
                              key={j}
                              className="border px-2 py-1 text-center"
                            >
                              <input type="radio" disabled />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="border-t pt-4 text-right">
        <button
          onClick={() => setShowPreview(false)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Close Preview
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
