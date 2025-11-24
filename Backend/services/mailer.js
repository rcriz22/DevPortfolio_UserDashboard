import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password here
  },
});

// For password reset
export const sendResetEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: `"DevPortfolio" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
    `
  });
};

// For email verification
export const sendVerificationCodeEmail = async (to, subject, code) => {
  try {
    await transporter.sendMail({
      from: `"DevPortfolio" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <p>Your verification code is:</p>
        <h2>${code}</h2>
        <p>This code expires in 15 minutes.</p>
      `
    });
  } catch (err) {
    console.error("Mailer error:", err);
    throw err;
  }
};
