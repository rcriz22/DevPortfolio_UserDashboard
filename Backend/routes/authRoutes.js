import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateProfileUpdate } from "../middleware/validation.js";
import { sendResetEmail, sendVerificationCodeEmail } from "../services/mailer.js";
import { encrypt, decrypt } from "../services/encryption.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Profile
router.get("/profile", authenticate, (req, res) => {
  res.set("Cache-Control", "private, max-age=600");
  res.json({
    name: "Raizel Criz",
    title: "Web Designer & Developer",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    about: "Curious, creative, and passionate about organizing ideas into digital art.",
  });
});

// Signup
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) 
      return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, passwordHash, role });
    
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) 
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) 
      return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh Token
  router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) 
    return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify (refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) 
      return res.status(401).json({ error: "Invalid user" });

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

// Logout
router.post("/logout", authenticate, (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  res.json({ message: "Logged out successfully" });
});

// Request Password Reset
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) 
    return res.status(200).json({ message: "If that email exists, a reset link was sent." });

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetLink = `https://localhost:5173/reset-password/${token}`;
  await sendResetEmail(user.email, resetLink);

  res.json({ message: "Password reset link sent." });
});

// Password Reset
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) 
    return res.status(400).json({ error: "Invalid or expired token" });

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  res.json({ message: "Password has been reset successfully." });
});

// Get current user info
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    res.json({
      user: {
        username: user.username,
        email: user.email ? decrypt(user.email) : "",
        bio: user.bio ? decrypt(user.bio) : "",
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

// Update user profile
   router.put("/update-profile", authenticate, validateProfileUpdate, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

    const { username, email, bio } = req.body;

    // Update username
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: "Username is taken" });
      user.username = username;
    }

    // Normalize incoming email
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    const currentEmail = user.email ? decrypt(user.email).trim().toLowerCase() : null;
    const pendingEmail = user.pendingEmail ? decrypt(user.pendingEmail).trim().toLowerCase() : null;

    // Update email (requires re-verification only if truly different)
    if (normalizedEmail && normalizedEmail !== currentEmail && normalizedEmail !== pendingEmail) {
      const existingEmail = await User.findOne({ email: encrypt(normalizedEmail) });
      if (existingEmail) return res.status(400).json({ error: "Email is already used" });

      user.pendingEmail = encrypt(normalizedEmail);
      user.emailVerificationToken = crypto.randomBytes(20).toString("hex");
      user.emailVerificationExpiry = Date.now() + 15 * 60 * 1000;
      user.isVerified = false;

      await sendVerificationCodeEmail(normalizedEmail, "Verify your new email", user.emailVerificationToken);
        }

        // Update bio
        if (bio) {
          user.bio = encrypt(bio);
        }

        await user.save();

        res.json({
          message: "Profile updated",
          user: {
            username: user.username,
            email: currentEmail,
            bio: user.bio ? decrypt(user.bio) : "",
            role: user.role,
            isVerified: user.isVerified
          }
        });

      } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: "Internal server error" });
      }
});


// Change Password
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new password are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) 
      return res.status(404).json({ error: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) 
      return res.status(401).json({ error: "Current password is incorrect." });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Admin-only route
router.get("/admin-panel", authenticate, authorize("Admin"), (req, res) => {
  res.json({ message: "Welcome to the admin panel" });
});

export default router;
