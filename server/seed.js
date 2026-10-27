// Puts FAKE DEMO DATA into MongoDB for development and demonstration.
//   npm run seed
// It creates (or refreshes) one demo account and gives it ~6 months of sample
// transactions and budgets. Every record is marked isDemo: true.
// Only the demo account's records are touched; other users are left alone.
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";
import Budget from "./models/Budget.js";
import { currentMonthKey } from "./utils/dates.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data when NODE_ENV=production.");
  process.exit(1);
}

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@1234";

const now = new Date();

// A date N months ago, built in UTC and never later than today
function makeDate(monthsAgo, day) {
  const safeDay = monthsAgo === 0 ? Math.min(day, now.getUTCDate()) : day;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, safeDay));
}

// Small month-to-month changes so the charts look natural (no randomness)
const variation = [1, 1.1, 0.9, 1.05, 0.95, 1.15];

function buildTransactions(userId) {
  const list = [];
  const add = (monthsAgo, day, type, category, amount, description) => {
    list.push({
      user: userId,
      type,
      category,
      amount: Math.round(amount),
      description,
      date: makeDate(monthsAgo, day),
      isDemo: true,
    });
  };

  for (let m = 0; m < 6; m++) {
    const v = variation[m];
    add(m, 1, "income", "Salary", 65000, "Monthly salary (demo)");
    if (m % 2 === 0) add(m, 12, "income", "Freelance", 12000, "Freelance project (demo)");
    add(m, 3, "expense", "Rent", 18000, "House rent (demo)");
    add(m, 6, "expense", "Food", 3200 * v, "Groceries (demo)");
    add(m, 14, "expense", "Food", 1800 * v, "Dining out (demo)");
    add(m, 22, "expense", "Food", 2400 * v, "Weekend food (demo)");
    add(m, 8, "expense", "Transport", 1500 * v, "Fuel and metro (demo)");
    add(m, 18, "expense", "Transport", 900 * v, "Cab rides (demo)");
    add(m, 10, "expense", "Bills", 2200 * v, "Electricity and internet (demo)");
    add(m, 16, "expense", "Entertainment", 1200 * v, "Movies and OTT (demo)");
    add(m, 20, "expense", "Shopping", 2500 * v, "Clothes and accessories (demo)");
  }

  // A few deliberately unusual expenses for the AI insights to find
  add(1, 24, "expense", "Shopping", 24500, "Festival shopping spree (demo)");
  add(2, 15, "expense", "Entertainment", 9800, "Concert tickets (demo)");
  add(0, 5, "expense", "Food", 7800, "Party catering (demo)");

  return list;
}

function buildBudgets(userId) {
  const month = currentMonthKey();
  const limits = { Food: 9000, Transport: 3000, Shopping: 5000, Bills: 3000, Entertainment: 2000 };
  return Object.entries(limits).map(([category, limit]) => ({
    user: userId,
    category,
    month,
    limit,
    isDemo: true,
  }));
}

await connectDB();

let user = await User.findOne({ email: DEMO_EMAIL });
if (!user) {
  user = await User.create({ name: "Demo User", email: DEMO_EMAIL, password: DEMO_PASSWORD });
}

// Start from a clean slate for the demo account only
await Transaction.deleteMany({ user: user._id });
await Budget.deleteMany({ user: user._id });

const transactions = await Transaction.insertMany(buildTransactions(user._id));
const budgets = await Budget.insertMany(buildBudgets(user._id));

console.log(`Seeded ${transactions.length} demo transactions and ${budgets.length} demo budgets.`);
console.log("Demo login (fake account, for development only):");
console.log(`  email:    ${DEMO_EMAIL}`);
console.log(`  password: ${DEMO_PASSWORD}`);

await mongoose.disconnect();
