import { useEffect, useState } from "react";
import { theoryCategories, startTheory, submitTheory } from "./api";

export default function TheoryPage({ userId }) {
  const [categories, setCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    theoryCategories()
      .then((d) => setCategories(d.categories || ["All"]))
      .catch(() => setCategories(["All"]));
  }, []);

  async function loadTheory() {
    setErr(null);
    setResult(null);
    setAnswers({});
    setLoading(true);
    try {
      const data = await startTheory(category, 5);
      setQuiz(data);
    } catch (e) {
      setErr("Failed to load theory questions");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!quiz?.questions?.length) return;

    const payload = quiz.questions.map((q) => ({
      id: q.id,
      text: answers[q.id] || "",
    }));

    setLoading(true);
    setErr(null);
    try {
      const data = await submitTheory(userId, payload);
      setResult(data);
    } catch {
      setErr("Submit failed. Check backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-2xl bg-slate-950/40 ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <div>
            <div className="text-sm font-semibold text-white">Theory Mode</div>
            <div className="text-xs text-white/60">
              Type answers. System scores using TF-IDF cosine similarity.
            </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-6">
          {err && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
              ❌ {err}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={loadTheory}
              disabled={loading}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (loading
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400")
              }
            >
              {loading ? "Loading..." : "Start Theory Quiz"}
            </button>
          </div>

          {/* Questions */}
          {quiz?.questions?.length > 0 && (
            <div className="mt-5 space-y-4">
              {quiz.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                >
                  <div className="text-sm font-semibold text-white">
                    {idx + 1}. {q.question}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {q.category} • {q.difficulty}
                  </div>

                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                    placeholder="Type your answer..."
                    className="mt-3 w-full min-h-[90px] rounded-xl bg-slate-950/40 p-3 text-sm text-white ring-1 ring-white/10 outline-none"
                  />
                </div>
              ))}

              <button
                onClick={submit}
                disabled={loading}
                className={
                  "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                  (loading
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300")
                }
              >
                {loading ? "Submitting..." : "Submit Answers"}
              </button>
            </div>
          )}

          {/* Result */}
          {result?.ok && (
            <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">
                Result • Average Score:{" "}
                <span className="text-cyan-300">{result.avgScore}%</span>
              </div>

              <div className="mt-3 space-y-3">
                {result.results.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl bg-slate-950/40 p-3 ring-1 ring-white/10"
                  >
                    <div className="text-xs font-semibold text-white">
                      Score: <span className="text-emerald-300">{r.score}%</span>
                    </div>
                    <div className="mt-1 text-sm text-white/80">{r.question}</div>

                    {/* Optional: show expected answer */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-white/60">
                        Show expected answer
                      </summary>
                      <div className="mt-2 text-xs text-white/70 whitespace-pre-wrap">
                        {r.expectedAnswer}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!quiz && (
            <div className="mt-4 rounded-2xl bg-white/5 p-6 text-white/60 ring-1 ring-white/10">
              Select a category and click <b>Start Theory Quiz</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}