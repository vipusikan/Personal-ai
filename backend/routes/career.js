const express = require("express");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();

// POST /api/career/predict
router.post("/predict", (req, res) => {
  const input = req.body;

  const scriptPath = path.join(__dirname, "..", "ml", "career_predict.py");

  const py = spawn("python", [scriptPath], {
    cwd: path.join(__dirname, "..", ".."), // run from project root (important)
  });

  let out = "";
  let err = "";

  py.stdout.on("data", (d) => (out += d.toString()));
  py.stderr.on("data", (d) => (err += d.toString()));

  py.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ message: "Python error", details: err });
    }

    try {
      const parsed = JSON.parse(out);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ message: "Bad Python response", raw: out, details: err });
    }
  });

  py.stdin.write(JSON.stringify(input));
  py.stdin.end();
});

module.exports = router;