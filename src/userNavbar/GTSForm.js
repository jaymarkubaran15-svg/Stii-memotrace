import React, { useState, useEffect } from "react";
import bg from "../assets/images/bg.png";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
export default function GTSForm() {
  const [schema, setSchema] = useState({ sections: [] });
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSubmittedData, setShowSubmittedData] = useState(false);


  // 🔹 Load schema from backend safely
useEffect(() => {
  fetch("https://server-1-gjvd.onrender.com/api/schema")
    .then(res => res.json())
    .then(result => {
      if (result?.success && Array.isArray(result?.schema?.sections)) {
        // ✅ only set schema if different from previous
        setSchema(prev => {
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(result.schema);
          return prevStr === newStr ? prev : result.schema;
        });
      }
    })
    .catch(() => setSchema({ sections: [] }));
}, []);

    useEffect(() => {
      const checkSession = async () => {
        try {
          const response = await fetch("https://server-1-gjvd.onrender.com/api/session", {
            method: "GET",
            credentials: "include", // Include cookies
          });
    
          const data = await response.json();
    
          if (response.ok && data.user) {
            if (data.user.role === "admin") {
              navigate("/dashboard");
            } else if (data.user.isGTSsurvey === true || data.user.isGTSsurvey === 1 || data.user.isGTSsurvey === "1") {
              navigate("/userhome");
            }
              else {
              navigate("/gtsform"); // ❌ If not, go to survey page
            }
          }
        } catch (error) {
          console.error("Session check failed:", error);
        }
      };
    
      checkSession();
    }, [navigate]); 


    const formatCheckboxMatrixData = () => {
  const formatted = { ...data };

  schema.sections?.forEach(section => {
    section.fields?.forEach(f => {
      if (f.type === "checkbox-matrix") {
        const key = f.label || f.key;
        formatted[key] = {
          rows: f.rowLabels || [],
          columns: f.columnLabels || [],
          values: data[key] || []
        };
      }
    });
  });

  schema.sections?.forEach(section => {
  section.fields?.forEach(f => {
    if (f.type === "multiple") {
      const key = f.label || f.key;
      formatted[key] = {
        rows: f.rowLabels || [],
        columns: f.columnLabels || [],
        values: data[key] || []
      };
    }
  });
});

  return formatted;
};

  // 🔹 Initialize defaults ONCE when schema changes
useEffect(() => {
  if (schema.sections?.length) {
    setData(prev => {
      const next = { ...prev };
      schema.sections.forEach(sec => {
        sec.fields?.forEach(f => {
          const label = f.label || f.key;
          if (!(label in next)) {
            next[label] = f.type === "checkbox" ? [] : "";
          }

        });
      });
      return next; // ✅ no overwrite of typed data
    });
  }
}, [schema]);





const update = (field, value) => {
  const label = field.label || field.key; // fallback if no label
  setData(prev => ({
    ...prev,
    [label]: value,   // ✅ save answer under label
  }));
  console.log("Updating:", label, "to", value);
};


const shouldShowField = (field) => {
  if (!field?.showWhen) return true;

  let conditions = [];
  let logic = "OR";

  if (Array.isArray(field.showWhen)) {
    conditions = field.showWhen;
  } else if (field.showWhen.conditions) {
    conditions = field.showWhen.conditions;
    logic = field.showWhen.logic || "OR";
  } else {
    conditions = [field.showWhen];
  }

  const checkCondition = (cond) => {
    const triggerField = schema.sections
      ?.flatMap(s => s.fields)
      ?.find(f => (f.key || f.label) === cond.key);

    if (!triggerField) return true;

    const label = triggerField.label || triggerField.key;
    const val = data[label];

    if (Array.isArray(val)) {
      return val.includes(cond.equals);
    }

    return String(val) === String(cond.equals);
  };

  return logic === "OR"
    ? conditions.some(checkCondition)
    : conditions.every(checkCondition);
};


 const validateStep = (stepIndex) => {
  const e = {};
  schema.sections?.[stepIndex]?.fields?.forEach((f) => {
    if (f?.required && shouldShowField(f)) {
      const label = f.label || f.key;
      const val = data[label];
      const empty =
        f.type === "checkbox" ? !val?.length : !val;
      if (empty) e[label] = `${label} is required`;
    }
  });
  setErrors(e);
  return Object.keys(e).length === 0;
};

const validateAll = () => {
  const e = {};
  schema.sections?.forEach((s) => {
    s?.fields?.forEach((f) => {
      if (f?.required && shouldShowField(f)) {
        const label = f.label || f.key;
        const val = data[label];
        const empty =
          f.type === "checkbox" ? !val?.length : !val;
        if (empty) e[label] = `${label} is required`;
      }
    });
  });
  setErrors(e);
  return Object.keys(e).length === 0;
};


  
  const handleSubmit = async (e) => {
        e.preventDefault();
    if (currentStep < (schema.sections?.length || 0) - 1) return;

    setSubmitted(true);
    if (!validateAll()) return;
      try {
        if (!user) {
          alert("User not logged in!");
          return;
        }
    
  
        console.log("User Session:", user);
  
        const response =  await fetch("https://server-1-gjvd.onrender.com/api/submit",{
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ✅ Ensures session cookies are included
          body: JSON.stringify(formatCheckboxMatrixData()), 
        });
  
     if (response.ok) {
          Swal.fire({
            title: "Thank You",
            text: "GTS submitted successfully!",
            icon: "success",
            confirmButtonText: "View My Answers",
          }).then(() => {
            setShowSubmittedData(true); // 👈 Show data after confirmation
          
          });
        }else {
          Swal.fire({
            title: "Error",
            text: "Failed to submit survey!",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        console.error("Error submitting survey:", error);
        alert("An error occurred while submitting the survey.");
      }
    };
  
    useEffect(() => {
      fetchUser();
    }, []);
  
     const fetchUser = async () => {
    try {
      const response = await fetch("https://server-1-gjvd.onrender.com/api/user", { credentials: "include" });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };


  const nextStep = () => {
  setSubmitted(true);
  if (!validateStep(currentStep)) return;  // ✅ only validate this section
  if (currentStep < (schema.sections?.length || 0) - 1) {
    setCurrentStep((prev) => prev + 1);
    setSubmitted(false);
  }
};


  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

const RenderField = ({ field, number }) => {
  const key = field.label || field.key;
  const cols = field.columnLabels || [];
  const rows = field.rowLabels || [];
  const err = errors[key];

  // Global value
  const globalValue = data[key] ?? "";

  // Local state for simple fields
  const [localValue, setLocalValue] = useState(globalValue);

  // Local state for multiple table or checkbox-matrix
  const [localTable, setLocalTable] = useState(() => {
    if (field.type === "multiple") {
      return Array.isArray(data[key])
        ? data[key].map(row => row.map(cell => (cell === false ? "" : cell)))
        : rows.map(() => cols.map(() => ""));
    } else if (field.type === "checkbox-matrix") {
      return Array.isArray(data[key])
        ? data[key]
        : rows.map(() => cols.map(() => false));
    }
    return [];
  });

  // Sync simple fields with global data
  useEffect(() => {
    setLocalValue(globalValue);
  }, [globalValue]);

  // Initialize global data for multiple / checkbox-matrix
  useEffect(() => {
    setData(prev => {
      if (prev[key] !== undefined) return prev;

      if (field.type === "multiple") {
        const init = rows.map(() => cols.map(() => ""));
        return { ...prev, [key]: init };
      }

      if (field.type === "checkbox-matrix") {
        const init = rows.map(() => cols.map(() => false));
        return { ...prev, [key]: init };
      }

      return prev;
    });
  }, [key, rows, cols, field.type]);

  // Handlers
  const update = (value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

const toggleCell = (rIdx, cIdx) => {
  setData(prev => {
    // 🔹 Ensure value is a 2D array
    let current = prev[key];
    if (!Array.isArray(current)) {
      current = rows.map(() => cols.map(() => false));
    }

    const updated = current.map((row, ri) =>
      ri === rIdx
        ? row.map((cell, ci) => (ci === cIdx ? !cell : cell))
        : row
    );

    return { ...prev, [key]: updated };
  });
};


  const saveTable = () => {
    setData(prev => ({ ...prev, [key]: localTable }));
  };

  const updateCell = (rIdx, cIdx, val) => {
  setLocalTable(prev => {
    const normalized = Array.isArray(prev)
      ? prev
      : rows.map(() => cols.map(() => ""));
    return normalized.map((row, ri) =>
      ri === rIdx ? row.map((cell, ci) => (ci === cIdx ? val : cell)) : row
    );
  });
};


  const addRow = () => {
    const newRow = cols.map(() => "");
    const updated = [...localTable, newRow];
    setLocalTable(updated);
    setData(prev => ({ ...prev, [key]: updated }));
  };

  const removeRow = rIdx => {
    const updated = localTable.filter((_, i) => i !== rIdx);
    setLocalTable(updated);
    setData(prev => ({ ...prev, [key]: updated }));
  };

  // Render by type
  if (["text", "email", "date"].includes(field.type)) {
    return (
      <div className="mb-5 bg-gray-100 p-4 rounded-xl shadow-sm">
        <label className="block mb-1 font-semibold text-gray-700">
          {number}. {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type={field.type}
          placeholder={field.placeholder || "Enter text"}
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onBlur={() => update(localValue)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1
                     text-gray-800 text-base bg-white caret-black
                     leading-normal focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        {submitted && err && <p className="text-xs text-red-600 mt-1">{err}</p>}
      </div>
    );
  }

if (field.type === "radio") {
  const key = field.label || field.key;
  const value = data[key] ?? "";
  let options = field.options || [];

  // 🧠 Define occupation-specific options
  const occupationOptionsMap = {
  "Teacher / Educator": [
    "Education",
    "Public Administration and Defense; Compulsory Social Security",
    "Other Community, Social and Personal Service Activities"
  ],
  "Engineer": [
    "Construction",
    "Manufacturing",
    "Electricity, Gas and Water Supply",
    "Mining and Quarrying",
    "Real Estate, Renting and Business Activities"
  ],
  "Nurse": [
    "Health and Social Work",
    "Private Household with Employed Persons",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Doctor / Medical Practitioner": [
    "Health and Social Work",
    "Private Household with Employed Persons",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Accountant": [
    "Financial Intermediation",
    "Real Estate, Renting and Business Activities",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Clerk / Office Staff": [
    "Administrative and Support Service Activities",
    "Public Administration and Defense; Compulsory Social Security",
    "Financial Intermediation"
  ],
  "Administrative Assistant": [
    "Administrative and Support Service Activities",
    "Financial Intermediation",
    "Education",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Manager / Supervisor": [
    "Wholesale and Retail Trade",
    "Manufacturing",
    "Accommodation and Food Service Activities",
    "Financial Intermediation"
  ],
  "Police / Military Personnel": [
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "IT Professional / Programmer": [
    "Information and Communication",
    "Real Estate, Renting and Business Activities",
    "Education"
  ],
  "Sales Representative / Marketing Staff": [
    "Wholesale and Retail Trade",
    "Financial Intermediation",
    "Real Estate, Renting and Business Activities"
  ],
  "Customer Service Representative (CSR)": [
    "Information and Communication",
    "Administrative and Support Service Activities",
    "Wholesale and Retail Trade"
  ],
  "Technician": [
    "Manufacturing",
    "Electricity, Gas and Water Supply",
    "Information and Communication"
  ],
  "Construction Worker / Laborer": [
    "Construction",
    "Mining and Quarrying",
    "Wholesale and Retail Trade"
  ],
  "Driver": [
    "Transport Storage and Communication",
    "Wholesale and Retail Trade",
    "Construction"
  ],
  "Farmer / Fisherman": [
    "Agriculture, Hunting and Forestry",
    "Fishing"
  ],
  "Business Owner / Entrepreneur": [
    "Wholesale and Retail Trade",
    "Financial Intermediation",
    "Accommodation and Food Service Activities",
    "Real Estate, Renting and Business Activities"
  ],
  "Freelancer / Self-Employed": [
    "Information and Communication",
    "Education",
    "Other Community, Social and Personal Service Activities"
  ],
  "Government Employee": [
    "Public Administration and Defense; Compulsory Social Security",
    "Education",
    "Health and Social Work"
  ],
  "Call Center Agent": [
    "Information and Communication",
    "Administrative and Support Service Activities"
  ],
  "Healthcare Worker": [
    "Health and Social Work",
    "Private Household with Employed Persons",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Security Guard": [
    "Administrative and Support Service Activities",
    "Public Administration and Defense; Compulsory Social Security"
  ],
  "Cashier": [
    "Wholesale and Retail Trade",
    "Accommodation and Food Service Activities",
    "Financial Intermediation"
  ],
  "Waiter / Service Crew": [
    "Accommodation and Food Service Activities",
    "Other Community, Social and Personal Service Activities"
  ],
  "Household Worker / Domestic Helper": [
    "Private Household with Employed Persons"
  ]
};


  // 🎯 Apply filter only to this specific question
  if (
    field.label?.trim() ===
    "Major line of business of the company you are presently employed in. Check one only."
  ) {
    const occupation = data["Present Occupation"];

    if (occupation && occupationOptionsMap[occupation]) {
      options = occupationOptionsMap[occupation];
    } else {
      options = []; // hide if no occupation match
    }

    // Optionally hide entire question when no match
    if (options.length === 0) return null;
  }

  return (
    <div className="mb-5 bg-gray-100 p-4 rounded-xl shadow-sm">
      <label className="block mb-2 font-semibold text-gray-700">
        {number}. {field.label}{" "}
        {field.required && <span className="text-red-600">*</span>}
      </label>

      <div className="flex flex-col gap-2">
        {options.map((option, i) => (
          <label key={i} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={key}
              value={option}
              checked={value === option}
              onClick={() => update(value === option ? "" : option)}
              readOnly
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>

      {submitted && errors[key] && (
        <p className="text-xs text-red-600 mt-1">{errors[key]}</p>
      )}
    </div>
  );
}



if (field.type === "checkbox") {
  const key = field.key || field.label || `field_${number}`;
  const value = Array.isArray(data[key]) ? data[key] : [];
  const selected = new Set(value);

  return (
    <div className="mb-5 bg-gray-100 p-4 rounded-xl shadow-sm">
      <label className="block mb-2 font-semibold text-gray-700">
        {number}. {field.label}{" "}
        {field.required && <span className="text-red-600">*</span>}
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        {(field.options || []).map((o, i) => (
          <label
            key={i}
            className="flex items-center gap-2 cursor-pointer border rounded-lg p-2 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              value={o}
              checked={selected.has(o)}
              onChange={(e) => {
                const set = new Set(selected);
                e.target.checked ? set.add(o) : set.delete(o);
                setData((prev) => ({ ...prev, [key]: Array.from(set) }));
              }}
              className="accent-indigo-600"
            />
            {o}
          </label>
        ))}
      </div>
      {submitted && errors[key] && (
        <p className="text-xs text-red-600 mt-1">{errors[key]}</p>
      )}
    </div>
  );
}


  if (field.type === "multiple") {
    return (
      <div className="mb-5 bg-gray-100 p-4 rounded-xl shadow-sm">
        <label className="block mb-2 font-semibold text-gray-700">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <div className="overflow-x-auto border rounded mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200">#</th>
                {cols.map((col, cIdx) => (
                  <th key={cIdx} className="border px-2 py-1 bg-gray-200">{col}</th>
                ))}
                <th className="border px-2 py-1 bg-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localTable.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="border px-2 py-1 bg-gray-100">{rIdx + 1}</td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border px-2 py-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                        onBlur={saveTable}
                        className="w-full border rounded px-1 py-1 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="border px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(rIdx)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            + Add Row
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "checkbox-matrix") {
    return (
      <div className="mb-5 bg-gray-100 p-4 rounded-xl shadow-sm">
        <label className="block mb-2 font-semibold text-gray-700">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <div className="overflow-x-auto border rounded mb-3">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200"></th>
                {cols.map((col, cIdx) => (
                  <th key={cIdx} className="border px-2 py-1 bg-gray-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rowLabel, rIdx) => (
                <tr key={rIdx}>
                  <td className="border px-2 py-1 bg-gray-100 font-medium">{rowLabel}</td>
                  {cols.map((_, cIdx) => (
                    <td key={cIdx} className="border px-2 py-1">
                      <input
                        type="checkbox"
                        checked={localTable[rIdx][cIdx]}
                        onChange={() => toggleCell(rIdx, cIdx)}
                        className="w-5 h-5 mx-auto"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

  const currentSection = schema.sections?.[currentStep];

  return (
    <>
  {/* Fixed background */}
  <div
  className="fixed inset-0 z-0 bg-center bg-no-repeat bg-cover bg-fixed"
  style={{ backgroundImage: `url(${bg})` }}
>
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-indigo-100/60"></div>
    </div>

  {/* Scrollable content */}
  <div className="relative z-10 min-h-screen flex items-start justify-center p-6 overflow-auto">
    <div className="w-full max-w-4xl bg-white/30 backdrop-blur-lg rounded-3xl p-1 shadow-xl border border-white/40">
      <div className="bg-white rounded-2xl p-10 shadow-sm">
      <h2 className="text-4xl font-extrabold text-center mb-6 text-indigo-700 tracking-tight">
        🎓 Graduate Tracer Survey
      </h2>
      <p className="text-base text-center text-gray-600 mb-8 px-6 py-4 bg-indigo-50 rounded-xl shadow-inner">
        Help us strengthen alumni connections by sharing your journey!  
        Your input improves our programs and future opportunities for graduates.
      </p>

        {/* 🔹 Progress bar */}
        {schema.sections?.length > 0 && (
          <div className="w-full bg-gray-300 h-3 rounded-full mb-6">
            <div
              className="h-3 bg-indigo-600 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentStep + 1) / (schema.sections?.length || 1)) * 100
                }%`,
              }}
            ></div>
          </div>
        )}

        {currentSection ? (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Step {currentStep + 1} of {schema.sections?.length || 0}:{" "}
              {currentSection?.title || ""}
            </h2>
            
           {currentSection?.fields?.map((f, fIdx) => {
              if (!shouldShowField(f)) return null; // 🔹 hide field if condition not met
              return <RenderField key={f.key} field={f} number={fIdx + 1} />;
            })}


          </section>
        ) : (
          <p className="text-gray-500">
            No sections available. Please contact admin.
          </p>
        )}

        {schema.sections?.length > 0 && (
            <div className="flex justify-between mt-8">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border 
                              bg-gray-100 text-gray-700 font-medium shadow-sm hover:bg-gray-200"
                  >
                    ← Back
                  </button>
                )}
                {currentStep < (schema.sections?.length || 0) - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl 
                              bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                              font-medium shadow-md hover:from-indigo-700 hover:to-purple-700"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl 
                              bg-gradient-to-r from-green-600 to-emerald-600 text-white 
                              font-semibold shadow-md hover:from-green-700 hover:to-emerald-700"
                  >
                    ✅ Submit
                    </button>
                  )}
                </div>

         )}
        </div>
     </div>
{showSubmittedData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-5xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-6 border border-gray-200 relative">

      {/* Header */}
      <h3 className="text-2xl font-bold mb-4 text-indigo-700 text-center">
        📋 Your Submitted Responses
      </h3>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-300 px-3 py-2 font-semibold">Questions</th>
              <th className="border border-gray-300 px-3 py-2 font-semibold">Response</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([key, value], idx) => {
              let displayValue = "None";

              // Handle empty / falsy
              if (value === null || value === undefined) {
                displayValue = "None";
              }
              // Handle arrays
              else if (Array.isArray(value)) {
                if (Array.isArray(value[0])) {
                  const hasContent = value.flat().some(v => v && v !== false && v !== "");
                  if (!hasContent) {
                    displayValue = "None";
                  } else {
                    displayValue = (
                      <table className="border-collapse border border-gray-300 text-xs mx-auto">
                        <tbody>
                          {value.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="border border-gray-300 px-2 py-1 text-center"
                                >
                                  {cell === true ? "✅" : cell === false || cell === "" ? "" : cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  }
                } else if (value.length > 0) {
                  displayValue = value.join(", ");
                } else {
                  displayValue = "None";
                }
              }
              // Handle objects
              else if (typeof value === "object") {
                const stringified = JSON.stringify(value, null, 2);
                displayValue =
                  stringified === "{}" || stringified === "[]" ? "None" : stringified;
              }
              // Handle strings
              else if (typeof value === "string" && value.trim() !== "") {
                displayValue = value;
              }

              return (
                <tr key={idx} className="hover:bg-gray-50 align-top">
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                    {key}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600 whitespace-pre-wrap">
                    {displayValue}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setShowSubmittedData(false)}
          className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 font-medium hover:bg-gray-400"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate("/userhome")}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          Go to Home →
        </button>
      </div>
    </div>
  </div>
)}


  </div>
</>

  );
}
