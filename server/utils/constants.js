// Allowed categories. Keep in sync with client/src/utils/constants.js
export const EXPENSE_CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Other"];

export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
