require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@gmail.com";
  const password = "Admin@123";

  const user = await User.findOne({ email });

  if (!user) {
    console.log("Admin not found. Run createAdmin.js first.");
    process.exit(0);
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.role = "admin";
  await user.save();

  console.log("Admin password reset successfully");
  console.log("Email:", email);
  console.log("Password:", password);

  process.exit(0);
}

run();