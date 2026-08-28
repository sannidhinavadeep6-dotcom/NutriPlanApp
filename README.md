# 🥗 NutriPlan — Full-Stack Edition

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
├── backend/                 Python 3 · Flask · SQLAlchemy · SQLite
│   ├── app.py               REST API + JWT auth + serves the built Angular app
│   ├── models.py            SQL models: users, goals, foods, recipes, ingredients,
│   │                        plan_entries, grocery_checks, grocery_extras
│   ├── nutrition.py         unit conversion, food matching, macro math
│   ├── parser.py            "1 1/2 cups rice" → structured ingredient
│   ├── food_data.py         171-food nutrition database (USDA-style reference)
│   ├── seed.py              first-run seeding (admin, demo user, foods, recipes)
│   ├── requirements.txt
│   ├── static/              ← pre-built Angular bundle (served by Flask)
│   └── nutriplan.db         SQLite database (auto-created on first run)
└── frontend/                Angular 20 (standalone components, signals, new control flow)
    └── src/app/
        ├── core/            auth service, JWT interceptor, guards, API client, models
        └── pages/
            ├── login/       login + "request access" (registration)
            ├── shell/       app top bar, role-aware navigation, logout
            ├── today/       today's calorie & macro analysis vs goals
            ├── recipes/     recipe builder, paste-parser, portion scaler
            ├── calendar/    weekly meal planner (breakfast/lunch/dinner/snacks)
            ├── grocery/     auto-generated, aisle-grouped shopping list
            ├── goals/       targets, TDEE calculator, custom foods
            └── admin/       admin portal: approvals, user management, stats
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

- **"Could not open requirements file"?** You're in the wrong folder — it's at `backend/requirements.txt`. Or skip all of that and run `python start.py` from the project root.
- Nutrition values are estimates from public reference data (USDA averages); not for medical use.
- SQLite file lives at `backend/nutriplan.db`; delete it to re-seed from scratch.
- JWT secret auto-generates into `backend/jwt_secret.key` on first run — keep it private and stable across restarts.
- For production, run behind a real WSGI server (e.g. `gunicorn "app.app"`), use HTTPS, and change default credentials.
