import { useMemo, useState } from "react";
import { startQuiz, submitQuiz } from "./api";

const TOPICS = [
  "SDLC","Agile Model","Scrum","UML","Use Case Diagram","Class Diagram",
  "Sequence Diagram","Software Testing","Unit Testing","Integration Testing",
  "System Testing","Version Control","Software Maintenance"
];

export default function QuizPage({ userId }) {
  const [topic, setTopic] = useState("SDLC");
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState({});
  const [result, setResult] = useState(null);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const totalQ = quiz?.questions?.length || 0;

  const answeredCount = useMemo(() => {
    if (!quiz?.questions?.length) return 0;
    let c = 0;
    for (const q of quiz.questions) if (selected[q.id]) c++;
    return c;
  }, [quiz, selected]);

  const canSubmit = useMemo(() => {
    return !!userId && totalQ > 0 && answeredCount === totalQ && !submitting;
  }, [userId, totalQ, answeredCount, submitting]);

  async function loadQuiz() {
    setErr(null);
    setResult(null);
    setSelected({});
    setQuiz(null);

    setLoadingQuiz(true);
    try {
      const data = await startQuiz(topic);
      setQuiz(data);
    } catch (e) {
      setErr(e.message || "Failed to load quiz");
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function submit() {
    if (!quiz?.questions?.length || submitting) return;

    setErr(null);
    setSubmitting(true);
    try {
      const answers = quiz.questions.map((q) => ({
        id: q.id,
        selected: selected[q.id] || "",
      }));

      const data = await submitQuiz(userId, topic, answers);
      setResult(data);
    } catch (e) {
      setErr(e.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setQuiz(null);
    setSelected({});
    setResult(null);
    setErr(null);
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-2xl bg-slate-950/40 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Quiz</div>
            <div className="text-xs text-white/60">
              Select a topic → Start Quiz → Answer all → Submit
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loadingQuiz || submitting}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t} className="bg-slate-950">
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={loadQuiz}
              disabled={loadingQuiz || submitting}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (loadingQuiz || submitting
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400")
              }
            >
              {loadingQuiz ? "Loading..." : "Start Quiz"}
            </button>

            {quiz && (
              <button
                onClick={reset}
                disabled={loadingQuiz || submitting}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 md:px-6 md:py-6">
          {!userId && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
              ⚠️ userId missing. Please logout and login again.
            </div>
          )}

          {err && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
              ❌ {err}
            </div>
          )}

          {/* Empty state */}
          {!quiz && (
            <div className="rounded-2xl bg-white/5 p-6 text-white/70 ring-1 ring-white/10">
              Choose a topic and click <b>Start Quiz</b>.
            </div>
          )}

          {/* No questions */}
          {quiz && quiz.questions.length === 0 && (
            <div className="rounded-2xl bg-yellow-500/10 p-4 text-sm text-yellow-100 ring-1 ring-yellow-500/20">
              No questions for <b>{topic}</b>. Add more in <code>questions.csv</code>.
            </div>
          )}

          {/* Questions */}
          {quiz && quiz.questions.length > 0 && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-white/80">
                  Topic: <span className="text-cyan-300 font-semibold">{topic}</span>
                </div>

                <div className="text-xs text-white/60">
                  Answered{" "}
                  <span className="text-white font-semibold">{answeredCount}</span> /{" "}
                  <span className="text-white font-semibold">{totalQ}</span>
                </div>
              </div>

              <div className="space-y-4">
                {quiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <div className="text-sm font-semibold text-white">
                      {idx + 1}. {q.question}
                    </div>

                    <div className="mt-3 grid gap-2">
                      {["A", "B", "C", "D"].map((opt) => {
                        const active = selected[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setSelected((s) => ({ ...s, [q.id]: opt }))
                            }
                            className={
                              "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left text-sm ring-1 transition " +
                              (active
                                ? "bg-cyan-500 text-slate-950 ring-cyan-400/30"
                                : "bg-slate-950/30 text-white ring-white/10 hover:bg-white/10")
                            }
                          >
                            <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-bold">
                              {opt}
                            </span>
                            <span className="whitespace-pre-wrap">{q[opt]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className={
                    "rounded-2xl px-5 py-3 text-sm font-semibold transition " +
                    (canSubmit
                      ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                      : "bg-white/10 text-white/40 cursor-not-allowed")
                  }
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>

                {answeredCount !== totalQ && (
                  <div className="text-xs text-white/60">
                    Tip: Answer all questions to enable Submit.
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-sm font-semibold text-white">Result</div>
                  <div className="mt-1 text-sm text-white/80">
                    Score:{" "}
                    <span className="font-bold text-white">
                      {result.score} / {result.total}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-white/80">
                    Mastery:{" "}
                    <span className="font-bold text-cyan-300">
                      {result.mastery}%
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}