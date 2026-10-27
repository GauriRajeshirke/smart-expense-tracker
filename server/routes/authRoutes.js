import { Router } from "express";
import { body } from "express-validator";
import { getMe, login, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const emailRule = body("email")
  .isString()
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage("Enter a valid email address");

router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
    emailRule,
    // bcrypt only reads the first 72 characters, so longer passwords are not allowed
    body("password")
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must be 8-72 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [emailRule, body("password").isString().notEmpty().withMessage("Password is required")],
  validate,
  login
);

router.get("/me", protect, getMe);

export default router;
