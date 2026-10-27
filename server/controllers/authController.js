import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Only send safe fields back (never the password hash)
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({ name, email, password }); // password is hashed in the model
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  // Same message for "no such user" and "wrong password" so attackers learn nothing
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me  (needs a token)
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
