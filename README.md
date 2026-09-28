# 🥗 NutriPlan — Full-Stack Edition

Public Link:https://nutriplanapp.onrender.com/login

**Angular frontend · Python (Flask) backend · SQLite (SQL) database · JWT login · Admin portal with user approval**

A recipe planner & calorie analyzer where **access is controlled by an administrator**: new users request access on the login page, an admin approves them from the Admin Portal, and only then can they sign in.

---

## 🚀 Run it

### Easiest way (recommended)

| Your system | Do this |
|---|---|
| **Windows** | double-click **`run.bat`** |
| **Mac / Linux** | double-click **`run.sh`** (or run `bash run.sh`) |
| Any system | `python start.py` |

The launcher checks Python, **installs dependencies automatically the first time**, starts the server, and prints the login credentials. Then open **http://localhost:8000**.

> `start.py` works no matter which folder you run it from — you never need to hunt for `requirements.txt`.

### Manual way (if you prefer)

```bash
# NOTE: requirements.txt is inside the backend/ folder!
cd backend
pip install -r requirements.txt
python app.py
# → open http://localhost:8000
```

(A root-level `requirements.txt` is also provided, so `pip install -r requirements.txt` works from the project root too.)

The `backend/static/` folder already contains the **pre-built Angular app**, so no Node.js is needed to run it.

### Rebuilding the frontend (only if you change Angular code)

```bash
cd frontend
npm install
npm run build
cp -r dist/frontend/browser/* ../backend/static/
```

### Development mode (hot reload)

```bash
cd backend && python3 app.py        # API on :8000
cd frontend && npm start            # Angular dev server on :4200 (proxies nothing; CORS is enabled)
```

### 📱 Android & iOS Mobile Apps

NutriPlan includes native Android and iOS mobile app projects:

```bash
cd frontend
npm run cap:build       # Compile Angular & sync into native Android/iOS folders
npm run cap:android     # Open in Android Studio
npm run cap:ios         # Open in Xcode (macOS)
```

> See [MOBILE_GUIDE.md](MOBILE_GUIDE.md) for full instructions on running in Android Studio, Xcode, mobile emulators, and local Wi-Fi backend connection.

## 🔑 Default accounts (first run only)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@nutriplan.app` | `Admin@123` |
| **User (demo data)** | `demo@nutriplan.app` | `Demo@123` |

> ⚠️ Change the admin password immediately in a real deployment (an admin can reset passwords from the Admin Portal).

## 🔐 How access control works

1. A visitor opens the app → **login page** (no app access without an account).
2. They click **“Request access”** and submit name / email / password → account is created with status `pending`.
3. Pending users **cannot log in** (“awaiting admin approval”).
4. An admin signs in → **🛡️ Admin Portal** (red badge shows pending requests) → **✓ Approve**.
5. The user can now sign in. Admins can also **disable**, **re-enable**, **delete** users, **reset passwords**, **promote to admin**, or **create users directly**.

## 🏗️ Architecture

```
NutriPlanApp/
├── database/                SQLite database, SQLAlchemy models, and seeders
│   ├── __init__.py          Database package exports & path helpers
│   ├── models.py            SQL models: User, Goal, Food, Recipe, Ingredient, PlanEntry, etc.
│   ├── food_data.py         Food nutrition database & categories
│   ├── seed_recipes.py      Pre-seeded 100+ recipe database
│   ├── seed.py              Database initialization & seeding logic
│   └── nutriplan.db         SQLite database file
│
├── backend/                 Python 3 · Flask REST API & services
│   ├── app.py               REST API + JWT auth + serves built frontend
│   ├── nutrition.py         Unit conversion, food matching & macro calculations
│   ├── parser.py            NLP ingredient string parser
│   ├── start.py             Server & tunnel launcher
│   ├── requirements.txt     Python dependencies
│   ├── static/              Built frontend distribution files
│   └── docs/                Research papers & technical documentation
│
└── frontend/                Angular 20 / Capacitor Mobile Client
    └── src/app/
        ├── core/            Auth service, JWT interceptor, guards, API client, models
        └── pages/           Login, Shell, Today, Recipes, Calendar, Grocery, Goals, Admin
```

## 🔌 API overview (`/api/…`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` |
| Foods | `GET /foods?q=` · `GET /foods/mine` · `POST /foods` · `DELETE /foods/:id` |
| Parser | `POST /parse` (paste lines → matched ingredients) |
| Recipes | `GET/POST /recipes` · `GET/PUT/DELETE /recipes/:id` |
| Planner | `GET /plan` · `POST /plan/entries` · `PATCH/DELETE /plan/entries/:id` · `GET /plan/day/:d` · `GET /plan/week` |
| Goals | `GET/PUT /goals` |
| Grocery | `GET /grocery` · `POST /grocery/check` · `POST/DELETE /grocery/extras` |
| Admin | `GET /admin/stats` · `GET/POST /admin/users` · `POST /admin/users/:id/status` · `…/password` · `…/role` · `DELETE /admin/users/:id` |

All app endpoints require a `Authorization: Bearer <JWT>` header; admin endpoints additionally require the admin role. Users only ever see their own recipes, plans and goals.

## ✨ Features

- **Recipe Builder** — ingredient rows with live database autocomplete, or paste a whole ingredient list (`1 1/2 cups basmati rice`, `100g chicken`, `salt to taste`) parsed on the server.
- **Portion Scaler** — preview any recipe scaled to any serving count.
- **Weekly Calendar** — Mon–Sun × breakfast/lunch/dinner/snacks with per-entry serving steppers.
- **Calorie Analyzer** — per-meal & per-day totals, macro bars, kcal ↔ kJ toggle, goal comparison.
- **Grocery List** — generated from the week's plan, grouped by aisle, scaled amounts, checkable, copy & print.
- **Goals & TDEE** — Mifflin-St Jeor calculator with one-click apply, macro split presets, custom foods.
- **Admin Portal** — approvals, enable/disable, password resets, roles, direct user creation, platform stats.

## 📝 Notes

- SQLite file lives at `database/nutriplan.db`; delete it to re-seed from scratch.
- JWT secret auto-generates into `backend/jwt_secret.key` on first run — keep it private and stable across restarts.
- For production, run behind a real WSGI server (e.g. `gunicorn "app.app"`), use HTTPS, and change default credentials.
