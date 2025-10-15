import Sidebar from "../navbar/sidebar";
import React, { useState, useEffect } from "react";
import { PlusCircle, Save, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

export default function GTSAdmin() {
  const [schema, setSchema] = useState({ sections: [] });
  const location = useLocation();
  const isSurveyActive = location.pathname === "/gtsadmin";
  const [expandedSections, setExpandedSections] = useState({});
const [searchQuery, setSearchQuery] = useState("");
const [showPreview, setShowPreview] = useState(false);


// Filter sections based on search query
const filteredSections = schema.sections.filter((sec) => {
  const secMatch = sec.title.toLowerCase().includes(searchQuery.toLowerCase());
  const fieldMatch = sec.fields.some((f) =>
    (f.label || f.key || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  return secMatch || fieldMatch;
});
  useEffect(() => {
    fetch("/api/schema")
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
      })
      .catch((err) => console.error("❌ Error loading schema:", err));
  }, []);

  const persistSchema = async (schema) => {
    try {
        // Clean up empty rows in all checkbox-matrix fields
    const cleanedSchema = {
      ...schema,
      sections: schema.sections.map((sec) => ({
        ...sec,
        fields: sec.fields.map((f) => cleanTableData(f)),
      })),
    };

      const res = await fetch("/api/schema", {
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
   
  const toggleSection = (sIdx) => {
  setExpandedSections(prev => ({
    ...prev,
    [sIdx]: !prev[sIdx],
  }));
};
 const saveSchema = async () => {
  try {
    await persistSchema(schema);
    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Successfully updated.",
       timer: 1500,
     showConfirmButton: false,
    });
    setShowPreview(true); 
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: err.message || "Something went wrong while saving.",
      confirmButtonColor: "#dc2626" // red
    });
  }
};
  const updateField = (sIdx, fIdx, key, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      const f = { ...next.sections[sIdx].fields[fIdx] };
      f[key] = val;
      next.sections[sIdx].fields[fIdx] = f;
      persistSchema(next);
      return next;
    });
  };

  const addField = (sIdx) => {
    setSchema((prev) => {
      const next = { ...prev };
      const count = next.sections[sIdx].fields.length + 1;
      const sectionKey = next.sections[sIdx].title
        .toLowerCase()
        .replace(/\s+/g, "");
      next.sections[sIdx].fields.push({
        key: `${sectionKey}_field${count}`,
        label: `Field ${count}`,
        type: "text",
        options: [],
        columnLabels: [],
        rowLabels: [],
        tableData: [],
      });
      persistSchema(next);
      return next;
    });
  };
const removeField = (sIdx, fIdx) => {
  Swal.fire({
    title: "Remove field?",
    text: "This field will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280"
  }).then((result) => {
    if (result.isConfirmed) {
      setSchema((prev) => {
        const next = { ...prev };
        next.sections[sIdx].fields = next.sections[sIdx].fields.filter(
          (_, i) => i !== fIdx
        );
        persistSchema(next);
        return next;
      });

      Swal.fire("Removed!", "The field has been deleted.", "success");
    }
  });
};
const addSection = () => {
  setSchema((prev) => {
    const newSectionNumber = prev.sections.length + 1; // highest section number
    const newSection = {
      title: `New Row ${newSectionNumber}`,
      fields: [],
    };

    // Put the new section at the top visually
    return {
      ...prev,
      sections: [newSection, ...prev.sections],
    };
  });
};

  const removeSection = (sIdx) => {
  Swal.fire({
    title: "Are you sure?",
    text: "This section and all its fields will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280"
  }).then((result) => {
    if (result.isConfirmed) {
      setSchema((prev) => {
        const next = { ...prev };
        next.sections = next.sections.filter((_, i) => i !== sIdx);
        persistSchema(next);
        return next;
      });

      Swal.fire("Deleted!", "The section has been removed.", "success");
    }
  });
};

const addOption = (sIdx, fIdx) => {
  setSchema((prev) => {
    const next = { ...prev };
    const f = { ...next.sections[sIdx].fields[fIdx] };

    // Ensure options array exists
    if (!Array.isArray(f.options)) {
      f.options = [];
    }

    // Add only one option per click
    const newOption = `Option ${f.options.length + 1}`;
    f.options = [...f.options, newOption];

    next.sections[sIdx].fields[fIdx] = f;
    persistSchema(next);
    return next;
  });
};
  const updateOption = (sIdx, fIdx, oIdx, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      const f = { ...next.sections[sIdx].fields[fIdx] };
      f.options[oIdx] = val;
      next.sections[sIdx].fields[fIdx] = f;
      return next;
    });
  };
  const updateColumnLabel = (sIdx, fIdx, cIdx, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      const f = { ...next.sections[sIdx].fields[fIdx] };
      f.columnLabels[cIdx] = val;
      next.sections[sIdx].fields[fIdx] = f;
      return next;
    });
  };
  const updateRowLabel = (sIdx, fIdx, rIdx, val) => {
    setSchema((prev) => {
      const next = { ...prev };
      const f = { ...next.sections[sIdx].fields[fIdx] };
      f.rowLabels[rIdx] = val;
      next.sections[sIdx].fields[fIdx] = f;
      return next;
    });
  };

 
  // ✅ Add column (applies to both checkbox-matrix and multiple)
const addColumnLabel = (sIdx, fIdx) => {
  setSchema((prev) => {
    const next = { ...prev };
    const f = { ...next.sections[sIdx].fields[fIdx] };

    f.columnLabels = [...(f.columnLabels || []), ""];

    // Expand each row in tableData
    f.tableData = (f.tableData || []).map((row) => [
      ...row,
      f.type === "checkbox-matrix" ? false : "",
    ]);

    next.sections[sIdx].fields[fIdx] = f;
    persistSchema(next);
    return next;
  });
};

// ✅ Add row (applies to both checkbox-matrix and multiple)
const addRowLabel = (sIdx, fIdx) => {
  setSchema((prev) => {
    const next = { ...prev };
    const f = { ...next.sections[sIdx].fields[fIdx] };

    f.rowLabels = [...(f.rowLabels || []), ""];
    const colCount = (f.columnLabels || []).length;

    const newRow = Array(colCount).fill(
      f.type === "checkbox-matrix" ? false : ""
    );

    f.tableData = [...(f.tableData || []), newRow];

    next.sections[sIdx].fields[fIdx] = f;
    persistSchema(next);
    return next;
  });
};

// ✅ Update text cell (multiple type)
const updateTableCell = (sIdx, fIdx, rIdx, cIdx, val) => {
  setSchema((prev) => {
    const next = { ...prev };
    const f = { ...next.sections[sIdx].fields[fIdx] };

    f.tableData = f.tableData || [];

    if (!f.tableData[rIdx]) {
      f.tableData[rIdx] = Array((f.columnLabels || []).length).fill("");
    }

    f.tableData[rIdx][cIdx] = val;

    next.sections[sIdx].fields[fIdx] = f;
    persistSchema(next);
    return next;
  });
};

// ✅ Update checkbox cell (checkbox-matrix type)
const updateCheckboxCell = (sIdx, fIdx, rIdx, cIdx, checked) => {
  setSchema((prev) => {
    const next = { ...prev };
    const f = { ...next.sections[sIdx].fields[fIdx] };

    f.tableData = f.tableData || [];

    if (!f.tableData[rIdx]) {
      f.tableData[rIdx] = Array((f.columnLabels || []).length).fill(false);
    }

    f.tableData[rIdx][cIdx] = checked;

    next.sections[sIdx].fields[fIdx] = f;
    persistSchema(next);
    return next;
  });
};
  const cleanTableData = (f) => {
  if (f.type === "checkbox-matrix") {
    const cleanedRows = [];
    const cleanedRowLabels = [];

    (f.rowLabels || []).forEach((rowLabel, rIdx) => {
      const row = f.tableData?.[rIdx] || [];

      const hasChecked = row.some((cell) => cell === true);
      const hasLabel = rowLabel && rowLabel.trim() !== "";

      if (hasChecked || hasLabel) {
        cleanedRowLabels.push(rowLabel);
        cleanedRows.push(row);
      }
    });

    
    return {
      ...f,
      rowLabels: cleanedRowLabels,
      tableData: cleanedRows,
    };
  }
  // ✅ Clean empty rows in "multiple" input tables
  if (f.type === "multiple") {
    const cleanedRows = [];
    const cleanedRowLabels = [];

    (f.rowLabels || []).forEach((rowLabel, rIdx) => {
      const row = f.tableData?.[rIdx] || [];

      const hasValue = row.some((cell) => cell && cell.toString().trim() !== "");
      const hasLabel = rowLabel && rowLabel.trim() !== "";

      if (hasValue || hasLabel) {
        cleanedRowLabels.push(rowLabel);
        cleanedRows.push(row);
      }
    });

    return {
      ...f,
      rowLabels: cleanedRowLabels,
      tableData: cleanedRows,
      columnLabels: (f.columnLabels || []).filter(
        (col) => col && col.trim() !== ""
      ),
    };
  }
  
  // ✅ Clean empty options for select/radio/checkbox fields
  if (["select", "radio", "checkbox"].includes(f.type)) {
    return {
      ...f,
      options: (f.options || []).filter(
        (opt) => opt && opt.trim() !== ""
      ),
    };
  }
  return f;
};
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 min-h-screen p-6 md:ml-64">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            GTS Form Builder
          </h1>

          <div className="flex justify-between mt-10">
            <button
              onClick={addSection}
              className="flex items-center gap-2 px-5 py-2 mb-6 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
            >
              <PlusCircle size={16} /> Add Section
            </button>
            <button
              onClick={saveSchema}
              className="flex items-center gap-2 px-6 py-2 mb-6 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>

<div className="mb-4">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search section or question..."
    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
  />
</div>

{filteredSections.map((sec, sIdx) => {
  const isExpanded = expandedSections[sIdx] || false;
  return (
    <div key={sIdx} className="mb-4 border rounded p-4 bg-white shadow-sm">
      
      <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection(sIdx)}>
        <button onClick={() => removeSection(sIdx)} className="text-red-600 flex items-center gap-1 hover:text-red-800 text-sm" > <Trash2 size={16} /> Remove </button>
        <h2 className="font-semibold text-gray-700">
          Section {sIdx + 1}: {sec.title}
        </h2>
        <span>{isExpanded ? "▼" : "▶"}</span>
        
      </div>

      {isExpanded && (
        <div className="mt-3">
          <input
            value={sec.title}
            onChange={(e) => {
              const val = e.target.value;
              setSchema(prev => {
                const next = { ...prev };
                next.sections[sIdx] = { ...next.sections[sIdx], title: val };
                return next;
              });
            }}
            className="w-full border rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-400"
          />

          {sec.fields.map((f, fIdx) => (
          <div key={fIdx} className="border rounded p-2 mb-2 bg-gray-50">
            <p className="font-medium text-gray-700 mb-1">
              {`Question ${fIdx + 1}: ${f.label || f.key || `Untitled Field`}`}
            </p>

                    <input
                      value={f.label}
                      placeholder="Label"
                      onChange={(e) => updateField(sIdx, fIdx, "label", e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      value={f.key}
                      placeholder="Key"
                      onChange={(e) => updateField(sIdx, fIdx, "key", e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-indigo-400"
                    />

                    <div className="relative">
                      <select
                        value={f.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          updateField(sIdx, fIdx, "type", newType);
                          if (["text", "email", "date"].includes(newType) && !f.placeholder) {
                            updateField(sIdx, fIdx, "placeholder", `Enter ${f.label}`);
                          }
                        }}
                        className="w-full border rounded px-3 py-2 pr-10 bg-white appearance-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="radio">Radio</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="checkbox-matrix">Matrix Checkbox</option>
                        <option value="multiple">Multiple Inputs</option>
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
                    <div className="flex items-center gap-3 mb-2">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={f.required || false}
                          onChange={(e) => updateField(sIdx, fIdx, "required", e.target.checked)}
                        />{" "}
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(sIdx, fIdx)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Field
                      </button>
                    </div>

                    {f.type === "multiple" && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">Tabular Input</p>
                        <div className="overflow-auto border rounded mb-3">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border px-2 py-1 bg-gray-100"></th>
                                {(f.columnLabels || []).map((col, cIdx) => (
                                  <th key={cIdx} className="border px-2 py-1">
                                    <input
                                      type="text"
                                      value={col}
                                      placeholder={`Column ${cIdx + 1}`}
                                      onChange={(e) => updateColumnLabel(sIdx, fIdx, cIdx, e.target.value)}
                                      className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-400"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(f.rowLabels || []).map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="border px-2 py-1">
                                    <input
                                      type="text"
                                      value={row}
                                      placeholder={`Row ${rIdx + 1}`}
                                      onChange={(e) => updateRowLabel(sIdx, fIdx, rIdx, e.target.value)}
                                      className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-400"
                                    />
                                  </td>
                                  {(f.columnLabels || []).map((_, cIdx) => (
                                    <td key={cIdx} className="border px-2 py-1">
                                      <input
                                        type="text"
                                        value={f.tableData?.[rIdx]?.[cIdx] || ""}
                                        onChange={(e) => updateTableCell(sIdx, fIdx, rIdx, cIdx, e.target.value)}
                                        className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-400"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => addColumnLabel(sIdx, fIdx)}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                          >
                            + Column
                          </button>
                          <button
                            onClick={() => addRowLabel(sIdx, fIdx)}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                          >
                            + Row
                          </button>
                        </div>
                      </div>
                    )}

                  {f.type === "checkbox-matrix" && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-2">Checkbox Matrix</p>
                      <div className="overflow-auto border rounded mb-3">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1 bg-gray-100"></th>
                              {(f.columnLabels || []).map((col, cIdx) => (
                                <th key={cIdx} className="border px-2 py-1">
                                  <input
                                    type="text"
                                    value={col}
                                    placeholder={`Column ${cIdx + 1}`}
                                    onChange={(e) => updateColumnLabel(sIdx, fIdx, cIdx, e.target.value)}
                                    className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-400"
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(f.rowLabels || []).map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className="border px-2 py-1">
                                  <input
                                    type="text"
                                    value={row}
                                    placeholder={`Row ${rIdx + 1}`}
                                    onChange={(e) => updateRowLabel(sIdx, fIdx, rIdx, e.target.value)}
                                    className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-400"
                                  />
                                </td>
                                {(f.columnLabels || []).map((_, cIdx) => (
                                  <td key={cIdx} className="border px-2 py-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={f.tableData?.[rIdx]?.[cIdx] || false}
                                      onChange={(e) =>
                                        updateCheckboxCell(sIdx, fIdx, rIdx, cIdx, e.target.checked)
                                      }
                                      className="w-5 h-5 mx-auto"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => addColumnLabel(sIdx, fIdx)}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                        >
                          + Column
                        </button>
                        <button
                          onClick={() => addRowLabel(sIdx, fIdx)}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                        >
                          + Row
                        </button>
                      </div>
                    </div>
                  )}
                    {(f.type === "select" || f.type === "radio" || f.type === "checkbox"  ) && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Options:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {(f.options || []).map((opt, oIdx) => (
                            <input
                              key={oIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(sIdx, fIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                              className="border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-400"
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => addOption(sIdx, fIdx)}
                          type="button"
                          className="mt-3 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          <PlusCircle size={16} /> Add Option
                        </button>
                      </div>
                    )}

                    <div className="mt-3">
                    <p className="text-xs font-medium mb-1">Conditional Display (showWhen):</p>

                    {(Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen || {}]).map(
                      (cond, condIdx) => (
                        <div key={condIdx} className="flex gap-2 mb-2">
                          <input
                            value={cond.key || ""}
                            placeholder="Trigger Field Key"
                            onChange={(e) => {
                              const newConds = [...(Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen || {}])];
                              newConds[condIdx] = { ...newConds[condIdx], key: e.target.value };
                              updateField(sIdx, fIdx, "showWhen", newConds);
                            }}
                            className="w-1/2 border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-400"
                          />
                          <input
                            value={cond.equals || ""}
                            placeholder="Trigger Value"
                            onChange={(e) => {
                              const newConds = [...(Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen || {}])];
                              newConds[condIdx] = { ...newConds[condIdx], equals: e.target.value };
                              updateField(sIdx, fIdx, "showWhen", newConds);
                            }}
                            className="w-1/2 border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newConds = [...(Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen || {}])];
                              newConds.splice(condIdx, 1);
                              updateField(sIdx, fIdx, "showWhen", newConds);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newConds = Array.isArray(f.showWhen) ? [...f.showWhen] : [];
                        newConds.push({ key: "", equals: "" });
                        updateField(sIdx, fIdx, "showWhen", newConds);
                      }}
                      className="mt-1 text-indigo-600 text-xs hover:text-indigo-800"
                    >
                      + Add Condition
                    </button>
                    </div>
                  </div>
                ))}
          <button onClick={() => addField(sIdx)} className="mt-2 text-green-600 hover:text-green-800 flex items-center gap-1">
            <PlusCircle size={16} /> Add Field
          </button>
        </div>
      )}
    </div>
  );
})}
       </div>
      </div>

      {showPreview && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 rounded-lg shadow-lg p-6 relative overflow-y-auto max-h-[90vh]">
      <button
        onClick={() => setShowPreview(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4 text-center text-green-700">
        GTS Form Preview
      </h2>

      {[...schema.sections].map((sec, sIdx) => (
        <div key={sIdx} className="mb-6 border-b pb-4">
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            {sec.title || `Section ${schema.sections.length - sIdx}`}
          </h3>

          {sec.fields.map((f, fIdx) => (
            <div key={fIdx} className="mb-4">
              <p className="font-medium mb-1">
                {f.label || f.key || `Question ${fIdx + 1}`}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </p>

              {f.type === "text" && (
                <input
                  type="text"
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  placeholder={f.placeholder || "Short answer"}
                />
              )}

              {f.type === "email" && (
                <input
                  type="email"
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  placeholder={f.placeholder || "Enter email"}
                />
              )}

              {f.type === "date" && (
                <input
                  type="date"
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                />
              )}

              {(f.type === "radio" || f.type === "checkbox") && (
                <div className="flex flex-col gap-1">
                  {f.options?.map((opt, oIdx) => (
                    <label key={oIdx} className="flex items-center gap-2">
                      <input type={f.type} disabled />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {f.type === "select" && (
                <select
                  disabled
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                >
                  <option>Select an option</option>
                  {f.options?.map((opt, oIdx) => (
                    <option key={oIdx}>{opt}</option>
                  ))}
                </select>
              )}

              {f.type === "multiple" && (
                <table className="border border-gray-300 mt-3 text-sm w-full">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 bg-gray-100"></th>
                      {f.columnLabels?.map((col, i) => (
                        <th key={i} className="border px-2 py-1 bg-gray-100">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {f.rowLabels?.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{row}</td>
                        {f.columnLabels?.map((_, j) => (
                          <td key={j} className="border px-2 py-1">
                            <input
                              type="text"
                              disabled
                              className="w-full border rounded bg-gray-100"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {f.type === "checkbox-matrix" && (
                <table className="border border-gray-300 mt-3 text-sm w-full">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 bg-gray-100"></th>
                      {f.columnLabels?.map((col, i) => (
                        <th key={i} className="border px-2 py-1 bg-gray-100">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {f.rowLabels?.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{row}</td>
                        {f.columnLabels?.map((_, j) => (
                          <td
                            key={j}
                            className="border px-2 py-1 text-center"
                          >
                            <input type="checkbox" disabled />
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
    </div>
  </div>
)}
</div>
  );
}
