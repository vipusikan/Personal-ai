import { useEffect, useMemo, useState } from "react";
import { getRecommendations } from "./api";

function typeBadge(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("youtube")) return { label: "YouTube", cls: "bg-red-500/15 text-red-200 ring-red-500/20" };
  if (t.includes("blog")) return { label: "Blog", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/20" };
  if (t.includes("w3")) return { label: "W3", cls: "bg-lime-500/15 text-lime-200 ring-lime-500/20" };
  if (t.includes("doc")) return { label: "Docs", cls: "bg-indigo-500/15 text-indigo-200 ring-indigo-500/20" };
  return { label: type || "Resource", cls: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/20" };
}

export default function RecommendationsPage({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState("");

  async function load() {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await getRecommendations(userId);
      setData(d);
    } catch (e) {
      setErr(e.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const weakTopics = data?.weakTopics || [];
  const recs = data?.recommendations || [];

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of recs) {
      const key = r.topic || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [recs]);

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(""), 1200);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-2xl bg-slate-950/40 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <div>
            <div className="text-sm font-semibold text-white">Recommendations</div>
            <div className="text-xs text-white/60">
              Personalized resources based on your weak topics.
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className={
              "rounded-xl px-4 py-2 text-sm font-semibold transition " +
              (loading
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400")
            }
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
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

          {/* Weak topics pills */}
          {weakTopics.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-white/60 mb-2">Weak topics</div>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty / Loading */}
          {!loading && data && recs.length === 0 && (
            <div className="rounded-2xl bg-white/5 p-6 text-white/70 ring-1 ring-white/10">
              No recommendations found. Add more rows to <b>resources.csv</b>.
            </div>
          )}

          {loading && !data && (
            <div className="rounded-2xl bg-white/5 p-6 text-white/70 ring-1 ring-white/10">
              Loading...
            </div>
          )}

          {/* Groups */}
          {recs.length > 0 && (
            <div className="space-y-5">
              {[...grouped.entries()].map(([topic, items]) => (
                <div
                  key={topic}
                  className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="text-sm font-semibold text-white">{topic}</div>
                    <div className="text-xs text-white/60">{items.length} resources</div>
                  </div>

                  <div className="p-4 grid gap-3 md:grid-cols-2">
                    {items.map((r, i) => {
                      const b = typeBadge(r.type);
                      return (
                        <div
                          key={`${topic}-${i}`}
                          className="rounded-2xl bg-slate-950/30 p-4 ring-1 ring-white/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {r.title || "Untitled resource"}
                              </div>
                              <div className="mt-1 text-xs text-white/60">
                                {r.topic} • {r.type}
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${b.cls}`}
                            >
                              {b.label}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                              Open
                            </a>

                            <button
                              onClick={() => copy(r.url)}
                              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                            >
                              {copiedUrl === r.url ? "Copied!" : "Copy link"}
                            </button>

                            <span className="text-xs text-white/40 break-all self-center">
                              {r.url}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Helper */}
          <div className="mt-5 text-xs text-white/40">
            Tip: Add more recommendations in <b>backend/data/resources.csv</b> (topic, title, type, url).
          </div>
        </div>
      </div>
    </div>
  );
}