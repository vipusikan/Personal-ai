import { useState } from "react";
import { login, register } from "./api";

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault?.();
    setErr(null);
    setMsg(null);

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();

    if (!cleanEmail || !password) {
      setErr("Email and password are required");
      return;
    }
    if (mode === "register" && !cleanName) {
      setErr("Full name is required");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === "register") {
        data = await register(cleanName, cleanEmail, password);
        setMsg("✅ Registered successfully! Welcome email sent (if configured).");
      } else {
        data = await login(cleanEmail, password);
        setMsg("✅ Login successful!");
      }

      // store auth
      const token = data?.token;
      const user = data?.user;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      // notify parent
      onAuthed?.(user);
    } catch (e2) {
      setErr(e2?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-cyan-500/15 ring-1 ring-white/10">
              <span className="text-cyan-300">⚙️</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Personal AI Tutor</div>
              <div className="text-xs text-white/60">Your intelligent study partner</div>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <span className="hover:text-white">Features</span>
            <span className="hover:text-white">How It Works</span>
            <span className="hover:text-white">Pricing</span>
            <span className="hover:text-white">Testimonials</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="hidden rounded-xl px-4 py-2 text-sm text-white/80 hover:text-white md:block"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Get Started Free
            </button>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-16 pt-6 md:grid-cols-2 md:items-center">
        {/* Left marketing */}
        <section className="md:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/80 ring-1 ring-white/10">
            ⭐ <span className="text-white/70">Rated</span>
            <span className="font-semibold text-white">4.9/5</span>
            <span className="text-white/60">by 10,000+ learners</span>
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
            Your Personal <span className="text-cyan-300">AI Tutor</span>
          </h1>

          <p className="mt-4 max-w-xl text-white/70">
            Experience the future of learning with an AI tutor that adapts to your
            unique style, provides personalized guidance, and helps you master any
            subject faster than ever before.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("register")}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Start Learning Free →
            </button>
            <button
              type="button"
              className="rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => alert("Demo can be added later")}
            >
              Watch Demo
            </button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <Stat num="50k+" label="Active Learners" />
            <Stat num="95%" label="Success Rate" />
            <Stat num="24/7" label="AI Support" />
          </div>
        </section>

        {/* Right auth card */}
        <section className="md:pl-6">
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-xl md:p-8">
            <h2 className="text-3xl font-extrabold">
              {mode === "login" ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              {mode === "login"
                ? "Sign in to continue your learning journey"
                : "Register to start your learning journey"}
            </p>

            {/* Tabs */}
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={
                  "rounded-lg px-4 py-2 text-sm font-semibold " +
                  (mode === "login"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-white/70 hover:text-white")
                }
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={
                  "rounded-lg px-4 py-2 text-sm font-semibold " +
                  (mode === "register"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-white/70 hover:text-white")
                }
              >
                Register
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "register" && (
                <div>
                  <label className="text-xs text-white/70">Full Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-white/70">Email Address</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-white/70">Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {err && (
                <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">
                  {err}
                </div>
              )}
              {msg && (
                <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-500/30">
                  {msg}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => alert("Forgot password can be added later")}
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign in to Your Tutor"
                  : "Create Account"}
              </button>

              <div className="py-2 text-center text-xs text-white/60">Or continue with</div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                  onClick={() => alert("Google login can be added later")}
                >
                  Google
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                  onClick={() => alert("Facebook login can be added later")}
                >
                  Facebook
                </button>
              </div>

              <div className="pt-2 text-center text-sm text-white/70">
                {mode === "login" ? (
                  <>
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-cyan-300 hover:text-cyan-200"
                    >
                      Start Learning Now
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-cyan-300 hover:text-cyan-200"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>

              <div className="pt-2 text-xs text-white/50">
                Note: Welcome email works only if <b>EMAIL_USER</b> and <b>EMAIL_PASS</b> are configured in{" "}
                <b>backend/.env</b>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ num, label }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-2xl font-extrabold text-white">{num}</div>
      <div className="mt-1 text-xs text-white/60">{label}</div>
    </div>
  );
}

