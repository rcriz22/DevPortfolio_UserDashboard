import express from "express";
import { getProfile, updateProfile } from "../controller/userController.js";
import { authenticate } from "../middleware/auth.js";
import {
  sendVerificationCode,
  verifyEmail,
  changePassword
} from "../controller/userController.js";

const router = express.Router();

router.post("/email/send-code", authenticate, sendVerificationCode);
router.post("/email/verify", authenticate, verifyEmail);
router.post("/change-password", authenticate, changePassword);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/send-verification-code", authenticate, sendVerificationCode);
router.post("/verify-email", authenticate, verifyEmail);
router.post("/change-password", authenticate, changePassword);

export default router;
