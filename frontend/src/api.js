const API = "http://localhost:8000/api";

// ---------- helpers ----------
async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Unknown error" };
  }
}

async function handle(res, defaultMsg) {
  const data = await parseJsonSafe(res);
  if (!res.ok) throw new Error(data.message || defaultMsg);
  return data;
}

// ---------- AUTH ----------
export async function register(name, email, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handle(res, "Register failed");
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res, "Login failed");
}

// ---------- CHAT ----------
export async function chat(userId, message) {
  const res = await fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, message }),
  });
  return handle(res, "Chat failed");
}

// ---------- QUIZ ----------
export async function startQuiz(topic, n = 5) {
  const res = await fetch(`${API}/quiz/start?topic=${encodeURIComponent(topic)}&n=${n}`);
  return handle(res, "Start quiz failed");
}

export async function submitQuiz(userId, topic, answers) {
  const res = await fetch(`${API}/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, topic, answers }),
  });
  return handle(res, "Submit quiz failed");
}

// ---------- PROGRESS ----------
export async function getProgress(userId) {
  const res = await fetch(`${API}/progress?userId=${encodeURIComponent(userId)}`);
  return handle(res, "Get progress failed");
}

// ---------- RECOMMENDATIONS ----------
export async function getRecommendations(userId) {
  const res = await fetch(`${API}/recommendations?userId=${encodeURIComponent(userId)}`);
  return handle(res, "Get recommendations failed");
}

// ---------- Career Prediction ----------
export async function predictCareer(payload) {
  const res = await fetch(`${API}/career/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Career prediction failed");
  return data;
}




// ---------- ADMIN (Protected) ----------
function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function adminSummary(token) {
  const res = await fetch(`${API}/admin/summary`, {
    headers: authHeaders(token),
  });
  return handle(res, "Admin summary failed");
}

// returns {users:[...]} from backend
export async function adminUsers(token) {
  const res = await fetch(`${API}/admin/users`, {
    headers: authHeaders(token),
  });
  return handle(res, "Admin users failed");
}

// convenience: returns users array directly
export async function adminGetUsers(token) {
  const data = await adminUsers(token);
  return data.users || [];
}

export async function adminUpdateUser(token, id, payload) {
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload), // {name,email,role}
  });
  return handle(res, "Update user failed");
}

export async function adminDeleteUser(token, id) {
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handle(res, "Delete user failed");
}

export async function adminGetUserProgress(token, id) {
  const res = await fetch(`${API}/admin/users/${id}/progress`, {
    headers: authHeaders(token),
  });
  return handle(res, "Get user progress failed");
}

export async function adminResetPassword(token, id, newPassword) {
  const res = await fetch(`${API}/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ newPassword }),
  });
  return handle(res, "Reset password failed");
}

export async function theoryCategories() {
  const res = await fetch(`${API}/theory/categories`);
  return res.json();
}

export async function startTheory(category = "All", n = 5) {
  const res = await fetch(`${API}/theory/start?category=${encodeURIComponent(category)}&n=${n}`);
  return res.json();
}

export async function submitTheory(userId, answers) {
  const res = await fetch(`${API}/theory/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, answers }),
  });
  return res.json();
}