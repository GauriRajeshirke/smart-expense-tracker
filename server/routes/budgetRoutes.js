import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  deleteBudget,
  getBudgetProgress,
  getBudgets,
  saveBudget,
} from "../controllers/budgetController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { EXPENSE_CATEGORIES } from "../utils/constants.js";

const router = Router();
router.use(protect);

const monthQuery = query("month")
  .optional()
  .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  .withMessage("Month must look like 2026-10");

router.get("/", monthQuery, validate, getBudgets);
router.get("/progress", monthQuery, validate, getBudgetProgress);

router.post(
  "/",
  [
    body("category").isIn(EXPENSE_CATEGORIES).withMessage("Choose a valid expense category"),
    body("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Month must look like 2026-10"),
    body("limit")
      .isFloat({ min: 1, max: 1000000000 })
      .withMessage("Budget must be at least 1")
      .toFloat(),
  ],
  validate,
  saveBudget
);

router.delete("/:id", param("id").isMongoId().withMessage("Invalid budget ID"), validate, deleteBudget);

export default router;
