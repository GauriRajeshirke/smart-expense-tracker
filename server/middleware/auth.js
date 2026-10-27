import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// Put this in front of any route that needs a logged-in user.
// The client must send:  Authorization: Bearer <token>
export const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not authorized: please log in" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ message: "Session expired or invalid: please log in again" });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: "Not authorized: account not found" });
  }

  req.user = user; // controllers use req.user._id to fetch only this user's data
  next();
});
