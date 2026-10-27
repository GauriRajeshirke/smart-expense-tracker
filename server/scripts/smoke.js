// End-to-end check of the running API. Start the server first (npm run dev), then:
//   npm run smoke
// It creates two throw-away test users, exercises every endpoint, and checks that
// users cannot see or change each other's data. It only READS the demo account
// (for the AI insights check) and never changes it. For the AI checks, also start
// the ML service (uvicorn main:app --port 8000); without it those checks are skipped.
const BASE = process.env.API_URL || "http://localhost:5000/api";
const stamp = Date.now();

let passed = 0;
let failed = 0;
const check = (name, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${detail}`);
  }
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses have no JSON body
  }
  return { status: res.status, data };
}

const today = new Date().toISOString().slice(0, 10);
const month = today.slice(0, 7);

async function main() {
  // --- health and protection ---
  const health = await call("GET", "/health");
  check("health endpoint works", health.status === 200 && health.data?.status === "ok");
  check("database is connected", health.data?.database === "connected", JSON.stringify(health.data));
  check("transactions need a token (401)", (await call("GET", "/transactions")).status === 401);
  check("fake token is rejected (401)", (await call("GET", "/transactions", { token: "abc.def.ghi" })).status === 401);

  // --- register / login ---
  const emailA = `smoke-a-${stamp}@example.com`;
  const passwordA = "SmokeTest#123";
  const regA = await call("POST", "/auth/register", { body: { name: "Smoke A", email: emailA, password: passwordA } });
  check("register works (201 + token)", regA.status === 201 && Boolean(regA.data?.token), JSON.stringify(regA.data));
  check("register never returns the password", !JSON.stringify(regA.data).includes(passwordA));
  const tokenA = regA.data?.token;

  const dup = await call("POST", "/auth/register", { body: { name: "Smoke A", email: emailA, password: passwordA } });
  check("duplicate email is rejected (409)", dup.status === 409);
  check("short password is rejected (400)", (await call("POST", "/auth/register", { body: { name: "X Y", email: `x-${stamp}@example.com`, password: "123" } })).status === 400);
  check("bad email is rejected (400)", (await call("POST", "/auth/register", { body: { name: "X Y", email: "not-an-email", password: passwordA } })).status === 400);

  check("wrong password is rejected (401)", (await call("POST", "/auth/login", { body: { email: emailA, password: "wrong-password" } })).status === 401);
  check("NoSQL injection in login is blocked (400)", (await call("POST", "/auth/login", { body: { email: { $gt: "" }, password: "x" } })).status === 400);
  const loginA = await call("POST", "/auth/login", { body: { email: emailA, password: passwordA } });
  check("login works", loginA.status === 200 && Boolean(loginA.data?.token));
  const me = await call("GET", "/auth/me", { token: tokenA });
  check("/auth/me returns the user", me.status === 200 && me.data?.user?.email === emailA);

  // --- transactions ---
  const income = await call("POST", "/transactions", { token: tokenA, body: { type: "income", amount: 50000, category: "Salary", date: today, description: "Smoke salary" } });
  check("create income (201)", income.status === 201 && income.data?._id, JSON.stringify(income.data));
  const expense = await call("POST", "/transactions", { token: tokenA, body: { type: "expense", amount: 1200, category: "Food", date: today, description: "Smoke lunch" } });
  check("create expense (201)", expense.status === 201);
  check("negative amount rejected (400)", (await call("POST", "/transactions", { token: tokenA, body: { type: "expense", amount: -5, category: "Food", date: today } })).status === 400);
  check("wrong category for type rejected (400)", (await call("POST", "/transactions", { token: tokenA, body: { type: "income", amount: 10, category: "Food", date: today } })).status === 400);
  check("bad date rejected (400)", (await call("POST", "/transactions", { token: tokenA, body: { type: "expense", amount: 10, category: "Food", date: "yesterday-ish" } })).status === 400);

  const all = await call("GET", "/transactions", { token: tokenA });
  check("list returns 2 transactions", all.status === 200 && all.data?.length === 2, `got ${all.data?.length}`);
  const onlyExpense = await call("GET", "/transactions?type=expense", { token: tokenA });
  check("filter by type works", onlyExpense.data?.length === 1 && onlyExpense.data[0].type === "expense");
  const searched = await call("GET", "/transactions?search=salary", { token: tokenA });
  check("search works", searched.data?.length === 1 && searched.data[0].category === "Salary");
  const byMonth = await call("GET", `/transactions?month=${month}`, { token: tokenA });
  check("filter by month works", byMonth.data?.length === 2);
  check("weird search text does not crash (200)", (await call("GET", "/transactions?search=%28%28%28%28", { token: tokenA })).status === 200);

  const expenseId = expense.data?._id;
  const updated = await call("PUT", `/transactions/${expenseId}`, { token: tokenA, body: { type: "expense", amount: 1500, category: "Food", date: today, description: "Smoke lunch edited" } });
  check("update works", updated.status === 200 && updated.data?.amount === 1500);

  // --- dashboard summary (calculated from the database) ---
  const summary = await call("GET", "/reports/summary", { token: tokenA });
  check("summary income = 50000", summary.data?.totals?.income === 50000, JSON.stringify(summary.data?.totals));
  check("summary expenses = 1500", summary.data?.totals?.expenses === 1500);
  check("summary balance = 48500", summary.data?.totals?.balance === 48500);
  check("summary savings rate = 97%", summary.data?.totals?.savingsRate === 97);
  check("summary has 6 months of chart data", summary.data?.monthly?.length === 6);
  check("current month shows the data", summary.data?.monthly?.[5]?.income === 50000 && summary.data?.monthly?.[5]?.expenses === 1500);
  check("category breakdown has Food = 1500", summary.data?.categories?.[0]?.name === "Food" && summary.data?.categories?.[0]?.value === 1500);

  // --- budgets ---
  const budget = await call("POST", "/budgets", { token: tokenA, body: { category: "Food", month, limit: 5000 } });
  check("set budget works", budget.status === 200 && budget.data?.limit === 5000, JSON.stringify(budget.data));
  const budget2 = await call("POST", "/budgets", { token: tokenA, body: { category: "Food", month, limit: 6000 } });
  check("setting the same budget again updates it", budget2.status === 200 && budget2.data?._id === budget.data?._id && budget2.data?.limit === 6000);
  check("invalid budget rejected (400)", (await call("POST", "/budgets", { token: tokenA, body: { category: "Salary", month, limit: 100 } })).status === 400);
  const progress = await call("GET", `/budgets/progress?month=${month}`, { token: tokenA });
  const food = progress.data?.[0];
  check("budget progress shows spent = 1500", food?.spent === 1500 && food?.limit === 6000, JSON.stringify(progress.data));
  check("budget progress percent = 25", food?.percent === 25);

  // --- user isolation: user B must not see or change user A's data ---
  const emailB = `smoke-b-${stamp}@example.com`;
  const regB = await call("POST", "/auth/register", { body: { name: "Smoke B", email: emailB, password: passwordA } });
  const tokenB = regB.data?.token;
  const listB = await call("GET", "/transactions", { token: tokenB });
  check("user B sees none of user A's transactions", listB.status === 200 && listB.data?.length === 0);
  const summaryB = await call("GET", "/reports/summary", { token: tokenB });
  check("user B's summary is empty", summaryB.data?.totals?.income === 0 && summaryB.data?.totals?.expenses === 0);
  check("user B cannot edit user A's transaction (404)", (await call("PUT", `/transactions/${expenseId}`, { token: tokenB, body: { type: "expense", amount: 1, category: "Food", date: today } })).status === 404);
  check("user B cannot delete user A's transaction (404)", (await call("DELETE", `/transactions/${expenseId}`, { token: tokenB })).status === 404);
  check("user B cannot delete user A's budget (404)", (await call("DELETE", `/budgets/${budget.data?._id}`, { token: tokenB })).status === 404);
  const stillThere = await call("GET", "/transactions", { token: tokenA });
  check("user A's data is untouched", stillThere.data?.length === 2);

  // --- AI insights (Express -> Python ML service) ---
  check("insights need a token (401)", (await call("GET", "/insights")).status === 401);
  const emptyInsights = await call("GET", "/insights", { token: tokenB });
  check("user with no expenses gets an empty result", emptyInsights.status === 200 && emptyInsights.data?.analyzed === 0 && emptyInsights.data?.anomalies?.length === 0, JSON.stringify(emptyInsights.data));

  const insightsA = await call("GET", "/insights", { token: tokenA });
  if (insightsA.status === 503) {
    console.log("SKIP  AI checks: ML service is not running (start it with: uvicorn main:app --port 8000)");
  } else {
    check("insights work for a user with little history (200)", insightsA.status === 200 && insightsA.data?.analyzed === 1 && insightsA.data?.anomalies?.length === 0, JSON.stringify(insightsA.data));
    check("small categories are skipped, not analysed", insightsA.data?.skippedCategories?.includes("Food"));

    // Read-only check against the seeded demo account (npm run seed)
    const demo = await call("POST", "/auth/login", { body: { email: "demo@example.com", password: process.env.DEMO_PASSWORD || "Demo@1234" } });
    if (demo.status !== 200) {
      console.log("SKIP  demo account insights: demo account not found (run: npm run seed)");
    } else {
      const demoInsights = await call("GET", "/insights", { token: demo.data.token });
      const found = (demoInsights.data?.anomalies || []).map((a) => a.description).sort();
      check("demo account: AI finds the 3 planted unusual expenses", demoInsights.status === 200 && found.length === 3, JSON.stringify(found));
      check("demo account: results contain only its own data", (demoInsights.data?.anomalies || []).every((a) => a.description.includes("(demo)")));
    }
  }

  // --- delete ---
  check("delete budget works", (await call("DELETE", `/budgets/${budget.data?._id}`, { token: tokenA })).status === 200);
  check("delete transaction works", (await call("DELETE", `/transactions/${expenseId}`, { token: tokenA })).status === 200);
  check("invalid id rejected (400)", (await call("DELETE", "/transactions/not-an-id", { token: tokenA })).status === 400);
  const afterDelete = await call("GET", "/transactions", { token: tokenA });
  check("list now has 1 transaction", afterDelete.data?.length === 1);
  check("unknown route gives 404", (await call("GET", "/nope")).status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log("Test users (smoke-a / smoke-b @example.com) were created in your database; you can delete them.");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nCould not reach the API. Is the server running (npm run dev) and MongoDB connected?");
  console.error(error.message);
  process.exit(1);
});
