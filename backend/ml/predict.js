const fs = require("fs");

function loadModel(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function makeNgrams(tokens, ngramRange) {
  const [nMin, nMax] = ngramRange;
  const grams = [];
  for (let n = nMin; n <= nMax; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      grams.push(tokens.slice(i, i + n).join(" "));
    }
  }
  return grams;
}

function tfidfVector(text, model) {
  const tokens = tokenize(text);
  const grams = makeNgrams(tokens, model.ngram_range);

  const counts = new Map();
  for (const g of grams) {
    const idx = model.vocabulary_[g];
    if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1);
  }

  let norm2 = 0;
  const vec = new Map();
  for (const [idx, tf] of counts.entries()) {
    const val = tf * model.idf_[idx];
    vec.set(idx, val);
    norm2 += val * val;
  }

  const norm = Math.sqrt(norm2) || 1;
  for (const [idx, val] of vec.entries()) vec.set(idx, val / norm);
  return vec;
}

function predict(text, model) {
  const x = tfidfVector(text, model);
  const scores = model.intercept_.slice();

  for (const [idx, val] of x.entries()) {
    for (let k = 0; k < scores.length; k++) {
      scores[k] += model.coef_[k][idx] * val;
    }
  }

  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[best]) best = i;

  return { label: model.classes_[best], scores };
}

module.exports = { loadModel, predict };