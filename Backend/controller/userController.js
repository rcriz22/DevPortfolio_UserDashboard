import crypto from "crypto";
import User from "../models/User.js";
import { sendVerificationCodeEmail  } from "../services/mailer.js";
import { encrypt, decrypt } from "../services/encryption.js";
import bcrypt from "bcryptjs";


export const sendVerificationCode = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ error: "New email is required" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    const user = await User.findById(req.user.id);

    user.pendingEmail = newEmail.trim().toLowerCase();
    user.emailVerificationToken = token;
    user.emailVerificationExpiry = expiry;
   
    await user.save({validateBeforeSave: false} );

    console.log("Sending verification email to:", newEmail);
    await sendVerificationCodeEmail (newEmail, "Verify Your Email", token);

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Send verification code error:", error);
    res.status(500).json({ error: "Failed to send verification code" });
  }

};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.pendingEmail || !user.emailVerificationToken) {
      return res.status(400).json({ error: "No verification request found." });
    }

    if (code !== user.emailVerificationToken) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    if (Date.now() > user.emailVerificationExpiry) {
      return res.status(400).json({ error: "Verification code expired." });
    }

    // Apply new email
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    user.isVerified = true;

    await user.save();

    res.json({ message: "Email verified successfully!", email: user.email });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Failed to verify email" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      email: user.email,
      bio: user.bio ? decrypt(user.bio) : null,
      isVerified: user.isVerified,
      createdAt: user.createdAt,

    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;

    const user = await User.findById(req.user.id);

    if (bio !== undefined) {
      user.bio = encrypt(bio);
    }

    await user.save();

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashed;
    user.passwordUpdatedAt = new Date();

    await user.save();

    res.json({ message: "Password updated successfully!" });

  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
};

