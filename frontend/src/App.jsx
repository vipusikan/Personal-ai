import { useEffect, useState } from "react";
import AuthPage from "./AuthPage";
import ChatPage from "./ChatPage";
import QuizPage from "./QuizPage";
import ProgressPage from "./ProgressPage";
import RecommendationsPage from "./RecommendationsPage";
import AdminDashboard from "./AdminDashboard";
import TheoryPage from "./TheoryPage";
import CareerPredictPage from "./CareerPredictPage";

const BASE_TABS = ["Chat", "Quiz", "Theory", "Career", "Progress", "Recommendations"];

// Tab icons
const TabIcon = ({ tab }) => {
  const icons = {
    Chat: "💬",
    Quiz: "📝",
    Theory: "📝",
    Career:"🎯",
    Progress: "📊",
    Recommendations: "🎯",
    Admin: "⚙️"
  };
  return <span className="mr-2">{icons[tab]}</span>;
};

export default function App() {
  const [tab, setTab] = useState("Chat");
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const savedToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  function handleAuthed(u) {
    setUser(u);
    setTab("Chat");
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    setTab("Chat");
  }

  if (!user) return <AuthPage onAuthed={handleAuthed} />;

  const tabs = user?.role === "admin" ? [...BASE_TABS, "Admin"] : BASE_TABS;
  const userId = user?.id || user?._id;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Animated background grid */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2a3a_1px,transparent_1px),linear-gradient(to_bottom,#1e2a3a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        {/* Glowing orbs */}
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#2563eb] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[250px] w-[250px] rounded-full bg-[#3b82f6] opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 top-1/2 -z-10 h-[200px] w-[200px] rounded-full bg-[#1d4ed8] opacity-20 blur-[100px]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 border-b border-[#1E2A3A] bg-[#0B1120]/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo and user info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] shadow-lg shadow-[#2563eb]/20">
                    <span className="text-lg font-bold text-white">AI</span>
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-white md:text-base">
                      Personal AI Tutor
                    </h1>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-[#94A3B8]">{user.email}</span>
                      <span className="text-[#1E2A3A]">•</span>
                      <span className="rounded-full bg-[#2563eb]/10 px-2 py-0.5 text-xs font-medium text-[#60a5fa] ring-1 ring-[#2563eb]/20">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="group relative inline-flex items-center justify-center rounded-lg bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#94A3B8] transition-all hover:bg-[#2A3A4A] hover:text-white"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Welcome Banner */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#132237] to-[#0B1727] p-8 ring-1 ring-[#2563eb]/20">
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-[#2563eb] opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-16 translate-y-16 rounded-full bg-[#3b82f6] opacity-10 blur-3xl"></div>
            
            <div className="relative">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full bg-[#2563eb]/10 px-3 py-1 text-xs font-medium text-[#60a5fa] ring-1 ring-[#2563eb]/20">
                      Rated 4.9/5 by 10,000+ learners
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white md:text-4xl">
                    Welcome back, <span className="text-[#3b82f6]">{user.name}</span>
                  </h2>
                  <p className="text-lg text-[#94A3B8]">
                    Your intelligent study partner
                  </p>
                  <p className="max-w-2xl text-sm text-[#64748B]">
                    Experience the future of learning with an AI tutor that adapts to your unique style, 
                    provides personalized guidance, and helps you master software engineering faster.
                  </p>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 rounded-xl bg-[#1E2A3A]/50 p-4 ring-1 ring-[#2563eb]/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">50k+</div>
                    <div className="text-xs text-[#94A3B8]">Active Learners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">95%</div>
                    <div className="text-xs text-[#94A3B8]">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-xs text-[#94A3B8]">AI Support</div>
                  </div>
                </div>
              </div>
              
              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full bg-[#1E2A3A] px-4 py-2 text-xs text-[#94A3B8] ring-1 ring-[#2563eb]/20">
                  💬 Chat to learn concepts
                </div>
                <div className="rounded-full bg-[#1E2A3A] px-4 py-2 text-xs text-[#94A3B8] ring-1 ring-[#2563eb]/20">
                  📝 Quiz to test yourself
                </div>
                <div className="rounded-full bg-[#1E2A3A] px-4 py-2 text-xs text-[#94A3B8] ring-1 ring-[#2563eb]/20">
                  🎯 Get personalized recommendations
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Tabs for Desktop */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4 px-3">
                  Navigation
                </h3>
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`group relative w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                      tab === t
                        ? "bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/20"
                        : "text-[#94A3B8] hover:bg-[#1E2A3A] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <TabIcon tab={t} />
                      <span>{t}</span>
                      {tab === t && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mb-4 flex w-full items-center justify-between rounded-lg bg-[#1E2A3A] px-4 py-3 text-white"
              >
                <span className="flex items-center">
                  <TabIcon tab={tab} />
                  <span className="font-medium">{tab}</span>
                </span>
                <svg
                  className={`h-5 w-5 transition-transform ${isSidebarOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSidebarOpen && (
                <div className="mb-4 space-y-1 rounded-lg bg-[#132237] p-2">
                  {tabs.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm transition ${
                        tab === t
                          ? "bg-[#2563eb] text-white"
                          : "text-[#94A3B8] hover:bg-[#1E2A3A] hover:text-white"
                      }`}
                    >
                      <TabIcon tab={t} />
                      <span className="font-medium">{t}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="rounded-2xl bg-[#0F172A] p-6 ring-1 ring-[#2563eb]/20 min-h-[600px]">
             <div className="animate-fadeIn">
                {tab === "Chat" && <ChatPage userId={userId} />}
                {tab === "Quiz" && <QuizPage userId={userId} />}
                {tab === "Theory" && <TheoryPage userId={userId} />}   {/* 🔥 ADD THIS LINE */}
                {tab === "Progress" && <ProgressPage userId={userId} />}
                {tab === "Recommendations" && <RecommendationsPage userId={userId} />}
                {tab === "Admin" && <AdminDashboard />}
                {tab === "Career" && <CareerPredictPage />}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}