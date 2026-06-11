const jwt = require("jsonwebtoken");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMmE2ZGFjMDMzODA2ZmZkYWY1MTE2NyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3ODExNjc1ODgsImV4cCI6MTc4MTE2ODQ4OH0.b0Y1YuGac3l9RrxH4BKajdjg7YyZBQlipXf48GqD4F4";
const secret = "fallback-secret-key-change-in-production";

try {
  const decoded = jwt.verify(token, secret);
  console.log("Decoded:", decoded);
} catch (error) {
  console.log("Error Name:", error.name);
  console.log("Error Message:", error.message);
}
