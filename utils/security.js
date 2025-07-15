const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const signJwt = (payload) => jwt.sign(payload, jwtSecret, { expiresIn: "3h" });

const decryptJwt = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return false;
  }
};

function encryptText(text) {
  const key = Buffer.from(process.env.AES_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

function decryptText(text) {
  const key = Buffer.from(process.env.AES_KEY, "hex");
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { signJwt, decryptJwt, encryptText, decryptText };
