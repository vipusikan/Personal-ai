const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  intent: String,
  topic: String,
  createdAt: { type: Date, default: Date.now }
});

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TopicStatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  topic: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  mastery: { type: Number, default: 0 }
});

TopicStatSchema.index({ userId: 1, topic: 1 }, { unique: true });

module.exports = {
  Message: mongoose.model("Message", MessageSchema),
  QuizAttempt: mongoose.model("QuizAttempt", QuizAttemptSchema),
  TopicStat: mongoose.model("TopicStat", TopicStatSchema)
};