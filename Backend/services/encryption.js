import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.ENCRYPTION_KEY; 
const ALGO = "aes-256-cbc";

// Encrypt
export function encrypt(text) {
  if (!text) return null; // prevent errors

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt
export function decrypt(data) {
  if (!data) return null;

  try {
    const [ivHex, encryptedText] = data.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(ALGO, Buffer.from(SECRET), iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return data; // fallback
  }
}
