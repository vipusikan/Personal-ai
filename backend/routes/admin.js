const express = require("express");
const router = express.Router();

const User = require("../db/User");
const { TopicStat } = require("../db/models");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// ✅ helps you confirm THIS file is loaded
console.log("✅ admin routes loaded: /api/admin");

// ✅ All admin routes protected
router.use(requireAuth, requireAdmin);

// ✅ quick test route
router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "/api/admin/ping" });
});

// SUMMARY
router.get("/summary", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    res.json({ totalUsers, totalStudents, totalAdmins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LIST USERS
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET USER PROGRESS (by param OR fallback by query)
router.get("/users/:id/progress", async (req, res) => {
  try {
    const userId = req.params.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const stats = await TopicStat.find({ userId }).sort({ mastery: 1 });
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE USER (name/email/role)
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = String(email).toLowerCase();
    if (role !== undefined) update.role = role;

    // Prevent removing last admin
    if (role && role !== "admin") {
      const current = await User.findById(userId);
      if (current?.role === "admin") {
        const admins = await User.countDocuments({ role: "admin" });
        if (admins <= 1) {
          return res.status(400).json({ message: "Cannot remove last admin" });
        }
      }
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select(
      "_id name email role createdAt"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email already exists" });
    res.status(500).json({ message: err.message });
  }
});

// RESET USER PASSWORD
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(userId, { passwordHash }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE USER
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // prevent deleting yourself
    if (String(req.user.id) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // prevent deleting last admin
    if (user.role === "admin") {
      const admins = await User.countDocuments({ role: "admin" });
      if (admins <= 1) return res.status(400).json({ message: "Cannot delete last admin" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ JSON 404 inside /api/admin (prevents HTML red block in React)
router.use((req, res) => {
  res.status(404).json({ message: `Admin route not found: ${req.method} ${req.originalUrl}` });
});

module.exports = router;