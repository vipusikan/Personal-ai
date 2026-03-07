import { useEffect, useState } from "react";
import {
  adminSummary,
  adminGetUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminGetUserProgress,
  adminResetPassword,
} from "./api";

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("user") || "null");

  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState([]);

  const [edit, setEdit] = useState({ name: "", email: "", role: "student" });
  const [newPass, setNewPass] = useState("");

  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const s = await adminSummary(token);
      const list = await adminGetUsers(token);
      setSummary(s);
      setUsers(list);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openUser(u) {
    setSelected(u);
    setEdit({ name: u.name, email: u.email, role: u.role });
    setNewPass("");
    setMsg(null);
    setErr(null);

    try {
      const stats = await adminGetUserProgress(token, u._id);
      setProgress(stats.stats || stats);
    } catch (e) {
      setProgress([]);
      setErr(e.message);
    }
  }

  async function saveUser() {
    if (!selected) return;
    try {
      setErr(null);
      setMsg(null);
      const result = await adminUpdateUser(token, selected._id, edit);
      const updated = result.user || result;
      setMsg("✅ User updated successfully");
      setSelected(updated);
      await refresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteUser() {
    if (!selected) return;

    const ok = window.confirm(`Are you sure you want to delete user: ${selected.email}?`);
    if (!ok) return;

    try {
      setErr(null);
      setMsg(null);
      await adminDeleteUser(token, selected._id);
      setMsg("✅ User deleted successfully");
      setSelected(null);
      setProgress([]);
      await refresh();
      
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function resetPassword() {
    if (!selected) return;
    if (!newPass || newPass.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    try {
      setErr(null);
      setMsg(null);
      await adminResetPassword(token, selected._id, newPass);
      setMsg("✅ Password reset successful");
      setNewPass("");
      
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-[#1E2A3A] p-6">
        <div className="text-center">
          <div className="mb-3 text-4xl">🔒</div>
          <div className="text-lg font-medium text-white">Admin Access Required</div>
          <div className="text-sm text-[#94A3B8]">You don't have permission to view this page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-sm text-[#94A3B8]">Manage users, monitor progress, and configure settings</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="group relative inline-flex items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Alert messages */}
      {err && (
        <div className="rounded-lg bg-red-500/10 p-4 ring-1 ring-red-500/20">
          <div className="flex items-center text-red-400">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {err}
          </div>
        </div>
      )}
      
      {msg && (
        <div className="rounded-lg bg-green-500/10 p-4 ring-1 ring-green-500/20">
          <div className="flex items-center text-green-400">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {msg}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-[#1E2A3A] p-6 ring-1 ring-[#2563eb]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-white">{summary.totalUsers}</p>
              </div>
              <div className="rounded-lg bg-[#2563eb]/10 p-3">
                <svg className="h-6 w-6 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-[#64748B]">
              <span className="mr-2">📊</span>
              Total registered users
            </div>
          </div>

          <div className="rounded-xl bg-[#1E2A3A] p-6 ring-1 ring-[#2563eb]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Students</p>
                <p className="mt-2 text-3xl font-bold text-white">{summary.totalStudents}</p>
              </div>
              <div className="rounded-lg bg-[#2563eb]/10 p-3">
                <svg className="h-6 w-6 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-[#64748B]">
              <span className="mr-2">🎓</span>
              Active learners
            </div>
          </div>

          <div className="rounded-xl bg-[#1E2A3A] p-6 ring-1 ring-[#2563eb]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Admins</p>
                <p className="mt-2 text-3xl font-bold text-white">{summary.totalAdmins}</p>
              </div>
              <div className="rounded-lg bg-[#2563eb]/10 p-3">
                <svg className="h-6 w-6 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-[#64748B]">
              <span className="mr-2">⚙️</span>
              System administrators
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Users Table */}
        <div className="rounded-xl bg-[#1E2A3A] ring-1 ring-[#2563eb]/20">
          <div className="border-b border-[#2A3A4A] p-4">
            <h3 className="font-semibold text-white">User Management</h3>
            <p className="text-xs text-[#94A3B8] mt-1">Click on any user to manage their account</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A3A4A] bg-[#132237]">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-[#94A3B8]">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-[#94A3B8]">Email</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-[#94A3B8]">Role</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-[#94A3B8]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3A4A]">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => openUser(u)}
                    className={`cursor-pointer transition-colors hover:bg-[#132237] ${
                      selected?._id === u._id ? "bg-[#2563eb]/10" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-white">{u.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#94A3B8]">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#64748B]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}

                {!users.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#64748B]" colSpan="4">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage User Panel */}
        <div className="rounded-xl bg-[#1E2A3A] p-6 ring-1 ring-[#2563eb]/20">
          <h3 className="mb-4 font-semibold text-white">User Details & Controls</h3>

          {!selected ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#2A3A4A]">
              <svg className="mb-3 h-8 w-8 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm text-[#94A3B8]">Select a user from the table to manage</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info */}
              <div className="rounded-lg bg-[#132237] p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb]/20">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{selected.name}</h4>
                    <p className="text-xs text-[#94A3B8]">{selected.email}</p>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Name</label>
                  <input
                    type="text"
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    className="w-full rounded-lg bg-[#132237] px-3 py-2 text-white ring-1 ring-[#2A3A4A] focus:ring-[#2563eb] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Email</label>
                  <input
                    type="email"
                    value={edit.email}
                    onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                    className="w-full rounded-lg bg-[#132237] px-3 py-2 text-white ring-1 ring-[#2A3A4A] focus:ring-[#2563eb] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Role</label>
                  <select
                    value={edit.role}
                    onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                    className="w-full rounded-lg bg-[#132237] px-3 py-2 text-white ring-1 ring-[#2A3A4A] focus:ring-[#2563eb] focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveUser}
                    className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={deleteUser}
                    className="flex-1 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </div>

              {/* Reset Password */}
              <div className="rounded-lg bg-[#132237] p-4">
                <h4 className="mb-3 text-sm font-medium text-white">Reset Password</h4>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full rounded-lg bg-[#1E2A3A] px-3 py-2 text-sm text-white ring-1 ring-[#2A3A4A] focus:ring-[#2563eb] focus:outline-none"
                  />
                  <button
                    onClick={resetPassword}
                    className="w-full rounded-lg bg-[#2A3A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#3A4A5A] transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-white">Learning Progress</h4>
                {!progress.length ? (
                  <div className="rounded-lg bg-[#132237] p-4 text-center">
                    <p className="text-sm text-[#64748B]">No quiz attempts yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {progress.map((p) => (
                      <div key={p._id} className="rounded-lg bg-[#132237] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{p.topic}</span>
                          <span className="text-xs text-[#60a5fa]">{p.mastery}% Mastery</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#1E2A3A]">
                          <div 
                            className="h-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
                            style={{ width: `${p.mastery}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="text-[#64748B]">Attempts: {p.attempts}</span>
                          <span className="text-[#64748B]">Correct: {p.correct}/{p.totalQuestions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-[#64748B] border-t border-[#1E2A3A] pt-4">
        Logged in as: <span className="font-medium text-white">{me.email}</span>
      </div>
    </div>
  );
}