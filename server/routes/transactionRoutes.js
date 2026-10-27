import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/constants.js";

const router = Router();
router.use(protect); // every transaction route needs a logged-in user

const idRule = param("id").isMongoId().withMessage("Invalid transaction ID");

const transactionRules = [
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("amount")
    .isFloat({ min: 0.01, max: 1000000000 })
    .withMessage("Amount must be greater than 0")
    .toFloat(),
  body("category").custom((value, { req }) => {
    const allowed = req.body.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!allowed.includes(value)) throw new Error("Invalid category for this transaction type");
    return true;
  }),
  body("date").isISO8601().withMessage("Enter a valid date").toDate(),
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Description must be 100 characters or fewer"),
];

const listRules = [
  query("month")
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("Month must look like 2026-10"),
];

router.get("/", listRules, validate, getTransactions);
router.post("/", transactionRules, validate, createTransaction);
router.put("/:id", idRule, transactionRules, validate, updateTransaction);
router.delete("/:id", idRule, validate, deleteTransaction);

export default router;
