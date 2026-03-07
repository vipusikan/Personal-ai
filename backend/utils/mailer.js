const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendWelcomeEmail(to, name) {
  const transporter = createTransporter();

  const subject = "Registration Successful - Software Engineering AI Tutor";
  const text =
    `Hi ${name},\n\n` +
    `✅ Your registration was successful.\n\n` +
    `You can now login and use:\n` +
    `- Chat tutor\n- Quizzes\n- Progress tracking\n- Recommendations\n\n` +
    `Good luck with your learning!\n\n` +
    `— AI Tutor Team`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

module.exports = { sendWelcomeEmail };