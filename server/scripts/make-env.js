// Creates server/.env (with a fresh random JWT secret) if it does not exist yet.
// setup.bat runs this for you. You can also run it by hand from the server folder:
//   node scripts/make-env.js
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

const target = new URL("../.env", import.meta.url);

if (existsSync(target)) {
  console.log("server/.env already exists - leaving it unchanged.");
  process.exit(0);
}

const lines = [
  "NODE_ENV=development",
  "PORT=5000",
  "MONGO_URI=mongodb://127.0.0.1:27017/smart-expense-tracker",
  `JWT_SECRET=${randomBytes(48).toString("hex")}`,
  "JWT_EXPIRES_IN=7d",
  "CLIENT_URL=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173",
  "ML_SERVICE_URL=http://127.0.0.1:8000",
];

writeFileSync(target, lines.join("\n") + "\n");
console.log("Created server/.env with a new random JWT secret.");
