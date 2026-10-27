# Smart Expense Tracker — AI-Powered Personal Finance Management

A full-stack mini project that tracks income and expenses, sets budgets, shows reports, and uses machine learning to flag unusual spending.

| Part | Technology | Port |
|---|---|---|
| Website (`client/`) | React 18, Vite, Tailwind CSS, Redux Toolkit, Recharts | 5173 |
| API (`server/`) | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt | 5000 |
| AI service (`ml-service/`) | Python, FastAPI, pandas, NumPy, scikit-learn | 8000 |

```
Browser  -->  Express API (5000)  -->  MongoDB
                    |
                    +-->  FastAPI AI service (8000)   (browser never talks to it directly)
```

## Features

- Register / log in (JWT, passwords hashed with bcrypt); every user sees only their own data
- Dashboard: income, expenses, balance, savings rate, monthly and category charts from the database
- Transactions: add, edit, delete, search, filter
- Budgets per category and month, with progress bars
- Reports: monthly summary, category breakdown, CSV export
- AI insights: Isolation Forest per category finds unusually large expenses
- Responsive layout with sidebar

## Demo data

`npm run seed` creates a **fake** account (`demo@example.com` / `Demo@1234`) with 66 sample transactions and 5 budgets, including 3 planted anomalies. These records are flagged `isDemo` and the app shows a "Demo data" banner. The seed script refuses to run when `NODE_ENV=production`.

## Requirements

- Node.js 18+ (20 recommended)
- Python 3.10+
- MongoDB running locally (Community Server) **or** a free MongoDB Atlas cluster

## Quick start (Windows)

1. Unzip the project. If Windows blocks the `.bat` files, run in PowerShell: `Get-ChildItem <project folder> -Recurse | Unblock-File`
2. Double-click `setup.bat` once. It installs everything, creates `server/.env` and loads the demo data.
3. Double-click `start.bat`. Three windows open and the browser opens `http://localhost:5173`.
4. Log in with `demo@example.com` / `Demo@1234`.
5. Double-click `stop.bat` when finished.

## Manual start (Windows, macOS, Linux)

Open three terminals.

```bash
# 1) API
cd server
npm install
node scripts/make-env.js     # creates .env with a random JWT secret (or copy .env.example)
npm run seed                 # optional demo data
npm run dev

# 2) AI service
cd ml-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 3) Website
cd client
npm install
npm run dev
```

## Environment variables

`server/.env` (see `server/.env.example`):

| Name | Meaning |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | At least 32 random characters. The server refuses to start otherwise |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_URL` | Allowed website origin(s), comma separated (CORS) |
| `ML_SERVICE_URL` | Address of the AI service, e.g. `http://127.0.0.1:8000` |
| `AUTH_RATE_LIMIT` | Optional: login attempts per 15 min per IP |

`client/.env` (optional): `VITE_API_URL` — API base URL, default `http://localhost:5000/api`.

Never commit `.env` files. Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## API overview

All routes except register/login need the header `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/transactions` | List (search/filter query params) |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |
| GET | `/api/budgets?month=YYYY-MM` | Budgets |
| GET | `/api/budgets/progress?month=YYYY-MM` | Budgets with amount spent |
| POST | `/api/budgets` | Create/update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/reports/summary` | Dashboard and report numbers |
| GET | `/api/insights` | AI unusual-spending analysis |
| GET | `/api/health` | Health check (public) |

AI service: `GET /health`, `POST /analyze` (interactive docs at `http://127.0.0.1:8000/docs`).

## How the AI works

For each spending category with at least 6 expenses, an Isolation Forest (scikit-learn) learns the normal amount range. An expense is reported only if the model flags it **and** it is at least 2x the category median (4x = "High"). This avoids false alarms for small differences. Only id, date, amount, category and description are sent to the AI service.

## Tests

```bash
cd server && npm test            # unit tests
cd server && npm run smoke       # end-to-end check of a running API (needs MongoDB; AI checks skipped if AI service is off)
cd ml-service && python -m unittest discover -s tests -v
```

## Security notes

- Passwords hashed with bcrypt; JWT signed with a required strong secret
- Every database query is filtered by the logged-in user's id
- Input validated with express-validator; request body limited to 10 KB; helmet headers; CORS limited to `CLIENT_URL`; rate limits on login and AI routes
- Search text is regex-escaped; CSV export guards against spreadsheet formula injection
- Known trade-off: the token is stored in `localStorage` (simple, but exposed if the site has an XSS bug). A production app could use httpOnly cookies
- Keep the AI service private (it has no login); only the API should reach it

## Deployment

1. **Database:** create a free MongoDB Atlas cluster, add a database user, allow the host's IP (or `0.0.0.0/0` for a demo), copy the connection string into `MONGO_URI`.
2. **AI service** (Render / Railway / any Python host): root `ml-service`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Prefer a private/internal network address.
3. **API** (Render / Railway): root `server`, build `npm install`, start `npm start`. Set `NODE_ENV=production`, `MONGO_URI`, a **new** `JWT_SECRET`, `CLIENT_URL` (your website's exact URL), `ML_SERVICE_URL`. Do not run `npm run seed` in production.
4. **Website** (Vercel / Netlify): root `client`, build `npm run build`, output `dist`. Set `VITE_API_URL` to `https://<your-api>/api`. Add a rewrite of all paths to `/index.html` so page refreshes work with React Router.
5. Open `https://<your-api>/api/health` to confirm the database shows "connected", then register a real account in the deployed site.

Free hosting tiers sleep when idle, so the first request after a pause can take about 30 seconds.

## Project structure

```
client/      React app (pages, components, Redux slices in features/, API helper in api/)
server/      Express app (routes, controllers, models, middleware, utils, seed.js, tests)
ml-service/  FastAPI app (main.py), detector.py (ML logic), tests
```

## Troubleshooting

- **"MONGO_URI is missing"**: run `node scripts/make-env.js` inside `server`.
- **Port already in use**: double-click `stop.bat`, then `start.bat`.
- **"Cannot reach the server"**: the API window is not running, or the website address is not listed in `CLIENT_URL`.
- **"The AI service is not running"**: start the AI window (`start.bat` does it).
