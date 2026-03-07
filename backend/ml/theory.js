const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// Load theory dataset once
function loadTheoryCSV() {
  const filePath = path.join(__dirname, "..", "data", "Software Questions.csv");
  const csvText = fs.readFileSync(filePath, "utf-8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true });
  
  // Clean rows
  return rows
    .filter((r) => r.Question && r.Answer)
    .map((r, idx) => ({
      id: String(idx + 1),
      question: String(r.Question).trim(),
      answer: String(r.Answer).trim(),
      category: (r.Category || "General").toString().trim(),
      difficulty: (r.Difficulty || "Medium").toString().trim(),
    }));
}

const THEORY_DATA = loadTheoryCSV();
console.log("✅ Theory dataset loaded:", THEORY_DATA.length);


// ---- TF-IDF Cosine Similarity (simple, no pretrained) ----
const natural = require("natural");
const TfIdf = natural.TfIdf;

// Build TF-IDF model from all answers
const tfidf = new TfIdf();
THEORY_DATA.forEach((row) => tfidf.addDocument(row.answer));

function cosineSim(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const k in vecA) {
    const a = vecA[k];
    normA += a * a;
    if (vecB[k]) dot += a * vecB[k];
  }
  for (const k in vecB) {
    const b = vecB[k];
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function vectorFromDoc(docIndex) {
  const vec = {};
  tfidf.listTerms(docIndex).forEach((t) => {
    vec[t.term] = t.tfidf;
  });
  return vec;
}

// Score student answer vs correct answer (0–100)
function scoreAnswer(studentText, correctIndex) {
  const student = (studentText || "").trim();
  if (!student) return 0;

  // student as a new doc
  const temp = new TfIdf();
  THEORY_DATA.forEach((row) => temp.addDocument(row.answer));
  temp.addDocument(student);

  const correctVec = {};
  temp.listTerms(correctIndex).forEach((t) => (correctVec[t.term] = t.tfidf));

  const studentVec = {};
  temp.listTerms(THEORY_DATA.length).forEach((t) => (studentVec[t.term] = t.tfidf));

  const sim = cosineSim(studentVec, correctVec);
  return Math.round(sim * 100);
}

function pickQuestions({ category = null, n = 5 }) {
  let pool = THEORY_DATA;
  if (category && category !== "All") {
    pool = THEORY_DATA.filter((q) => q.category.toLowerCase() === category.toLowerCase());
  }

  // shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length)).map((q) => ({
    id: q.id,
    question: q.question,
    category: q.category,
    difficulty: q.difficulty,
  }));
}

function getCorrectById(id) {
  const idx = THEORY_DATA.findIndex((x) => x.id === String(id));
  return { idx, row: THEORY_DATA[idx] };
}

function getCategories() {
  return Array.from(new Set(THEORY_DATA.map((x) => x.category))).sort();
}

module.exports = {
  THEORY_DATA,
  pickQuestions,
  scoreAnswer,
  getCorrectById,
  getCategories,
};