import { useState } from "react";
import { predictCareer } from "./api";

export default function CareerPredictPage() {
  const [form, setForm] = useState({
    Gender: "Male",
    Age: 22,
    GPA: 3.0,
    Major: "Computer Science",
    "Interested Domain": "Artificial Intelligence",
    Python: "Intermediate",
    SQL: "Intermediate",
    Java: "Intermediate",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit() {
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await predictCareer(form);
      setResult(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const domains = [
    "Artificial Intelligence",
    "Web Development",
    "Mobile App Development",
    "Cybersecurity",
    "Cloud Computing",
    "Data Science",
    "Machine Learning",
    "Networking",
    "Database Systems",
    "Software Engineering",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="text-xl font-bold text-white">Career Prediction</h2>
        <p className="mt-1 text-sm text-white/60">
          Enter student details and predict the most suitable career path.
        </p>

        {/* Form */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-white/60">Gender</label>
            <select
              value={form.Gender}
              onChange={(e) => setField("Gender", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Age</label>
            <input
              type="number"
              value={form.Age}
              onChange={(e) => setField("Age", Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">GPA</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={form.GPA}
              onChange={(e) => setField("GPA", Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Major</label>
            <input
              value={form.Major}
              onChange={(e) => setField("Major", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
              placeholder="Computer Science"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-white/60">Interested Domain</label>
            <select
              value={form["Interested Domain"]}
              onChange={(e) => setField("Interested Domain", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            >
              {domains.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Python Skill</label>
            <select
              value={form.Python}
              onChange={(e) => setField("Python", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            >
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">SQL Skill</label>
            <select
              value={form.SQL}
              onChange={(e) => setField("SQL", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            >
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Java Skill</label>
            <select
              value={form.Java}
              onChange={(e) => setField("Java", e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-950/40 p-3 text-white ring-1 ring-white/10"
            >
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className={
              "rounded-xl px-5 py-2 text-sm font-semibold transition " +
              (loading
                ? "bg-cyan-500/40 text-slate-950"
                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400")
            }
          >
            {loading ? "Predicting..." : "Predict Career"}
          </button>

          <button
            onClick={() => {
              setResult(null);
              setErr(null);
            }}
            className="rounded-xl bg-white/5 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
          >
            Clear
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
            ❌ {err}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-2xl bg-slate-950/40 p-5 ring-1 ring-white/10">
            <div className="text-sm text-white/70">Prediction Result</div>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {result.career}
            </div>
            {"confidence" in result && (
              <div className="mt-2 text-sm text-white/70">
                Confidence:{" "}
                <span className="font-semibold text-cyan-300">
                  {result.confidence}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}