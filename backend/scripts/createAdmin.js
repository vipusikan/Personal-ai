require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@gmail.com";   // ✅ use this for login
  const password = "Admin@123";      // ✅ use this for login

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name: "Admin",
    email,
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin created");
  console.log("Email:", email);
  console.log("Password:", password);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});