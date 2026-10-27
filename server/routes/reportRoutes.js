import { Router } from "express";
import { query } from "express-validator";
import { getSummary } from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();
router.use(protect);

router.get(
  "/summary",
  query("month")
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("Month must look like 2026-10"),
  validate,
  getSummary
);

export default router;
