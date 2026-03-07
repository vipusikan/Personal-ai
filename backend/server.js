// server.js (UPDATED + FIXED: "Explain Kubernetes" no longer returns "Scrum")
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

const { pickQuestions, scoreAnswer, getCorrectById, getCategories } = require("./ml/theory");
const { loadModel, predict } = require("./ml/predict");
const { Message, QuizAttempt, TopicStat } = require("./db/models");

const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const careerRoutes = require("./routes/career");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/career", careerRoutes);

// ===== Load ML models =====
const intentModel = loadModel(path.join(__dirname, "models", "intentModel.json"));
const topicModel = loadModel(path.join(__dirname, "models", "topicModel.json"));

// ---------- CSV HELPERS (fix encoding/BOM + trim) ----------
function cleanKey(k) {
  return String(k || "").replace(/^\uFEFF/, "").trim();
}
function cleanVal(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\r/g, "").trim();
}
function normalizeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) out[cleanKey(k)] = cleanVal(v);
  return out;
}
function loadCsv(fileName) {
  const filePath = path.join(__dirname, "data", fileName);
  const buf = fs.readFileSync(filePath);

  let text = buf.toString("utf8");
  if (text.includes("�")) text = buf.toString("latin1");

  const rows = parse(text, { columns: true, skip_empty_lines: true });
  return rows.map(normalizeRow);
}

// ===== Load CSV data =====
const lessons = loadCsv("lessons.csv");
const questions = loadCsv("questions.csv");
const resources = loadCsv("resources.csv");

// ===== Build topic index (FAST + ACCURATE topic detection) =====
const TOPIC_SET = new Set(
  lessons.map((l) => String(l.topic || "").trim()).filter(Boolean)
);
const TOPIC_LIST_SORTED = Array.from(TOPIC_SET).sort(
  (a, b) => b.length - a.length // longest first (important!)
);
const TOPIC_LOWER_MAP = new Map(
  TOPIC_LIST_SORTED.map((t) => [t.toLowerCase(), t])
);

function findLesson(topic) {
  const t = String(topic || "").trim().toLowerCase();
  return lessons.find((l) => String(l.topic || "").trim().toLowerCase() === t) || null;
}

// Try to extract topic phrase from messages like:
// "explain kubernetes", "interview questions on sdlc", "advantages of agile"
function extractTopicCandidate(msgLower) {
  const patterns = [
    /(?:explain|define|what is|what are)\s+(.+)$/i,
    /(?:advantages|benefits|pros)\s+of\s+(.+)$/i,
    /(?:disadvantages|limitations|cons)\s+of\s+(.+)$/i,
    /(?:example|examples|sample|demo)\s+(?:of)?\s*(.+)$/i,
    /(?:interview\s+questions|questions)\s+(?:on|about|for)\s+(.+)$/i,
    /(?:real\s*world\s*use|use\s*case|where\s*used|used\s*for)\s+(?:of)?\s*(.+)$/i,
  ];

  for (const re of patterns) {
    const m = msgLower.match(re);
    if (m && m[1]) {
      return m[1]
        .replace(/[?.!,]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

// MAIN topic detection:
// 1) use extracted candidate (if any) and match it
// 2) else substring match against lessons topics (longest-first)
// 3) else fallback to ML topic model
function detectTopicFromMessage(message) {
  const msgLower = String(message || "").trim().toLowerCase();

  // 1) candidate extraction
  const cand = extractTopicCandidate(msgLower);
  if (cand) {
    // exact match
    if (TOPIC_LOWER_MAP.has(cand.toLowerCase())) return TOPIC_LOWER_MAP.get(cand.toLowerCase());

    // contains match: find the best topic contained in candidate text
    const candLower = cand.toLowerCase();
    for (const t of TOPIC_LIST_SORTED) {
      if (candLower.includes(t.toLowerCase())) return t;
    }
  }

  // 2) direct substring match in whole message (longest-first)
  for (const t of TOPIC_LIST_SORTED) {
    if (msgLower.includes(t.toLowerCase())) return t;
  }

  // 3) fallback to ML
  return predict(message, topicModel)?.label || "General";
}

function formatExplainReply(message, topic) {
  const lesson = findLesson(topic);
  if (!lesson) {
    return `I can explain "${topic}", but I don't have a lesson for it yet.\nTry: "what topics you have"`;
  }

  const m = String(message || "").toLowerCase();

  if (m.includes("advantage") || m.includes("benefit") || m.includes("pros")) {
    return `✅ Advantages of ${lesson.topic}\n\n${lesson.advantages || "Not added yet."}`;
  }

  if (m.includes("disadvantage") || m.includes("limitation") || m.includes("cons")) {
    return `⚠️ Disadvantages of ${lesson.topic}\n\n${lesson.disadvantages || "Not added yet."}`;
  }

  if (
    m.includes("real world") ||
    m.includes("use case") ||
    m.includes("used for") ||
    m.includes("where used")
  ) {
    return `🌍 Real-world use of ${lesson.topic}\n\n${lesson.real_world_use || "Not added yet."}`;
  }

  // Example detection
  if (m.includes("example") || m.includes("sample") || m.includes("demo")) {
    const raw = lesson.example || "Not added yet.";
    const formatted = raw
      .split(/\n|;/)
      .map((e) => e.trim())
      .filter(Boolean)
      .map((e) => `• ${e}`)
      .join("\n");
    return `🧩 Examples of ${lesson.topic}\n\n${formatted}`;
  }

  // Interview detection
  if (m.includes("interview") || m.includes("questions") || m.includes("q&a") || m.includes("frequently asked")) {
    const raw = lesson.interview_questions || "Not added yet.";
    const formatted = raw
      .split(/\n|;/)
      .map((q) => q.trim())
      .filter(Boolean)
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    return `🎤 Interview Questions on ${lesson.topic}\n\n${formatted}`;
  }

  return (
    `📘 ${lesson.topic}\n\n` +
    `Definition:\n${lesson.definition || "Not added yet."}\n\n` +
    `Advantages:\n${lesson.advantages || "Not added yet."}\n\n` +
    `Disadvantages:\n${lesson.disadvantages || "Not added yet."}\n\n` +
    `Real-world use:\n${lesson.real_world_use || "Not added yet."}\n\n` +
    `Try: "advantages of ${lesson.topic}" or "example of ${lesson.topic}" or "interview questions on ${lesson.topic}".`
  );
}

// ===== MongoDB connect =====
const MONGO_URL = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ MongoDB connected:", MONGO_URL))
  .catch((err) => console.error("MongoDB error:", err.message));

// ===== Routes =====
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ===== THEORY =====
app.get("/api/theory/categories", (req, res) => {
  res.json({ categories: ["All", ...getCategories()] });
});

app.get("/api/theory/start", (req, res) => {
  const { category = "All", n = 5 } = req.query;
  const qs = pickQuestions({ category, n: Number(n) || 5 });
  res.json({ category, questions: qs });
});

app.post("/api/theory/submit", async (req, res) => {
  const { userId, answers } = req.body;
  if (!userId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "userId and answers[] required" });
  }

  let totalScore = 0;
  const results = [];

  for (const a of answers) {
    const { idx, row } = getCorrectById(a.id);
    if (!row) continue;

    const s = scoreAnswer(a.text || "", idx);
    totalScore += s;

    results.push({
      id: a.id,
      question: row.question,
      score: s,
      expectedAnswer: row.answer,
    });
  }

  const avgScore = results.length ? Math.round(totalScore / results.length) : 0;
  res.json({ ok: true, avgScore, results });
});

// ===== CHAT =====
app.post("/api/chat", async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: "userId and message required" });
  }

  const msg = String(message || "").trim().toLowerCase();

  // ✅ Force explain when user asks examples / pros-cons / interview questions, etc.
  const FORCE_EXPLAIN_PATTERNS = [
    "interview question",
    "interview questions",
    "interview q",
    "interview q&a",
    "q&a",
    "advantages of",
    "disadvantages of",
    "pros of",
    "cons of",
    "real world use",
    "use case",
    "where used",
    "example of",
    "give example",
    "sample of",
  ];
  const shouldForceExplain = FORCE_EXPLAIN_PATTERNS.some((p) => msg.includes(p));

  // ✅ "what topics you have"
  if (
    msg.includes("what topics") ||
    msg.includes("topics you have") ||
    msg.includes("your topics") ||
    msg.includes("available topics")
  ) {
    const topicList = Array.from(TOPIC_SET).sort((a, b) => a.localeCompare(b));

    const reply =
      `📚 I can explain ${topicList.length} topics:\n\n` +
      topicList.map((t) => `• ${t}`).join("\n") +
      `\n\nTry: "Explain SDLC" or "Explain Kubernetes"`;

    await Message.create({ userId, role: "user", text: message, intent: "other", topic: "General" });
    await Message.create({ userId, role: "bot", text: reply, intent: "other", topic: "General" });

    return res.json({ intent: "other", topic: "General", reply });
  }

  const GREETINGS = new Set([
    "hi", "hello", "hey", "hii", "hiii", "hai",
    "good morning", "good afternoon", "good evening",
    "yo", "sup", "whats up", "what's up",
  ]);

  const NOISE = new Set([
    "?", "??", "...", "....", ".", "ok", "okk", "k", "hmm", "hmmm", "asdf", "random",
  ]);

  let intent = "other";
  let topic = "General";

  // ✅ 1) Greetings
  if (GREETINGS.has(msg)) {
    intent = "greeting";
    topic = "General";
  }
  // ✅ 2) Noise / very short
  else if (NOISE.has(msg) || msg.length <= 2) {
    const reply =
      "Please type a complete question 😊\nExample: 'Explain SDLC' or 'Interview questions on SDLC'.";

    await Message.create({ userId, role: "user", text: message, intent: "other", topic: "General" });
    await Message.create({ userId, role: "bot", text: reply, intent: "other", topic: "General" });

    return res.json({ intent: "other", topic: "General", reply });
  }
  // ✅ 3) Normal inputs -> detect topic from CSV first (FIXES Kubernetes→Scrum)
  else {
    topic = detectTopicFromMessage(message);

    // ✅ IMPORTANT: force explain BEFORE intent model (fix "interview questions on X" becoming quiz)
    if (shouldForceExplain) {
      intent = "explain";
    } else {
      intent = predict(message, intentModel)?.label || "other";
    }
  }

  await Message.create({ userId, role: "user", text: message, intent, topic });

  let reply = "";
  if (intent === "greeting") {
    reply = "Hi! Ask me about SDLC, Agile, Scrum, Kubernetes, Docker, UML, Testing, Version Control, etc.";
  } else if (intent === "explain") {
    reply = formatExplainReply(message, topic);
  } else if (intent === "quiz") {
    reply = `Okay! Open the Quiz tab and choose topic: ${topic}.`;
  } else if (intent === "recommend") {
    reply = `Open Recommendations to get resources for: ${topic}.`;
  } else if (intent === "check_answer") {
    reply = "Answer checking is best inside quizzes. Start a quiz and submit answers for scoring.";
  } else if (intent === "progress") {
    reply = "Open the Progress tab to see your mastery by topic.";
  } else if (intent === "thanks") {
    reply = "You're welcome 😊 If you want, ask: 'Interview questions on SDLC'.";
  } else {
    // Helpful fallback: show closest topic suggestion if we can
    const suggestion = detectTopicFromMessage(message);
    if (suggestion && suggestion !== "General" && suggestion !== topic) {
      reply = `Did you mean **${suggestion}**?\nTry: "Explain ${suggestion}".`;
    } else {
      reply = `I didn't understand. Try: "Explain SDLC" or ask: "what topics you have".`;
    }
  }

  await Message.create({ userId, role: "bot", text: reply, intent, topic });
  res.json({ intent, topic, reply });
});

// ===== QUIZ =====
app.get("/api/quiz/start", (req, res) => {
  const { topic, n = 5 } = req.query;
  if (!topic) return res.status(400).json({ error: "topic required" });

  const pool = questions.filter((q) => q.topic === topic);
  if (!pool.length) return res.json({ topic, questions: [] });

  const shuffled = pool.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(Number(n), pool.length)).map((q) => ({
    id: q.id,
    topic: q.topic,
    difficulty: Number(q.difficulty),
    question: q.question,
    A: q.A,
    B: q.B,
    C: q.C,
    D: q.D,
  }));

  res.json({ topic, questions: picked });
});

app.post("/api/quiz/submit", async (req, res) => {
  const { userId, topic, answers } = req.body;
  if (!userId || !topic || !Array.isArray(answers)) {
    return res.status(400).json({ error: "userId, topic, answers[] required" });
  }

  const answerMap = new Map();
  for (const q of questions) answerMap.set(String(q.id), q.answer);

  let score = 0;
  for (const a of answers) {
    const correct = answerMap.get(String(a.id));
    if (correct && a.selected === correct) score++;
  }

  const total = answers.length;
  await QuizAttempt.create({ userId, topic, score, total });

  const stat = await TopicStat.findOneAndUpdate(
    { userId, topic },
    { $inc: { attempts: 1, correct: score, totalQuestions: total } },
    { upsert: true, new: true }
  );

  const mastery = stat.totalQuestions ? (stat.correct / stat.totalQuestions) * 100 : 0;
  stat.mastery = Math.round(mastery * 10) / 10;
  await stat.save();

  res.json({ status: "ok", score, total, mastery: stat.mastery });
});

// ===== PROGRESS =====
app.get("/api/progress", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const stats = await TopicStat.find({ userId }).sort({ mastery: 1 });
  res.json({ userId, stats });
});

// ===== RECOMMENDATIONS =====
app.get("/api/recommendations", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const stats = await TopicStat.find({ userId }).sort({ mastery: 1 }).limit(3);
  const weakTopics = stats.map((s) => s.topic);

  const recs = [];
  for (const t of weakTopics) {
    const r = resources.filter((x) => x.topic === t).slice(0, 3);
    recs.push(...r);
  }

  res.json({
    weakTopics,
    recommendations: recs.length ? recs : resources.slice(0, 10),
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));