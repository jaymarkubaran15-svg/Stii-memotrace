import React, { useState, useEffect } from "react";

export default function GTSPage() {
  const [schema, setSchema] = useState({
    sections: []
  });
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState("form");
// Add new state to track step
const [currentStep, setCurrentStep] = useState(0);

// Go to next step
const nextStep = () => {
  if (currentStep < schema.sections.length - 1) {
    setCurrentStep(prev => prev + 1);
  }
};

// Go to previous step
const prevStep = () => {
  if (currentStep > 0) {
    setCurrentStep(prev => prev - 1);
  }
};

  useEffect(() => {
    const saved = localStorage.getItem("ched_gts_dynamic");
    if (saved) setData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("ched_gts_dynamic", JSON.stringify(data));
  }, [data]);

  // Load schema from DB when page mounts
useEffect(() => {
  fetch("/api/schema")
    .then(res => res.json())
    .then(result => {
      if (result.success && result.schema) {
        const fixed = {
          ...result.schema,
          sections: (result.schema.sections || []).map(sec => ({
            ...sec,
            fields: sec.fields || []  // 🔥 ensure array
          }))
        };
        setSchema(fixed);
      }
    })
    .catch(err => console.error("❌ Error loading schema:", err));
}, []);

// Clear localStorage after successful submit
const onSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);
  if (!validate()) return;

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Data saved to database!");
      setData({});
      localStorage.removeItem("ched_gts_dynamic"); // clear saved answers
    } else {
      alert("❌ Error saving data");
    }
  } catch (err) {
    alert("❌ " + err.message);
  }
};

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const e = {};
    schema.sections.forEach(s => {
      s.fields.forEach(f => {
        if (f.required && shouldShowField(f) && !data[f.key]) e[f.key] = `${f.label} is required`;
      });
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const shouldShowField = (field) => {
    if (!field.showWhen) return true;
    return data[field.showWhen.key] === field.showWhen.equals;
  };

 
// Add new column label
const addColumnLabel = (sIdx, fIdx) => {
  setSchema((prev) => {
    const newSchema = { ...prev };
    newSchema.sections[sIdx].fields[fIdx].columnLabels =
      newSchema.sections[sIdx].fields[fIdx].columnLabels || [];
    newSchema.sections[sIdx].fields[fIdx].columnLabels.push("");
    return newSchema;
  });
};

// Update existing column label
const updateColumnLabel = (sIdx, fIdx, lIdx, value) => {
  setSchema((prev) => {
    const newSchema = { ...prev };
    newSchema.sections[sIdx].fields[fIdx].columnLabels[lIdx] = value;
    return newSchema;
  });
};


const saveSchema = async () => {
  try {
    await persistSchema(schema);
    alert("✅ Schema saved!");
  } catch (err) {
    alert("❌ " + err.message);
  }
};

 const updateField = (sIdx, fIdx, key, val) => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = [...next.sections];
    next.sections[sIdx] = { ...next.sections[sIdx] };
    next.sections[sIdx].fields = [...next.sections[sIdx].fields];
    next.sections[sIdx].fields[fIdx] = { ...next.sections[sIdx].fields[fIdx], [key]: val };

    persistSchema(next); // 🔥 auto-save schema
    return next;
  });
};

const addField = (sIdx) => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = [...next.sections];
    next.sections[sIdx] = { ...next.sections[sIdx] };
    const count = next.sections[sIdx].fields.length + 1;
    const sectionKey = next.sections[sIdx].title.toLowerCase().replace(/\s+/g, '');
    next.sections[sIdx].fields = [
      ...next.sections[sIdx].fields,
      {
        key: `${sectionKey}.field${count}`,
        label: `Field ${count}`,
        type: "text",
        options: []
      }
    ];

    persistSchema(next); // 🔥 auto-save
    return next;
  });
};



const addSection = () => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = [
      ...next.sections,
      { title: `Section ${next.sections.length + 1}`, fields: [] }
    ];
    persistSchema(next);
    return next;
  });
};

const addOption = (sIdx, fIdx) => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = [...next.sections];
    next.sections[sIdx] = { ...next.sections[sIdx] };
    next.sections[sIdx].fields = [...next.sections[sIdx].fields];
    const f = { ...next.sections[sIdx].fields[fIdx] };
    const optCount = (f.options?.length || 0) + 1;
    f.options = [...(f.options || []), `Option ${optCount}`];
    next.sections[sIdx].fields[fIdx] = f;
    return next;
  });
};

  const updateOption = (sIdx, fIdx, oIdx, val) => {
    setSchema(prev => {
      const next = { ...prev };
      next.sections = [...next.sections];
      next.sections[sIdx] = { ...next.sections[sIdx] };
      next.sections[sIdx].fields = [...next.sections[sIdx].fields];
      const f = { ...next.sections[sIdx].fields[fIdx] };
      f.options = [...(f.options || [])];
      f.options[oIdx] = val;
      next.sections[sIdx].fields[fIdx] = f;
      return next;
    });
  };

// helper to save schema to DB
const persistSchema = async (schema) => {
  try {
    const res = await fetch("/api/schema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema }), // 🔥 wrap inside {schema}
    });
    const result = await res.json();
    if (!result.success) throw new Error("Failed to save schema");
  } catch (err) {
    console.error("❌ Error saving schema:", err);
  }
};



// Remove a field from a section
const removeField = (sIdx, fIdx) => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = [...next.sections];
    next.sections[sIdx] = { ...next.sections[sIdx] };
    next.sections[sIdx].fields = next.sections[sIdx].fields.filter((_, i) => i !== fIdx);

    persistSchema(next); // save updated schema to DB
    return next;
  });
};

// Remove a section
const removeSection = (sIdx) => {
  setSchema(prev => {
    const next = { ...prev };
    next.sections = next.sections.filter((_, i) => i !== sIdx);

    persistSchema(next); // save updated schema to DB
    return next;
  });
};


  const RenderField = ({ field, number }) => {
    if (!shouldShowField(field)) return null;
    const value = data[field.key] || "";
    const err = errors[field.key];

     if (["text", "email", "date"].includes(field.type)) {
        // --- Multiple rows (multiInputs) ---
        if (field.allowMultiple && field.multiInputs && field.multiInputs.length > 0) {
          let values = Array.isArray(data[field.key]) ? data[field.key] : [];

          // Ensure at least one row
          if (values.length === 0) {
            values = [
              Object.fromEntries(
                field.multiInputs.map((inp, iIdx) => [inp.key || `col${iIdx}`, ""])
              )
            ];
            update(field.key, values);
          }

          return (
            <div className="mb-3">
            {field.label && (
              <label className="block mb-1 font-medium text-gray-700">
                {number}. {field.label}
              </label>
            )}
            <div>
              {values.map((row, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-4 mb-3">
                  {field.multiInputs.map((inp, iIdx) => (
                    <input
                      key={iIdx}
                      type={inp.type}
                      placeholder={inp.placeholder || "Enter value"}
                      value={row[inp.key || `col${iIdx}`] || ""}
                      onChange={(e) => {
                        const arr = [...values];
                        arr[idx][inp.key || `col${iIdx}`] = e.target.value;
                        update(field.key, arr);
                      }}
                      className="border rounded px-2 py-1"
                    />
                  ))}
                  <button
                    type="button"
                    disabled={values.length === 1}
                    onClick={() => {
                      const arr = values.filter((_, i) => i !== idx);
                      update(field.key, arr);
                    }}
                    className={`px-3 rounded-xl border ${
                      values.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    −
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const arr = [
                    ...values,
                    Object.fromEntries(
                      field.multiInputs.map((inp, iIdx) => [
                        inp.key || `col${iIdx}`,
                        ""
                      ])
                    )
                  ];
                  update(field.key, arr);
                }}
                className="mb-4 px-4 py-2 rounded-xl border"
              >
                + Add Row
              </button>
            </div>
            </div>
          );
        }

       // --- Single input ---
        return (
          <div className="mb-3">
            {field.label && (
              <label className="block mb-1 font-medium text-gray-700">
                {number}. {field.label}
              </label>
            )}
            <input
              type={field.type}
              placeholder={field.placeholder || "Enter value"}
              value={data[field.key] || ""}
              onChange={(e) => update(field.key, e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        );

      }


    if (field.type === "select") {
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium">{number}. {field.label}{field.required && <span className="text-red-600"> *</span>}</label>
          <select value={value} onChange={e => update(field.key, e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">— Select —</option>
            {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
          </select>
          {submitted && err && <p className="text-xs text-red-600">{err}</p>}
        </div>
      );
    }
    if (field.type === "radio") {
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium">{number}. {field.label}{field.required && <span className="text-red-600"> *</span>}</label>
          <div className="flex gap-3 flex-wrap">
            {(field.options || []).map((o, i) => (
              <label key={i} className="inline-flex items-center gap-2">
                <input type="radio" name={field.key} value={o} checked={value === o} onChange={e => update(field.key, e.target.value)} /> {o}
              </label>
            ))}
          </div>
          {submitted && err && <p className="text-xs text-red-600">{err}</p>}
        </div>
      );
    }
 if (field.type === "checkbox") {
  const values = Array.isArray(value) ? value : [];
  const selected = new Set(values);

  const hasGroups = Array.isArray(field.groups) && field.groups.length > 0;

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium">
        {number}. {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>

     {/* ✅ Column Labels Row */}
{field.columnLabels && field.columnLabels.length > 0 && (
  <div
    className="grid gap-6 mb-2 font-semibold text-sm"
    style={{ gridTemplateColumns: `repeat(${field.columnLabels.length}, minmax(0, 1fr))` }}
  >
    {field.columnLabels.map((colLabel, idx) => (
      <div key={idx} className="text-center">
        {colLabel}
      </div>
    ))}
  </div>
)}


      {hasGroups ? (
        /* Grouped layout */
        <div className="grid gap-6 mb-2 font-semibold text-sm">
          {field.groups.map((group, gIdx) => (
            <div key={gIdx}>
              <p className="font-medium mb-2">{group?.title || `Group ${gIdx + 1}`}</p>
              {(group?.options || []).map((opt, i) => {
                const token = `${gIdx}:${opt}`;
                const isOthers = String(opt).toLowerCase() === "others";
                const othersKey = `${field.key}__others_${gIdx}`;

                return (
                  <div key={i} className="mb-2">
                   <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(token)}
                        onChange={(e) => {
                          const set = new Set(selected);
                          e.target.checked ? set.add(token) : set.delete(token);
                          update(field.key, Array.from(set));
                        }}
                      />
                      {opt}
                    </label>

                    {isOthers && selected.has(token) && (
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={data?.[othersKey] || ""}
                        onChange={(e) => update(othersKey, e.target.value)}
                        className="mt-1 ml-6 border rounded px-2 py-1 text-sm w-full"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        /* Ungrouped layout */
        <div className="grid gap-6 mb-2 font-semibold text-sm"
            style={{
              gridTemplateColumns: `repeat(${field.columnLabels?.length || 2}, minmax(0, 1fr))`,
            }}>
          {(field.options || []).map((o, i) => {
              const isOthers = String(o).toLowerCase() === "others";
              const othersKey = `${field.key}__others`;

              return (
                <div key={i} className=" text-center">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={o}
                      checked={selected.has(o)}
                      onChange={(e) => {
                        const set = new Set(selected);
                        e.target.checked ? set.add(o) : set.delete(o);
                        update(field.key, Array.from(set));
                      }}
                    />
                    {o}
                  </label>

                  {isOthers && selected.has(o) && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={data?.[othersKey] || ""}
                      onChange={(e) => update(othersKey, e.target.value)}
                      className="mt-1 ml-6 border rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>
              );
            })}
        </div>
      )}

      {submitted && err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}



    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab("form")} className={`px-4 py-2 rounded ${tab === "form" ? "bg-indigo-600 text-white" : "border"}`}>Form</button>
          <button onClick={() => setTab("admin")} className={`px-4 py-2 rounded ${tab === "admin" ? "bg-indigo-600 text-white" : "border"}`}>Admin</button>
        </div>

       {tab === "form" && (
  <form onSubmit={onSubmit}>
    <h1 className="text-2xl font-bold mb-2">Graduate Tracer Survey (GTS)</h1>
    <p className="text-sm mb-4">Commission on Higher Education – Philippines</p>

    {schema.sections.length > 0 && (
      <section className="mb-6 border p-4 rounded-xl bg-white">
        <h2 className="text-lg font-semibold mb-3">
          Step {currentStep + 1} of {schema.sections.length}: {schema.sections[currentStep].title}
        </h2>

        {schema.sections[currentStep].fields.map((f, fIdx) => (
          <RenderField
            key={f.key || fIdx}
            field={f}
            number={fIdx + 1}
          />
        ))}
      </section>
    )}

    <div className="flex justify-between">
      {currentStep > 0 && (
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2 border rounded bg-gray-200 hover:bg-gray-300"
        >
          ← Back
        </button>
      )}

      {currentStep < schema.sections.length - 1 ? (
        <button
          type="button"
          onClick={nextStep}
          className="ml-auto bg-indigo-600 text-white px-5 py-2 rounded"
        >
          Next →
        </button>
      ) : (
        <button
          type="submit"
          className="ml-auto bg-green-600 text-white px-5 py-2 rounded"
        >
          Submit
        </button>
      )}
    </div>
  </form>
)}


        {tab === "admin" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Edit Form Schema</h1>
            {schema.sections.map((sec, sIdx) => {
              let fieldCounter = 0;
              return (
                <div key={sIdx} className="mb-6 border p-4 rounded-xl bg-white">
                  <h2 className="text-lg font-semibold mb-2">Section {sIdx + 1}: {sec.title}</h2>
                  <input value={sec.title} onChange={e => {
                    const val = e.target.value;
                    setSchema(prev => {
                      const next = { ...prev };
                      next.sections = [...next.sections];
                      next.sections[sIdx] = { ...next.sections[sIdx], title: val };
                      return next;
                    });
                  }} className="w-full border rounded px-2 py-1 font-semibold mb-2" />

                  {sec.fields.map((f, fIdx) => (
                    <div key={fIdx} className="border rounded p-2 mb-2">
                      <p className="text-xs font-medium mb-1">Field {++fieldCounter}</p>
                      <input value={f.label} placeholder="Label" onChange={e => updateField(sIdx, fIdx, "label", e.target.value)} className="w-full border rounded px-2 py-1 mb-1" />
                      <input value={f.key} placeholder="Key" onChange={e => updateField(sIdx, fIdx, "key", e.target.value)} className="w-full border rounded px-2 py-1 mb-1" />
                    {["text", "email", "date"].includes(f.type) && (
                        <div className="mt-2">
                          {f.allowMultiple ? (
                            <>
                              <p className="text-xs font-medium mb-1">Inputs (columns in row):</p>
                              {(f.multiInputs || []).map((inp, iIdx) => (
                                <div key={iIdx} className="flex gap-2 mb-1">
                                  <input
                                    value={inp.key}
                                    placeholder="Column Key"
                                    onChange={(e) => {
                                      const updated = [...(f.multiInputs || [])];
                                      updated[iIdx].key = e.target.value;
                                      updateField(sIdx, fIdx, "multiInputs", updated);
                                    }}
                                    className="border rounded px-2 py-1 w-1/4"
                                  />
                                  <select
                                    value={inp.type}
                                    onChange={(e) => {
                                      const updated = [...(f.multiInputs || [])];
                                      updated[iIdx].type = e.target.value;
                                      updateField(sIdx, fIdx, "multiInputs", updated);
                                    }}
                                    className="border rounded px-2 py-1 w-1/4"
                                  >
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="date">Date</option>
                                  </select>
                                  <input
                                    value={inp.placeholder}
                                    placeholder="Placeholder"
                                    onChange={(e) => {
                                      const updated = [...(f.multiInputs || [])];
                                      updated[iIdx].placeholder = e.target.value;
                                      updateField(sIdx, fIdx, "multiInputs", updated);
                                    }}
                                    className="border rounded px-2 py-1 w-1/2"
                                  />
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [
                                    ...(f.multiInputs || []),
                                    {
                                      key: `col${(f.multiInputs?.length || 0) + 1}`,
                                      type: "text",
                                      placeholder: ""
                                    }
                                  ];
                                  updateField(sIdx, fIdx, "multiInputs", updated);
                                }}
                                className="border px-2 py-1 rounded text-sm"
                              >
                                + Add Column
                              </button>
                            </>
                          ) : (
                            <input
                              value={f.placeholder || ""}
                              placeholder="Placeholder (e.g. Enter your name)"
                              onChange={(e) => updateField(sIdx, fIdx, "placeholder", e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            />
                          )}

                          <label className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              checked={f.allowMultiple || false}
                              onChange={(e) => updateField(sIdx, fIdx, "allowMultiple", e.target.checked)}
                            />
                            Allow multiple rows
                          </label>
                        </div>
                      )}



                     <select
                        value={f.type}
                        onChange={e => {
                          const newType = e.target.value;
                          updateField(sIdx, fIdx, "type", newType);

                          if (["text", "email", "date"].includes(newType) && !f.placeholder) {
                            updateField(sIdx, fIdx, "placeholder", `Enter ${f.label}`);
                          }
                        }}
                        className="w-full border rounded px-2 py-1 mb-1"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="radio">Radio</option>
                        <option value="checkbox">Checkbox</option>
                      </select>

                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={f.required || false} onChange={e => updateField(sIdx, fIdx, "required", e.target.checked)} /> Required
                      </label>
                       {/* Remove field button */}
                        <button type="button" onClick={() => removeField(sIdx, fIdx)} className="ml-2 text-red-600 text-xs underline">Remove Field</button>
                    {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
  <div className="mt-2">
    <p className="text-sm mb-2 font-semibold">Options:</p>

    {/* Editable Column Labels → only show for checkboxes */}
   {f.type === "checkbox" && (
  <div className="mt-3">
    <p className="text-xs mb-1 font-medium">Column Labels:</p>

    {(f.columnLabels || []).map((label, lIdx) => (
      <input
        key={lIdx}
        value={label}
        onChange={(e) =>
          updateColumnLabel(sIdx, fIdx, lIdx, e.target.value)
        }
        className="w-full border rounded px-2 py-1 mb-1"
        placeholder={`Column Label ${lIdx + 1}`}
      />
    ))}

    <button
      onClick={() => addColumnLabel(sIdx, fIdx)}
      type="button"
      className="border px-2 py-1 rounded"
    >
      + Add Column Label
    </button>
  </div>
)}


    {/* Options list */}
    <div className="grid grid-cols-2 gap-4">
      {(f.options || []).map((opt, oIdx) => (
        <div key={oIdx} className="flex items-center gap-2">
          <input
            type="text"
            value={opt}
            onChange={e => updateOption(sIdx, fIdx, oIdx, e.target.value)}
            placeholder={`Option ${oIdx + 1}`}
            className="flex-1 border rounded px-2 py-1"
          />
        </div>
      ))}
    </div>

    <button
      onClick={() => addOption(sIdx, fIdx)}
      type="button"
      className="mt-2 border px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-sm"
    >
      + Add Option
    </button>
  </div>
)}



                      <div className="mt-2">
                        <p className="text-xs mb-1 font-medium">Conditional Display (showWhen):</p>
                        <input   value={f.showWhen?.key || ""}placeholder="Trigger Field Key" onChange={e =>  updateField(sIdx, fIdx, "showWhen", { ...(f.showWhen || {}), key: e.target.value })} className="w-full border rounded px-2 py-1 mb-1" />
                        <input value={f.showWhen?.equals || ""}placeholder="Trigger Value"onChange={e =>updateField(sIdx, fIdx, "showWhen", { ...(f.showWhen || {}), equals: e.target.value })} className="w-full border rounded px-2 py-1 mb-1" />
                      </div>
                    </div>
                  ))}

                  <button onClick={() => addField(sIdx)} className="border px-3 py-1 rounded">+ Add Field</button>
                  <button onClick={() => removeSection(sIdx)} type="button" className="text-red-600 underline"> Remove Section </button>
                </div>
              );
            })}
            <button onClick={addSection} className="border px-4 py-2 rounded">+ Add Section</button>
            
            <button onClick={() => saveSchema()} className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded">Save Schema</button>
          </div>
        )}
      </div>
    </div>
  );
}
