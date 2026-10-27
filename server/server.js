import "dotenv/config"; // must stay first: loads server/.env
import app from "./app.js";
import connectDB from "./config/db.js";

function stopWithMessage(message) {
  console.error(`\nConfiguration error: ${message}\n`);
  process.exit(1);
}

// Refuse to start with missing or unsafe settings
const { MONGO_URI, JWT_SECRET } = process.env;
if (!MONGO_URI) {
  stopWithMessage("MONGO_URI is missing. Copy server/.env.example to server/.env and fill it in.");
}
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith("change-me")) {
  stopWithMessage(
    "JWT_SECRET must be a long random string (32+ characters). Generate one with:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

const PORT = process.env.PORT || 5000;

await connectDB();
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
