import { useEffect, useMemo, useState } from "react";
import { getProgress } from "./api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ProgressPage({ userId }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setErr(null);
    getProgress(userId)
      .then(setData)
      .catch(() => setErr("Failed to load progress"));
  }, [userId]);

  const stats = data?.stats || [];

  // Build chart data
const barData = useMemo(() => {
  const labels = stats.map((s) => s.topic);
  const mastery = stats.map((s) => Number(s.mastery || 0));

  return {
    labels,
    datasets: [
      {
        label: "Mastery (%)",
        data: mastery,
        backgroundColor: "rgba(59, 130, 246, 0.7)",   // blue bars
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
}, [stats]);

const barOptions = useMemo(() => {
  return {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#94A3B8",
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: "#94A3B8",
          stepSize: 10,
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
    },
  };
}, []);

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:p-6">
        <h2 className="text-xl font-bold text-white">Progress</h2>
        <p className="mt-1 text-sm text-white/60">
          Your mastery by topic (from quiz results)
        </p>

        {err && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
            ❌ {err}
          </div>
        )}

        {!data && !err && <p className="mt-4 text-white/70">Loading...</p>}

        {data && stats.length === 0 && (
          <p className="mt-4 text-white/70">
            No quiz attempts yet. Take a quiz first.
          </p>
        )}

        {data && stats.length > 0 && (
          <>
            {/* Chart */}
            <div className="mt-6 rounded-2xl bg-slate-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">
                Mastery Chart
              </div>
              <div className="mt-3">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/80">
                  <tr>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Attempts</th>
                    <th className="px-4 py-3">Mastery %</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s._id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{s.topic}</td>
                      <td className="px-4 py-3 text-white/80">{s.attempts}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/20">
                          {s.mastery}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}